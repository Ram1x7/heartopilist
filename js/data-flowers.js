// 花データ
// growTime: 分単位（例：18時間=1080分）
// prices: [☆1, ☆2, ☆3, ☆4, ☆5] null = 未確認
// colors: 交配で作れる色の一覧
//   ☆1：赤・黄・白
//   ☆2：オレンジ・ピンク
//   ☆3：黒・桃
//   ☆4：紫・青・緑
//   ☆5：輝く・夜光
// breedingNote: 交配の補足（毎朝6時に交配が行われる）
// auth: 認証マスター対象か
// isEvent: イベント限定か
// eventName: イベント名

const flowerData = [

  // ── 通常の花 ────────────────────────
  {
    name: "ヒナギク",
    nameI18n:{"ja":"ヒナギク","en":"Daisy","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/hinagiku.PNG",
    seedImg: "./images/flowers/seed_hinagiku.jpg",
    level: 3,
    growTime: 1080,   // 18時間
    seedPrice: 30,
    prices: [100, 150, 200, 250, 400],
    colors: ["赤","白","ピンク","桃","緑","夜光"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 1,
  },
  {
    name: "パンジー",
    nameI18n:{"ja":"パンジー","en":"Pansy","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/pansy.PNG",
    seedImg: "./images/flowers/seed_pansy.jpg",
    level: 4,
    growTime: 1080,   // 18時間
    seedPrice: 30,
    prices: [100, null, null, null, null],
    colors: ["赤","黄","オレンジ","黒","紫","輝く"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 2,
  },
  {
    name: "アンスリウム",
    nameI18n:{"ja":"アンスリウム","en":"Anthurium","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/anthurium.PNG",
    seedImg: "./images/flowers/seed_anthurium.jpg",
    level: 5,
    growTime: 1440,   // 24時間
    seedPrice: 60,
    prices: [185, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","桃","緑","夜光"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 3,
  },
  {
    name: "ヒナゲシ",
    nameI18n:{"ja":"ヒナゲシ","en":"Poppy","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/hinageshi.PNG",
    seedImg: "./images/flowers/seed_hinageshi.jpg",
    level: 5,
    growTime: 1440,   // 24時間
    seedPrice: 60,
    prices: [185, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","紫","輝く"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 4,
  },
  {
    name: "オランダカイウ",
    nameI18n:{"ja":"オランダカイウ","en":"Calla Lily","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/oranda_kaiu.PNG",
    seedImg: "./images/flowers/seed_oranda_kaiu.jpg",
    level: 6,
    growTime: 1800,   // 30時間
    seedPrice: 90,
    prices: [250, null, null, null, null],
    colors: ["赤","黄","オレンジ","ピンク","黒","桃","紫","輝く"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 5,
  },
  {
    name: "アサガオ",
    nameI18n:{"ja":"アサガオ","en":"Morning Glory","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/asagao.PNG",
    seedImg: "./images/flowers/seed_asagao.jpg",
    level: 6,
    growTime: 1800,   // 30時間
    seedPrice: 90,
    prices: [250, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","桃","紫","夜光"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 6,
  },
  {
    name: "カーネーション",
    nameI18n:{"ja":"カーネーション","en":"Carnation","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/carnation.PNG",
    seedImg: "./images/flowers/seed_carnation.jpg",
    level: 7,
    growTime: 1800,   // 30時間
    seedPrice: 120,
    prices: [305, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","桃","緑","夜光"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 7,
  },
  {
    name: "チューリップ",
    nameI18n:{"ja":"チューリップ","en":"Tulip","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/tulip.PNG",
    seedImg: "./images/flowers/seed_tulip.jpg",
    level: 8,
    growTime: 2880,   // 48時間
    seedPrice: 150,
    prices: [415, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","桃","紫","青","輝く"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 8,
  },
  {
    name: "ユリ",
    nameI18n:{"ja":"ユリ","en":"Lily","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/yuri.PNG",
    seedImg: "./images/flowers/seed_yuri.jpg",
    level: 9,
    growTime: 2880,   // 48時間
    seedPrice: 200,
    prices: [485, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","桃","紫","緑","夜光"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 9,
  },
  {
    name: "バラ",
    nameI18n:{"ja":"バラ","en":"Rose","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/bara.PNG",
    seedImg: "./images/flowers/seed_bara.jpg",
    level: 10,
    growTime: 4320,   // 72時間
    seedPrice: 300,
    prices: [765, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","桃","紫","青","輝く","夜光"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 10,
  },
  {
    name: "ヒヤシンス",
    nameI18n:{"ja":"ヒヤシンス","en":"Hyacinth","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/hyacinth.PNG",
    seedImg: "./images/flowers/seed_hyacinth.jpg",
    level: 11,
    growTime: 4320,   // 72時間
    seedPrice: 300,
    prices: [785, 1180, 1570, 1965, 3140],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","桃","紫","青","輝く"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 11,
  },
  {
    name: "コチョウラン",
    nameI18n:{"ja":"コチョウラン","en":"Moth Orchid","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/kochoран.PNG",
    seedImg: "./images/flowers/seed_kochoран.jpg",
    level: 12,
    growTime: 4320,   // 72時間
    seedPrice: 300,
    prices: [805, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","桃","紫","青","輝く","夜光"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 12,
  },
  {
    name: "ゼラニウム",
    nameI18n:{"ja":"ゼラニウム","en":"Geranium","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/geranium.PNG",
    seedImg: "./images/flowers/seed_geranium.jpg",
    level: 13,
    growTime: 4320,   // 72時間
    seedPrice: 300,
    prices: [825, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","桃","紫","緑","輝く","夜光"],
    auth: true,
    isEvent: false,
    eventName: null,
    bookIndex: 13,
  },

  // ── イベントの花 ────────────────────────
  {
    name: "メコノプシス",
    nameI18n:{"ja":"メコノプシス","en":"Himalayan Blue Poppy","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/mekonopsis.PNG",
    seedImg: "./images/flowers/seed_mekonopsis.jpg",
    level: 3,
    growTime: 1440,   // 24時間
    seedPrice: 30,
    prices: [125, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","桃","青","緑","夜光"],
    auth: false,
    season: true,
    ended: true,
    eventName: "スノーシーズン",
    bookIndex: 14,
  },
  {
    name: "タンポポ",
    nameI18n:{"ja":"タンポポ","en":"Dandelion","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/tanpopo.PNG",
    seedImg: "./images/flowers/seed_tanpopo.jpg",
    level: 3,
    growTime: 1440,   // 24時間
    seedPrice: 30,
    prices: [125, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","桃","紫","青","夜光"],
    auth: false,
    fes: true,
    ended: true,
    eventName: "ドリームライト",
    bookIndex: 15,
  },
  {
    name: "積み木フラワー",
    nameI18n:{"ja":"積み木フラワー","en":"Building Block Flower","zh-CN":"","zh-TW":"","ko":"","th":""},
    img: "./images/flowers/tsumiki_flower.PNG",
    seedImg: "./images/flowers/seed_tsumiki_flower.jpg",
    level: 3,
    growTime: 1440,   // 24時間
    seedPrice: 30,
    prices: [125, null, null, null, null],
    colors: ["赤","黄","白","オレンジ","ピンク","黒","桃","紫","青","夜光"],
    auth: false,
    fes: true,
    ended: true,
    eventName: "ブロック市街地",
    bookIndex: 16,
  },
];

// 交配レア度マップ
const colorRarity = {
  "赤": 1, "黄": 1, "白": 1,
  "オレンジ": 2, "ピンク": 2,
  "黒": 3, "桃": 3,
  "紫": 4, "青": 4, "緑": 4,
  "輝く": 5, "夜光": 5,
};
