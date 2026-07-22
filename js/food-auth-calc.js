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
 *
 * ── 分解機能 ──
 * ・素材名が foodsData 内の別の料理名と一致する場合（中間素材）、
 *   「分解して計算」を有効にすると、その料理自体のレシピに基づいて
 *   素の素材まで展開して不足数を計算できる。
 * ・「〜ならなんでもOK」系はレシピが特定できないため、分解を有効にすると
 *   自由入力欄（名称・個数を手入力）に切り替わる。
 * ・分解のON/OFFは素材ごとにトグルでき、状態は localStorage に保存される。
 */

const FOOD_INVENTORY_KEY   = "food_material_inventory";  // { 素材名: 所持数 }
const FOOD_CALC_STATE_KEY  = "food_auth_calc_state";      // { foodName, madeCount }
const FOOD_BREAKDOWN_KEY   = "food_auth_calc_breakdown";  // { [food.name + "::" + materialKey]: true/false }
const FOOD_FREEFORM_KEY    = "food_auth_calc_freeform";   // { [food.name + "::" + materialKey]: [{name, qty, have}, ...] }

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

// ── 分解ON/OFF状態の保存 ──
function loadBreakdownState(){
  try {
    return JSON.parse(localStorage.getItem(FOOD_BREAKDOWN_KEY) || "{}");
  } catch(e){ return {}; }
}
function saveBreakdownState(state){
  localStorage.setItem(FOOD_BREAKDOWN_KEY, JSON.stringify(state));
}
function isBreakdownOn(foodName, materialKey){
  const state = loadBreakdownState();
  return !!state[foodName + "::" + materialKey];
}
function setBreakdownOn(foodName, materialKey, on){
  const state = loadBreakdownState();
  state[foodName + "::" + materialKey] = !!on;
  saveBreakdownState(state);
}

// ── 自由入力欄（なんでもOK系の分解時に使う手入力パーツ）の保存 ──
// { [food.name + "::" + materialKey]: [{ name, qty, have }, ...] }
function loadFreeform(){
  try {
    return JSON.parse(localStorage.getItem(FOOD_FREEFORM_KEY) || "{}");
  } catch(e){ return {}; }
}
function saveFreeform(state){
  localStorage.setItem(FOOD_FREEFORM_KEY, JSON.stringify(state));
}
function getFreeformParts(foodName, materialKey){
  const state = loadFreeform();
  const k = foodName + "::" + materialKey;
  return state[k] || [];
}
function setFreeformParts(foodName, materialKey, parts){
  const state = loadFreeform();
  const k = foodName + "::" + materialKey;
  state[k] = parts;
  saveFreeform(state);
}

// ── 「なんでもOK」系判定 ──
function isFreeCategoryMaterial(name){
  return typeof name === "string" && name.includes("なんでもOK");
}

// ── 素材名から中間素材となる料理データを検索 ──
// "ティラミス(@300)" のような表記から、括弧の価格表記を除いた名前で
// foodsData 内を検索する。完全一致優先、なければ前方一致を試みる。
function findRecipeForMaterial(materialName){
  if(!materialName) return null;
  const bareName = materialName.replace(/[（(].*?[）)]/g, "").trim();
  let recipe = foodsData.find(f => f.name === materialName);
  if(!recipe) recipe = foodsData.find(f => f.name === bareName);
  if(!recipe){
    recipe = foodsData.find(f => bareName && bareName.startsWith(f.name));
  }
  return recipe || null;
}

// ── 認証マスター対象の料理一覧を取得（authTargetが数値のもの）──
function getAuthTargetFoods(){
  return foodsData.filter(f => typeof f.authTarget === "number" && f.authTarget > 0);
}

// ── 単一素材の「分解」結果を計算 ──
// need: この中間素材が何個必要か（不足数ベース）
// 戻り値: { isFreeform, parts: [...], recipe }
function calcBreakdownForMaterial(foodName, materialKey, materialName, need){
  if(isFreeCategoryMaterial(materialName)){
    const parts = getFreeformParts(foodName, materialKey);
    const enriched = parts.map((p, i) => ({
      index: i,
      name: p.name || "",
      qty: Math.max(0, Math.floor(p.qty) || 0),
      have: Math.max(0, Math.floor(p.have) || 0),
    }));
    return { isFreeform: true, parts: enriched, recipe: null };
  }

  const recipe = findRecipeForMaterial(materialName);
  if(!recipe){
    return { isFreeform: false, parts: [], recipe: null };
  }

  const agg = getAggregatedMaterials(recipe);
  const imgMap = {};
  (recipe.materials || []).forEach((raw, i) => {
    if(!raw) return;
    const img = recipe.materials_image && recipe.materials_image[i] ? recipe.materials_image[i].image : null;
    if(img) imgMap[raw] = img;
  });

  const parts = Object.keys(agg).map(key => {
    const { name, qty } = agg[key];
    const partNeed = need * qty;
    const have = getInventoryQty(key);
    const short = Math.max(0, partNeed - have);
    return { key, name, image: imgMap[key] || null, perDish: qty, need: partNeed, have, short };
  });

  return { isFreeform: false, parts, recipe };
}

// ── 計算結果 ──
// 戻り値: { remaining, materials: [{ key, name, image, need, have, short, breakdownAvailable, breakdownOn, breakdown }] }
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

    const isFree = isFreeCategoryMaterial(name);
    const recipe = isFree ? null : findRecipeForMaterial(name);
    const breakdownAvailable = isFree || !!recipe;
    const breakdownOn = breakdownAvailable && isBreakdownOn(food.name, key);

    let breakdown = null;
    if(breakdownOn){
      breakdown = calcBreakdownForMaterial(food.name, key, name, short);
    }

    return {
      key, name, image: imgMap[key] || null,
      perDish: qty, need, have, short,
      breakdownAvailable, breakdownOn, breakdown,
    };
  });

  return { target, made, remaining, materials };
}
