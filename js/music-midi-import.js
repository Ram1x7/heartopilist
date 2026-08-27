// js/music-midi-import.js
// 「音源から作る」にMIDIファイルの読み込みを統合する機能、および、あらゆる
// ポリフォニック（複数音同時）ノートイベント列をゲーム内の和音対応tokensへ
// 変換する共通パイプライン（元はMIDI専用として実装したが、js/music-hum.jsの
// Basic Pitchによる音源/動画解析からも共有して使う）。
//
// MIDIファイルは.mid/.midi拡張子（またはaudio/midi系のMIMEタイプ）で判定し、
// 通常の音声解析（Basic Pitch）とは完全に別の経路で処理する。MIDIには
// ピッチ・タイミングの正確な情報がそのまま入っているため、Basic Pitchのような
// 重い解析モデル・CDN読み込みは一切不要で、この経路は完全にオフラインで完結する
// （依存ライブラリなしの自前SMF(Standard MIDI File)バイナリパーサーを使う。
// GitHub Pages＝ビルドステップなしの静的ホスティングという前提のもと、
// npmパッケージをバンドルする代わりに、フォーマット自体は複雑ではないため
// 直接実装した）。
//
// 【和音グループ化パイプラインの共有について】
// ハミングの変換（js/music-hum.jsのconvertMelodyToScoreTokens）は、Basic
// Pitchのポリフォニック検出結果を「主旋律1本」に絞り込む
// （collapseSimultaneousNoteEvents）。ハミングは本来単旋律（1人の声）である
// ため、複数音の同時検出は倍音・ノイズ等の誤検出である可能性が高いという
// 前提に基づく処理であり、この絞り込みはハミング専用のまま維持する。
// 一方、MIDIファイルの同時発音は作曲者が意図した本物の和音であり、また
// 音源/動画ファイル（Basic Pitchのポリフォニック解析）で検出される同時発音も
// 実際の伴奏・和音である可能性が高いため、どちらも絞り込まずtokenのnotes配列に
// そのまま複数音として残す（ゲーム内の演奏画面は理論上無制限の同時押しに
// 対応しているため、オカリナ/ほら貝を含む全楽器で和音を許可する）。
//
// 【共通の和音対応変換パイプライン】
//   ノートイベント列 [{pitchMidi, startTimeSeconds, durationSeconds}, ...]
//   （MIDIファイルの場合はparseMidiFile、音源/動画の場合はBasic Pitchの
//   ポリフォニック検出結果がそのままこの形式になる）
//   → groupNoteEventsIntoChords（同時刻に開始する複数ノートを1つの和音グループへ）
//   → limitChordPolyphony（ユーザー指定の「同時に押す指の本数」を超える和音を、
//                          主旋律(最高音)・低音(最低音)を優先して間引く）
//   → buildFreeTimingChordTimeline（既定）／quantizeChordRhythm（量子化する場合のみ）
//     （前者は実際の時間(durationMs)をそのまま使う「フリーテンポ譜面」を作る。
//      後者は曲全体で共有する拍グリッドへ開始位置を揃えた「拍子ベース譜面」を作る）
//   → mapChordsToInstrument（オクターブシフト＋楽器で実際に選べる音へのスナップ。
//                            和音内の各音は独立してスナップし、重複は取り除く）
//   → tokens
// （convertPolyphonicNoteEventsToScoreTokensがこの4段階をまとめて呼び出す）
//
// 【同時に押す指の本数の上限について】
// MIDI/音声/動画から検出した和音をそのまま譜面にすると、実際にプレイヤーが
// 同時に押せる指の本数を超えることがある。変換UI（js/music-hum.jsの
// #musicHumMaxNotesInput、MIDI・音源・動画の変換共通）で1〜10本の上限を
// 指定でき、それを超える和音はlimitChordPolyphonyで自動的に間引かれる。
// 楽器の音域外の音への対応（オクターブシフト・最寄り音へのスナップ）とは
// 独立した、純粋に「同時に鳴らす音の数」だけの制約であり、その後段の
// mapChordsToInstrumentの処理には一切影響しない。
//
// 【フリーテンポ譜面について】
// MIDI・音源・動画からの自動生成は、実際のタイミングをテンポ・拍子の量子化に
// 無理やり当てはめると違和感が出るため、既定では量子化を一切行わない
// 「フリーテンポ譜面」（score.freeTiming:true、各tokenがbeatsの代わりに
// 実時間の長さdurationMs(ミリ秒)を持つ）として生成する。手動でも
// 「新規作成」時にフリーテンポ譜面を選べる（js/music-editor.js）。
// フリーテンポ譜面は、生成後にエディター側の「拍子ベースの譜面に変換する」
// ボタン（js/music-editor.jsのconvertFreeTimingScoreToBarBased）で、いつでも
// 拍子ベースの譜面へ変換できる（逆方向の変換はできない）
//
// オクターブシフト・音へのスナップは js/music-hum.js の
// computeMelodyOctaveShift / buildInstrumentNoteMap をそのまま再利用する
// （同じ考え方＝「検出した音域を、楽器が実際に鳴らせる音域へオクターブ単位で
// まるごとシフトしてから、実際に選べる音へスナップする」を共通で適用する）。

// ── SMF(Standard MIDI File)バイナリパーサー ──
// ここから下は音声処理を一切伴わない純粋な計算のみで、Node上でも単体テストできる

