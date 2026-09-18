// js/profile-card-renderer.js
// プロフィールカードメーカーのCanvas描画一式。
// 「固定の背景アート（縦横比・金枠は一切加工しない）」の上に、
// テーマ連動の装飾・入力値をCanvasで動的に重ねる。
// プレビュー・PNG保存は同じrenderCard()を呼ぶ（表示サイズはCSSでの縮小のみ）。

const SERIF_FONT = "'Shippori Mincho', serif";
const SANS_FONT = "'Zen Maru Gothic', sans-serif";

const PROFILE_CARD_THEME_IDS = ["navy-gold", "sakura-pink", "sky-blue", "forest-green"];

// テーマ別の正式プロフィールパーツ画像（アバター枠・ID/開拓者レベル/プレイスタイルの
// ラベル済みバッジ・タグ枠）。座標はスプライトシートのアルファ値を実測して切り出し済みの
// 個別PNG（images/profile-card/parts/<theme>/*.png）に対する値。
// hole = アバター円形クリップの中心・半径。valueRect = バッジ内の動的な値を描く空欄矩形。
// cap = タグ枠を9-slice描画する際の左右端（固定幅）の幅。
function PC_MAKE_PROFILE_PARTS(theme, parts) {
  const base = `images/profile-card/parts/${theme}`;
  return {
    avatarFrame: { src: `${base}/avatar-frame.png`, ...parts.avatarFrame },
    infoId:      { src: `${base}/info-id.png`, ...parts.infoId },
    infoLevel:   { src: `${base}/info-level.png`, ...parts.infoLevel },
    infoStyle:   { src: `${base}/info-style.png`, ...parts.infoStyle },
    tagFrame:    { src: `${base}/tag-frame.png`, ...parts.tagFrame },
  };
}

// テーマ共通トークン＋テーマ固有の配色。すべてこのオブジェクトへ集約し、
// 描画関数側にテーマ分岐を書かない（テーマを増やす時もここへ追記するだけでよい）
const PROFILE_CARD_THEMES = {
  "navy-gold": {
    label: "紺×金",
    backgrounds: {
      landscape: "images/profile-card/backgrounds/navy-gold_landscape.PNG",
      portrait:  "images/profile-card/backgrounds/navy-gold_portrait.PNG",
    },
    medalFrame: "images/profile-card/parts/medal-frame_navy-gold.PNG",
    profileParts: PC_MAKE_PROFILE_PARTS("navy-gold", {
      avatarFrame: { size: [468, 489], hole: { cx: 248.5, cy: 263.0, r: 187.0 } },
      infoId:      { size: [528, 102], valueRect: { x: 220, y: 15, w: 285, h: 73 } },
      infoLevel:   { size: [532, 105], valueRect: { x: 345, y: 16, w: 165, h: 75 } },
      infoStyle:   { size: [532, 105], valueRect: { x: 348, y: 15, w: 162, h: 75 } },
      tagFrame:    { size: [357, 104], cap: 37 },
    }),
    ink: "#2c2a24", inkSub: "#5c5548",
    panel: "rgba(255,253,247,0.82)", panelLine: "rgba(200,168,107,0.55)",
    indigo: "#233a52", vermillion: "#b1503b",
    gold: "#c8a86b", goldDeep: "#93763f", goldLight: "#e3cd97", goldHighlight: "#fff6e0",
    accentBadgeText: "#f2e9d3",
    tagTextColor: "#f2e9d3",
    medalDiscFrom: "#1c3350", medalDiscTo: "#0a1626",
    numberGradient: ["#8a6633", "#c8a86b", "#e3cd97", "#fff6e0"],
  },
  "sakura-pink": {
    label: "桜ピンク",
    backgrounds: {
      landscape: "images/profile-card/backgrounds/sakura-pink_landscape.PNG",
      portrait:  "images/profile-card/backgrounds/sakura-pink_portrait.PNG",
    },
    medalFrame: "images/profile-card/parts/medal-frame_sakura-pink.PNG",
    profileParts: PC_MAKE_PROFILE_PARTS("sakura-pink", {
      avatarFrame: { size: [465, 486], hole: { cx: 246.0, cy: 250.5, r: 181.5 } },
      infoId:      { size: [531, 106], valueRect: { x: 209, y: 19, w: 297, h: 71 } },
      infoLevel:   { size: [556, 107], valueRect: { x: 350, y: 17, w: 179, h: 74 } },
      infoStyle:   { size: [564, 107], valueRect: { x: 372, y: 17, w: 165, h: 74 } },
      tagFrame:    { size: [393, 113], cap: 53 },
    }),
    ink: "#3a2a2c", inkSub: "#6b5457",
    panel: "rgba(255,250,250,0.85)", panelLine: "rgba(214,150,160,0.55)",
    indigo: "#7a2e42", vermillion: "#c15a40",
    gold: "#d9a97b", goldDeep: "#a8735a", goldLight: "#f0c9a0", goldHighlight: "#fff0e3",
    accentBadgeText: "#5c1f2e",
    tagTextColor: "#fff5f7",
    medalDiscFrom: "#fdf1ee", medalDiscTo: "#f7dde2",
    numberGradient: ["#a8543c", "#d97b5c", "#f0ac8f", "#fff7f5"],
  },
  "sky-blue": {
    label: "水色",
    backgrounds: {
      landscape: "images/profile-card/backgrounds/sky-blue_landscape.PNG",
      portrait:  "images/profile-card/backgrounds/sky-blue_portrait.PNG",
    },
    medalFrame: "images/profile-card/parts/medal-frame_sky-blue.PNG",
    profileParts: PC_MAKE_PROFILE_PARTS("sky-blue", {
      avatarFrame: { size: [455, 461], hole: { cx: 235.0, cy: 236.0, r: 170.0 } },
      infoId:      { size: [515, 105], valueRect: { x: 197, y: 18, w: 300, h: 74 } },
      infoLevel:   { size: [517, 106], valueRect: { x: 303, y: 19, w: 197, h: 74 } },
      infoStyle:   { size: [517, 106], valueRect: { x: 310, y: 20, w: 189, h: 73 } },
      tagFrame:    { size: [312, 107], cap: 45 },
    }),
    ink: "#1f2c38", inkSub: "#51626f",
    panel: "rgba(250,253,255,0.85)", panelLine: "rgba(150,190,214,0.55)",
    indigo: "#1f4d6b", vermillion: "#b1503b",
    gold: "#bcd3df", goldDeep: "#7a95a5", goldLight: "#e3eef4", goldHighlight: "#ffffff",
    accentBadgeText: "#1f4d6b",
    tagTextColor: "#1f4d6b",
    medalDiscFrom: "#eaf6fb", medalDiscTo: "#cfe4ee",
    numberGradient: ["#7a95a5", "#bcd3df", "#eef6fb", "#ffffff"],
  },
  "forest-green": {
    label: "深緑",
    backgrounds: {
      landscape: "images/profile-card/backgrounds/forest-green_landscape.PNG",
      portrait:  "images/profile-card/backgrounds/forest-green_portrait.PNG",
    },
    medalFrame: "images/profile-card/parts/medal-frame_forest-green.PNG",
    profileParts: PC_MAKE_PROFILE_PARTS("forest-green", {
      avatarFrame: { size: [468, 490], hole: { cx: 251.0, cy: 258.5, r: 185.5 } },
      infoId:      { size: [520, 110], valueRect: { x: 214, y: 19, w: 275, h: 73 } },
      infoLevel:   { size: [530, 112], valueRect: { x: 327, y: 19, w: 173, h: 76 } },
      infoStyle:   { size: [531, 110], valueRect: { x: 348, y: 19, w: 153, h: 74 } },
      tagFrame:    { size: [375, 108], cap: 41 },
    }),
    ink: "#242c22", inkSub: "#535f4e",
    panel: "rgba(253,253,247,0.82)", panelLine: "rgba(150,168,107,0.55)",
    indigo: "#2c4a2e", vermillion: "#a8542f",
    gold: "#b9a35a", goldDeep: "#8a7530", goldLight: "#d8c98a", goldHighlight: "#f5efce",
    accentBadgeText: "#f2f0d3",
    tagTextColor: "#f2f0d3",
    medalDiscFrom: "#1c3320", medalDiscTo: "#0d1f12",
    numberGradient: ["#7a5c26", "#b9a35a", "#d8c98a", "#f5efce"],
  },
};

