// js/share-card.js
// はとぴ図鑑「コンプ状況をシェア」機能。
// main.js側のグローバル（creatures/checkedData/authData/foodsData/cropData/
// flowerData/icon()/T()/loadScriptOnce()）と、icons.js側のICONSに依存する。
// main.jsの後、icons.jsより後に読み込むこと。

// ============================================================
// カテゴリ定義（表示6種。アクセントカラーはテーマに関係なく固定）
// ============================================================
const SHARE_CATEGORIES = [
  { key:"fish",   label:"魚",   icon:"fish",       accent:"#3c7fb0" },
  { key:"bug",    label:"虫",   icon:"bug",        accent:"#5a8f5a" },
  { key:"bird",   label:"野鳥", icon:"bird",       accent:"#b1503b" },
  { key:"shell",  label:"貝殻", icon:"shell",      accent:"#8a6fae" },
  // 料理・園芸には専用アイコンが無いため、近い意味のアイコンを暫定使用
  { key:"food",   label:"料理", icon:"ingredient", accent:"#c9822f" },
  { key:"garden", label:"園芸", icon:"sprout",     accent:"#c9678f" },
];

// getStats()の集計結果を、カテゴリカード用の {done,total,authDone,authTotal} に変換する
function mapCategoryStats(stats){
  return SHARE_CATEGORIES.map(cat => {
    let done, total, authDone, authTotal;
    switch(cat.key){
      case "fish": case "bug": case "bird": case "shell":
        done = stats.byType[cat.key];         total = stats.totalByType[cat.key];
        authDone = stats.authByType[cat.key]; authTotal = stats.authTotalByType[cat.key];
        break;
      case "food":
        done = stats.foodDone;         total = stats.foodTotal;
        authDone = stats.foodAuthDone; authTotal = stats.foodAuthTotal;
        break;
      case "garden":
        done = stats.gardenDone;         total = stats.gardenTotal;
        authDone = stats.gardenAuthDone; authTotal = stats.gardenAuthTotal;
        break;
    }
    return { ...cat, done, total, authDone, authTotal };
  });
}

// ============================================================
// テーマ定義（紺×金のみ実装。残り3テーマは背景画像タスクで追加予定）
// ============================================================
// 背景アート（4テーマとも「縁取り装飾＋下部に街並みシルエット、中央は
// 空いたクリーム系の一枚絵」という共通構図のため、パネル・文字色などの
// トークンはテーマ間で共通のままでよく、差分は背景画像と代替色のみ）
const SHARE_THEME_TOKENS = {
  panel: "rgba(255,253,247,0.86)", panelLine: "rgba(200,168,107,0.55)",
  track: "rgba(122,113,100,0.12)",
  ink: "#34302b", inkSub: "#7a7164",
  indigo: "#3c5a6e", vermillion: "#b1503b",
  gold: "#c8a86b", goldDeep: "#a3854f",
  // メダル外周リングの金属的な質感用に、単色の金より明暗2段階を追加
  goldLight: "#e3cd97", goldHighlight: "#fff6e0",
};
// メダル中央盤面を「実績章」らしい濃色にするテーマ用のオプション項目。
// 未設定（null）のテーマは従来通りtheme.panel（生成り）のままになる
const SHARE_MEDAL_DISC_DEFAULT = {
  medalDisc: null, medalPercentColor: null, medalLabelColor: null, medalDoneColor: null,
  medalFrame: null, bannerColors: null,
};
const SHARE_THEMES = {
  navyGold: {
    label: "紺×金",
    bgImage: {
      portrait:  "assets/share-bg/navy-gold_portrait.png",
      landscape: "assets/share-bg/navy-gold_landscape.png",
    },
    // 背景画像の読み込み中／失敗時の代替グラデーション
    fallbackTop: "#f8f3e8", fallbackBottom: "#efe4cd",
    // サブタイトル文字の背後に敷く薄パネルの不透明度（0で描かない）。
    // 背景と文字色のコントラストが十分なテーマは0のままでよい
    subtitlePanelAlpha: 0,
    medalDisc: { from: "#1c3350", to: "#0a1626", ring: "#3c5c82" },
    medalPercentColor: "#eec27a",
    medalLabelColor: "#f2e9d3",
    medalDoneColor: "#f2e9d3",
    // メダルの固定装飾（二重リング・宝石・リボン）をPNGフレームに置き換える版。
    // 読み込みに失敗した場合はnull扱いとなり、上のmedalDisc設定によるCanvas描画にフォールバックする
    medalFrame: "assets/share-ui/medal-frame_navy-gold.png",
    // 「総合コンプリート率」ラベルを乗せるリボンバナーの配色（赤系）
    bannerColors: { from: "#d97b5c", to: "#a8412c", stroke: "#7a3320" },
    ...SHARE_THEME_TOKENS,
  },
  sakuraPink: {
    label: "桜ピンク",
    bgImage: {
      portrait:  "assets/share-bg/sakura-pink_portrait.png",
      landscape: "assets/share-bg/sakura-pink_landscape.png",
    },
    fallbackTop: "#fdf3ee", fallbackBottom: "#f8dbe4",
    subtitlePanelAlpha: 0,
    ...SHARE_MEDAL_DISC_DEFAULT,
    medalFrame: "assets/share-ui/medal-frame_sakura-pink.png",
    ...SHARE_THEME_TOKENS,
  },
  skyBlue: {
    label: "水色×白",
    bgImage: {
      portrait:  "assets/share-bg/sky-blue_portrait.png",
      landscape: "assets/share-bg/sky-blue_landscape.png",
    },
    fallbackTop: "#eaf6fb", fallbackBottom: "#cfe9f5",
    subtitlePanelAlpha: 0,
    ...SHARE_MEDAL_DISC_DEFAULT,
    medalFrame: "assets/share-ui/medal-frame_sky-blue.png",
    ...SHARE_THEME_TOKENS,
  },
  forestGreen: {
    label: "深緑×金",
    bgImage: {
      portrait:  "assets/share-bg/forest-green_portrait.png",
      landscape: "assets/share-bg/forest-green_landscape.png",
    },
    fallbackTop: "#f4f1e2", fallbackBottom: "#dfe6c8",
    // 背景の葉の緑とサブタイトル文字色が近く読みにくいため、
    // このテーマだけ薄いパネルを敷いてコントラストを補う
    subtitlePanelAlpha: 0.6,
    ...SHARE_MEDAL_DISC_DEFAULT,
    medalFrame: "assets/share-ui/medal-frame_forest-green.png",
    ...SHARE_THEME_TOKENS,
  },
};
const SHARE_THEME_DEFAULT = "navyGold";
// レイアウト/テーマの選択はプロフィール項目とは別に、localStorageへ記憶する
// （個人情報を含まないUI設定のため。キーはプロフィール系とは別名にしている）
const SHARE_THEME_STORAGE_KEY = "hatopiShareTheme";
function loadShareThemePreference() {
  const saved = localStorage.getItem(SHARE_THEME_STORAGE_KEY);
  return SHARE_THEMES[saved] ? saved : SHARE_THEME_DEFAULT;
}
let currentShareTheme = loadShareThemePreference();

// ============================================================
// レイアウト定義
// ============================================================
// w/hは各背景アートの実サイズ(縦長1086×1448=3:4、横長1672×941≒16:9)に
// 合わせた固定サイズ。中身の合計が枠より小さい分は余白として配分する
// （drawShareCard参照。縦長はsections配列を上から積む、横長はcolumns配列で
// 左右に分割し、カラムごとにsectionsを積む）
const SHARE_LAYOUTS = {
  portrait: {
    label: "縦長",
    w: 960, h: 1280,
    sections: ["header", "medal", "categoryGrid", "footer"],
  },
  landscape: {
    label: "横長",
    w: 1600, h: 900,
    outerMargin: 36, // 背景アートの縁飾りとカラムが重ならないよう左右に余白を確保
    columns: [
      { widthRatio: 0.22, sections: ["profileCol"] },
      { widthRatio: 0.44, sections: ["medalLarge"] },
      { widthRatio: 0.34, sections: ["categoryGrid2x3"] },
    ],
    footerSection: "footerWide",
  },
};
const SHARE_LAYOUT_DEFAULT = "portrait";
const SHARE_LAYOUT_STORAGE_KEY = "hatopiShareLayout";
function loadShareLayoutPreference() {
  const saved = localStorage.getItem(SHARE_LAYOUT_STORAGE_KEY);
  return SHARE_LAYOUTS[saved] ? saved : SHARE_LAYOUT_DEFAULT;
}
let currentShareLayout = loadShareLayoutPreference();