function midiReadUint32(bytes, offset) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function midiReadUint16(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

// 可変長数値(VLQ)を読む。MIDIのデルタタイム・メタイベント長等で使われる形式
// （各バイトの上位1bitが続きの有無、下位7bitが値）
function readMidiVarLength(bytes, offset) {
  let value = 0;
  let pos = offset;
  for (;;) {
    const b = bytes[pos++];
    value = (value << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) break;
  }
  return { value, nextOffset: pos };
}

function readMidiChunkHeader(bytes, offset) {
  const id = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
  const length = midiReadUint32(bytes, offset + 4);
  return { id, length, dataOffset: offset + 8 };
}

// 1トラックチャンクの中身をパースし、絶対tick付きの生イベント列とトラック名を返す。
// ノートオン/オフの実際のペアリング（重なり対応）は呼び出し側(pairMidiNoteEvents)で行う
function parseMidiTrackEvents(bytes, start, length) {
  const end = start + length;
  let pos = start;
  let tick = 0;
  let runningStatus = null;
  let trackName = null;
  const events = [];

  while (pos < end) {
    const delta = readMidiVarLength(bytes, pos);
    tick += delta.value;
    pos = delta.nextOffset;

    let statusByte = bytes[pos];
    if (statusByte < 0x80) {
      // ランニングステータス：直前と同じstatusを再利用する。このバイト自体は
      // 最初のデータバイトなので読み進めない
      statusByte = runningStatus;
    } else {
      pos++;
      runningStatus = statusByte;
    }
    if (statusByte == null) break; // 壊れたファイル（最初のイベントがランニングステータス）対策

    if (statusByte === 0xff) {
      const metaType = bytes[pos++];
      const lenInfo = readMidiVarLength(bytes, pos);
      pos = lenInfo.nextOffset;
      const dataStart = pos;
      pos += lenInfo.value;
      if (metaType === 0x51 && lenInfo.value === 3) {
        const microsPerQuarter = (bytes[dataStart] << 16) | (bytes[dataStart + 1] << 8) | bytes[dataStart + 2];
        events.push({ tick, type: "tempo", microsPerQuarter });
      } else if (metaType === 0x58 && lenInfo.value >= 2) {
        // 拍子(Time Signature)：分子はそのまま、分母は2の指数(2^n)で表される
        const numerator = bytes[dataStart];
        const denominator = Math.pow(2, bytes[dataStart + 1]);
        events.push({ tick, type: "timeSignature", numerator, denominator });
      } else if ((metaType === 0x03 || metaType === 0x04) && trackName == null) {
        // 0x03=トラック名 0x04=楽器名（トラック名が無い場合の代替表示に使う）
        let name = "";
        for (let i = dataStart; i < dataStart + lenInfo.value; i++) name += String.fromCharCode(bytes[i]);
        trackName = name.trim();
      } else if (metaType === 0x2f) {
        break; // End of Track
      }
      runningStatus = null; // メタイベントの後はランニングステータスを引き継がない（仕様通り）
      continue;
    }
    if (statusByte === 0xf0 || statusByte === 0xf7) {
      // SysEx：内容は使わないので長さ分だけ読み飛ばす
      const lenInfo = readMidiVarLength(bytes, pos);
      pos = lenInfo.nextOffset + lenInfo.value;
      runningStatus = null;
      continue;
    }

    const eventType = statusByte & 0xf0;
    const channel = statusByte & 0x0f;
    if (eventType === 0x80 || eventType === 0x90) {
      const note = bytes[pos++];
      const velocity = bytes[pos++];
      // ノートオンでもvelocity=0は「ノートオフ」として扱う（MIDIの一般的な慣習。
      // ランニングステータスでノートオフを省略する実装で広く使われる）
      const isNoteOn = eventType === 0x90 && velocity > 0;
      events.push({ tick, type: isNoteOn ? "noteOn" : "noteOff", channel, note });
    } else if (eventType === 0xa0 || eventType === 0xb0 || eventType === 0xe0) {
      pos += 2; // ポリフォニックアフタータッチ／コントロールチェンジ／ピッチベンド：無視
    } else if (eventType === 0xc0 || eventType === 0xd0) {
      pos += 1; // プログラムチェンジ／チャンネルアフタータッチ：無視
    } else {
      break; // 未知のステータス。これ以上安全に読み進められないため打ち切る
    }
  }
  return { events, trackName };
}

// テンポ変化イベント列(tick順)から、tick→秒への変換関数を作る。
// ticksPerQuarter形式は「テンポ変化ごとに秒/tickが変わる区分線形」、
// SMPTE形式（フレーム/秒ベース、稀）はテンポに関係なく1tickあたりの秒数が固定
function buildMidiTickToSecondsConverter(tempoEvents, ticksPerQuarter, secondsPerTick) {
  if (secondsPerTick != null) {
    return (tick) => tick * secondsPerTick;
  }
  // segments[i] = {startTick, startSeconds, microsPerQuarter}：
  // 「startTick以降、次のテンポ変化のtickまではこの速さが有効」を表す。
  // 最初のテンポイベントより前の区間は既定値(500000マイクロ秒=120BPM、MIDI仕様の既定値)を使う
  const segments = [{ startTick: 0, startSeconds: 0, microsPerQuarter: 500000 }];
  const sorted = tempoEvents.slice().sort((a, b) => a.tick - b.tick);
  sorted.forEach((te) => {
    const prev = segments[segments.length - 1];
    if (te.tick === prev.startTick) {
      // 同じtickに複数のテンポイベントが重なる場合は、後のものを採用する
      prev.microsPerQuarter = te.microsPerQuarter;
      return;
    }
    const elapsedSeconds = prev.startSeconds + ((te.tick - prev.startTick) * prev.microsPerQuarter) / (ticksPerQuarter * 1e6);
    segments.push({ startTick: te.tick, startSeconds: elapsedSeconds, microsPerQuarter: te.microsPerQuarter });
  });

  return (tick) => {
    let seg = segments[0];
    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i].startTick <= tick) {
        seg = segments[i];
        break;
      }
    }
    return seg.startSeconds + ((tick - seg.startTick) * seg.microsPerQuarter) / (ticksPerQuarter * 1e6);
  };
}

// (channel,note)ごとにノートオンのtickを待ち行列として持ち、ノートオフで
// 先入れ先出しにペアリングする（同じ音高の重なり・連打にも対応）。
// 対応するノートオンが無いノートオフは無視する（壊れたファイル対策）
function pairMidiNoteEvents(events, tickToSeconds) {
  const pending = new Map();
  const result = [];
  events.forEach((e) => {
    if (e.type !== "noteOn" && e.type !== "noteOff") return;
    const key = `${e.channel}_${e.note}`;
    if (e.type === "noteOn") {
      if (!pending.has(key)) pending.set(key, []);
      pending.get(key).push(e.tick);
      return;
    }
    const stack = pending.get(key);
    if (!stack || !stack.length) return;
    const startTick = stack.shift();
    const startTimeSeconds = tickToSeconds(startTick);
    const endTimeSeconds = tickToSeconds(e.tick);
    if (endTimeSeconds > startTimeSeconds) {
      result.push({ pitchMidi: e.note, startTimeSeconds, durationSeconds: endTimeSeconds - startTimeSeconds });
    }
  });
  result.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
  return result;
}

