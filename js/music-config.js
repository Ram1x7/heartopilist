// js/music-config.js
// 「楽譜」ページ（music.html）で使う楽器プロファイル・音楽データ定義
// ゲーム内の演奏画面のボタン配置（実機スクリーンショットで確認済み）を再現する。
// 記譜は数字譜（簡譜）、ハ長調基準：1〜7 = ド レ ミ ファ ソ ラ シ

const DEGREE_LABELS = { 1: "ド", 2: "レ", 3: "ミ", 4: "ファ", 5: "ソ", 6: "ラ", 7: "シ" };

// 各度数の、Cを0とした半音オフセット
const DEGREE_SEMITONES = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11 };

const ACCIDENTAL_SEMITONE_OFFSET = { "#": 1, "b": -1, natural: 0 };

// オクターブ0・度数1（ド）を middle C 相当とする
const BASE_FREQ = 261.63;

// 音1つぶんの周波数(Hz)を計算する
function noteFrequency(note) {
  const semis = DEGREE_SEMITONES[note.degree] + (ACCIDENTAL_SEMITONE_OFFSET[note.accidental] || 0);
  return BASE_FREQ * Math.pow(2, note.octave + semis / 12);
}

// 音の同一性判定・保存キー用の文字列
function noteKey(note) {
  return `${note.degree}_${note.accidental || ""}_${note.octave}`;
}

function notesEqual(a, b) {
  return !!a && !!b && a.degree === b.degree && (a.accidental || null) === (b.accidental || null) && a.octave === b.octave;
}

// 数字譜の表示文字列（臨時記号＋度数＋オクターブの点）を組み立てる。
// オクターブの点はUnicode結合文字（上の点/下の点）を使い、実機の表記に近づける
function noteDisplayDigit(note) {
  const acc = note.accidental === "#" ? "♯" : note.accidental === "b" ? "♭" : note.accidental === "natural" ? "♮" : "";
  let dots = "";
  if (note.octave > 0) dots = "̇".repeat(note.octave);
  else if (note.octave < 0) dots = "̣".repeat(-note.octave);
  return `${acc}${note.degree}${dots}`;
}

// 1オクターブぶんのピアノ鍵盤配列を組み立てる（度数7個＋♯5個を実際の鍵盤位置に挟み込み、
// 最後に次オクターブの頭を1音だけ足す。ミ→ファ、シ→ドの間には黒鍵が無い実際のピアノに合わせる）
function buildPianoOctaveRow(octave) {
  const row = [];
  for (let d = 1; d <= 7; d++) {
    row.push({ degree: d, accidental: null, octave });
    if (d === 1 || d === 2 || d === 4 || d === 5 || d === 6) {
      row.push({ degree: d, accidental: "#", octave });
    }
  }
  row.push({ degree: 1, accidental: null, octave: octave + 1 });
  return row;
}

// 楽器プロファイル（実機の演奏画面と同じボタン配置）
const INSTRUMENTS = [
  {
    id: "ocarina",
    nameKey: "music_instr_ocarina",
    nameFallback: "オカリナ/ほら貝",
    chromatic: false,
    grid: [
      [{ degree: 1, accidental: null, octave: 0 }, { degree: 2, accidental: null, octave: 0 }, { degree: 3, accidental: null, octave: 0 }, { degree: 4, accidental: null, octave: 0 }],
      [{ degree: 5, accidental: null, octave: 0 }, { degree: 6, accidental: null, octave: 0 }, { degree: 7, accidental: null, octave: 0 }, { degree: 1, accidental: null, octave: 1 }],
    ],
  },
  {
    id: "guitar",
    nameKey: "music_instr_guitar",
    nameFallback: "ギター/ベース",
    chromatic: false,
    grid: [
      [{ degree: 1, accidental: null, octave: 0 }, { degree: 2, accidental: null, octave: 0 }, { degree: 3, accidental: null, octave: 0 }, { degree: 4, accidental: null, octave: 0 }, { degree: 5, accidental: null, octave: 0 }],
      [{ degree: 6, accidental: null, octave: 0 }, { degree: 7, accidental: null, octave: 0 }, { degree: 1, accidental: null, octave: 1 }, { degree: 2, accidental: null, octave: 1 }, { degree: 3, accidental: null, octave: 1 }],
      [{ degree: 4, accidental: null, octave: 1 }, { degree: 5, accidental: null, octave: 1 }, { degree: 6, accidental: null, octave: 1 }, { degree: 7, accidental: null, octave: 1 }, { degree: 1, accidental: null, octave: 2 }],
    ],
  },
  {
    id: "piano",
    nameKey: "music_instr_piano",
    nameFallback: "ピアノ",
    chromatic: true,
    grid: [buildPianoOctaveRow(1), buildPianoOctaveRow(0), buildPianoOctaveRow(-1)],
  },
];

function getInstrument(id) {
  return INSTRUMENTS.find((i) => i.id === id) || INSTRUMENTS[0];
}

// 音の長さプリセット（4分音符=1拍として計算する）
const DURATION_PRESETS = [
  { id: "eighth", beats: 0.5, labelKey: "music_dur_eighth", labelFallback: "8分" },
  { id: "quarter", beats: 1, labelKey: "music_dur_quarter", labelFallback: "4分" },
  { id: "dotted-quarter", beats: 1.5, labelKey: "music_dur_dotted_quarter", labelFallback: "付点4分" },
  { id: "half", beats: 2, labelKey: "music_dur_half", labelFallback: "2分" },
  { id: "dotted-half", beats: 3, labelKey: "music_dur_dotted_half", labelFallback: "付点2分" },
  { id: "whole", beats: 4, labelKey: "music_dur_whole", labelFallback: "全音符" },
];

function getDuration(id) {
  return DURATION_PRESETS.find((d) => d.id === id) || DURATION_PRESETS[1];
}

const DEFAULT_BPM = 100;
const MIN_BPM = 40;
const MAX_BPM = 220;

// 拍子プリセット（beatsPerBarは4分音符=1拍換算での1小節あたりの拍数。
// 例えば6/8は8分音符6つ=4分音符換算で3拍として小節線の位置を計算する）
const TIME_SIGNATURES = [
  { id: "4/4", label: "4/4", beatsPerBar: 4 },
  { id: "3/4", label: "3/4", beatsPerBar: 3 },
  { id: "2/4", label: "2/4", beatsPerBar: 2 },
  { id: "2/2", label: "2/2", beatsPerBar: 4 },
  { id: "6/8", label: "6/8", beatsPerBar: 3 },
  { id: "3/8", label: "3/8", beatsPerBar: 1.5 },
];
const DEFAULT_TIME_SIGNATURE_ID = "4/4";

function getTimeSignature(id) {
  return TIME_SIGNATURES.find((t) => t.id === id) || TIME_SIGNATURES[0];
}
