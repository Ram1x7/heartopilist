// 通貨アイコン（コイン・願い星）を文字列表記の直前に挿入する共通ヘルパー
// ※このコインはshop.htmlの「トレンドコイン」とは別の通貨のため、
//   「トレンドコイン」表記には反応しないようにしている

const CURRENCY_ICON_SRC = {
  coin: "images/currency/coin.png",
  negaiboshi: "images/currency/negaiboshi.png",
  fescoin: "images/currency/fescoin.png",
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
    .replace(/願い星/g, `${currencyIcon("negaiboshi")}願い星`);
}

window.currencyIcon = currencyIcon;
window.injectCurrencyIcons = injectCurrencyIcons;