// MIDIファイル(ArrayBuffer)をパースし、{format, ticksPerQuarter, initialBpm,
// tracks:[{index, name, noteEvents}]} を返す。ノートを1つも含まないトラック
// （テンポ・拍子だけを持つコンダクタートラック等）はtracksから除外する
function parseMidiFile(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.length < 14) throw new Error("invalid MIDI file (too short)");
  const header = readMidiChunkHeader(bytes, 0);
  if (header.id !== "MThd") throw new Error("invalid MIDI file (missing MThd header)");

  const format = midiReadUint16(bytes, header.dataOffset);
  const numTracks = midiReadUint16(bytes, header.dataOffset + 2);
  const division = midiReadUint16(bytes, header.dataOffset + 4);

  const isSmpte = (division & 0x8000) !== 0;
  let ticksPerQuarter = null;
  let secondsPerTick = null;
  if (isSmpte) {
    const framesPerSecondByte = (division >> 8) & 0xff;
    const framesPerSecond = (256 - framesPerSecondByte) & 0xff; // 2の補数表現(-24/-25/-29/-30)から復元
    const ticksPerFrame = division & 0xff;
    secondsPerTick = 1 / (framesPerSecond * ticksPerFrame);
  } else {
    ticksPerQuarter = division & 0x7fff;
  }

  let pos = header.dataOffset + 6;
  const rawTracks = [];
  for (let i = 0; i < numTracks && pos + 8 <= bytes.length; i++) {
    const chunk = readMidiChunkHeader(bytes, pos);
    if (chunk.id === "MTrk") {
      const { events, trackName } = parseMidiTrackEvents(bytes, chunk.dataOffset, chunk.length);
      rawTracks.push({ index: i, name: trackName, events });
    }
    // MTrk以外の未知チャンク（将来拡張等）も含め、長さ分だけ読み飛ばして次へ
    pos = chunk.dataOffset + chunk.length;
  }

  // テンポマップは全トラックのtempoイベントを集約する（フォーマット1の慣習では
  // 通常トラック0=コンダクタートラックにまとまるが、フォーマット0や非標準ファイルにも
  // 対応できるよう全トラックを走査する）
  const tempoEvents = [];
  const timeSignatureEvents = [];
  rawTracks.forEach((t) => {
    t.events.forEach((e) => {
      if (e.type === "tempo") tempoEvents.push({ tick: e.tick, microsPerQuarter: e.microsPerQuarter });
      else if (e.type === "timeSignature") timeSignatureEvents.push({ tick: e.tick, numerator: e.numerator, denominator: e.denominator });
    });
  });
  const initialMicrosPerQuarter = tempoEvents.length
    ? tempoEvents.slice().sort((a, b) => a.tick - b.tick)[0].microsPerQuarter
    : 500000; // 既定=120BPM
  const initialBpm = Math.round(60000000 / initialMicrosPerQuarter);

  // 検出した拍子が既存のTIME_SIGNATURESプリセットに完全一致する場合のみ採用する。
  // 一致しない拍子（5/4等、対応プリセットが無いもの）は推測で近いものに丸めず、
  // nullのまま返し、呼び出し側で「検出できたが対応できない」と明示する
  let initialTimeSignatureId = null;
  let detectedTimeSignatureLabel = null;
  if (timeSignatureEvents.length) {
    const first = timeSignatureEvents.slice().sort((a, b) => a.tick - b.tick)[0];
    detectedTimeSignatureLabel = `${first.numerator}/${first.denominator}`;
    const preset = TIME_SIGNATURES.find((t) => t.id === detectedTimeSignatureLabel);
    if (preset) initialTimeSignatureId = preset.id;
  }

  const tickToSeconds = buildMidiTickToSecondsConverter(tempoEvents, ticksPerQuarter, secondsPerTick);

  const tracks = rawTracks
    .map((t) => ({ index: t.index, name: t.name, noteEvents: pairMidiNoteEvents(t.events, tickToSeconds) }))
    .filter((t) => t.noteEvents.length > 0);

  return { format, ticksPerQuarter, initialBpm, initialTimeSignatureId, detectedTimeSignatureLabel, tracks };
}

// ── ノートイベント → 和音対応tokensへの変換（MIDI・音源/動画ファイル共通） ──

// 同時刻（既定30ms以内）に開始する複数ノートを1つの和音グループへまとめる。
// グループの長さは、含まれる音のうち最も長く鳴っていたものを採用する
function groupNoteEventsIntoChords(noteEvents, opts) {
  const options = opts || {};
  const simulEpsilonSec = options.simulEpsilonSec != null ? options.simulEpsilonSec : 0.03;
  const sorted = noteEvents.slice().sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
  const groups = [];
  sorted.forEach((ev) => {
    const last = groups[groups.length - 1];
    if (last && ev.startTimeSeconds - last.startTimeSeconds <= simulEpsilonSec) {
      last.midis.push(ev.pitchMidi);
      last.durationSeconds = Math.max(last.durationSeconds, ev.startTimeSeconds + ev.durationSeconds - last.startTimeSeconds);
      return;
    }
    groups.push({ midis: [ev.pitchMidi], startTimeSeconds: ev.startTimeSeconds, durationSeconds: ev.durationSeconds });
  });
  return groups;
}

// 和音1つぶんのMIDI番号列(midis)が指定本数(maxNotes)を超える場合に、
// 優先順位に沿って間引く。曲全体を通した「どれが主旋律か」は推定せず、
// この和音グループ単独のピッチ位置だけで判断する。優先順位：
//   1. 最も高いピッチ（主旋律とみなせる音）を最優先で残す
//   2. 次に最も低いピッチ（低音・伴奏の土台）を残す
//   3. 残り枠は、高い方から順に内側（2番目に高い→3番目に高い…）を埋めていく
//      （外側の音＝旋律・低音を優先し、間に挟まれる内声から間引かれる）
function pickPriorityChordNotes(midis, maxNotes) {
  const sorted = midis.slice().sort((a, b) => a - b);
  const n = sorted.length;
  if (maxNotes >= n) return sorted;
  if (maxNotes <= 1) return [sorted[n - 1]]; // 最高音（主旋律）だけ残す
  const picked = [sorted[0]]; // 最低音を確保
  const remaining = maxNotes - 1;
  for (let i = 0; i < remaining; i++) picked.push(sorted[n - 1 - i]); // 最高音から順に内側へ
  return picked.sort((a, b) => a - b);
}

// groupNoteEventsIntoChordsが返した和音グループ列に、上記の間引きを適用する。
// maxNotesが未指定(null/undefined)の場合は上限なし（間引かない）とし、
// 既存の呼び出し元の挙動を変えない
function limitChordPolyphony(groups, maxNotes) {
  if (maxNotes == null) return groups;
  return groups.map((g) => (g.midis.length > maxNotes ? { ...g, midis: pickPriorityChordNotes(g.midis, maxNotes) } : g));
}

