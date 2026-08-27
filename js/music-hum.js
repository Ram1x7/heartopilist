// js/music-hum.js
// 「ハミングから作る」「音源から作る」「動画から作る」：録音・鼻歌・音源ファイル・
// 動画ファイルから、Basic Pitch（Spotifyが公開しているオープンソースのピッチ検出
// モデル、TensorFlow.js版）を使って音の高さ・発音タイミングを検出し、はとぴ図鑑の
// 譜面（tokens）に自動変換する。
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
// 【変換パイプラインの全体像：ハミング（単旋律専用）】
// ハミングは本来単旋律（1人の声）のため、Basic Pitchのポリフォニック（複数音
// 同時）検出結果のうち複数音が同時に検出された場合は、倍音・ノイズ等の誤検出の
// 可能性が高いとみなして主旋律1本に絞り込む。この単旋律専用パイプラインは
// 以下の段階を経る（各段階は音声処理を伴わない純粋関数として実装しており、
// Node上でも単体テストできる）。
//
//   生ノート列
//   → normalizeMelodyNoteEvents（同時発音の統合・同一音の断片統合・不安定クラスターの統合・
//                             ビブラート吸収・ノイズ除去）
//   → quantizeMelodyRhythm（曲全体で共有する拍グリッドへ開始位置を揃え、休符を判定）
//   → mapMelodyToInstrument（オクターブシフト＋前後の音との関係を考慮したゲーム内音への変換）
//   → optimizeMelodyForHeartopia（異常な同音連打の解決・繰り返しフレーズの一貫性）
//   → tokens
//
// 上記全体をまとめる convertMelodyToScoreTokens(noteEvents, layout, bpmValue, opts) は、
// 現在はハミング（sourceType:"humming"固定）専用として使われる。
// 既存の convertHumNotesToTokens() はこの関数を呼び出す後方互換の薄いラッパー。
//
// 【音源/動画ファイルは和音対応のポリフォニックパイプラインを使う】
// 「音源から作る」「動画から作る」は、和音・複数パートを含む音源にも対応するため、
// Basic Pitchのポリフォニック検出結果を主旋律に絞り込まず、js/music-midi-import.jsの
// MIDIインポートと共通の和音対応パイプライン（convertPolyphonicNoteEventsToScoreTokens：
// groupNoteEventsIntoChords → quantizeChordRhythm → mapChordsToInstrument）へそのまま渡す
// （onHumAnalyzeClick内で分岐している）。ノイズ除去のみ既存のfilterMelodyNoiseEventsを
// 流用し、それ以外の断片統合・ビブラート吸収等（前後関係を前提にした単旋律専用の処理）は
// 適用しない（複数の声部が入り交じる和音データに対して行うと、別々の声部の音を誤って
// 1つに統合してしまう恐れがあるため）。
//
// DEBUG_MELODY_ANALYSIS を true にすると、ハミング側パイプラインの各段階（生データ／
// 正規化後／量子化後／変換後）をconsoleへ出力できる（調査用。通常利用時はfalseのままにする）
const DEBUG_MELODY_ANALYSIS = false;

// ── 音高変換（ここから下は音声処理を伴わない純粋な計算のみで、Node上でも単体テストできる） ──

// 度数・臨時記号・オクターブの組から絶対MIDI番号を求める（60 = 度数1・オクターブ0 = middle C相当）
function melodyNoteToMidi(note) {
  const semis = DEGREE_SEMITONES[note.degree] + (ACCIDENTAL_SEMITONE_OFFSET[note.accidental] || 0);
  return 60 + semis + note.octave * 12;
}

