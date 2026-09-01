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

const FREE_CANVAS_RATIOS = [
  { id: "16-9", ratio: "16:9", levels: [{ w: 30, h: 18 }, { w: 50, h: 28 }, { w: 100, h: 56 }, { w: 150, h: 84 }] },
  { id: "4-3", ratio: "4:3", levels: [{ w: 30, h: 24 }, { w: 50, h: 38 }, { w: 100, h: 76 }, { w: 150, h: 114 }] },
  { id: "1-1", ratio: "1:1", levels: [{ w: 30, h: 30 }, { w: 50, h: 50 }, { w: 100, h: 100 }, { w: 150, h: 150 }] },
  { id: "3-4", ratio: "3:4", levels: [{ w: 24, h: 30 }, { w: 38, h: 50 }, { w: 76, h: 100 }, { w: 114, h: 150 }] },
  { id: "9-16", ratio: "9:16", levels: [{ w: 18, h: 30 }, { w: 28, h: 50 }, { w: 56, h: 100 }, { w: 84, h: 150 }] },
];

// 比率選択ボタンに表示する、縦横比を視覚的に示す矩形のサイズ（長辺をmaxSide pxに収める）
function ratioShapeBox(ratioId, maxSide){
  const [w, h] = ratioId.split("-").map(Number);
  if(w >= h) return { width: maxSide, height: Math.round(maxSide * h / w) };
  return { width: Math.round(maxSide * w / h), height: maxSide };
}

