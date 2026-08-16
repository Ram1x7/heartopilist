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

// 度数1〜countのプレーンな1行を作る（半音なし）
function plainRow(octave, count) {
  const row = [];
  for (let d = 1; d <= count; d++) row.push({ degree: d, accidental: null, octave });
  return row;
}

// 度数1〜7 ＋ 次オクターブの1（実機の「15鍵(2列)」「22キー」の上段と同じ、8個の行）
function highRowWithExtra(octave) {
  return [...plainRow(octave, 7), { degree: 1, accidental: null, octave: octave + 1 }];
}

// 連続する音階をcols列ずつのグリッドに割り振る（実機の「15鍵(3列)」と同じ並び。
// 22キーとは独立した直線グリッドで、千鳥配置ではない）
function continuousGrid(startOctave, totalNotes, cols) {
  const flat = [];
  let deg = 1;
  let oct = startOctave;
  for (let i = 0; i < totalNotes; i++) {
    flat.push({ degree: deg, accidental: null, octave: oct });
    deg++;
    if (deg > 7) {
      deg = 1;
      oct++;
    }
  }
  const grid = [];
  for (let i = 0; i < flat.length; i += cols) grid.push(flat.slice(i, i + cols));
  return grid;
}

// ── 練習モードの演奏ボタン絶対座標 ──
// 実機の演奏画面スクリーンショット（1600×1118px、横画面）を基準解像度とし、
// ボタン座標はこの解像度に対する%で保持する。画面サイズ・アスペクト比が違う
// 端末でも、実機と同じ相対位置・大きさ（指の感覚）で表示できるようにするため。
const STAGE_REF_W = 1600;
const STAGE_REF_H = 1118;
const MAIN_BTN_SIZE_PCT = 5.56; // 画面幅に対するメインボタンの直径
const ACCIDENTAL_BTN_SIZE_PCT = MAIN_BTN_SIZE_PCT * 0.72; // 半音ボタンは実測でメインボタンの約72%

function toStagePct(xPx, yPx) {
  return { xPct: (xPx / STAGE_REF_W) * 100, yPct: (yPx / STAGE_REF_H) * 100 };
}

// notes配列（度数・臨時記号・オクターブ）と、対応するx座標(px)配列・共通y座標(px)から
// 座標つきの音配列を組み立てる
function withPositions(notes, xsPx, yPx, size) {
  return notes.map((note, i) => ({ ...note, ...toStagePct(xsPx[i], yPx), size }));
}

// 実機確認の結果、「22キー」と「15鍵(3列)」は物理ボタン配置が完全に同一（座標も一致）。
// 半音ON時のみ、隙間に半音ボタンが追加表示される
const POS_22KEY_TOP_X = [178, 355, 532, 710, 889, 1067, 1244, 1416];
const POS_22KEY_MID_X = [267, 446, 623, 800, 978, 1155, 1333];
const POS_22KEY_BOT_X = [267, 446, 623, 800, 978, 1155, 1333];

function build22KeyMainPositions() {
  return [
    ...withPositions(highRowWithExtra(1), POS_22KEY_TOP_X, 778, "main"),
    ...withPositions(plainRow(0, 7), POS_22KEY_MID_X, 907, "main"),
    ...withPositions(plainRow(-1, 7), POS_22KEY_BOT_X, 1035, "main"),
  ];
}

// 半音ボタン（度数1,2,4,5,6の♯のみ。ミ-ファ間・シ-ド間には黒鍵＝半音が無い）
function sharpsOfOctave(octave) {
  return [1, 2, 4, 5, 6].map((d) => ({ degree: d, accidental: "#", octave }));
}
const POS_SEMI_TOP_X = [266, 444, 800, 977, 1155];
const POS_SEMI_MID_X = [355, 535, 889, 1066, 1244];
const POS_SEMI_BOT_X = [355, 535, 889, 1066, 1244];

function build22KeySemitonePositions() {
  return [
    ...withPositions(sharpsOfOctave(1), POS_SEMI_TOP_X, 755, "accidental"),
    ...withPositions(sharpsOfOctave(0), POS_SEMI_MID_X, 890, "accidental"),
    ...withPositions(sharpsOfOctave(-1), POS_SEMI_BOT_X, 1015, "accidental"),
  ];
}

// 15鍵(2列)：上段8個・下段7個のみ（3段目なし）。y位置が22キーよりやや下寄り
const POS_2ROW_TOP_X = [179, 356, 533, 710, 888, 1065, 1243, 1423];
const POS_2ROW_BOT_X = [268, 446, 625, 798, 979, 1155, 1333];

function build15Key2RowPositions() {
  return [
    ...withPositions(highRowWithExtra(1), POS_2ROW_TOP_X, 899, "main"),
    ...withPositions(plainRow(0, 7), POS_2ROW_BOT_X, 1028, "main"),
  ];
}