// フリーテンポ譜面用：拍グリッドへのスナップは一切行わず、検出した実際の
// 時間(秒)をそのままtokenの長さ(durationMs)として使う。次のグループとの
// 間隔が十分空いていれば休符を挟み、そうでなければこの音の長さを次の音の
// 開始位置まで伸ばして隙間なくつなげる（考え方はquantizeChordRhythmと同じだが、
// 拍ではなく実時間(秒)で判定・保持する点だけが異なる）
function buildFreeTimingChordTimeline(groups, opts) {
  const options = opts || {};
  if (!groups.length) return [];
  const restGapSec = options.restGapSec != null ? options.restGapSec : 0.15;
  const minDurationMs = options.minDurationMs != null ? options.minDurationMs : 60;

  const result = [];
  groups.forEach((g, i) => {
    const ownEnd = g.startTimeSeconds + g.durationSeconds;
    const nextStart = i + 1 < groups.length ? groups[i + 1].startTimeSeconds : null;
    const gapAfter = nextStart == null ? null : nextStart - ownEnd;
    const isRestAfter = gapAfter != null && gapAfter >= restGapSec;
    const lengthSec = !isRestAfter && nextStart != null ? Math.max(g.durationSeconds, nextStart - g.startTimeSeconds) : g.durationSeconds;

    result.push({ midis: g.midis, durationMs: Math.max(minDurationMs, lengthSec * 1000) });
    if (isRestAfter) {
      result.push({ midis: null, durationMs: Math.max(minDurationMs, gapAfter * 1000) });
    }
  });
  return result;
}

// 和音グループ列を、曲全体で共有する1つの拍グリッド（既定0.25拍刻み）へ
// 開始位置をスナップし、次のグループとの間隔から休符を判定する。
// js/music-hum.js の quantizeMelodyRhythm と同じ考え方を、単一音ではなく
// 和音（MIDI番号の配列）に対して行う（休符はmidis:null）。
// フリーテンポ譜面から拍子ベースへ変換したい場合にのみ使う（既定では
// buildFreeTimingChordTimelineの方を使う。詳しくはファイル冒頭のコメント参照）
function quantizeChordRhythm(groups, bpmValue, opts) {
  const options = opts || {};
  if (!groups.length) return [];
  const beatSec = 60 / bpmValue;
  const gridUnit = options.gridUnit != null ? options.gridUnit : 0.25;
  const restGapBeats = options.restGapBeats != null ? options.restGapBeats : 0.3;

  const toBeat = (sec) => sec / beatSec;
  const snapToGrid = (beat) => Math.round(beat / gridUnit) * gridUnit;

  const starts = groups.map((g) => snapToGrid(toBeat(g.startTimeSeconds)));
  const ownEnds = groups.map((g, i) => Math.max(starts[i] + gridUnit, snapToGrid(toBeat(g.startTimeSeconds + g.durationSeconds))));

  const result = [];
  groups.forEach((g, i) => {
    const nextStart = i + 1 < groups.length ? starts[i + 1] : null;
    const gapAfter = nextStart == null ? null : nextStart - ownEnds[i];
    const isRestAfter = gapAfter != null && gapAfter >= restGapBeats;
    const lengthBeats = !isRestAfter && nextStart != null ? Math.max(gridUnit, nextStart - starts[i]) : Math.max(gridUnit, ownEnds[i] - starts[i]);

    result.push({ midis: g.midis, beats: snapBeatsToPreset(lengthBeats) });
    if (isRestAfter) {
      result.push({ midis: null, beats: snapBeatsToPreset(gapAfter) });
    }
  });
  return result;
}

// 指定MIDI番号に最も近い、楽器で実際に選べる音を返す（単純な最近傍。
// 和音内の同時発音には「前後の輪郭」という概念が無いため、
// js/music-hum.jsのpickClosestMelodyNoteWithContourのような文脈補正はせず、
// 距離だけで機械的に決める）
function pickNearestInstrumentNote(midi, availableNotes) {
  let best = availableNotes[0];
  let bestDist = Infinity;
  availableNotes.forEach((entry) => {
    const dist = Math.abs(entry.midi - midi);
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  });
  return best.note;
}

// グループ1つぶんの長さを、そのグループが持つ形式（拍子ベース=beats／
// フリーテンポ=durationMs）のままtoken用のプロパティに変換する。
// beats/durationMsは排他的なため、どちらか一方だけを含むオブジェクトを返す
function chordGroupDurationValue(g) {
  return g.durationMs != null ? { durationMs: g.durationMs } : { beats: g.beats };
}

// quantizeChordRhythm/buildFreeTimingChordTimelineが返した
// [{midis, beats|durationMs}, ...]（休符はmidis:null）を、楽器の音域への
// オクターブシフト＋実際に選べる音へのスナップを経てtokens形式
// （[{notes:[{degree,accidental,octave}], beats|durationMs}, ...]）にする。
// オクターブシフトは曲全体のすべての音をまとめて1回だけ計算する（和音の一部だけを
// 別のオクターブへ動かすと和音の音程関係が崩れるため）。和音内で複数の音が
// 同じ使用可能音へスナップした場合は、dedupeNotesで重複を取り除く。
// opts.octaveShiftOverrideは省略可能（既定0）：MIDI変換プレビューで、自動算出
// オクターブに対しユーザーが手動で±1オクターブ調整したい場合にのみ使う
// （半音単位。既存の呼び出し元は省略するため挙動は変わらない）
function mapChordsToInstrument(chordTimeline, availableNotes, opts) {
  const octaveShiftOverride = (opts && opts.octaveShiftOverride) || 0;
  if (!availableNotes.length) {
    return chordTimeline.map((g) => ({ notes: [], ...chordGroupDurationValue(g) }));
  }
  const allMidis = [];
  chordTimeline.forEach((g) => {
    if (g.midis) g.midis.forEach((m) => allMidis.push(m));
  });
  const shift = computeMelodyOctaveShift(allMidis, availableNotes) + octaveShiftOverride;

  return chordTimeline.map((g) => {
    if (!g.midis) return { notes: [], ...chordGroupDurationValue(g) };
    const mappedNotes = g.midis.map((m) => pickNearestInstrumentNote(m + shift, availableNotes));
    return { notes: dedupeNotes(mappedNotes), ...chordGroupDurationValue(g) };
  });
}

