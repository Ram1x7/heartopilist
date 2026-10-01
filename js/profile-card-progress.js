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
  { id: "sand",        label: "砂像",     icon: "sand",        kind: "creature", type: "sand" },
  { id: "snow",        label: "雪像",     icon: "snow",        kind: "creature", type: "snow" },
  { id: "food",        label: "料理",     icon: "ingredient",  kind: "food" },
  { id: "garden",      label: "園芸",     icon: "sprout",      kind: "garden" },
  { id: "achievement", label: "実績",     icon: "medal",       kind: "achievement", starLabel: "獲得数" },
];
const PROFILE_CARD_DEFAULT_CATEGORY_IDS = ["fish", "bug", "bird", "shell", "food", "garden", "snow", "sand"];

function profileCardSafeJsonParse(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch (e) {
    console.warn(`[profile-card] localStorage["${key}"]の読み込みに失敗しました。空データとして扱います`, e);
    return {};
  }
}

// 星5進捗・認証進捗をそれぞれ分けて返す（auth:falseの項目は認証側の分母・分子から除外）
function profileCardSplitStat(items, checkedMap, authMap) {
  const starTotal = items.length;
  const starDone = items.filter(x => checkedMap[x.name]).length;
  const authEligible = items.filter(x => x.auth !== false);
  const authTotal = authEligible.length;
  const authDone = authEligible.filter(x => authMap[x.name]).length;
  return { starDone, starTotal, authDone, authTotal };
}

// 「星5取得数+認証取得数」「星5対象数+認証対象数」を合算する（カード本体の表示用）
function profileCardCombineStat(items, checkedMap, authMap) {
  const s = profileCardSplitStat(items, checkedMap, authMap);
  return { done: s.starDone + s.authDone, total: s.starTotal + s.authTotal };
}

function profileCardPct(stat) {
  if (!stat || stat.total <= 0) return 0;
  return (stat.done / stat.total) * 100; // 丸めはUI側（表示直前）で行う
}

// computeProfileCardStats()／computeProfileCardStatsDetailed()共通：
// カテゴリごとの元データ配列とlocalStorageのチェック状態をまとめて読み込む
function collectProfileCardSourceData() {
  return {
    checkedData: profileCardSafeJsonParse("checkedData"),
    authData: profileCardSafeJsonParse("authData"),
    foodChecked: profileCardSafeJsonParse("food_checked"),
    foodAuth: profileCardSafeJsonParse("food_auth"),
    gardenChecked: profileCardSafeJsonParse("garden_checked"),
    gardenAuth: profileCardSafeJsonParse("garden_auth"),
    achievementObtained: profileCardSafeJsonParse("achievement_obtained"),
    creatureArraysByType: {
      fish:  typeof fishData  !== "undefined" ? fishData  : [],
      bug:   typeof bugData   !== "undefined" ? bugData   : [],
      bird:  typeof birdData  !== "undefined" ? birdData  : [],
      sand:  typeof sandData  !== "undefined" ? sandData  : [],
      snow:  typeof snowData  !== "undefined" ? snowData  : [],
      shell: typeof shellData !== "undefined" ? shellData : [],
    },
    foodAll: typeof foodsData !== "undefined" ? foodsData : [],
    cropAll: typeof cropData !== "undefined" ? cropData : [],
    flowerAll: typeof flowerData !== "undefined" ? flowerData : [],
    achAll: typeof achievementsData !== "undefined" ? achievementsData : [],
  };
}

// 図鑑・料理・園芸・実績の全カテゴリ分の{done,total}を計算して返す（カード本体の表示用）
function computeProfileCardStats() {
  const src = collectProfileCardSourceData();

  const stats = {};
  for (const type of Object.keys(src.creatureArraysByType)) {
    stats[type] = profileCardCombineStat(src.creatureArraysByType[type], src.checkedData, src.authData);
  }

  stats.food = profileCardCombineStat(src.foodAll, src.foodChecked, src.foodAuth);

  const cropStat = profileCardCombineStat(src.cropAll, src.gardenChecked, src.gardenAuth);
  const flowerStat = profileCardCombineStat(src.flowerAll, src.gardenChecked, src.gardenAuth);
  stats.garden = { done: cropStat.done + flowerStat.done, total: cropStat.total + flowerStat.total };

  const achDone = src.achAll.filter(a => src.achievementObtained[a.id]).length;
  stats.achievement = { done: achDone, total: src.achAll.length };

  return stats;
}

// 図鑑・料理・園芸・実績の全カテゴリ分の、星5進捗と認証進捗を分けた{starDone,starTotal,authDone,authTotal}を
// 計算して返す（進捗確認セクション用。カード本体の合算表示とは別軸）。実績には認証の概念がないため
// authDone/authTotalは常に0。
function computeProfileCardStatsDetailed() {
  const src = collectProfileCardSourceData();

  const stats = {};
  for (const type of Object.keys(src.creatureArraysByType)) {
    stats[type] = profileCardSplitStat(src.creatureArraysByType[type], src.checkedData, src.authData);
  }

  stats.food = profileCardSplitStat(src.foodAll, src.foodChecked, src.foodAuth);

  const cropStat = profileCardSplitStat(src.cropAll, src.gardenChecked, src.gardenAuth);
  const flowerStat = profileCardSplitStat(src.flowerAll, src.gardenChecked, src.gardenAuth);
  stats.garden = {
    starDone: cropStat.starDone + flowerStat.starDone,
    starTotal: cropStat.starTotal + flowerStat.starTotal,
    authDone: cropStat.authDone + flowerStat.authDone,
    authTotal: cropStat.authTotal + flowerStat.authTotal,
  };

  const achDone = src.achAll.filter(a => src.achievementObtained[a.id]).length;
  stats.achievement = { starDone: achDone, starTotal: src.achAll.length, authDone: 0, authTotal: 0 };

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
