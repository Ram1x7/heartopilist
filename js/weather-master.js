// js/weather-master.js
// 天気名マスターテーブル：ゲーム内アイコン／絵文字・出現判定用カテゴリ（晴れ/雨/虹）・
// i18nキーを一元管理する。js/data-weather.js の生データ（天気名の文字列）はこのテーブルを
// 介してのみ解釈し、図鑑（js/main.js）・出現カレンダー（同じくjs/main.js内）の
// 両方から参照する。
//
// gameIcon: js/icons.js の icon() に渡す名前（ICON_IMAGE_SRCで既存のゲーム内アイコン画像に
// 差し替え済みのもの）。晴れ・虹・雨・流星雨の4種のみ、以前から用意されている専用アイコンを使う。
// くもり・その他の天気は専用アイコン未提供のため、絵文字にフォールバックする
//（専用アイコンが用意され次第、ここにgameIconを追加するだけで済むようにしてある）。
//
// dexCategory: 既存の図鑑出現判定（c.weather配列、"晴れ"/"雨"/"虹"の3値のみ）に渡すための
// 粗いカテゴリ。流星雨・オーロラ・雪・猛暑・花吹雪など、出現条件データ側に存在しない特殊気象は
// 便宜上すべて「晴れ」（＝雨でも虹でもない）に丸めている。今後これらの天気で出現条件が
// 追加される場合は、ここにカテゴリを増やすのではなく、まずc.weather側の値域を確認すること。
//
// 天気名は今後増える可能性があるため、未知の名前が来てもUNKNOWN_WEATHERへ安全にフォールバックし、
// 表示が崩れないようにする（絵文字なし・翻訳キーなし＝生の文字列をそのまま表示）。
const WEATHER_MASTER = {
  "晴れ":     { emoji: "☀️", gameIcon: "weatherSun",     dexCategory: "晴れ", i18nKey: "weather_sunny" },
  // 「雨」単体は実データ(hourly)には出現しないが、天気手動入力（MANUAL_WEATHER_OPTIONS）の
  // 選択肢として存在するため、ここにも定義しておく
  "雨":       { emoji: "🌧️", gameIcon: "weatherRain",    dexCategory: "雨",   i18nKey: "weather_rain" },
  "くもり":   { emoji: "☁️", gameIcon: null,             dexCategory: "晴れ", i18nKey: "weather_cloudy" },
  "小雨":     { emoji: "🌧️", gameIcon: null,             dexCategory: "雨",   i18nKey: "weather_light_rain" },
  "大雨":     { emoji: "🌧️", gameIcon: null,             dexCategory: "雨",   i18nKey: "weather_heavy_rain" },
  "豪雨":     { emoji: "⛈️", gameIcon: null,             dexCategory: "雨",   i18nKey: "weather_storm" },
  "天気雨":   { emoji: "🌦️", gameIcon: null,             dexCategory: "雨",   i18nKey: "weather_sun_shower" },
  // 夜間の雨系。名称に反して出現判定上は「雨」カテゴリとして扱う（README/仕様書参照）
  "月雨":     { emoji: "🌙", gameIcon: null,             dexCategory: "雨",   i18nKey: "weather_moon_rain" },
  "虹":       { emoji: "🌈", gameIcon: "weatherRainbow", dexCategory: "虹",   i18nKey: "weather_rainbow" },
  "月虹":     { emoji: "🌈", gameIcon: "weatherRainbow", dexCategory: "虹",   i18nKey: "weather_moon_rainbow" },
  "流星雨":   { emoji: "☄️", gameIcon: "weatherMeteor",  dexCategory: "晴れ", i18nKey: "weather_meteor" },
  "流星雨1":  { emoji: "☄️", gameIcon: "weatherMeteor",  dexCategory: "晴れ", i18nKey: "weather_meteor" },
  "流星雨2":  { emoji: "☄️", gameIcon: "weatherMeteor",  dexCategory: "晴れ", i18nKey: "weather_meteor" },
  "流星雨3":  { emoji: "☄️", gameIcon: "weatherMeteor",  dexCategory: "晴れ", i18nKey: "weather_meteor" },
  // 以下は今回収集済みの2ヶ月（2026年9-10月）には未出現。元サイトの仕様上存在するため、
  // 名前が来ても表示だけは崩れないよう先に定義しておく（出現時期・出現条件は未確認）
  "オーロラ1": { emoji: "🌌", gameIcon: null, dexCategory: "晴れ", i18nKey: "weather_aurora" },
  "オーロラ2": { emoji: "🌌", gameIcon: null, dexCategory: "晴れ", i18nKey: "weather_aurora" },
  "オーロラ3": { emoji: "🌌", gameIcon: null, dexCategory: "晴れ", i18nKey: "weather_aurora" },
  "弱い雪":   { emoji: "❄️", gameIcon: null, dexCategory: "晴れ", i18nKey: "weather_light_snow" },
  "大雪":     { emoji: "❄️", gameIcon: null, dexCategory: "晴れ", i18nKey: "weather_heavy_snow" },
  "豪雪":     { emoji: "❄️", gameIcon: null, dexCategory: "晴れ", i18nKey: "weather_blizzard" },
  "猛暑":     { emoji: "🔥", gameIcon: null, dexCategory: "晴れ", i18nKey: "weather_heatwave" },
  "花吹雪":   { emoji: "🌸", gameIcon: null, dexCategory: "晴れ", i18nKey: "weather_sakura_blizzard" },
};

