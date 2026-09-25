// js/profile-card-renderer.js
// プロフィールカードメーカーのCanvas描画一式。
// 「固定の背景アート（縦横比・金枠は一切加工しない）」の上に、
// テーマ連動の装飾・入力値をCanvasで動的に重ねる。
// プレビュー・PNG保存は同じrenderCard()を呼ぶ（表示サイズはCSSでの縮小のみ）。

const SERIF_FONT = "'Shippori Mincho', 'Yu Mincho', 'Hiragino Mincho ProN', serif";
const SANS_FONT = "'Zen Maru Gothic', sans-serif";
// 中央メダルの大きな％数字専用。参考画像の金箔／和紙風デザインに合わせたNoto Serif JP 900
// （数字0-9と%のみのサブセットをプロジェクト内へ自己ホスト）を最優先し、
// 未読み込み時のみシステム明朝体へフォールバックする（配置ロジックは実測ベースのため破綻しない）
const PC_MEDAL_DIGIT_FONT = "'NotoSerifJPDigits900', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif";
const PC_MEDAL_DIGIT_FONT_WEIGHT = 900;

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
    panel:       { src: `${base}/panel.png`, ...parts.panel },
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
      panel:       { size: [936, 1365], cap: 140 },
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
      panel:       { size: [904, 1378], cap: 140 },
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
      panel:       { size: [961, 1406], cap: 140 },
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
      panel:       { size: [953, 1402], cap: 140 },
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
    // プロフィール背景パネル：アバター〜ひとことメッセージまでを内包する土台。
    // 提供済みのpanel.png（生成り色・縁取り・四隅装飾）を9-sliceで敷く（Canvas描画の代替パネルは使わない）。
    // 2026/09調整：中央メダル拡大のため575→560pxへ縮小（案H採用）。9-slice描画のcap(140)は
    // 固定のまま新しいw/hへ敷き直されるため、この値だけ変えればパネル自体は正しく再描画される。
    profilePanel: { x: 20, y: 80, w: 560, h: 660 },
    // プロフィール上段（アバター・名前・ID・開拓者レベル・プレイスタイル・タグ・ひとこと）は、
    // 個々の要素へ絶対px座標を書かず、すべてprofilePanel(x,y,w,h)を基準にした比率で管理する
    // （xRatio/yRatioはpanel左上を原点としたw/h比、sizeRatio・maxWidthRatio等もpanelのw/hに対する比率）。
    // これにより「要素ごとに数pxずつ補正」による干渉を避け、配置は常にパネルとの相対関係で決まる。
    // 参考画像の構成（左＝アバター＋タグ、右＝名前＋ID/レベル/プレイスタイル、下＝ひとこと2行）に基づく。
    // 数値はavatar-frame.pngの装飾込みbbox実測（hole半径に対しleft1.30/right1.17/top1.37/bottom1.18倍）
    // とID/開拓者レベル/プレイスタイル各バッジの動的値込み実測から、パネル安全余白(24px)を侵さないよう算出。
    // 2026/09調整：パネル幅575→560pxに伴い、アバター表示径190px・バッジ表示幅235pxの絶対値は
    // そのまま維持しつつ、xRatio/sizeRatio/maxWidthRatio等をpanelW=560基準に再計算した
    // （絶対px値 = ratio × 新しいpanelW、という関係を保つことで承認済みサイズを崩さない）。
    // タグ・ひとことのmaxWidthは、パネル右端からの安全余白(約28px×2辺)を保つよう519→504pxへ調整。
    profileLayout: {
      avatar: { xRatio: 165 / 560, yRatio: 225 / 660, sizeRatio: 190 / 560 },
      name: { xRatio: 300 / 560, yRatio: 210 / 660, fontSizeRatio: 56 / 660, maxWidthRatio: 235 / 560 },
      badges: { xRatio: 300 / 560, yRatio: 244 / 660, widthRatio: 235 / 560, rowGapRatio: 14 / 660 },
      // タグは上段グループ（アバター〜バッジ列）の下、パネル安全幅いっぱい（centerX中心）に
      // 中央揃えで配置する。個数で非表示にする処理はなく、最大maxPerRow個/行で入力順のまま
      // 並べ、幅が足りない時だけ全タグ共通の倍率で縮小する（pcFlowTagChipsCenteredNoLoss）。
      // gapAboveRatioは上段グループ下端からの間隔（目安20〜28px）
      tags: {
        gapAboveRatio: 20 / 660, maxWidthRatio: 504 / 560,
        heightRatio: 38 / 660, fontSizeRatio: 18 / 660, gapRatio: 12 / 560, rowGapRatio: 10 / 660, maxPerRow: 3,
      },
      // ひとこと：タグ列の下、centerX中心に1行ずつ独立して中央揃え。
      // gapAboveRatioはタグ最終行下端からの間隔（目安28〜40px）。safeRect下端まで18px以上
      // 残すため、フォントを少し詰めて（34→30）全体の縦幅を圧縮している
      bio: {
        gapAboveRatio: 24 / 660, maxWidthRatio: 504 / 560,
        fontSizeRatio: 30 / 660, lineHeightRatio: 43 / 660, maxLines: 2,
      },
    },
    // 活動時間：タグの下（参考画像に実例なしのため、タグ〜自己紹介間に安全マージン込みで配置）
    playTime: { x: 32, fontSize: 17, gapAbove: 14 },
    // SNS情報（X/TikTok/YouTube、設定時のみ）。「hatopi-zukan（はとぴ図鑑）」の重複表記は
    // 右下ロゴと役割が被るためdrawSocialInfo側で削除済み
    socials: { x: 32, fontSize: 22, gap: 26, gapAbove: 18 },
    // 中央メダル：中心(850,423) 半径177（2026/09調整・案H採用）。
    // メダル画像はリング半径だけでなく、宝石・花・リボン・吊り飾りが外側へ大きく張り出すため、
    // アルファ値のある可視ピクセル全体の外接矩形を基準にスケールを決定した
    // （リング半径のみで一致判定しないこと）。
    // 調整前(cx814,r168)からの変更点：プロフィールパネル幅575→560pxとメダル拡大により、
    // パネル・カテゴリカードとの実測クリアランスを確保した上で、参考画像に近い大きさへ拡大した。
    // r=181ではなくr=177を採用した理由：4テーマ共通のメダルPNG装飾は同一リング半径でも
    // テーマごとに可視alpha外接矩形の大きさが微妙に異なり、sky-blueのみ他3テーマより
    // 横幅が約2.5%大きい。cx=850(パネル右端580とカテゴリ左端1120のちょうど中間)はそのままに
    // r=181で揃えるとsky-blueだけpanelClearance=1px/gridClearance=3pxまで詰まってしまうため、
    // 4テーマ全てで安全なr=177（指示された下限）まで縮小して統一した
    // （navy-gold/sakura-pink/forest-greenは14px前後、sky-blueは7px/9pxの実測クリアランスを確認済み。
    // 詳細はPRのmeasurements.json参照）。
    // PC_MEDAL_BASE_CX/CY/Rは変更しない（既存の実測アンカーテーブルの基準点のため）。
    medal: { cx: 850, cy: 423, r: 177, labelOffsetY: -12 },
    // カテゴリカード：8枚(2列×4行)。drawCategoryCardImgがPNGの透明余白を除いたbbox
    // （実測約1093-1099×800-810px、比率約1.36:1）をsourceRectとして使うようになったため、
    // セル自体もその比率に合わせている（210×155、間隔20/10）。ロゴを上へ移動した分
    // (新brandLogo.y=820、上端≈757)を活用し、旧174×148（PNG全体基準で実は見た目158×116相当
    // だった）よりひと回り大きい、実測ベースの見た目サイズになっている
    categoryGrid: { x: 1120, y: 85, cardW: 210, cardH: 155, gapX: 20, gapY: 10, cols: 2, rows: 4 },
    // 作成日：左下のピル。「作成日：」の接頭辞込みで参考画像に一致させる（参考画像実測でやや大きく）
    date: { x: 65, y: 868, fontSize: 24, prefix: "作成日：" },
    // はとぴ図鑑ロゴ：右下、正式PNG素材（透過・紺×金）をwidth基準で表示。外枠への接触を避けるため
    // 旧位置(1350,852,w280)から上32px・左15pxへ移動し、幅を12.5%拡大。
    // fontSize/iconSizeは画像読み込み失敗時のCanvas手描きフォールバック専用
    brandLogo: { x: 1335, y: 820, width: 315, fontSize: 50, iconSize: 54 },
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
    // アバター：正式パーツ使用。rはPNG実測の透明穴（アバター写真）の半径（横型とは別の縦型専用値）。
    // cyは4テーマのフレームPNGをalpha>10で実測した結果、装飾込みの可視bboxがパネル上端を
    // 実際に超えていた（navy-gold等で上端クリアランスが負値）ため、190→207へ調整して解消
    avatar: { cx: 240, cy: 207, r: 100 },
    // プロフィール背景パネル：アバター〜ひとことメッセージまでを内包する土台（縦型専用の座標）。
    // バッジ・タグ・ひとこと拡大に伴いhを310→340へ拡張（パネル右側・下側の余白を活用）
    profilePanel: { x: 90, y: 55, w: 880, h: 340 },
    // アバターが左端に孤立して見えないよう、右カラムの開始xをアバター右端(340)へ寄せる。
    // maxWidthはパネル右端(90+880=970)からの安全余白込みで再計算（旧600は970を超えて右へ
    // はみ出していたため縮小）
    header: { x: 370, maxWidth: 580 },
    // プレイヤー名：34→39px（約1.15倍）
    name: { y: 108, fontSize: 39 },
    // ID・開拓者レベル・プレイスタイル（・サーバー）：固定スロット（2列×2行）。
    // 各テーマの正式バッジ画像はこのスロット高さへ合わせて描画するため、
    // アスペクト比の違いによる段数のばらつきが発生しない。横型に比べてバッジ・タグ・
    // ひとことの存在感が弱かったため約15%拡大（48→55）。wは4テーマ中の最も横長な
    // バッジ実測（ID/プレイスタイル列で比率最大5.271、高さ55pxで実測290px）を基準に、
    // 2列目（開拓者レベル、比率最大5.196・286px）がパネル右端(90+880=970)を
    // 超えないよう再計算した値（旧336では2列目がパネル外の装飾帯へはみ出していた）
    badgeSlots: { x: 370, y: 118, w: 290, h: 55, colGap: 12, rowGap: 6, cols: 2 },
    // タグ：正式パーツ(tag-frame.png)を9-sliceで使用。約20%拡大（32→38、18→22）
    styleTags: { y: 200, fontSize: 22, tagHeight: 38, maxRows: 2 },
    // 自己紹介：約20%拡大（20→24、30→36）
    // lineHeightはfontSizeの1.45倍（指定範囲1.35〜1.5倍内）
    bio: { fontSize: 24, lineHeight: 35, maxLines: 2 },
    sub: { fontSize: 11, gap: 15 },
    // メダル画像は装飾がリング半径の約1.55倍まで外側に張り出すため、
    // 上のプロフィールパネル・下のカテゴリカードと重ならないようr/cyを調整。
    // 縦型のみさらに約14%縮小（190→163）し、圧迫感を軽減
    medal: { cx: 543, cy: 653, r: 163, labelOffsetY: -12 },
    // 縦型は参考画像なし。8枚(4列×2行)を維持しつつ、PNGの透明余白を除いたbbox比率
    // (約1.36:1)に合わせて非等方スケールを避ける。幅基準（safeLeft40〜safeRight1046の
    // 全域を使用）で最大サイズを算出し、高さも安全域(medal下端〜date/ロゴ上)に
    // 収まることを確認済み（横型の単純比例コピーではない）
    categoryGrid: { x: 41, y: 928, cardW: 239, cardH: 176, gapX: 16, gapY: 14, cols: 4, rows: 2 },
    date: { x: 140, y: 1400, fontSize: 13 },
    // 旧位置(940,1400,w145)から上26px・左15pxへ移動し、幅を12.4%拡大
    brandLogo: { x: 925, y: 1374, width: 163, fontSize: 20, iconSize: 26 },
    disclaimer: { y: 1434, fontSize: 10 },
    safeTop: 40, safeBottom: 1400, safeLeft: 40, safeRight: 1046,
  },
};

