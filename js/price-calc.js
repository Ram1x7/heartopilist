// 星2〜5の売価は、星1の値段を基準に自動計算する。
// 倍率は実データから逆算した値（星4・5系統は全サンプル完全一致、
// 星2・3系統はごく僅かな端数が出るため四捨五入で近似）。
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
    return Math.round(base * m);
  });
}

if(typeof module !== "undefined") module.exports = { PRICE_MULTIPLIERS, derivePrices };