// 楽器・配置(layout)が実際に鳴らせる音の一覧を、MIDI番号の昇順で返す。
// 「22キー」ピアノは、実機と同じく半音(♯)表示のON/OFFで演奏できる音が
// 変わるため、music-editor.js側の半音表示トグル(semitoneEnabled)と全く同じ
// 条件分岐（`semitoneEnabled && layout.chromaticGrid ? layout.chromaticGrid
// : layout.grid`。編集モードの譜面入力グリッド切り替えと共通のSingle Source
// of Truth）を用いる。chromaticGridは自然音＋半音の両方を含むため、有効時は
// それだけで良く、無効時（またはchromaticGridを持たない配置）はgridのみを使う
function buildInstrumentNoteMap(layout, semitoneEnabled) {
  const grid = semitoneEnabled && layout.chromaticGrid ? layout.chromaticGrid : layout.grid;
  const byMidi = new Map();
  grid.forEach((row) => {
    row.forEach((note) => {
      const midi = melodyNoteToMidi(note);
      if (!byMidi.has(midi)) byMidi.set(midi, note);
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
function computeMelodyOctaveShift(detectedMidis, availableNotes) {
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

// ほぼ同時刻に鳴っている複数の検出のうち、1つだけを残す。
// ハミング（本来単旋律）の場合は「倍音・ハモりの誤検出」の可能性が高いため、
// 最も長く鳴っている音を主音とみなす(preferHigherPitch:false、既定)。
// 音源・動画ファイル（伴奏・ベース等を含む混合音）の場合は、主旋律は一般的に
// 同時に鳴っている音の中で最も高い音であることが多いという簡易的な経験則
// （完全な音源分離の代わりに用いる、最小限の主旋律らしさの判定）から、
// より高い音を優先する(preferHigherPitch:true)。呼び出し側(normalizeMelodyNoteEvents)
// がsourceTypeに応じてこのオプションを渡す
function collapseSimultaneousNoteEvents(sortedEvents, opts) {
  const options = opts || {};
  const simulEpsilonSec = options.simulEpsilonSec != null ? options.simulEpsilonSec : 0.03;
  const preferHigherPitch = !!options.preferHigherPitch;
  const result = [];
  sortedEvents.forEach((ev) => {
    const last = result[result.length - 1];
    if (last && Math.abs(ev.startTimeSeconds - last.startTimeSeconds) <= simulEpsilonSec) {
      const shouldReplace = preferHigherPitch ? ev.pitchMidi > last.pitchMidi : ev.durationSeconds > last.durationSeconds;
      if (shouldReplace) {
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
function mergeMelodyNoteEvents(sortedEvents, opts) {
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

// mergeMelodyNoteEvents（隣接ペアが0.6半音以内でないと統合しない）や
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
function filterMelodyNoiseEvents(events, bpmValue, opts) {
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
// ビブラート吸収→ノイズ除去）にかけて整える。
// sourceType（"humming"｜"audio"｜"video"｜"midi"）は、同時発音の統合方法
// （collapseSimultaneousNoteEventsのpreferHigherPitch）にのみ影響する。
// それ以外の段階は入力元によらず共通の処理のままにしてある（分岐を増やしすぎない）
function normalizeMelodyNoteEvents(rawEvents, bpmValue, opts) {
  const options = opts || {};
  const sourceType = options.sourceType || "humming";
  const simultaneousOptions = { preferHigherPitch: sourceType !== "humming", ...options.simultaneous };
  const sorted = rawEvents.slice().sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
  const collapsed = collapseSimultaneousNoteEvents(sorted, simultaneousOptions);
  const merged = mergeMelodyNoteEvents(collapsed, options.merge);
  const clustered = consolidateUnstablePitchClusters(merged, options.cluster);
  const wobbleSuppressed = suppressPitchWobbleEvents(clustered, options.wobble);
  return filterMelodyNoiseEvents(wobbleSuppressed, bpmValue, options.noise);
}

// 整えたノート列の発音開始位置を、曲全体で共有する1つの拍グリッド（既定では
// 16分音符＝0.25拍刻み。手動編集で選べる最短の音価と合わせている）へスナップし、
// 音符ごとに独立して丸めることで生じるリズムのズレの蓄積を防ぐ。
// 次の音との間隔が十分あれば休符を挟み、そうでなければこの音の長さを次の音の
// 開始位置まで伸ばして隙間なくつなげる（Basic Pitchの検出の途切れを休符に
// してしまわないようにするため）。
// 戻り値は [{midi, beats}, ...]（休符はmidi:null）で、まだゲーム内音への
// 変換はしていない（それはmapMelodyToInstrumentの役目）
function quantizeMelodyRhythm(events, bpmValue, opts) {
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
function pickClosestMelodyNoteWithContour(midi, availableNotes, ctx) {
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

// quantizeMelodyRhythmが返した[{midi, beats}, ...]（休符はmidi:null）を、
// 楽器の音域へのオクターブシフト＋前後関係を考慮したゲーム内音への変換を経て
// tokens形式（[{notes:[{degree,accidental,octave}], beats}, ...]）にする。
// availableNotesは呼び出し側でbuildInstrumentNoteMap()により、現在の
// 楽器・配置・半音表示ON/OFFから求めた「実際に演奏できる音」の一覧を渡す
// （このためF#等の半音は、半音表示ONの時は候補として使われ、ちょうど
// 一致する音があれば距離0で必ず選ばれる。半音表示OFFの時は候補にすら
// 含まれないため、使用可能な自然音へ変換される）。
// 休符を挟むとメロディの輪郭比較はいったんリセットする（休符の前後は別フレーズ
// とみなす）。changesには実際に「検出音そのままの音」から変更が生じた音を
// 記録し、開発時の確認用ログにのみ使う
function mapMelodyToInstrument(events, availableNotes, opts) {
  if (!availableNotes.length) return { tokens: events.map((e) => ({ notes: [], beats: e.beats })), changes: [], octaveShift: 0, rawShiftedMidis: events.map(() => null) };

  // opts.octaveShiftOverrideは省略可能（既定0）：音源/動画/ハミングの変換プレビューで、
  // 自動算出オクターブに対しユーザーが手動で±1オクターブ調整したい場合にのみ使う
  // （js/music-midi-import.jsのmapChordsToInstrumentのoctaveShiftOverrideと同じ考え方）
  const octaveShiftOverride = (opts && opts.octaveShiftOverride) || 0;
  const detectedMidis = events.filter((e) => e.midi != null).map((e) => Math.round(e.midi));
  const shift = computeMelodyOctaveShift(detectedMidis, availableNotes) + octaveShiftOverride;

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
    const chosen = pickClosestMelodyNoteWithContour(shiftedMidi, availableNotes, { prevShiftedMidi, prevMappedMidi, nextShiftedMidi });
    const chosenMidi = melodyNoteToMidi(chosen);
    tokens.push({ notes: [{ degree: chosen.degree, accidental: chosen.accidental || null, octave: chosen.octave }], beats: e.beats });
    rawShiftedMidis.push(shiftedMidi);
    if (chosenMidi !== shiftedMidi) changes.push({ index: i, fromMidi: shiftedMidi, toMidi: chosenMidi });
    prevMappedMidi = chosenMidi;
    prevShiftedMidi = shiftedMidi;
  }
  return { tokens, changes, octaveShift: shift, rawShiftedMidis };
}

// ── Heartopia Melody Optimizer ──────────────────────────────────────────
// mapMelodyToInstrumentは前後1音までしか見ておらず、狭い帯域の細かい
// ピッチの揺れはnormalizeMelodyNoteEvents側のconsolidateUnstablePitchClustersで
// 既に吸収済みだが、由来の異なる複数の実音（本来別々の音程）が、ゲーム内
// 音への変換時にたまたま同じ1音へ衝突してしまうケースまでは防げない。
// この層は、そうした「マッピング後に生じた異常な同音連打」を検出したときだけ、
// 前後2音まで見た広いコンテキスト（輪郭・音程差の形）で候補を再評価する。
// あわせて、休符や長い音で区切られた「フレーズ」が曲中に繰り返し出現する
// 場合、初出時の変換結果を後続の同じ音程パターンにも適用し、同じフレーズ
// なのに変換結果がバラつくことを防ぐ。
//
// リズム(beats)は一切変更しない。convertHumNotesToTokens内で一度だけ、
// mapMelodyToInstrumentの直後に呼ばれる（二重に最適化がかかることはない）

// 指定インデックスの「輪郭比較用の参照点」を求める。processedUpTo以前は
// このパスで既に確定した音（result側のマッピング後MIDI）を、それより先は
// まだ確定していない同じ塊の内部なので生データ側のシフト後MIDIを代わりに使う
function heartopiaNeighborContext(idx, result, rawShiftedMidis, processedUpTo) {
  if (idx < 0 || idx >= result.length) return { raw: null, mapped: null };
  const raw = rawShiftedMidis[idx];
  if (raw == null) return { raw: null, mapped: null }; // 休符をまたいだ先は参照しない
  const mapped = idx <= processedUpTo && result[idx].notes.length ? melodyNoteToMidi(result[idx].notes[0]) : raw;
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

// mapMelodyToInstrumentの結果(tokens)を、休符または長い音（既定2拍以上）で
// 区切って「フレーズ」に分割する。各フレーズについて、そのインデックス列・
// 生データ側のシフト後MIDI列・現在のnotesのコピーを返す
function splitMelodyPhrases(result, rawShiftedMidis, opts) {
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

// mapMelodyToInstrumentが返したtokensを、上記の考え方で仕上げる。
// 戻り値のoptimizerLogは、実際に変更した音のみを{index, originalMidi,
// mappedMidi, optimizedMidi, reason}の形で記録し、開発確認用ログにのみ使う
function optimizeMelodyForHeartopia(tokens, rawShiftedMidis, availableNotes, opts) {
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

  const result = tokens.map((t) => ({ notes: t.notes.map((n) => ({ ...n })), beats: t.beats }));
  const optimizerLog = [];
  if (!availableNotes.length) return { tokens: result, optimizerLog };

  const mappedMidiAt = (idx) => (result[idx].notes.length ? melodyNoteToMidi(result[idx].notes[0]) : null);

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
          if (resolved && melodyNoteToMidi(resolved) !== before) {
            result[k].notes = [{ degree: resolved.degree, accidental: resolved.accidental || null, octave: resolved.octave }];
            optimizerLog.push({ index: k, originalMidi: rawShiftedMidis[k], mappedMidi: before, optimizedMidi: melodyNoteToMidi(resolved), reason: "burst-resolution" });
          }
        }
      }
    }
    i = j + 1;
  }

  // ── 2. 繰り返しフレーズの一貫性 ──
  const phrases = splitMelodyPhrases(result, rawShiftedMidis, options.phrase);
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
      const wantedMidi = melodyNoteToMidi(wantedNote);
      if (before !== wantedMidi) {
        result[idx].notes = [{ ...wantedNote }];
        optimizerLog.push({ index: idx, originalMidi: rawShiftedMidis[idx], mappedMidi: before, optimizedMidi: wantedMidi, reason: "phrase-consistency" });
      }
    });
  });

  return { tokens: result, optimizerLog };
}

// MIDI番号を「音名＋オクターブ」の表示用ラベルに変換する（デバッグログ専用）
function melodyMidiLabel(midi) {
  const rounded = Math.round(midi);
  const name = HUM_PITCH_CHROMATIC_NAMES[((rounded % 12) + 12) % 12];
  return `${name}${Math.floor(rounded / 12) - 1}`;
}

// 「中間部分から異音が混じる」等の不具合調査用。生データ／正規化後／量子化後／
// マッピング後／最適化後の5段階をconsoleに出す（[HUM-OPT]行は実際に最適化層で
// 変更が入った音のみ）。DEBUG_MELODY_ANALYSISがtrueの時、またはwindow.HUM_DEBUGが
// trueの時だけ呼ばれる
function logMelodyAnalysisStages(rawEvents, normalized, timeline, mappedTokens, changes, octaveShift, optimizedTokens, optimizerLog) {
  console.log("=== HUM ANALYSIS ===");
  console.log(`RAW (${rawEvents.length}件)`);
  rawEvents.forEach((e) => console.log(`${e.startTimeSeconds.toFixed(2)}s  ${melodyMidiLabel(e.pitchMidi)}  ${e.durationSeconds.toFixed(2)}s`));
  console.log(`NORMALIZED (${normalized.length}件)`);
  normalized.forEach((e) => console.log(`${e.startTimeSeconds.toFixed(2)}s  ${melodyMidiLabel(e.pitchMidi)}  ${e.durationSeconds.toFixed(2)}s`));
  console.log(`QUANTIZED (${timeline.length}件)`);
  timeline.forEach((e) => console.log(e.midi == null ? `rest  ${e.beats}拍` : `${melodyMidiLabel(e.midi)}  ${e.beats}拍`));
  console.log(`MAPPED (オクターブシフト${octaveShift / 12}オクターブ、変更${changes.length}件)`);
  const changeByIndex = new Map(changes.map((c) => [c.index, c]));
  mappedTokens.forEach((t, i) => {
    if (!t.notes.length) {
      console.log("rest");
      return;
    }
    const change = changeByIndex.get(i);
    const label = melodyMidiLabel(melodyNoteToMidi(t.notes[0]));
    console.log(change ? `${melodyMidiLabel(change.fromMidi)} -> ${melodyMidiLabel(change.toMidi)}` : `${label} -> ${label}`);
  });
  if (optimizedTokens) {
    console.log(`OPTIMIZED (Heartopia Melody Optimizer, 変更${optimizerLog.length}件)`);
    optimizedTokens.forEach((t, i) => console.log(t.notes.length ? melodyMidiLabel(melodyNoteToMidi(t.notes[0])) : "rest"));
    optimizerLog.forEach((c) => {
      console.log(
        `[HUM-OPT] index=${c.index} original=${melodyMidiLabel(c.originalMidi)} mapped=${melodyMidiLabel(c.mappedMidi)} optimized=${melodyMidiLabel(c.optimizedMidi)} reason=${c.reason}`
      );
    });
  }
}

// Basic Pitchのノートイベント[{pitchMidi, startTimeSeconds, durationSeconds}, ...]を
// tokens形式（[{notes:[{degree,accidental,octave}], beats}, ...]）に変換する
// （normalizeMelodyNoteEvents → quantizeMelodyRhythm → mapMelodyToInstrument →
// optimizeHumMelodyForHeartopeaの4段階。最適化層はマッピング直後に一度だけ通す）
function convertMelodyToScoreTokens(noteEvents, layout, bpmValue, opts) {
  const options = opts || {};
  const sourceType = options.sourceType || "humming"; // "humming" | "audio" | "video" | "midi"（midiはフェーズ2で追加予定、未実装）
  const debugEnabled = options.debug || DEBUG_MELODY_ANALYSIS || (typeof window !== "undefined" && (window.HUM_DEBUG || window.MELODY_DEBUG));
  // 「実際に演奏できる音」は、楽器・配置に加えて半音表示ON/OFFでも変わる
  // （22キー＋半音ONならF#等も使用可能）。呼び出し側から明示的に渡された値を
  // 最優先し、渡されなければmusic-editor.js側の半音表示トグル(semitoneEnabled)の
  // 現在値を見る（どちらも無ければOFF相当として自然音のみ扱う）
  const resolvedSemitoneEnabled =
    options.semitoneEnabled != null ? options.semitoneEnabled : typeof semitoneEnabled !== "undefined" && semitoneEnabled;
  const availableNotes = buildInstrumentNoteMap(layout, resolvedSemitoneEnabled);
  const normalized = normalizeMelodyNoteEvents(noteEvents, bpmValue, { sourceType, ...options.normalize });
  if (!normalized.length) {
    if (debugEnabled) logMelodyAnalysisStages(noteEvents, normalized, [], [], [], 0);
    return [];
  }

  const timeline = quantizeMelodyRhythm(normalized, bpmValue, options.rhythm);
  const { tokens: mappedTokens, changes, octaveShift, rawShiftedMidis } = mapMelodyToInstrument(timeline, availableNotes, options.mapping);
  const { tokens, optimizerLog } = optimizeMelodyForHeartopia(mappedTokens, rawShiftedMidis, availableNotes, options.optimize);

  if (debugEnabled) {
    logMelodyAnalysisStages(noteEvents, normalized, timeline, mappedTokens, changes, octaveShift, tokens, optimizerLog);
  }
  return tokens;
}

// 後方互換のための薄いラッパー。「ハミングから作る」機能はこの名前のまま
// 呼び出し続けられる（sourceTypeは既定の"humming"のまま）
function convertHumNotesToTokens(noteEvents, layout, bpmValue, opts) {
  return convertMelodyToScoreTokens(noteEvents, layout, bpmValue, opts);
}

// ハミング（単旋律）変換プレビュー専用：convertMelodyToScoreTokensと全く同じ
// 変換段階（normalizeMelodyNoteEvents → quantizeMelodyRhythm →
// mapMelodyToInstrument → optimizeMelodyForHeartopia）を実行しつつ、変換結果と
// 一緒に統計情報も返す。js/music-midi-import.jsのconvertMidiWithPreviewStats
// （和音対応パイプライン側の同種の関数）と対になる、単旋律パイプライン側の
// プレビュー専用関数。convertMelodyToScoreTokens自体は変更していない
function convertMelodyWithPreviewStats(noteEvents, layout, bpmValue, opts) {
  const options = opts || {};
  const resolvedSemitoneEnabled = options.semitoneEnabled != null ? options.semitoneEnabled : typeof semitoneEnabled !== "undefined" && semitoneEnabled;
  const availableNotes = buildInstrumentNoteMap(layout, resolvedSemitoneEnabled);
  const normalized = normalizeMelodyNoteEvents(noteEvents, bpmValue, { sourceType: "humming", ...options.normalize });
  if (!normalized.length) {
    return { tokens: [], stats: { tokenCount: 0, noteCount: 0, restCount: 0, outOfRangeCount: 0, autoOctaveShift: 0, manualOctaveOffset: options.octaveShiftOverride || 0, totalDurationSec: 0 } };
  }

  const timeline = quantizeMelodyRhythm(normalized, bpmValue, options.rhythm);
  const mappingOpts = { ...options.mapping, octaveShiftOverride: options.octaveShiftOverride };
  const { tokens: mappedTokens, rawShiftedMidis } = mapMelodyToInstrument(timeline, availableNotes, mappingOpts);
  const { tokens } = optimizeMelodyForHeartopia(mappedTokens, rawShiftedMidis, availableNotes, options.optimize);

  const detectedMidis = timeline.filter((e) => e.midi != null).map((e) => Math.round(e.midi));
  const autoOctaveShift = computeMelodyOctaveShift(detectedMidis, availableNotes);
  const manualOctaveOffset = options.octaveShiftOverride || 0;

  const noteCount = tokens.filter((t) => t.notes.length > 0).length;
  const restCount = tokens.length - noteCount;
  let outOfRangeCount = 0;
  if (availableNotes.length) {
    const instMin = availableNotes[0].midi;
    const instMax = availableNotes[availableNotes.length - 1].midi;
    rawShiftedMidis.forEach((m) => {
      if (m != null && (m < instMin || m > instMax)) outOfRangeCount++;
    });
  }
  const totalDurationSec = tokens.reduce((sum, t) => sum + (t.beats || 0), 0) * (60 / bpmValue);

  return {
    tokens,
    stats: { tokenCount: tokens.length, noteCount, chordCount: 0, restCount, outOfRangeCount, truncatedNoteCount: 0, autoOctaveShift, manualOctaveOffset, totalDurationSec },
  };
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
// 値そのものは既存のまま変更していない（分割された音の統合はnormalizeMelodyNoteEvents側の
// 後処理で対応する）
const BASIC_PITCH_ONSET_THRESHOLD = 0.25;
const BASIC_PITCH_FRAME_THRESHOLD = 0.25;
const BASIC_PITCH_MIN_NOTE_LENGTH_FRAMES = 5;

// 「音源から作る」「動画から作る」で選べるファイルの上限。iPhone/iPadのSafariは
// タブあたりのメモリに厳しい制限があり、巨大なAudioBuffer（特にOfflineAudioContextでの
// リサンプル時に倍増する）でタブごとクラッシュしうるため、事前に上限を設けて弾く。
// メモリ消費に直結するのはデコード後の「音声の長さ」であり、ファイルサイズ（特に
// 動画は音声以外の映像データが大半を占める）はそれとあまり比例しないため、
// 実際に効かせるべき主なガードはMELODY_SOURCE_MAX_DURATION_SEC（長さ）の方で、
// ファイルサイズの上限はそれよりずっと緩い「極端に巨大なアップロードだけ弾く」
// 目的の目安にとどめる（数分程度の動画で60MBを超えることは普通にあり、
// 実際に60MBで短い動画まで弾いてしまう不具合が報告されたため、大幅に緩めた）
const MELODY_SOURCE_MAX_FILE_BYTES = 250 * 1024 * 1024; // 250MB
const MELODY_SOURCE_MAX_DURATION_SEC = 360; // 6分
// basic-pitch本体が内部で固定サイズのウィンドウ処理（1ウィンドウ約2秒分）をしており、
// それより短い音声を渡すとテンソルの次元がマイナスになり例外を投げて解析全体が
// 失敗する（ハミング／音源／動画のどの入力でも起こりうる、モデル側の制約）。
// そのため解析を始める前に弾き、原因不明の「解析に失敗しました」ではなく
// 具体的に分かるメッセージを出す
const MELODY_SOURCE_MIN_DURATION_SEC = 3;

let basicPitchLoaded = false;
let basicPitchModel = null;
let basicPitchLib = null; // { BasicPitch, outputToNotesPoly, addPitchBendsToNoteEvents, noteFramesToTime }
let humRecorder = null;
let humRecordedChunks = [];
let humRecordingStartTime = 0;
let humRecordingTimer = null;
let humSourceBlob = null;
// 現在開いているモーダルの入力元。"humming"（録音+ハミングアップロード）は
// 既存動作のまま、"audio"/"video"はファイル選択のみのモードとして同じモーダルを
// 使い回す（重複するUI/処理を避けるため、新しいモーダルを別途作らない）
let humSourceMode = "humming";
// 選択したファイルがMIDI(.mid/.midi)かどうか。"audio"モードでのみ、ファイル選択時に
// 拡張子/MIMEタイプから自動判定する（js/music-midi-import.jsのisMidiFile）。
// trueの場合、解析ボタンを押すとBasic Pitchではなくjs/music-midi-import.jsの
// 専用パーサーへ処理を委譲する（MIDIは正確なピッチ・タイミング情報を最初から
// 持っているため、重い解析モデルの読み込み自体が不要になる）
let humSourceIsMidi = false;
// 解析処理の二重実行防止・キャンセル用の世代カウンタ。1回の解析開始ごとに
// increment し、その時点の値(myRunId)を非同期処理の各区切りで比較する。
// 途中でキャンセル、または別の解析が始まると値がずれるため、古い処理は
// 結果を捨てて静かに終了する（重い解析処理自体を安全に中断する標準的な手段が
// ブラウザに無いため、計算自体は最後まで走るが、その結果を反映しない
// 「ソフトキャンセル」。UIには解析中である・キャンセル済みであることを明示する）
let humAnalysisRunId = 0;
let humAnalysisInProgress = false;

async function ensureBasicPitchLoaded(onStatus) {
  if (basicPitchLoaded) return;
  if (onStatus) onStatus(T("music_hum_progress_loading_model", "モデルを読み込み中…"));
  basicPitchLib = await import(/* webpackIgnore: true */ BASIC_PITCH_ESM_URL);
  basicPitchModel = new basicPitchLib.BasicPitch(BASIC_PITCH_MODEL_URL);
  basicPitchLoaded = true;
}

// decodeAudioDataは音声コンテナ（wav/mp3/m4a等）専用で、動画コンテナ（.mov/.mp4等）を
// 直接デコードできず例外を投げることがある。特にiOS/iPadOS標準の画面収録(ReplayKit)で
// 書き出された.movは、通常のカメラ撮影.movと内部のコンテナ構造が異なることが多く、
// decodeAudioDataが直接失敗しやすい。
//
// そのフォールバックとして、以前は<video>+captureStream()+MediaRecorderで
// 音声を録音し直す方式を使っていたが、実機調査の結果、iOS SafariはHTMLVideoElementの
// captureStream()自体を一切サポートしていない（2026年時点、caniuse/WebKit bugzilla調べ）
// ことが判明した。通常のカメラ撮影動画はdecodeAudioDataの直接デコードで成功するため
// このフォールバックに到達せず問題が表面化しなかったが、画面収録動画は必ずこの
// フォールバックに入るため、iOS実機では確実に失敗していた。
//
// captureStream()を経由せず、createMediaElementSource()（iOS Safariでも古くから
// 安定して動く基礎的なWeb Audio API）で<video>要素の音声をWeb Audioグラフへ直接つなぎ、
// 実再生時間分だけScriptProcessorNodeでPCMをそのまま集めてAudioBufferを組み立てる
// 方式にした。MediaRecorderの対応mimeType判定という別の不確実性も同時に避けられ、
// 再エンコードによる音質劣化もなくなる（実行時間が動画の実長さ分かかる点はトレードオフ）
async function humExtractAudioFromVideoBlob(blob, ctx, onStatus) {
  const debugEnabled = DEBUG_MELODY_ANALYSIS || (typeof window !== "undefined" && (window.HUM_DEBUG || window.MELODY_DEBUG));
  const log = (...args) => {
    if (debugEnabled) console.debug("[HUM-VIDEO]", ...args);
  };

  if (onStatus) onStatus(T("music_hum_progress_extracting_video", "動画から音声を取り出し中…"));

  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  // 画面外に実際にDOM接続して再生する（非接続の<video>だと再生・音声取得が
  // 不安定になるブラウザがあるため）
  video.style.position = "fixed";
  video.style.width = "1px";
  video.style.height = "1px";
  video.style.opacity = "0";
  video.style.pointerEvents = "none";
  document.body.appendChild(video);

  let sourceNode = null;
  let processorNode = null;
  let silentGainNode = null;

  try {
    video.src = url;
    video.muted = true; // ミュートしておけばユーザー操作なしでもブラウザが自動再生を許可する。
    // 音声はcreateMediaElementSource経由でしか取り出さずdestinationへは
    // ゼロゲイン経由でしかつながないため、スピーカーへ音が出ることはない
    video.playsInline = true;
    video.preload = "auto";

    await new Promise((resolve, reject) => {
      video.addEventListener("loadedmetadata", resolve, { once: true });
      video.addEventListener("error", () => reject(new Error("video load failed")), { once: true });
    });

    log("loadedmetadata", {
      duration: video.duration,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      audioTracks: video.audioTracks ? video.audioTracks.length : "unsupported",
    });

    // video.audioTracksはWebKit系の非標準拡張で、実際には音声トラックがあっても
    // loadedmetadata時点では0件と報告されることがある（実機で確認済み：音声入りの
    // 画面収録でもこの値が信用できないケースがあった）ため、ここでは診断ログにのみ
    // 使い、判定には使わない。実際に音声が取得できたかどうかは後段の
    // totalFrames（実際にキャプチャできたPCM量）で判定する

    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    log("audioContextState", ctx.state);

    sourceNode = ctx.createMediaElementSource(video);
    const channelCount = Math.max(1, sourceNode.channelCount || 2);
    processorNode = ctx.createScriptProcessor(4096, channelCount, channelCount);
    silentGainNode = ctx.createGain();
    silentGainNode.gain.value = 0; // スピーカーには一切音を出さないためのゼロゲイン

    const collected = Array.from({ length: channelCount }, () => []);
    processorNode.onaudioprocess = (e) => {
      for (let ch = 0; ch < channelCount; ch++) {
        collected[ch].push(new Float32Array(e.inputBuffer.getChannelData(ch)));
      }
    };

    // ScriptProcessorNodeはdestinationまで経路がつながっていないと
    // onaudioprocessが発火しないブラウザがあるため、ゼロゲイン経由でdestinationへつなぐ
    sourceNode.connect(processorNode);
    processorNode.connect(silentGainNode);
    silentGainNode.connect(ctx.destination);

    await video.play();
    await new Promise((resolve) => {
      video.addEventListener("ended", resolve, { once: true });
      // "ended"が発火しない環境向けの保険（動画の長さ+数秒で強制的に打ち切る）
      const durationMs = isFinite(video.duration) && video.duration > 0 ? video.duration * 1000 : 60000;
      setTimeout(resolve, durationMs + 3000);
    });

    const totalFrames = collected[0].reduce((sum, chunk) => sum + chunk.length, 0);
    if (totalFrames === 0) throw new Error("no audio captured from video");

    const audioBuffer = ctx.createBuffer(channelCount, totalFrames, ctx.sampleRate);
    for (let ch = 0; ch < channelCount; ch++) {
      const merged = new Float32Array(totalFrames);
      let offset = 0;
      for (const chunk of collected[ch]) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      audioBuffer.copyToChannel(merged, ch);
    }

    log("captured", { channelCount, totalFrames, sampleRate: ctx.sampleRate, duration: audioBuffer.duration });

    return audioBuffer;
  } finally {
    if (processorNode) processorNode.onaudioprocess = null;
    if (sourceNode) sourceNode.disconnect();
    if (processorNode) processorNode.disconnect();
    if (silentGainNode) silentGainNode.disconnect();
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.remove();
    URL.revokeObjectURL(url);
  }
}

// basic-pitchはモノラル・22050Hzの音声しか受け付けない（それ以外だと例外を投げる）。
// 録音・アップロードされる音声は端末やファイルによってサンプルレート・チャンネル数が
// バラバラなため、デコード後にOfflineAudioContextで必ずこの形式へリサンプルし直す
async function humDecodeAudioToBuffer(blob, onStatus) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const debugEnabled = DEBUG_MELODY_ANALYSIS || (typeof window !== "undefined" && (window.HUM_DEBUG || window.MELODY_DEBUG));
  let decoded;
  try {
    try {
      decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
      if (debugEnabled) console.debug("[HUM-VIDEO] decodeAudioData direct: success", { sampleRate: decoded.sampleRate });
    } catch (directErr) {
      if (debugEnabled) console.debug("[HUM-VIDEO] decodeAudioData direct: failed", directErr && directErr.message);
      decoded = await humExtractAudioFromVideoBlob(blob, ctx, onStatus);
    }
  } finally {
    ctx.close();
  }
  if (decoded.sampleRate === BASIC_PITCH_SAMPLE_RATE && decoded.numberOfChannels === 1) {
    if (debugEnabled) console.debug("[HUM-VIDEO] final AudioBuffer (no resample needed)", { duration: decoded.duration, sampleRate: decoded.sampleRate, numberOfChannels: decoded.numberOfChannels });
    return decoded;
  }
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * BASIC_PITCH_SAMPLE_RATE), BASIC_PITCH_SAMPLE_RATE);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  // ステレオ→モノラルへのダウンミックスは、宛先のチャンネル数がソースより少ない場合の
  // Web Audio API標準の自動ミックス（左右chを合成）でそのまま行われる
  source.connect(offlineCtx.destination);
  source.start(0);
  const resampled = await offlineCtx.startRendering();
  if (debugEnabled) console.debug("[HUM-VIDEO] final AudioBuffer (resampled)", { duration: resampled.duration, sampleRate: resampled.sampleRate, numberOfChannels: resampled.numberOfChannels });
  return resampled;
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
// モードごとのモーダル文言・受け付けるファイル種別。"humming"は既存の
// 録音+アップロード両対応のまま、"audio"/"video"はアップロードのみ（録音行を隠す）
const MELODY_SOURCE_MODE_CONFIG = {
  humming: {
    accept: "audio/*,video/*",
    titleKey: ["music_hum_modal_title", "ハミングから作る"],
    cautionKey: ["music_hum_caution", "ゆっくり・はっきりと、1音ずつ鼻歌を歌うと綺麗に変換されます。速い曲や和音、伴奏が混ざった音源はうまく認識できないことがあります。初回のみ解析モデルの読み込みに通信が必要ですが、録音・アップロードした音声はこの端末のブラウザ内だけで解析され、外部に送信されることはありません"],
    uploadKey: ["music_hum_upload", "音声・動画ファイルを選ぶ"],
    showRecordRow: true,
    showMaxNotesRow: false, // ハミングは単旋律専用パイプラインのため和音の間引き設定は不要
  },
  audio: {
    // MIDIファイル(.mid/.midi)もこの入口で受け付ける。ネイティブのファイル選択ダイアログが
    // 拡張子ベースで絞り込む端末もあるため、MIMEタイプだけでなく拡張子も明示しておく
    accept: "audio/*,.mid,.midi",
    titleKey: ["music_audio_modal_title", "音源から作る"],
    cautionKey: ["music_audio_caution", "ボーカルや主旋律がはっきり聞こえる音源ほど綺麗に変換されます。伴奏やドラム、ベースが強い音源はうまく認識できないことがあります。初回のみ解析モデルの読み込みに通信が必要ですが、アップロードした音声はこの端末のブラウザ内だけで解析され、外部に送信されることはありません（6分まで対応。ファイルサイズの上限は250MBです）。MIDIファイル（.mid）を選んだ場合は、解析モデルを使わずそのままピッチ・タイミング情報を読み取って変換します（和音もそのまま再現されます）"],
    uploadKey: ["music_audio_upload", "音声ファイルを選ぶ"],
    showRecordRow: false,
    showMaxNotesRow: true, // 音源(basic-pitch)・MIDIどちらもここから同時押し本数の上限を指定できる
  },
  video: {
    accept: "video/*",
    titleKey: ["music_video_modal_title", "動画から作る"],
    cautionKey: ["music_video_caution", "動画から音声トラックを取り出して解析します。ボーカルや主旋律がはっきり聞こえる動画ほど綺麗に変換されます。初回のみ解析モデルの読み込みに通信が必要ですが、アップロードした動画はこの端末のブラウザ内だけで処理され、外部に送信されることはありません（6分まで対応。ファイルサイズの上限は250MBです）"],
    uploadKey: ["music_video_upload", "動画ファイルを選ぶ"],
    showRecordRow: false,
    showMaxNotesRow: true,
  },
};

// 変換時の「同時に押す指の本数」設定。譜面データ(score)には保存せず、この
// モーダルでの選択のみlocalStorageに記憶し、次回変換時の初期値として使う
const MUSIC_MAXNOTES_KEY = "hatopiMusic_maxSimultaneousNotes";

function loadMaxSimultaneousNotesSetting() {
  const raw = localStorage.getItem(MUSIC_MAXNOTES_KEY);
  const val = Math.round(Number(raw));
  if (!raw || !Number.isFinite(val)) return DEFAULT_CHORD_POLYPHONY;
  return Math.max(MIN_CHORD_POLYPHONY, Math.min(MAX_CHORD_POLYPHONY, val));
}

// #musicHumMaxNotesInputの現在値を1〜10に丸めて返す（js/music-midi-import.jsの
// finishMidiConversionからも呼ばれる、MIDI・音源・動画で共通のモーダルのため）
function readMaxSimultaneousNotes() {
  const input = document.getElementById("musicHumMaxNotesInput");
  if (!input) return DEFAULT_CHORD_POLYPHONY;
  const val = Math.round(Number(input.value));
  const clamped = Number.isFinite(val) ? Math.max(MIN_CHORD_POLYPHONY, Math.min(MAX_CHORD_POLYPHONY, val)) : DEFAULT_CHORD_POLYPHONY;
  input.value = clamped;
  return clamped;
}

function openMelodySourceModal(mode) {
  humSourceMode = mode;
  const config = MELODY_SOURCE_MODE_CONFIG[mode];
  humSourceBlob = null;
  humSourceIsMidi = false;
  document.getElementById("musicHumError").textContent = "";
  document.getElementById("musicHumRecordingRow").style.display = "none";
  document.getElementById("musicHumFileRow").style.display = "none";
  document.getElementById("musicHumProgressRow").style.display = "none";
  document.getElementById("musicHumRecordBtn").style.display = config.showRecordRow && isMicRecordingSupported() ? "" : "none";
  document.getElementById("musicHumPitchRow").style.display = "none";
  document.getElementById("musicHumFileInput").value = "";
  document.getElementById("musicHumFileInput").accept = config.accept;
  document.getElementById("musicHumAnalyzeBtn").disabled = true;
  document.getElementById("musicHumModalTitle").textContent = T(...config.titleKey);
  document.getElementById("musicHumCautionText").textContent = T(...config.cautionKey);
  document.getElementById("musicHumUploadText").textContent = T(...config.uploadKey);
  document.getElementById("musicHumMaxNotesRow").style.display = config.showMaxNotesRow ? "" : "none";
  document.getElementById("musicHumMaxNotesHint").style.display = config.showMaxNotesRow ? "" : "none";
  if (config.showMaxNotesRow) document.getElementById("musicHumMaxNotesInput").value = loadMaxSimultaneousNotesSetting();
  document.getElementById("musicHumModal").style.display = "block";
}

// 既存の「ハミングから作る」ボタンから呼ばれる後方互換の薄いラッパー
function openHumModal() {
  openMelodySourceModal("humming");
}

function openAudioSourceModal() {
  openMelodySourceModal("audio");
}

function openVideoSourceModal() {
  openMelodySourceModal("video");
}

function closeHumModal() {
  if (humRecorder) stopHumRecording();
  cancelHumAnalysis();
  document.getElementById("musicHumModal").style.display = "none";
}

// getUserMedia自体が無いブラウザ（対応していないブラウザ・非セキュアコンテキスト等）では
// クラッシュさせず、録音ボタンを最初から無効化してファイルアップロードへ誘導する
function isMicRecordingSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

async function onHumRecordClick() {
  const errorEl = document.getElementById("musicHumError");
  errorEl.textContent = "";
  try {
    await startHumRecording();
  } catch (e) {
    console.warn("hum recording failed", e);
    // NotAllowedError/PermissionDeniedError：ユーザーがマイクの許可を拒否した場合
    // NotFoundError：マイクデバイス自体が無い場合。それぞれ次にすべき行動が
    // 分かるよう別の文言にする（両方ともブラウザのgetUserMedia仕様上のerror.name）
    if (e && (e.name === "NotAllowedError" || e.name === "PermissionDeniedError")) {
      errorEl.textContent = T(
        "music_hum_mic_denied",
        "マイクへのアクセスが拒否されました。ブラウザ・OSの設定でこのサイトのマイク使用を許可するか、音声ファイルをアップロードしてください"
      );
    } else if (e && e.name === "NotFoundError") {
      errorEl.textContent = T(
        "music_hum_mic_notfound",
        "マイクが見つかりませんでした。マイクを接続するか、音声ファイルをアップロードしてください"
      );
    } else {
      errorEl.textContent = T(
        "music_hum_mic_error",
        "マイクを使用できませんでした。ブラウザの設定を確認するか、音声ファイルをアップロードしてください"
      );
    }
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
  const errorEl = document.getElementById("musicHumError");
  errorEl.textContent = "";
  if (file.size > MELODY_SOURCE_MAX_FILE_BYTES) {
    const sizeMb = Math.round(file.size / (1024 * 1024));
    const limitMb = Math.round(MELODY_SOURCE_MAX_FILE_BYTES / (1024 * 1024));
    errorEl.textContent = T(
      "music_melody_file_too_large",
      `ファイルサイズが大きすぎます（このファイル: 約${sizeMb}MB / 上限${limitMb}MB）。ファイルを短くするか圧縮してからお試しください`,
      { size: sizeMb, limit: limitMb }
    );
    e.target.value = "";
    return;
  }
  humSourceBlob = file;
  // MIDIファイルかどうかは"audio"モードでのみ意味を持つ（ハミング/動画はMIDI非対応）。
  // 解析ボタンを押した時点でこのフラグを見て、Basic PitchかMIDIパーサーかを振り分ける
  humSourceIsMidi = humSourceMode === "audio" && typeof isMidiFile === "function" && isMidiFile(file);
  if (DEBUG_MELODY_ANALYSIS || (typeof window !== "undefined" && (window.HUM_DEBUG || window.MELODY_DEBUG))) {
    console.debug("[HUM-VIDEO] file selected", {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      isMidi: humSourceIsMidi,
    });
  }
  document.getElementById("musicHumFileRow").style.display = "";
  document.getElementById("musicHumFileName").textContent = file.name;
  document.getElementById("musicHumAnalyzeBtn").disabled = false;
}

// 変換結果(tokens)を実際に譜面へ反映する共通処理。ハミング/音源/動画（Basic Pitch経由）と
// MIDIインポート（js/music-midi-import.js）の両方から呼ばれる
function applyGeneratedMelodyTokens(newTokens, doneToastMessage) {
  tokens = newTokens;
  resetLoop();
  // 認識精度が完璧ではないため、変換直後の音は全て「未確認」としてマークし、
  // 編集モードでタップして手直しした音から順にマークが消えるようにする
  humReviewIndexes = new Set(newTokens.map((_, i) => i));
  selectedTokenIndex = null;
  setPageMode("edit");
  renderScoreDisplay();
  renderFreeTimingUI();
  saveDraftDebounced();
  // ここより前(変換前の譜面)にはUndoで戻れないようにする。そうしないと、変換後に
  // 1回でも手動編集すると、その1回のUndoで変換結果ごと消えてしまうため
  resetHistory();
  closeHumModal();
  showToast(doneToastMessage);
}

// 「ハミングから作る」「音源から作る」「動画から作る」共通の解析処理。
// ファイル形式・サイズ・長さ・モデル読み込み・解析・0件検出のそれぞれで、
// どこで失敗したかが利用者に分かるよう個別のメッセージを出す
// （「メモリ不足」自体はJSから確実に検知できない＝ブラウザがタブごと
// 落ちる形で失敗しうるため、事前のファイルサイズ・長さ上限で予防する方針にした）
function cancelHumAnalysis() {
  if (!humAnalysisInProgress) return;
  humAnalysisRunId++; // 進行中の非同期処理はこの後の生存確認(isCancelled)で自ら止まる
  humAnalysisInProgress = false;
  document.getElementById("musicHumProgressRow").style.display = "none";
  document.getElementById("musicHumAnalyzeBtn").disabled = false;
  document.getElementById("musicHumError").textContent = "";
}

async function onHumAnalyzeClick() {
  if (!humSourceBlob) return;
  if (humAnalysisInProgress) return; // 二重実行防止（解析ボタンはdisabled化されるが、念のための保険）
  humAnalysisInProgress = true;
  const myRunId = ++humAnalysisRunId;
  const isCancelled = () => myRunId !== humAnalysisRunId;

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
    if (isCancelled()) return;
    if (typeof pct === "number") progressFill.style.width = `${Math.round(pct * 100)}%`;
    if (label) progressLabel.textContent = label;
  };
  const fail = (message) => {
    humAnalysisInProgress = false;
    if (isCancelled()) return; // キャンセル済みなら、後から失敗が分かってもUIには出さない
    errorEl.textContent = message;
    analyzeBtn.disabled = false;
    progressRow.style.display = "none";
  };

  // MIDIファイルは正確なピッチ・タイミング情報を最初から持っているため、
  // Basic Pitch（重い解析モデル）を一切経由せず、専用パーサーへ完全に処理を委ねる
  if (humSourceIsMidi) {
    await onMidiFileAnalyze(humSourceBlob, { setProgress, fail });
    humAnalysisInProgress = false;
    return;
  }

  try {
    await ensureBasicPitchLoaded((label) => setProgress(0, label));
  } catch (e) {
    console.error(e);
    fail(T("music_hum_model_load_error", "解析モデルの読み込みに失敗しました。通信環境を確認してからもう一度お試しください"));
    return;
  }
  if (isCancelled()) return;

  let audioBuffer;
  try {
    setProgress(0.1, T("music_hum_progress_decoding", "音声を解析用に変換中…"));
    audioBuffer = await humDecodeAudioToBuffer(humSourceBlob, (label) => setProgress(0.1, label));
  } catch (e) {
    console.error(e);
    // humExtractAudioFromVideoBlob側が「音声トラックが無い（実際に1サンプルも
    // 取得できなかった）」場合だけ、原因が明確に伝わる専用メッセージにする。
    // それ以外（コンテナ自体が壊れている等）は従来通りの汎用メッセージのまま
    if (e && e.message === "no audio captured from video") {
      fail(T("music_melody_no_audio_track", "この動画から音声を取り出せませんでした。音声トラックが含まれているかご確認ください"));
    } else {
      fail(
        T(
          "music_melody_unsupported_file",
          "このファイルを読み込めませんでした。対応形式（MP3, WAV, M4A, AAC, OGG, WebM, MP4, MOV等）かご確認ください"
        )
      );
    }
    return;
  }
  if (isCancelled()) return;

  if (audioBuffer.duration > MELODY_SOURCE_MAX_DURATION_SEC) {
    fail(T("music_melody_duration_too_long", "音声が長すぎます（上限6分）。ファイルを短く編集してからお試しください"));
    return;
  }
  if (audioBuffer.duration < MELODY_SOURCE_MIN_DURATION_SEC) {
    fail(T("music_melody_duration_too_short", "音声が短すぎます（3秒以上必要です）。もう少し長い音声でお試しください"));
    return;
  }

  let noteEvents;
  try {
    setProgress(0.2, T("music_hum_progress_detecting", "音の高さを検出中…"));
    noteEvents = await runBasicPitchAnalysis(audioBuffer, (p) =>
      setProgress(0.2 + p * 0.7, T("music_hum_progress_detecting", "音の高さを検出中…"))
    );
  } catch (e) {
    console.error(e);
    fail(T("music_hum_analyze_error", "解析に失敗しました。別の音声で試すか、しばらくしてからもう一度お試しください"));
    return;
  }
  if (isCancelled()) return;

  try {
    setProgress(0.95, T("music_hum_progress_converting", "譜面に変換中…"));
    // 音源/動画は、和音・複数パートを含みうるBasic Pitchのポリフォニック検出結果を
    // 主旋律に絞り込まず、js/music-midi-import.jsのMIDIインポートと共通の
    // プレビュー用パイプライン(convertMidiWithPreviewStats)へそのまま渡す
    // （新しいロジックを別途作らず、既存のパイプラインを再利用する）。
    // ノイズ除去（極端に短い誤検出の除外）はソース非依存の単純な長さフィルタのみ、
    // ここで解析開始時のbpmを使って一度だけ適用する（プレビュー内で楽器・
    // オクターブを選び直しても変わらない前処理のため、都度やり直す必要はない）。
    // ハミングは単旋律専用パイプライン(convertMelodyWithPreviewStats)が内部で
    // ノイズ除去も含めて行うため、ここでは未加工のまま渡す。
    // 変換結果は（MIDIインポートと同様）即座に反映せず、プレビューで
    // 使用楽器・オクターブ調整・統計情報を確認してから「現在の譜面へ反映」
    // 「新しい譜面として保存」を選べるようにする
    const previewNoteEvents = humSourceMode === "humming" ? noteEvents : filterMelodyNoiseEvents(noteEvents, bpm);
    const modeConfig = MELODY_SOURCE_MODE_CONFIG[humSourceMode];
    const sourceLabel = humSourceBlob.name || T(modeConfig.titleKey[0], modeConfig.titleKey[1]);
    humAnalysisInProgress = false;
    progressRow.style.display = "none";
    analyzeBtn.disabled = false;
    openMelodyPreviewModal(humSourceMode, previewNoteEvents, sourceLabel, bpm);
  } catch (e) {
    console.error(e);
    fail(T("music_hum_analyze_error", "解析に失敗しました。別の音声で試すか、しばらくしてからもう一度お試しください"));
  }
}

// ── 変換結果プレビュー（ハミング／音源／動画。js/music-midi-import.jsのMIDI変換
// プレビューと同じ考え方：変換結果を即座に反映せず、使用楽器・配置・オクターブ調整を
// その場で選び直しながら統計・警告を確認し、「現在の譜面へ反映」（既存通りUndo対象外）
// 「新しい譜面として保存」（現在の譜面には触れない）「変換をキャンセル」を選べる。
// MIDIプレビューとはモーダル・状態を分けている（対象がMIDIファイルではなく
// Basic Pitchの検出結果であるため呼び出し方が異なる／既存のMIDI側を一切変更せずに
// 済むため）が、和音対応の統計計算(convertMidiWithPreviewStats)と保存処理
// (saveTokensAsNewScore)は共通の関数をそのまま再利用する ──
let melodyPreviewState = null;

function openMelodyPreviewModal(kind, noteEvents, sourceLabel, bpmValue) {
  melodyPreviewState = {
    kind, // "humming" | "audio" | "video"
    noteEvents,
    sourceLabel: sourceLabel || T("music_default_score_name", "譜面"),
    bpm: bpmValue,
    instrumentId: currentInstrumentId,
    layoutId: currentLayoutId,
    semitoneEnabled,
    maxSimultaneousNotes: kind === "humming" ? null : readMaxSimultaneousNotes(),
    octaveOffset: 0,
    latestTokens: [],
  };
  document.getElementById("musicMelodyPreviewSourceLabel").textContent = T(
    "music_melody_preview_source",
    `入力元: ${melodyPreviewState.sourceLabel} ／ テンポ: ${bpmValue}BPM`,
    { label: melodyPreviewState.sourceLabel, bpm: bpmValue }
  );
  const maxNotesRow = document.getElementById("musicMelodyPreviewMaxNotesRow");
  maxNotesRow.style.display = kind === "humming" ? "none" : "";
  if (kind !== "humming") document.getElementById("musicMelodyPreviewMaxNotesInput").value = melodyPreviewState.maxSimultaneousNotes;
  renderMelodyPreviewInstrumentButtons();
  renderMelodyPreviewLayoutButtons();
  recomputeMelodyPreview();
  document.getElementById("musicMelodyPreviewModal").style.display = "block";
}

function closeMelodyPreviewModal() {
  document.getElementById("musicMelodyPreviewModal").style.display = "none";
  melodyPreviewState = null;
}

function renderMelodyPreviewInstrumentButtons() {
  const el = document.getElementById("musicMelodyPreviewInstrumentButtons");
  el.innerHTML = INSTRUMENTS.map(
    (inst) =>
      `<button class="music-instrument-btn${inst.id === melodyPreviewState.instrumentId ? " active" : ""}" data-instrument="${inst.id}" aria-pressed="${inst.id === melodyPreviewState.instrumentId}">${T(inst.nameKey, inst.nameFallback)}</button>`
  ).join("");
  el.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      melodyPreviewState.instrumentId = btn.dataset.instrument;
      melodyPreviewState.layoutId = defaultLayoutIdFor(melodyPreviewState.instrumentId);
      melodyPreviewState.semitoneEnabled = false;
      renderMelodyPreviewInstrumentButtons();
      renderMelodyPreviewLayoutButtons();
      recomputeMelodyPreview();
    });
  });
}

function renderMelodyPreviewLayoutButtons() {
  const el = document.getElementById("musicMelodyPreviewLayoutButtons");
  const inst = getInstrument(melodyPreviewState.instrumentId);
  if (inst.layouts.length <= 1) {
    el.innerHTML = "";
    el.style.display = "none";
    updateMelodyPreviewSemitoneVisibility();
    return;
  }
  el.style.display = "";
  el.innerHTML = inst.layouts
    .map(
      (l) =>
        `<button class="music-layout-btn${l.id === melodyPreviewState.layoutId ? " active" : ""}" data-layout="${l.id}" aria-pressed="${l.id === melodyPreviewState.layoutId}">${T(l.labelKey, l.labelFallback)}</button>`
    )
    .join("");
  el.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      melodyPreviewState.layoutId = btn.dataset.layout;
      renderMelodyPreviewLayoutButtons();
      recomputeMelodyPreview();
    });
  });
  updateMelodyPreviewSemitoneVisibility();
}