const UNKNOWN_WEATHER = { emoji: "", gameIcon: null, dexCategory: "晴れ", i18nKey: null };

function weatherInfo(name) {
  return WEATHER_MASTER[name] || UNKNOWN_WEATHER;
}

// 図鑑の出現判定（c.weather配列）に渡すためのカテゴリ（"晴れ"/"雨"/"虹"のいずれか）
function weatherDexCategory(name) {
  return weatherInfo(name).dexCategory;
}

// 天気名の絵文字（マスター未登録の名前は空文字）
function weatherEmoji(name) {
  return weatherInfo(name).emoji;
}

// 天気名のi18nキー（マスター未登録の名前はnull＝呼び出し側は生の名前をそのまま表示すること）
function weatherI18nKey(name) {
  return weatherInfo(name).i18nKey;
}

// ゲーム内アイコン画像は絵柄の周囲に余白があり、絵文字と同じpx指定では小さく見えるため、
// 見た目のサイズを絵文字にそろえるための拡大率（実測: 絵文字は字送り箱をほぼ埋めるのに対し、
// 現状のアイコン画像は中央の絵柄が箱の約6割程度しかない）
const WEATHER_ICON_IMG_SCALE = 1.4;

// 天気名に対応するHTML（アイコンまたは絵文字）を返す。晴れ/虹/雨/流星雨(1-3含む)は
// 既存のゲーム内アイコン画像（js/icons.js）を、それ以外は絵文字にフォールバックする。
// opts.sizeは「絵文字として見えるサイズ」の指定。アイコン画像側は見た目をそろえるため
// 内部で拡大して描画する。
// ブラウザ環境（window.icon）専用
function weatherIconHTML(name, opts) {
  const info = weatherInfo(name);
  const size = (opts && opts.size) || 13;
  if (info.gameIcon && typeof window !== "undefined" && typeof window.icon === "function") {
    return `${window.icon(info.gameIcon, { size: Math.round(size * WEATHER_ICON_IMG_SCALE) })} `;
  }
  return info.emoji ? `<span style="font-size:${size}px;line-height:1;">${info.emoji}</span> ` : "";
}

// 流星雨1/2/3・流星雨（無印）をまとめて判定するためのヘルパー
function isMeteorWeather(name) {
  return typeof name === "string" && name.startsWith("流星雨");
}

function isRainbowWeather(name) {
  return name === "虹" || name === "月虹";
}

// 6時間ウィンドウの「本当の」天気（晴れ/雨/虹/流星雨の4択のみ）。
// くもり・小雨・大雨・豪雨・天気雨・月雨・月虹などは、これら4つのいずれかを構成する
// バリエーションに過ぎないため、ここで畳み込む。「今：/次：」の表示と図鑑の出現判定は
// 常にこの4値経由で行うこと（1時間ごとの内訳表示にはこの関数を使わない）
function weatherWindowCategory(name) {
  if (isMeteorWeather(name)) return "流星雨";
  return weatherDexCategory(name);
}

// tools/validate-weather-data.js（Node）から読み込めるようにする
if (typeof module !== "undefined") {
  module.exports = { WEATHER_MASTER, weatherInfo, weatherDexCategory, weatherEmoji, weatherI18nKey, weatherIconHTML, isMeteorWeather, isRainbowWeather, weatherWindowCategory };
}
