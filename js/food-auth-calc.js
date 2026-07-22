/**
 * food-auth-calc.js
 * 認証マスター計算ツール
 *
 * ・料理を選ぶと authTarget（認証マスターに必要な累計作成数）と
 *   現在作成済み数から「残り皿数」を算出する
 * ・素材の所持数はグローバルな在庫（localStorage）として保存し、
 *   どの料理を選んでも自動で反映される
 * ・「素材(×2)」のような倍数表記に対応
 * ・「〜ならなんでもOK」系はカテゴリ枠として1つの在庫項目として扱う
 */

const FOOD_INVENTORY_KEY  = "food_material_inventory"; // { 素材名: 所持数 }
const FOOD_CALC_STATE_KEY = "food_auth_calc_state";     // { foodName, madeCount }

// ── 素材文字列の解析 ──
// "コーヒー豆×2(@50×2)" → { name: "コーヒー豆", qty: 2 }
// "トマト(種@10)"        → { name: "トマト(種@10)", qty: 1 }  ※括弧はそのまま素材キーとして扱う
// ""                      → null（未使用スロット）
function parseMaterialEntry(raw){
  if(!raw) return null;
  const m = raw.match(/^(.*?)×(\d+)(\(.*\))?$/);
  if(m){
    const base = m[1];
    const qty  = parseInt(m[2], 10);
    const suffix = m[3] || "";
    return { key: raw, name: base + suffix, qty };
  }
  return { key: raw, name: raw, qty: 1 };
}

// 料理の素材リストを集約（同名素材が複数スロットに出る場合は数量を合算）
function getAggregatedMaterials(food){
  const list = food.materials || [];
  const agg = {}; // key(元の文字列) -> { name, qty }
  list.forEach(raw => {
    const parsed = parseMaterialEntry(raw);
    if(!parsed) return;
    if(!agg[parsed.key]){
      agg[parsed.key] = { name: parsed.name, qty: 0 };
    }
    agg[parsed.key].qty += parsed.qty;
  });
  return agg; // { "コーヒー豆×2(@50×2)": {name:"コーヒー豆(@50×2)", qty:2}, ... }
}

// ── グローバル素材在庫 ──
function loadInventory(){
  try {
    return JSON.parse(localStorage.getItem(FOOD_INVENTORY_KEY) || "{}");
  } catch(e){ return {}; }
}
function saveInventory(inv){
  localStorage.setItem(FOOD_INVENTORY_KEY, JSON.stringify(inv));
}
function getInventoryQty(materialKey){
  const inv = loadInventory();
  return inv[materialKey] != null ? inv[materialKey] : 0;
}
function setInventoryQty(materialKey, qty){
  const inv = loadInventory();
  inv[materialKey] = Math.max(0, Math.floor(qty) || 0);
  saveInventory(inv);
}

// ── 計算状態（選択中の料理・作成済み数）の保存 ──
function loadCalcState(){
  try {
    return JSON.parse(localStorage.getItem(FOOD_CALC_STATE_KEY) || "{}");
  } catch(e){ return {}; }
}
function saveCalcState(state){
  localStorage.setItem(FOOD_CALC_STATE_KEY, JSON.stringify(state));
}

// ── 認証マスター対象の料理一覧を取得（authTargetが数値のもの）──
function getAuthTargetFoods(){
  return foodsData.filter(f => typeof f.authTarget === "number" && f.authTarget > 0);
}

// ── 計算結果 ──
// 戻り値: { remaining, materials: [{ key, name, image, need, have, short }] }
function calcAuthProgress(food, madeCount){
  const target    = food.authTarget || 0;
  const made      = Math.max(0, Math.floor(madeCount) || 0);
  const remaining = Math.max(0, target - made);

  const agg = getAggregatedMaterials(food);
  const imgMap = {}; // key -> image
  (food.materials || []).forEach((raw, i) => {
    if(!raw) return;
    const img = food.materials_image && food.materials_image[i] ? food.materials_image[i].image : null;
    if(img) imgMap[raw] = img;
  });

  const materials = Object.keys(agg).map(key => {
    const { name, qty } = agg[key];
    const need = remaining * qty;
    const have = getInventoryQty(key);
    const short = Math.max(0, need - have);
    return { key, name, image: imgMap[key] || null, perDish: qty, need, have, short };
  });

  return { target, made, remaining, materials };
}