// MIDIファイル・音源/動画ファイル(Basic Pitchのポリフォニック検出結果)の
// どちらから来たノートイベント[{pitchMidi, startTimeSeconds, durationSeconds}, ...]も
// この1つの関数でtokens形式に変換できる（groupNoteEventsIntoChords →
// buildFreeTimingChordTimeline/quantizeChordRhythm → mapChordsToInstrumentの3段階。
// 同時発音は絞り込まず和音としてそのまま残す）。
// opts.freeTimingは既定でtrue：テンポ・拍子の量子化を一切行わない
// 「フリーテンポ譜面」として生成する（実際に検出した音の長さをそのまま使うため、
// テンポ・拍子の概念に無理やり当てはめて違和感が出ることを避ける）。
// false を指定すると、従来通りbpmValueの拍グリッドへ量子化した拍子ベースの
// tokensを生成する（音の長さの分布に依存しないので、既存の量子化ロジックは
// そのまま流用できる）
function convertPolyphonicNoteEventsToScoreTokens(noteEvents, layout, bpmValue, opts) {
  const options = opts || {};
  const resolvedSemitoneEnabled = options.semitoneEnabled != null ? options.semitoneEnabled : typeof semitoneEnabled !== "undefined" && semitoneEnabled;
  const availableNotes = buildInstrumentNoteMap(layout, resolvedSemitoneEnabled);
  const groups = groupNoteEventsIntoChords(noteEvents, options.chord);
  const limitedGroups = limitChordPolyphony(groups, options.maxSimultaneousNotes);
  const freeTiming = options.freeTiming !== false;
  const timeline = freeTiming
    ? buildFreeTimingChordTimeline(limitedGroups, options.freeTimingRhythm)
    : quantizeChordRhythm(limitedGroups, bpmValue, options.rhythm);
  return mapChordsToInstrument(timeline, availableNotes);
}

// MIDIプレビュー専用：convertPolyphonicNoteEventsToScoreTokensと全く同じ変換段階
// （groupNoteEventsIntoChords → limitChordPolyphony →
// buildFreeTimingChordTimeline/quantizeChordRhythm → mapChordsToInstrument）を
// 実行しつつ、変換結果と一緒に統計情報も返す。音源/動画パイプラインが直接使う
// convertPolyphonicNoteEventsToScoreTokens自体は変更していない（呼び出しの
// 組み立て方だけがこちらにもう1つある形で、個々の変換ロジックは完全に共有）
function convertMidiWithPreviewStats(noteEvents, layout, bpmValue, opts) {
  const options = opts || {};
  const resolvedSemitoneEnabled = options.semitoneEnabled != null ? options.semitoneEnabled : typeof semitoneEnabled !== "undefined" && semitoneEnabled;
  const availableNotes = buildInstrumentNoteMap(layout, resolvedSemitoneEnabled);
  const groups = groupNoteEventsIntoChords(noteEvents, options.chord);
  const limitedGroups = limitChordPolyphony(groups, options.maxSimultaneousNotes);
  const freeTiming = options.freeTiming !== false;
  const timeline = freeTiming
    ? buildFreeTimingChordTimeline(limitedGroups, options.freeTimingRhythm)
    : quantizeChordRhythm(limitedGroups, bpmValue, options.rhythm);
  const tokens = mapChordsToInstrument(timeline, availableNotes, { octaveShiftOverride: options.octaveShiftOverride });

  const allMidis = [];
  timeline.forEach((g) => {
    if (g.midis) g.midis.forEach((m) => allMidis.push(m));
  });
  const autoOctaveShift = computeMelodyOctaveShift(allMidis, availableNotes);
  const manualOctaveOffset = options.octaveShiftOverride || 0;
  const totalShift = autoOctaveShift + manualOctaveOffset;

  let truncatedNoteCount = 0;
  groups.forEach((g, i) => {
    truncatedNoteCount += g.midis.length - limitedGroups[i].midis.length;
  });

  let outOfRangeCount = 0;
  if (availableNotes.length) {
    const instMin = availableNotes[0].midi;
    const instMax = availableNotes[availableNotes.length - 1].midi;
    allMidis.forEach((m) => {
      const shifted = m + totalShift;
      if (shifted < instMin || shifted > instMax) outOfRangeCount++;
    });
  }

  const noteCount = tokens.reduce((sum, t) => sum + t.notes.length, 0);
  const chordCount = tokens.filter((t) => t.notes.length > 1).length;
  const restCount = tokens.filter((t) => t.notes.length === 0).length;
  const totalDurationSec = freeTiming
    ? tokens.reduce((sum, t) => sum + (t.durationMs || 0), 0) / 1000
    : tokens.reduce((sum, t) => sum + (t.beats || 0), 0) * (60 / bpmValue);

  return {
    tokens,
    stats: {
      tokenCount: tokens.length,
      noteCount,
      chordCount,
      restCount,
      outOfRangeCount,
      truncatedNoteCount,
      autoOctaveShift,
      manualOctaveOffset,
      totalDurationSec,
    },
  };
}

// ── ここから下はブラウザAPI（DOM・ファイル選択・モーダル）に依存する部分 ──

// 拡張子(.mid/.midi)またはMIMEタイプでMIDIファイルかどうかを判定する
function isMidiFile(file) {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".mid") || name.endsWith(".midi")) return true;
  const type = (file.type || "").toLowerCase();
  return type === "audio/midi" || type === "audio/x-midi" || type === "audio/mid";
}

let midiParsedResult = null; // トラック選択モーダルを開いている間、parseMidiFileの結果を保持する

// 音符数の上限（全トラック合計）。極端に音符数の多いMIDI（数万音以上）で
// メインスレッドが長時間ブロックするのを避けるための安全弁。以降の変換
// パイプライン自体はO(n)〜O(n×楽器音数)で軽いため、この値は「現実的な曲の
// 長さを大きく超える」水準に余裕を持たせて設定してある
const MIDI_MAX_NOTE_EVENTS = 20000;

// 「解析して譜面にする」から呼ばれるMIDI専用の処理。js/music-hum.jsの
// onHumAnalyzeClickが、選択ファイルがMIDIと判定した場合にこの関数へ委譲する
async function onMidiFileAnalyze(blob, ctx) {
  const { setProgress, fail } = ctx;
  let parsed;
  try {
    setProgress(0.3, T("music_midi_progress_parsing", "MIDIファイルを解析中…"));
    // 進捗表示が実際に描画されてから重い解析処理に入るよう、1フレーム分待つ
    // （Web Workerは導入せず、体感の応答性だけをこの程度の軽い対応で確保する）
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const buffer = await blob.arrayBuffer();
    parsed = parseMidiFile(buffer);
  } catch (e) {
    console.error(e);
    fail(T("music_midi_parse_error", "このMIDIファイルを読み込めませんでした。ファイル形式をご確認ください"));
    return;
  }

  if (!parsed.tracks.length) {
    fail(T("music_midi_no_notes", "このMIDIファイルには音が含まれていませんでした"));
    return;
  }

  const totalNoteEvents = parsed.tracks.reduce((sum, t) => sum + t.noteEvents.length, 0);
  if (totalNoteEvents > MIDI_MAX_NOTE_EVENTS) {
    fail(
      T(
        "music_midi_too_many_notes",
        `音符数が多すぎます（検出数:約${totalNoteEvents}音 / 上限:${MIDI_MAX_NOTE_EVENTS}音）。曲の一部だけを含むMIDIファイルにするか、トラックを絞ってからお試しください`,
        { count: totalNoteEvents, limit: MIDI_MAX_NOTE_EVENTS }
      )
    );
    return;
  }

  document.getElementById("musicHumProgressRow").style.display = "none";
  parsed.fileName = blob.name || "";

  if (parsed.tracks.length === 1) {
    const label = parsed.tracks[0].name || stripFileExtension(parsed.fileName) || T("music_default_score_name", "譜面");
    finishMidiConversion(parsed, parsed.tracks[0].noteEvents, parsed.initialBpm, label);
    return;
  }

  midiParsedResult = parsed;
  openMidiTrackPickerModal(parsed);
}

