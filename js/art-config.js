// js/art-config.js
// 「アート」機能（art-create.html / art-convert.html）で共有するキャンバスサイズ設定。
//
// 以下のデータは、ユーザーがart-pia.com（参考サイト）のConsoleから実際に書き出して
// 提供してくれた正確な値をもとにしている（推測値ではない）。
//
// FREE_CANVAS_RATIOS: 自由キャンバスの比率（5種）×サイズレベル（4段階）。
// DESIGN_FRAME_PRESETS: 「画像から作る」で選べるゲーム内デザイン枠（衣装・家具など）。
//   1アイテムが複数パーツ（前面・背面・袖など）を持つ場合は parts に列挙する。
//   1アイテムしかないパーツは parts[0]（id:"default"）のみを持つ。

const FRAME_CATEGORIES = [
  { id: "all", labelKey: "art_frame_cat_all", labelFallback: "すべて" },
  { id: "clothes", labelKey: "art_frame_cat_clothes", labelFallback: "衣装" },
  { id: "furniture", labelKey: "art_frame_cat_furniture", labelFallback: "家具" },
  { id: "other", labelKey: "art_frame_cat_other", labelFallback: "その他" },
];

const FREE_CANVAS_RATIOS = [
  { id: "16-9", ratio: "16:9", levels: [{ w: 30, h: 18 }, { w: 50, h: 28 }, { w: 100, h: 56 }, { w: 150, h: 84 }] },
  { id: "4-3", ratio: "4:3", levels: [{ w: 30, h: 24 }, { w: 50, h: 38 }, { w: 100, h: 76 }, { w: 150, h: 114 }] },
  { id: "1-1", ratio: "1:1", levels: [{ w: 30, h: 30 }, { w: 50, h: 50 }, { w: 100, h: 100 }, { w: 150, h: 150 }] },
  { id: "3-4", ratio: "3:4", levels: [{ w: 24, h: 30 }, { w: 38, h: 50 }, { w: 76, h: 100 }, { w: 114, h: 150 }] },
  { id: "9-16", ratio: "9:16", levels: [{ w: 18, h: 30 }, { w: 28, h: 50 }, { w: 56, h: 100 }, { w: 84, h: 150 }] },
];