function updateMelodyPreviewSemitoneVisibility() {
  const inst = getInstrument(melodyPreviewState.instrumentId);
  const layout = getLayout(inst, melodyPreviewState.layoutId);
  const row = document.getElementById("musicMelodyPreviewSemitoneRow");
  row.style.display = layout.chromaticGrid ? "" : "none";
  document.getElementById("musicMelodyPreviewSemitoneToggle").checked = melodyPreviewState.semitoneEnabled;
}

function updateMelodyPreviewOctaveLabel() {
  const n = melodyPreviewState.octaveOffset / 12;
  const el = document.getElementById("musicMelodyPreviewOctaveValue");
  if (n === 0) {
    el.textContent = T("music_midi_octave_auto", "自動");
  } else {
    const signedN = n > 0 ? `+${n}` : `${n}`;
    el.textContent = T("music_midi_octave_auto_offset", `自動${signedN}`, { n: signedN });
  }
}

function recomputeMelodyPreview() {
  if (!melodyPreviewState) return;
  const inst = getInstrument(melodyPreviewState.instrumentId);
  const layout = getLayout(inst, melodyPreviewState.layoutId);
  const isPolyphonic = melodyPreviewState.kind !== "humming";
  // 和音対応（音源/動画）はjs/music-midi-import.jsのMIDI変換プレビューと全く同じ
  // convertMidiWithPreviewStatsを再利用する（呼び出しオプションも既存の
  // onHumAnalyzeClickでの変換呼び出しと揃えてある）。単旋律（ハミング）専用の
  // convertMelodyWithPreviewStatsだけがこのファイルの新規追加分
  const result = isPolyphonic
    ? convertMidiWithPreviewStats(melodyPreviewState.noteEvents, layout, melodyPreviewState.bpm, {
        semitoneEnabled: melodyPreviewState.semitoneEnabled,
        maxSimultaneousNotes: melodyPreviewState.maxSimultaneousNotes,
        octaveShiftOverride: melodyPreviewState.octaveOffset,
        chord: { simulEpsilonSec: 0.05 },
      })
    : convertMelodyWithPreviewStats(melodyPreviewState.noteEvents, layout, melodyPreviewState.bpm, {
        semitoneEnabled: melodyPreviewState.semitoneEnabled,
        octaveShiftOverride: melodyPreviewState.octaveOffset,
      });
  melodyPreviewState.latestTokens = result.tokens;
  updateMelodyPreviewOctaveLabel();
  renderMelodyPreviewStats(result.stats, isPolyphonic);
}

