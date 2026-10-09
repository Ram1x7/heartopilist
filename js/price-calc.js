// 星2〜5の売価は、星1の値段を基準に自動計算する。
// 倍率は実データから逆算した値（星4・5系統は全サンプル完全一致）。
// 星2・3系統で端数が出る場合、ユーザーの実データ確認により四捨五入ではなく
// 切り捨てが正しいと判明した（例：★1=55→★2=82.5→82、★1=45→★2=67.5→67）。
// js/main.jsのcalcStars()（魚・虫・野鳥用）も同じ切り捨てルールを使用している
const PRICE_MULTIPLIERS = {
  food: [1, 1.5, 2, 4, 8],
  crop: [1, 1.34, 1.67, 2, 3],
  flower: [1, 1.5, 2, 2.5, 4],
};

// base: 星1の価格, kind: "food" | "crop" | "flower", rarity: [true,false,...] 省略時は全て星5まであり
function derivePrices(base, kind, rarity){
  const multipliers = PRICE_MULTIPLIERS[kind];
  return multipliers.map((m, i) => {
    if(rarity && !rarity[i]) return null;
    return Math.floor(base * m);
  });
}

if(typeof module !== "undefined") module.exports = { PRICE_MULTIPLIERS, derivePrices };