const SERIF = "'Shippori Mincho', serif";

// カード上部に飾るマスコット画像（サイトのアプリアイコンを流用）
const shareMascotImg = new Image();
shareMascotImg.src = "apple-touch-icon.png?v=10";
const shareMascotReady = new Promise((resolve) => {
  shareMascotImg.onload  = () => resolve(true);
  shareMascotImg.onerror = () => resolve(false);
});

// icons.jsのICONS（24×24 viewBoxのSVGパス文字列）をCanvas上にそのまま描く
function drawIcon(ctx, name, cx, cy, size, color){
  const d = typeof ICONS !== "undefined" ? ICONS[name] : null;
  if(!d) return;
  const paths = d.match(/<path[^>]*d="([^"]+)"/g) || [];
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  paths.forEach(tag => {
    const m = tag.match(/d="([^"]+)"/);
    if(!m) return;
    const p = new Path2D(m[1]);
    ctx.stroke(p);
    if(/fill="currentColor"/.test(tag)) ctx.fill(p);
  });
  ctx.restore();
}

// ============================================================
// 集計（図鑑・料理・園芸）
// ============================================================
function getStats() {

  // ── 図鑑 ──
  const total = creatures.length;
  const done  = creatures.filter(c => checkedData[c.name]).length;

  const byType      = { fish:0, bug:0, bird:0, sand:0, snow:0, shell:0 };
  const totalByType = { fish:0, bug:0, bird:0, sand:0, snow:0, shell:0 };
  creatures.forEach(c => {
    totalByType[c.type]++;
    if (checkedData[c.name]) byType[c.type]++;
  });

  const authEligible    = creatures.filter(c => c.auth !== false);
  const authByType      = { fish:0, bug:0, bird:0, sand:0, snow:0, shell:0 };
  const authTotalByType = { fish:0, bug:0, bird:0, sand:0, snow:0, shell:0 };
  authEligible.forEach(c => {
    authTotalByType[c.type]++;
    if (authData[c.name]) authByType[c.type]++;
  });
  const authCount = authEligible.filter(c => authData[c.name]).length;
  const authTotal = authEligible.length;

  // ── 料理 ──
  const foodChecked     = JSON.parse(localStorage.getItem("food_checked") || "{}");
  const foodAuth        = JSON.parse(localStorage.getItem("food_auth")    || "{}");
  const foodAll         = typeof foodsData !== "undefined" ? foodsData : [];
  const foodDone        = foodAll.filter(f => foodChecked[f.name]).length;
  const foodTotal       = foodAll.length;
  const foodAuthElig    = foodAll.filter(f => f.auth !== false);
  const foodAuthDone    = foodAuthElig.filter(f => foodAuth[f.name]).length;
  const foodAuthTotal   = foodAuthElig.length;

  // ── 園芸：作物 ──
  // 認証データは園芸専用の "garden_auth" キー（図鑑の authData とは分離済み）
  const gardenChecked   = JSON.parse(localStorage.getItem("garden_checked") || "{}");
  const gardenAuth      = JSON.parse(localStorage.getItem("garden_auth")    || "{}");
  const cropAll         = typeof cropData   !== "undefined" ? cropData   : [];
  const flowerAll       = typeof flowerData !== "undefined" ? flowerData : [];

  const cropDone        = cropAll.filter(g => gardenChecked[g.name]).length;
  const cropTotal       = cropAll.length;
  const cropAuthElig    = cropAll.filter(g => g.auth !== false);
  const cropAuthDone    = cropAuthElig.filter(g => gardenAuth[g.name]).length;
  const cropAuthTotal   = cropAuthElig.length;

  // ── 園芸：花 ──
  const flowerDone      = flowerAll.filter(g => gardenChecked[g.name]).length;
  const flowerTotal     = flowerAll.length;
  const flowerAuthElig  = flowerAll.filter(g => g.auth !== false);
  const flowerAuthDone  = flowerAuthElig.filter(g => gardenAuth[g.name]).length;
  const flowerAuthTotal = flowerAuthElig.length;

  // ── 園芸：合計 ──
  const gardenDone      = cropDone  + flowerDone;
  const gardenTotal     = cropTotal + flowerTotal;
  const gardenAuthDone  = cropAuthDone  + flowerAuthDone;
  const gardenAuthTotal = cropAuthTotal + flowerAuthTotal;

  return {
    // 図鑑
    total, done, byType, totalByType,
    authCount, authTotal, authByType, authTotalByType,
    // 料理
    foodDone, foodTotal, foodAuthDone, foodAuthTotal,
    // 園芸
    gardenDone, gardenTotal, gardenAuthDone, gardenAuthTotal,
    cropDone,   cropTotal,   cropAuthDone,   cropAuthTotal,
    flowerDone, flowerTotal, flowerAuthDone, flowerAuthTotal,
  };
}

// ============================================================
// 背景画像の読み込み（テーマ×レイアウトの組み合わせごとにキャッシュ。
// 一度読み込んだ組み合わせは以後即座に再利用する）
// ============================================================
const shareBgImageCache = new Map(); // key: "themeKey_layoutKey" -> Promise<HTMLImageElement|null>

function getThemeBackgroundImage(themeKey, layoutKey) {
  const cacheKey = `${themeKey}_${layoutKey}`;
  if (shareBgImageCache.has(cacheKey)) return shareBgImageCache.get(cacheKey);

  const src = SHARE_THEMES[themeKey].bgImage[layoutKey];
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => {
      console.warn(`[share-card] 背景画像の読み込みに失敗しました（${src}）。代替の単色背景で描画します`);
      resolve(null);
    };
    img.src = src;
  });
  shareBgImageCache.set(cacheKey, promise);
  return promise;
}

// ============================================================
// メダル枠PNG（固定装飾）の読み込み。テーマごとに1枚のみでレイアウトに
// 依存しないため、背景画像とは別のキャッシュで管理する
// ============================================================
const shareMedalFrameCache = new Map(); // key: themeKey -> Promise<HTMLImageElement|null>

// メダル中央の生成り円の位置・半径（フレーム画像の一辺に対する比率。全テーマ共通の構図）
const MEDAL_FRAME_CIRCLE = { cx: 0.4753, cy: 0.4896, r: 0.2967 };

function getThemeMedalFrameImage(themeKey) {
  const src = SHARE_THEMES[themeKey].medalFrame;
  if (!src) return Promise.resolve(null);
  if (shareMedalFrameCache.has(themeKey)) return shareMedalFrameCache.get(themeKey);

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => {
      console.warn(`[share-card] メダル枠画像の読み込みに失敗しました（${src}）。従来のCanvas描画で代替します`);
      resolve(null);
    };
    img.src = src;
  });
  shareMedalFrameCache.set(themeKey, promise);
  return promise;
}

function showShareCardLoading(visible) {
  const el = document.getElementById("shareCardLoading");
  if (el) el.hidden = !visible;
}

// 背景を描画（画像が読み込めていればそれを全面に敷き、失敗時のみ代替グラデーション）
function drawShareBackground(ctx, w, h, theme, bgImg) {
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, w, h);
    return;
  }
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, theme.fallbackTop);
  bgGrad.addColorStop(1, theme.fallbackBottom);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
}

// 実績カードの角に付ける、金属製の金具風コーナー装飾。
// 二重線のL字＋角の小さな菱形鋲で、単純なL字線より「作り込まれた額縁」感を出す
function drawOrnamentalCorner(ctx, cx, cy, len, rot, color, colorDeep) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, len); ctx.lineTo(0, 0); ctx.lineTo(len, 0);
  ctx.stroke();
  ctx.strokeStyle = colorDeep;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(5, len - 4); ctx.lineTo(5, 5); ctx.lineTo(len - 4, 5);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  const s = 4.5;
  const g = ctx.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, "#fff6e0");
  g.addColorStop(0.5, color);
  g.addColorStop(1, colorDeep);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.roundRect(-s, -s, s * 2, s * 2, 1.3); ctx.fill();
  ctx.restore();
}

// 従来の単純なL字線（現状ほかに使用箇所は無いが、軽量な角飾りとして残す）
function drawCorner(ctx, cx, cy, len, rot, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, len); ctx.lineTo(0, 0); ctx.lineTo(len, 0);
  ctx.stroke();
  ctx.restore();
}