function renderMelodyPreviewStats(stats, isPolyphonic) {
  const statsEl = document.getElementById("musicMelodyPreviewStats");
  const rows = [[T("music_midi_stat_notes", "音符数"), stats.noteCount]];
  if (isPolyphonic) rows.push([T("music_midi_stat_chords", "和音数"), stats.chordCount]);
  rows.push([T("music_midi_stat_rests", "休符数"), stats.restCount]);
  rows.push([T("music_midi_stat_duration", "推定の長さ"), formatSeekTime(stats.totalDurationSec)]);
  statsEl.innerHTML = rows
    .map(([label, value]) => `<div class="music-midi-stat-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`)
    .join("");

  const warnings = [];
  if (stats.outOfRangeCount > 0) {
    warnings.push(
      T("music_midi_warn_outofrange", `音域外の音: ${stats.outOfRangeCount}件（自動でオクターブ調整・最も近い音に置き換え済みです）`, {
        n: stats.outOfRangeCount,
      })
    );
  }
  if (isPolyphonic && stats.truncatedNoteCount > 0) {
    warnings.push(
      T("music_midi_warn_truncated", `同時押し本数の上限を超えたため間引いた音: ${stats.truncatedNoteCount}件`, { n: stats.truncatedNoteCount })
    );
  }
  if (!stats.noteCount) {
    warnings.push(T("music_melody_warn_empty_result", "変換結果に音がありません。別の音源・ハミングでもう一度お試しください"));
  }
  const warnEl = document.getElementById("musicMelodyPreviewWarnings");
  warnEl.innerHTML = warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("");

  const applyBtn = document.getElementById("musicMelodyPreviewApplyBtn");
  const saveBtn = document.getElementById("musicMelodyPreviewSaveNewBtn");
  applyBtn.disabled = !stats.noteCount;
  saveBtn.disabled = !stats.noteCount;
}

