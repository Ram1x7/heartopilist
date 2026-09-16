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
    ...SHARE_THEME_TOKENS,
  },
  sakuraPink: {
    label: "桜ピンク",
    bgImage: {
      portrait:  "assets/share-bg/sakura-pink_portrait.png",
      landscape: "assets/share-bg/sakura-pink_landscape.png",
    },
    fallbackTop: "#fdf3ee", fallbackBottom: "#f8dbe4",
    ...SHARE_THEME_TOKENS,
  },
  skyBlue: {
    label: "水色×白",
    bgImage: {
      portrait:  "assets/share-bg/sky-blue_portrait.png",
      landscape: "assets/share-bg/sky-blue_landscape.png",
    },
    fallbackTop: "#eaf6fb", fallbackBottom: "#cfe9f5",
    ...SHARE_THEME_TOKENS,
  },
  forestGreen: {
    label: "深緑×金",
    bgImage: {
      portrait:  "assets/share-bg/forest-green_portrait.png",
      landscape: "assets/share-bg/forest-green_landscape.png",
    },
    fallbackTop: "#f4f1e2", fallbackBottom: "#dfe6c8",
    ...SHARE_THEME_TOKENS,
  },
};
const SHARE_THEME_DEFAULT = "navyGold";
let currentShareTheme = SHARE_THEME_DEFAULT; // テーマ切替UIができるまでは固定

// ============================================================
// レイアウト定義（縦長のみ実装。横長は次タスクで追加）
// ============================================================
// wは背景アートの実サイズ(1086×1448 = 3:4)に合わせた固定サイズ。
// 中身の合計が枠より小さい分は上下中央寄せにする（drawShareCard参照）
const SHARE_LAYOUTS = {
  portrait: { w: 960, h: 1280, sections: ["header", "medal", "categoryGrid", "footer"] },
};
const SHARE_LAYOUT_DEFAULT = "portrait";

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

function drawProgressBar(ctx, x, y, bw, bh, pct, theme) {
  ctx.fillStyle = theme.track;
  ctx.beginPath(); ctx.roundRect(x, y, bw, bh, bh / 2); ctx.fill();
  if (pct > 0) {
    const g = ctx.createLinearGradient(x, 0, x + bw, 0);
    g.addColorStop(0, theme.goldDeep);
    g.addColorStop(1, theme.gold);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x, y, bw * pct / 100, bh, bh / 2); ctx.fill();
  }
}

// ============================================================
// セクション：header（マスコット・タイトル・区切り線）
// ============================================================
const HEADER_HEIGHT = 262;

