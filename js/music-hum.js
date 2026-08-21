// js/music-hum.js
// 「ハミングから作る」：録音またはアップロードした鼻歌から、Basic Pitch
// （Spotifyが公開しているオープンソースのピッチ検出モデル、TensorFlow.js版）を
// 使って音の高さ・発音タイミングを検出し、譜面（tokens）に自動変換する。
//
// TensorFlow.js本体とBasic Pitchのモデルはサイズが大きく、常時読み込むと
// エディター本体のオフライン起動が遅くなるため、この機能を実際に開いたときだけ
// CDNから遅延読み込みする（＝「ログイン不要・オフラインでも動く」というエディター
// 本体の価値はそのまま保たれる。この機能自体はネットワーク接続が必要）。
//
// 変換の要：検出したメロディの音域を、今選んでいる楽器・配置（例：ピアノ15鍵）が
// 実際に鳴らせる音域にオクターブ単位でまるごとシフトしてから、その楽器で実際に
// 選べる音（黒鍵の無い配置なら自然音だけ、など）に音ごとスナップする。
// キーの移動を利用者任せにせず自動で合わせるこの処理が、参考にした他アプリ
// （SkyScores等）との差別化ポイントになる。
//
// 【変換パイプラインの全体像】
// Basic Pitchの生ノート列は、1つの音を複数の断片に分割していたり、ビブラートを
// 別音程として検出していたりと「そのまま譜面化するには荒すぎる」状態のため、
// 以下の段階を経てからゲーム内音階へ変換する（各段階は音声処理を伴わない
// 純粋関数として実装しており、Node上でも単体テストできる）。
//
//   生ノート列
//   → normalizeHumNoteEvents（同時発音の統合・同一音の断片統合・不安定クラスターの統合・
//                             ビブラート吸収・ノイズ除去）
//   → quantizeHumRhythm（曲全体で共有する拍グリッドへ開始位置を揃え、休符を判定）
//   → mapHumMelodyToInstrument（オクターブシフト＋前後の音との関係を考慮したゲーム内音への変換）
//   → tokens
//
// DEBUG_HUM_ANALYSIS を true にすると、上記の各段階（生データ／正規化後／量子化後／
// 変換後）をconsoleへ出力できる（調査用。通常利用時はfalseのままにする）
const DEBUG_HUM_ANALYSIS = false;

// ── 音高変換（ここから下は音声処理を伴わない純粋な計算のみで、Node上でも単体テストできる） ──

// 度数・臨時記号・オクターブの組から絶対MIDI番号を求める（60 = 度数1・オクターブ0 = middle C相当）
function humNoteToMidi(note) {
  const semis = DEGREE_SEMITONES[note.degree] + (ACCIDENTAL_SEMITONE_OFFSET[note.accidental] || 0);
  return 60 + semis + note.octave * 12;
}

// 楽器・配置(layout)が実際に鳴らせる音の一覧を、MIDI番号の昇順で返す
// （22キーはchromaticGridも含めて半音まで対象にする。それ以外は自然音のみのgridで十分）
function buildHumInstrumentNoteMap(layout) {
  const grids = [layout.grid];
  if (layout.chromaticGrid) grids.push(layout.chromaticGrid);
  const byMidi = new Map();
  grids.forEach((rows) => {
    rows.forEach((row) => {
      row.forEach((note) => {
        const midi = humNoteToMidi(note);
        if (!byMidi.has(midi)) byMidi.set(midi, note);
      });
    });
  });
  return Array.from(byMidi.entries())
    .map(([midi, note]) => ({ midi, note }))
    .sort((a, b) => a.midi - b.midi);
}

// 検出したメロディ全体が、楽器の音域になるべく多く・自然に収まるオクターブシフト量
// （12半音刻み）を求める。音域の中心同士を合わせる案を基準に、その前後のオクターブも
// 試して「音域に収まる音の数」→「楽器の実際の音への距離の合計」の順で最も良いものを選ぶ
// （範囲の広い曲と狭い曲を同じ扱いにしない）
function computeHumOctaveShift(detectedMidis, availableNotes) {
  if (!detectedMidis.length || !availableNotes.length) return 0;
  const melodyMin = Math.min(...detectedMidis);
  const melodyMax = Math.max(...detectedMidis);
  const melodyCenter = (melodyMin + melodyMax) / 2;
  const instMin = availableNotes[0].midi;
  const instMax = availableNotes[availableNotes.length - 1].midi;
  const instCenter = (instMin + instMax) / 2;
  const centerShift = Math.round((instCenter - melodyCenter) / 12) * 12;

  const candidateShifts = new Set([centerShift - 24, centerShift - 12, centerShift, centerShift + 12, centerShift + 24]);
  let bestShift = centerShift;
  let bestScore = Infinity;
  candidateShifts.forEach((shift) => {
    let inRangeCount = 0;
    let totalDistance = 0;
    detectedMidis.forEach((midi) => {
      const shifted = midi + shift;
      if (shifted >= instMin && shifted <= instMax) inRangeCount++;
      let nearest = Infinity;
      availableNotes.forEach((entry) => {
        const d = Math.abs(entry.midi - shifted);
        if (d < nearest) nearest = d;
      });
      totalDistance += nearest;
    });
    // 音域に収まる音の数を最優先し、同数なら実音への距離の合計が小さい方を選ぶ
    const score = (detectedMidis.length - inRangeCount) * 100 + totalDistance;
    if (score < bestScore) {
      bestScore = score;
      bestShift = shift;
    }
  });
  return bestShift;
}

// ほぼ同時刻に鳴っている複数の検出（倍音・ハモりの誤検出の可能性）のうち、
// 単旋律を想定して最も長く鳴っている1音だけを残す（Basic Pitchはポリフォニー対応の
// モデルのため、鼻歌のような単旋律入力でも倍音等を別音として拾うことがある）
function collapseSimultaneousHumNoteEvents(sortedEvents, opts) {
  const options = opts || {};
  const simulEpsilonSec = options.simulEpsilonSec != null ? options.simulEpsilonSec : 0.03;
  const result = [];
  sortedEvents.forEach((ev) => {
    const last = result[result.length - 1];
    if (last && Math.abs(ev.startTimeSeconds - last.startTimeSeconds) <= simulEpsilonSec) {
      if (ev.durationSeconds > last.durationSeconds) {
        result[result.length - 1] = { pitchMidi: ev.pitchMidi, startTimeSeconds: ev.startTimeSeconds, durationSeconds: ev.durationSeconds };
      }
      return;
    }
    result.push({ pitchMidi: ev.pitchMidi, startTimeSeconds: ev.startTimeSeconds, durationSeconds: ev.durationSeconds });
  });
  return result;
}