// トラック選択モーダル：複数トラックが見つかった場合のみ表示する。
// 「全トラックをまとめて変換」または、いずれか1トラックだけを選んで変換できる
function openMidiTrackPickerModal(parsed) {
  const listEl = document.getElementById("musicMidiTrackList");
  listEl.innerHTML = parsed.tracks
    .map((t, i) => {
      const name = t.name || T("music_midi_track_unnamed", `トラック${i + 1}`, { n: i + 1 });
      return `
    <div class="music-saved-item">
      <div class="music-saved-info">
        <div class="music-saved-name">${escapeHtml(name)}</div>
        <div class="music-saved-meta">${t.noteEvents.length}${T("music_note_count_suffix", "音")}</div>
      </div>
      <div class="music-saved-actions">
        <button data-track-index="${i}">${T("music_midi_use_track_btn", "このトラックだけ変換")}</button>
      </div>
    </div>`;
    })
    .join("");
  listEl.querySelectorAll("button[data-track-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.trackIndex);
      const t = parsed.tracks[idx];
      const label = t.name || T("music_midi_track_unnamed", `トラック${idx + 1}`, { n: idx + 1 });
      finishMidiConversion(parsed, t.noteEvents, parsed.initialBpm, label);
    });
  });
  document.getElementById("musicMidiMergeAllBtn").onclick = () => {
    const merged = parsed.tracks.flatMap((t) => t.noteEvents);
    const label = stripFileExtension(parsed.fileName) || T("music_midi_all_tracks_label", "全トラック");
    finishMidiConversion(parsed, merged, parsed.initialBpm, label);
  };
  document.getElementById("musicMidiTrackModal").style.display = "block";
}

// "song.mid" → "song"（拡張子が無ければそのまま返す）
function stripFileExtension(name) {
  if (!name) return "";
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(0, idx) : name;
}

function closeMidiTrackPickerModal() {
  document.getElementById("musicMidiTrackModal").style.display = "none";
  midiParsedResult = null;
}

// 選んだノートイベント（単一トラック or 全トラック結合）から、即座に譜面へ
// 反映するのではなく、まずプレビューを開く。テンポ・拍子はMIDIファイル
// 自身が持つ値をそのまま初期値として使う（タイミング計算に使ったテンポと
// 譜面のBPM表示を一致させるため）
function finishMidiConversion(parsed, noteEvents, sourceBpm, sourceLabel) {
  closeMidiTrackPickerModal();
  openMidiPreviewModal(noteEvents, sourceLabel, sourceBpm, parsed.initialTimeSignatureId, parsed.detectedTimeSignatureLabel);
}

// ── 変換結果プレビュー ──
// トラック選択後、即座にtokensを反映せず、楽器/配置・同時押し本数・オクターブ調整を
// その場で変えながら統計を確認し、「現在の譜面へ反映」「新しい譜面として保存」
// 「キャンセル」のいずれかを選べるようにする
let midiPreviewState = null;

function openMidiPreviewModal(noteEvents, sourceLabel, sourceBpm, timeSignatureId, detectedTimeSignatureLabel) {
  const clampedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(sourceBpm || DEFAULT_BPM)));
  midiPreviewState = {
    noteEvents,
    sourceLabel: sourceLabel || T("music_default_score_name", "譜面"),
    clampedBpm,
    timeSignatureId: timeSignatureId || DEFAULT_TIME_SIGNATURE_ID,
    timeSignatureDetectedButUnsupported: !timeSignatureId && !!detectedTimeSignatureLabel,
    detectedTimeSignatureLabel,
    instrumentId: currentInstrumentId,
    layoutId: currentLayoutId,
    semitoneEnabled,
    maxSimultaneousNotes: readMaxSimultaneousNotes(),
    octaveOffset: 0,
    latestTokens: [],
  };
  document.getElementById("musicMidiPreviewSourceLabel").textContent = T(
    "music_midi_preview_source",
    `曲名（トラック）: ${midiPreviewState.sourceLabel} ／ 検出テンポ: ${clampedBpm}BPM`,
    { name: midiPreviewState.sourceLabel, bpm: clampedBpm }
  );
  document.getElementById("musicMidiPreviewMaxNotesInput").value = midiPreviewState.maxSimultaneousNotes;
  renderMidiPreviewInstrumentButtons();
  renderMidiPreviewLayoutButtons();
  recomputeMidiPreview();
  document.getElementById("musicMidiPreviewModal").style.display = "block";
}

function closeMidiPreviewModal() {
  document.getElementById("musicMidiPreviewModal").style.display = "none";
  midiPreviewState = null;
  document.getElementById("musicHumAnalyzeBtn").disabled = false;
  document.getElementById("musicHumProgressRow").style.display = "none";
}

function renderMidiPreviewInstrumentButtons() {
  const el = document.getElementById("musicMidiPreviewInstrumentButtons");
  el.innerHTML = INSTRUMENTS.map(
    (inst) =>
      `<button class="music-instrument-btn${inst.id === midiPreviewState.instrumentId ? " active" : ""}" data-instrument="${inst.id}" aria-pressed="${inst.id === midiPreviewState.instrumentId}">${T(inst.nameKey, inst.nameFallback)}</button>`
  ).join("");
  el.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      midiPreviewState.instrumentId = btn.dataset.instrument;
      midiPreviewState.layoutId = defaultLayoutIdFor(midiPreviewState.instrumentId);
      midiPreviewState.semitoneEnabled = false;
      renderMidiPreviewInstrumentButtons();
      renderMidiPreviewLayoutButtons();
      recomputeMidiPreview();
    });
  });
}

function renderMidiPreviewLayoutButtons() {
  const el = document.getElementById("musicMidiPreviewLayoutButtons");
  const inst = getInstrument(midiPreviewState.instrumentId);
  if (inst.layouts.length <= 1) {
    el.innerHTML = "";
    el.style.display = "none";
    updateMidiPreviewSemitoneVisibility();
    return;
  }
  el.style.display = "";
  el.innerHTML = inst.layouts
    .map(
      (l) =>
        `<button class="music-layout-btn${l.id === midiPreviewState.layoutId ? " active" : ""}" data-layout="${l.id}" aria-pressed="${l.id === midiPreviewState.layoutId}">${T(l.labelKey, l.labelFallback)}</button>`
    )
    .join("");
  el.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      midiPreviewState.layoutId = btn.dataset.layout;
      renderMidiPreviewLayoutButtons();
      recomputeMidiPreview();
    });
  });
  updateMidiPreviewSemitoneVisibility();
}