const DESIGN_FRAME_PRESETS = [
  {
    id: "book",
    category: "other",
    name: "本", nameI18n: {"ja": "本", "en": "Book", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "(4:3)", nameI18n: {"ja": "(4:3)", "en": "(4:3)", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 150, height: 114 },
      { id: "canvas-1777564834202", name: "(16:9)", nameI18n: {"ja": "(16:9)", "en": "(16:9)", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 150, height: 84 }
    ],
  },
  {
    id: "t_shirt",
    category: "clothes",
    name: "Tシャツ", nameI18n: {"ja": "Tシャツ", "en": "T-Shirt", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "フロント", nameI18n: {"ja": "フロント", "en": "Front", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 64, height: 80 },
      { id: "canvas-1777194719606", name: "バック", nameI18n: {"ja": "バック", "en": "Back", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 64, height: 80 },
      { id: "canvas-1777197309890", name: "左袖", nameI18n: {"ja": "左袖", "en": "Left Sleeve", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 64, height: 48 },
      { id: "canvas-1777198784026", name: "右袖", nameI18n: {"ja": "右袖", "en": "Right Sleeve", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 64, height: 48 }
    ],
  },
  {
    id: "tank_top",
    category: "clothes",
    name: "タンクトップ", nameI18n: {"ja": "タンクトップ", "en": "Tank Top", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "フロント", nameI18n: {"ja": "フロント", "en": "Front", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 64, height: 64 },
      { id: "canvas-1777279606554", name: "バック", nameI18n: {"ja": "バック", "en": "Back", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 64, height: 64 }
    ],
  },
  {
    id: "mini_skirt",
    category: "clothes",
    name: "ミニスカート", nameI18n: {"ja": "ミニスカート", "en": "Mini Skirt", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "フロント", nameI18n: {"ja": "フロント", "en": "Front", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 128, height: 64 },
      { id: "canvas-1777290916701", name: "バック", nameI18n: {"ja": "バック", "en": "Back", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 128, height: 64 }
    ],
  },
  {
    id: "shorts",
    category: "clothes",
    name: "ハーフパンツ", nameI18n: {"ja": "ハーフパンツ", "en": "Shorts", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "フロント", nameI18n: {"ja": "フロント", "en": "Front", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 102, height: 64 },
      { id: "canvas-1777299619220", name: "バック", nameI18n: {"ja": "バック", "en": "Back", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 102, height: 64 }
    ],
  },
  {
    id: "bucket_hat",
    category: "clothes",
    name: "バケットハット", nameI18n: {"ja": "バケットハット", "en": "Bucket Hat", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "前つば", nameI18n: {"ja": "前つば", "en": "Front Brim", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 126, height: 78 },
      { id: "canvas-1777302531478", name: "後ろつば", nameI18n: {"ja": "後ろつば", "en": "Back Brim", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 126, height: 78 },
      { id: "canvas-1777302813785", name: "帽子の上部", nameI18n: {"ja": "帽子の上部", "en": "Hat Top", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 100, height: 100 }
    ],
  },
  {
    id: "sweatshirt",
    category: "clothes",
    name: "スウェット", nameI18n: {"ja": "スウェット", "en": "Sweatshirt", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "フロント", nameI18n: {"ja": "フロント", "en": "Front", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 80, height: 88 },
      { id: "canvas-1777618043251", name: "バック", nameI18n: {"ja": "バック", "en": "Back", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 80, height: 88 },
      { id: "canvas-1777618057689", name: "袖", nameI18n: {"ja": "袖", "en": "Sleeve", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 130, height: 70 }
    ],
  },
  {
    id: "pants",
    category: "clothes",
    name: "パンツ", nameI18n: {"ja": "パンツ", "en": "Pants", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "フロント", nameI18n: {"ja": "フロント", "en": "Front", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 80, height: 116 },
      { id: "canvas-1777628283456", name: "バック", nameI18n: {"ja": "バック", "en": "Back", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 80, height: 116 }
    ],
  },
  {
    id: "dress",
    category: "clothes",
    name: "ワンピース", nameI18n: {"ja": "ワンピース", "en": "Dress", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "フロント", nameI18n: {"ja": "フロント", "en": "Front", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 102, height: 154 },
      { id: "canvas-1777631550226", name: "バック", nameI18n: {"ja": "バック", "en": "Back", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 76, height: 154 },
      { id: "canvas-1777632545337", name: "インナー", nameI18n: {"ja": "インナー", "en": "Inner", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 168, height: 102 }
    ],
  },
  {
    id: "cap",
    category: "clothes",
    name: "キャップ", nameI18n: {"ja": "キャップ", "en": "Cap", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "フロント", nameI18n: {"ja": "フロント", "en": "Front", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 54, height: 60 },
      { id: "canvas-1777788529196", name: "バック+サイド", nameI18n: {"ja": "バック+サイド", "en": "Back + Side", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 128, height: 62 },
      { id: "canvas-1777798059593", name: "帽子のつば", nameI18n: {"ja": "帽子のつば", "en": "Hat Brim", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 62, height: 52 }
    ],
  },
  {
    id: "shoes",
    category: "clothes",
    name: "靴", nameI18n: {"ja": "靴", "en": "Shoes", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "アッパー", nameI18n: {"ja": "アッパー", "en": "Upper", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 100, height: 90 },
      { id: "canvas-1777831586647", name: "靴先・靴紐", nameI18n: {"ja": "靴先・靴紐", "en": "Toe & Laces", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 120, height: 60 },
      { id: "canvas-1777836183697", name: "ソール", nameI18n: {"ja": "ソール", "en": "Sole", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 60, height: 60 }
    ],
  },
  {
    id: "mary_jane",
    category: "clothes",
    name: "メリージェーン", nameI18n: {"ja": "メリージェーン", "en": "Mary Jane", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "アッパー", nameI18n: {"ja": "アッパー", "en": "Upper", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 78, height: 64 },
      { id: "canvas-1777840015354", name: "ソール", nameI18n: {"ja": "ソール", "en": "Sole", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 108, height: 64 }
    ],
  },
  {
    id: "single_bed",
    category: "furniture",
    name: "シングルベッド", nameI18n: {"ja": "シングルベッド", "en": "Single Bed", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "布団の表", nameI18n: {"ja": "布団の表", "en": "Duvet Cover", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 200, height: 130 },
      { id: "canvas-1778157380499", name: "フレーム", nameI18n: {"ja": "フレーム", "en": "Frame", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 200, height: 98 }
    ],
  },
  {
    id: "double_bed",
    category: "furniture",
    name: "ダブルベッド", nameI18n: {"ja": "ダブルベッド", "en": "Double Bed", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "布団の表", nameI18n: {"ja": "布団の表", "en": "Duvet Cover", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 256, height: 128 },
      { id: "canvas-1778314231729", name: "ベッドフレーム", nameI18n: {"ja": "ベッドフレーム", "en": "Bed Frame", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 256, height: 110 }
    ],
  },
  {
    id: "closet",
    category: "furniture",
    name: "クローゼット", nameI18n: {"ja": "クローゼット", "en": "Closet", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "キャビネットドア", nameI18n: {"ja": "キャビネットドア", "en": "Cabinet Door", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 128, height: 128 }
    ],
  },
  {
    id: "nightstand",
    category: "furniture",
    name: "ナイトテーブル", nameI18n: {"ja": "ナイトテーブル", "en": "Nightstand", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "キャビネット表面", nameI18n: {"ja": "キャビネット表面", "en": "Cabinet Surface", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 128, height: 128 }
    ],
  },
  {
    id: "table_lamp",
    category: "furniture",
    name: "テーブルランプ", nameI18n: {"ja": "テーブルランプ", "en": "Table Lamp", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "ランプシェード前", nameI18n: {"ja": "ランプシェード前", "en": "Lampshade Front", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 80, height: 46 },
      { id: "canvas-1778923189276", name: "ランプシェード後", nameI18n: {"ja": "ランプシェード後", "en": "Lampshade Back", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 80, height: 46 },
      { id: "canvas-1778923246963", name: "土台の縁", nameI18n: {"ja": "土台の縁", "en": "Base Rim", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 128, height: 28 }
    ],
  },
  {
    id: "chair",
    category: "furniture",
    name: "チェア", nameI18n: {"ja": "チェア", "en": "Chair", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "背もたれ・前", nameI18n: {"ja": "背もたれ・前", "en": "Backrest Front", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 54, height: 28 },
      { id: "canvas-1778924127196", name: "背もたれ・後ろ", nameI18n: {"ja": "背もたれ・後ろ", "en": "Backrest Back", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 54, height: 28 },
      { id: "canvas-1778924203980", name: "座面", nameI18n: {"ja": "座面", "en": "Seat", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 54, height: 54 }
    ],
  },
  {
    id: "low_table",
    category: "furniture",
    name: "ローテーブル", nameI18n: {"ja": "ローテーブル", "en": "Low Table", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "テーブルの台面", nameI18n: {"ja": "テーブルの台面", "en": "Tabletop", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 128, height: 128 }
    ],
  },
  {
    id: "double_sofa",
    category: "furniture",
    name: "ダブルソファ", nameI18n: {"ja": "ダブルソファ", "en": "Double Sofa", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "背もたれ", nameI18n: {"ja": "背もたれ", "en": "Backrest", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 200, height: 110 },
      { id: "canvas-1779103098163", name: "座面", nameI18n: {"ja": "座面", "en": "Seat", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 200, height: 110 }
    ],
  },
  {
    id: "single_sofa",
    category: "furniture",
    name: "シングルソファ", nameI18n: {"ja": "シングルソファ", "en": "Single Sofa", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "背もたれ", nameI18n: {"ja": "背もたれ", "en": "Backrest", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 60, height: 60 },
      { id: "canvas-1779104686188", name: "座面", nameI18n: {"ja": "座面", "en": "Seat", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 60, height: 70 }
    ],
  },
  {
    id: "floor_lamp",
    category: "furniture",
    name: "フロアランプ", nameI18n: {"ja": "フロアランプ", "en": "Floor Lamp", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "ランプシェード前", nameI18n: {"ja": "ランプシェード前", "en": "Lampshade Front", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 80, height: 52 },
      { id: "canvas-1779105365461", name: "ランプシェード後", nameI18n: {"ja": "ランプシェード後", "en": "Lampshade Back", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 80, height: 52 },
      { id: "canvas-1779105485824", name: "土台の縁", nameI18n: {"ja": "土台の縁", "en": "Base Rim", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 128, height: 16 }
    ],
  },
];

// 表示名の言語フォールバック（nameI18n[lang]が空なら日本語のnameへ）。既存サイトのcreature名などと同じパターン。
function frameName(obj, lang){
  return (obj.nameI18n && obj.nameI18n[lang]) || obj.name;
}