// 現在編集中の譜面をプレビュー内容で上書きする（既存のapplyGeneratedMelodyTokens経由。
// resetHistory()が呼ばれるため、この操作自体はUndoで戻せない＝MIDI変換と同じ既知の仕様）
function applyMelodyPreviewToCurrentScore() {
  if (!melodyPreviewState || !melodyPreviewState.latestTokens.length) return;
  currentInstrumentId = melodyPreviewState.instrumentId;
  currentLayoutId = melodyPreviewState.layoutId;
  semitoneEnabled = melodyPreviewState.semitoneEnabled;
  scoreFreeTiming = melodyPreviewState.kind !== "humming";
  scoreReferenceBpm = melodyPreviewState.bpm;
  renderInstrumentSelector();
  renderLayoutSelector();
  renderScoreMeta();
  const tokensToApply = melodyPreviewState.latestTokens;
  closeMelodyPreviewModal();
  applyGeneratedMelodyTokens(tokensToApply, T("music_hum_done_toast", "譜面に変換しました。金色の枠の音は自動検出です。タップして手直しできます"));
}

// 現在編集中の譜面(tokens)には一切触れず、新しい譜面として保存済み一覧に追加する
// （js/music-editor.jsのsaveTokensAsNewScoreへ委譲。MIDI変換プレビューと共通の処理）
function saveMelodyPreviewAsNewScore() {
  if (!melodyPreviewState || !melodyPreviewState.latestTokens.length) return;
  const score = saveTokensAsNewScore({
    name: melodyPreviewState.sourceLabel,
    instrumentId: melodyPreviewState.instrumentId,
    layoutId: melodyPreviewState.layoutId,
    semitoneEnabled: melodyPreviewState.semitoneEnabled,
    bpm,
    timeSignatureId,
    freeTiming: melodyPreviewState.kind !== "humming",
    referenceBpm: melodyPreviewState.bpm,
    tokens: melodyPreviewState.latestTokens,
  });
  if (!score) {
    showToast(T("music_toast_save_failed", "保存に失敗しました。空き容量を確認してもう一度お試しください"));
    return;
  }
  closeMelodyPreviewModal();
  showToast(T("music_midi_saved_new_toast", "新しい譜面として保存しました"));
}