function drawProgressBar(ctx, x, y, bw, bh, pct, theme, accent) {
  ctx.save();
  ctx.fillStyle = theme.track;
  ctx.beginPath(); ctx.roundRect(x, y, bw, bh, bh / 2); ctx.fill();
  ctx.strokeStyle = theme.panelLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  ctx.restore();

  if (pct > 0) {
    const fillW = Math.max(bh, bw * pct / 100);
    const g = ctx.createLinearGradient(x, 0, x + bw, 0);
    g.addColorStop(0, accent || theme.goldDeep);
    g.addColorStop(1, theme.gold);
    ctx.save();
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x, y, fillW, bh, bh / 2); ctx.fill();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.roundRect(x, y, fillW, Math.max(1.5, bh * 0.4), bh * 0.2); ctx.fill();
    ctx.restore();
  }

  // 両端の小さな金具（バーが空でも「宝飾レール」らしく見せる）
  ctx.save();
  ctx.fillStyle = theme.goldDeep;
  ctx.beginPath(); ctx.arc(x, y + bh / 2, bh * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + bw, y + bh / 2, bh * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// テーマによっては背景の柄とサブタイトル文字色が近く読みにくくなるため、
// subtitlePanelAlphaが設定されているテーマだけ薄いパネルを敷いてから描く
// （0のテーマでは何も描かず、見た目は変わらない）
function drawSubtitleWithPanel(ctx, cx, y, text, theme, fontPx, letterSpacing) {
  ctx.save();
  ctx.textAlign = "center";
  // Shippori Minchoは500/700しかインポートしていないため、必ず存在する
  // ウェイトを明示指定する（未指定=400扱いだとブラウザのフォールバック体になる）
  ctx.font = `500 ${fontPx}px ${SERIF}`;
  ctx.letterSpacing = letterSpacing;

  if (theme.subtitlePanelAlpha > 0) {
    const textW = ctx.measureText(text).width;
    const padX = 14, padY = 6;
    ctx.fillStyle = `rgba(255,253,247,${theme.subtitlePanelAlpha})`;
    ctx.beginPath();
    ctx.roundRect(cx - textW / 2 - padX, y - fontPx, textW + padX * 2, fontPx + padY * 2, 999);
    ctx.fill();
  }

  ctx.fillStyle = theme.inkSub;
  ctx.fillText(text, cx, y);
  ctx.restore();
}

// アバター円（プロフィールでアイコン画像が選択されていればそれを、
// なければサイトのマスコットを描く。名前未入力のプレースホルダー表示でも
// アイコンが選ばれていればそちらを優先する）
function drawProfileAvatar(ctx, cx, cy, r, theme) {
  const img = (shareProfileIconImg.complete && shareProfileIconImg.naturalWidth > 0) ? shareProfileIconImg
    : (shareMascotImg.complete && shareMascotImg.naturalWidth > 0) ? shareMascotImg
    : null;

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = theme.panel;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  ctx.restore();

  // 金の三重リング（グロー付き太リング→細い装飾リング→外側の淡い輪郭）
  ctx.save();
  ctx.shadowColor = theme.gold;
  ctx.shadowBlur = 12;
  const ringGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ringGrad.addColorStop(0, theme.goldHighlight);
  ringGrad.addColorStop(0.5, theme.gold);
  ringGrad.addColorStop(1, theme.goldDeep);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.strokeStyle = ringGrad;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = theme.goldLight;
  ctx.globalAlpha = 0.85;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = theme.goldDeep;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.restore();

  // 上部の宝石アクセント
  drawGemAccent(ctx, cx, cy - r - 6, r * 0.36, theme);
}

// ============================================================
// セクション：header（マスコット・タイトル・区切り線）
// ============================================================
const HEADER_HEIGHT = 262;

function drawHeaderSection(ctx, x, y, w, theme) {
  const mascotR  = 56;
  const mascotCx = x + w / 2;
  const mascotCy = y + 34 + mascotR;

  drawProfileAvatar(ctx, mascotCx, mascotCy, mascotR, theme);
  ctx.save();
  ctx.beginPath(); ctx.arc(mascotCx, mascotCy, mascotR + 6, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(163,133,79,0.4)";
  ctx.stroke();
  ctx.restore();

  const titleY = mascotCy + mascotR + 18 + 26;
  ctx.textAlign = "center";
  ctx.fillStyle = theme.indigo;
  ctx.font = `700 32px ${SERIF}`;
  ctx.fillText("はとぴ図鑑", x + w / 2, titleY);

  const subtitleY = titleY + 8 + 14;
  drawSubtitleWithPanel(ctx, x + w / 2, subtitleY, "C O M P L E T E   S T A T U S", theme, 12, "0.28em");

  const dividerY = subtitleY + 16;
  ctx.strokeStyle = "rgba(163,133,79,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 120, dividerY); ctx.lineTo(x + w / 2 - 14, dividerY);
  ctx.moveTo(x + w / 2 + 14, dividerY);  ctx.lineTo(x + w / 2 + 120, dividerY);
  ctx.stroke();
  ctx.save();
  ctx.translate(x + w / 2, dividerY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = theme.gold;
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();

  return HEADER_HEIGHT;
}

// ============================================================
// セクション：profileCol（横長レイアウトの左カラム）
// プロフィール入力（名前・ID・レベル等）はタスク#36で実装予定のため、
// 現時点ではheaderセクションと同じマスコット＋タイトルを縦積みで表示する
// ============================================================
const PROFILE_COL_MASCOT_R = 48;
const PROFILE_COL_HEIGHT = PROFILE_COL_MASCOT_R * 2 + 18 + 26 + 8 + 14;

function drawProfileColSection(ctx, x, y, w, theme) {
  const cx = x + w / 2;
  const mascotCy = y + PROFILE_COL_MASCOT_R;

  drawProfileAvatar(ctx, cx, mascotCy, PROFILE_COL_MASCOT_R, theme);

  const titleY = mascotCy + PROFILE_COL_MASCOT_R + 18 + 22;
  ctx.textAlign = "center";
  ctx.fillStyle = theme.indigo;
  ctx.font = `700 26px ${SERIF}`;
  ctx.fillText("はとぴ図鑑", cx, titleY);

  drawSubtitleWithPanel(ctx, cx, titleY + 22, "COMPLETE STATUS", theme, 11, "0.2em");

  return PROFILE_COL_HEIGHT;
}

// ============================================================
// プロフィールブロック（名前が入力されている時に、上記header/profileColの
// 代わりに描画される。compact=trueで横長カラム用の小さめサイズになる）
// ============================================================
// 指定幅に収まるよう末尾を「…」で省略する（ctx.fontは呼び出し側で設定済みの前提）
function fitTextWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid) + "…").width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + "…";
}