// 横型のprofileLayout（profilePanel基準の比率）から、実際にCanvasへ描画する絶対px座標を算出し、
// PROFILE_CARD_LAYOUTS.landscapeへ従来通りのavatar/name/profileBadges/tags/bioとして書き戻す。
// こうすることで、profile-card.js側のアバタードラッグ処理やdrawProfileInfo/drawSocialInfoは
// 従来と同じ形（layout.avatar.cx等）のまま読めるが、その値の出どころは常にprofilePanelとの
// 相対比率になり、要素ごとに絶対pxを個別に書き足す・補正することがなくなる。
function pcResolveLandscapeProfileLayout() {
  const L = PROFILE_CARD_LAYOUTS.landscape;
  const pnl = L.profilePanel;
  const pl = L.profileLayout;
  if (!pnl || !pl) return;
  const { x: px, y: py, w: pw, h: ph } = pnl;

  L.avatar = {
    cx: px + pl.avatar.xRatio * pw,
    cy: py + pl.avatar.yRatio * ph,
    r: (pl.avatar.sizeRatio * pw) / 2,
  };
  L.name = {
    x: px + pl.name.xRatio * pw,
    y: py + pl.name.yRatio * ph,
    fontSize: pl.name.fontSizeRatio * ph,
    maxWidth: pl.name.maxWidthRatio * pw,
  };
  // profileBadges: widthを基準にバッジ画像を等比縮小するため、高さはバッジごとの実アスペクト比で決まる
  // （drawProfileInfo側でpcDrawInfoBadgeImgByWidthを使う）。fontSize/valueFontSize/maxWidthは
  // 正式パーツ画像が無い場合の濃色ラベル枠フォールバック専用
  const badgeW = pl.badges.widthRatio * pw;
  L.profileBadges = {
    x: px + pl.badges.xRatio * pw,
    y: py + pl.badges.yRatio * ph,
    width: badgeW,
    rowGap: pl.badges.rowGapRatio * ph,
    fontSize: badgeW * 0.088,
    valueFontSize: badgeW * 0.092,
    maxWidth: badgeW,
  };
  // タグ・ひとことはどちらも「centerXを中心に中央揃え」「上段グループ下端からの相対位置」で
  // 決まるため、固定のx/yではなくcenterX・maxWidth・gapAbove（前要素下端からの間隔）を持たせる
  const centerX = px + pw / 2;
  L.tags = {
    centerX,
    gapAbove: pl.tags.gapAboveRatio * ph,
    maxWidth: pl.tags.maxWidthRatio * pw,
    height: pl.tags.heightRatio * ph,
    fontSize: pl.tags.fontSizeRatio * ph,
    gap: pl.tags.gapRatio * pw,
    rowGap: pl.tags.rowGapRatio * ph,
    maxPerRow: pl.tags.maxPerRow,
  };
  L.bio = {
    centerX,
    gapAbove: pl.bio.gapAboveRatio * ph,
    maxWidth: pl.bio.maxWidthRatio * pw,
    fontSize: pl.bio.fontSizeRatio * ph,
    lineHeight: pl.bio.lineHeightRatio * ph,
    maxLines: pl.bio.maxLines,
  };
}
pcResolveLandscapeProfileLayout();

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

