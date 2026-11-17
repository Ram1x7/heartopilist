// js/music-presets.js
// 「楽譜」ページに最初から入っている、完成済みのサンプル楽譜（練習用）。
// 収録するのはパブリックドメインの伝承曲・童謡の旋律のみ（歌詞は含まない、
// メロディーのみを数字譜化したもの）。
// 「同時押し指定本数」等の変換設定とは無関係に、最初から演奏可能な状態の
// 譜面をユーザーの保存済み一覧(savedScores)へ初回だけ追加する。

const MUSIC_PRESET_SEEDED_KEY = "hatopiMusic_presetsSeeded_v1";

// 度数(1〜7)・長さ(拍。省略時1拍)・オクターブオフセット(省略時0)の並びから、
// 指定した基準オクターブ(baseOctave)を中心にtokensを組み立てる。
// [degree] / [degree, beats] / [degree, beats, octOffset] のいずれの形でも書ける
function buildPresetMelodyTokens(steps, baseOctave) {
  return steps.map(([degree, beats, octOffset]) => ({
    notes: [{ degree, accidental: null, octave: baseOctave + (octOffset || 0) }],
    beats: beats || 1,
  }));
}

// ── きらきら星（フランス民謡"Ah! vous dirai-je, maman"の旋律。パブリックドメイン）──
const PRESET_MELODY_KIRAKIRABOSHI = [
  [1], [1], [5], [5], [6], [6], [5, 2],
  [4], [4], [3], [3], [2], [2], [1, 2],
  [5], [5], [4], [4], [3], [3], [2, 2],
  [5], [5], [4], [4], [3], [3], [2, 2],
  [1], [1], [5], [5], [6], [6], [5, 2],
  [4], [4], [3], [3], [2], [2], [1, 2],
];

// ── かえるの合唱（フランス民謡"Frère Jacques"の旋律。パブリックドメイン）──
const PRESET_MELODY_KAERU = [
  [1], [2], [3], [1],
  [1], [2], [3], [1],
  [3], [4], [5, 2],
  [3], [4], [5, 2],
  [5], [6], [5], [4], [3], [1],
  [5], [6], [5], [4], [3], [1],
  [1], [5], [1, 2],
  [1], [5], [1, 2],
];

// ── ちょうちょ（ヨーロッパ民謡に基づく日本の唱歌の旋律。パブリックドメイン）──
const PRESET_MELODY_CHOCHO = [
  [5], [3], [5], [3],
  [5], [1], [2], [3],
  [4], [2], [3], [4],
  [5], [6], [7], [1, 1, 1], // オクターブ上の「ド」
  [5], [3], [5], [3],
  [5], [1], [2], [3],
  [4], [2], [3], [2],
  [1, 4],
];

// 各曲を「全てのキー配置」それぞれで再生可能な音域に収める基準オクターブ。
// ocarina(標準)は度数1-7がoct0、次オクターブの「ド」だけがoct1にあり、
// piano/guitarの2列・3列も同じ形（基準オクターブ全音+次オクターブの「ド」のみ）
// なので、旋律が「次オクターブの高いド」以外オクターブをまたがない今回の3曲は
// どの配置でもこのbaseOctaveだけで演奏可能になる
const PRESET_LAYOUTS = [
  { instrumentId: "ocarina", layoutId: "default", baseOctave: 0 },
  { instrumentId: "piano", layoutId: "2row", baseOctave: 1 },
  { instrumentId: "piano", layoutId: "3row", baseOctave: 1 },
  { instrumentId: "piano", layoutId: "22key", baseOctave: 0 },
];

const PRESET_SONGS = [
  {
    slug: "kirakiraboshi",
    nameKey: "music_preset_kirakiraboshi",
    nameFallback: "きらきら星",
    bpm: 100,
    timeSignatureId: "4/4",
    steps: PRESET_MELODY_KIRAKIRABOSHI,
  },
  {
    slug: "kaeru",
    nameKey: "music_preset_kaeru",
    nameFallback: "かえるの合唱",
    bpm: 108,
    timeSignatureId: "4/4",
    steps: PRESET_MELODY_KAERU,
  },
  {
    slug: "chocho",
    nameKey: "music_preset_chocho",
    nameFallback: "ちょうちょ",
    bpm: 96,
    timeSignatureId: "4/4",
    steps: PRESET_MELODY_CHOCHO,
  },
];

// 曲×キー配置の組み合わせぶん、保存済み譜面と同じ形のオブジェクトを組み立てる。
// idは固定（曲slug+楽器+配置から決定的に生成）にし、初回追加済みかどうかの
// 判定・重複追加の防止に使う。nameは表示言語が変わってもここでは翻訳せず
// （seedDefaultPresetScores実行時点ではi18nの読み込みが間に合っていない
// 場合があるため）日本語の元の名前をそのまま入れておき、実際の表示側
// （renderSavedList・loadScore）でnameKeyがあればその都度T()で翻訳し直す
function buildPresetScores() {
  const scores = [];
  PRESET_SONGS.forEach((song) => {
    PRESET_LAYOUTS.forEach((layout) => {
      scores.push({
        id: `preset-${song.slug}-${layout.instrumentId}-${layout.layoutId}`,
        name: song.nameFallback,
        nameKey: song.nameKey,
        instrumentId: layout.instrumentId,
        layoutId: layout.layoutId,
        semitoneEnabled: false,
        bpm: song.bpm,
        timeSignatureId: song.timeSignatureId,
        freeTiming: false,
        referenceBpm: song.bpm,
        tokens: buildPresetMelodyTokens(song.steps, layout.baseOctave),
        updatedAt: 0, // 一覧はupdatedAt降順のため、サンプル譜面は常に一番下に来るようにする
      });
    });
  });
  return scores;
}

// 初回のみ、上記のサンプル譜面をsavedScoresへ追加する（既に追加済みのidは
// スキップする）。ユーザーが後でサンプルを削除した場合はその選択を尊重し、
// MUSIC_PRESET_SEEDED_KEYが立っている限り再度追加はしない
function seedDefaultPresetScores() {
  if (localStorage.getItem(MUSIC_PRESET_SEEDED_KEY)) return;
  const existingIds = new Set(savedScores.map((s) => s.id));
  buildPresetScores().forEach((preset) => {
    if (!existingIds.has(preset.id)) savedScores.push(preset);
  });
  persistSavedScores();
  localStorage.setItem(MUSIC_PRESET_SEEDED_KEY, "1");
}