// バッジ風ピル（ID・レベル・プレイスタイルタグで共用）。ごく薄いグラデーション背景と
// 両端の小さな金の鋲アクセントで、単色のシンプルな枠線ピルより少し装飾を足す
function drawBadgePillAt(ctx, x, y, w, h, text, theme, fontPx) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "rgba(255,255,255,0.85)");
  g.addColorStop(1, theme.panel);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = theme.panelLine;
  ctx.lineWidth = 1;
  ctx.stroke();

  const dotR = Math.max(1.2, fontPx * 0.11);
  const inset = h * 0.34;
  ctx.fillStyle = theme.gold;
  ctx.beginPath(); ctx.arc(x + inset, y + h / 2, dotR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w - inset, y + h / 2, dotR, 0, Math.PI * 2); ctx.fill();

  ctx.font = `${fontPx}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = theme.indigo;
  ctx.fillText(text, x + w / 2, y + h / 2 + fontPx * 0.35);
}

function drawInfoBadge(ctx, cx, y, text, theme, fontPx) {
  ctx.font = `${fontPx}px sans-serif`;
  const w = ctx.measureText(text).width + 24;
  const h = fontPx + 12;
  drawBadgePillAt(ctx, cx - w / 2, y, w, h, text, theme, fontPx);
  return h;
}

// 注記など小さな捕捉テキストを、賑やかな背景アートの上でも読めるよう
// うっすらとした生成りパネルを敷いてから描く（yはテキストのベースライン）
function drawNoteWithPanel(ctx, cx, y, text, theme, fontPx) {
  ctx.textAlign = "center";
  ctx.font = `${fontPx}px sans-serif`;
  const w = ctx.measureText(text).width + 20;
  const h = fontPx + 10;
  ctx.save();
  ctx.fillStyle = "rgba(255,253,247,0.8)";
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y - fontPx * 0.85, w, h, h / 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = theme.inkSub;
  ctx.fillText(text, cx, y);
}

function drawProfileTags(ctx, cx, y, tags, theme, fontPx) {
  if (!tags || !tags.length) return 0;
  ctx.font = `${fontPx}px sans-serif`;
  const gap = 8, h = fontPx + 12;
  const widths = tags.map(t => ctx.measureText(t).width + 22);
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (tags.length - 1);
  let tx = cx - totalW / 2;
  tags.forEach((t, i) => {
    drawBadgePillAt(ctx, tx, y, widths[i], h, t, theme, fontPx);
    tx += widths[i] + gap;
  });
  return h;
}

function profileBlockHeight(profile, compact) {
  const avatarR = compact ? 56 : 68;
  const gap = compact ? 18 : 20;
  const nameFont = compact ? 26 : 34;
  let h = 34 + avatarR * 2 + gap;
  h += nameFont + 8;
  const infoFont = compact ? 13 : 14;
  h += infoFont + 12 + 6; // ID・Lv行（バッジ）
  if (profile.ageGroup || profile.genderGroup) {
    const agFont = compact ? 12 : 13;
    h += (agFont + 12) + 6; // 年代・性別行（バッジ）
  }
  if (profile.styleTags && profile.styleTags.length) {
    const tagFont = compact ? 12 : 13;
    h += 4 + (tagFont + 10) + 6;
  }
  if (profile.message && profile.message.trim()) {
    const msgFont = compact ? 13 : 14;
    h += (msgFont + 16) + (compact ? 4 : 6); // ひとことメッセージ（背景パネル付き）
  }
  h += compact ? 6 : 26;
  return h;
}

function drawProfileBlock(ctx, x, y, w, theme, profile, compact) {
  const avatarR = compact ? 56 : 68;
  const cx = x + w / 2;
  const avatarCy = y + 34 + avatarR;
  drawProfileAvatar(ctx, cx, avatarCy, avatarR, theme);

  let cur = avatarCy + avatarR + (compact ? 18 : 20);

  const nameFont = compact ? 26 : 34;
  ctx.textAlign = "center";
  ctx.fillStyle = theme.indigo;
  ctx.font = `700 ${nameFont}px ${SERIF}`;
  ctx.fillText(profile.name.trim(), cx, cur + nameFont * 0.75);
  cur += nameFont + 8;

  const infoParts = [];
  if (profile.id && profile.id.trim()) infoParts.push(`ID ${profile.id.trim()}`);
  infoParts.push(`Lv.${profile.level || 1}`);
  const infoFont = compact ? 13 : 14;
  const infoH = drawInfoBadge(ctx, cx, cur, infoParts.join("  ・  "), theme, infoFont);
  cur += infoH + 6;

  const agParts = [profile.ageGroup, profile.genderGroup].filter(Boolean);
  if (agParts.length) {
    const agFont = compact ? 12 : 13;
    const agH = drawInfoBadge(ctx, cx, cur, agParts.join("・"), theme, agFont);
    cur += agH + 6;
  }

  if (profile.styleTags && profile.styleTags.length) {
    cur += 4;
    const tagH = drawProfileTags(ctx, cx, cur, profile.styleTags, theme, compact ? 12 : 13);
    cur += tagH + 6;
  }

  if (profile.message && profile.message.trim()) {
    // 背景アートが賑やかなテーマでも読めるよう、うっすらとした背景パネルを添える
    const msgFont = compact ? 13 : 14;
    ctx.font = `italic ${msgFont}px sans-serif`;
    const text = fitTextWidth(ctx, `「${profile.message.trim()}」`, w - 24);
    const textW = ctx.measureText(text).width + 28;
    const mh = msgFont + 16;
    ctx.save();
    ctx.fillStyle = "rgba(255,253,247,0.78)";
    ctx.beginPath();
    ctx.roundRect(cx - textW / 2, cur, textW, mh, mh / 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = theme.inkSub;
    ctx.textAlign = "center";
    ctx.fillText(text, cx, cur + mh / 2 + msgFont * 0.35);
    cur += mh + (compact ? 4 : 6);
  }

  if (!compact) {
    // 縦長は既存headerセクションと同じ飾り罫を末尾に添える
    const dividerY = cur + 14;
    ctx.strokeStyle = "rgba(163,133,79,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 120, dividerY); ctx.lineTo(cx - 14, dividerY);
    ctx.moveTo(cx + 14, dividerY);  ctx.lineTo(cx + 120, dividerY);
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, dividerY);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = theme.gold;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    cur = dividerY + 12;
  } else {
    cur += 6;
  }

  return cur - y;
}

// ============================================================
// セクション：medal（総合コンプ率の二重リングメダル）
// 縦長用(通常サイズ)・横長用(大サイズ)の両方から共通コアを呼ぶ
// ============================================================
const MEDAL_R = 92;

// 宝飾風のダイヤモンド型アクセント（メダル上部・アバター縁取りで共用）
function drawGemAccent(ctx, cx, cy, size, theme) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  const g = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
  g.addColorStop(0, "#fff8e6");
  g.addColorStop(0.5, theme.gold);
  g.addColorStop(1, theme.goldDeep);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.12);
  ctx.fill();
  ctx.strokeStyle = theme.goldDeep;
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.stroke();
  // ハイライト（宝石らしい光の反射）
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.beginPath();
  ctx.moveTo(-size * 0.18, -size * 0.32);
  ctx.lineTo(size * 0.05, -size * 0.32);
  ctx.lineTo(-size * 0.12, -size * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 金のリボン結び（メダル下部の飾り）
function drawRibbonBow(ctx, cx, cy, scale, theme) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const gradL = ctx.createLinearGradient(-20, 0, -2, 0);
  gradL.addColorStop(0, theme.goldDeep);
  gradL.addColorStop(1, theme.gold);
  const gradR = ctx.createLinearGradient(2, 0, 20, 0);
  gradR.addColorStop(0, theme.gold);
  gradR.addColorStop(1, theme.goldDeep);

  ctx.fillStyle = gradL;
  ctx.beginPath();
  ctx.moveTo(-2, 0); ctx.lineTo(-20, -9); ctx.lineTo(-15, 0); ctx.lineTo(-20, 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = gradR;
  ctx.beginPath();
  ctx.moveTo(2, 0); ctx.lineTo(20, -9); ctx.lineTo(15, 0); ctx.lineTo(20, 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = theme.gold;
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = theme.goldDeep;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// リング上部を横切るリボン状のバナー（両端が旗のように尖った六角形）。
// ラベル文字を白で重ね、平面的にならないよう軽いグラデーション+縁取り+影を付ける
function drawLabelBanner(ctx, cx, cy, w, h, colors, text, fontPx) {
  const tail = h * 0.55;
  ctx.save();
  ctx.translate(cx, cy);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grad.addColorStop(0, colors.from);
  grad.addColorStop(1, colors.to);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-w / 2 - tail, 0);
  ctx.lineTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  ctx.lineTo(w / 2 + tail, 0);
  ctx.lineTo(w / 2, h / 2);
  ctx.lineTo(-w / 2, h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 1.4;
  ctx.strokeStyle = colors.stroke;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#fffaf0";
  ctx.font = `500 ${fontPx}px ${SERIF}`;
  ctx.letterSpacing = "1px";
  ctx.fillText(text, 0, fontPx * 0.35);
  ctx.letterSpacing = "0px";
  ctx.restore();
}

// メダルの高さは描画側と完全に一致させるため、この計算式を単一の
// 情報源としてdrawMedalCoreの戻り値・SHARE_SECTIONS.medal.height・
// medalLargeHeight()の全てから呼び出す
function medalCoreHeight(radius) {
  const scale = radius / MEDAL_R;
  return radius * 2 + 44 * scale + 30 * scale;
}

// フレーム画像を使う場合のメダル高さ。topYを画像そのものの上端として扱うため、
// 画像の一辺の実寸（正方形なので描画後の高さと同じ）に注記ぶんの余白を足すだけでよい
function medalFrameCoreHeight(radius) {
  const scale = radius / MEDAL_R;
  const naturalSpan = radius / MEDAL_FRAME_CIRCLE.r;
  return naturalSpan + 60 * scale;
}

function drawMedalCore(ctx, cx, topY, radius, theme, data) {
  const scale = radius / MEDAL_R;
  const totalAll = data.stats.total + data.stats.foodTotal + data.stats.gardenTotal;
  const doneAll  = data.stats.done  + data.stats.foodDone  + data.stats.gardenDone;
  const totalPct = totalAll > 0 ? Math.floor(doneAll / totalAll * 100) : 0;
  const medalCy  = topY + radius;
  const hasDisc  = !!theme.medalDisc;

  // フレーム画像モード：固定装飾（二重リング・宝石・リボン）はPNG任せにして、
  // Canvasは中央の生成り円に重ねる可変情報（%・ラベル・達成数）のみ描画する。
  // 画像は上部の宝石・下部のリボンが中央円から大きくはみ出す構図のため、
  // topYは（円の上端ではなく）「画像そのものの上端」として扱う
  if (data.medalFrameImg) {
    const img = data.medalFrameImg;
    const drawScale = radius / (img.naturalWidth * MEDAL_FRAME_CIRCLE.r);
    const drawW = img.naturalWidth * drawScale;
    const drawH = img.naturalHeight * drawScale;
    const frameX = cx - img.naturalWidth * MEDAL_FRAME_CIRCLE.cx * drawScale;
    const frameY = topY;
    const medalCy = frameY + img.naturalHeight * MEDAL_FRAME_CIRCLE.cy * drawScale;

    ctx.save();
    ctx.shadowColor = "rgba(20,15,5,0.3)";
    ctx.shadowBlur = 16 * scale;
    ctx.shadowOffsetY = 6 * scale;
    ctx.drawImage(img, frameX, frameY, drawW, drawH);
    ctx.restore();

    ctx.textAlign = "center";
    const useBanner = !!theme.bannerColors;
    const pctY = useBanner ? medalCy + 14 * scale : medalCy + 10 * scale;
    const pctFontPx = Math.round(68 * scale);
    const pctText = `${totalPct}%`;
    ctx.font = `700 ${pctFontPx}px ${SERIF}`;

    if (useBanner) {
      // 金のグラデーション＋濃い縁取り＋軽い光彩で、金属に浮き出た文字のような立体感を出す
      ctx.save();
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(80,50,10,0.45)";
      ctx.shadowBlur = 5 * scale;
      ctx.shadowOffsetY = 2 * scale;
      ctx.lineWidth = Math.max(2, 3 * scale);
      ctx.strokeStyle = "#5a3b1a";
      ctx.strokeText(pctText, cx, pctY);
      ctx.restore();

      const pctGrad = ctx.createLinearGradient(cx, pctY - pctFontPx * 0.78, cx, pctY + pctFontPx * 0.12);
      pctGrad.addColorStop(0, theme.goldDeep);
      pctGrad.addColorStop(0.55, theme.gold);
      pctGrad.addColorStop(1, theme.goldHighlight);
      ctx.fillStyle = pctGrad;
      ctx.fillText(pctText, cx, pctY);
    } else {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 3 * scale;
      ctx.fillStyle = theme.vermillion;
      ctx.fillText(pctText, cx, pctY);
      ctx.restore();
    }

    const bannerFontPx = Math.round(15 * scale);
    const bannerText = "総合コンプリート率";
    if (useBanner) {
      ctx.font = `500 ${bannerFontPx}px ${SERIF}`;
      const bannerW = ctx.measureText(bannerText).width + 44 * scale;
      const bannerH = 24 * scale;
      drawLabelBanner(ctx, cx, medalCy - 66 * scale, bannerW, bannerH, theme.bannerColors, bannerText, bannerFontPx);
    } else {
      ctx.save();
      ctx.fillStyle = theme.inkSub;
      ctx.font = `500 ${bannerFontPx}px ${SERIF}`;
      ctx.letterSpacing = `${1.5 * scale}px`;
      ctx.fillText(bannerText, cx, medalCy + 40 * scale);
      ctx.restore();
    }

    ctx.fillStyle = theme.ink;
    ctx.font = `700 ${Math.round(14 * scale)}px sans-serif`;
    ctx.fillText(`達成数  ${doneAll} / ${totalAll}`, cx, medalCy + 64 * scale);

    // 注記はリボン飾りが円の外に大きくはみ出す分、フレーム画像の実際の下端を基準に配置する。
    // 横長は縮尺が大きくリボン下端の装飾（吊り下げ宝石）に接近しやすいため、余白を広めに取る。
    // 枠の外＝背景アートの上に直接乗るテーマ（深緑など）もあるため、パネルを敷いて読みやすくする
    drawNoteWithPanel(ctx, cx, frameY + drawH + 44 * scale, "※図鑑全体（砂像・雪像含む）で集計", theme, Math.round(11 * scale));

    return medalFrameCoreHeight(radius);
  }

  // 1) 外周ドロップシャドウ（実績章らしい浮き上がり感）
  ctx.save();
  ctx.shadowColor  = "rgba(20,15,5,0.35)";
  ctx.shadowBlur   = 22 * scale;
  ctx.shadowOffsetY = 9 * scale;
  ctx.beginPath(); ctx.arc(cx, medalCy, radius, 0, Math.PI * 2);
  ctx.fillStyle = theme.goldDeep;
  ctx.fill();
  ctx.restore();

  // 2) 外側の太いゴールドリング（対角グラデーションで金属の反射を疑似的に表現）
  const ringR = radius - 3 * scale;
  const metalGrad = ctx.createLinearGradient(cx - radius, medalCy - radius, cx + radius, medalCy + radius);
  metalGrad.addColorStop(0,    theme.goldHighlight);
  metalGrad.addColorStop(0.28, theme.gold);
  metalGrad.addColorStop(0.5,  theme.goldDeep);
  metalGrad.addColorStop(0.72, theme.gold);
  metalGrad.addColorStop(1,    theme.goldHighlight);
  ctx.save();
  ctx.shadowColor = theme.gold;
  ctx.shadowBlur = 14 * scale;
  ctx.lineWidth = 8 * scale;
  ctx.strokeStyle = metalGrad;
  ctx.beginPath(); ctx.arc(cx, medalCy, ringR, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // 3) 濃い金の縁取り（外側リングの内側輪郭を引き締める）
  ctx.save();
  ctx.lineWidth = 1.6 * scale;
  ctx.strokeStyle = theme.goldDeep;
  ctx.beginPath(); ctx.arc(cx, medalCy, radius - 8 * scale, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // 4) 内側ハイライトリング（べゼルの明るい縁）
  ctx.save();
  ctx.lineWidth = 1.4 * scale;
  ctx.strokeStyle = theme.goldLight;
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(cx, medalCy, radius - 13 * scale, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // 5) 中央盤面（テーマにmedalDiscがあれば濃色グラデーション、無ければ従来の生成り）
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, medalCy, radius - 17 * scale, 0, Math.PI * 2);
  if (hasDisc) {
    const discGrad = ctx.createRadialGradient(cx, medalCy - radius * 0.3, radius * 0.1, cx, medalCy, radius);
    discGrad.addColorStop(0, theme.medalDisc.from);
    discGrad.addColorStop(1, theme.medalDisc.to);
    ctx.fillStyle = discGrad;
  } else {
    ctx.fillStyle = theme.panel;
  }
  ctx.fill();
  ctx.restore();

  // 6) 盤面内側の薄い装飾リング
  ctx.save();
  ctx.lineWidth = 1 * scale;
  ctx.strokeStyle = hasDisc ? theme.medalDisc.ring : theme.goldDeep;
  ctx.globalAlpha = hasDisc ? 0.55 : 0.4;
  ctx.beginPath(); ctx.arc(cx, medalCy, radius - 26 * scale, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // 7) 上部の宝石アクセント・8) 下部のリボン結び（メダルの大きさに合わせて拡大）
  drawGemAccent(ctx, cx, medalCy - radius + 3 * scale, 36 * scale, theme);
  drawRibbonBow(ctx, cx, medalCy + radius - 2 * scale, scale * 1.75, theme);

  const percentColor = hasDisc ? theme.medalPercentColor : theme.vermillion;
  const labelColor   = hasDisc ? theme.medalLabelColor   : theme.inkSub;
  const doneColor    = hasDisc ? theme.medalDoneColor    : theme.ink;

  // 9) パーセント（メダル内最大の文字。エンボス風に軽くドロップシャドウを添える）
  ctx.textAlign = "center";
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 5 * scale;
  ctx.shadowOffsetY = 2 * scale;
  ctx.fillStyle = percentColor;
  ctx.font = `700 ${Math.round(68 * scale)}px ${SERIF}`;
  ctx.fillText(`${totalPct}%`, cx, medalCy + 10 * scale);
  ctx.restore();

  // 10) 「総合コンプリート率」ラベル
  ctx.save();
  ctx.fillStyle = labelColor;
  ctx.font = `500 ${Math.round(15 * scale)}px ${SERIF}`;
  ctx.letterSpacing = `${1.5 * scale}px`;
  ctx.fillText("総合コンプリート率", cx, medalCy + 40 * scale);
  ctx.restore();

  // 達成数バッジ（リング外の小さなピル。盤面が濃色のテーマは半透明の濃紺、
  // 生成り盤面のテーマは半透明の生成りにして、いずれも金の縁取りで統一する）
  const doneText = `達成数  ${doneAll} / ${totalAll}`;
  ctx.font = `700 ${Math.round(14 * scale)}px sans-serif`;
  const doneW = ctx.measureText(doneText).width + 30 * scale;
  const doneH = 25 * scale;
  const doneY = medalCy + radius + 27 * scale;
  ctx.save();
  ctx.fillStyle = hasDisc ? "rgba(10,20,36,0.88)" : "rgba(255,253,247,0.85)";
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.roundRect(cx - doneW / 2, doneY - doneH / 2, doneW, doneH, doneH / 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = doneColor;
  ctx.fillText(doneText, cx, doneY + 5 * scale);

  // 総合%には図鑑の砂像・雪像（カードには出ないカテゴリ）も含む旨の注記
  drawNoteWithPanel(ctx, cx, doneY + doneH / 2 + 20 * scale, "※図鑑全体（砂像・雪像含む）で集計", theme, Math.round(11 * scale));

  return medalCoreHeight(radius);
}

function drawMedalSection(ctx, x, y, w, theme, data) {
  return drawMedalCore(ctx, x + w / 2, y, MEDAL_R, theme, data);
}

// 横長レイアウトの中央カラム用（大きめのメダル）
const MEDAL_LARGE_R = 199;
function drawMedalLargeSection(ctx, x, y, w, theme, data) {
  return drawMedalCore(ctx, x + w / 2, y, MEDAL_LARGE_R, theme, data);
}
function medalLargeHeight(data) {
  return data && data.medalFrameImg ? medalFrameCoreHeight(MEDAL_LARGE_R) : medalCoreHeight(MEDAL_LARGE_R);
}

// ============================================================
// セクション：categoryGrid（3列×2行、6カテゴリ）
// ============================================================
const CATEGORY_MARGIN_X = 64;
const CATEGORY_GAP = 20;
// カード高さの基準値。drawCategoryCard内の装飾・文字サイズはこの値を基準にした
// scale(ch/CATEGORY_CARD_BASE_H)で比例拡縮するため、レイアウトごとに異なる
// カード高さ（縦長=基準のまま、横長=拡大）を渡しても内部の比率は崩れない
const CATEGORY_CARD_BASE_H = 208;
// 縦長：3列×2行のカード高さ（従来通り）
const CATEGORY_CARD_H_PORTRAIT = 208;
const CATEGORY_GRID_HEIGHT = CATEGORY_CARD_H_PORTRAIT * 2 + CATEGORY_GAP + 16;
// 横長：2列×3行のカード高さ（メダル拡大に合わせてカードも大きく＝参考画像のプロポーションに近づける）
const CATEGORY_CARD_H_LANDSCAPE = 260;

function drawCategoryCard(ctx, x, cy, cw, ch, cat, theme) {
  const scale = ch / CATEGORY_CARD_BASE_H;

  ctx.save();
  ctx.shadowColor  = "rgba(120,100,60,0.14)";
  ctx.shadowBlur   = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = theme.panel;
  ctx.beginPath(); ctx.roundRect(x, cy, cw, ch, 14); ctx.fill();
  ctx.restore();

  // うっすらとした斜めの光沢（トレーディングカード風のテクスチャ感）
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, cy, cw, ch, 14); ctx.clip();
  const sheen = ctx.createLinearGradient(x, cy, x + cw, cy + ch);
  sheen.addColorStop(0, "rgba(255,255,255,0.30)");
  sheen.addColorStop(0.4, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(x, cy, cw, ch);
  ctx.restore();

  // 金色の外枠＋内側の細い枠（実績カードらしい二重の縁取り）
  ctx.save();
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x, cy, cw, ch, 14); ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = theme.panelLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.roundRect(x + 5, cy + 5, cw - 10, ch - 10, 10); ctx.stroke();
  ctx.restore();

  // 四隅の金具風装飾（二重L字＋菱形の鋲）
  const cornerLen = 18 * scale;
  const cornerInset = 8 * scale;
  [
    [x + cornerInset,      cy + cornerInset,      0],
    [x + cw - cornerInset, cy + cornerInset,      Math.PI / 2],
    [x + cw - cornerInset, cy + ch - cornerInset, Math.PI],
    [x + cornerInset,      cy + ch - cornerInset, -Math.PI / 2],
  ].forEach(([cxr, cyr, rot]) => {
    drawOrnamentalCorner(ctx, cxr, cyr, cornerLen, rot, theme.gold, theme.goldDeep);
  });

  const cx  = x + cw / 2;
  const pct = cat.total > 0 ? Math.floor(cat.done / cat.total * 100) : 0;

  // アイコンメダリオン（外側の淡いリング＋内側の彩色リング＋アイコン）
  const badgeR  = 32 * scale;
  const badgeCx = cx - 36 * scale;
  const badgeCy = cy + 44 * scale;
  ctx.save();
  ctx.beginPath(); ctx.arc(badgeCx, badgeCy, badgeR + 5 * scale, 0, Math.PI * 2);
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 1.4 * scale;
  ctx.globalAlpha = 0.75;
  ctx.stroke();
  ctx.restore();
  ctx.beginPath(); ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
  const badgeGrad = ctx.createRadialGradient(badgeCx, badgeCy - badgeR * 0.4, badgeR * 0.1, badgeCx, badgeCy, badgeR);
  badgeGrad.addColorStop(0, `${cat.accent}14`);
  badgeGrad.addColorStop(1, `${cat.accent}2b`);
  ctx.fillStyle = badgeGrad;
  ctx.fill();
  ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = cat.accent;
  ctx.stroke();
  drawIcon(ctx, cat.icon, badgeCx, badgeCy, 32 * scale, cat.accent);

  ctx.textAlign = "left";
  ctx.fillStyle = theme.indigo;
  ctx.font = `700 ${Math.round(18 * scale)}px ${SERIF}`;
  ctx.fillText(cat.label, cx + 6 * scale, badgeCy + 6 * scale);

  ctx.textAlign = "center";
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 3 * scale;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = theme.vermillion;
  ctx.font = `700 ${Math.round(36 * scale)}px ${SERIF}`;
  ctx.fillText(`${pct}%`, cx, cy + 118 * scale);
  ctx.restore();

  ctx.fillStyle = theme.inkSub;
  ctx.font = `${Math.round(13 * scale)}px sans-serif`;
  ctx.fillText(`${cat.done} / ${cat.total}`, cx, cy + 140 * scale);

  drawProgressBar(ctx, x + 18 * scale, cy + 154 * scale, cw - 36 * scale, 8 * scale, pct, theme, cat.accent);

  ctx.fillStyle = theme.inkSub;
  ctx.font = `${Math.round(12 * scale)}px sans-serif`;
  ctx.fillText(`認証 ${cat.authDone} / ${cat.authTotal}`, cx, cy + 186 * scale);
}

function drawCategoryGridCore(ctx, x, y, w, theme, data, cols, rows, marginX, cardH) {
  const cardW = (w - marginX * 2 - CATEGORY_GAP * (cols - 1)) / cols;

  data.categories.forEach((cat, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cardX = x + marginX + col * (cardW + CATEGORY_GAP);
    const cardY = y + row * (cardH + CATEGORY_GAP);
    drawCategoryCard(ctx, cardX, cardY, cardW, cardH, cat, theme);
  });

  return rows * cardH + (rows - 1) * CATEGORY_GAP;
}

// 縦長：3列×2行
function drawCategoryGridSection(ctx, x, y, w, theme, data) {
  return drawCategoryGridCore(ctx, x, y, w, theme, data, 3, 2, CATEGORY_MARGIN_X, CATEGORY_CARD_H_PORTRAIT) + 16;
}

// 横長：2列×3行（右カラム用。背景アートの縁飾りに近いぶん余白を広めに取る）
const CATEGORY_GRID_2X3_MARGIN_X = 24;
function drawCategoryGrid2x3Section(ctx, x, y, w, theme, data) {
  return drawCategoryGridCore(ctx, x, y, w, theme, data, 2, 3, CATEGORY_GRID_2X3_MARGIN_X, CATEGORY_CARD_H_LANDSCAPE);
}
function categoryGrid2x3Height() {
  return 3 * CATEGORY_CARD_H_LANDSCAPE + 2 * CATEGORY_GAP;
}

// ============================================================
// セクション：footer（作成日）
// ============================================================
const FOOTER_HEIGHT = 50;

function drawFooterCore(ctx, x, y, w, theme, data) {
  // プロフィール表示時は上部の大見出しが「はとぴ図鑑」ではなくプレイヤー名になるため、
  // フッターに小さくサイト名を添えてブランドが消えないようにする
  const dateText = hasProfileName(data && data.profile)
    ? `はとぴ図鑑 ・ ${new Date().toLocaleDateString("ja-JP")}`
    : new Date().toLocaleDateString("ja-JP");
  const cx = x + w / 2;
  const textY = y + 30;

  // 背景アートの街並み帯と重なっても読めるよう、日付の下に小さな不透明パネルを敷く
  // （Shippori Minchoは500/700しかインポートしていないため700を指定）
  ctx.font = `700 13px ${SERIF}`;
  const textW = ctx.measureText(dateText).width;
  const padX = 14, padY = 8;
  ctx.save();
  ctx.fillStyle = theme.panel;
  ctx.beginPath();
  ctx.roundRect(cx - textW / 2 - padX, textY - 13, textW + padX * 2, 13 + padY * 2, 999);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = theme.goldDeep;
  ctx.fillText(dateText, cx, textY + 8);

  return FOOTER_HEIGHT;
}

function drawFooterSection(ctx, x, y, w, theme, data) {
  return drawFooterCore(ctx, x, y, w, theme, data);
}

// 横長レイアウト：3カラムの下に全幅で敷くフッター
function drawFooterWideSection(ctx, x, y, w, theme, data) {
  return drawFooterCore(ctx, x, y, w, theme, data);
}

// header/profileColは、プロフィール名が入力済みならdrawProfileBlock（実データ）、
// 未入力ならこれまで通りマスコット＋タイトルのプレースホルダーを描く
const SHARE_SECTIONS = {
  header: {
    height: (w, data) => hasProfileName(data.profile) ? profileBlockHeight(data.profile, false) : HEADER_HEIGHT,
    draw:   (ctx, x, y, w, theme, data) => hasProfileName(data.profile)
      ? drawProfileBlock(ctx, x, y, w, theme, data.profile, false)
      : drawHeaderSection(ctx, x, y, w, theme),
  },
  medal: {
    height: (w, data) => data.medalFrameImg ? medalFrameCoreHeight(MEDAL_R) : medalCoreHeight(MEDAL_R),
    draw: drawMedalSection,
  },
  categoryGrid:   { height: () => CATEGORY_GRID_HEIGHT,    draw: drawCategoryGridSection },
  footer:         { height: () => FOOTER_HEIGHT,           draw: drawFooterSection },
  profileCol: {
    height: (w, data) => hasProfileName(data.profile) ? profileBlockHeight(data.profile, true) : PROFILE_COL_HEIGHT,
    draw:   (ctx, x, y, w, theme, data) => hasProfileName(data.profile)
      ? drawProfileBlock(ctx, x, y, w, theme, data.profile, true)
      : drawProfileColSection(ctx, x, y, w, theme),
  },
  medalLarge:     { height: (w, data) => medalLargeHeight(data), draw: drawMedalLargeSection },
  categoryGrid2x3:{ height: () => categoryGrid2x3Height(), draw: drawCategoryGrid2x3Section },
  footerWide:     { height: () => FOOTER_HEIGHT,           draw: drawFooterWideSection },
};

// ============================================================
// 画像生成本体
// ============================================================
async function drawShareCard() {
  const stats = getStats();
  const themeKey = currentShareTheme;
  const layoutKey = currentShareLayout;
  const theme = SHARE_THEMES[themeKey];
  const layout = SHARE_LAYOUTS[layoutKey];
  const data = { stats, categories: mapCategoryStats(stats), profile: shareProfileDraft };

  // 背景画像はテーマ×レイアウトの組み合わせごとに初回だけ読み込み、以後はキャッシュを再利用する。
  // 未読み込みの組み合わせだけモーダル内にスピナーを出す（キャッシュ済みなら一瞬で解決するので出さない）
  const cacheKey = `${themeKey}_${layoutKey}`;
  const alreadyCached = shareBgImageCache.has(cacheKey) && shareMedalFrameCache.has(themeKey);
  if (!alreadyCached) showShareCardLoading(true);
  const [bgImg, medalFrameImg] = await Promise.all([
    getThemeBackgroundImage(themeKey, layoutKey),
    getThemeMedalFrameImage(themeKey),
  ]);
  if (!alreadyCached) showShareCardLoading(false);
  data.medalFrameImg = medalFrameImg;

  const w = layout.w;
  const h = layout.h;

  shareCanvas.width  = w;
  shareCanvas.height = h;
  const ctx = shareCanvas.getContext("2d");

  drawShareBackground(ctx, w, h, theme, bgImg);

  if (layout.columns) {
    drawColumnLayout(ctx, layout, w, h, theme, data);
  } else {
    drawStackedLayout(ctx, layout, w, h, theme, data);
  }
}

// 縦長：セクションを上から積む。背景アートは縁取り装飾＋下部に街並み
// シルエットがあるため、完全な中央寄せだと下部カード・フッターが
// 街並みと重なりやすい。上側は空きが多いぶん、余白の25%だけを上に
// 配せば安全に収まる
function drawStackedLayout(ctx, layout, w, h, theme, data) {
  const contentHeight = layout.sections.reduce((sum, key) => sum + SHARE_SECTIONS[key].height(w, data), 0);
  let cur = Math.max(0, (h - contentHeight) * 0.25);
  layout.sections.forEach(key => {
    cur += SHARE_SECTIONS[key].draw(ctx, 0, cur, w, theme, data);
  });
}

// 横長：カラムに分割し、各カラム内は縦中央寄せ。下部には全幅のフッターを敷く
function drawColumnLayout(ctx, layout, w, h, theme, data) {
  const outerMargin = layout.outerMargin || 0;
  const contentW = w - outerMargin * 2;
  const footerH = layout.footerSection ? SHARE_SECTIONS[layout.footerSection].height(w, data) : 0;
  const usableH = h - footerH - 20;

  let colX = outerMargin;
  layout.columns.forEach(col => {
    const colW = col.widthRatio * contentW;
    const colContentH = col.sections.reduce((sum, key) => sum + SHARE_SECTIONS[key].height(colW, data), 0);
    let cy = Math.max(0, (usableH - colContentH) / 2);
    col.sections.forEach(key => {
      cy += SHARE_SECTIONS[key].draw(ctx, colX, cy, colW, theme, data);
    });
    colX += colW;
  });

  if (layout.footerSection) {
    SHARE_SECTIONS[layout.footerSection].draw(ctx, 0, h - footerH, w, theme, data);
  }
}

// シェア用の共通キャプション文言（画像シェア・Xポストで揃える）
function buildShareText(){
  const stats = getStats();
  const totalAll  = stats.total + stats.foodTotal + stats.gardenTotal;
  const doneAll   = stats.done  + stats.foodDone  + stats.gardenDone;
  const percent   = totalAll > 0 ? Math.floor(doneAll / totalAll * 100) : 0;
  const authAll   = stats.authCount + stats.foodAuthDone + stats.gardenAuthDone;
  return `はとぴ図鑑 コンプ率 ${percent}%！\n認証マスター ${authAll}種獲得！\n#ハートピア\n#ハートピアスローライフ\n#Heartopia\n#はとぴ図鑑`;
}

