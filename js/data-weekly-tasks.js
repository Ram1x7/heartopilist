// 「週替わり商店リスト」用データ
// 毎週土曜 AM6:00（JST）に購入回数がリセットされる商品の一覧。
// 同じ商品でも「願い星で買える分」「コインで買える分」が別枠（別の上限）で
// 用意されていることが多いため、そのまま別アイテムとして扱う。

const weeklyShops = [
  {
    id: "pet",
    shop: "ペット商店（ジョーンさん）",
    shopI18n: {"ja":"ペット商店（ジョーンさん）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    items: [
      { name: "パワフル煮干し", detail: "1個につき願い星1／100個まで", img: "./images/weekly-shop/001.png" },
      { name: "パワフル煮干し", detail: "1個につきコイン2,000／10個まで", img: "./images/weekly-shop/001.png" },
      { name: "パワフルドッグフード", detail: "1個につき願い星1／100個まで", img: "./images/weekly-shop/002.png" },
      { name: "パワフルドッグフード", detail: "1個につきコイン2,000／10個まで", img: "./images/weekly-shop/002.png" },
    ],
  },
  {
    id: "furniture",
    shop: "家具店（ボブおじさん）",
    shopI18n: {"ja":"家具店（ボブおじさん）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    items: [
      { name: "1F，2Fのモデルルーム家具", detail: "各家具コインまたは願い星で購入", img: "./images/weekly-shop/024.png" },
      { name: "絨毯商店の絨毯", detail: "各絨毯コインで購入", img: "./images/weekly-shop/024.png" },
    ],
  },
  {
    id: "clothes",
    shop: "服屋（ドロシー）",
    shopI18n: {"ja":"服屋（ドロシー）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    items: [
      { name: "衣装各種", detail: "各衣装コインまたは願い星で購入", img: "./images/weekly-shop/026.png" },
    ],
  },
  {
    id: "bookstore",
    shop: "本屋",
    shopI18n: {"ja":"本屋","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    items: [
      { name: "他の出版社の本", detail: "毎週2種類／各種コインで購入", img: "./images/weekly-shop/019.png" },
    ],
  },
  {
    id: "friendship",
    shop: "友愛商店（アニー）",
    shopI18n: {"ja":"友愛商店（アニー）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    items: [
      { name: "気ままカフェパラソル", detail: "1個につき願い星1／15個まで", img: "./images/weekly-shop/020.png" },
      { name: "2人用気ままカフェパラソル", detail: "1個につきコイン1,000／15個まで", img: "./images/weekly-shop/021.png" },
      { name: "大人数用気ままカフェパラソル", detail: "1個につき願い星2／15個まで", img: "./images/weekly-shop/022.png" },
      { name: "夢幻クラゲのカフェパラソル", detail: "1個につき願い星25／5個まで", img: "./images/weekly-shop/023.png" },
    ],
  },
  {
    id: "music",
    shop: "音楽商店（アニー）",
    shopI18n: {"ja":"音楽商店（アニー）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    items: [
      { name: "楽器各種", detail: "各楽器コインで購入", img: "./images/weekly-shop/025.png" },
    ],
  },
  {
    id: "fishing",
    shop: "釣り商店（ヴァンニア）",
    shopI18n: {"ja":"釣り商店（ヴァンニア）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    items: [
      { name: "魚のエサ", detail: "1個につきコイン200／50個まで", img: "./images/weekly-shop/003.png" },
      { name: "マーメイドの魚寄せ装置", detail: "1個につき願い星1／100個まで", img: "./images/weekly-shop/004.png" },
      { name: "マーメイドの魚寄せ装置", detail: "1個につきコイン2,000／10個まで", img: "./images/weekly-shop/004.png" },
      { name: "マーメイドの香水", detail: "1個につき願い星2／100個まで", img: "./images/weekly-shop/005.png" },
      { name: "マーメイドの香水", detail: "1個につきコイン3,000／10個まで", img: "./images/weekly-shop/005.png" },
    ],
  },
  {
    id: "bugcatching",
    shop: "虫捕り商店（浪花）",
    shopI18n: {"ja":"虫捕り商店（浪花）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    items: [
      { name: "エアーミツバチ虫寄せ装置", detail: "1個につき願い星1／100個まで", img: "./images/weekly-shop/011.png" },
      { name: "エアーミツバチ虫寄せ装置", detail: "1個につきコイン2,000／10個まで", img: "./images/weekly-shop/011.png" },
      { name: "全知強化剤", detail: "1個につき願い星2／100個まで", img: "./images/weekly-shop/010.png" },
      { name: "全知強化剤", detail: "1個につきコイン3,000／10個まで", img: "./images/weekly-shop/010.png" },
    ],
  },
  {
    id: "birdwatching",
    shop: "野鳥観察商店",
    shopI18n: {"ja":"野鳥観察商店","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    items: [
      { name: "自動式鳥笛", detail: "1個につき願い星1／100個まで", img: "./images/weekly-shop/006.png" },
      { name: "自動式鳥笛", detail: "1個につきコイン2,000／10個まで", img: "./images/weekly-shop/006.png" },
      { name: "隠れ草", detail: "1個につき願い星2／100個まで", img: "./images/weekly-shop/007.png" },
      { name: "隠れ草", detail: "1個につきコイン3,000／10個まで", img: "./images/weekly-shop/007.png" },
    ],
  },
  {
    id: "cooking",
    shop: "料理商店（マッシモ）",
    shopI18n: {"ja":"料理商店（マッシモ）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    items: [
      { name: "万能食材", detail: "1個につき願い星1／100個まで", img: "./images/weekly-shop/009.png" },
      { name: "万能食材", detail: "1個につきコイン2,000／10個まで", img: "./images/weekly-shop/009.png" },
      { name: "不思議な調味料", detail: "1個につき願い星2／100個まで", img: "./images/weekly-shop/008.png" },
      { name: "不思議な調味料", detail: "1個につきコイン3,000／10個まで", img: "./images/weekly-shop/008.png" },
    ],
  },
  {
    id: "gardening",
    shop: "園芸商店（ブランク）",
    shopI18n: {"ja":"園芸商店（ブランク）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    items: [
      { name: "肥料", detail: "1個につきコイン160／25個まで", img: "./images/weekly-shop/012.png" },
      { name: "栄養剤", detail: "1個につきコイン50／8個まで", img: "./images/weekly-shop/015.png" },
      { name: "レインボー育成パウダー", detail: "1個につき願い星2／100個まで", img: "./images/weekly-shop/018.png" },
      { name: "レインボー育成パウダー", detail: "1個につきコイン3,000／10個まで", img: "./images/weekly-shop/018.png" },
      { name: "良質肥料", detail: "1個につきコイン450／12個まで", img: "./images/weekly-shop/013.png" },
      { name: "良質栄養剤", detail: "1個につきコイン200／5個まで", img: "./images/weekly-shop/016.png" },
      { name: "最上級肥料", detail: "1個につきコイン1,000／2個まで", img: "./images/weekly-shop/014.png" },
      { name: "最上級栄養剤", detail: "1個につきコイン600／2個まで", img: "./images/weekly-shop/017.png" },
    ],
  },
];