function updateMidiPreviewSemitoneVisibility() {
  const inst = getInstrument(midiPreviewState.instrumentId);
  const layout = getLayout(inst, midiPreviewState.layoutId);
  const row = document.getElementById("musicMidiPreviewSemitoneRow");
  row.style.display = layout.chromaticGrid ? "" : "none";
  document.getElementById("musicMidiPreviewSemitoneToggle").checked = midiPreviewState.semitoneEnabled;
}

function updateMidiPreviewOctaveLabel() {
  const n = midiPreviewState.octaveOffset / 12;
  const el = document.getElementById("musicMidiPreviewOctaveValue");
  if (n === 0) el.textContent = T("music_midi_octave_auto", "自動");
  else {
    const signedN = n > 0 ? `+${n}` : `${n}`;
    el.textContent = T("music_midi_octave_auto_offset", `自動${signedN}`, { n: signedN });
  }
}

function recomputeMidiPreview() {
  if (!midiPreviewState) return;
  const inst = getInstrument(midiPreviewState.instrumentId);
  const layout = getLayout(inst, midiPreviewState.layoutId);
  const { tokens: previewTokens, stats } = convertMidiWithPreviewStats(midiPreviewState.noteEvents, layout, midiPreviewState.clampedBpm, {
    semitoneEnabled: midiPreviewState.semitoneEnabled,
    maxSimultaneousNotes: midiPreviewState.maxSimultaneousNotes,
    octaveShiftOverride: midiPreviewState.octaveOffset,
  });
  midiPreviewState.latestTokens = previewTokens;
  updateMidiPreviewOctaveLabel();
  renderMidiPreviewStats(stats);
}

function renderMidiPreviewStats(stats) {
  const statsEl = document.getElementById("musicMidiPreviewStats");
  const rows = [
    [T("music_midi_stat_notes", "音符数"), stats.noteCount],
    [T("music_midi_stat_chords", "和音数"), stats.chordCount],
    [T("music_midi_stat_rests", "休符数"), stats.restCount],
    [T("music_midi_stat_duration", "推定の長さ"), formatSeekTime(stats.totalDurationSec)],
  ];
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
  if (stats.truncatedNoteCount > 0) {
    warnings.push(
      T("music_midi_warn_truncated", `同時押し本数の上限を超えたため間引いた音: ${stats.truncatedNoteCount}件`, { n: stats.truncatedNoteCount })
    );
  }
  if (midiPreviewState.timeSignatureDetectedButUnsupported) {
    warnings.push(
      T(
        "music_midi_warn_timesig_unsupported",
        `拍子 ${midiPreviewState.detectedTimeSignatureLabel} を検出しましたが対応するプリセットが無いため、4/4を仮に使用します（小節線の目安表示のみに影響し、演奏には影響しません）`,
        { sig: midiPreviewState.detectedTimeSignatureLabel }
      )
    );
  }
  if (!stats.noteCount) {
    warnings.push(T("music_midi_warn_empty_result", "変換結果に音がありません。別のトラック・楽器を選び直してください"));
  }
  const warnEl = document.getElementById("musicMidiPreviewWarnings");
  warnEl.innerHTML = warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("");

  const applyBtn = document.getElementById("musicMidiPreviewApplyBtn");
  const saveBtn = document.getElementById("musicMidiPreviewSaveNewBtn");
  applyBtn.disabled = !stats.noteCount;
  saveBtn.disabled = !stats.noteCount;
}

// 現在編集中の譜面をプレビュー内容で上書きする（既存のapplyGeneratedMelodyTokens経由。
// resetHistory()が呼ばれるため、この操作自体はUndoで戻せない＝プレビュー内の
// 案内文の通り）
function applyMidiPreviewToCurrentScore() {
  if (!midiPreviewState || !midiPreviewState.latestTokens.length) return;
  currentInstrumentId = midiPreviewState.instrumentId;
  currentLayoutId = midiPreviewState.layoutId;
  semitoneEnabled = midiPreviewState.semitoneEnabled;
  bpm = midiPreviewState.clampedBpm;
  scoreReferenceBpm = midiPreviewState.clampedBpm;
  scoreFreeTiming = true;
  timeSignatureId = midiPreviewState.timeSignatureId;
  renderInstrumentSelector();
  renderLayoutSelector();
  renderScoreMeta();
  const tokensToApply = midiPreviewState.latestTokens;
  closeMidiPreviewModal();
  applyGeneratedMelodyTokens(
    tokensToApply,
    T("music_midi_done_toast", "MIDIファイルから譜面を作成しました。金色の枠の音は自動変換です。タップして手直しできます")
  );
}

// 現在編集中の譜面(tokens)には一切触れず、新しい譜面として保存済み一覧に追加する
function saveMidiPreviewAsNewScore() {
  if (!midiPreviewState || !midiPreviewState.latestTokens.length) return;
  const score = {
    id: "score-" + Date.now(),
    name: midiPreviewState.sourceLabel,
    instrumentId: midiPreviewState.instrumentId,
    layoutId: midiPreviewState.layoutId,
    semitoneEnabled: midiPreviewState.semitoneEnabled,
    bpm: midiPreviewState.clampedBpm,
    timeSignatureId: midiPreviewState.timeSignatureId,
    freeTiming: true,
    referenceBpm: midiPreviewState.clampedBpm,
    loopStart: null,
    loopEnd: null,
    loopEnabled: false,
    tokens: midiPreviewState.latestTokens.slice(),
    updatedAt: Date.now(),
  };
  savedScores.push(score);
  persistSavedScores();
  closeMidiPreviewModal();
  showToast(T("music_midi_saved_new_toast", "新しい譜面として保存しました"));
}

// ── MIDIエクスポート（tokens → SMF Format 0 のバイト列） ──
const MIDI_EXPORT_TICKS_PER_QUARTER = 480;

// 可変長数値(VLQ)のバイト列を組み立てる（readMidiVarLengthの逆変換）
function writeMidiVarLength(value) {
  const bytes = [];
  let v = Math.max(0, Math.round(value));
  bytes.unshift(v & 0x7f);
  v = Math.floor(v / 128);
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v = Math.floor(v / 128);
  }
  return bytes;
}