// 画像を保存・共有(Web Share API。対応端末では画像とテキストを同時に共有できる)
async function shareImage(){
  shareCanvas.toBlob(async (blob)=>{
    const file = new File([blob], "hatopi-comp.png", {type:"image/png"});
    const text = buildShareText();
    if(navigator.canShare && navigator.canShare({files:[file]})){
      try{
        await navigator.share({
          files:[file],
          title:"はとぴ図鑑 コンプ状況",
          text
        });
      }catch(e){}
    }else{
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hatopi-comp.png";
      a.click();
    }
  });
}

// ============================================================
// プロフィール入力（タスク#36）
// 入力内容はlocalStorageに一切保存しない。ページ内のメモリ上にのみ
// 保持し、共有ボタンを押すたびに前回値をフォームへ再セットする
// （リロードすれば消える＝仕様通り「保存しない」）
// ============================================================
const SHARE_STYLE_TAG_PRESETS = ["女性多め","夜更かし","まったり勢","ガチ勢","初心者","のんびり勢","コレクター気質"];
const SHARE_AGE_OPTIONS = ["10代","20代","30代","40代","50代以上"];
const SHARE_GENDER_OPTIONS = ["男性","女性","その他"];

let shareProfileDraft = {
  name: "", id: "", level: 1,
  styleTags: [],
  ageGroup: "", genderGroup: "",
  message: "",
  iconDataUrl: null,
};
// 選択されたアイコン画像（未選択時はnaturalWidth=0のまま。サーバーには送信しない）
const shareProfileIconImg = new Image();