// パーツ選択画面用：実物の写真の代わりに、そのパーツの輪郭線（maskLines）だけを
// 背景無地の小さなSVGとして描く（js/art-masks.jsのPRESET_MASKS＝art-pia.comの実データが
// 元になっており、キャンバス編集画面・切り抜き画面の輪郭線表示と完全に同じデータを使う）
function partOutlineThumbSvg(frameId, partId, maxSide){
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === frameId);
  const part = frame && frame.parts.find(p => p.id === partId);
  if(!part) return "";
  const box = ratioShapeBox(`${part.width}-${part.height}`, maxSide);
  const maskEntry = typeof PRESET_MASKS !== "undefined" && PRESET_MASKS[frameId] ? PRESET_MASKS[frameId][partId] : null;
  const lines = (maskEntry && maskEntry.maskLines) || [];
  const strokeWidth = Math.max(part.width, part.height) * 0.018;
  const paths = lines.map(path => {
    if(!path || path.length < 2) return "";
    const d = path.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
    return `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }).join("");
  return `<svg class="art-part-thumb" width="${box.width}" height="${box.height}" viewBox="0 0 ${part.width} ${part.height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${paths}</svg>`;
}

// サイズ（精細度）選択ボタン用：段階が上がるほどマス目が細かくなるアイコンを描く
// （4段階固定。levelIndexは0〜3、値が大きいほど細かい＝解像度が高いレベル）
function levelDensitySvg(levelIndex, size){
  const cells = levelIndex + 1;
  const pad = 2, box = 20, cell = box / cells;
  let lines = `<rect x="${pad}" y="${pad}" width="${box}" height="${box}" fill="none" stroke="currentColor" stroke-width="1.4"/>`;
  for(let i = 1; i < cells; i++){
    const pos = pad + cell * i;
    lines += `<line x1="${pos}" y1="${pad}" x2="${pos}" y2="${pad + box}" stroke="currentColor" stroke-width="1"/>`;
    lines += `<line x1="${pad}" y1="${pos}" x2="${pad + box}" y2="${pos}" stroke="currentColor" stroke-width="1"/>`;
  }
  return `<svg class="art-level-icon-svg" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${lines}</svg>`;
}

const DESIGN_FRAME_PRESETS = [
  {
    id: "book",
    icon: "images/art-frames/book.webp",
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
    icon: "images/art-frames/t_shirt.webp",
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
    icon: "images/art-frames/tank_top.webp",
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
    icon: "images/art-frames/mini_skirt.webp",
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
    icon: "images/art-frames/shorts.webp",
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
    icon: "images/art-frames/bucket_hat.webp",
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
    icon: "images/art-frames/sweatshirt.webp",
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
    icon: "images/art-frames/pants.webp",
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
    icon: "images/art-frames/dress.webp",
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
    icon: "images/art-frames/cap.webp",
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
    icon: "images/art-frames/shoes.webp",
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
    icon: "images/art-frames/mary_jane.webp",
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
    icon: "images/art-frames/single_bed.webp",
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
    icon: "images/art-frames/double_bed.webp",
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
    icon: "images/art-frames/closet.webp",
    category: "furniture",
    name: "クローゼット", nameI18n: {"ja": "クローゼット", "en": "Closet", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "キャビネットドア", nameI18n: {"ja": "キャビネットドア", "en": "Cabinet Door", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 128, height: 128 }
    ],
  },
  {
    id: "nightstand",
    icon: "images/art-frames/nightstand.webp",
    category: "furniture",
    name: "ナイトテーブル", nameI18n: {"ja": "ナイトテーブル", "en": "Nightstand", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "キャビネット表面", nameI18n: {"ja": "キャビネット表面", "en": "Cabinet Surface", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 128, height: 128 }
    ],
  },
  {
    id: "table_lamp",
    icon: "images/art-frames/table_lamp.webp",
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
    icon: "images/art-frames/chair.webp",
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
    icon: "images/art-frames/low_table.webp",
    category: "furniture",
    name: "ローテーブル", nameI18n: {"ja": "ローテーブル", "en": "Low Table", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""},
    confirmed: true,
    parts: [
      { id: "default", name: "テーブルの台面", nameI18n: {"ja": "テーブルの台面", "en": "Tabletop", "zh-CN": "", "zh-TW": "", "ko": "", "th": ""}, width: 128, height: 128 }
    ],
  },
  {
    id: "double_sofa",
    icon: "images/art-frames/double_sofa.webp",
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
    icon: "images/art-frames/single_sofa.webp",
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
    icon: "images/art-frames/floor_lamp.webp",
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

// ── カラーパレット（ゲーム内で実際に選択できる色に完全一致させる固定パレット） ──
// メインカラー16枠（01〜16）。04は「透明/なし」の予約枠で、現時点ではhex未定義のため
// 色一覧・最近傍色マッチングの対象からは除外する（後日データが入り次第対応する）。
// 01・05〜16はサブカラー（詳細色）を持ち、02・03はメインカラー単色のみ（サブカラーなし）。
const GAME_PALETTE = [
  { no: "01", name: "黒系", hex: "#051616", subs: ["#051616", "#414545", "#808282", "#BEBFBF", "#FEFFFF"] },
  { no: "02", name: "白", hex: "#FEFFFF", subs: [] },
  { no: "03", name: "グレー", hex: "#808282", subs: [] },
  { no: "04", name: "透明", hex: null, subs: [] },
  { no: "05", name: "コーラル", hex: "#EF6E72", subs: ["#D0344D", "#EF6E72", "#A6263D", "#F5ACA6", "#CA8483", "#A35D5E", "#69313B", "#E7D5D4", "#C0ACAB", "#755E5E"] },
  { no: "06", name: "オレンジ", hex: "#F98358", subs: ["#E95E2B", "#F98358", "#AB4226", "#FEBA9F", "#DA937C", "#AF6B58", "#753B31", "#E9D5D0", "#C1ACA6", "#755E59"] },
  { no: "07", name: "黄オレンジ", hex: "#FEAE3B", subs: ["#F49E16", "#FEAE3B", "#B16E16", "#FECF91", "#DBA76C", "#B3814B", "#795126", "#F5E3CF", "#CEBBA9", "#806E5E"] },
  { no: "08", name: "黄色", hex: "#F9D837", subs: ["#EDCA16", "#F9D837", "#B39416", "#FAE690", "#D3BD6E", "#AB954B", "#756326", "#EFE6C7", "#C6BEA2", "#787259"] },
  { no: "09", name: "黄緑", hex: "#B7C931", subs: ["#A8BB16", "#B7C931", "#758616", "#D8DF93", "#ADB76C", "#85904B", "#545E2B", "#E6E9C7", "#BCC2A3", "#6E745D"] },
  { no: "10", name: "緑", hex: "#41B97B", subs: ["#05A25D", "#41B97B", "#057447", "#9CD9AD", "#76B28C", "#508968", "#245640", "#C4E0CC", "#9DB7A6", "#54685D"] },
  { no: "11", name: "ティール", hex: "#05ABA0", subs: ["#058781", "#05ABA0", "#056865", "#7ECDC2", "#55A49C", "#2B7D78", "#054B4B", "#BEE0D9", "#98B7B2", "#4E6965"] },
  { no: "12", name: "水色", hex: "#0599BA", subs: ["#05729C", "#0599BA", "#055878", "#79BACB", "#5293A5", "#246C7F", "#05495B", "#C6DDE2", "#9EB5BA", "#50676E"] },
  { no: "13", name: "青", hex: "#2B83C1", subs: ["#055EA6", "#2B83C1", "#054782", "#83A8C9", "#5D80A1", "#365B7F", "#193B56", "#C2CDD5", "#9BA6B0", "#4C5967"] },
  { no: "14", name: "青紫", hex: "#7577BC", subs: ["#544DA1", "#7577BC", "#3E377D", "#A2A0C8", "#787AA1", "#55567D", "#323454", "#C9CBD5", "#A2A3B0", "#565868"] },
  { no: "15", name: "紫", hex: "#A167A9", subs: ["#813D8C", "#A167A9", "#602B6B", "#B79BB9", "#907395", "#6C4D73", "#402944", "#D0C9D1", "#ABA1AC", "#605665"] },
  { no: "16", name: "ローズ", hex: "#D0698F", subs: ["#AD346E", "#D0698F", "#862658", "#DAA1B4", "#B47A8D", "#8B5367", "#60344B", "#E4D5D9", "#BCADB1", "#725E65"] },
];

function hexToRgb(hex){
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// RGBのユークリッド距離は人間の知覚とズレがあり（特に肌色・淡い色で不自然な
// 色に飛びやすい）、Lab色空間に変換してから距離を測ることで知覚的に近い色を
// 選びやすくする（CIE76：Lab空間での単純な二乗ユークリッド距離。js/build.jsと同じ方式）
function srgbChannelToLinear(c){
  c /= 255;
  return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
}

function labF(t){
  return t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
}

function rgbToLab(rgb){
  const r = srgbChannelToLinear(rgb[0]);
  const g = srgbChannelToLinear(rgb[1]);
  const b = srgbChannelToLinear(rgb[2]);
  const x = labF((r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047);
  const y = labF(r * 0.2126729 + g * 0.7151522 + b * 0.0721750);
  const z = labF((r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function labDistSq(a, b){
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

// GAME_PALETTEを平坦化した「選択可能な全色」一覧と、hex→パレット番号（例:"05-3"、
// サブカラーを持たない02・03は"02"のように番号のみ）の逆引きマップ。
// 04（透明/なし）はhexデータがないため含めない。各エントリのLab値も一度だけ
// 変換してキャッシュしておく（固定データのため、色ごとに毎回変換し直す必要がない）。
const GAME_PALETTE_FLAT = [];
const GAME_PALETTE_CODE_BY_HEX = {};
GAME_PALETTE.forEach(entry => {
  if(!entry.hex) return;
  if(entry.subs.length === 0){
    GAME_PALETTE_FLAT.push({ code: entry.no, hex: entry.hex, lab: rgbToLab(hexToRgb(entry.hex)) });
    GAME_PALETTE_CODE_BY_HEX[entry.hex.toUpperCase()] = entry.no;
  }else{
    entry.subs.forEach((hex, i) => {
      const code = `${entry.no}-${i + 1}`;
      GAME_PALETTE_FLAT.push({ code, hex, lab: rgbToLab(hexToRgb(hex)) });
      GAME_PALETTE_CODE_BY_HEX[hex.toUpperCase()] = code;
    });
  }
});

// 任意のRGBに対して、固定パレット内で最も近い色（Lab色空間での最近傍色マッチング）のhexを返す
function nearestGamePaletteHex(rgb){
  const lab = rgbToLab(rgb);
  let best = GAME_PALETTE_FLAT[0].hex, bestDist = Infinity;
  GAME_PALETTE_FLAT.forEach(entry => {
    const dist = labDistSq(lab, entry.lab);
    if(dist < bestDist){ bestDist = dist; best = entry.hex; }
  });
  return best;
}

// hexに対応するパレット番号（例:"05-3"）。パレット外の色（旧データ等）は空文字を返す
function gamePaletteCode(hex){
  if(!hex) return "";
  return GAME_PALETTE_CODE_BY_HEX[hex.toUpperCase()] || "";
}

// hexが属するメインカラーのGAME_PALETTEエントリを返す（サブカラー・メインカラーどちらの一致でも可）。
// 01のサブカラー（黒〜白のグラデーション）は02（白）・03（グレー）と同じhexを含むため、
// サブカラーを持たない単色スロット（02・03）との完全一致を先に優先する
// （例：白を拾ったら「01のサブカラー」ではなく「02」に紐づける）
function gamePaletteGroupForHex(hex){
  if(!hex) return null;
  const upper = hex.toUpperCase();
  const direct = GAME_PALETTE.find(entry => entry.hex && entry.subs.length === 0 && entry.hex.toUpperCase() === upper);
  if(direct) return direct;
  return GAME_PALETTE.find(entry => entry.hex && entry.subs.some(s => s.toUpperCase() === upper)) || null;
}
