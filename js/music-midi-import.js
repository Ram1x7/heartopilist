// js/music-midi-import.js
// 「音源から作る」にMIDIファイルの読み込みを統合する機能。
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
// 【他の変換元との違い】
// ハミング／音源／動画ファイルの変換（js/music-hum.js）は、Basic Pitchの
// ポリフォニック（複数音同時）検出結果を「主旋律1本」に絞り込む
// （collapseSimultaneousNoteEvents）。これは検出結果に含まれる倍音・ハモり・
// 伴奏等の誤検出を1つの正しいメロディへ収束させるための処理であり、
// 「複数の音が同時に鳴っている」という検出結果そのものが信頼できないことが
// 前提になっている。
// 一方、MIDIファイルの同時発音は実際に作曲者が意図した和音そのものであり、
// 内容を信頼して良い。そのためMIDI変換では同時発音を1音に絞り込まず、
// tokenのnotes配列にそのまま複数音として残す（ゲーム内の演奏画面は理論上
// 無制限の同時押しに対応しているため、オカリナ/ほら貝を含む全楽器で和音を
// 許可する）。
//
// 【変換パイプライン】
//   MIDIファイル
//   → parseMidiFile（SMFパース。トラックごとのノートイベント[{pitchMidi,
//                    startTimeSeconds, durationSeconds}]とテンポを抽出）
//   → groupMidiNotesIntoChords（同時刻に開始する複数ノートを1つの和音グループへ）
//   → quantizeMidiChordRhythm（曲全体で共有する拍グリッドへ開始位置を揃え、休符を判定）
//   → mapMidiChordsToInstrument（オクターブシフト＋楽器で実際に選べる音へのスナップ。
//                                和音内の各音は独立してスナップし、重複は取り除く）
//   → tokens
//
// オクターブシフト・音へのスナップは js/music-hum.js の
// computeMelodyOctaveShift / buildInstrumentNoteMap をそのまま再利用する
// （同じ考え方＝「検出した音域を、楽器が実際に鳴らせる音域へオクターブ単位で
// まるごとシフトしてから、実際に選べる音へスナップする」をMIDIにも適用する）。

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
  rawTracks.forEach((t) => {
    t.events.forEach((e) => {
      if (e.type === "tempo") tempoEvents.push({ tick: e.tick, microsPerQuarter: e.microsPerQuarter });
    });
  });
  const initialMicrosPerQuarter = tempoEvents.length
    ? tempoEvents.slice().sort((a, b) => a.tick - b.tick)[0].microsPerQuarter
    : 500000; // 既定=120BPM
  const initialBpm = Math.round(60000000 / initialMicrosPerQuarter);

  const tickToSeconds = buildMidiTickToSecondsConverter(tempoEvents, ticksPerQuarter, secondsPerTick);

  const tracks = rawTracks
    .map((t) => ({ index: t.index, name: t.name, noteEvents: pairMidiNoteEvents(t.events, tickToSeconds) }))
    .filter((t) => t.noteEvents.length > 0);

  return { format, ticksPerQuarter, initialBpm, tracks };
}

// ── ノートイベント → 和音対応tokensへの変換 ──