function hasProfileName(profile) {
  return !!(profile && profile.name && profile.name.trim());
}

// ============================================================
// モーダル配線
// ============================================================
const shareBtn = document.getElementById("shareBtn");
const shareModal = document.getElementById("shareModal");
const shareCanvas = document.getElementById("shareCanvas");
const shareProfileModal = document.getElementById("shareProfileModal");
shareBtn.innerHTML = icon("share");

shareBtn.onclick = async () => {
  // 未読み込みのデータを動的に読み込む
  await Promise.all([
    loadScriptOnce("js/data-foods.js"),
    loadScriptOnce("js/data-crops.js"),
    loadScriptOnce("js/data-flowers.js"),
  ]);
  // カード内の文字に使う明朝体を読み込んでおく（未読み込みだとcanvas描画時にフォールバック体になる）
  try {
    await Promise.all([
      document.fonts.load('700 32px "Shippori Mincho"'),
      document.fonts.load('500 16px "Shippori Mincho"'),
    ]);
  } catch(e) {
    console.warn("[share-card] 明朝体フォントの読み込みに失敗しました。フォールバック書体で描画します", e);
  }
  await shareMascotReady;
  openShareProfileModal();
};

function closeShareModal(){
  shareModal.style.display = "none";
}

shareModal.onclick = (e)=>{
  if(e.target === shareModal) closeShareModal();
};