// カテゴリー別アクセントカラー（テーマに関わらず固定。アイコンバッジ・進捗バーの色分けに使う）
const PROFILE_CARD_CATEGORY_COLORS = {
  fish:        { main: "#3b7bb8", soft: "rgba(59,123,184,0.16)" },
  bug:         { main: "#5a9e4a", soft: "rgba(90,158,74,0.16)" },
  bird:        { main: "#c15a4a", soft: "rgba(193,90,74,0.16)" },
  shell:       { main: "#8a6bb0", soft: "rgba(138,107,176,0.16)" },
  sand:        { main: "#c9a15a", soft: "rgba(201,161,90,0.16)" },
  snow:        { main: "#6fb3c9", soft: "rgba(111,179,201,0.16)" },
  food:        { main: "#d98a3a", soft: "rgba(217,138,58,0.16)" },
  garden:      { main: "#d15a8a", soft: "rgba(209,90,138,0.16)" },
  achievement: { main: "#c9932e", soft: "rgba(201,147,46,0.16)" },
};
function pcCategoryColor(id) {
  return PROFILE_CARD_CATEGORY_COLORS[id] || { main: "#8a7f6a", soft: "rgba(138,127,106,0.16)" };
}

// 背景アートの実寸（拡張・縮小・トリミング禁止のため、実ファイルの寸法をそのままCanvasサイズにする）
const PROFILE_CARD_LAYOUTS = {
  // 横型は参考画像（1672×941、キャンバスと同解像度）の実測座標に基づく。
  // 各キーの意味はコメントの通り。値を変える際は必ず参考画像との差分（px/%）を確認すること。
  landscape: {
    width: 1672, height: 941,
    // アバター：正式パーツ(avatar-frame.png)使用。rはPNG実測の透明穴（アバター写真を置く円）の半径。
    // 枠自体はPNGの実寸比率でrから自動計算されるため、外周装飾込みの可視サイズはr×約1.22倍になる
    avatar: { cx: 175, cy: 260, r: 108 },
    // プレイヤー名：アバター右、左詰め（参考画像実測でフォントサイズを60→68に拡大）
    name: { x: 300, y: 232, fontSize: 68, maxWidth: 500 },
    // ID・開拓者レベル・サーバー・プレイスタイル：正式バッジ画像（ラベル・アイコン焼き込み済み）を縦に積む。
    // badgeHeight=画像の描画高さ（この高さへ等比拡縮）。サーバーのみ正式パーツが無いため濃色ラベル枠(fontSize)を使用
    profileBadges: {
      x: 300, y: 270, pitch: 66, badgeHeight: 54, maxWidth: 340,
      fontSize: 19, valueFontSize: 20, gap: 16,
    },
    // タグ（自由入力タグ・チップ形式、左詰め）：正式パーツ(tag-frame.png)を9-sliceで繰り返し使用。
    // バッジ列の下、カード左マージンに揃える。maxRows=2でメダル領域への侵入を防ぐ
    tags: { x: 40, y: 505, height: 44, fontSize: 19, gap: 12, rowGap: 10, maxWidth: 500, maxRows: 2 },
    // 活動時間：タグの下（参考画像に実例なしのため、タグ〜自己紹介間に安全マージン込みで配置）
    playTime: { x: 40, fontSize: 17, gapAbove: 14 },
    // 自己紹介：左詰め、参考画像実測でフォントサイズを24→44に拡大、行間68
    bio: { x: 40, y: 600, fontSize: 44, lineHeight: 68, maxLines: 2, maxWidth: 477, gapAbove: 16 },
    // SNS・サイト情報（参考画像に実例なしのため、自己紹介の下へ配置。フォントも拡大）
    socials: { x: 40, fontSize: 22, gap: 26, gapAbove: 18 },
    // 中央メダル：中心(814,423) 半径168。
    // メダル画像はリング半径だけでなく、宝石・花・リボン・吊り飾りが外側へ大きく張り出すため、
    // アルファ値のある可視ピクセル全体の外接矩形（参考画像で実測: left585 top90 right1040 bottom755）
    // を基準にスケールを決定した（リング半径のみで一致判定しないこと）
    medal: { cx: 814, cy: 423, r: 168, labelOffsetY: -12 },
    // カテゴリカード：208×196、間隔20、2列×3行、開始(1120,120)（カード単体の外接矩形を実測）
    categoryGrid: { x: 1120, y: 120, cardW: 208, cardH: 196, gap: 20, cols: 2, rows: 3 },
    // 作成日：左下のピル。「作成日：」の接頭辞込みで参考画像に一致させる（参考画像実測でやや大きく）
    date: { x: 65, y: 868, fontSize: 24, prefix: "作成日：" },
    // はとぴ図鑑ロゴ：右下、参考画像実測で大幅に拡大（参考画像はロゴが帯の主役級に大きい）
    brandLogo: { x: 1350, y: 852, fontSize: 50, iconSize: 54 },
    // 非公式表記：参考画像には表示されていないが必須要件のため、最下部に控えめに残す
    disclaimer: { y: 925, fontSize: 10 },
    safeTop: 20, safeBottom: 900, safeLeft: 40, safeRight: 1632,
  },
  // 縦型は横型の縮小・回転ではなく専用構成：
  // 上部＝アバター＋右側にヘッダー情報（名前・ID・レベル・プレイスタイル・タグ・自己紹介）を横並び、
  // 中央＝大きな総合コンプリート率メダル、下部＝カテゴリーカード3列×2行、最下部＝作成日・ロゴ。
  // header.*以下のキーはdrawProfileInfoPortrait専用（drawProfileInfo/drawSocialInfoとは形が異なる）。
  portrait: {
    width: 1086, height: 1448,
    // アバター：正式パーツ使用。rはPNG実測の透明穴（アバター写真）の半径（横型とは別の縦型専用値）
    avatar: { cx: 240, cy: 190, r: 100 },
    header: { x: 400, maxWidth: 600 },
    name: { y: 108, fontSize: 34 },
    // ID・開拓者レベル・サーバー・プレイスタイル：正式バッジ画像を横フローで並べる（縦型専用の高さ・位置）
    idLevel: { y: 146, fontSize: 14, badgeHeight: 38 },
    // タグ：正式パーツ(tag-frame.png)を9-sliceで使用（縦型専用の高さ）
    styleTags: { y: 200, fontSize: 14, tagHeight: 28, maxRows: 2 },
    bio: { fontSize: 15, lineHeight: 26, maxLines: 2 },
    sub: { fontSize: 11, gap: 15 },
    // メダル画像は装飾がリング半径の約1.55倍まで外側に張り出すため、
    // 上のヘッダー情報・下のカテゴリカードと重ならないようr/cyを再調整（rを272→190に縮小）
    medal: { cx: 543, cy: 605, r: 190, labelOffsetY: -14 },
    categoryGrid: { x: 55, y: 928, cardW: 316, cardH: 195, gap: 14, cols: 3, rows: 2 },
    date: { x: 140, y: 1400, fontSize: 13 },
    brandLogo: { x: 940, y: 1400, fontSize: 20, iconSize: 26 },
    disclaimer: { y: 1434, fontSize: 10 },
    safeTop: 40, safeBottom: 1400, safeLeft: 40, safeRight: 1046,
  },
};

// ============================================================
// 汎用描画ヘルパー
// ============================================================
function pcDrawIcon(ctx, name, cx, cy, size, color) {
  const body = typeof ICONS !== "undefined" ? ICONS[name] : null;
  if (!body) return;
  const matches = [...body.matchAll(/d="([^"]+)"/g)];
  if (!matches.length) return;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = "none";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  matches.forEach(m => {
    const p = new Path2D(m[1]);
    ctx.stroke(p);
  });
  ctx.restore();
}

function pcFitTextWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid) + "…").width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + "…";
}