// Basic Pitchが同じ音を細かい断片に分割して検出した場合（例：C4が0.18秒刻みで
// 4つに分かれて検出される等）、それらを1つの音へ統合する。
// 「隙間がほぼ無い（=検出の継ぎ目）」場合だけを統合対象とすることで、実際に
// 人が意図して同じ音を弾き直した「ド ド ド」のような明確なリズムの連打
// （音と音の間に実際の無音・区切りがある）とは区別する
function mergeHumNoteEvents(sortedEvents, opts) {
  const options = opts || {};
  const semitoneTolerance = options.semitoneTolerance != null ? options.semitoneTolerance : 0.6;
  const maxGapSec = options.maxGapSec != null ? options.maxGapSec : 0.04;

  const merged = [];
  sortedEvents.forEach((ev) => {
    const last = merged[merged.length - 1];
    if (last) {
      const gap = ev.startTimeSeconds - (last.startTimeSeconds + last.durationSeconds);
      const pitchDiff = Math.abs(ev.pitchMidi - last.pitchMidi);
      if (gap <= maxGapSec && pitchDiff <= semitoneTolerance) {
        const newEnd = Math.max(last.startTimeSeconds + last.durationSeconds, ev.startTimeSeconds + ev.durationSeconds);
        // 長く鳴っていた方の断片のピッチを採用する（短い断片は検出のブレの可能性が高い）
        if (ev.durationSeconds > last._sourceMaxDur) last.pitchMidi = ev.pitchMidi;
        last._sourceMaxDur = Math.max(last._sourceMaxDur, ev.durationSeconds);
        last.durationSeconds = newEnd - last.startTimeSeconds;
        return;
      }
    }
    merged.push({ pitchMidi: ev.pitchMidi, startTimeSeconds: ev.startTimeSeconds, durationSeconds: ev.durationSeconds, _sourceMaxDur: ev.durationSeconds });
  });
  return merged.map(({ pitchMidi, startTimeSeconds, durationSeconds }) => ({ pitchMidi, startTimeSeconds, durationSeconds }));
}

// mergeHumNoteEvents（隣接ペアが0.6半音以内でないと統合しない）や
// suppressPitchWobbleEvents（前後がちょうど同じ音程に戻る場合しか吸収しない）では
// 拾いきれない、声が2つ以上の近い音程の間を細かく往復する不安定な区間
// （グライド・ビブラート・息継ぎ等で実際に起こる）を1つの音へ統合する。
// 「短い断片が」「隙間なく連続し」「全体としては狭い音程帯に収まっている」かつ
// 「上下に往復している（一方向に進み続けていない）」塊だけを対象にすることで、
// 以下と区別する。
//   - 実際に間隔をあけて弾き直した同音連打（隙間が大きいので対象外）
//   - 速いスケール走句のような正当な連続音（一方向に進み続けるため対象外。
//     半音刻みの速い動きは狭い音程帯にも収まりうるが、往復ではなく一方向の
//     進行なので、音程帯の広さだけでは正しく区別できない）
function consolidateUnstablePitchClusters(events, opts) {
  const options = opts || {};
  const shortFragmentSec = options.shortFragmentSec != null ? options.shortFragmentSec : 0.15;
  const maxClusterGapSec = options.maxClusterGapSec != null ? options.maxClusterGapSec : 0.06;
  const maxClusterRangeSemitones = options.maxClusterRangeSemitones != null ? options.maxClusterRangeSemitones : 3;
  const minClusterSize = options.minClusterSize != null ? options.minClusterSize : 3;

  // 隣接する断片同士の音程差の符号に、上昇と下降の両方が含まれるかどうかを見る。
  // 一方向にしか進まない(単調増加/単調減少)場合は、速いスケール走句等の正当な
  // メロディの可能性が高いため統合の対象から外す
  const hasDirectionReversal = (pitches) => {
    let sawUp = false;
    let sawDown = false;
    for (let i = 1; i < pitches.length; i++) {
      const diff = pitches[i] - pitches[i - 1];
      if (diff > 0.05) sawUp = true;
      else if (diff < -0.05) sawDown = true;
    }
    return sawUp && sawDown;
  };

  const result = [];
  let cluster = [];

  const flushCluster = () => {
    if (!cluster.length) return;
    const eligible = cluster.length >= minClusterSize && hasDirectionReversal(cluster.map((e) => e.pitchMidi));
    if (!eligible) {
      cluster.forEach((e) => result.push(e));
    } else {
      const start = cluster[0].startTimeSeconds;
      const last = cluster[cluster.length - 1];
      const end = last.startTimeSeconds + last.durationSeconds;
      const totalDur = cluster.reduce((s, e) => s + e.durationSeconds, 0);
      // 各断片の長さで重み付けした平均音程を、実際に歌っていたであろう音とみなす
      const weightedPitch = cluster.reduce((s, e) => s + e.pitchMidi * e.durationSeconds, 0) / totalDur;
      result.push({ pitchMidi: weightedPitch, startTimeSeconds: start, durationSeconds: end - start });
    }
    cluster = [];
  };

  events.forEach((ev) => {
    if (ev.durationSeconds > shortFragmentSec) {
      flushCluster();
      result.push(ev);
      return;
    }
    if (!cluster.length) {
      cluster.push(ev);
      return;
    }
    const prev = cluster[cluster.length - 1];
    const gap = ev.startTimeSeconds - (prev.startTimeSeconds + prev.durationSeconds);
    const pitches = cluster.map((e) => e.pitchMidi).concat(ev.pitchMidi);
    const range = Math.max(...pitches) - Math.min(...pitches);
    if (gap <= maxClusterGapSec && range <= maxClusterRangeSemitones) {
      cluster.push(ev);
    } else {
      flushCluster();
      cluster.push(ev);
    }
  });
  flushCluster();
  return result;
}

// 歌声のビブラートやピッチの揺れで、ロングトーンの途中に一瞬だけ別音程が
// 検出された場合、それを別音符にせず前後の音へ吸収する。
// 「短時間だけ現れ」「前後の音とほぼ同じ音程で」「かつ前後の音が同じ音程に戻る
// （山型に戻ってくる）」場合だけを対象とすることで、実際のメロディの経過音・
// 装飾音（別の音へ進んでいくもの）は変更しない。
// 前後が同じ音程に戻るということは、揺れの前後は本来1つの続いた音であるため、
// 揺れの音だけでなく後ろの音も直前の音へまとめて統合する（統合後に隙間なく
// 同音程の音が2つ並んで残ってしまうのを避けるため）
function suppressPitchWobbleEvents(events, opts) {
  const options = opts || {};
  const maxWobbleDurationSec = options.maxWobbleDurationSec != null ? options.maxWobbleDurationSec : 0.12;
  const relativeFactor = options.relativeFactor != null ? options.relativeFactor : 0.35;
  const semitoneTolerance = options.semitoneTolerance != null ? options.semitoneTolerance : 2;

  if (events.length < 3) return events.map((e) => ({ ...e }));

  const result = [];
  let i = 0;
  while (i < events.length) {
    const prev = result[result.length - 1];
    const cur = events[i];
    const next = i + 1 < events.length ? events[i + 1] : null;
    if (prev && next) {
      const isShort = cur.durationSeconds <= maxWobbleDurationSec && cur.durationSeconds <= relativeFactor * Math.min(prev.durationSeconds, next.durationSeconds);
      const closeToPrev = Math.abs(cur.pitchMidi - prev.pitchMidi) <= semitoneTolerance;
      const closeToNext = Math.abs(cur.pitchMidi - next.pitchMidi) <= semitoneTolerance;
      const bumpReturnsToSamePitch = Math.round(prev.pitchMidi) === Math.round(next.pitchMidi);
      if (isShort && closeToPrev && closeToNext && bumpReturnsToSamePitch) {
        // 揺れの前後は本来1つの音なので、揺れとその後ろの音をまとめて直前の音へ吸収する
        prev.durationSeconds = next.startTimeSeconds + next.durationSeconds - prev.startTimeSeconds;
        i += 2;
        continue;
      }
    }
    result.push({ ...cur });
    i++;
  }
  return result;
}

