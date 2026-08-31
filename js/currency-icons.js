// 通貨アイコン（コイン・願い星）を文字列表記の直前に挿入する共通ヘルパー
// ※このコインはshop.htmlの「トレンドコイン」とは別の通貨のため、
//   「トレンドコイン」表記には反応しないようにしている

const CURRENCY_ICON_SRC = {
  coin: "images/currency/coin.png",
  negaiboshi: "images/currency/negaiboshi.png",
  fescoin: "images/currency/fescoin.png",
  azuki: "images/currency/azuki.png",
  chef_salad: "images/currency/chef_salad.png",
  coffee_mame: "images/currency/coffee_mame.png",
  heart_ishi: "images/currency/heart_ishi.png",
  hiryo: "images/currency/hiryo.png",
  ine_seed: "images/currency/ine_seed.png",
  kawaii_panda: "images/currency/kawaii_panda.png",
  kuro_panda: "images/currency/kuro_panda.png",
  muku_hotaruishi: "images/currency/muku_hotaruishi.png",
  niji_hanabi: "images/currency/niji_hanabi.png",
  niku: "images/currency/niku.png",
  rainbow_powder: "images/currency/rainbow_powder.png",
  ringo: "images/currency/ringo.png",
  ryoshitsu_mokuzai: "images/currency/ryoshitsu_mokuzai.png",
  senshokuzai: "images/currency/senshokuzai.png",
  shuribako: "images/currency/shuribako.png",
  teiboku_eda: "images/currency/teiboku_eda.png",
  tsuki_houseki: "images/currency/tsuki_houseki.png",
  tsurutsuru_oak: "images/currency/tsurutsuru_oak.png",
};

function currencyIcon(type) {
  const src = CURRENCY_ICON_SRC[type];
  if (!src) return "";
  return `<img src="${src}" class="currency-icon" alt="" loading="lazy">`;
}

function injectCurrencyIcons(text) {
  if (!text) return text;
  return text
    .replace(/フェスコイン/g, `${currencyIcon("fescoin")}フェスコイン`)
    .replace(/(?<!トレンド)(?<!フェス)コイン/g, `${currencyIcon("coin")}コイン`)
    .replace(/願い星/g, `${currencyIcon("negaiboshi")}願い星`)
    .replace(/シェフ特製サラダ/g, `${currencyIcon("chef_salad")}シェフ特製サラダ`)
    .replace(/コーヒー豆/g, `${currencyIcon("coffee_mame")}コーヒー豆`)
    .replace(/ハート石/g, `${currencyIcon("heart_ishi")}ハート石`)
    .replace(/稲の種/g, `${currencyIcon("ine_seed")}稲の種`)
    .replace(/可愛いパンダのシャボン玉液/g, `${currencyIcon("kawaii_panda")}可愛いパンダのシャボン玉液`)
    .replace(/黒顔パンダのシャボン玉液/g, `${currencyIcon("kuro_panda")}黒顔パンダのシャボン玉液`)
    .replace(/無垢な蛍石/g, `${currencyIcon("muku_hotaruishi")}無垢な蛍石`)
    .replace(/虹の花火ツリー/g, `${currencyIcon("niji_hanabi")}虹の花火ツリー`)
    .replace(/レインボー育成パウダー/g, `${currencyIcon("rainbow_powder")}レインボー育成パウダー`)
    .replace(/良質木材/g, `${currencyIcon("ryoshitsu_mokuzai")}良質木材`)
    .replace(/染色剤/g, `${currencyIcon("senshokuzai")}染色剤`)
    .replace(/修理箱/g, `${currencyIcon("shuribako")}修理箱`)
    .replace(/低木の枝/g, `${currencyIcon("teiboku_eda")}低木の枝`)
    .replace(/月の水晶/g, `${currencyIcon("tsuki_houseki")}月の水晶`)
    .replace(/ツルツルオーク/g, `${currencyIcon("tsurutsuru_oak")}ツルツルオーク`)
    .replace(/あずき/g, `${currencyIcon("azuki")}あずき`)
    .replace(/肥料/g, `${currencyIcon("hiryo")}肥料`)
    .replace(/肉/g, `${currencyIcon("niku")}肉`)
    .replace(/りんご/g, `${currencyIcon("ringo")}りんご`);
}

window.currencyIcon = currencyIcon;
window.injectCurrencyIcons = injectCurrencyIcons;