// 15鍵(3列)：22キーとは独立した5列×3行の直線グリッド（千鳥配置ではない）。
// x座標は3段とも共通(444,622,799,977,1155px)
const POS_3ROW_X = [444, 622, 799, 977, 1155];
const POS_3ROW_Y = [781, 911, 1041];

function build15Key3RowPositions() {
  const rows = continuousGrid(1, 15, 5);
  return rows.flatMap((row, i) => withPositions(row, POS_3ROW_X, POS_3ROW_Y[i], "main"));
}

// 8鍵(2列)：オカリナ/ほら貝。千鳥配置ではない4列×2行の直線グリッド
const POS_8KEY_TOP_X = [534, 712, 890, 1068];
const POS_8KEY_BOT_X = [534, 712, 890, 1068];
const OCARINA_TOP_NOTES = [1, 2, 3, 4].map((d) => ({ degree: d, accidental: null, octave: 0 }));
const OCARINA_BOT_NOTES = [
  { degree: 5, accidental: null, octave: 0 },
  { degree: 6, accidental: null, octave: 0 },
  { degree: 7, accidental: null, octave: 0 },
  { degree: 1, accidental: null, octave: 1 },
];

function build8Key2RowPositions() {
  return [...withPositions(OCARINA_TOP_NOTES, POS_8KEY_TOP_X, 896, "main"), ...withPositions(OCARINA_BOT_NOTES, POS_8KEY_BOT_X, 1027, "main")];
}

// 楽器プロファイル（実機の演奏画面・設定画面で確認したボタン配置を再現）。
// ピアノ／ギター・ベースは複数の配置(layouts)を切り替えられる。
// ピアノの「22キー」のみ、半音(♯)あり/なしを切り替えるchromaticGridを持つ。
// gridは編集モードの数字譜入力用（画面幅に合わせて伸縮するボタン行）、
// positions/accidentalPositionsは練習モード用の実機座標（絶対配置）
const INSTRUMENTS = [
  {
    id: "ocarina",
    nameKey: "music_instr_ocarina",
    nameFallback: "オカリナ/ほら貝",
    layouts: [
      {
        id: "default",
        labelKey: "music_layout_default",
        labelFallback: "標準",
        grid: [OCARINA_TOP_NOTES, OCARINA_BOT_NOTES],
        positions: build8Key2RowPositions(),
      },
    ],
  },
  {
    id: "guitar",
    nameKey: "music_instr_guitar",
    nameFallback: "ギター/ベース",
    layouts: [
      {
        id: "2row",
        labelKey: "music_layout_2row",
        labelFallback: "15鍵（2列）",
        grid: [highRowWithExtra(1), plainRow(0, 7)],
        positions: build15Key2RowPositions(),
      },
      {
        id: "3row",
        labelKey: "music_layout_3row",
        labelFallback: "15鍵（3列）",
        // 22キーとは独立した5列×3行の直線グリッド（千鳥配置ではない）
        grid: continuousGrid(1, 15, 5),
        positions: build15Key3RowPositions(),
      },
    ],
  },
  {
    id: "piano",
    nameKey: "music_instr_piano",
    nameFallback: "ピアノ",
    layouts: [
      {
        id: "2row",
        labelKey: "music_layout_2row",
        labelFallback: "15鍵（2列）",
        grid: [highRowWithExtra(1), plainRow(0, 7)],
        positions: build15Key2RowPositions(),
      },
      {
        id: "3row",
        labelKey: "music_layout_3row",
        labelFallback: "15鍵（3列）",
        // 22キーとは独立した5列×3行の直線グリッド（千鳥配置ではない）
        grid: continuousGrid(1, 15, 5),
        positions: build15Key3RowPositions(),
      },
      {
        id: "22key",
        labelKey: "music_layout_22key",
        labelFallback: "22キー",
        grid: [highRowWithExtra(1), plainRow(0, 7), plainRow(-1, 7)],
        chromaticGrid: [buildPianoOctaveRow(1), buildPianoOctaveRow(0), buildPianoOctaveRow(-1)],
        positions: build22KeyMainPositions(),
        accidentalPositions: build22KeySemitonePositions(),
      },
    ],
  },
];

function getInstrument(id) {
  return INSTRUMENTS.find((i) => i.id === id) || INSTRUMENTS[0];
}

function getLayout(instrument, layoutId) {
  return instrument.layouts.find((l) => l.id === layoutId) || instrument.layouts[0];
}

// 音の長さプリセット（4分音符=1拍として計算する）
const DURATION_PRESETS = [
  { id: "sixteenth", beats: 0.25, labelKey: "music_dur_sixteenth", labelFallback: "16分" },
  { id: "eighth", beats: 0.5, labelKey: "music_dur_eighth", labelFallback: "8分" },
  { id: "dotted-eighth", beats: 0.75, labelKey: "music_dur_dotted_eighth", labelFallback: "付点8分" },
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