// ひとこと欄専用：入力中の明示的な改行(\n)を段落境界として維持し、pcWrapTextのように
// 2行分の文章を1行へ自動再結合しない。各段落は個別に幅超過時のみ折り返す（段落をまたいで
// 折り返すことはない）。段落数がmaxLinesを超える場合は先頭からmaxLines行までで打ち切る
function pcWrapTextPreserveBreaks(ctx, text, maxWidth, maxLines) {
  const paragraphs = (text || "").split("\n");
  let lines = [];
  for (const para of paragraphs) {
    if (lines.length >= maxLines) break;
    const remaining = maxLines - lines.length;
    lines = lines.concat(pcWrapText(ctx, para, maxWidth, remaining));
  }
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

// （中央メダルの％数字はpcDrawMedalPercent／pcMedal*系の専用エンジンで描画する。
// 汎用の金文字描画はここでは提供しない）

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

// pcDrawInfoBadgeImgの幅基準版。ID/開拓者レベル/プレイスタイルを縦積みの右カラムへ収める際、
// テーマごとにバッジ画像の縦横比が異なっていても「描画幅」を確実に揃える（＝右端の位置を固定できる）
// ことを優先するために使う。高さは画像実アスペクト比に従うため行ごとに数px前後する
function pcDrawInfoBadgeImgByWidth(ctx, x, y, targetWidth, badgeImg, badgeCfg, valueText, theme, valueColor) {
  const scale = targetWidth / badgeCfg.size[0];
  const w = targetWidth;
  const h = badgeCfg.size[1] * scale;
  ctx.drawImage(badgeImg, x, y, w, h);

  if (valueText) {
    const vr = badgeCfg.valueRect;
    const vx = x + vr.x * scale;
    const vy = y + vr.y * scale;
    const vw = vr.w * scale;
    const vh = vr.h * scale;
    const pad = vw * 0.06;
    const maxFontPx = Math.min(h * 0.44, vh * 0.78);
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

// 背景パネル（panel.png）を9-slice描画する。四隅（cap角）は原寸のまま、
// 上下左右の辺は該当方向のみ伸縮、中央は生成り色の背景として敷き詰める。
// これにより四隅の装飾・縁取りを歪ませずに、任意のw/hへ配置できる
function pcDraw9SlicePanel(ctx, x, y, w, h, panelImg, cap) {
  const srcW = panelImg.naturalWidth || panelImg.width;
  const srcH = panelImg.naturalHeight || panelImg.height;
  const c = Math.max(1, Math.min(cap, w / 2, h / 2));
  const midSrcW = Math.max(1, srcW - cap * 2);
  const midSrcH = Math.max(1, srcH - cap * 2);
  const midDstW = Math.max(1, w - c * 2);
  const midDstH = Math.max(1, h - c * 2);

  // 四隅（原寸のまま、伸縮なし）
  ctx.drawImage(panelImg, 0, 0, cap, cap, x, y, c, c);
  ctx.drawImage(panelImg, srcW - cap, 0, cap, cap, x + w - c, y, c, c);
  ctx.drawImage(panelImg, 0, srcH - cap, cap, cap, x, y + h - c, c, c);
  ctx.drawImage(panelImg, srcW - cap, srcH - cap, cap, cap, x + w - c, y + h - c, c, c);

  // 上下辺（横方向のみ伸縮）
  ctx.drawImage(panelImg, cap, 0, midSrcW, cap, x + c, y, midDstW, c);
  ctx.drawImage(panelImg, cap, srcH - cap, midSrcW, cap, x + c, y + h - c, midDstW, c);
  // 左右辺（縦方向のみ伸縮）
  ctx.drawImage(panelImg, 0, cap, cap, midSrcH, x, y + c, c, midDstH);
  ctx.drawImage(panelImg, srcW - cap, cap, cap, midSrcH, x + w - c, y + c, c, midDstH);
  // 中央（両方向伸縮）
  ctx.drawImage(panelImg, cap, cap, midSrcW, midSrcH, x + c, y + c, midDstW, midDstH);
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

// タグ配列を「入力順を維持したまま1個も欠落させずに」中央揃えで並べる（横型プロフィール専用）。
// pcFlowTagChipsImgと違い、maxRows超過分を切り捨てることはしない：
// 1) 最大maxPerRow個ずつ、入力順のまま行に分割する（幅で折り返すのではなく個数で分割）
// 2) 各行の等倍時の合計幅のうち最大のものがmaxWidthを超える場合のみ、全タグ共通の倍率で
//    フォント・チップともに縮小する（1つだけ縮む、省略される、ということは起きない）
// 3) 各行はcenterXを中心に水平中央揃えで描画する
// 戻り値は描画し終えた下端Y座標
function pcFlowTagChipsCenteredNoLoss(ctx, tags, centerX, y, maxWidth, targetHeight, tagImg, tagCfg, theme, fontPx, gap, rowGap, maxPerRow) {
  if (!tags || !tags.length) return y;
  const rowsOfTags = [];
  for (let i = 0; i < tags.length; i += maxPerRow) rowsOfTags.push(tags.slice(i, i + maxPerRow));

  function chipWidthAt(text, h, fpx) {
    ctx.font = `600 ${fpx}px ${SANS_FONT}`;
    const textW = ctx.measureText(text).width;
    const capW = tagCfg.cap * (h / tagCfg.size[1]);
    return Math.max(capW * 2 + 20, textW + capW * 1.6);
  }
  const rowWidthsAt1 = rowsOfTags.map(row => {
    const sum = row.reduce((acc, t) => acc + chipWidthAt(t, targetHeight, fontPx), 0);
    return sum + gap * (row.length - 1);
  });
  const widestRow = Math.max(...rowWidthsAt1);
  const scale = widestRow > maxWidth ? maxWidth / widestRow : 1;
  const h = targetHeight * scale;
  const fpx = fontPx * scale;
  const chipGap = gap * scale;

  let cy = y;
  rowsOfTags.forEach(row => {
    const widths = row.map(t => chipWidthAt(t, h, fpx));
    const rowW = widths.reduce((a, b) => a + b, 0) + chipGap * (row.length - 1);
    let cx = centerX - rowW / 2;
    row.forEach((text, i) => {
      pcDrawTagChipImg(ctx, cx, cy, h, tagImg, tagCfg, text, theme, fpx);
      cx += widths[i] + chipGap;
    });
    cy += h + rowGap;
  });
  return cy - rowGap;
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

  // アバター写真：円形穴いっぱいにcover方式で配置する（穴の直径に対してMath.maxで
  // 縦横どちらか大きい方の比率に合わせるため、画像は必ず穴を覆い、内側に余白は生じない）。
  // 丸め誤差による白い隙間を防ぐため1.03倍の安全マージンをかけている
  const COVER_SAFETY = 1.03;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
  if (img) {
    const zoom = Math.max(1, (avatarState && avatarState.zoom) || 1);
    const baseScale = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight) * zoom * COVER_SAFETY;
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
  // ↑ ctx.restore()により円形clipはここで確実に解除される。以降のフレーム描画は
  // 円形clipの影響を受けない（フレーム自体には一切clipを適用しない）

  // 正式パーツ：アバター画像の上に、テーマ別avatar-frame.pngを重ねる。
  // frameCfg.hole（PNG実測の透明穴中心・半径）を基準にスケール・位置を算出するため、
  // PNG全体の幅をそのままアバター半径として扱うことはない。花・葉・宝石など外周装飾を
  // 一切切り詰めないよう、frameCfg.sizeそのまま（テーマPNGの外周装飾込みの全体サイズ）を描画する
  const hasFrame = frameImg && frameImg.complete && frameImg.naturalWidth > 0 && frameCfg;
  if (hasFrame) {
    ctx.save();
    const scale = r / frameCfg.hole.r;
    const dw = frameCfg.size[0] * scale;
    const dh = frameCfg.size[1] * scale;
    const dx = cx - frameCfg.hole.cx * scale;
    const dy = cy - frameCfg.hole.cy * scale;
    ctx.drawImage(frameImg, dx, dy, dw, dh);
    ctx.restore();
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

  // ID・開拓者レベル・プレイスタイル：右カラムに縦積み。正式パーツ画像（ラベル・アイコン焼き込み済み）＋
  // 画像実測のvalueRect内へ動的な値のみ描画。画像未読み込み時のみ濃色ラベル枠へフォールバック。
  // 描画幅(pb.width)を基準に等比縮小するため、テーマごとに画像の縦横比が違っても右端は必ず揃う
  // （＝パネル安全領域の右端をbadges.widthRatioで固定すれば、動的な値の長さに関わらずオーバーフローしない）
  const pb = layout.profileBadges;
  const partsOk = parts && parts.images && parts.cfg;
  let cur = pb.y;
  const rows = [];
  if (state.playerId && state.playerId.trim()) rows.push(["infoId", "cardId", "ID", state.playerId.trim()]);
  rows.push(["infoLevel", "level", "開拓者レベル", `Lv.${state.level || 1}`]);
  // サーバーは正式パーツ未提供のため、常に既存の濃色ラベル枠（手描き）で表示する
  if (state.server && state.server.trim()) rows.push([null, "globe", "サーバー", state.server.trim()]);
  if (state.playStyle && state.playStyle.trim()) rows.push(["infoStyle", "sofa", "プレイスタイル", state.playStyle.trim()]);
  rows.forEach(([partKey, icon, label, value]) => {
    let rowH;
    if (partKey && partsOk && parts.images[partKey] && parts.cfg[partKey]) {
      const { height } = pcDrawInfoBadgeImgByWidth(ctx, pb.x, cur, pb.width, parts.images[partKey], parts.cfg[partKey], value, theme);
      rowH = height;
    } else {
      const h = pb.width * 0.19;
      const { w } = pcMeasureDarkInfoPill(ctx, label, pb.fontSize);
      pcDrawDarkInfoPillAt(ctx, pb.x, cur, icon, label, theme, pb.fontSize, w, h);
      ctx.font = `700 ${pb.valueFontSize}px ${SANS_FONT}`;
      ctx.fillStyle = theme.ink;
      ctx.textAlign = "left";
      const valueText = pcFitTextWidth(ctx, value, Math.max(60, pb.width - w - 10));
      ctx.fillText(valueText, pb.x + w + 10, cur + h / 2 + pb.valueFontSize * 0.35);
      rowH = h;
    }
    cur += rowH + pb.rowGap;
  });
  const badgesBottom = cur - pb.rowGap;
  // 上段グループ（アバター・名前・バッジ）の下端。navy-goldではアバターフレームの装飾込み
  // 下端(約417px)よりバッジ列下端(約490px)の方が常に低いため、badgesBottomをそのまま使う
  const topGroupBottom = badgesBottom;

  // タグ：上段グループの下、パネル安全幅いっぱいにcenterX中心で中央揃え。
  // 個数超過による非表示は行わない（pcFlowTagChipsCenteredNoLossが全タグを必ず描画し、
  // 収まらない場合のみ全タグ共通の倍率で縮小する）
  const tagList = (state.tags || []).map(t => t && t.trim()).filter(Boolean);
  const tg = layout.tags;
  const tagsY = topGroupBottom + tg.gapAbove;
  let tagsBottom = tagsY;
  if (tagList.length) {
    if (partsOk && parts.images.tagFrame && parts.cfg.tagFrame) {
      tagsBottom = pcFlowTagChipsCenteredNoLoss(ctx, tagList, tg.centerX, tagsY, tg.maxWidth, tg.height,
        parts.images.tagFrame, parts.cfg.tagFrame, theme, tg.fontSize, tg.gap, tg.rowGap, tg.maxPerRow);
    } else {
      const items = tagList.map(t => ({ type: "chip", text: t }));
      tagsBottom = pcFlowStyleTagsRow(ctx, items, tg.centerX - tg.maxWidth / 2, tagsY, tg.maxWidth, tg.fontSize, theme, tg.gap);
    }
  }

  // 活動時間（今回のスコープ外の項目。タグ帯の左端を目安に据え置く）
  let afterActivity = tagsBottom;
  if (state.activityTime && state.activityTime.trim()) {
    const pt = layout.playTime;
    const y = tagsBottom + pt.gapAbove;
    ctx.textAlign = "left";
    ctx.font = `${pt.fontSize}px ${SANS_FONT}`;
    const iconSize = pt.fontSize * 1.3;
    const text = pcFitTextWidth(ctx, state.activityTime.trim(), (tg.maxWidth || 400) - iconSize - 6);
    pcDrawIcon(ctx, "clock", pt.x + iconSize / 2, y + pt.fontSize * 0.38, iconSize, theme.inkSub);
    ctx.fillStyle = theme.inkSub;
    ctx.fillText(text, pt.x + iconSize + 6, y + pt.fontSize * 0.75);
    afterActivity = y + pt.fontSize + 4;
  }

  // 自己紹介：タグ列の下、centerX中心に1行ずつ独立して中央揃え（パネル全幅）。
  // 入力文字列以外の装飾（花アイコン等）は一切追加しない――呼び出し元から渡された文字列を
  // そのままShippori Minchoで描画するだけ（❀等の絵文字も入力に含まれていればそのまま描かれる）。
  // fillTextのyはベースラインなので、タグ下端からの「見た目の余白」をgapAbove通りにするには
  // 文字の上端がベースラインよりfontSize×約0.85上にある分を先に足しておく必要がある
  const bioY = afterActivity + layout.bio.gapAbove + layout.bio.fontSize * 0.85;
  let bioBottom = bioY;
  if (state.bio && state.bio.trim()) {
    // プレイヤー名(700)と同系統の明朝体、ウェイトは一段軽い600（未ロード時はSERIF_FONTの
    // フォールバック chain "Yu Mincho"→"Hiragino Mincho ProN"→serif へ委ねる）
    ctx.font = `600 ${layout.bio.fontSize}px ${SERIF_FONT}`;
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "center";
    // 入力中の明示的な改行(\n)を維持する（行をまたいだ自動再配置はしない）
    const lines = pcWrapTextPreserveBreaks(ctx, state.bio.trim(), layout.bio.maxWidth, layout.bio.maxLines);
    let ly = bioY;
    lines.forEach((line) => {
      ctx.fillText(line, layout.bio.centerX, ly);
      ly += layout.bio.lineHeight;
    });
    ctx.textAlign = "left";
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
  // 「hatopi-zukan（はとぴ図鑑）」の重複表記は右下ロゴと役割が被るため削除（showSiteUrlは
  // 現状このブロックでは何も描画しない。フォーム側のトグル自体は据え置き）
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

  // ID・開拓者レベル・プレイスタイル（・サーバー）：テーマごとに正式バッジ画像のアスペクト比が
  // 微妙に異なり、幅に応じた動的フローだと段数がテーマによってばれてしまうため、
  // 固定スロット（2列×2行）へインデックス順に配置する（全テーマで同一の行数・位置になる）
  const idItems = [];
  if (state.playerId && state.playerId.trim()) idItems.push(["infoId", "cardId", "ID", state.playerId.trim()]);
  idItems.push(["infoLevel", "level", "開拓者レベル", `Lv.${state.level || 1}`]);
  if (state.playStyle && state.playStyle.trim()) idItems.push(["infoStyle", "sofa", "プレイスタイル", state.playStyle.trim()]);
  if (state.server && state.server.trim()) idItems.push([null, "globe", "サーバー", state.server.trim()]);

  const partsOkEarly = parts && parts.images && parts.cfg;
  const slot = layout.badgeSlots;
  let lastSlotBottom = slot.y;
  idItems.forEach(([partKey, icon, label, value], i) => {
    const col = i % slot.cols;
    const row = Math.floor(i / slot.cols);
    const sx = slot.x + col * (slot.w + slot.colGap);
    const sy = slot.y + row * (slot.h + slot.rowGap);
    if (partKey && partsOkEarly && parts.images[partKey] && parts.cfg[partKey]) {
      pcDrawInfoBadgeImg(ctx, sx, sy, slot.h, parts.images[partKey], parts.cfg[partKey], value, theme);
    } else {
      const fbFontPx = Math.round(slot.h * 0.42);
      const m = pcMeasureDarkInfoPill(ctx, label, fbFontPx);
      pcDrawDarkInfoPillAt(ctx, sx, sy, icon, label, theme, fbFontPx, m.w, m.h);
      ctx.font = `700 ${fbFontPx}px ${SANS_FONT}`;
      ctx.fillStyle = theme.ink;
      ctx.textAlign = "left";
      ctx.fillText(pcFitTextWidth(ctx, value, 140), sx + m.w + 8, sy + m.h / 2 + fbFontPx * 0.35);
    }
    lastSlotBottom = Math.max(lastSlotBottom, sy + slot.h);
  });
  let cur = lastSlotBottom;

  const tagList = (state.tags || []).map(t => t && t.trim()).filter(Boolean);
  const partsOk = parts && parts.images && parts.cfg;
  if (tagList.length) {
    cur += 6;
    if (partsOk && parts.images.tagFrame && parts.cfg.tagFrame) {
      cur = pcFlowTagChipsImg(ctx, tagList, hx, cur, maxW, layout.styleTags.tagHeight, parts.images.tagFrame, parts.cfg.tagFrame,
        theme, layout.styleTags.fontSize, 10, 6, layout.styleTags.maxRows || 2);
    } else {
      const items = tagList.map(t => ({ type: "chip", text: t }));
      cur = pcFlowStyleTagsRow(ctx, items, hx, cur, maxW, layout.styleTags.fontSize, theme, 10);
    }
  }

  // 自己紹介（末尾に装飾アイコンをインラインで添える。横型と統一した扱い）。
  // 正式バッジ・タグ画像導入でヘッダーの高さが可変になったため、中央メダルと重ならないよう
  // 残りスペースから収まる行数を動的に算出する（0行にはせず、最低1行は表示する）
  if (state.bio && state.bio.trim()) {
    cur += 6;
    ctx.font = `600 ${layout.bio.fontSize}px ${SERIF_FONT}`;
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "left";
    // メダル画像は装飾（宝石・花・リボン）がリング半径の約1.55倍まで外側に張り出すため、
    // r×1.55を安全マージンの基準にする（rそのものでは装飾に重なる）
    const medalSafeY = layout.medal.cy - layout.medal.r * 1.55;
    const maxLinesFit = Math.max(1, Math.floor((medalSafeY - cur) / layout.bio.lineHeight));
    // 入力中の明示的な改行(\n)を維持する（行をまたいだ自動再配置はしない）
    const lines = pcWrapTextPreserveBreaks(ctx, state.bio.trim(), maxW - 30, Math.min(layout.bio.maxLines, maxLinesFit));
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
  // 「hatopi-zukan（はとぴ図鑑）」の重複表記は右下ロゴと役割が被るため削除

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

// ============================================================
// 中央メダル％数字 専用描画エンジン（v7d確定ジオメトリ + v8確定配色/テクスチャ）
// ============================================================
// 参考画像(IMG_7162.png)実測に基づく暖色系ゴールドのグラデーション・輪郭・影・
// 金箔/和紙風の微細テクスチャ・左上ソフトハイライト。文字別scaleX・実輪郭基準の
// 文字間隔・円形安全領域判定（タイトル帯/達成数バッジとの最低距離込み）・1桁/2桁共通の
// 標準スケール＋100%のみ追加縮小——のすべてはbaseR=168・cx=814,cy=423,r=168の
// 横型メダルで実測・確定し、その後「紺×金」横型v8として色/テクスチャを確定した値。
// 縦型など半径が異なるレイアウトでは、下記の各定数はlayoutScale=medal.r/PC_MEDAL_BASE_R倍して
// 適用する（絶対px値を流用しない）。標準スケール自体も固定値を流用せず、
// レイアウトごと（cx,cy,rの組ごと）に実ピクセルから毎回探索する。
const PC_MEDAL_BASE_R = 168;
// 実測アンカー（PC_MEDAL_ANCHORS/PC_ACHIEVEMENT_*系）はすべてこの基準点(cx,cy)で採取したもの。
// cx/cyがこの基準からずれる場合、絶対px値をそのまま使わず(値-基準点)*layoutScaleで
// 相対オフセットとして適用する（cx/cyが基準と一致する通常時は従来と同じ値になる）
const PC_MEDAL_BASE_CX = 814;
const PC_MEDAL_BASE_CY = 423;
// v7d確定時に一括で掛けていた歴史的な縮小係数（サイズそのものは既にこの数値を織り込んだ最終値のため、
// 定数値だけを見て変更しないこと。gap/フォントサイズ/オフセットの「基準となる大きさ」を決めている）
const PC_MEDAL_BASE_SCALE = 0.85;
const PC_MEDAL_TARGET = {
  gap8to2: 14 * PC_MEDAL_BASE_SCALE,
  gap2toPct: 5 * PC_MEDAL_BASE_SCALE,
  bottomOffset2: -2 * PC_MEDAL_BASE_SCALE,
  bottomOffsetPct: -3 * PC_MEDAL_BASE_SCALE,
};
const PC_MEDAL_DIGIT_SCALE_X = { default: 0.9627131981150705, "2": 0.8923 };
const PC_MEDAL_PCT_SCALE_X = 0.8505747126436781;
const PC_MEDAL_DIGIT_FONT_SIZE_BASE = 228.95290012028747 * PC_MEDAL_BASE_SCALE;
const PC_MEDAL_PCT_FONT_SIZE_BASE = 90.42835707631112 * PC_MEDAL_BASE_SCALE;
// タイトル帯下端・達成数バッジ上端の実測値（カード座標、テーマ別・レイアウト別）。
// メダル枠PNG(1254×1254)を輝度ジャンプ検出で走査し、装飾(花・リボン等)がスキャンラインを
// 横切る「孤立したジャンプ」を除外、リング境界特有の「密集クラスタ」のみを採用して測定。
// 4テーマとも同一のメダル枠テンプレート由来のためX方向・タイトル帯はほぼ一致するが、
// 水色（sky-blue）のみ達成数バッジが他3テーマよりカード座標で約10px低い位置にあり、
// これを共通の想定値で近似すると水色の数字が相対的に上寄りに見えるため、
// テーマ別に実測値をそのまま保持する（固定オフセット計算では代用しない）。
const PC_MEDAL_ANCHORS = {
  landscape: {
    "navy-gold":    { titleBottomY: 313.0, badgeTopY: 495.7 },
    "sakura-pink":  { titleBottomY: 315.5, badgeTopY: 494.8 },
    "sky-blue":     { titleBottomY: 318.4, badgeTopY: 505.7 },
    "forest-green": { titleBottomY: 313.4, badgeTopY: 495.7 },
  },
  portrait: {
    "navy-gold":    { titleBottomY: 546.2, badgeTopY: 723.5 },
    "sakura-pink":  { titleBottomY: 548.7, badgeTopY: 722.7 },
    "sky-blue":     { titleBottomY: 551.5, badgeTopY: 733.3 },
    "forest-green": { titleBottomY: 546.6, badgeTopY: 723.5 },
  },
};
// 上記テーブルに存在しない(cx,cy,r)組み合わせ・テーマ用のフォールバック
// （baseR=168実測の相対オフセット。実測テーブルが引けない場合のみ使用）
const PC_MEDAL_TITLE_BOTTOM_OFFSET_FALLBACK = -128;
const PC_MEDAL_BADGE_TOP_OFFSET_FALLBACK = 93;

// テーマオブジェクト(PROFILE_CARD_THEMES[id]と同一参照)から、そのidキー文字列を逆引きする
// （PC_MEDAL_ANCHORSのテーマ別実測値を引くために必要。テーマ定義側にidを複製しない）
function pcThemeIdFor(theme) {
  for (const key of Object.keys(PROFILE_CARD_THEMES)) {
    if (PROFILE_CARD_THEMES[key] === theme) return key;
  }
  return null;
}

// (cx,cy,r)がPROFILE_CARD_LAYOUTSのどのレイアウトのmedal設定と一致するかを判定する
function pcMedalLayoutKeyFor(cx, cy, r) {
  for (const key of Object.keys(PROFILE_CARD_LAYOUTS)) {
    const med = PROFILE_CARD_LAYOUTS[key].medal;
    if (med && med.cx === cx && med.cy === cy && med.r === r) return key;
  }
  return null;
}

// テーマ別実測アンカーを解決する。テーブルに無い組み合わせはbaseR相対オフセットへ安全にフォールバックする
function pcMedalAnchorsFor(themeId, cx, cy, r, layoutScale) {
  const layoutKey = pcMedalLayoutKeyFor(cx, cy, r);
  const byLayout = layoutKey && PC_MEDAL_ANCHORS[layoutKey];
  const anchor = byLayout && themeId && byLayout[themeId];
  if (anchor) return anchor;
  return {
    titleBottomY: cy + PC_MEDAL_TITLE_BOTTOM_OFFSET_FALLBACK * layoutScale,
    badgeTopY: cy + PC_MEDAL_BADGE_TOP_OFFSET_FALLBACK * layoutScale,
  };
}

// v8確定配色（紺×金、参考画像から実測サンプリング）
const PC_MEDAL_GRADIENT = ["#fffdf0", "#ffe08a", "#d29632"];
const PC_MEDAL_OUTER_STROKE = "#93601c";
const PC_MEDAL_INNER_HIGHLIGHT_STROKE = "rgba(255,247,208,0.6)";
const PC_MEDAL_SHADOW_COLOR = "rgba(92,50,8,0.28)";

function pcMedalScaleXFor(ch) {
  return PC_MEDAL_DIGIT_SCALE_X[ch] !== undefined ? PC_MEDAL_DIGIT_SCALE_X[ch] : PC_MEDAL_DIGIT_SCALE_X.default;
}

// 決定論的な擬似乱数生成器（seedが同じなら常に同じ数列を返す。テクスチャの再現性に必須）
function pcMedalMulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// テクスチャseed = 文字コード + グリフ位置 + 表示値全体。同じ文字が連続しても
// （例:「99」「100」の0が2つ）glyphIndex/pctValueが異なるため模様が複製されない
function pcMedalTextureSeed(ch, glyphIndex, pctValue) {
  return ch.charCodeAt(0) * 7919 + glyphIndex * 104729 + pctValue * 1543 + 12345;
}

// stroke(外側・濃色)+shadow+グラデーションfill+内側ハイライトstrokeのみ（テクスチャ/ソフト
// ハイライトは含まない）。内部の実測・安全域判定専用の軽量版。これらの装飾は最終描画時に
// source-atop合成で追加され、既存のアルファ値を一切変化させないため、測定系では省略して
// 高速化してよい（呼び出し側は必ずctx.translate/scaleを設定してから呼ぶこと）
function pcMedalDrawGlyphBase(ctx, text, fontSizePx) {
  ctx.font = `${PC_MEDAL_DIGIT_FONT_WEIGHT} ${fontSizePx}px ${PC_MEDAL_DIGIT_FONT}`;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round";
  ctx.shadowColor = PC_MEDAL_SHADOW_COLOR;
  ctx.shadowBlur = fontSizePx * 0.015;
  ctx.shadowOffsetX = fontSizePx * 0.018;
  ctx.shadowOffsetY = fontSizePx * 0.022;
  ctx.strokeStyle = PC_MEDAL_OUTER_STROKE;
  ctx.lineWidth = fontSizePx * 0.025;
  ctx.strokeText(text, 0, 0);
  ctx.shadowColor = "transparent";
  const grad = ctx.createLinearGradient(0, -fontSizePx * 0.78, 0, fontSizePx * 0.12);
  PC_MEDAL_GRADIENT.forEach((c, i) => grad.addColorStop(i / (PC_MEDAL_GRADIENT.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  ctx.strokeStyle = PC_MEDAL_INNER_HIGHLIGHT_STROKE;
  ctx.lineWidth = fontSizePx * 0.017;
  ctx.strokeText(text, 0, 0);
}

// 金箔/和紙風の微細テクスチャ（fillTextの塗り領域内にのみ呼び出し側でマスクされる前提）
function pcMedalDrawGoldFoilTexture(ctx, fontSizePx, seed) {
  const rand = pcMedalMulberry32(seed);
  const rx0 = -fontSizePx * 0.85, ry0 = -fontSizePx * 1.05;
  const rw = fontSizePx * 1.7, rh = fontSizePx * 1.3;
  const numDots = Math.round(fontSizePx * fontSizePx * 0.012);
  for (let i = 0; i < numDots; i++) {
    const x = rx0 + rand() * rw;
    const y = ry0 + rand() * rh;
    const bright = rand() < 0.55;
    const alpha = 0.03 + rand() * 0.04;
    ctx.fillStyle = bright ? `rgba(255,250,222,${alpha})` : `rgba(112,66,20,${alpha})`;
    const rad = fontSizePx * (0.0025 + rand() * 0.004);
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  const numFibers = Math.max(3, Math.round(fontSizePx * 0.035));
  for (let i = 0; i < numFibers; i++) {
    const x = rx0 + rand() * rw;
    const y = ry0 + rand() * rh;
    const len = fontSizePx * (0.12 + rand() * 0.22);
    const angle = (rand() - 0.5) * 0.4;
    const alpha = 0.02 + rand() * 0.02;
    ctx.strokeStyle = rand() < 0.5 ? `rgba(255,248,220,${alpha})` : `rgba(120,74,24,${alpha})`;
    ctx.lineWidth = fontSizePx * 0.0025;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
}

// 左上からの柔らかいハイライト（同じく塗り領域内マスクが前提）
function pcMedalDrawSoftHighlight(ctx, fontSizePx) {
  const grad = ctx.createRadialGradient(
    -fontSizePx * 0.26, -fontSizePx * 0.56, 0,
    -fontSizePx * 0.2, -fontSizePx * 0.5, fontSizePx * 0.6
  );
  grad.addColorStop(0, "rgba(255,253,238,0.24)");
  grad.addColorStop(1, "rgba(255,253,238,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(-fontSizePx, -fontSizePx * 1.2, fontSizePx * 2, fontSizePx * 1.6);
}

// 実際の最終描画。stroke/shadow/fill/内側ハイライトstrokeをctxへ直接描いた後、
// テクスチャ+ソフトハイライトは「fillTextだけを描いたマスク」に対しdestination-inで
// 制限した別レイヤーとして作り、それをsource-atopでctxへ合成する。
// source-atopは合成先(ctx)のアルファを一切変化させない（=bboxが絶対に変化しない）ため、
// 外周stroke・内側ハイライトstroke・shadowの領域にはテクスチャ/ハイライトの色が一切混ざらない
// （それらの領域はfillTextマスクのアルファが0＝テクスチャレイヤーのアルファも0のため）。
// canvasW/canvasHは実際の本番Canvasのpx寸法（ctx.canvas.width/height）を渡すこと
// （オフスクリーンのtranslate/scaleを本番ctxと完全一致させ、drawImageは等倍(1:1)のみを使う
// ＝拡大縮小によるぼやけを発生させない）
function pcMedalDrawGlyphFinal(ctx, ch, fontSizePx, anchorX, anchorY, sx, seed, canvasW, canvasH) {
  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.scale(sx, 1);
  pcMedalDrawGlyphBase(ctx, ch, fontSizePx);
  ctx.restore();

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvasW; maskCanvas.height = canvasH;
  const maskCtx = maskCanvas.getContext("2d");
  maskCtx.save();
  maskCtx.translate(anchorX, anchorY);
  maskCtx.scale(sx, 1);
  maskCtx.font = `${PC_MEDAL_DIGIT_FONT_WEIGHT} ${fontSizePx}px ${PC_MEDAL_DIGIT_FONT}`;
  maskCtx.textAlign = "left"; maskCtx.textBaseline = "alphabetic";
  maskCtx.fillStyle = "#000";
  maskCtx.fillText(ch, 0, 0);
  maskCtx.restore();

  const decoCanvas = document.createElement("canvas");
  decoCanvas.width = canvasW; decoCanvas.height = canvasH;
  const decoCtx = decoCanvas.getContext("2d");
  decoCtx.save();
  decoCtx.translate(anchorX, anchorY);
  decoCtx.scale(sx, 1);
  pcMedalDrawSoftHighlight(decoCtx, fontSizePx);
  pcMedalDrawGoldFoilTexture(decoCtx, fontSizePx, seed);
  decoCtx.restore();
  decoCtx.globalCompositeOperation = "destination-in";
  decoCtx.drawImage(maskCanvas, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.drawImage(decoCanvas, 0, 0);
  ctx.restore();
}

function pcMedalAlphaScan(imgData, w, h) {
  let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const a = imgData[(yy * w + xx) * 4 + 3];
    if (a > 10) {
      found = true;
      if (xx < minX) minX = xx; if (xx > maxX) maxX = xx;
      if (yy < minY) minY = yy; if (yy > maxY) maxY = yy;
    }
  }
  if (!found) return null;
  return { left: minX, top: minY, right: maxX, bottom: maxY, w: maxX - minX, h: maxY - minY };
}

function pcMedalDrawAndMeasure(ch, fontSizePx, sx, anchorX, anchorY, cw, ch_) {
  const c = document.createElement("canvas"); c.width = cw; c.height = ch_;
  const ctx = c.getContext("2d");
  ctx.save(); ctx.translate(anchorX, anchorY); ctx.scale(sx, 1);
  pcMedalDrawGlyphBase(ctx, ch, fontSizePx);
  ctx.restore();
  const imgData = ctx.getImageData(0, 0, cw, ch_).data;
  return { bbox: pcMedalAlphaScan(imgData, cw, ch_) };
}

// 文字配列(桁の数字のみ、"%"は別途末尾へ追加される)から、実輪郭(alpha>10)基準の
// 間隔・文字別scaleX・自然なオーバーシュートを補正した下端揃えでグループを構築する
function pcMedalBuildGroup(chars, layoutScale, groupScale, cw, ch_, anchor0X, anchor0Y) {
  const gap8to2 = PC_MEDAL_TARGET.gap8to2 * layoutScale * groupScale;
  const gap2toPct = PC_MEDAL_TARGET.gap2toPct * layoutScale * groupScale;
  const bottomOffset2 = PC_MEDAL_TARGET.bottomOffset2 * layoutScale * groupScale;
  const bottomOffsetPct = PC_MEDAL_TARGET.bottomOffsetPct * layoutScale * groupScale;
  const digitFontSize = PC_MEDAL_DIGIT_FONT_SIZE_BASE * layoutScale * groupScale;
  const pctFontSize = PC_MEDAL_PCT_FONT_SIZE_BASE * layoutScale * groupScale;

  const r0 = pcMedalDrawAndMeasure(chars[0], digitFontSize, pcMedalScaleXFor(chars[0]), anchor0X, anchor0Y, cw, ch_);
  const bbox0 = r0.bbox;
  const glyphs = [{ ch: chars[0], anchorX: anchor0X, anchorY: anchor0Y, fontSize: digitFontSize, sx: pcMedalScaleXFor(chars[0]), bbox: bbox0 }];
  let prevBbox = bbox0;
  for (let i = 1; i < chars.length; i++) {
    const ch = chars[i];
    const rNat = pcMedalDrawAndMeasure(ch, digitFontSize, pcMedalScaleXFor(ch), anchor0X, anchor0Y, cw, ch_);
    const naturalDiff = rNat.bbox.bottom - bbox0.bottom;
    const anchorY = anchor0Y + (bottomOffset2 - naturalDiff);
    const rTrial = pcMedalDrawAndMeasure(ch, digitFontSize, pcMedalScaleXFor(ch), anchor0X, anchorY, cw, ch_);
    const leftOffset = rTrial.bbox.left - anchor0X;
    const anchorX = (prevBbox.right + gap8to2) - leftOffset;
    const rFinal = pcMedalDrawAndMeasure(ch, digitFontSize, pcMedalScaleXFor(ch), anchorX, anchorY, cw, ch_);
    glyphs.push({ ch, anchorX, anchorY, fontSize: digitFontSize, sx: pcMedalScaleXFor(ch), bbox: rFinal.bbox });
    prevBbox = rFinal.bbox;
  }
  {
    const rNat = pcMedalDrawAndMeasure("%", pctFontSize, PC_MEDAL_PCT_SCALE_X, anchor0X, anchor0Y, cw, ch_);
    const naturalDiff = rNat.bbox.bottom - bbox0.bottom;
    const anchorY = anchor0Y + (bottomOffsetPct - naturalDiff);
    const rTrial = pcMedalDrawAndMeasure("%", pctFontSize, PC_MEDAL_PCT_SCALE_X, anchor0X, anchorY, cw, ch_);
    const leftOffset = rTrial.bbox.left - anchor0X;
    const anchorX = (prevBbox.right + gap2toPct) - leftOffset;
    const rFinal = pcMedalDrawAndMeasure("%", pctFontSize, PC_MEDAL_PCT_SCALE_X, anchorX, anchorY, cw, ch_);
    glyphs.push({ ch: "%", anchorX, anchorY, fontSize: pctFontSize, sx: PC_MEDAL_PCT_SCALE_X, bbox: rFinal.bbox });
  }
  const bboxFull = {
    left: Math.min(...glyphs.map(g => g.bbox.left)), top: Math.min(...glyphs.map(g => g.bbox.top)),
    right: Math.max(...glyphs.map(g => g.bbox.right)), bottom: Math.max(...glyphs.map(g => g.bbox.bottom)),
  };
  bboxFull.w = bboxFull.right - bboxFull.left; bboxFull.h = bboxFull.bottom - bboxFull.top;
  return { glyphs, bboxFull };
}

function pcMedalRenderGroupToCanvas(glyphs, dx, dy, cw, ch_) {
  const c = document.createElement("canvas"); c.width = cw; c.height = ch_;
  const ctx = c.getContext("2d");
  glyphs.forEach(g => {
    ctx.save(); ctx.translate(g.anchorX + dx, g.anchorY + dy); ctx.scale(g.sx, 1);
    pcMedalDrawGlyphBase(ctx, g.ch, g.fontSize); ctx.restore();
  });
  return c;
}

function pcMedalCheckSafeCircleAndCentroid(canvas, circleCx, circleCy, safeRadius) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h).data;
  let outsideCount = 0, minMargin = Infinity;
  let sumX = 0, sumY = 0, sumA = 0;
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const a = imgData[(yy * w + xx) * 4 + 3];
    if (a > 10) {
      sumX += xx * a; sumY += yy * a; sumA += a;
      const dxp = xx - circleCx, dyp = yy - circleCy;
      const dist = Math.sqrt(dxp * dxp + dyp * dyp);
      if (dist > safeRadius) outsideCount++;
      const margin = safeRadius - dist;
      if (margin < minMargin) minMargin = margin;
    }
  }
  return { outsideCount, minMargin, alphaCentroidX: sumA ? sumX / sumA : circleCx, alphaCentroidY: sumA ? sumY / sumA : circleCy };
}

// 指定groupScaleで、percentCenterY=(titleBottomY+badgeTopY)/2 へグループのbbox中心を
// 配置した状態で評価する（cxのみ円中心cxへ、cyには依存しない。titleBottomY/badgeTopYは
// テーマ別実測値=PC_MEDAL_ANCHORSを呼び出し側から受け取る）。
// safeRadius/バッジ・タイトルとの最低距離は、すべてlayoutScale（=medal.r/168）で拡縮する
// （"(r-8)*layoutScale"ではなく"r-8*layoutScale"——縮小マージン自体をlayoutScaleぶん
// 小さくしてから実半径rから引く——という式に統一する）
function pcMedalEvalAtScale(chars, layoutScale, groupScale, cx, cy, r, titleBottomY, badgeTopY) {
  const cw = 1200, ch_ = 900;
  const anchor0X = 300, anchor0Y = 450;
  const group = pcMedalBuildGroup(chars, layoutScale, groupScale, cw, ch_, anchor0X, anchor0Y);
  const groupCenterX = (group.bboxFull.left + group.bboxFull.right) / 2;
  const groupCenterY = (group.bboxFull.top + group.bboxFull.bottom) / 2;
  const percentCenterY = (titleBottomY + badgeTopY) / 2;
  const dx = cx - groupCenterX, dy = percentCenterY - groupCenterY;
  const canvas = pcMedalRenderGroupToCanvas(group.glyphs, dx, dy, cw, ch_);

  const safeRadius = r - 8 * layoutScale;
  const circleCheck = pcMedalCheckSafeCircleAndCentroid(canvas, cx, cy, safeRadius);

  const finalBBox = {
    left: group.bboxFull.left + dx, top: group.bboxFull.top + dy,
    right: group.bboxFull.right + dx, bottom: group.bboxFull.bottom + dy,
    w: group.bboxFull.w, h: group.bboxFull.h,
  };
  const distToTitle = finalBBox.top - titleBottomY;
  const distToBadge = badgeTopY - finalBBox.bottom;

  const ok = circleCheck.outsideCount === 0 && circleCheck.minMargin >= 3 * layoutScale
    && distToTitle >= 18 * layoutScale && distToBadge >= 18 * layoutScale;

  return { group, dx, dy, finalBBox, titleBottomY, badgeTopY, distToTitle, distToBadge, circleCheck, ok, safeRadius };
}

// 3条件（円形安全領域・タイトル帯距離・バッジ距離）をすべて満たす最大groupScaleを
// 0.001精度の二分探索で求める
function pcMedalBinarySearchMaxScale(chars, layoutScale, cx, cy, r, titleBottomY, badgeTopY) {
  let lo = 0.1, hi = 1.0;
  let bestResult = pcMedalEvalAtScale(chars, layoutScale, lo, cx, cy, r, titleBottomY, badgeTopY);
  if (!bestResult.ok) return { groupScale: lo, result: bestResult };
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    const midResult = pcMedalEvalAtScale(chars, layoutScale, mid, cx, cy, r, titleBottomY, badgeTopY);
    if (midResult.ok) { lo = mid; bestResult = midResult; } else { hi = mid; }
  }
  return { groupScale: lo, result: bestResult };
}

// テーマ別アンカーで各テーマ自身の安全域を判定しつつ、数字の「大きさ」（groupScale）は
// 4テーマ共通の1つの値にする。キャッシュキーにthemeIdは含めない（レイアウト単位のみ）。
// テーマ一覧はPC_MEDAL_ANCHORS[layoutKey]のキーから取得する（PROFILE_CARD_THEMES全体を
// 決め打ちしないことで、将来テーマが増減しても自動的に追従する）
function pcMedalThemeIdsFor(layoutKey) {
  const byLayout = layoutKey && PC_MEDAL_ANCHORS[layoutKey];
  return byLayout ? Object.keys(byLayout) : [];
}

// 1〜2桁共通の標準スケール：レイアウトごとに、4テーマ×代表値(18/56/82/99)の
// 「そのテーマ自身のアンカーで安全な最大スケール」を全16通り計測し、その最小値を採用する。
// レイアウトキーが解決できない（未知のcx/cy/r）場合のみ、フォールバックアンカーの単一テーマ
// 相当として計測する。キャッシュキーはlayoutKey基準（テーマには依存しない）
const pcMedalStandardScaleCache = new Map();
function pcMedalComputeStandardScale(cx, cy, r) {
  const layoutKey = pcMedalLayoutKeyFor(cx, cy, r);
  const key = layoutKey || `${cx}|${cy}|${r}`;
  if (pcMedalStandardScaleCache.has(key)) return pcMedalStandardScaleCache.get(key);
  const layoutScale = r / PC_MEDAL_BASE_R;
  const themeIds = layoutKey ? pcMedalThemeIdsFor(layoutKey) : [null];
  const twoDigitSamples = ["18", "56", "82", "99"];
  let minScale = Infinity;
  for (const themeId of themeIds) {
    const { titleBottomY, badgeTopY } = pcMedalAnchorsFor(themeId, cx, cy, r, layoutScale);
    for (const s of twoDigitSamples) {
      const { groupScale } = pcMedalBinarySearchMaxScale(s.split(""), layoutScale, cx, cy, r, titleBottomY, badgeTopY);
      if (groupScale < minScale) minScale = groupScale;
    }
  }
  pcMedalStandardScaleCache.set(key, minScale);
  return minScale;
}

// 3桁(100%)などの値専用スケール：4テーマそれぞれの安全な最大スケールを計測し、その最小値を
// レイアウト共通で採用する。キャッシュキーは layoutKey + 表示文字列
const pcMedalValueScaleCache = new Map();
function pcMedalComputeCommonValueScale(chars, cx, cy, r) {
  const layoutKey = pcMedalLayoutKeyFor(cx, cy, r);
  const key = `${layoutKey || `${cx}|${cy}|${r}`}|${chars.join("")}`;
  if (pcMedalValueScaleCache.has(key)) return pcMedalValueScaleCache.get(key);
  const layoutScale = r / PC_MEDAL_BASE_R;
  const themeIds = layoutKey ? pcMedalThemeIdsFor(layoutKey) : [null];
  let minScale = Infinity;
  for (const themeId of themeIds) {
    const { titleBottomY, badgeTopY } = pcMedalAnchorsFor(themeId, cx, cy, r, layoutScale);
    const { groupScale } = pcMedalBinarySearchMaxScale(chars, layoutScale, cx, cy, r, titleBottomY, badgeTopY);
    if (groupScale < minScale) minScale = groupScale;
  }
  pcMedalValueScaleCache.set(key, minScale);
  return minScale;
}

// パーセント文字は「数字」と「%」を別要素として描画する。文字別scaleX・実輪郭基準の
// 文字間隔・円形安全領域判定・1桁/2桁共通の標準スケール＋100%のみ追加縮小——は
// すべて実ピクセル測定に基づくため、フォント読み込み失敗時のフォールバック書体でも
// 破綻しない（PC_MEDAL_DIGIT_FONTのCSSフォールバックへ自然に委ねる）。
// 数字群の垂直中心は、メダル中心cyではなく「タイトル帯下端とバッジ上端の中間点」
// （テーマ別実測値=PC_MEDAL_ANCHORS）を基準にする。X方向はcxのまま（テーマ間の
// 内円中心Xの差は最大0.8pxのため、X方向のテーマ別補正は行わない）
function pcDrawMedalPercent(ctx, cx, cy, r, pct, theme) {
  const layoutScale = r / PC_MEDAL_BASE_R;
  const themeId = pcThemeIdFor(theme);
  const anchors = pcMedalAnchorsFor(themeId, cx, cy, r, layoutScale);
  const { titleBottomY, badgeTopY } = anchors;
  // 数字の大きさ(groupScale)はレイアウト共通(4テーマ全ての安全域を満たす最小値)。
  // Y中心(percentCenterY、evalAtScale内部で算出)だけがテーマ別アンカーにより変わる
  const standardScale = pcMedalComputeStandardScale(cx, cy, r);
  const chars = `${pct}`.split("");
  let groupScale = standardScale;
  let evalResult = pcMedalEvalAtScale(chars, layoutScale, groupScale, cx, cy, r, titleBottomY, badgeTopY);
  if (!evalResult.ok) {
    // 3桁(100%)等、共通標準スケールでは収まらない値のみ、レイアウト共通の値別スケールへ縮小する
    // （このテーマだけの個別スケールにはしない）
    const commonValueScale = pcMedalComputeCommonValueScale(chars, cx, cy, r);
    groupScale = Math.min(groupScale, commonValueScale);
    evalResult = pcMedalEvalAtScale(chars, layoutScale, groupScale, cx, cy, r, titleBottomY, badgeTopY);
  }

  const allChars = chars.concat(["%"]);
  const canvasW = ctx.canvas.width, canvasH = ctx.canvas.height;
  evalResult.group.glyphs.forEach((g, i) => {
    const seed = pcMedalTextureSeed(allChars[i], i, pct);
    pcMedalDrawGlyphFinal(ctx, g.ch, g.fontSize, g.anchorX + evalResult.dx, g.anchorY + evalResult.dy, g.sx, seed, canvasW, canvasH);
  });

  const debugInfo = {
    pct, cx, cy, r, themeId, layoutScale, standardScale, appliedGroupScale: groupScale,
    titleBottomY, badgeTopY, percentCenterY: (titleBottomY + badgeTopY) / 2,
    outsideCount: evalResult.circleCheck.outsideCount, minMarginToCircle: evalResult.circleCheck.minMargin,
    finalBBox: evalResult.finalBBox, distToTitle: evalResult.distToTitle, distToBadge: evalResult.distToBadge,
    safeRadius: evalResult.safeRadius,
  };
  // 検証用デバッグフック（通常描画では無害。回帰検証スクリプトから読み取る）
  window.__pcMedalDebug = debugInfo;
  return debugInfo;
}

// ============================================================
// 「達成数」バッジの動的数値（例:"492 / 600"）専用描画
// ============================================================
// 参考画像4テーマ（ref-navy-gold/sakura-pink/sky-blue/forest-green.png、1672×941）を
// 実測。バッジ・ラベル・数値の位置はテーマ間で共通（同一medal-frameテンプレート内の
// 焼き込み要素）のため、位置・サイズはレイアウト単位のみで保持し、色だけテーマ別にする。
// 横型の実測値をPC_MEDAL_BASE_R=168基準の1254空間へ変換し、縦型はメダルの共通スケール
// 変換（scale=medal.r/400）で逆算した値（横型の絶対px値をそのまま流用してはいない）
const PC_ACHIEVEMENT_VALUE_FONT = "'NotoSerifJPAchievementValue800', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif";
const PC_ACHIEVEMENT_VALUE_WEIGHT = 800;
const PC_ACHIEVEMENT_VALUE_RECT = {
  landscape: { x: 790, y: 503, width: 100, height: 40 },
  portrait: { x: 519.7, y: 730.6, width: 97.0, height: 38.8 },
};
// 基準フォントサイズ：r=168(layoutScale=1)で"492 / 600"がvalueRect幅に余裕(4px)を持って
// 収まるよう校正した値（実測ラベル高さとバッジ内側の余白から導いたmaxWidthに対する二分探索の
// 結果。基準サイズの代表値がぎりぎり縮小トリガーに触れないよう小さな安全マージンを設けている）
const PC_ACHIEVEMENT_VALUE_BASE_FONT_SIZE = 21.3;
// 参考画像から実測サンプリングした値。既存のtheme.accentBadgeText（バッジ全体の文字色、
// 他要素と共用）とは独立したトークン（達成数の数値専用）
const PC_ACHIEVEMENT_VALUE_COLOR = {
  "navy-gold": "#e8ebdd",
  "sakura-pink": "#c43663",
  "sky-blue": "#114a89",
  "forest-green": "#f6f6c3",
};

// メダルPNGに焼き込まれた固定ラベル「達成数」の実インクbbox（レイアウト×テーマ別、
// 本番Playwrightレンダリングからalpha走査で実測、card-space絶対座標）。
// sky-blueのみバッジ位置がPNG側で他3テーマより約11px低い（実測で確認済みの差）。
const PC_ACHIEVEMENT_LABEL_ANCHOR = {
  landscape: {
    "navy-gold": { bboxTop: 509, bboxBottom: 526, inkCenterY: 517.5 },
    "sakura-pink": { bboxTop: 509, bboxBottom: 525, inkCenterY: 517.0 },
    "sky-blue": { bboxTop: 520, bboxBottom: 537, inkCenterY: 528.5 },
    "forest-green": { bboxTop: 509, bboxBottom: 526, inkCenterY: 517.5 },
  },
  portrait: {
    "navy-gold": { bboxTop: 736, bboxBottom: 752, inkCenterY: 744.0 },
    "sakura-pink": { bboxTop: 737, bboxBottom: 752, inkCenterY: 744.5 },
    "sky-blue": { bboxTop: 747, bboxBottom: 763, inkCenterY: 755.0 },
    "forest-green": { bboxTop: 736, bboxBottom: 753, inkCenterY: 744.5 },
  },
};

function pcAchievementValueRectFor(cx, cy, r) {
  const layoutKey = pcMedalLayoutKeyFor(cx, cy, r);
  return (layoutKey && PC_ACHIEVEMENT_VALUE_RECT[layoutKey]) || PC_ACHIEVEMENT_VALUE_RECT.landscape;
}

function pcAchievementLabelAnchorFor(cx, cy, r, themeId) {
  const layoutKey = pcMedalLayoutKeyFor(cx, cy, r);
  const table = (layoutKey && PC_ACHIEVEMENT_LABEL_ANCHOR[layoutKey]) || PC_ACHIEVEMENT_LABEL_ANCHOR.landscape;
  return table[themeId] || table["navy-gold"];
}

// pcMeasureAchievementValueMiddleInkOffset（透明canvas・シャドウなし・alpha閾値）と、
// 本番canvasに実際に描画された結果を色距離閾値で実測した値とを比較すると、測定手法の
// 違い（本番は実背景・実シャドウ込みで色距離>45judge）に起因する小さな系統的ズレが残る。
// 8テーマ×レイアウト×6種の値文字列で実測した残差平均をレイアウト別の較正値として適用する
// （個々のケースの残差は概ね±0.5px以内に収まる。テーマ別の較正は不要：残差はテーマ間で
// ほぼ一定だった）
const PC_ACHIEVEMENT_VALUE_VCENTER_CALIBRATION = { landscape: 1.25, portrait: 1.375 };

function pcAchievementValueVCenterCalibrationFor(cx, cy, r) {
  const layoutKey = pcMedalLayoutKeyFor(cx, cy, r);
  return (layoutKey && PC_ACHIEVEMENT_VALUE_VCENTER_CALIBRATION[layoutKey]) || 0;
}

// text/fontを指定のfontSizeでtextBaseline="middle", drawY=0に描画した場合に、実際の
// インク中心Yがdraw位置からどれだけずれるか（フォントメトリクスの中心とインクの
// 視覚的な中心は一致しないため、offscreen canvasへ実描画してalpha>128で走査する）。
// 本番canvasは整数px単位でしか測定できない（getImageDataの制約）ため、この内部計測
// だけ4倍supersamplingしてサブピクセル精度でoffsetを求め、四捨五入による系統誤差を
// 最小化する
function pcMeasureAchievementValueMiddleInkOffset(font, text, fontSize) {
  const SS = 4;
  const pad = Math.ceil(fontSize * 1.5);
  const c = pcAchievementMeasureCanvas || (pcAchievementMeasureCanvas = document.createElement("canvas"));
  const mctx = c.getContext("2d");
  mctx.setTransform(1, 0, 0, 1, 0, 0);
  mctx.font = font;
  const baseWidth = Math.max(1, Math.ceil(mctx.measureText(text).width) + pad * 2);
  const baseHeight = Math.max(1, Math.ceil(fontSize * 3));
  c.width = baseWidth * SS;
  c.height = baseHeight * SS;
  mctx.setTransform(SS, 0, 0, SS, 0, 0);
  mctx.font = font;
  mctx.textAlign = "center";
  mctx.textBaseline = "middle";
  mctx.fillStyle = "#000";
  const drawY = baseHeight / 2;
  mctx.fillText(text, baseWidth / 2, drawY);
  mctx.setTransform(1, 0, 0, 1, 0, 0);

  const width = c.width, height = c.height;
  const data = mctx.getImageData(0, 0, width, height).data;
  let top = null, bottom = null;
  for (let y = 0; y < height; y++) {
    let rowHasInk = false;
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 128) { rowHasInk = true; break; }
    }
    if (rowHasInk) { if (top === null) top = y; bottom = y; }
  }
  if (top === null) return { offset: 0, top: drawY, bottom: drawY, drawY };
  return { offset: (top + bottom) / 2 / SS - drawY, top: top / SS, bottom: bottom / SS, drawY };
}
let pcAchievementMeasureCanvas = null;

// 基本サイズは4テーマ・全レイアウト共通（layoutScaleのみで拡縮）。値専用領域の幅を
// 超えた場合だけ自動縮小し、末尾を省略記号で切り詰めることはしない。中央揃え
// （textAlign=center）でvalueRectの中心Xに配置し、縦位置は固定ラベル「達成数」の
// 実インク中心Yに動的数値の実インク中心Yが一致するよう補正して描画する
// （フォントメトリクスベースのtextBaseline="middle"だけには依存しない）
function pcDrawAchievementValue(ctx, cx, cy, r, text, themeId) {
  const layoutScale = r / PC_MEDAL_BASE_R;
  const rect = pcAchievementValueRectFor(cx, cy, r);
  const baseFontSize = PC_ACHIEVEMENT_VALUE_BASE_FONT_SIZE * layoutScale;
  const maxWidth = rect.width * layoutScale;

  ctx.font = `${PC_ACHIEVEMENT_VALUE_WEIGHT} ${baseFontSize}px ${PC_ACHIEVEMENT_VALUE_FONT}`;
  let fontSize = baseFontSize;
  const naturalWidth = ctx.measureText(text).width;
  if (naturalWidth > maxWidth) {
    fontSize = baseFontSize * (maxWidth / naturalWidth);
    ctx.font = `${PC_ACHIEVEMENT_VALUE_WEIGHT} ${fontSize}px ${PC_ACHIEVEMENT_VALUE_FONT}`;
  }

  // rectはPC_MEDAL_BASE_CX/CY・baseRの基準点で実測した絶対px値のため、cx/cyが基準と
  // 異なる場合は基準点からの相対オフセットとして(値-基準点)*layoutScaleを適用する
  // （cx/cyが基準と一致する通常時は従来と同じ絶対値になり、既存の見た目は変わらない）
  const valueCenterX = cx + (rect.x + rect.width / 2 - PC_MEDAL_BASE_CX) * layoutScale;
  const valueCenterY = cy + (rect.y + rect.height / 2 - PC_MEDAL_BASE_CY) * layoutScale;

  // 縮小後の実fontSize・実テキストで再測定するため、縮小の有無に関わらずこの時点の
  // fontSizeでオフスクリーン計測する（ズレたfontSizeで測って縮小後にズレたままにしない）
  const fontString = `${PC_ACHIEVEMENT_VALUE_WEIGHT} ${fontSize}px ${PC_ACHIEVEMENT_VALUE_FONT}`;
  const inkMeasure = pcMeasureAchievementValueMiddleInkOffset(fontString, text, fontSize);
  const initialDrawY = valueCenterY;
  const valueInkCenterY = initialDrawY + inkMeasure.offset;
  const labelAnchor = pcAchievementLabelAnchorFor(cx, cy, r, themeId);
  // labelAnchor.inkCenterYも基準点cyでの実測絶対px値のため、同様に相対オフセット変換する
  const labelInkCenterY = cy + (labelAnchor.inkCenterY - PC_MEDAL_BASE_CY) * layoutScale;
  const calibration = pcAchievementValueVCenterCalibrationFor(cx, cy, r) * layoutScale;
  const correctionY = labelInkCenterY - valueInkCenterY + calibration;
  const finalDrawY = initialDrawY + correctionY;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // 可読性のための非常に控えめな影のみ（参考画像に強い縁取りは無いため、太いstrokeは追加しない）
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = fontSize * 0.04;
  ctx.shadowOffsetY = fontSize * 0.02;
  ctx.fillStyle = PC_ACHIEVEMENT_VALUE_COLOR[themeId] || "#f2e9d3";
  ctx.fillText(text, valueCenterX, finalDrawY);
  ctx.restore();

  const appliedValueBBoxTop = finalDrawY + (inkMeasure.top - inkMeasure.drawY);
  const appliedValueBBoxBottom = finalDrawY + (inkMeasure.bottom - inkMeasure.drawY);

  window.__pcAchievementValueDebug = {
    text, themeId, cx, cy, r, layoutScale, rect, baseFontSize, fontSize,
    naturalWidth, maxWidth, shrunk: naturalWidth > maxWidth,
    valueCenterX, valueCenterY, initialDrawY, finalDrawY, calibration,
    labelBBoxTop: labelAnchor.bboxTop, labelBBoxBottom: labelAnchor.bboxBottom, labelInkCenterY,
    valueBBoxTop: appliedValueBBoxTop, valueBBoxBottom: appliedValueBBoxBottom,
    valueInkCenterY: (appliedValueBBoxTop + appliedValueBBoxBottom) / 2,
    // 修正: 以前はlabelAnchor.inkCenterY（基準点cx/cy=814/423・r=168空間の未スケール値）を
    // そのままカード最終座標のvalueInkCenterYと比較していたため、cx/cy/rが基準からずれる
    // （＝メダルサイズや中心を変更する）ほど無関係な差分が発生し、実際には正しく中心が
    // 揃っているのに「ズレている」ように見える診断バグがあった。実際の描画位置と同じ
    // 空間で比較するよう、スケール済みのlabelInkCenterYと比較する
    centerDifference: labelInkCenterY - (appliedValueBBoxTop + appliedValueBBoxBottom) / 2,
    appliedCorrectionY: correctionY,
    renderedWidth: fontSize === baseFontSize ? naturalWidth : maxWidth,
  };
}

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
    pcDrawMedalPercent(ctx, cx, cy, r, pct, theme);

    // 「達成数」の動的数値（例:"492 / 600"）は参考画像実測のvalueRect・専用フォント・
    // テーマ別実測色で描画する（スラッシュ前後の空白を保持する）
    const doneText = `${overallStat.done} / ${overallStat.total}`;
    pcDrawAchievementValue(ctx, cx, cy, r, doneText, pcThemeIdFor(theme));
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

  pcDrawMedalPercent(ctx, cx, cy, r, pct, theme);

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
// カテゴリ進捗カード（最大8件、横型2列×4段／縦型4列×2段）
// ============================================================
function drawCategoryProgress(ctx, layout, theme, categoryDefs, stats, dense, categoryImages) {
  const g = layout.categoryGrid;
  const gapX = g.gapX != null ? g.gapX : g.gap;
  const gapY = g.gapY != null ? g.gapY : g.gap;
  categoryDefs.forEach((def, i) => {
    const col = i % g.cols;
    const row = Math.floor(i / g.cols);
    const x = g.x + col * (g.cardW + gapX);
    const y = g.y + row * (g.cardH + gapY);
    const img = categoryImages && categoryImages[def.id];
    drawCategoryCard(ctx, x, y, g.cardW, g.cardH, def, theme, stats[def.id] || { done: 0, total: 0 }, dense, img);
  });
}

// 縦型カテゴリカードのみ、背景風景が数値・進捗バーへ透けないよう不透明度を上げる。
// theme.panelは横型カード・他UIと共有のため、ここではrgba文字列のアルファ値だけを
// ローカルに底上げした色を作り、theme.panel自体は変更しない
function pcBoostPanelOpacity(rgbaStr, minAlpha) {
  const m = /rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)/.exec(rgbaStr);
  if (!m) return rgbaStr;
  const a = Math.max(parseFloat(m[4]), minAlpha);
  return `rgba(${m[1].trim()},${m[2].trim()},${m[3].trim()},${a})`;
}

// 提供済みの共通カテゴリカードPNG（1200×1020、4テーマ共通・横型/縦型共通の1種類、
// カテゴリ名・アイコン・金枠・装飾・数値表示用の空欄まで焼き込み済み）に対する、
// パーセント／達成数・総数の描画基準位置。drawCategoryCardImgがdrawImageの
// sourceRectに透明余白を除いたbbox（実測: 幅約1093-1099px・高さ約800-810px、
// 全画像でほぼ共通）を使うようになったため、この割合もPNG全体(1200×1020)基準ではなく
// bbox基準（fish.pngのbbox sx=53,sy=123,sw=1093,sh=800で正規化）に変換済み。
// 横型・縦型のどちらでも同じPNGを使い回し、Canvas上の表示サイズ（セル枠w×h）だけを
// レイアウト側で切り替える。空欄の位置はPNG側で固定のため、割合座標はテーマ・レイアウト共通。
const PC_CATEGORY_IMG_LAYOUT = {
  pctCenterX: 0.6465, pctCenterY: 0.5551, pctZoneWidthRatio: 0.5127, pctZoneHeightRatio: 0.3009,
  countCenterX: 0.6465, countCenterY: 0.8013, countZoneWidthRatio: 0.4666, countZoneHeightRatio: 0.1148,
};

const PC_CATEGORY_PERCENT_FONT = "'NotoSerifJPDigits900', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif";
const PC_CATEGORY_COUNT_FONT = "'NotoSerifJPCategoryCount700', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif";
// 参考画像実測（fish.png「魚」グリフの最も濃い部分をサンプリング）。カテゴリ別に変えず6種共通で使う
const PC_CATEGORY_TEXT_COLOR = "#011039";
// ％記号は数字本体よりひと回り小さい（参考画像実測比）
const PC_CATEGORY_PERCENT_SYMBOL_RATIO = 0.56;
// 空欄領域の高さに対する基準フォントサイズ比（4桁の達成数でも幅方向に収まるよう、
// 高さ基準で決めた上で幅超過時のみ自動縮小する）
const PC_CATEGORY_PERCENT_BASE_RATIO = 0.66;
// 達成数の基準フォントサイズ（横型カード実高さ=173px基準でのpx値）。他レイアウトでは
// 実際のdrawH（PNGをセルへcontainした後の描画高さ）との比率でlayoutScaleをかけ拡縮する
const PC_CATEGORY_BASE_CARD_H = 173;
// 参考画像の代表値"156 / 200"が幅方向で縮小トリガーに触れないよう二分探索で校正
// （86.5px幅に対し21pxで約7pxの安全マージン。3桁同士の典型値は基本サイズのまま描画される）
const PC_CATEGORY_COUNT_BASE_FONT_SIZE = 21;

let pcCategoryMeasureCanvas = null;
// オフスクリーンにdrawFnを実行し、alpha>128の実インクbboxを返す（textAlign/textBaselineに
// 依存せず、実際に描画されたピクセルだけを見るため参考画像とのフォント差異があっても正確）
function pcMeasureInkBBox(drawFn, width, height) {
  const c = pcCategoryMeasureCanvas || (pcCategoryMeasureCanvas = document.createElement("canvas"));
  width = Math.max(1, Math.ceil(width));
  height = Math.max(1, Math.ceil(height));
  c.width = width; c.height = height;
  const mctx = c.getContext("2d");
  mctx.clearRect(0, 0, width, height);
  drawFn(mctx);
  const data = mctx.getImageData(0, 0, width, height).data;
  let top = null, bottom = null, left = null, right = null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 128) {
        if (top === null || y < top) top = y;
        if (bottom === null || y > bottom) bottom = y;
        if (left === null || x < left) left = x;
        if (right === null || x > right) right = x;
      }
    }
  }
  if (top === null) return null;
  return { top, bottom, left, right, centerX: (left + right) / 2, centerY: (top + bottom) / 2 };
}

// カテゴリ％（例:"78%"、数字900・%記号は数字の56%サイズ、同一ベースライン）を、
// 実インクbboxの中心が(zoneCenterX,zoneCenterY)に一致するよう描画する
function pcDrawCategoryPercent(ctx, x0, y0, drawW, drawH, pct) {
  const L = PC_CATEGORY_IMG_LAYOUT;
  const zoneCenterX = x0 + drawW * L.pctCenterX;
  const zoneCenterY = y0 + drawH * L.pctCenterY;
  const zoneMaxWidth = drawW * L.pctZoneWidthRatio;
  const zoneMaxHeight = drawH * L.pctZoneHeightRatio;

  const numText = String(pct);
  const symText = "%";
  let fontSize = zoneMaxHeight * PC_CATEGORY_PERCENT_BASE_RATIO;
  let symFontSize = fontSize * PC_CATEGORY_PERCENT_SYMBOL_RATIO;
  const gap = fontSize * 0.03;

  ctx.font = `900 ${fontSize}px ${PC_CATEGORY_PERCENT_FONT}`;
  let numW = ctx.measureText(numText).width;
  ctx.font = `900 ${symFontSize}px ${PC_CATEGORY_PERCENT_FONT}`;
  let symW = ctx.measureText(symText).width;
  let totalW = numW + gap + symW;
  let shrunk = false;
  if (totalW > zoneMaxWidth) {
    shrunk = true;
    const scale = zoneMaxWidth / totalW;
    fontSize *= scale; symFontSize *= scale;
    ctx.font = `900 ${fontSize}px ${PC_CATEGORY_PERCENT_FONT}`;
    numW = ctx.measureText(numText).width;
    ctx.font = `900 ${symFontSize}px ${PC_CATEGORY_PERCENT_FONT}`;
    symW = ctx.measureText(symText).width;
    totalW = numW + gap + symW;
  }

  const measureW = totalW + fontSize;
  const measureH = fontSize * 1.7;
  const padX = fontSize * 0.5;
  const baselineY = measureH * 0.75;
  const bbox = pcMeasureInkBBox((mctx) => {
    mctx.textAlign = "left"; mctx.textBaseline = "alphabetic"; mctx.fillStyle = "#000";
    mctx.font = `900 ${fontSize}px ${PC_CATEGORY_PERCENT_FONT}`;
    mctx.fillText(numText, padX, baselineY);
    mctx.font = `900 ${symFontSize}px ${PC_CATEGORY_PERCENT_FONT}`;
    mctx.fillText(symText, padX + numW + gap, baselineY);
  }, measureW, measureH);

  const debug = { text: `${numText}%`, fontSize, symFontSize, numW, symW, totalW, zoneMaxWidth, zoneMaxHeight, shrunk, zoneCenterX, zoneCenterY };
  if (!bbox) { window.__pcCategoryPercentDebug = debug; return; }

  const originX = zoneCenterX - (bbox.centerX - padX);
  const originYBaseline = zoneCenterY - (bbox.centerY - baselineY);

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PC_CATEGORY_TEXT_COLOR;
  ctx.font = `900 ${fontSize}px ${PC_CATEGORY_PERCENT_FONT}`;
  ctx.fillText(numText, originX, originYBaseline);
  ctx.font = `900 ${symFontSize}px ${PC_CATEGORY_PERCENT_FONT}`;
  ctx.fillText(symText, originX + numW + gap, originYBaseline);
  ctx.restore();

  debug.bboxTop = originYBaseline + bbox.top - baselineY;
  debug.bboxBottom = originYBaseline + bbox.bottom - baselineY;
  debug.bboxLeft = originX + bbox.left - padX;
  debug.bboxRight = originX + bbox.right - padX;
  debug.inkCenterX = (debug.bboxLeft + debug.bboxRight) / 2;
  debug.inkCenterY = (debug.bboxTop + debug.bboxBottom) / 2;
  window.__pcCategoryPercentDebug = debug;
}

// カテゴリ達成数（例:"156 / 200"、Noto Serif JP 700、スラッシュ前後に半角スペース、
// 1〜4桁対応・省略記号なし）を、実インクbboxの中心が(zoneCenterX,zoneCenterY)に一致するよう描画する
function pcDrawCategoryCount(ctx, x0, y0, drawW, drawH, layoutScale, done, total) {
  const L = PC_CATEGORY_IMG_LAYOUT;
  const zoneCenterX = x0 + drawW * L.countCenterX;
  const zoneCenterY = y0 + drawH * L.countCenterY;
  const zoneMaxWidth = drawW * L.countZoneWidthRatio;

  const text = `${done} / ${total}`;
  let fontSize = PC_CATEGORY_COUNT_BASE_FONT_SIZE * layoutScale;
  ctx.font = `700 ${fontSize}px ${PC_CATEGORY_COUNT_FONT}`;
  let textW = ctx.measureText(text).width;
  let shrunk = false;
  if (textW > zoneMaxWidth) {
    shrunk = true;
    fontSize *= zoneMaxWidth / textW;
    ctx.font = `700 ${fontSize}px ${PC_CATEGORY_COUNT_FONT}`;
    textW = ctx.measureText(text).width;
  }

  const measureW = textW + fontSize;
  const measureH = fontSize * 1.7;
  const padX = fontSize * 0.5;
  const baselineY = measureH * 0.7;
  const bbox = pcMeasureInkBBox((mctx) => {
    mctx.textAlign = "left"; mctx.textBaseline = "alphabetic"; mctx.fillStyle = "#000";
    mctx.font = `700 ${fontSize}px ${PC_CATEGORY_COUNT_FONT}`;
    mctx.fillText(text, padX, baselineY);
  }, measureW, measureH);

  const debug = { text, fontSize, textW, zoneMaxWidth, shrunk, zoneCenterX, zoneCenterY };
  if (!bbox) { window.__pcCategoryCountDebug = debug; return; }

  const originX = zoneCenterX - (bbox.centerX - padX);
  const originYBaseline = zoneCenterY - (bbox.centerY - baselineY);

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PC_CATEGORY_TEXT_COLOR;
  ctx.font = `700 ${fontSize}px ${PC_CATEGORY_COUNT_FONT}`;
  ctx.fillText(text, originX, originYBaseline);
  ctx.restore();

  debug.bboxTop = originYBaseline + bbox.top - baselineY;
  debug.bboxBottom = originYBaseline + bbox.bottom - baselineY;
  debug.bboxLeft = originX + bbox.left - padX;
  debug.bboxRight = originX + bbox.right - padX;
  debug.inkCenterX = (debug.bboxLeft + debug.bboxRight) / 2;
  debug.inkCenterY = (debug.bboxTop + debug.bboxBottom) / 2;
  window.__pcCategoryCountDebug = debug;
}

// カテゴリPNG（1200×1020）は外周に大きな透明余白を持つ（実測: 可視部はおよそ
// 1093-1099×800-810px、左右余白約50-67px・上下余白約95-120px）。この余白込みで
// contain描画すると、セル枠に対して見た目のカードが実際より小さくなってしまう。
// そのため各画像を一度だけオフスクリーンでalpha>10走査し、可視部のbbox（sx,sy,sw,sh）を
// キャッシュしておき、drawImageの9引数形でそのbboxだけをsourceRectとして描画する
const pcCategoryImageBBoxCache = new WeakMap();
function pcGetCategoryImageBBox(img) {
  if (pcCategoryImageBBoxCache.has(img)) return pcCategoryImageBBoxCache.get(img);
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const cctx = c.getContext("2d");
  cctx.drawImage(img, 0, 0);
  const data = cctx.getImageData(0, 0, w, h).data;
  let top = null, bottom = null, left = null, right = null;
  for (let y = 0; y < h; y++) {
    const rowBase = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (data[rowBase + x * 4 + 3] > 10) {
        if (top === null) top = y;
        bottom = y;
        if (left === null || x < left) left = x;
        if (right === null || x > right) right = x;
      }
    }
  }
  const bbox = top === null
    ? { sx: 0, sy: 0, sw: w, sh: h }
    : { sx: left, sy: top, sw: right - left + 1, sh: bottom - top + 1 };
  pcCategoryImageBBoxCache.set(img, bbox);
  return bbox;
}

// カテゴリカードPNGの可視部（透明余白を除いたbbox）を、セル枠(w×h)へ元の縦横比を
// 維持したまま収まる最大サイズで中央配置し、パーセント・達成数／総数だけをCanvasで
// 重ねて描画する（非等方スケール禁止）。カテゴリ名・アイコン・金枠・装飾模様は
// PNGに焼き込み済みのため一切再描画しない
function drawCategoryCardImg(ctx, x, y, w, h, img, theme, stat, pct) {
  const bbox = pcGetCategoryImageBBox(img);
  const scale = Math.min(w / bbox.sw, h / bbox.sh);
  const drawW = bbox.sw * scale;
  const drawH = bbox.sh * scale;
  const imgX = x + (w - drawW) / 2;
  const imgY = y + (h - drawH) / 2;
  ctx.drawImage(img, bbox.sx, bbox.sy, bbox.sw, bbox.sh, imgX, imgY, drawW, drawH);

  const layoutScale = drawH / PC_CATEGORY_BASE_CARD_H;
  pcDrawCategoryPercent(ctx, imgX, imgY, drawW, drawH, pct);
  pcDrawCategoryCount(ctx, imgX, imgY, drawW, drawH, layoutScale, stat.done, stat.total);
}

function drawCategoryCard(ctx, x, y, w, h, def, theme, stat, dense, categoryImg) {
  const pct = stat.total > 0 ? Math.floor((stat.done / stat.total) * 100) : 0;

  const hasImg = categoryImg && categoryImg.complete && categoryImg.naturalWidth > 0;
  if (hasImg) {
    drawCategoryCardImg(ctx, x, y, w, h, categoryImg, theme, stat, pct);
    return;
  }

  // ---- フォールバック：カテゴリカードPNGの読み込みに失敗した場合のみ、
  //      以前のCanvas手描きカードを使用する ----
  ctx.save();
  ctx.shadowColor = "rgba(120,100,60,0.14)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = dense ? theme.panel : pcBoostPanelOpacity(theme.panel, 0.96);
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
  // カテゴリ名：15→17px（約1.1倍）
  ctx.font = `700 17px ${SERIF_FONT}`;
  ctx.fillText(def.label, x + 62, y + 28);

  ctx.textAlign = "right";
  ctx.fillStyle = theme.vermillion;
  ctx.font = `700 26px ${SERIF_FONT}`;
  ctx.fillText(`${pct}%`, x + w - 16, y + 36);

  ctx.textAlign = "left";
  ctx.fillStyle = theme.inkSub;
  // 達成数/総数：11→13px（約1.2倍）
  ctx.font = `700 13px ${SANS_FONT}`;
  ctx.fillText(`${stat.done} / ${stat.total}`, x + 62, y + 49);

  pcDrawProgressBar(ctx, x + 16, y + h - 26, w - 32, 7, pct, theme, color.main);
}

// ============================================================
// フッター（作成日・ロゴ・非公式表記）
// ============================================================
// ロゴPNG本体は一切変更せず、alphaマスクから外側輪郭を生成して描画する。
// shadowBlurだけの表現（ぼやけて暗部では消えがちなグロー）ではなく、円状に複数方向へ
// 同じ縁取りシルエットをオフセット描画することで、表示解像度で常に一定の太さ(約2.5px)の
// 縁取りを作る。4テーマ共通・色変換やtintは行わない
let pcLogoOutlineCanvas = null;
function pcDrawLogoWithOutline(ctx, img, x, y, w, h) {
  const OUTLINE_COLOR = "#F6EBC8"; // 生成り金
  const OUTLINE_WIDTH = 2.6; // 表示解像度でのpx（指定範囲2〜3pxの中央値）
  const OUTLINE_STEPS = 16; // 円周方向のオフセット描画数（多いほど輪郭が滑らかになる）

  const cw = Math.max(1, Math.ceil(w));
  const ch = Math.max(1, Math.ceil(h));
  const oc = pcLogoOutlineCanvas || (pcLogoOutlineCanvas = document.createElement("canvas"));
  oc.width = cw; oc.height = ch;
  const octx = oc.getContext("2d");
  octx.clearRect(0, 0, cw, ch);
  octx.drawImage(img, 0, 0, cw, ch);
  // source-inで不透明画素だけを縁取り色へ置き換えたシルエットを作る（形状はalphaマスクそのもの）
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = OUTLINE_COLOR;
  octx.fillRect(0, 0, cw, ch);
  octx.globalCompositeOperation = "source-over";

  ctx.save();
  // 縁取りのさらに外側だけに、ごく弱い濃紺〜金茶の影を添える（縁取り自体はshadowBlurに依存しない）
  ctx.shadowColor = "rgba(28, 20, 12, 0.4)";
  ctx.shadowBlur = OUTLINE_WIDTH * 1.8;
  for (let i = 0; i < OUTLINE_STEPS; i++) {
    const angle = (i / OUTLINE_STEPS) * Math.PI * 2;
    const ox = Math.cos(angle) * OUTLINE_WIDTH;
    const oy = Math.sin(angle) * OUTLINE_WIDTH;
    ctx.drawImage(oc, x + ox, y + oy, w, h);
  }
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  // 最後に元のロゴ本体（無加工）を中央へ重ねる
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

// ブランドロゴ：正式素材（透過PNG、紺×金、白ピル背景なし、4テーマ共通・色変換なし）を
// logo.width基準でアスペクト比維持のまま(logo.x,logo.y)を中心に描画する。
// 画像未読み込み時のみ、従来のCanvas手描き（白ピル＋Shippori Mincho＋汎用bird icon）へフォールバックする
function drawBranding(ctx, layout, state, theme, brandLogoImg) {
  const logo = layout.brandLogo;
  const dateCfg = layout.date;
  const discCfg = layout.disclaimer;

  const hasLogoImg = brandLogoImg && brandLogoImg.complete && brandLogoImg.naturalWidth > 0;
  if (hasLogoImg) {
    const aspect = brandLogoImg.naturalHeight / brandLogoImg.naturalWidth;
    const w = logo.width;
    const h = w * aspect;
    pcDrawLogoWithOutline(ctx, brandLogoImg, logo.x - w / 2, logo.y - h / 2, w, h);
  } else {
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
  }

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
// images: { bgImg, avatarImg, mascotImg, categoryImages, brandLogoImg }
// categoryImages: { fish, bug, bird, shell, food, garden } -> HTMLImageElement|null（4テーマ共通）
// stats: computeProfileCardStats()の戻り値
function renderProfileCard(ctx, state, images, stats) {
  const layout = PROFILE_CARD_LAYOUTS[state.layout] || PROFILE_CARD_LAYOUTS.landscape;
  const theme = PROFILE_CARD_THEMES[state.theme] || PROFILE_CARD_THEMES["navy-gold"];

  ctx.clearRect(0, 0, layout.width, layout.height);
  drawBackground(ctx, layout, images.bgImg);
  const pp = images.profileParts;

  // プロフィール情報（アバター〜ひとことメッセージ）の土台となる背景パネル。
  // 提供済みのpanel.pngを9-sliceで敷く。画像が無い場合は代替パネルを描かず、
  // 従来どおりカード背景へ直接プロフィール情報を重ねる
  const panelCfg = theme.profileParts && theme.profileParts.panel;
  const panelImg = pp && pp.panel;
  const hasPanel = panelImg && panelImg.complete && panelImg.naturalWidth > 0 && panelCfg && layout.profilePanel;
  if (hasPanel) {
    const pnl = layout.profilePanel;
    pcDraw9SlicePanel(ctx, pnl.x, pnl.y, pnl.w, pnl.h, panelImg, panelCfg.cap);
  }

  drawAvatar(ctx, layout.avatar.cx, layout.avatar.cy, layout.avatar.r, images.avatarImg, state.avatar, theme, images.mascotImg,
    pp && pp.avatarFrame, theme.profileParts && theme.profileParts.avatarFrame);

  const categoryDefs = (state.categoryIds || []).map(profileCardCategoryDef).filter(Boolean).slice(0, 8);
  const scopeIds = state.totalScope === "displayed" ? state.categoryIds : PROFILE_CARD_CATEGORIES.map(c => c.id);
  const overallStat = sumProfileCardStats(stats, scopeIds);

  // メダルの装飾（リボン・花あしらい）はリング半径より外側にもはみ出すため、
  // プロフィール文字情報より先に描画し、文字を常に最前面に保って可読性を確保する
  drawOverallProgress(ctx, layout, theme, overallStat, images.medalFrameImg);
  drawCategoryProgress(ctx, layout, theme, categoryDefs, stats, state.layout !== "portrait", images.categoryImages);

  const partsBundle = (pp && theme.profileParts) ? { images: pp, cfg: theme.profileParts } : null;
  if (state.layout === "portrait") {
    drawProfileInfoPortrait(ctx, layout, state, theme, partsBundle);
  } else {
    const infoEndY = drawProfileInfo(ctx, layout, state, theme, partsBundle);
    drawSocialInfo(ctx, layout, state, theme, infoEndY);
  }

  drawBranding(ctx, layout, state, theme, images.brandLogoImg);
}