function midiUint32Bytes(n) {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}
function midiUint16Bytes(n) {
  return [(n >>> 8) & 0xff, n & 0xff];
}

// tokens(度数/臨時記号/オクターブ形式)をSMF(Format 0、1トラック)のバイト列へ変換する。
// 度数→MIDI番号の変換は既存のmelodyNoteToMidi(js/music-hum.js)をそのまま使い、
// 二重実装しない。テンポは曲全体を通して単一(exportBpm固定)とし、フリーテンポ譜面の
// durationMsもこのテンポを基準にtickへ変換する（テンポ変化そのものの再現はしない。
// 音符数・和音・相対的な長さの比率が読み戻し時に保たれることを優先する設計判断）
function encodeScoreAsMidiBytes(exportTokens, exportBpm, exportTimeSignatureId, exportScoreName) {
  const ticksPerQuarter = MIDI_EXPORT_TICKS_PER_QUARTER;
  const microsPerQuarter = Math.round(60000000 / exportBpm);

  const rawEvents = []; // {tick, type:"on"|"off", midi}
  let tickCursor = 0;
  exportTokens.forEach((tok) => {
    const beats = tok.durationMs != null ? (tok.durationMs / 1000) * (exportBpm / 60) : tok.beats || 0;
    const tickLength = Math.max(1, Math.round(beats * ticksPerQuarter));
    if (tok.notes && tok.notes.length) {
      const midis = dedupeNotes(tok.notes).map(melodyNoteToMidi);
      midis.forEach((m) => rawEvents.push({ tick: tickCursor, type: "on", midi: m }));
      midis.forEach((m) => rawEvents.push({ tick: tickCursor + tickLength, type: "off", midi: m }));
    }
    tickCursor += tickLength;
  });
  // 同じtickでは常にノートオフをノートオンより先に処理する（同じ音高が隙間なく
  // 連続する場合に、新しい発音より前に古い発音を確実に止めるため）
  rawEvents.sort((a, b) => (a.tick !== b.tick ? a.tick - b.tick : a.type === b.type ? 0 : a.type === "off" ? -1 : 1));

  const trackBytes = [];
  const pushMetaAtStart = (metaType, dataBytes) => {
    trackBytes.push(...writeMidiVarLength(0), 0xff, metaType, ...writeMidiVarLength(dataBytes.length), ...dataBytes);
  };
  if (exportScoreName) {
    pushMetaAtStart(0x03, Array.from(exportScoreName).map((c) => c.charCodeAt(0) & 0xff));
  }
  pushMetaAtStart(0x51, [(microsPerQuarter >> 16) & 0xff, (microsPerQuarter >> 8) & 0xff, microsPerQuarter & 0xff]);
  const sig = getTimeSignature(exportTimeSignatureId);
  const [sigNum, sigDenomStr] = sig.label.split("/");
  const sigDenomPow = Math.round(Math.log2(Number(sigDenomStr)));
  pushMetaAtStart(0x58, [Number(sigNum), sigDenomPow, 24, 8]);

  let lastTick = 0;
  rawEvents.forEach((e) => {
    const delta = e.tick - lastTick;
    lastTick = e.tick;
    const statusByte = e.type === "on" ? 0x90 : 0x80;
    const velocity = e.type === "on" ? 100 : 0;
    trackBytes.push(...writeMidiVarLength(delta), statusByte, e.midi & 0x7f, velocity & 0x7f);
  });
  trackBytes.push(...writeMidiVarLength(0), 0xff, 0x2f, 0x00); // End of Track

  const bytes = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    ...midiUint32Bytes(6),
    ...midiUint16Bytes(0), // Format 0
    ...midiUint16Bytes(1), // 1トラック
    ...midiUint16Bytes(ticksPerQuarter),
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    ...midiUint32Bytes(trackBytes.length),
    ...trackBytes,
  ];
  return new Uint8Array(bytes);
}

// ファイル名として安全な文字列にする（パス区切り文字・制御文字を除去）
function sanitizeMidiExportFileName(name) {
  const cleaned = (name || "").replace(/[\\/:*?"<>| -]/g, "_").trim();
  return cleaned || T("music_default_score_name", "譜面");
}

// 現在編集中の譜面をMIDIファイルとして書き出す。外部への送信は一切行わず、
// ブラウザ内でBlobを組み立ててそのままダウンロードさせる
function exportCurrentScoreAsMidi() {
  if (!tokens.length) {
    showToast(T("music_midi_export_empty", "書き出す音符がありません"));
    return;
  }
  const bytes = encodeScoreAsMidiBytes(tokens, bpm, timeSignatureId, scoreName);
  const blob = new Blob([bytes], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeMidiExportFileName(scoreName)}.mid`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(T("music_midi_export_done", "MIDIファイルを書き出しました"));
}

function bindMidiImportControls() {
  document.getElementById("musicMidiExportBtn").addEventListener("click", exportCurrentScoreAsMidi);
  document.getElementById("musicMidiTrackCloseBtn").addEventListener("click", () => {
    closeMidiTrackPickerModal();
    document.getElementById("musicHumAnalyzeBtn").disabled = false;
    document.getElementById("musicHumProgressRow").style.display = "none";
  });

  document.getElementById("musicMidiPreviewMaxNotesInput").addEventListener("change", (e) => {
    const val = Math.round(Number(e.target.value));
    const clamped = Number.isFinite(val) ? Math.max(MIN_CHORD_POLYPHONY, Math.min(MAX_CHORD_POLYPHONY, val)) : DEFAULT_CHORD_POLYPHONY;
    e.target.value = clamped;
    midiPreviewState.maxSimultaneousNotes = clamped;
    recomputeMidiPreview();
  });
  document.getElementById("musicMidiPreviewSemitoneToggle").addEventListener("change", (e) => {
    midiPreviewState.semitoneEnabled = e.target.checked;
    recomputeMidiPreview();
  });
  document.getElementById("musicMidiPreviewOctaveDownBtn").addEventListener("click", () => {
    midiPreviewState.octaveOffset = Math.max(-24, midiPreviewState.octaveOffset - 12);
    recomputeMidiPreview();
  });
  document.getElementById("musicMidiPreviewOctaveUpBtn").addEventListener("click", () => {
    midiPreviewState.octaveOffset = Math.min(24, midiPreviewState.octaveOffset + 12);
    recomputeMidiPreview();
  });
  document.getElementById("musicMidiPreviewApplyBtn").addEventListener("click", applyMidiPreviewToCurrentScore);
  document.getElementById("musicMidiPreviewSaveNewBtn").addEventListener("click", saveMidiPreviewAsNewScore);
  document.getElementById("musicMidiPreviewCancelBtn").addEventListener("click", closeMidiPreviewModal);
}