// 曲のテンポ（BPM）から見て極端に短すぎる検出はノイズとみなして除外する。
// 固定値ではなく1拍の長さに対する割合で決めることで、速い曲の短い正規音符まで
// 消してしまわないようにする（ただし極端な値にならないよう上下限を設ける）
function filterHumNoiseEvents(events, bpmValue, opts) {
  const options = opts || {};
  const beatSec = 60 / bpmValue;
  const floorSec = options.minDurationFloorSec != null ? options.minDurationFloorSec : 0.035;
  const ceilSec = options.minDurationCeilSec != null ? options.minDurationCeilSec : 0.09;
  const beatFraction = options.minDurationBeatFraction != null ? options.minDurationBeatFraction : 0.12;
  const minDurationSec = Math.min(ceilSec, Math.max(floorSec, beatSec * beatFraction));
  return events.filter((e) => e.durationSeconds >= minDurationSec);
}

// Basic Pitchの生ノート列[{pitchMidi, startTimeSeconds, durationSeconds}, ...]を、
// 上記の各段階（同時発音の統合→同一音の断片統合→不安定クラスターの統合→
// ビブラート吸収→ノイズ除去）にかけて整える
function normalizeHumNoteEvents(rawEvents, bpmValue, opts) {
  const options = opts || {};
  const sorted = rawEvents.slice().sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
  const collapsed = collapseSimultaneousHumNoteEvents(sorted, options.simultaneous);
  const merged = mergeHumNoteEvents(collapsed, options.merge);
  const clustered = consolidateUnstablePitchClusters(merged, options.cluster);
  const wobbleSuppressed = suppressPitchWobbleEvents(clustered, options.wobble);
  return filterHumNoiseEvents(wobbleSuppressed, bpmValue, options.noise);
}

// 整えたノート列の発音開始位置を、曲全体で共有する1つの拍グリッド（既定では
// 16分音符＝0.25拍刻み。手動編集で選べる最短の音価と合わせている）へスナップし、
// 音符ごとに独立して丸めることで生じるリズムのズレの蓄積を防ぐ。
// 次の音との間隔が十分あれば休符を挟み、そうでなければこの音の長さを次の音の
// 開始位置まで伸ばして隙間なくつなげる（Basic Pitchの検出の途切れを休符に
// してしまわないようにするため）。
// 戻り値は [{midi, beats}, ...]（休符はmidi:null）で、まだゲーム内音への
// 変換はしていない（それはmapHumMelodyToInstrumentの役目）
function quantizeHumRhythm(events, bpmValue, opts) {
  const options = opts || {};
  if (!events.length) return [];
  const beatSec = 60 / bpmValue;
  const gridUnit = options.gridUnit != null ? options.gridUnit : 0.25;
  const restGapBeats = options.restGapBeats != null ? options.restGapBeats : 0.3;

  const toBeat = (sec) => sec / beatSec;
  const snapToGrid = (beat) => Math.round(beat / gridUnit) * gridUnit;

  const starts = events.map((e) => snapToGrid(toBeat(e.startTimeSeconds)));
  const ownEnds = events.map((e, i) => Math.max(starts[i] + gridUnit, snapToGrid(toBeat(e.startTimeSeconds + e.durationSeconds))));

  const result = [];
  events.forEach((e, i) => {
    const nextStart = i + 1 < events.length ? starts[i + 1] : null;
    const gapAfter = nextStart == null ? null : nextStart - ownEnds[i];
    const isRestAfter = gapAfter != null && gapAfter >= restGapBeats;
    const lengthBeats = !isRestAfter && nextStart != null ? Math.max(gridUnit, nextStart - starts[i]) : Math.max(gridUnit, ownEnds[i] - starts[i]);

    result.push({ midi: e.pitchMidi, beats: snapBeatsToPreset(lengthBeats) });
    if (isRestAfter) {
      result.push({ midi: null, beats: snapBeatsToPreset(gapAfter) });
    }
  });
  return result;
}

// 指定したMIDI番号に対して、楽器で実際に選べる音の中から「距離の近さ」を主軸に、
// 直前・直後の検出音との上がる/下がるの関係（輪郭）が食い違う候補にはわずかな
// ペナルティを加えて選ぶ。距離がはっきり近い候補があればそれを優先し、僅差の
// ときだけ輪郭を優先する（ゲームに存在しない音を、前後関係を無視した単純な
// 最近傍だけで決めないようにするため）
function pickClosestHumNoteWithContour(midi, availableNotes, ctx) {
  const context = ctx || {};
  let best = null;
  let bestScore = Infinity;
  availableNotes.forEach((entry) => {
    let score = Math.abs(entry.midi - midi);
    if (context.prevMappedMidi != null && context.prevShiftedMidi != null) {
      const detectedDir = Math.sign(midi - context.prevShiftedMidi);
      const candidateDir = Math.sign(entry.midi - context.prevMappedMidi);
      if (detectedDir !== 0 && candidateDir !== 0 && detectedDir !== candidateDir) score += 0.9;
    }
    if (context.nextShiftedMidi != null) {
      const detectedDirNext = Math.sign(context.nextShiftedMidi - midi);
      const candidateDirNext = Math.sign(context.nextShiftedMidi - entry.midi);
      if (detectedDirNext !== 0 && candidateDirNext !== 0 && detectedDirNext !== candidateDirNext) score += 0.4;
    }
    if (score < bestScore) {
      bestScore = score;
      best = entry;
    }
  });
  return best.note;
}