// ── プロフィール入力モーダル ──
const shareProfileNameInput    = document.getElementById("shareProfileName");
const shareProfileIdInput      = document.getElementById("shareProfileId");
const shareProfileLevelInput   = document.getElementById("shareProfileLevel");
const shareProfileLevelValue   = document.getElementById("shareProfileLevelValue");
const shareProfileTagRow       = document.getElementById("shareProfileTagRow");
const shareProfileAgeSelect    = document.getElementById("shareProfileAge");
const shareProfileGenderSelect = document.getElementById("shareProfileGender");
const shareProfileMessageInput = document.getElementById("shareProfileMessage");
const shareProfileAvatarPreview= document.getElementById("shareProfileAvatarPreview");
const shareProfileIconInput    = document.getElementById("shareProfileIconInput");

// 年代・性別の<select>は選択肢を一度だけ組み立てる（「非公開／未選択」を含む）
function buildShareProfileSelectOptions(selectEl, options, placeholderLabel) {
  selectEl.innerHTML = "";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = placeholderLabel;
  selectEl.appendChild(blank);
  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    selectEl.appendChild(o);
  });
}
buildShareProfileSelectOptions(shareProfileAgeSelect, SHARE_AGE_OPTIONS, "非公開／未選択");
buildShareProfileSelectOptions(shareProfileGenderSelect, SHARE_GENDER_OPTIONS, "非公開／未選択");