// 同時刻（既定30ms以内）に開始する複数ノートを1つの和音グループへまとめる。
// グループの長さは、含まれる音のうち最も長く鳴っていたものを採用する
function groupMidiNotesIntoChords(noteEvents, opts) {
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

// 和音グループ列を、曲全体で共有する1つの拍グリッド（既定0.25拍刻み）へ
// 開始位置をスナップし、次のグループとの間隔から休符を判定する。
// js/music-hum.js の quantizeMelodyRhythm と同じ考え方を、単一MIDIではなく
// 和音（MIDI番号の配列）に対して行う（休符はmidis:null）
function quantizeMidiChordRhythm(groups, bpmValue, opts) {
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

// quantizeMidiChordRhythmが返した[{midis, beats}, ...]（休符はmidis:null）を、
// 楽器の音域へのオクターブシフト＋実際に選べる音へのスナップを経てtokens形式
// （[{notes:[{degree,accidental,octave}], beats}, ...]）にする。
// オクターブシフトは曲全体のすべての音をまとめて1回だけ計算する（和音の一部だけを
// 別のオクターブへ動かすと和音の音程関係が崩れるため）。和音内で複数のMIDI音が
// 同じ使用可能音へスナップした場合は、dedupeNotesで重複を取り除く
function mapMidiChordsToInstrument(chordTimeline, availableNotes) {
  if (!availableNotes.length) {
    return chordTimeline.map((g) => ({ notes: [], beats: g.beats }));
  }
  const allMidis = [];
  chordTimeline.forEach((g) => {
    if (g.midis) g.midis.forEach((m) => allMidis.push(m));
  });
  const shift = computeMelodyOctaveShift(allMidis, availableNotes);

  return chordTimeline.map((g) => {
    if (!g.midis) return { notes: [], beats: g.beats };
    const mappedNotes = g.midis.map((m) => pickNearestInstrumentNote(m + shift, availableNotes));
    return { notes: dedupeNotes(mappedNotes), beats: g.beats };
  });
}

// MIDIから抽出したノートイベント[{pitchMidi, startTimeSeconds, durationSeconds}, ...]を
// tokens形式に変換する（groupMidiNotesIntoChords → quantizeMidiChordRhythm →
// mapMidiChordsToInstrumentの3段階）
function convertMidiNoteEventsToScoreTokens(noteEvents, layout, bpmValue, opts) {
  const options = opts || {};
  const resolvedSemitoneEnabled = options.semitoneEnabled != null ? options.semitoneEnabled : typeof semitoneEnabled !== "undefined" && semitoneEnabled;
  const availableNotes = buildInstrumentNoteMap(layout, resolvedSemitoneEnabled);
  const groups = groupMidiNotesIntoChords(noteEvents, options.chord);
  const timeline = quantizeMidiChordRhythm(groups, bpmValue, options.rhythm);
  return mapMidiChordsToInstrument(timeline, availableNotes);
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

// 「解析して譜面にする」から呼ばれるMIDI専用の処理。js/music-hum.jsの
// onHumAnalyzeClickが、選択ファイルがMIDIと判定した場合にこの関数へ委譲する
async function onMidiFileAnalyze(blob, ctx) {
  const { setProgress, fail } = ctx;
  let parsed;
  try {
    setProgress(0.3, T("music_midi_progress_parsing", "MIDIファイルを解析中…"));
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

  document.getElementById("musicHumProgressRow").style.display = "none";

  if (parsed.tracks.length === 1) {
    finishMidiConversion(parsed, parsed.tracks[0].noteEvents, parsed.initialBpm);
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
      finishMidiConversion(parsed, parsed.tracks[idx].noteEvents, parsed.initialBpm);
    });
  });
  document.getElementById("musicMidiMergeAllBtn").onclick = () => {
    const merged = parsed.tracks.flatMap((t) => t.noteEvents);
    finishMidiConversion(parsed, merged, parsed.initialBpm);
  };
  document.getElementById("musicMidiTrackModal").style.display = "block";
}

function closeMidiTrackPickerModal() {
  document.getElementById("musicMidiTrackModal").style.display = "none";
  midiParsedResult = null;
}

// 選んだノートイベント（単一トラック or 全トラック結合）を実際にtokensへ変換し、
// 譜面へ反映する。テンポはMIDIファイル自身が持つ値をそのまま採用する
// （タイミング計算に使ったテンポと譜面のBPM表示を一致させるため。エディタ側で
// 既に設定していたBPMに合わせてしまうと、音の長さ(beats)の比率が原曲と変わってしまう）
function finishMidiConversion(parsed, noteEvents, sourceBpm) {
  const clampedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(sourceBpm || DEFAULT_BPM)));
  const inst = getInstrument(currentInstrumentId);
  const layout = getLayout(inst, currentLayoutId);
  const newTokens = convertMidiNoteEventsToScoreTokens(noteEvents, layout, clampedBpm, { semitoneEnabled });

  if (!newTokens.length) {
    document.getElementById("musicHumError").textContent = T("music_midi_no_notes", "このMIDIファイルには音が含まれていませんでした");
    document.getElementById("musicHumAnalyzeBtn").disabled = false;
    return;
  }

  bpm = clampedBpm;
  renderScoreMeta();
  closeMidiTrackPickerModal();
  applyGeneratedMelodyTokens(
    newTokens,
    T("music_midi_done_toast", "MIDIファイルから譜面を作成しました。金色の枠の音は自動変換です。タップして手直しできます")
  );
}

function bindMidiImportControls() {
  document.getElementById("musicMidiTrackCloseBtn").addEventListener("click", () => {
    closeMidiTrackPickerModal();
    document.getElementById("musicHumAnalyzeBtn").disabled = false;
    document.getElementById("musicHumProgressRow").style.display = "none";
  });
}