// quantizeHumRhythmが返した[{midi, beats}, ...]（休符はmidi:null）を、
// 楽器の音域へのオクターブシフト＋前後関係を考慮したゲーム内音への変換を経て
// tokens形式（[{notes:[{degree,accidental,octave}], beats}, ...]）にする。
// 休符を挟むとメロディの輪郭比較はいったんリセットする（休符の前後は別フレーズ
// とみなす）。changesには実際に「検出音そのままの音」から変更が生じた音を
// 記録し、開発時の確認用ログにのみ使う
function mapHumMelodyToInstrument(events, layout, opts) {
  const availableNotes = buildHumInstrumentNoteMap(layout);
  if (!availableNotes.length) return { tokens: events.map((e) => ({ notes: [], beats: e.beats })), changes: [], octaveShift: 0 };

  const detectedMidis = events.filter((e) => e.midi != null).map((e) => Math.round(e.midi));
  const shift = computeHumOctaveShift(detectedMidis, availableNotes);

  const tokens = [];
  const changes = [];
  const rawShiftedMidis = []; // 各tokenに対応する「シフト後・ゲーム内音へスナップする前」のMIDI(休符はnull)。後段の最適化層が参照する
  let prevMappedMidi = null;
  let prevShiftedMidi = null;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.midi == null) {
      tokens.push({ notes: [], beats: e.beats });
      rawShiftedMidis.push(null);
      prevMappedMidi = null;
      prevShiftedMidi = null;
      continue;
    }
    const shiftedMidi = Math.round(e.midi) + shift;
    let nextShiftedMidi = null;
    for (let j = i + 1; j < events.length; j++) {
      if (events[j].midi != null) {
        nextShiftedMidi = Math.round(events[j].midi) + shift;
        break;
      }
    }
    const chosen = pickClosestHumNoteWithContour(shiftedMidi, availableNotes, { prevShiftedMidi, prevMappedMidi, nextShiftedMidi });
    const chosenMidi = humNoteToMidi(chosen);
    tokens.push({ notes: [{ degree: chosen.degree, accidental: chosen.accidental || null, octave: chosen.octave }], beats: e.beats });
    rawShiftedMidis.push(shiftedMidi);
    if (chosenMidi !== shiftedMidi) changes.push({ index: i, fromMidi: shiftedMidi, toMidi: chosenMidi });
    prevMappedMidi = chosenMidi;
    prevShiftedMidi = shiftedMidi;
  }
  return { tokens, changes, octaveShift: shift, rawShiftedMidis };
}

// ── Heartopia Melody Optimizer ──────────────────────────────────────────
// mapHumMelodyToInstrumentは前後1音までしか見ておらず、狭い帯域の細かい
// ピッチの揺れはnormalizeHumNoteEvents側のconsolidateUnstablePitchClustersで
// 既に吸収済みだが、由来の異なる複数の実音（本来別々の音程）が、ゲーム内
// 音への変換時にたまたま同じ1音へ衝突してしまうケースまでは防げない。
// この層は、そうした「マッピング後に生じた異常な同音連打」を検出したときだけ、
// 前後2音まで見た広いコンテキスト（輪郭・音程差の形）で候補を再評価する。
// あわせて、休符や長い音で区切られた「フレーズ」が曲中に繰り返し出現する
// 場合、初出時の変換結果を後続の同じ音程パターンにも適用し、同じフレーズ
// なのに変換結果がバラつくことを防ぐ。
//
// リズム(beats)は一切変更しない。convertHumNotesToTokens内で一度だけ、
// mapHumMelodyToInstrumentの直後に呼ばれる（二重に最適化がかかることはない）

// 指定インデックスの「輪郭比較用の参照点」を求める。processedUpTo以前は
// このパスで既に確定した音（result側のマッピング後MIDI）を、それより先は
// まだ確定していない同じ塊の内部なので生データ側のシフト後MIDIを代わりに使う
function heartopiaNeighborContext(idx, result, rawShiftedMidis, processedUpTo) {
  if (idx < 0 || idx >= result.length) return { raw: null, mapped: null };
  const raw = rawShiftedMidis[idx];
  if (raw == null) return { raw: null, mapped: null }; // 休符をまたいだ先は参照しない
  const mapped = idx <= processedUpTo && result[idx].notes.length ? humNoteToMidi(result[idx].notes[0]) : raw;
  return { raw, mapped };
}

// 候補音1つのスコアを計算する。距離を主軸に、直前・直後それぞれ1音・2音先まで
// 見た輪郭（上昇/下降）の食い違いと、直前の音との音程差の形の違いにペナルティを
// 加える（2音先・音程差の形は、直前1音の輪郭より弱い重みとする）
function scoreHeartopiaCandidate(candidateMidi, targetMidi, prev2, prev1, next1, next2) {
  let score = Math.abs(candidateMidi - targetMidi);
  if (prev1.mapped != null && prev1.raw != null) {
    const detectedDir = Math.sign(targetMidi - prev1.raw);
    const candidateDir = Math.sign(candidateMidi - prev1.mapped);
    if (detectedDir !== 0 && candidateDir !== 0 && detectedDir !== candidateDir) score += 0.9;
    const detectedInterval = targetMidi - prev1.raw;
    const candidateInterval = candidateMidi - prev1.mapped;
    score += Math.abs(detectedInterval - candidateInterval) * 0.15;
  }
  if (next1.mapped != null && next1.raw != null) {
    const detectedDirNext = Math.sign(next1.raw - targetMidi);
    const candidateDirNext = Math.sign(next1.mapped - candidateMidi);
    if (detectedDirNext !== 0 && candidateDirNext !== 0 && detectedDirNext !== candidateDirNext) score += 0.4;
  }
  if (prev2.mapped != null && prev2.raw != null) {
    const detectedDir2 = Math.sign(targetMidi - prev2.raw);
    const candidateDir2 = Math.sign(candidateMidi - prev2.mapped);
    if (detectedDir2 !== 0 && candidateDir2 !== 0 && detectedDir2 !== candidateDir2) score += 0.3;
  }
  if (next2.mapped != null && next2.raw != null) {
    const detectedDir2Next = Math.sign(next2.raw - targetMidi);
    const candidateDir2Next = Math.sign(next2.mapped - candidateMidi);
    if (detectedDir2Next !== 0 && candidateDir2Next !== 0 && detectedDir2Next !== candidateDir2Next) score += 0.2;
  }
  return score;
}

// インデックスkの音を、前後2音までの広いコンテキストで再評価し、最も自然な
// ゲーム内音を返す。スコアがほぼ同点の候補が複数ある場合（例：狭い音階配置で
// 元の音がちょうど2つの使用可能音の中間にあるようなケース）、単純に距離が
// 小さい方を機械的に選ぶと直前の音への「不自然な連打」を増やしやすいため、
// 同点内で直前の音と異なる候補があればそちらを優先する
function resolveHeartopiaNoteWithWideContext(k, result, rawShiftedMidis, availableNotes) {
  const targetMidi = rawShiftedMidis[k];
  if (targetMidi == null) return null;
  const prev1 = heartopiaNeighborContext(k - 1, result, rawShiftedMidis, k - 1);
  const prev2 = heartopiaNeighborContext(k - 2, result, rawShiftedMidis, k - 1);
  const next1 = heartopiaNeighborContext(k + 1, result, rawShiftedMidis, k - 1);
  const next2 = heartopiaNeighborContext(k + 2, result, rawShiftedMidis, k - 1);

  const scored = availableNotes
    .map((entry) => ({ entry, score: scoreHeartopiaCandidate(entry.midi, targetMidi, prev2, prev1, next1, next2) }))
    .sort((a, b) => a.score - b.score);
  if (!scored.length) return null;

  const tieEpsilon = 0.05;
  const tied = scored.filter((s) => s.score - scored[0].score <= tieEpsilon);
  if (tied.length > 1 && prev1.mapped != null) {
    const differing = tied.find((s) => s.entry.midi !== prev1.mapped);
    if (differing) return differing.entry.note;
  }
  return tied[0].entry.note;
}