// 指定幅で折り返し、maxLines超過分は末尾へ「…」（日本語は文字単位で折り返す）
function pcWrapText(ctx, text, maxWidth, maxLines) {
  const chars = Array.from(text || "");
  const lines = [];
  let cur = "";
  for (let i = 0; i < chars.length; i++) {
    const test = cur + chars[i];
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = chars[i];
      if (lines.length === maxLines) {
        cur = pcFitTextWidth(ctx, cur + chars.slice(i + 1).join(""), maxWidth);
        lines.push(cur);
        return lines;
      }
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

function pcDrawBadgePill(ctx, cx, y, text, theme, fontPx) {
  ctx.font = `${fontPx}px ${SANS_FONT}`;
  const w = ctx.measureText(text).width + 24;
  const h = fontPx + 12;
  const x = cx - w / 2;
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
  ctx.fillStyle = theme.indigo;
  ctx.textAlign = "center";
  ctx.fillText(text, cx, y + h / 2 + fontPx * 0.35);
  return h;
}

// align="center"（既定）はxを中心に、align="left"はxを左端として配置する
function pcDrawNoteWithPanel(ctx, x, y, text, theme, fontPx, align) {
  align = align || "center";
  ctx.font = `${fontPx}px ${SANS_FONT}`;
  const w = ctx.measureText(text).width + 20;
  const h = fontPx + 10;
  const boxX = align === "left" ? x : x - w / 2;
  const textX = align === "left" ? x + w / 2 : x;
  ctx.save();
  ctx.fillStyle = "rgba(255,253,247,0.8)";
  ctx.beginPath();
  ctx.roundRect(boxX, y - fontPx * 0.85, w, h, h / 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = theme.inkSub;
  ctx.textAlign = "center";
  ctx.fillText(text, textX, y);
}

// 宝飾風のダイヤモンド型アクセント（メダル上部・アバター縁取りで共用）
function pcDrawGemAccent(ctx, cx, cy, size, theme) {
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
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.beginPath();
  ctx.moveTo(-size * 0.18, -size * 0.32);
  ctx.lineTo(size * 0.05, -size * 0.32);
  ctx.lineTo(-size * 0.12, -size * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function pcDrawOrnamentalCorner(ctx, cx, cy, len, rot, color, colorDeep) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, len); ctx.lineTo(0, 0); ctx.lineTo(len, 0);
  ctx.stroke();
  ctx.strokeStyle = colorDeep;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(4, len - 3); ctx.lineTo(4, 4); ctx.lineTo(len - 3, 4);
  ctx.stroke();
  ctx.restore();
}

function pcDrawProgressBar(ctx, x, y, w, h, pct, theme, accent) {
  ctx.save();
  ctx.fillStyle = "rgba(122,113,100,0.14)";
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = theme.panelLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  ctx.restore();
  if (pct > 0) {
    const fillW = Math.max(h, w * pct / 100);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, accent || theme.goldDeep);
    g.addColorStop(1, theme.gold);
    ctx.save();
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x, y, fillW, h, h / 2); ctx.fill();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.roundRect(x, y, fillW, Math.max(1.5, h * 0.4), h * 0.2); ctx.fill();
    ctx.restore();
  }
}

// 金の多重描画数字（外側シャドウ→濃縁→明縁→グラデーション本体→ハイライト縁）
function pcDrawGoldNumber(ctx, text, x, y, fontSizePx, align, theme) {
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${Math.round(fontSizePx)}px ${SERIF_FONT}`;
  ctx.lineJoin = "round";

  ctx.shadowColor = "rgba(20,15,5,0.45)";
  ctx.shadowBlur = fontSizePx * 0.08;
  ctx.shadowOffsetY = fontSizePx * 0.03;
  ctx.strokeStyle = theme.goldDeep;
  ctx.lineWidth = fontSizePx * 0.11;
  ctx.strokeText(text, x, y);

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.strokeStyle = theme.goldLight;
  ctx.lineWidth = fontSizePx * 0.05;
  ctx.strokeText(text, x, y);

  const grad = ctx.createLinearGradient(x, y - fontSizePx * 0.78, x, y + fontSizePx * 0.12);
  const stops = theme.numberGradient;
  stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillText(text, x, y);

  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = Math.max(1, fontSizePx * 0.01);
  ctx.strokeText(text, x, y);
  ctx.restore();
}

// リボン風バナー（両端が矢羽根状に切れ込んだ帯）。中央メダルの見出しに使用。
function pcDrawRibbonBanner(ctx, cx, y, text, theme, fontPx) {
  ctx.font = `700 ${fontPx}px ${SERIF_FONT}`;
  const textW = ctx.measureText(text).width;
  const padX = fontPx * 1.1;
  const w = textW + padX * 2;
  const h = fontPx * 1.9;
  const notch = h * 0.32;
  const x = cx - w / 2;
  const top = y - h / 2;
  ctx.save();
  ctx.shadowColor = "rgba(20,15,5,0.25)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + w, top);
  ctx.lineTo(x + w - notch, top + h / 2);
  ctx.lineTo(x + w, top + h);
  ctx.lineTo(x, top + h);
  ctx.lineTo(x + notch, top + h / 2);
  ctx.closePath();
  const g = ctx.createLinearGradient(x, top, x, top + h);
  g.addColorStop(0, theme.indigo);
  g.addColorStop(1, theme.goldDeep);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = theme.accentBadgeText;
  ctx.textAlign = "center";
  ctx.letterSpacing = "1px";
  ctx.fillText(text, cx, y + fontPx * 0.32);
  ctx.letterSpacing = "0px";
}

// メダル下部に垂らす小さなリボン結び（テーマの金・差し色で描く装飾）
function pcDrawRibbonBow(ctx, cx, cy, size, theme) {
  ctx.save();
  ctx.translate(cx, cy);
  const wingGrad = ctx.createLinearGradient(-size * 1.3, 0, size * 1.3, 0);
  wingGrad.addColorStop(0, theme.goldDeep);
  wingGrad.addColorStop(0.5, theme.gold);
  wingGrad.addColorStop(1, theme.goldDeep);
  ctx.fillStyle = wingGrad;
  ctx.strokeStyle = theme.goldDeep;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-size * 1.1, -size * 0.55, -size * 1.3, 0);
  ctx.quadraticCurveTo(-size * 1.1, size * 0.55, 0, 0);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 1.1, -size * 0.55, size * 1.3, 0);
  ctx.quadraticCurveTo(size * 1.1, size * 0.55, 0, 0);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = theme.goldDeep;
  ctx.beginPath();
  ctx.moveTo(-size * 0.16, size * 0.08);
  ctx.lineTo(-size * 0.38, size * 0.95);
  ctx.lineTo(-size * 0.06, size * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.16, size * 0.08);
  ctx.lineTo(size * 0.38, size * 0.95);
  ctx.lineTo(size * 0.06, size * 0.78);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, size * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = theme.vermillion;
  ctx.fill();
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

// カテゴリーカードのアイコンバッジ（角丸四角形。カテゴリー固有色で塗る）
function pcDrawCategoryBadge(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx - size / 2, cy - size / 2, size, size, size * 0.28);
  ctx.fillStyle = color.soft;
  ctx.fill();
  ctx.strokeStyle = color.main;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
}

// 令和などの和暦表記（Intl未対応環境では令和のみの簡易フォールバック）
function pcFormatJapaneseEraDate(date) {
  try {
    return new Intl.DateTimeFormat("ja-JP-u-ca-japanese", {
      era: "long", year: "numeric", month: "long", day: "numeric",
    }).format(date);
  } catch (e) {
    const reiwaYear = date.getFullYear() - 2018;
    return `令和${reiwaYear}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
}

// 左詰めアイコン付きピル（縦型ヘッダー用。中央揃えのpcDrawInfoRowと違い、左端xを基準に幅を内容から自動計算する）
function pcMeasureInfoPill(ctx, text, fontPx) {
  ctx.font = `600 ${fontPx}px ${SANS_FONT}`;
  const textW = ctx.measureText(text).width;
  const h = fontPx + 16;
  const w = h + 10 + textW + 14;
  return { w, h };
}

function pcDrawInfoPillAt(ctx, x, y, iconName, text, theme, fontPx, w, h) {
  ctx.save();
  ctx.shadowColor = "rgba(120,100,60,0.12)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = theme.panel;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = theme.panelLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.stroke();
  pcDrawIcon(ctx, iconName, x + h / 2, y + h / 2, fontPx * 0.95, theme.goldDeep);
  ctx.font = `600 ${fontPx}px ${SANS_FONT}`;
  ctx.fillStyle = theme.ink;
  ctx.textAlign = "left";
  ctx.fillText(text, x + h + 2, y + h / 2 + fontPx * 0.35);
}

// 濃色ラベル枠（横型のID・開拓者レベル・プレイスタイル用。参考画像は白ピルではなく
// 濃紺地に金枠＋明色文字の小ラベルのため、pcDrawInfoPillAtとは別に用意する）
function pcMeasureDarkInfoPill(ctx, text, fontPx) {
  ctx.font = `700 ${fontPx}px ${SANS_FONT}`;
  const textW = ctx.measureText(text).width;
  const h = fontPx + 16;
  const w = h + 8 + textW + 16;
  return { w, h };
}

function pcDrawDarkInfoPillAt(ctx, x, y, iconName, text, theme, fontPx, w, h) {
  ctx.save();
  ctx.shadowColor = "rgba(20,15,5,0.25)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = theme.indigo;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.stroke();
  ctx.save();
  ctx.beginPath(); ctx.arc(x + h / 2, y + h / 2, h * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = theme.goldLight;
  ctx.fill();
  ctx.restore();
  pcDrawIcon(ctx, iconName, x + h / 2, y + h / 2, fontPx * 0.72, theme.indigo);
  ctx.font = `700 ${fontPx}px ${SANS_FONT}`;
  ctx.fillStyle = theme.accentBadgeText;
  ctx.textAlign = "left";
  ctx.fillText(text, x + h + 2, y + h / 2 + fontPx * 0.35);
}

// 指定範囲内でフォントサイズを縮小してテキストをmaxWidthへ収め、それでも入らない場合のみ「…」で切る
function pcFitTextAutoShrink(ctx, text, maxWidth, maxFontPx, minFontPx, fontWeight, fontFamily) {
  let fontPx = maxFontPx;
  for (; fontPx > minFontPx; fontPx--) {
    ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  const fitted = pcFitTextWidth(ctx, text, maxWidth);
  return { fontPx, text: fitted };
}

// 正式パーツ画像（ID・開拓者レベル・プレイスタイルの、ラベル・アイコン・装飾が焼き込み済みのバッジ）を
// targetHeight基準で等比拡縮して描画し、画像実測のvalueRect内へ動的な値テキストのみを重ねる。
// ラベル文字・アイコンはCanvas側で重複描画しない。戻り値は{width, height}（積み上げ計算用）
function pcDrawInfoBadgeImg(ctx, x, y, targetHeight, badgeImg, badgeCfg, valueText, theme, valueColor) {
  const scale = targetHeight / badgeCfg.size[1];
  const w = badgeCfg.size[0] * scale;
  const h = badgeCfg.size[1] * scale;
  ctx.drawImage(badgeImg, x, y, w, h);

  if (valueText) {
    const vr = badgeCfg.valueRect;
    const vx = x + vr.x * scale;
    const vy = y + vr.y * scale;
    const vw = vr.w * scale;
    const vh = vr.h * scale;
    const pad = vw * 0.06;
    // フォントの基準サイズはtargetHeight（テーマ間で共通の描画高さ）から算出し、
    // valueRectの実測幅・高さには依存させない。これによりテーマごとの空欄の広さの違いに関わらず、
    // 通常の長さの値は同じ文字サイズで揃う。縮小範囲は狭く（最大サイズの85%まで）に留め、
    // それでも収まらない場合は縮小し続けず「…」で切り詰める（valueRectが狭いテーマだけ
    // 通常値まで過剰に縮小されるのを防ぐ）
    const maxFontPx = Math.min(targetHeight * 0.44, vh * 0.78);
    const minFontPx = Math.max(10, maxFontPx * 0.65);
    const fit = pcFitTextAutoShrink(ctx, valueText, vw - pad * 2, maxFontPx, minFontPx, 600, SANS_FONT);
    ctx.font = `600 ${fit.fontPx}px ${SANS_FONT}`;
    ctx.fillStyle = valueColor || theme.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(fit.text, vx + pad, vy + vh / 2 + fit.fontPx * 0.04);
    ctx.textBaseline = "alphabetic";
  }
  return { width: w, height: h };
}

// タグ枠（tag-frame.png）を9-slice描画し、中央にタグ文字を横縦中央揃えで重ねる。
// 左右端（cap幅）は固定、中央のみ伸縮させることで金装飾の歪みを防ぐ。戻り値は描画幅
function pcDrawTagChipImg(ctx, x, y, targetHeight, tagImg, tagCfg, text, theme, fontPx) {
  const scale = targetHeight / tagCfg.size[1];
  const capW = tagCfg.cap * scale;
  const h = targetHeight;

  ctx.font = `600 ${fontPx}px ${SANS_FONT}`;
  const textW = ctx.measureText(text).width;
  const minW = capW * 2 + 20;
  const contentW = textW + capW * 1.6;
  const w = Math.max(minW, contentW);
  const midW = Math.max(1, w - capW * 2);
  const srcCapW = tagCfg.cap;
  const srcMidW = Math.max(1, tagCfg.size[0] - srcCapW * 2);
  const srcH = tagCfg.size[1];

  // 左端
  ctx.drawImage(tagImg, 0, 0, srcCapW, srcH, x, y, capW, h);
  // 中央（伸縮）
  ctx.drawImage(tagImg, srcCapW, 0, srcMidW, srcH, x + capW, y, midW, h);
  // 右端
  ctx.drawImage(tagImg, tagCfg.size[0] - srcCapW, 0, srcCapW, srcH, x + capW + midW, y, capW, h);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.tagTextColor || theme.ink;
  ctx.fillText(text, x + w / 2, y + h / 2 + fontPx * 0.04);
  ctx.textBaseline = "alphabetic";
  return w;
}

// タグ配列をtag-frame.png（9-slice）で左詰めに並べ、maxWidthを超えたら次の行へ折り返す。
// タグ0個なら何も描画しない（空枠も出さない）。メダル領域への侵入を避けるため
// maxRowsを超えた分は描画しない（呼び出し側のtags.maxWidth/maxRowsで安全領域を制御する）。
// 戻り値は描画し終えた下端Y座標
function pcFlowTagChipsImg(ctx, tags, x, y, maxWidth, targetHeight, tagImg, tagCfg, theme, fontPx, gap, rowGap, maxRows) {
  if (!tags || !tags.length) return y;
  let cx = x, cy = y, row = 0;
  for (const text of tags) {
    ctx.font = `600 ${fontPx}px ${SANS_FONT}`;
    const textW = ctx.measureText(text).width;
    const capW = tagCfg.cap * (targetHeight / tagCfg.size[1]);
    const w = Math.max(capW * 2 + 20, textW + capW * 1.6);
    if (cx !== x && cx + w > x + maxWidth) {
      cx = x;
      cy += targetHeight + rowGap;
      row++;
      if (row >= maxRows) break;
    }
    pcDrawTagChipImg(ctx, cx, cy, targetHeight, tagImg, tagCfg, text, theme, fontPx);
    cx += w + gap;
  }
  return cy + targetHeight;
}

// [partKey,label,icon,value]配列を正式バッジ画像で左詰めに並べ、maxWidthを超えたら次の行へ折り返す
// （縦型ヘッダー用の水平フロー。横型の縦積みとは別関数）。画像が無い項目は濃色ラベル枠にフォールバック。
// 戻り値は描画し終えたY座標（次要素の開始位置に使う）
function pcFlowInfoBadgesImg(ctx, rows, x, y, maxWidth, badgeHeight, parts, theme, gap, fallbackFontPx) {
  const partsOk = parts && parts.images && parts.cfg;
  let cx = x, cy = y, rowH = badgeHeight;
  rows.forEach(([partKey, icon, label, value]) => {
    let w, h;
    if (partKey && partsOk && parts.images[partKey] && parts.cfg[partKey]) {
      w = parts.cfg[partKey].size[0] * (badgeHeight / parts.cfg[partKey].size[1]);
      h = badgeHeight;
    } else {
      const m = pcMeasureDarkInfoPill(ctx, label, fallbackFontPx);
      w = m.w; h = m.h;
    }
    if (cx !== x && cx + w > x + maxWidth) {
      cx = x;
      cy += rowH + 8;
    }
    if (partKey && partsOk && parts.images[partKey] && parts.cfg[partKey]) {
      pcDrawInfoBadgeImg(ctx, cx, cy, badgeHeight, parts.images[partKey], parts.cfg[partKey], value, theme);
    } else {
      pcDrawDarkInfoPillAt(ctx, cx, cy, icon, label, theme, fallbackFontPx, w, h);
      ctx.font = `700 ${fallbackFontPx}px ${SANS_FONT}`;
      ctx.fillStyle = theme.ink;
      ctx.textAlign = "left";
      ctx.fillText(pcFitTextWidth(ctx, value, 140), cx + w + 8, cy + h / 2 + fallbackFontPx * 0.35);
      w += 8 + ctx.measureText(value).width;
    }
    cx += w + gap;
    rowH = h;
  });
  return cy + rowH;
}

// [icon,text]配列を左詰めで並べ、maxWidthを超えたら次の行へ折り返す。戻り値は描画し終えたY座標
function pcFlowInfoPills(ctx, items, x, y, maxWidth, fontPx, theme, gap) {
  let cx = x, cy = y, rowH = fontPx + 16;
  items.forEach(([icon, text]) => {
    const { w, h } = pcMeasureInfoPill(ctx, text, fontPx);
    if (cx !== x && cx + w > x + maxWidth) {
      cx = x;
      cy += rowH + gap;
    }
    pcDrawInfoPillAt(ctx, cx, cy, icon, text, theme, fontPx, w, h);
    cx += w + gap;
    rowH = h;
  });
  return cy + rowH;
}

// プレイスタイル(ピル)＋タグ(小チップ)を左詰めで並べ、はみ出したら折り返す
function pcFlowStyleTagsRow(ctx, items, x, y, maxWidth, fontPx, theme, gap) {
  let cx = x, cy = y, rowH = fontPx + 14;
  items.forEach(item => {
    let w, h;
    const iconSize = fontPx * 0.9;
    if (item.type === "pill") {
      const m = pcMeasureInfoPill(ctx, item.text, fontPx);
      w = m.w; h = m.h;
    } else {
      ctx.font = `${fontPx}px ${SANS_FONT}`;
      w = iconSize + 4 + ctx.measureText(item.text).width + 24;
      h = fontPx + 12;
    }
    if (cx !== x && cx + w > x + maxWidth) {
      cx = x;
      cy += rowH + 8;
    }
    if (item.type === "pill") {
      pcDrawInfoPillAt(ctx, cx, cy, "sofa", item.text, theme, fontPx, w, h);
    } else {
      ctx.save();
      ctx.fillStyle = theme.panel;
      ctx.beginPath(); ctx.roundRect(cx, cy, w, h, h / 2); ctx.fill();
      ctx.strokeStyle = theme.panelLine;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      pcDrawIcon(ctx, "star", cx + 12 + iconSize / 2, cy + h / 2, iconSize, theme.goldDeep);
      ctx.font = `${fontPx}px ${SANS_FONT}`;
      ctx.fillStyle = theme.indigo;
      ctx.textAlign = "left";
      ctx.fillText(item.text, cx + 12 + iconSize + 4, cy + h / 2 + fontPx * 0.35);
    }
    cx += w + gap;
    rowH = Math.max(rowH, h);
  });
  return cy + rowH;
}

// ============================================================
// 背景・アバター
// ============================================================
function drawBackground(ctx, layout, bgImg) {
  // 背景アートは縦横比・金枠を一切加工しない（drawImageは実寸そのまま1:1で敷くだけ）
  ctx.drawImage(bgImg, 0, 0, layout.width, layout.height);
}

// avatarState: {offsetX,offsetY,zoom}（0-1, 0-1, >=1）。アバター編集UIと同じ正規化座標。
function drawAvatar(ctx, cx, cy, r, avatarImg, avatarState, theme, mascotImg, frameImg, frameCfg) {
  const img = (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) ? avatarImg
    : (mascotImg && mascotImg.complete && mascotImg.naturalWidth > 0) ? mascotImg : null;

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
  if (img) {
    const zoom = Math.max(1, (avatarState && avatarState.zoom) || 1);
    const baseScale = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * baseScale;
    const dh = img.naturalHeight * baseScale;
    const offsetX = avatarState && avatarState.offsetX != null ? avatarState.offsetX : 0.5;
    const offsetY = avatarState && avatarState.offsetY != null ? avatarState.offsetY : 0.5;
    const dx = cx - offsetX * dw;
    const dy = cy - offsetY * dh;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = theme.panel;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  ctx.restore();

  // 正式パーツ：アバター画像の上に、テーマ別avatar-frame.pngを重ねる。
  // frameCfg.hole（PNG実測の透明穴中心・半径）を基準にスケール・位置を算出するため、
  // PNG全体の幅をそのままアバター半径として扱うことはない
  const hasFrame = frameImg && frameImg.complete && frameImg.naturalWidth > 0 && frameCfg;
  if (hasFrame) {
    const scale = r / frameCfg.hole.r;
    const dw = frameCfg.size[0] * scale;
    const dh = frameCfg.size[1] * scale;
    const dx = cx - frameCfg.hole.cx * scale;
    const dy = cy - frameCfg.hole.cy * scale;
    ctx.drawImage(frameImg, dx, dy, dw, dh);
    return;
  }

  // フォールバック（画像未読み込み時のみ）：金の三重リング
  ctx.save();
  ctx.shadowColor = theme.gold;
  ctx.shadowBlur = 10;
  const ringGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ringGrad.addColorStop(0, theme.goldHighlight);
  ringGrad.addColorStop(0.5, theme.gold);
  ringGrad.addColorStop(1, theme.goldDeep);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = ringGrad;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = theme.goldDeep;
  ctx.globalAlpha = 0.55;
  ctx.stroke();
  ctx.restore();

  pcDrawGemAccent(ctx, cx, cy - r - 5, r * 0.3, theme);
}

// ============================================================
// プロフィール情報（名前・ID・レベル・プレイスタイル・タグ・活動時間・自己紹介）
// ============================================================
// 戻り値：描画し終えた末尾のY座標（drawSocialInfoの開始位置調整に使う。
// 入力量が多い場合でも下のSNS表記と重ならないようにするため）
// 横型：参考画像の実測座標に基づく構成。
// アバター右＝名前＋アイコン付き小バッジ（ラベル）＋プレーン値テキスト、
// アバター下＝タグ・活動時間・自己紹介を左詰めで積む。すべて左揃え（参考画像通り）。
function drawProfileInfo(ctx, layout, state, theme, parts) {
  // プレイヤー名
  if (state.playerName && state.playerName.trim()) {
    ctx.textAlign = "left";
    ctx.font = `700 ${layout.name.fontSize}px ${SERIF_FONT}`;
    ctx.fillStyle = theme.indigo;
    const name = pcFitTextWidth(ctx, state.playerName.trim(), layout.name.maxWidth);
    ctx.fillText(name, layout.name.x, layout.name.y);
  }

  // ID・開拓者レベル・プレイスタイル：正式パーツ画像（ラベル・アイコン焼き込み済み）＋
  // 画像実測のvalueRect内へ動的な値のみ描画。画像未読み込み時のみ濃色ラベル枠へフォールバック
  const pb = layout.profileBadges;
  const partsOk = parts && parts.images && parts.cfg;
  let cur = pb.y;
  const rows = [];
  if (state.playerId && state.playerId.trim()) rows.push(["infoId", "cardId", "ID", state.playerId.trim()]);
  rows.push(["infoLevel", "level", "開拓者レベル", `Lv.${state.level || 1}`]);
  // サーバーは正式パーツ未提供のため、常に既存の濃色ラベル枠（手描き）で表示する
  if (state.server && state.server.trim()) rows.push([null, "globe", "サーバー", state.server.trim()]);
  if (state.playStyle && state.playStyle.trim()) rows.push(["infoStyle", "sofa", "プレイスタイル", state.playStyle.trim()]);
  let rowH = pb.badgeHeight;
  rows.forEach(([partKey, icon, label, value]) => {
    if (partKey && partsOk && parts.images[partKey] && parts.cfg[partKey]) {
      const { height } = pcDrawInfoBadgeImg(ctx, pb.x, cur, pb.badgeHeight, parts.images[partKey], parts.cfg[partKey], value, theme);
      rowH = height;
    } else {
      const { w, h } = pcMeasureDarkInfoPill(ctx, label, pb.fontSize);
      pcDrawDarkInfoPillAt(ctx, pb.x, cur, icon, label, theme, pb.fontSize, w, h);
      ctx.font = `700 ${pb.valueFontSize}px ${SANS_FONT}`;
      ctx.fillStyle = theme.ink;
      ctx.textAlign = "left";
      const valueText = pcFitTextWidth(ctx, value, Math.max(60, pb.maxWidth - w - pb.gap));
      ctx.fillText(valueText, pb.x + w + pb.gap, cur + h / 2 + pb.valueFontSize * 0.35);
      rowH = h;
    }
    cur += pb.pitch;
  });
  const badgesBottom = rows.length ? (pb.y + (rows.length - 1) * pb.pitch + rowH) : pb.y;

  // タグ（自由入力チップ、左詰め。正式パーツのtag-frame.pngを9-sliceで繰り返し使用。
  // 参考画像の実測位置を基準に、バッジが多い場合のみ下へ押し下げる）
  const tagList = (state.tags || []).map(t => t && t.trim()).filter(Boolean);
  const tagsY = Math.max(layout.tags.y, badgesBottom + 15);
  let tagsBottom = tagsY;
  if (tagList.length) {
    if (partsOk && parts.images.tagFrame && parts.cfg.tagFrame) {
      tagsBottom = pcFlowTagChipsImg(ctx, tagList, layout.tags.x, tagsY, layout.tags.maxWidth, layout.tags.height,
        parts.images.tagFrame, parts.cfg.tagFrame, theme, layout.tags.fontSize, layout.tags.gap, layout.tags.rowGap || 10, layout.tags.maxRows || 2);
    } else {
      const items = tagList.map(t => ({ type: "chip", text: t }));
      tagsBottom = pcFlowStyleTagsRow(ctx, items, layout.tags.x, tagsY, layout.tags.maxWidth, layout.tags.fontSize, theme, layout.tags.gap);
    }
  }

  // 活動時間
  let afterActivity = tagsBottom;
  if (state.activityTime && state.activityTime.trim()) {
    const pt = layout.playTime;
    const y = tagsBottom + pt.gapAbove;
    ctx.textAlign = "left";
    ctx.font = `${pt.fontSize}px ${SANS_FONT}`;
    const iconSize = pt.fontSize * 1.3;
    const text = pcFitTextWidth(ctx, state.activityTime.trim(), (layout.tags.maxWidth || 400) - iconSize - 6);
    pcDrawIcon(ctx, "clock", pt.x + iconSize / 2, y + pt.fontSize * 0.38, iconSize, theme.inkSub);
    ctx.fillStyle = theme.inkSub;
    ctx.fillText(text, pt.x + iconSize + 6, y + pt.fontSize * 0.75);
    afterActivity = y + pt.fontSize + 4;
  }

  // 自己紹介（左詰め、末尾にインライン装飾アイコン）
  // fillTextのyはベースラインのため、文字の上端はfontSize分ベースラインより上に出る。
  // タグが複数行に折り返した場合など、押し下げ計算にその分を見込まないと本文がタグに重なる
  const bioY = Math.max(layout.bio.y, afterActivity + layout.bio.gapAbove + layout.bio.fontSize * 0.8);
  let bioBottom = bioY;
  if (state.bio && state.bio.trim()) {
    ctx.font = `${layout.bio.fontSize}px ${SANS_FONT}`;
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "left";
    const lines = pcWrapText(ctx, state.bio.trim(), layout.bio.maxWidth, layout.bio.maxLines);
    let ly = bioY;
    lines.forEach((line, i) => {
      ctx.fillText(line, layout.bio.x, ly);
      if (i === lines.length - 1) {
        const lineW = ctx.measureText(line).width;
        pcDrawIcon(ctx, "flower", layout.bio.x + lineW + 16, ly - layout.bio.fontSize * 0.32, layout.bio.fontSize * 1.3, theme.vermillion);
      }
      ly += layout.bio.lineHeight;
    });
    bioBottom = ly - layout.bio.lineHeight + layout.bio.fontSize;
  }

  return bioBottom;
}

function drawSocialInfo(ctx, layout, state, theme, afterY) {
  if (!layout.socials) return;
  const parts = [];
  if (state.showSns) {
    if (state.snsX && state.snsX.trim()) parts.push(`X: @${state.snsX.trim().replace(/^@/, "")}`);
    if (state.snsTiktok && state.snsTiktok.trim()) parts.push(`TikTok: @${state.snsTiktok.trim().replace(/^@/, "")}`);
    if (state.snsYoutube && state.snsYoutube.trim()) parts.push(`YouTube: ${state.snsYoutube.trim()}`);
  }
  if (state.showSiteUrl) parts.push("hatopi-zukan (はとぴ図鑑)");
  if (!parts.length) return;

  const soc = layout.socials;
  const cx = soc.x;
  let startY = (afterY != null ? afterY : 0) + (soc.gapAbove || 20);

  // 縦型レイアウトのように中央メダルがプロフィール情報の真下に配置されている場合のみ、
  // メダル（後から描画されSNS表記を覆い隠してしまう）と重ならないよう上限でクランプする。
  // 横型では中央メダルが左カラムと水平方向に離れているため、この制約は不要（かつ誤動作の元）。
  if (layout.medal && Math.abs(layout.medal.cx - cx) < ((layout.tags.maxWidth || 400) / 2 + layout.medal.r)) {
    const totalH = (parts.length - 1) * soc.gap;
    const medalSafeY = layout.medal.cy - layout.medal.r - 34 - totalH;
    startY = Math.min(startY, medalSafeY);
  }

  // 背景アートが賑やかなテーマ（深緑など）でも読めるよう、行ごとに薄いパネルを敷く
  ctx.font = `${soc.fontSize}px ${SANS_FONT}`;
  let y = startY;
  parts.forEach(p => {
    const text = pcFitTextWidth(ctx, p, (layout.tags.maxWidth || 400) + 40);
    pcDrawNoteWithPanel(ctx, cx, y, text, theme, soc.fontSize, "left");
    y += soc.gap;
  });
}

// ============================================================
// プロフィール情報（縦型専用）
// 横型の縮小・回転ではなく、アバターの右側に名前・ID・レベル・プレイスタイル・
// タグ・自己紹介を左詰めで積む専用構成。中央メダルは別関数で下に大きく描く。
// ============================================================
function drawProfileInfoPortrait(ctx, layout, state, theme, parts) {
  const hx = layout.header.x;
  const maxW = layout.header.maxWidth;

  if (state.playerName && state.playerName.trim()) {
    ctx.textAlign = "left";
    ctx.font = `700 ${layout.name.fontSize}px ${SERIF_FONT}`;
    ctx.fillStyle = theme.indigo;
    const name = pcFitTextWidth(ctx, state.playerName.trim(), maxW);
    ctx.fillText(name, hx, layout.name.y);
  }

  const idItems = [];
  if (state.playerId && state.playerId.trim()) idItems.push(["infoId", "cardId", "ID", state.playerId.trim()]);
  idItems.push(["infoLevel", "level", "開拓者レベル", `Lv.${state.level || 1}`]);
  if (state.server && state.server.trim()) idItems.push([null, "globe", "サーバー", state.server.trim()]);
  if (state.playStyle && state.playStyle.trim()) idItems.push(["infoStyle", "sofa", "プレイスタイル", state.playStyle.trim()]);
  let cur = pcFlowInfoBadgesImg(ctx, idItems, hx, layout.idLevel.y, maxW, layout.idLevel.badgeHeight, parts, theme, 12, layout.idLevel.fontSize);

  const tagList = (state.tags || []).map(t => t && t.trim()).filter(Boolean);
  const partsOk = parts && parts.images && parts.cfg;
  if (tagList.length) {
    cur += 10;
    if (partsOk && parts.images.tagFrame && parts.cfg.tagFrame) {
      cur = pcFlowTagChipsImg(ctx, tagList, hx, cur, maxW, layout.styleTags.tagHeight, parts.images.tagFrame, parts.cfg.tagFrame,
        theme, layout.styleTags.fontSize, 10, 10, layout.styleTags.maxRows || 2);
    } else {
      const items = tagList.map(t => ({ type: "chip", text: t }));
      cur = pcFlowStyleTagsRow(ctx, items, hx, cur, maxW, layout.styleTags.fontSize, theme, 10);
    }
  }

  // 自己紹介（末尾に装飾アイコンをインラインで添える。横型と統一した扱い）。
  // 正式バッジ・タグ画像導入でヘッダーの高さが可変になったため、中央メダルと重ならないよう
  // 残りスペースから収まる行数を動的に算出する（0行にはせず、最低1行は表示する）
  if (state.bio && state.bio.trim()) {
    cur += 14;
    ctx.font = `${layout.bio.fontSize}px ${SANS_FONT}`;
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "left";
    // メダル画像は装飾（宝石・花・リボン）がリング半径の約1.55倍まで外側に張り出すため、
    // r×1.55を安全マージンの基準にする（rそのものでは装飾に重なる）
    const medalSafeY = layout.medal.cy - layout.medal.r * 1.55;
    const maxLinesFit = Math.max(1, Math.floor((medalSafeY - cur) / layout.bio.lineHeight));
    const lines = pcWrapText(ctx, state.bio.trim(), maxW - 30, Math.min(layout.bio.maxLines, maxLinesFit));
    lines.forEach((line, i) => {
      cur += layout.bio.lineHeight;
      ctx.fillText(line, hx, cur);
      if (i === lines.length - 1) {
        const lineW = ctx.measureText(line).width;
        pcDrawIcon(ctx, "flower", hx + lineW + 16, cur - layout.bio.fontSize * 0.32, layout.bio.fontSize * 1.3, theme.vermillion);
      }
    });
  }

  // 活動時間・SNS・サイトURLは参考デザインの主構成には含まれないため、
  // 設定でONの場合のみ控えめな小文字の補助情報として追加する（データを表示できなくしないため）
  const subParts = [];
  if (state.activityTime && state.activityTime.trim()) subParts.push(`🕒 ${state.activityTime.trim()}`);
  if (state.showSns) {
    if (state.snsX && state.snsX.trim()) subParts.push(`X: @${state.snsX.trim().replace(/^@/, "")}`);
    if (state.snsTiktok && state.snsTiktok.trim()) subParts.push(`TikTok: @${state.snsTiktok.trim().replace(/^@/, "")}`);
    if (state.snsYoutube && state.snsYoutube.trim()) subParts.push(`YouTube: ${state.snsYoutube.trim()}`);
  }
  if (state.showSiteUrl) subParts.push("hatopi-zukan (はとぴ図鑑)");

  if (subParts.length) {
    cur += 18;
    // 中央メダル（後から描画され補助情報を覆い隠してしまう）と重ならないか確認する。
    // 上の自己紹介等がすでにスペースを使い切っている極端なケースでは、
    // 無理に押し上げて自己紹介と重ねるより、補助情報を省略する方が安全。
    const totalH = (subParts.length - 1) * layout.sub.gap;
    const medalSafeY = layout.medal.cy - layout.medal.r * 1.55 - totalH;
    if (cur <= medalSafeY) {
      ctx.font = `${layout.sub.fontSize}px ${SANS_FONT}`;
      ctx.fillStyle = theme.inkSub;
      ctx.textAlign = "left";
      subParts.forEach(p => {
        const text = pcFitTextWidth(ctx, p, maxW);
        ctx.fillText(text, hx, cur);
        cur += layout.sub.gap;
      });
    }
  }
}

// ============================================================
// 総合コンプリート率（テーマ連動の装飾メダル）
// ============================================================
// 正式アセット(medal-frame_*.PNG)内の「輪の内側（数字を置く紺色の円）」の
// 画像ローカル座標での中心・半径。この円がlayout.medal.(cx,cy,r)に一致するよう
// 画像全体（縁取りの花・リボン・宝石の装飾込み）を拡縮して配置する。
// 画像は1254×1254、リング内側の円は中心(627,627)・半径約400（実測）。
const PROFILE_CARD_MEDAL_FRAME_IMG_SIZE = 1254;
const PROFILE_CARD_MEDAL_FRAME_RING = { cx: 627, cy: 627, r: 400 };

function drawOverallProgress(ctx, layout, theme, overallStat, medalFrameImg) {
  const { cx, cy, r } = layout.medal;
  const pct = overallStat.total > 0 ? Math.floor((overallStat.done / overallStat.total) * 100) : 0;
  const hasFrameImg = medalFrameImg && medalFrameImg.complete && medalFrameImg.naturalWidth > 0;

  if (hasFrameImg) {
    const ring = PROFILE_CARD_MEDAL_FRAME_RING;
    const scale = r / ring.r;
    const drawSize = PROFILE_CARD_MEDAL_FRAME_IMG_SIZE * scale;
    const drawX = cx - ring.cx * scale;
    const drawY = cy - ring.cy * scale;
    ctx.drawImage(medalFrameImg, drawX, drawY, drawSize, drawSize);

    // 「総合コンプリート率」見出し・「達成数」ラベルは画像に焼き込み済みのため、
    // ここでは中央の空き円に%数字を、「達成数」ラベル右の空欄に達成数値のみを重ねて描く。
    pcDrawGoldNumber(ctx, `${pct}%`, cx, cy - r * 0.04, r * 0.62, "center", theme);

    // 「達成数」パネルの下地は紺×金・深緑では濃色、桜ピンク・水色では淡色と
    // テーマごとに明暗が逆になるため、theme.inkではなく元々「テーマの地色の上で
    // 読める文字色」として定義済みのaccentBadgeTextを使う
    const doneText = `${overallStat.done} / ${overallStat.total}`;
    ctx.font = `700 ${Math.round(r * 0.088)}px ${SANS_FONT}`;
    ctx.textAlign = "left";
    ctx.fillStyle = theme.accentBadgeText;
    ctx.fillText(pcFitTextWidth(ctx, doneText, r * 0.5), cx - r * 0.05, cy + r * 0.625);
    return;
  }

  // 画像未読み込み時のフォールバック（Canvas手描画）
  ctx.save();
  ctx.shadowColor = "rgba(20,15,5,0.3)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 7;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = theme.goldDeep;
  ctx.fill();
  ctx.restore();

  const metalGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  metalGrad.addColorStop(0, theme.goldHighlight);
  metalGrad.addColorStop(0.28, theme.gold);
  metalGrad.addColorStop(0.5, theme.goldDeep);
  metalGrad.addColorStop(0.72, theme.gold);
  metalGrad.addColorStop(1, theme.goldHighlight);
  ctx.save();
  ctx.shadowColor = theme.gold;
  ctx.shadowBlur = 12;
  ctx.lineWidth = r * 0.09;
  ctx.strokeStyle = metalGrad;
  ctx.beginPath(); ctx.arc(cx, cy, r - r * 0.05, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // 外側の細いアクセントリング(本体リングと少し間隔を空けて二重感を出す)
  ctx.save();
  ctx.lineWidth = r * 0.018;
  ctx.strokeStyle = theme.gold;
  ctx.globalAlpha = 0.75;
  ctx.beginPath(); ctx.arc(cx, cy, r + r * 0.03, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.lineWidth = r * 0.01;
  ctx.strokeStyle = theme.goldLight;
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(cx, cy, r - r * 0.08, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r - r * 0.12, 0, Math.PI * 2);
  const discGrad = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r);
  discGrad.addColorStop(0, theme.medalDiscFrom);
  discGrad.addColorStop(1, theme.medalDiscTo);
  ctx.fillStyle = discGrad;
  ctx.fill();
  ctx.restore();

  pcDrawGemAccent(ctx, cx, cy - r + r * 0.02, r * 0.16, theme);
  pcDrawRibbonBow(ctx, cx, cy + r - r * 0.06, r * 0.15, theme);

  pcDrawRibbonBanner(ctx, cx, cy - r * 0.42, "総合コンプリート率", theme, Math.round(r * 0.085));

  pcDrawGoldNumber(ctx, `${pct}%`, cx, cy + r * 0.12, r * 0.62, "center", theme);

  const doneText = `${overallStat.done} / ${overallStat.total}`;
  ctx.font = `700 ${Math.round(r * 0.09)}px ${SANS_FONT}`;
  const doneW = ctx.measureText(doneText).width + r * 0.24;
  const doneH = r * 0.19;
  const doneY = cy + r * 0.62;
  ctx.save();
  ctx.fillStyle = "rgba(255,253,247,0.85)";
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(cx - doneW / 2, doneY - doneH / 2, doneW, doneH, doneH / 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = theme.ink;
  ctx.fillText(doneText, cx, doneY + doneH * 0.16);
}

// ============================================================
// カテゴリ進捗カード（最大6件、2列×3段）
// ============================================================
function drawCategoryProgress(ctx, layout, theme, categoryDefs, stats, dense) {
  const g = layout.categoryGrid;
  categoryDefs.forEach((def, i) => {
    const col = i % g.cols;
    const row = Math.floor(i / g.cols);
    const x = g.x + col * (g.cardW + g.gap);
    const y = g.y + row * (g.cardH + g.gap);
    drawCategoryCard(ctx, x, y, g.cardW, g.cardH, def, theme, stats[def.id] || { done: 0, total: 0 }, dense);
  });
}

function drawCategoryCard(ctx, x, y, w, h, def, theme, stat, dense) {
  const pct = stat.total > 0 ? Math.floor((stat.done / stat.total) * 100) : 0;

  ctx.save();
  ctx.shadowColor = "rgba(120,100,60,0.14)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = theme.panel;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.stroke();
  ctx.restore();

  const cornerLen = 14;
  [
    [x + 7, y + 7, 0], [x + w - 7, y + 7, Math.PI / 2],
    [x + w - 7, y + h - 7, Math.PI], [x + 7, y + h - 7, -Math.PI / 2],
  ].forEach(([cxr, cyr, rot]) => pcDrawOrnamentalCorner(ctx, cxr, cyr, cornerLen, rot, theme.gold, theme.goldDeep));

  const color = pcCategoryColor(def.id);

  if (dense) {
    // 横型：参考画像実測。アイコンはカード左上、名前はアイコン右、%はアイコン下端より
    // 下の行で右詰め（アイコンとの垂直重なりを避ける）、区切り線の下に達成数（プログレスバーは参考画像になし）
    const badgeSize = h * 0.32;
    const badgeCx = x + w * 0.27;
    const badgeCy = y + h * 0.27;
    pcDrawCategoryBadge(ctx, badgeCx, badgeCy, badgeSize, color);
    pcDrawIcon(ctx, def.icon, badgeCx, badgeCy, badgeSize * 0.52, color.main);

    ctx.textAlign = "left";
    ctx.fillStyle = theme.indigo;
    ctx.font = `700 ${Math.round(h * 0.135)}px ${SERIF_FONT}`;
    ctx.fillText(def.label, x + w * 0.52, y + h * 0.22);

    ctx.textAlign = "right";
    ctx.fillStyle = theme.vermillion;
    ctx.font = `700 ${Math.round(h * 0.22)}px ${SERIF_FONT}`;
    ctx.fillText(`${pct}%`, x + w - w * 0.07, y + h * 0.62);

    ctx.save();
    ctx.strokeStyle = theme.panelLine;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, y + h * 0.72);
    ctx.lineTo(x + w - w * 0.08, y + h * 0.72);
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = "left";
    ctx.fillStyle = theme.inkSub;
    ctx.font = `700 ${Math.round(w * 0.145)}px ${SANS_FONT}`;
    ctx.fillText(`${stat.done} / ${stat.total}`, x + w * 0.1, y + h * 0.9);
    return;
  }

  // 縦型：既存の固定px構成（変更しない）
  const badgeSize = 40;
  const badgeCx = x + 32;
  const badgeCy = y + 32;
  pcDrawCategoryBadge(ctx, badgeCx, badgeCy, badgeSize, color);
  pcDrawIcon(ctx, def.icon, badgeCx, badgeCy, 22, color.main);

  ctx.textAlign = "left";
  ctx.fillStyle = theme.indigo;
  ctx.font = `700 15px ${SERIF_FONT}`;
  ctx.fillText(def.label, x + 62, y + 28);

  ctx.textAlign = "right";
  ctx.fillStyle = theme.vermillion;
  ctx.font = `700 26px ${SERIF_FONT}`;
  ctx.fillText(`${pct}%`, x + w - 16, y + 36);

  ctx.textAlign = "left";
  ctx.fillStyle = theme.inkSub;
  ctx.font = `11px ${SANS_FONT}`;
  ctx.fillText(`${stat.done} / ${stat.total}`, x + 62, y + 48);

  pcDrawProgressBar(ctx, x + 16, y + h - 26, w - 32, 7, pct, theme, color.main);
}

// ============================================================
// フッター（作成日・ロゴ・非公式表記）
// ============================================================
function drawBranding(ctx, layout, state, theme) {
  const logo = layout.brandLogo;
  const dateCfg = layout.date;
  const discCfg = layout.disclaimer;

  // 背景アート下部の賑やかな街並み帯に文字が埋もれないよう、
  // ロゴ・作成日・非公式表記のいずれにも薄い生成りパネルを敷く
  ctx.font = `700 ${logo.fontSize}px ${SERIF_FONT}`;
  const logoText = "はとぴ図鑑";
  const logoGap = 6;
  const logoTextW = ctx.measureText(logoText).width;
  const logoW = logo.iconSize + logoGap + logoTextW + 28;
  const logoH = logo.fontSize + 12;
  ctx.save();
  ctx.fillStyle = "rgba(255,253,247,0.82)";
  ctx.beginPath();
  ctx.roundRect(logo.x - logoW / 2, logo.y - logoH * 0.7, logoW, logoH, logoH / 2);
  ctx.fill();
  ctx.restore();
  const logoGroupX = logo.x - (logo.iconSize + logoGap + logoTextW) / 2;
  pcDrawIcon(ctx, "bird", logoGroupX + logo.iconSize / 2, logo.y - 6, logo.iconSize, theme.indigo);
  ctx.textAlign = "left";
  ctx.fillStyle = theme.indigo;
  ctx.fillText(logoText, logoGroupX + logo.iconSize + logoGap, logo.y);

  if (state.showDate) {
    const dateText = `${dateCfg.prefix || ""}${pcFormatJapaneseEraDate(new Date())}`;
    pcDrawNoteWithPanel(ctx, dateCfg.x, dateCfg.y, dateText, theme, dateCfg.fontSize, dateCfg.align || "left");
  }

  ctx.textAlign = "center";
  pcDrawNoteWithPanel(ctx, layout.width / 2, discCfg.y, "※本カードは非公式のファンツールで作成されています", theme, discCfg.fontSize);
}

// ============================================================
// エントリポイント
// ============================================================
// ctx: CanvasRenderingContext2D（呼び出し側でcanvas.width/heightをlayout.width/heightへ設定済みのこと）
// state: profile-card-storageのstate形状
// images: { bgImg, avatarImg, mascotImg }
// stats: computeProfileCardStats()の戻り値
function renderProfileCard(ctx, state, images, stats) {
  const layout = PROFILE_CARD_LAYOUTS[state.layout] || PROFILE_CARD_LAYOUTS.landscape;
  const theme = PROFILE_CARD_THEMES[state.theme] || PROFILE_CARD_THEMES["navy-gold"];

  ctx.clearRect(0, 0, layout.width, layout.height);
  drawBackground(ctx, layout, images.bgImg);
  const pp = images.profileParts;
  drawAvatar(ctx, layout.avatar.cx, layout.avatar.cy, layout.avatar.r, images.avatarImg, state.avatar, theme, images.mascotImg,
    pp && pp.avatarFrame, theme.profileParts && theme.profileParts.avatarFrame);

  const categoryDefs = (state.categoryIds || []).map(profileCardCategoryDef).filter(Boolean).slice(0, 6);
  const scopeIds = state.totalScope === "displayed" ? state.categoryIds : PROFILE_CARD_CATEGORIES.map(c => c.id);
  const overallStat = sumProfileCardStats(stats, scopeIds);

  // メダルの装飾（リボン・花あしらい）はリング半径より外側にもはみ出すため、
  // プロフィール文字情報より先に描画し、文字を常に最前面に保って可読性を確保する
  drawOverallProgress(ctx, layout, theme, overallStat, images.medalFrameImg);
  drawCategoryProgress(ctx, layout, theme, categoryDefs, stats, state.layout !== "portrait");

  const partsBundle = (pp && theme.profileParts) ? { images: pp, cfg: theme.profileParts } : null;
  if (state.layout === "portrait") {
    drawProfileInfoPortrait(ctx, layout, state, theme, partsBundle);
  } else {
    const infoEndY = drawProfileInfo(ctx, layout, state, theme, partsBundle);
    drawSocialInfo(ctx, layout, state, theme, infoEndY);
  }

  drawBranding(ctx, layout, state, theme);
}