// スタイルタグのチップ（複数選択トグル）を一度だけ組み立てる
SHARE_STYLE_TAG_PRESETS.forEach(tag => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = tag;
  btn.onclick = () => {
    const idx = shareProfileDraft.styleTags.indexOf(tag);
    if (idx === -1) shareProfileDraft.styleTags.push(tag);
    else shareProfileDraft.styleTags.splice(idx, 1);
    btn.classList.toggle("active", idx === -1);
  };
  shareProfileTagRow.appendChild(btn);
});

function updateShareProfileAvatarPreview() {
  if (shareProfileDraft.iconDataUrl) {
    shareProfileAvatarPreview.style.backgroundImage = `url("${shareProfileDraft.iconDataUrl}")`;
  } else {
    shareProfileAvatarPreview.style.backgroundImage = "";
  }
}

shareProfileIconInput.addEventListener("change", () => {
  const file = shareProfileIconInput.files && shareProfileIconInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    shareProfileDraft.iconDataUrl = reader.result;
    shareProfileIconImg.src = reader.result;
    updateShareProfileAvatarPreview();
  };
  reader.onerror = () => {
    console.warn("[share-card] アイコン画像の読み込みに失敗しました");
  };
  reader.readAsDataURL(file);
});

document.getElementById("shareProfileIconBtn").onclick = () => shareProfileIconInput.click();
document.getElementById("shareProfileIconClearBtn").onclick = () => {
  shareProfileDraft.iconDataUrl = null;
  shareProfileIconImg.src = "";
  shareProfileIconInput.value = "";
  updateShareProfileAvatarPreview();
};

shareProfileLevelInput.addEventListener("input", () => {
  shareProfileLevelValue.textContent = `Lv.${shareProfileLevelInput.value}`;
});

// 前回入力値（メモリ上のdraft）をフォームへ反映して開く
function openShareProfileModal() {
  shareProfileNameInput.value = shareProfileDraft.name;
  shareProfileIdInput.value = shareProfileDraft.id;
  shareProfileLevelInput.value = shareProfileDraft.level;
  shareProfileLevelValue.textContent = `Lv.${shareProfileDraft.level}`;
  shareProfileAgeSelect.value = shareProfileDraft.ageGroup;
  shareProfileGenderSelect.value = shareProfileDraft.genderGroup;
  shareProfileMessageInput.value = shareProfileDraft.message;
  [...shareProfileTagRow.children].forEach(btn => {
    btn.classList.toggle("active", shareProfileDraft.styleTags.includes(btn.textContent));
  });
  updateShareProfileAvatarPreview();
  shareProfileModal.style.display = "block";
}

function closeShareProfileModal() {
  shareProfileModal.style.display = "none";
}

shareProfileModal.onclick = (e) => {
  if (e.target === shareProfileModal) closeShareProfileModal();
};

// フォームの値をdraftへ反映してプレビューへ進む（styleTagsはチップ操作時に反映済み）
document.getElementById("shareProfileNextBtn").onclick = async () => {
  shareProfileDraft.name = shareProfileNameInput.value.trim();
  shareProfileDraft.id = shareProfileIdInput.value.trim();
  shareProfileDraft.level = Number(shareProfileLevelInput.value) || 1;
  shareProfileDraft.ageGroup = shareProfileAgeSelect.value;
  shareProfileDraft.genderGroup = shareProfileGenderSelect.value;
  shareProfileDraft.message = shareProfileMessageInput.value.trim();

  closeShareProfileModal();
  // 背景画像の読み込み待ちがモーダル内のスピナーで見えるよう、先にモーダルを開いてから描画する
  shareModal.style.display = "block";
  await drawShareCard();
};

// ============================================================
// レイアウト／テーマ選択（タスク#37）
// SHARE_LAYOUTS/SHARE_THEMESのキー・labelから動的にボタンを組み立てる。
// 選択はプロフィール項目とは別にlocalStorageへ記憶し、次回シェア時も
// 同じ設定で開く
// ============================================================
const shareLayoutRow = document.getElementById("shareLayoutRow");
const shareThemeRow  = document.getElementById("shareThemeRow");

function buildShareControlButtons(rowEl, options, currentKey, onSelect) {
  rowEl.innerHTML = "";
  Object.keys(options).forEach(key => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = options[key].label;
    btn.classList.toggle("active", key === currentKey);
    btn.onclick = async () => {
      [...rowEl.children].forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      await onSelect(key);
    };
    rowEl.appendChild(btn);
  });
}

function renderShareControlRows() {
  buildShareControlButtons(shareLayoutRow, SHARE_LAYOUTS, currentShareLayout, async (key) => {
    currentShareLayout = key;
    localStorage.setItem(SHARE_LAYOUT_STORAGE_KEY, key);
    await drawShareCard();
  });
  buildShareControlButtons(shareThemeRow, SHARE_THEMES, currentShareTheme, async (key) => {
    currentShareTheme = key;
    localStorage.setItem(SHARE_THEME_STORAGE_KEY, key);
    await drawShareCard();
  });
}
renderShareControlRows();