// mapHumMelodyToInstrumentの結果(tokens)を、休符または長い音（既定2拍以上）で
// 区切って「フレーズ」に分割する。各フレーズについて、そのインデックス列・
// 生データ側のシフト後MIDI列・現在のnotesのコピーを返す
function splitHumPhrases(result, rawShiftedMidis, opts) {
  const options = opts || {};
  const longNoteBeats = options.longNoteBeats != null ? options.longNoteBeats : 2;
  const phrases = [];
  let current = { indexes: [], rawShifted: [], notes: [] };
  const flush = () => {
    if (current.indexes.length) phrases.push(current);
    current = { indexes: [], rawShifted: [], notes: [] };
  };
  result.forEach((t, idx) => {
    if (!t.notes.length) {
      flush();
      return;
    }
    current.indexes.push(idx);
    current.rawShifted.push(rawShiftedMidis[idx]);
    current.notes.push({ ...t.notes[0] });
    if (t.beats >= longNoteBeats) flush();
  });
  flush();
  return phrases;
}

// mapHumMelodyToInstrumentが返したtokensを、上記の考え方で仕上げる。
// 戻り値のoptimizerLogは、実際に変更した音のみを{index, originalMidi,
// mappedMidi, optimizedMidi, reason}の形で記録し、開発確認用ログにのみ使う
function optimizeHumMelodyForHeartopia(tokens, rawShiftedMidis, layout, opts) {
  const options = opts || {};
  const burstMinRun = options.burstMinRun != null ? options.burstMinRun : 3;
  // 元データのシフト後MIDIがこの半音数を超えてばらけているのに最終的な音が
  // 同じ場合だけ「マッピング時の衝突による異常な連打」とみなす。人が同じ音を
  // 意図して繰り返す場合の自然なピッチのブレは概ね0.2〜0.3半音程度のため、
  // それより十分大きい0.5半音を閾値とする。狭い帯域の揺れそのものは正規化
  // 段階(consolidateUnstablePitchClusters)で既に1音へ統合済みのため、ここまで
  // 残っている同音連打は基本的に、狭い音階配置(全音・半音間隔)特有の
  // 「別々の実音が同じ1つの使用可能音へ吸着する」衝突である
  const burstOriginalSpreadSemitones = options.burstOriginalSpreadSemitones != null ? options.burstOriginalSpreadSemitones : 0.5;

  const availableNotes = buildHumInstrumentNoteMap(layout);
  const result = tokens.map((t) => ({ notes: t.notes.map((n) => ({ ...n })), beats: t.beats }));
  const optimizerLog = [];
  if (!availableNotes.length) return { tokens: result, optimizerLog };

  const mappedMidiAt = (idx) => (result[idx].notes.length ? humNoteToMidi(result[idx].notes[0]) : null);

  // ── 1. 異常な同音連打の検出と再解決 ──
  let i = 0;
  while (i < result.length) {
    if (mappedMidiAt(i) == null) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < result.length && mappedMidiAt(j + 1) === mappedMidiAt(i)) j++;
    const runLength = j - i + 1;
    if (runLength >= burstMinRun) {
      const originalSlice = rawShiftedMidis.slice(i, j + 1).filter((m) => m != null);
      const spread = originalSlice.length ? Math.max(...originalSlice) - Math.min(...originalSlice) : 0;
      if (spread > burstOriginalSpreadSemitones) {
        for (let k = i; k <= j; k++) {
          const before = mappedMidiAt(k);
          const resolved = resolveHeartopiaNoteWithWideContext(k, result, rawShiftedMidis, availableNotes);
          if (resolved && humNoteToMidi(resolved) !== before) {
            result[k].notes = [{ degree: resolved.degree, accidental: resolved.accidental || null, octave: resolved.octave }];
            optimizerLog.push({ index: k, originalMidi: rawShiftedMidis[k], mappedMidi: before, optimizedMidi: humNoteToMidi(resolved), reason: "burst-resolution" });
          }
        }
      }
    }
    i = j + 1;
  }

  // ── 2. 繰り返しフレーズの一貫性 ──
  const phrases = splitHumPhrases(result, rawShiftedMidis, options.phrase);
  const seenBySignature = new Map();
  phrases.forEach((phrase) => {
    if (phrase.rawShifted.length < 3 || phrase.rawShifted.some((m) => m == null)) return; // 短すぎるものは対象外
    const signature = phrase.rawShifted.slice(1).map((m, idx) => Math.round(m - phrase.rawShifted[idx])).join(",");
    const seen = seenBySignature.get(signature);
    if (!seen) {
      seenBySignature.set(signature, phrase);
      return;
    }
    phrase.indexes.forEach((idx, pos) => {
      const wantedNote = seen.notes[pos];
      if (!wantedNote) return;
      const isPlayable = availableNotes.some(
        (a) => a.note.degree === wantedNote.degree && (a.note.accidental || null) === (wantedNote.accidental || null) && a.note.octave === wantedNote.octave
      );
      if (!isPlayable) return;
      const before = mappedMidiAt(idx);
      const wantedMidi = humNoteToMidi(wantedNote);
      if (before !== wantedMidi) {
        result[idx].notes = [{ ...wantedNote }];
        optimizerLog.push({ index: idx, originalMidi: rawShiftedMidis[idx], mappedMidi: before, optimizedMidi: wantedMidi, reason: "phrase-consistency" });
      }
    });
  });

  return { tokens: result, optimizerLog };
}

// MIDI番号を「音名＋オクターブ」の表示用ラベルに変換する（デバッグログ専用）
function humMidiLabel(midi) {
  const rounded = Math.round(midi);
  const name = HUM_PITCH_CHROMATIC_NAMES[((rounded % 12) + 12) % 12];
  return `${name}${Math.floor(rounded / 12) - 1}`;
}

// 「中間部分から異音が混じる」等の不具合調査用。生データ／正規化後／量子化後／
// マッピング後／最適化後の5段階をconsoleに出す（[HUM-OPT]行は実際に最適化層で
// 変更が入った音のみ）。DEBUG_HUM_ANALYSISがtrueの時、またはwindow.HUM_DEBUGが
// trueの時だけ呼ばれる
function logHumAnalysisStages(rawEvents, normalized, timeline, mappedTokens, changes, octaveShift, optimizedTokens, optimizerLog) {
  console.log("=== HUM ANALYSIS ===");
  console.log(`RAW (${rawEvents.length}件)`);
  rawEvents.forEach((e) => console.log(`${e.startTimeSeconds.toFixed(2)}s  ${humMidiLabel(e.pitchMidi)}  ${e.durationSeconds.toFixed(2)}s`));
  console.log(`NORMALIZED (${normalized.length}件)`);
  normalized.forEach((e) => console.log(`${e.startTimeSeconds.toFixed(2)}s  ${humMidiLabel(e.pitchMidi)}  ${e.durationSeconds.toFixed(2)}s`));
  console.log(`QUANTIZED (${timeline.length}件)`);
  timeline.forEach((e) => console.log(e.midi == null ? `rest  ${e.beats}拍` : `${humMidiLabel(e.midi)}  ${e.beats}拍`));
  console.log(`MAPPED (オクターブシフト${octaveShift / 12}オクターブ、変更${changes.length}件)`);
  const changeByIndex = new Map(changes.map((c) => [c.index, c]));
  mappedTokens.forEach((t, i) => {
    if (!t.notes.length) {
      console.log("rest");
      return;
    }
    const change = changeByIndex.get(i);
    const label = humMidiLabel(humNoteToMidi(t.notes[0]));
    console.log(change ? `${humMidiLabel(change.fromMidi)} -> ${humMidiLabel(change.toMidi)}` : `${label} -> ${label}`);
  });
  if (optimizedTokens) {
    console.log(`OPTIMIZED (Heartopia Melody Optimizer, 変更${optimizerLog.length}件)`);
    optimizedTokens.forEach((t, i) => console.log(t.notes.length ? humMidiLabel(humNoteToMidi(t.notes[0])) : "rest"));
    optimizerLog.forEach((c) => {
      console.log(
        `[HUM-OPT] index=${c.index} original=${humMidiLabel(c.originalMidi)} mapped=${humMidiLabel(c.mappedMidi)} optimized=${humMidiLabel(c.optimizedMidi)} reason=${c.reason}`
      );
    });
  }
}