function drawHeaderSection(ctx, x, y, w, theme) {
  const mascotR  = 56;
  const mascotCx = x + w / 2;
  const mascotCy = y + 34 + mascotR;

  ctx.save();
  ctx.beginPath(); ctx.arc(mascotCx, mascotCy, mascotR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (shareMascotImg.complete && shareMascotImg.naturalWidth > 0) {
    ctx.drawImage(shareMascotImg, mascotCx - mascotR, mascotCy - mascotR, mascotR * 2, mascotR * 2);
  } else {
    ctx.fillStyle = theme.panel;
    ctx.fillRect(mascotCx - mascotR, mascotCy - mascotR, mascotR * 2, mascotR * 2);
  }
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(mascotCx, mascotCy, mascotR, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = theme.gold;
  ctx.stroke();
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
  ctx.fillStyle = theme.inkSub;
  ctx.font = `12px ${SERIF}`;
  ctx.save();
  ctx.letterSpacing = "0.28em";
  ctx.fillText("C O M P L E T E   S T A T U S", x + w / 2, subtitleY);
  ctx.restore();

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
// セクション：medal（総合コンプ率の二重リングメダル）
// ============================================================
const MEDAL_R = 76;
const MEDAL_HEIGHT = MEDAL_R * 2 + 34 + 18; // メダル＋done/total行＋脚注行

function drawMedalSection(ctx, x, y, w, theme, data) {
  const totalAll = data.stats.total + data.stats.foodTotal + data.stats.gardenTotal;
  const doneAll  = data.stats.done  + data.stats.foodDone  + data.stats.gardenDone;
  const totalPct = totalAll > 0 ? Math.floor(doneAll / totalAll * 100) : 0;
  const medalCx  = x + w / 2;
  const medalCy  = y + MEDAL_R;

  ctx.save();
  ctx.shadowColor  = "rgba(120,100,60,0.18)";
  ctx.shadowBlur   = 16;
  ctx.shadowOffsetY = 6;
  ctx.beginPath(); ctx.arc(medalCx, medalCy, MEDAL_R, 0, Math.PI * 2);
  ctx.fillStyle = theme.panel;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = theme.gold;
  ctx.beginPath(); ctx.arc(medalCx, medalCy, MEDAL_R, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(163,133,79,0.45)";
  ctx.beginPath(); ctx.arc(medalCx, medalCy, MEDAL_R - 8, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = theme.vermillion;
  ctx.font = `700 44px ${SERIF}`;
  ctx.fillText(`${totalPct}%`, medalCx, medalCy + 8);

  ctx.fillStyle = theme.inkSub;
  ctx.font = `12px ${SERIF}`;
  ctx.fillText("総 合 コ ン プ 率", medalCx, medalCy + 34);

  ctx.fillStyle = theme.ink;
  ctx.font = "13px sans-serif";
  ctx.fillText(`${doneAll} / ${totalAll}`, medalCx, medalCy + MEDAL_R + 28);

  // 総合%には図鑑の砂像・雪像（カードには出ないカテゴリ）も含む旨の注記
  ctx.fillStyle = theme.inkSub;
  ctx.font = "10px sans-serif";
  ctx.fillText("※図鑑全体（砂像・雪像含む）で集計", medalCx, medalCy + MEDAL_R + 46);

  return MEDAL_HEIGHT;
}

// ============================================================
// セクション：categoryGrid（3列×2行、6カテゴリ）
// ============================================================
const CATEGORY_MARGIN_X = 64;
const CATEGORY_GAP = 20;
const CATEGORY_CARD_H = 172;
const CATEGORY_GRID_HEIGHT = CATEGORY_CARD_H * 2 + CATEGORY_GAP + 16;

function drawCategoryCard(ctx, x, cy, cw, ch, cat, theme) {
  ctx.save();
  ctx.shadowColor  = "rgba(120,100,60,0.14)";
  ctx.shadowBlur   = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = theme.panel;
  ctx.beginPath(); ctx.roundRect(x, cy, cw, ch, 14); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = theme.panelLine;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, cy, cw, ch, 14); ctx.stroke();
  ctx.restore();

  const cornerLen = 12;
  drawCorner(ctx, x + 6,      cy + 6,      cornerLen, 0,             theme.goldDeep);
  drawCorner(ctx, x + cw - 6, cy + 6,      cornerLen, Math.PI / 2,   theme.goldDeep);
  drawCorner(ctx, x + cw - 6, cy + ch - 6, cornerLen, Math.PI,       theme.goldDeep);
  drawCorner(ctx, x + 6,      cy + ch - 6, cornerLen, -Math.PI / 2,  theme.goldDeep);

  const cx  = x + cw / 2;
  const pct = cat.total > 0 ? Math.floor(cat.done / cat.total * 100) : 0;

  // アイコン入り印章風バッジ
  const badgeR  = 26;
  const badgeCy = cy + 36;
  ctx.beginPath(); ctx.arc(cx - 30, badgeCy, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = `${cat.accent}1f`;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = cat.accent;
  ctx.stroke();
  drawIcon(ctx, cat.icon, cx - 30, badgeCy, 26, cat.accent);

  ctx.textAlign = "left";
  ctx.fillStyle = theme.indigo;
  ctx.font = `700 15px ${SERIF}`;
  ctx.fillText(cat.label, cx + 2, badgeCy + 5);

  ctx.textAlign = "center";
  ctx.fillStyle = theme.vermillion;
  ctx.font = `700 27px ${SERIF}`;
  ctx.fillText(`${pct}%`, cx, cy + 96);

  ctx.fillStyle = theme.inkSub;
  ctx.font = "11px sans-serif";
  ctx.fillText(`${cat.done} / ${cat.total}`, cx, cy + 114);

  drawProgressBar(ctx, x + 16, cy + 126, cw - 32, 6, pct, theme);

  ctx.fillStyle = theme.inkSub;
  ctx.font = "10px sans-serif";
  ctx.fillText(`認証 ${cat.authDone} / ${cat.authTotal}`, cx, cy + 154);
}

function drawCategoryGridSection(ctx, x, y, w, theme, data) {
  const cols = 3, rows = 2;
  const cardW  = (w - CATEGORY_MARGIN_X * 2 - CATEGORY_GAP * (cols - 1)) / cols;

  data.categories.forEach((cat, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cardX = x + CATEGORY_MARGIN_X + col * (cardW + CATEGORY_GAP);
    const cardY = y + row * (CATEGORY_CARD_H + CATEGORY_GAP);
    drawCategoryCard(ctx, cardX, cardY, cardW, CATEGORY_CARD_H, cat, theme);
  });

  return CATEGORY_GRID_HEIGHT;
}

// ============================================================
// セクション：footer（作成日）
// ============================================================
const FOOTER_HEIGHT = 50;

function drawFooterSection(ctx, x, y, w, theme) {
  ctx.strokeStyle = "rgba(163,133,79,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + CATEGORY_MARGIN_X, y + 16); ctx.lineTo(x + w - CATEGORY_MARGIN_X, y + 16);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = theme.goldDeep;
  ctx.font = `600 13px ${SERIF}`;
  ctx.fillText(new Date().toLocaleDateString("ja-JP"), x + w / 2, y + 36);

  return FOOTER_HEIGHT;
}

const SHARE_SECTIONS = {
  header:       { height: () => HEADER_HEIGHT,       draw: drawHeaderSection },
  medal:        { height: () => MEDAL_HEIGHT,        draw: drawMedalSection },
  categoryGrid: { height: () => CATEGORY_GRID_HEIGHT, draw: drawCategoryGridSection },
  footer:       { height: () => FOOTER_HEIGHT,        draw: drawFooterSection },
};

// ============================================================
// 画像生成本体
// ============================================================
async function drawShareCard() {
  const stats = getStats();
  const themeKey = currentShareTheme;
  const layoutKey = SHARE_LAYOUT_DEFAULT;
  const theme = SHARE_THEMES[themeKey];
  const layout = SHARE_LAYOUTS[layoutKey];
  const data = { stats, categories: mapCategoryStats(stats) };

  // 背景画像はテーマ×レイアウトの組み合わせごとに初回だけ読み込み、以後はキャッシュを再利用する。
  // 未読み込みの組み合わせだけモーダル内にスピナーを出す（キャッシュ済みなら一瞬で解決するので出さない）
  const cacheKey = `${themeKey}_${layoutKey}`;
  const alreadyCached = shareBgImageCache.has(cacheKey);
  if (!alreadyCached) showShareCardLoading(true);
  const bgImg = await getThemeBackgroundImage(themeKey, layoutKey);
  if (!alreadyCached) showShareCardLoading(false);

  const w = layout.w;
  const h = layout.h;
  const contentHeight = layout.sections.reduce((sum, key) => sum + SHARE_SECTIONS[key].height(w, data), 0);

  shareCanvas.width  = w;
  shareCanvas.height = h;
  const ctx = shareCanvas.getContext("2d");

  drawShareBackground(ctx, w, h, theme, bgImg);

  // 背景アートは縁取り装飾＋下部に街並みシルエットがあるため、中身を
  // 完全な中央寄せにすると下部カード・フッターが街並みと重なりやすい。
  // 上側は空きが多いぶん、余白の25%だけを上に配せば安全に収まる
  let cur = Math.max(0, (h - contentHeight) * 0.25);
  layout.sections.forEach(key => {
    cur += SHARE_SECTIONS[key].draw(ctx, 0, cur, w, theme, data);
  });
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
// モーダル配線
// ============================================================
const shareBtn = document.getElementById("shareBtn");
const shareModal = document.getElementById("shareModal");
const shareCanvas = document.getElementById("shareCanvas");
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
      document.fonts.load('600 16px "Shippori Mincho"'),
    ]);
  } catch(e) {
    console.warn("[share-card] 明朝体フォントの読み込みに失敗しました。フォールバック書体で描画します", e);
  }
  await shareMascotReady;
  // 背景画像の読み込み待ちがモーダル内のスピナーで見えるよう、先にモーダルを開いてから描画する
  shareModal.style.display = "block";
  await drawShareCard();
};

function closeShareModal(){
  shareModal.style.display = "none";
}

shareModal.onclick = (e)=>{
  if(e.target === shareModal) closeShareModal();
};