function bindHumControls() {
  document.getElementById("musicHumOpenBtn").addEventListener("click", openHumModal);
  document.getElementById("musicAudioOpenBtn").addEventListener("click", openAudioSourceModal);
  document.getElementById("musicVideoOpenBtn").addEventListener("click", openVideoSourceModal);
  document.getElementById("musicHumCloseBtn").addEventListener("click", closeHumModal);
  document.getElementById("musicHumRecordBtn").addEventListener("click", onHumRecordClick);
  document.getElementById("musicHumStopBtn").addEventListener("click", onHumStopClick);
  document.getElementById("musicHumFileInput").addEventListener("change", onHumFileChosen);
  document.getElementById("musicHumAnalyzeBtn").addEventListener("click", onHumAnalyzeClick);
  document.getElementById("musicHumCancelBtn").addEventListener("click", cancelHumAnalysis);
  document.getElementById("musicHumMaxNotesInput").addEventListener("change", () => {
    localStorage.setItem(MUSIC_MAXNOTES_KEY, String(readMaxSimultaneousNotes()));
  });

  document.getElementById("musicMelodyPreviewMaxNotesInput").addEventListener("change", (e) => {
    const val = Math.round(Number(e.target.value));
    const clamped = Number.isFinite(val) ? Math.max(MIN_CHORD_POLYPHONY, Math.min(MAX_CHORD_POLYPHONY, val)) : DEFAULT_CHORD_POLYPHONY;
    e.target.value = clamped;
    if (melodyPreviewState) {
      melodyPreviewState.maxSimultaneousNotes = clamped;
      recomputeMelodyPreview();
    }
  });
  document.getElementById("musicMelodyPreviewSemitoneToggle").addEventListener("change", (e) => {
    if (melodyPreviewState) {
      melodyPreviewState.semitoneEnabled = e.target.checked;
      recomputeMelodyPreview();
    }
  });
  document.getElementById("musicMelodyPreviewOctaveDownBtn").addEventListener("click", () => {
    if (!melodyPreviewState) return;
    melodyPreviewState.octaveOffset = Math.max(-24, melodyPreviewState.octaveOffset - 12);
    recomputeMelodyPreview();
  });
  document.getElementById("musicMelodyPreviewOctaveUpBtn").addEventListener("click", () => {
    if (!melodyPreviewState) return;
    melodyPreviewState.octaveOffset = Math.min(24, melodyPreviewState.octaveOffset + 12);
    recomputeMelodyPreview();
  });
  document.getElementById("musicMelodyPreviewApplyBtn").addEventListener("click", applyMelodyPreviewToCurrentScore);
  document.getElementById("musicMelodyPreviewSaveNewBtn").addEventListener("click", saveMelodyPreviewAsNewScore);
  document.getElementById("musicMelodyPreviewCancelBtn").addEventListener("click", closeMelodyPreviewModal);
}
