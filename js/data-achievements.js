// 実績データ
// 実績は現在83個の予定。ここには枠組み確認用のサンプル2件のみ収録。
// 実データ・実画像は後日追加予定。
// icon: js/icons.js のアイコン名（実画像が用意されるまでの仮アイコン）
// image: 実績アイコン画像パス（用意され次第 icon の代わりに使用）
// progressTotal: カウント式の実績のみ設定（例：8回達成で解除 → 8）
const achievementsData = [
  {
    id: 1,
    name: "不屈の心",
    nameI18n: { ja: "不屈の心", en: "", "zh-CN": "", "zh-TW": "", ko: "", th: "" },
    condition: "◯◯を8回達成する",
    conditionI18n: { ja: "◯◯を8回達成する", en: "", "zh-CN": "", "zh-TW": "", ko: "", th: "" },
    icon: "trophy",
    rewardTitle: "ベテラン漁師",
    rewardTitleI18n: { ja: "ベテラン漁師", en: "", "zh-CN": "", "zh-TW": "", ko: "", th: "" },
    progressTotal: 8,
  },
  {
    id: 2,
    name: "動物の隣人",
    nameI18n: { ja: "動物の隣人", en: "", "zh-CN": "", "zh-TW": "", ko: "", th: "" },
    condition: "◯◯を達成する",
    conditionI18n: { ja: "◯◯を達成する", en: "", "zh-CN": "", "zh-TW": "", ko: "", th: "" },
    icon: "medal",
    rewardTitle: "動物の友",
    rewardTitleI18n: { ja: "動物の友", en: "", "zh-CN": "", "zh-TW": "", ko: "", th: "" },
    progressTotal: null,
  },
];