// Basic Pitchのノートイベント[{pitchMidi, startTimeSeconds, durationSeconds}, ...]を
// tokens形式（[{notes:[{degree,accidental,octave}], beats}, ...]）に変換する
// （normalizeHumNoteEvents → quantizeHumRhythm → mapHumMelodyToInstrument →
// optimizeHumMelodyForHeartopeaの4段階。最適化層はマッピング直後に一度だけ通す）
function convertHumNotesToTokens(noteEvents, layout, bpmValue, opts) {
  const options = opts || {};
  const debugEnabled = options.debug || DEBUG_HUM_ANALYSIS || (typeof window !== "undefined" && window.HUM_DEBUG);
  const normalized = normalizeHumNoteEvents(noteEvents, bpmValue, options.normalize);
  if (!normalized.length) {
    if (debugEnabled) logHumAnalysisStages(noteEvents, normalized, [], [], [], 0);
    return [];
  }

  const timeline = quantizeHumRhythm(normalized, bpmValue, options.rhythm);
  const { tokens: mappedTokens, changes, octaveShift, rawShiftedMidis } = mapHumMelodyToInstrument(timeline, layout, options.mapping);
  const { tokens, optimizerLog } = optimizeHumMelodyForHeartopia(mappedTokens, rawShiftedMidis, layout, options.optimize);

  if (debugEnabled) {
    logHumAnalysisStages(noteEvents, normalized, timeline, mappedTokens, changes, octaveShift, tokens, optimizerLog);
  }
  return tokens;
}

// ── ここから下はブラウザAPI（マイク・CDN読み込み・TensorFlow.js）に依存する部分 ──
//
// @spotify/basic-pitch（npm実パッケージを取得して仕様を確認済み）は<script>タグで
// そのまま読み込めるUMD版を配布しておらず、CommonJS/ESM形式でのみ配布されている。
// そのためscriptタグでの読み込みではなく、jsdelivrの動的ESM変換（+esm）を使って
// import()で読み込む。これにより依存の@tensorflow/tfjs（basic-pitch側のpackage.json
// が要求するバージョン）もjsdelivr側で自動的に解決されるため、tfjs本体を別途
// 読み込む必要はない
const BASIC_PITCH_ESM_URL = "https://cdn.jsdelivr.net/npm/@spotify/basic-pitch@1.0.1/+esm";
// モデル本体はbasic-pitchのnpmパッケージに同梱されており（model/model.json +
// model/group1-shard1of1.bin）、jsdelivrはnpmパッケージ内の任意のファイルパスを
// そのまま配信できるため、このURLでモデルの重みファイルまで正しく取得できる
const BASIC_PITCH_MODEL_URL = "https://cdn.jsdelivr.net/npm/@spotify/basic-pitch@1.0.1/model/model.json";
// basic-pitchのevaluateModelは、この値と異なるサンプルレートの音声を渡すと
// 例外を投げて解析全体が失敗する（「解析に失敗しました」の主な原因だった）
const BASIC_PITCH_SAMPLE_RATE = 22050;
// outputToNotesPolyの解析パラメータ（onset閾値・frame閾値・最小音符長(フレーム数)）。
// この3値が検出結果の粒度（1つの音が細かく分割されるかどうか等）に直接影響するため
// 名前付きの定数として切り出してあるが、実機の鼻歌データで比較検証できていないため、
// 値そのものは既存のまま変更していない（分割された音の統合はnormalizeHumNoteEvents側の
// 後処理で対応する）
const BASIC_PITCH_ONSET_THRESHOLD = 0.25;
const BASIC_PITCH_FRAME_THRESHOLD = 0.25;
const BASIC_PITCH_MIN_NOTE_LENGTH_FRAMES = 5;

let basicPitchLoaded = false;
let basicPitchModel = null;
let basicPitchLib = null; // { BasicPitch, outputToNotesPoly, addPitchBendsToNoteEvents, noteFramesToTime }
let humRecorder = null;
let humRecordedChunks = [];
let humRecordingStartTime = 0;
let humRecordingTimer = null;
let humSourceBlob = null;

async function ensureBasicPitchLoaded(onStatus) {
  if (basicPitchLoaded) return;
  if (onStatus) onStatus(T("music_hum_progress_loading_model", "モデルを読み込み中…"));
  basicPitchLib = await import(/* webpackIgnore: true */ BASIC_PITCH_ESM_URL);
  basicPitchModel = new basicPitchLib.BasicPitch(BASIC_PITCH_MODEL_URL);
  basicPitchLoaded = true;
}

// decodeAudioDataは音声コンテナ（wav/mp3/m4a等）専用で、.mov等の動画コンテナを
// 直接デコードできず例外を投げることがある。その場合のフォールバックとして、
// <video>要素に実際に読み込ませてcaptureStream()で音声トラックだけを取り出し、
// MediaRecorderで録音し直すことで、ブラウザが再生さえできればコンテナ形式を
// 問わず音声データを取得できる（動画ファイルからの譜面生成に対応するため）
async function humExtractAudioFromVideoBlob(blob) {
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  try {
    video.src = url;
    video.muted = true; // ミュートしておけばユーザー操作なしの自動再生がブラウザに許可され、
    video.volume = 0; // captureStream()で取れる音声トラック自体には影響しない
    video.playsInline = true;
    video.preload = "auto";

    await new Promise((resolve, reject) => {
      video.addEventListener("loadedmetadata", resolve, { once: true });
      video.addEventListener("error", () => reject(new Error("video load failed")), { once: true });
    });

    const captureFn = video.captureStream || video.mozCaptureStream || video.webkitCaptureStream;
    if (!captureFn) throw new Error("captureStream not supported");
    const audioTracks = captureFn.call(video).getAudioTracks();
    if (!audioTracks.length) throw new Error("no audio track in video");

    const audioStream = new MediaStream(audioTracks);
    const recorder = new MediaRecorder(audioStream);
    const chunks = [];
    recorder.addEventListener("dataavailable", (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    });
    const stopped = new Promise((resolve) => recorder.addEventListener("stop", resolve, { once: true }));

    recorder.start();
    await video.play();
    await new Promise((resolve) => {
      video.addEventListener("ended", resolve, { once: true });
      // "ended"が発火しない環境向けの保険（動画の長さ+数秒で強制的に打ち切る）
      const durationMs = isFinite(video.duration) && video.duration > 0 ? video.duration * 1000 : 60000;
      setTimeout(resolve, durationMs + 3000);
    });
    recorder.stop();
    await stopped;

    return new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

// basic-pitchはモノラル・22050Hzの音声しか受け付けない（それ以外だと例外を投げる）。
// 録音・アップロードされる音声は端末やファイルによってサンプルレート・チャンネル数が
// バラバラなため、デコード後にOfflineAudioContextで必ずこの形式へリサンプルし直す
async function humDecodeAudioToBuffer(blob, onStatus) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let decoded;
  try {
    try {
      decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    } catch (directErr) {
      if (onStatus) onStatus(T("music_hum_progress_extracting_video", "動画から音声を取り出し中…"));
      const audioBlob = await humExtractAudioFromVideoBlob(blob);
      decoded = await ctx.decodeAudioData(await audioBlob.arrayBuffer());
    }
  } finally {
    ctx.close();
  }
  if (decoded.sampleRate === BASIC_PITCH_SAMPLE_RATE && decoded.numberOfChannels === 1) {
    return decoded;
  }
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * BASIC_PITCH_SAMPLE_RATE), BASIC_PITCH_SAMPLE_RATE);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  // ステレオ→モノラルへのダウンミックスは、宛先のチャンネル数がソースより少ない場合の
  // Web Audio API標準の自動ミックス（左右chを合成）でそのまま行われる
  source.connect(offlineCtx.destination);
  source.start(0);
  return await offlineCtx.startRendering();
}

