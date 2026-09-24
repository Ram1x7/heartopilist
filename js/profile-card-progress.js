// js/profile-card-progress.js
// プロフィールカードメーカー：図鑑・料理・園芸・実績の進捗集計。
// js/main.jsのgetStats()と同じlocalStorageキー・同じ集計ルールを、
// このページ単体（main.js非読み込み）でも成立するよう独立実装している。
// 依存データ配列（このページのHTMLで読み込み済みが前提）：
//   fishData, bugData, birdData, sandData, snowData, shellData,
//   foodsData, cropData, flowerData, achievementsData

// カテゴリ定義（表示候補の全量。並び順はUIの選択肢表示順にも使う）
const PROFILE_CARD_CATEGORIES = [
  { id: "fish",        label: "魚",       icon: "fish",       kind: "creature", type: "fish" },
  { id: "bug",         label: "虫",       icon: "bug",         kind: "creature", type: "bug" },
  { id: "bird",        label: "野鳥",     icon: "bird",        kind: "creature", type: "bird" },
  { id: "shell",       label: "貝殻",     icon: "shell",       kind: "creature", type: "shell" },
  { id: "sand",        label: "砂浜採集", icon: "sand",        kind: "creature", type: "sand" },
  { id: "snow",        label: "雪原採集", icon: "snow",        kind: "creature", type: "snow" },
  { id: "food",        label: "料理",     icon: "ingredient",  kind: "food" },
  { id: "garden",      label: "園芸",     icon: "sprout",      kind: "garden" },
  { id: "achievement", label: "実績",     icon: "medal",       kind: "achievement" },
];
const PROFILE_CARD_DEFAULT_CATEGORY_IDS = ["fish", "bug", "bird", "shell", "food", "garden"];

function profileCardSafeJsonParse(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch (e) {
    console.warn(`[profile-card] localStorage["${key}"]の読み込みに失敗しました。空データとして扱います`, e);
    return {};
  }
}

// 「星5取得数+認証取得数」「星5対象数+認証対象数」を合算する（auth:falseの項目は認証側の分母・分子から除外）
function profileCardCombineStat(items, checkedMap, authMap) {
  const total = items.length;
  const done = items.filter(x => checkedMap[x.name]).length;
  const authEligible = items.filter(x => x.auth !== false);
  const authTotal = authEligible.length;
  const authDone = authEligible.filter(x => authMap[x.name]).length;
  return { done: done + authDone, total: total + authTotal };
}

function profileCardPct(stat) {
  if (!stat || stat.total <= 0) return 0;
  return (stat.done / stat.total) * 100; // 丸めはUI側（表示直前）で行う
}

// 図鑑・料理・園芸・実績の全カテゴリ分の{done,total}を計算して返す
function computeProfileCardStats() {
  const checkedData = profileCardSafeJsonParse("checkedData");
  const authData = profileCardSafeJsonParse("authData");
  const foodChecked = profileCardSafeJsonParse("food_checked");
  const foodAuth = profileCardSafeJsonParse("food_auth");
  const gardenChecked = profileCardSafeJsonParse("garden_checked");
  const gardenAuth = profileCardSafeJsonParse("garden_auth");
  const achievementObtained = profileCardSafeJsonParse("achievement_obtained");

  const creatureArraysByType = {
    fish:  typeof fishData  !== "undefined" ? fishData  : [],
    bug:   typeof bugData   !== "undefined" ? bugData   : [],
    bird:  typeof birdData  !== "undefined" ? birdData  : [],
    sand:  typeof sandData  !== "undefined" ? sandData  : [],
    snow:  typeof snowData  !== "undefined" ? snowData  : [],
    shell: typeof shellData !== "undefined" ? shellData : [],
  };

  const stats = {};
  for (const type of Object.keys(creatureArraysByType)) {
    stats[type] = profileCardCombineStat(creatureArraysByType[type], checkedData, authData);
  }

  const foodAll = typeof foodsData !== "undefined" ? foodsData : [];
  stats.food = profileCardCombineStat(foodAll, foodChecked, foodAuth);

  const cropAll = typeof cropData !== "undefined" ? cropData : [];
  const flowerAll = typeof flowerData !== "undefined" ? flowerData : [];
  const cropStat = profileCardCombineStat(cropAll, gardenChecked, gardenAuth);
  const flowerStat = profileCardCombineStat(flowerAll, gardenChecked, gardenAuth);
  stats.garden = { done: cropStat.done + flowerStat.done, total: cropStat.total + flowerStat.total };

  const achAll = typeof achievementsData !== "undefined" ? achievementsData : [];
  const achDone = achAll.filter(a => achievementObtained[a.id]).length;
  stats.achievement = { done: achDone, total: achAll.length };

  return stats;
}

// 指定したカテゴリID配列の合計{done,total}
function sumProfileCardStats(stats, categoryIds) {
  let done = 0, total = 0;
  categoryIds.forEach(id => {
    const s = stats[id];
    if (!s) return;
    done += s.done;
    total += s.total;
  });
  return { done, total };
}

function profileCardCategoryDef(id) {
  return PROFILE_CARD_CATEGORIES.find(c => c.id === id) || null;
}