// basic-pitchの標準的な使い方：evaluateModelにAudioBufferを渡し、フレーム単位の
// 予測結果(frames/onsets/contours)をコールバックで受け取り、basic-pitch側の
// ノート変換ユーティリティ（outputToNotesPoly→addPitchBendsToNoteEvents→
// noteFramesToTime）で実際の音符イベント列に変換する
async function runBasicPitchAnalysis(audioBuffer, onProgress) {
  const frames = [];
  const onsets = [];
  const contours = [];
  await basicPitchModel.evaluateModel(
    audioBuffer,
    (f, o, c) => {
      frames.push(...f);
      onsets.push(...o);
      contours.push(...c);
    },
    (percent) => {
      if (onProgress) onProgress(percent);
    }
  );
  const rawNotes = basicPitchLib.noteFramesToTime(
    basicPitchLib.addPitchBendsToNoteEvents(
      contours,
      basicPitchLib.outputToNotesPoly(frames, onsets, BASIC_PITCH_ONSET_THRESHOLD, BASIC_PITCH_FRAME_THRESHOLD, BASIC_PITCH_MIN_NOTE_LENGTH_FRAMES)
    )
  );
  return rawNotes.map((n) => ({
    pitchMidi: n.pitchMidi,
    startTimeSeconds: n.startTimeSeconds,
    durationSeconds: n.durationSeconds,
  }));
}

// ── リアルタイム音程表示（録音中に今どの音を歌っているか確認できるようにする） ──
// Basic Pitchは録音全体をまとめて解析する重いモデルのため、録音中フレームごとの
// リアルタイムフィードバックには使えない。そのため録音中だけは別途AnalyserNodeで
// 波形を取り出し、自己相関法（autocorrelation）で基本周波数を推定する軽量な方式を
// 使う（Web上のチューナー実装で広く使われている定番の手法）。この結果は表示のみに
// 使い、実際の譜面変換は引き続きBasic Pitchの解析結果を使う
let humPitchAudioCtx = null;
let humPitchAnalyser = null;
let humPitchDataArray = null;
let humPitchRafId = null;

const HUM_PITCH_CHROMATIC_NAMES = ["ド", "ド♯", "レ", "レ♯", "ミ", "ファ", "ファ♯", "ソ", "ソ♯", "ラ", "ラ♯", "シ"];

// 時間波形データ(-1〜1)から自己相関により基本周波数(Hz)を推定する。
// 無音・ノイズと判断した場合は-1を返す
function detectPitchAutocorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // 音量が小さすぎる（無音・環境ノイズ）

  // 波形の前後にある無音に近い部分を切り詰めてから相関を取る
  const threshold = 0.2;
  let r1 = 0, r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) >= threshold) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) >= threshold) { r2 = SIZE - i; break; }
  }
  const trimmed = buf.slice(r1, r2);
  const n = trimmed.length;
  if (n < 8) return -1;

  const c = new Array(n).fill(0);
  for (let lag = 0; lag < n; lag++) {
    for (let i = 0; i < n - lag; i++) c[lag] += trimmed[i] * trimmed[i + lag];
  }

  // 最初の下り坂を飛ばして、そのあとの最大値（＝周期のずれ幅）を探す
  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxVal = -1, maxPos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }
  }
  if (maxPos <= 0) return -1;

  // 前後の値との放物線補間で、サンプル単位より細かい精度を出す
  let period = maxPos;
  const x1 = c[maxPos - 1] ?? c[maxPos];
  const x2 = c[maxPos];
  const x3 = c[maxPos + 1] ?? c[maxPos];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) period -= b / (2 * a);

  return period > 0 ? sampleRate / period : -1;
}

// 周波数(Hz)を「音名＋オクターブ＋セント（半音の何%ずれているか）」に変換する。
// 譜面の度数（1=ド 2=レ…）は録音全体の音域が分かってから決まる（オクターブを
// まるごとシフトして楽器に合わせるため）ので、録音中はまだ度数化できない。
// そのため録音中の表示だけは絶対音名（A4=440Hz基準）で示す
function hzToJaNoteLabel(freq) {
  if (!freq || freq <= 0) return null;
  const midi = 69 + 12 * Math.log2(freq / 440);
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  return {
    name: HUM_PITCH_CHROMATIC_NAMES[((rounded % 12) + 12) % 12],
    octave: Math.floor(rounded / 12) - 1,
    cents,
    freq,
  };
}

function startHumPitchMonitor(stream) {
  try {
    humPitchAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = humPitchAudioCtx.createMediaStreamSource(stream);
    humPitchAnalyser = humPitchAudioCtx.createAnalyser();
    humPitchAnalyser.fftSize = 2048;
    humPitchDataArray = new Float32Array(humPitchAnalyser.fftSize);
    source.connect(humPitchAnalyser);
    document.getElementById("musicHumPitchRow").style.display = "";
    updateHumPitchDisplay();
  } catch (e) {
    // リアルタイム表示だけ諦めて、録音自体はそのまま続行する
    console.warn("hum pitch monitor init failed", e);
  }
}

function updateHumPitchDisplay() {
  if (!humPitchAnalyser) return;
  humPitchAnalyser.getFloatTimeDomainData(humPitchDataArray);
  const freq = detectPitchAutocorrelate(humPitchDataArray, humPitchAudioCtx.sampleRate);
  const el = document.getElementById("musicHumLivePitch");
  if (el) {
    if (freq > 0) {
      const info = hzToJaNoteLabel(freq);
      const centsLabel = info.cents >= 0 ? `+${info.cents}` : `${info.cents}`;
      el.textContent = `${info.name}${info.octave}（${Math.round(freq)}Hz ${centsLabel}¢）`;
      el.classList.remove("is-silent");
    } else {
      el.textContent = T("music_hum_live_pitch_silent", "（無音）");
      el.classList.add("is-silent");
    }
  }
  humPitchRafId = requestAnimationFrame(updateHumPitchDisplay);
}

function stopHumPitchMonitor() {
  if (humPitchRafId) cancelAnimationFrame(humPitchRafId);
  humPitchRafId = null;
  humPitchAnalyser = null;
  humPitchDataArray = null;
  if (humPitchAudioCtx) {
    humPitchAudioCtx.close();
    humPitchAudioCtx = null;
  }
  document.getElementById("musicHumPitchRow").style.display = "none";
}

// ── 録音（マイク） ──
async function startHumRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  humRecordedChunks = [];
  humRecorder = new MediaRecorder(stream);
  humRecorder.addEventListener("dataavailable", (e) => {
    if (e.data && e.data.size > 0) humRecordedChunks.push(e.data);
  });
  humRecorder.start();
  humRecordingStartTime = performance.now();
  updateHumRecordingUI(true);
  humRecordingTimer = setInterval(updateHumRecordingClock, 200);
  startHumPitchMonitor(stream);
}

function stopHumRecording() {
  return new Promise((resolve) => {
    if (!humRecorder) {
      resolve(null);
      return;
    }
    const recorder = humRecorder;
    recorder.addEventListener("stop", () => {
      clearInterval(humRecordingTimer);
      stopHumPitchMonitor();
      const blob = new Blob(humRecordedChunks, { type: recorder.mimeType || "audio/webm" });
      resolve(blob);
    });
    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
    humRecorder = null;
  });
}

function updateHumRecordingUI(isRecording) {
  document.getElementById("musicHumRecordingRow").style.display = isRecording ? "" : "none";
  document.getElementById("musicHumRecordBtn").style.display = isRecording ? "none" : "";
}

function updateHumRecordingClock() {
  const sec = Math.floor((performance.now() - humRecordingStartTime) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const el = document.getElementById("musicHumRecordingTime");
  if (el) el.textContent = `${m}:${String(s).padStart(2, "0")}`;
}

// ── モーダルの開閉・操作結線 ──
function openHumModal() {
  humSourceBlob = null;
  document.getElementById("musicHumError").textContent = "";
  document.getElementById("musicHumRecordingRow").style.display = "none";
  document.getElementById("musicHumFileRow").style.display = "none";
  document.getElementById("musicHumProgressRow").style.display = "none";
  document.getElementById("musicHumRecordBtn").style.display = "";
  document.getElementById("musicHumFileInput").value = "";
  document.getElementById("musicHumAnalyzeBtn").disabled = true;
  document.getElementById("musicHumModal").style.display = "block";
}

function closeHumModal() {
  if (humRecorder) stopHumRecording();
  document.getElementById("musicHumModal").style.display = "none";
}

async function onHumRecordClick() {
  try {
    await startHumRecording();
  } catch (e) {
    document.getElementById("musicHumError").textContent = T(
      "music_hum_mic_error",
      "マイクを使用できませんでした。ブラウザの設定を確認するか、音声ファイルをアップロードしてください"
    );
  }
}

async function onHumStopClick() {
  const blob = await stopHumRecording();
  updateHumRecordingUI(false);
  if (blob && blob.size > 0) {
    humSourceBlob = blob;
    document.getElementById("musicHumFileRow").style.display = "";
    document.getElementById("musicHumFileName").textContent = T("music_hum_recorded_label", "録音した音声");
    document.getElementById("musicHumAnalyzeBtn").disabled = false;
  }
}

function onHumFileChosen(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  humSourceBlob = file;
  document.getElementById("musicHumFileRow").style.display = "";
  document.getElementById("musicHumFileName").textContent = file.name;
  document.getElementById("musicHumAnalyzeBtn").disabled = false;
}

async function onHumAnalyzeClick() {
  if (!humSourceBlob) return;
  const errorEl = document.getElementById("musicHumError");
  const progressRow = document.getElementById("musicHumProgressRow");
  const progressFill = document.getElementById("musicHumProgressFill");
  const progressLabel = document.getElementById("musicHumProgressLabel");
  const analyzeBtn = document.getElementById("musicHumAnalyzeBtn");
  errorEl.textContent = "";
  progressRow.style.display = "";
  progressFill.style.width = "0%";
  analyzeBtn.disabled = true;

  const setProgress = (pct, label) => {
    if (typeof pct === "number") progressFill.style.width = `${Math.round(pct * 100)}%`;
    if (label) progressLabel.textContent = label;
  };

  try {
    await ensureBasicPitchLoaded((label) => setProgress(0, label));
    setProgress(0.1, T("music_hum_progress_decoding", "音声を解析用に変換中…"));
    const audioBuffer = await humDecodeAudioToBuffer(humSourceBlob, (label) => setProgress(0.1, label));
    setProgress(0.2, T("music_hum_progress_detecting", "音の高さを検出中…"));
    const noteEvents = await runBasicPitchAnalysis(audioBuffer, (p) =>
      setProgress(0.2 + p * 0.7, T("music_hum_progress_detecting", "音の高さを検出中…"))
    );
    setProgress(0.95, T("music_hum_progress_converting", "譜面に変換中…"));

    const inst = getInstrument(currentInstrumentId);
    const layout = getLayout(inst, currentLayoutId);
    const newTokens = convertHumNotesToTokens(noteEvents, layout, bpm);

    if (!newTokens.length) {
      errorEl.textContent = T("music_hum_no_notes", "音を検出できませんでした。もう少しはっきり・ゆっくり歌ってみてください");
      analyzeBtn.disabled = false;
      progressRow.style.display = "none";
      return;
    }

    tokens = newTokens;
    resetLoop();
    // 認識精度が完璧ではないため、変換直後の音は全て「未確認」としてマークし、
    // 編集モードでタップして手直しした音から順にマークが消えるようにする
    humReviewIndexes = new Set(newTokens.map((_, i) => i));
    selectedTokenIndex = null;
    setPageMode("edit");
    renderScoreDisplay();
    saveDraftDebounced();
    closeHumModal();
    showToast(T("music_hum_done_toast", "譜面に変換しました。金色の枠の音は自動検出です。タップして手直しできます"));
  } catch (e) {
    console.error(e);
    errorEl.textContent = T("music_hum_analyze_error", "解析に失敗しました。別の音声で試すか、しばらくしてからもう一度お試しください");
    analyzeBtn.disabled = false;
    progressRow.style.display = "none";
  }
}

function bindHumControls() {
  document.getElementById("musicHumOpenBtn").addEventListener("click", openHumModal);
  document.getElementById("musicHumCloseBtn").addEventListener("click", closeHumModal);
  document.getElementById("musicHumRecordBtn").addEventListener("click", onHumRecordClick);
  document.getElementById("musicHumStopBtn").addEventListener("click", onHumStopClick);
  document.getElementById("musicHumFileInput").addEventListener("change", onHumFileChosen);
  document.getElementById("musicHumAnalyzeBtn").addEventListener("click", onHumAnalyzeClick);
}
