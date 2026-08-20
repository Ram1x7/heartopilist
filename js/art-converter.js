// js/art-converter.js
// 「画像から作る」ページ（art-convert.html）: 画像→ドット絵変換
// 画面の流れ: ①画像を選ぶ → ②キャンバスサイズ → ③位置とサイズを調整 → ④変換方式 →
// ⑤ノイズ除去 → ⑥色数 → ⑦詳細設定（Crop/Fit/Fill・明るさ・コントラスト・輪郭強調・
// 背景処理）。キャンバスサイズ（目標の縦横比）を切り抜き位置の調整より先に決めることで、
// 後からサイズを変えて切り抜きをやり直す手戻りを減らしている。
// 使用する色は、js/art-config.jsのGAME_PALETTE（ゲーム内で実際に選べる色に完全一致させた
// 固定パレット、約125色）のみに制限する（最近傍色マッチング）。
// すべてブラウザ内で完結し、画像を外部に送信しない。

const COLOR_COUNTS = [4, 8, 12, 16, 24, 32];
const EDGE_LEVELS = [
  { id: "off", labelKey: "art_edge_off", labelFallback: "OFF" },
  { id: "weak", labelKey: "art_edge_weak", labelFallback: "弱" },
  { id: "mid", labelKey: "art_edge_mid", labelFallback: "中" },
  { id: "strong", labelKey: "art_edge_strong", labelFallback: "強" },
];
const BG_MODES = [
  { id: "keep", labelKey: "art_bg_keep", labelFallback: "背景を残す" },
  { id: "white", labelKey: "art_bg_white", labelFallback: "白を透明化" },
  { id: "auto", labelKey: "art_bg_auto", labelFallback: "自動背景削除" },
];
const FIT_MODES = [
  { id: "crop", labelKey: "art_fit_crop", labelFallback: "Crop" },
  { id: "fit", labelKey: "art_fit_fit", labelFallback: "Fit" },
  { id: "fill", labelKey: "art_fit_fill", labelFallback: "Fill" },
];
const FIT_BG_MODES = [
  { id: "transparent", labelKey: "art_fit_bg_transparent", labelFallback: "透明" },
  { id: "custom", labelKey: "art_fit_bg_custom", labelFallback: "色を指定" },
];
// 変換方式プリセット。それぞれディザリング・輪郭強調の初期値を切り替える早見表で、
// 選択後も個別のスライダー・ボタンで微調整できる（手動で変えるとpresetはnullになる）
const CONVERT_PRESETS = [
  { id: "standard", labelKey: "art_preset_standard", labelFallback: "標準（写真向け）", overrides: { dither: false, edge: "off" } },
  { id: "smooth", labelKey: "art_preset_smooth", labelFallback: "なめらか（イラスト向け）", overrides: { dither: true, edge: "off" } },
  { id: "crisp", labelKey: "art_preset_crisp", labelFallback: "くっきり（高コントラスト向け）", overrides: { dither: false, edge: "mid" } },
];

let sourceImage = null;
// 位置・拡大縮小の調整ステップ（アップロード直後、変換前に切り抜き範囲を目で見て決める）
let cropZoom = 1; // 1 = ビューポートにちょうど収まる（cover）大きさ
let cropLeft = 0; // ビューポート内での画像左端の位置（CSS px）
let cropTop = 0;
let cropCoverScale = 1; // 等倍(cropZoom=1)の時の「元画像px→表示px」の倍率
let cropTargetKey = null; // 調整済みのキャンバスサイズ（幅x高さ）。変わったら自動でリセットする
let manualCropRect = null; // 確定した切り抜き範囲（元画像のpx座標）。null = 中央基準の自動クロップ
let cropDragState = null;
let selectedRatioId = "1-1"; // 「自由サイズ」で選択中の比率
let selectedFrameId = null; // 選択中のデザイン枠アイテム
let selectedFramePartId = null; // 選択中のデザイン枠アイテムのパーツ（複数パーツを持つ場合）
let settings = {
  width: 30,
  height: 30,
  fitMode: "fill",
  fitBgMode: "transparent",
  fitBgColor: "#ffffff",
  preset: "standard",
  colors: 16,
  dither: false,
  edge: "off",
  brightness: 0,
  contrast: 0,
  noiseReduction: 0,
  background: "keep",
};
let resultPixels = null;
let convertTimer = null;

// ── UI初期化 ──
function initArtConverter(){
  renderConvertSizeOptions();

  renderOptionGroup("artConvertColorOptions", COLOR_COUNTS.map(c => ({ id: c, label: `${c}` })), settings.colors, (v) => {
    settings.colors = Number(v);
    scheduleConvert();
  });
  renderConvertOptionLabels();
  updateFitBgRowVisibility();

  document.getElementById("artConvertFitBgColor").addEventListener("input", (e) => {
    settings.fitBgColor = e.target.value;
    scheduleConvert();
  });

  document.getElementById("artDitherToggle").addEventListener("change", (e) => {
    settings.dither = e.target.checked;
    settings.preset = null;
    scheduleConvert();
  });
  document.getElementById("artBrightnessRange").addEventListener("input", (e) => {
    settings.brightness = Number(e.target.value);
    scheduleConvert();
  });
  document.getElementById("artContrastRange").addEventListener("input", (e) => {
    settings.contrast = Number(e.target.value);
    scheduleConvert();
  });
  document.getElementById("artNoiseRange").addEventListener("input", (e) => {
    settings.noiseReduction = Number(e.target.value);
    scheduleConvert();
  });

  const fileInput = document.getElementById("artFileInput");
  document.getElementById("artUploadBtn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    if(e.target.files && e.target.files[0]) handleFileSelect(e.target.files[0]);
  });

  document.getElementById("artUseInEditorBtn").addEventListener("click", useResultInEditor);
  document.getElementById("artAdjustCropBtn").addEventListener("click", () => openCropStage(false));
  document.getElementById("artChangeSizeBtn").addEventListener("click", showSizeStage);
  document.getElementById("artSizeConfirmBtn").addEventListener("click", confirmSizeStage);

  bindConvertTutorialControls();
  maybeStartConvertTutorialPhase("upload");
}

// キャンバスサイズ選択（自由サイズ：比率→サイズレベルの2段階／デザイン枠：カテゴリ→アイテム→パーツ）
function currentLang(){
  return window.i18n && typeof window.i18n.getCurrentLang === "function" ? window.i18n.getCurrentLang() : "ja";
}

// 「比率」欄には自由サイズの比率とデザイン枠アイテムを同じ選択肢として並べているため、
// 両者は排他的に選ぶ（比率を選んだらデザイン枠の選択は解除、逆も同様）
function selectConvertRatio(v){
  selectedRatioId = v;
  selectedFrameId = null;
  selectedFramePartId = null;
  renderConvertSizeOptions();
}

function renderConvertRatioOptions(){
  // デザイン枠アイテムが選択中の間は、比率側のマークを表示しない（両方同時に選択済みに見えるのを防ぐ）
  const el = document.getElementById("artConvertRatioOptions");
  const currentId = selectedFrameId ? null : selectedRatioId;
  el.innerHTML = FREE_CANVAS_RATIOS.map(r => {
    const box = ratioShapeBox(r.id, 28);
    return `
    <button class="art-ratio-btn${r.id === currentId ? " active" : ""}" data-ratio="${r.id}">
      <span class="art-ratio-shape" style="width:${box.width}px;height:${box.height}px;"></span>
      <span class="art-ratio-label">${r.ratio}</span>
    </button>
  `;
  }).join("");
  el.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => selectConvertRatio(btn.dataset.ratio));
  });
}

function renderConvertSizeOptions(){
  renderConvertRatioOptions();
  renderConvertLevelOptions();
  renderConvertFrameOptions();
}

function renderConvertLevelOptions(){
  const ratio = FREE_CANVAS_RATIOS.find(r => r.id === selectedRatioId);
  const currentLevelId = !selectedFrameId ? `${settings.width}x${settings.height}` : null;
  renderOptionGroup(
    "artConvertLevelOptions",
    ratio.levels.map(lv => ({ id: `${lv.w}x${lv.h}`, label: `${lv.w} × ${lv.h}` })),
    currentLevelId,
    (v) => {
      const [w, h] = v.split("x").map(Number);
      settings.width = w;
      settings.height = h;
      manualCropRect = null; // サイズが変わったら調整済みの切り抜き範囲を無効化する
      selectedFrameId = null;
      selectedFramePartId = null;
      renderConvertRatioOptions(); // 比率側のマークを再表示する
      renderConvertFrameOptions();
      scheduleConvert();
    }
  );
}

function renderConvertFrameOptions(){
  const lang = currentLang();
  renderOptionGroup(
    "artConvertFrameItemOptions",
    DESIGN_FRAME_PRESETS.map(f => ({ id: f.id, label: frameName(f, lang), icon: f.icon })),
    selectedFrameId,
    (v) => selectFrameItem(v)
  );
}

// キャンバス編集画面（js/art-editor.jsのrenderFramePartOptions）と同じ見た目・データにする。
// 実物の写真ではなく、そのパーツの輪郭線（背景無地）をアイコン代わりに表示する
function renderConvertFramePartOptions(){
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === selectedFrameId);
  if(!frame) return;
  const lang = currentLang();
  const el = document.getElementById("artConvertFramePartOptions");
  el.innerHTML = frame.parts.map(p => `
    <button class="art-frame-btn${p.id === selectedFramePartId ? " active" : ""}" data-value="${p.id}">
      ${partOutlineThumbSvg(frame.id, p.id, 29)}
      <span>${frameName(p, lang)}</span>
    </button>
  `).join("");
  el.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      el.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectFramePart(btn.dataset.value);
    });
  });
}

// デザイン枠のパーツ選択は、元サイトと同様に「戻る」付きの別画面へ切り替える方式
function showConvertFrameStep1(){
  document.getElementById("artConvertSizeStep1").style.display = "block";
  document.getElementById("artConvertSizeStep2").style.display = "none";
}

function showConvertFrameStep2(){
  document.getElementById("artConvertSizeStep1").style.display = "none";
  document.getElementById("artConvertSizeStep2").style.display = "block";
}

function selectFrameItem(frameId){
  selectedFrameId = frameId;
  renderConvertRatioOptions(); // 比率側のマークを消す
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === frameId);
  selectFramePart(frame.parts[0].id);
  if(frame.parts.length > 1){
    renderConvertFramePartOptions();
    showConvertFrameStep2();
  }
}

function selectFramePart(partId){
  selectedFramePartId = partId;
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === selectedFrameId);
  const part = frame.parts.find(p => p.id === partId);
  settings.width = part.width;
  settings.height = part.height;
  manualCropRect = null; // サイズが変わったら調整済みの切り抜き範囲を無効化する
  renderConvertLevelOptions();
  scheduleConvert();
}

// T()に依存するラベルのみ再描画（言語切替時にも呼び直す）
function renderConvertOptionLabels(){
  renderOptionGroup("artConvertFitOptions", FIT_MODES.map(f => ({ id: f.id, label: T(f.labelKey, f.labelFallback) })), settings.fitMode, (v) => {
    settings.fitMode = v;
    updateFitBgRowVisibility();
    scheduleConvert();
  });
  renderOptionGroup("artConvertFitBgOptions", FIT_BG_MODES.map(b => ({ id: b.id, label: T(b.labelKey, b.labelFallback) })), settings.fitBgMode, (v) => {
    settings.fitBgMode = v;
    updateFitBgRowVisibility();
    scheduleConvert();
  });
  renderOptionGroup("artConvertEdgeOptions", EDGE_LEVELS.map(e => ({ id: e.id, label: T(e.labelKey, e.labelFallback) })), settings.edge, (v) => {
    settings.edge = v;
    settings.preset = null;
    scheduleConvert();
  });
  renderOptionGroup("artConvertBgOptions", BG_MODES.map(b => ({ id: b.id, label: T(b.labelKey, b.labelFallback) })), settings.background, (v) => {
    settings.background = v;
    scheduleConvert();
  });
}

// Fitモード選択時のみ余白色の設定行を表示し、「色を指定」選択時のみカラーピッカーを表示
function updateFitBgRowVisibility(){
  document.getElementById("artConvertFitBgRow").style.display = settings.fitMode === "fit" ? "block" : "none";
  document.getElementById("artConvertFitBgColorWrap").style.display = settings.fitBgMode === "custom" ? "flex" : "none";
}

// o.iconが指定されている場合（デザイン枠アイテムなど）は、アイコン画像をラベルの上に表示する
function renderOptionGroup(containerId, options, currentValue, onSelect){
  const el = document.getElementById(containerId);
  el.innerHTML = options.map(o => `
    <button class="${String(o.id) === String(currentValue) ? "active" : ""}${o.icon ? " art-frame-btn" : ""}" data-value="${o.id}">
      ${o.icon ? `<img class="art-frame-icon" src="${o.icon}" alt="" width="29" height="29">` : ""}
      <span>${o.label}</span>
    </button>
  `).join("");
  el.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      el.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onSelect(btn.dataset.value);
    });
  });
}

// ── ファイル読み込み ──
function handleFileSelect(file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)){
    alert(T("art_invalid_image", "対応していないファイル形式です（JPG・PNG・WebPのみ）"));
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      manualCropRect = null;
      cropTargetKey = null;
      document.getElementById("artOriginalImg").src = e.target.result;
      showSizeStage();
    };
    img.onerror = () => alert(T("art_image_load_failed", "画像の読み込みに失敗しました"));
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── キャンバスサイズ選択ステップ（アップロード直後、または「サイズを変更する」
// 「キャンバスサイズを変更する」から再度開く） ──
function showSizeStage(){
  if(!sourceImage) return;
  document.getElementById("artCropStage").style.display = "none";
  document.getElementById("artConvertPreview").style.display = "none";
  document.getElementById("artConvertPanel").style.display = "none";
  document.getElementById("artConvertSizeStage").style.display = "block";
  maybeStartConvertTutorialPhase("size");
}

// サイズ確定 → 位置調整ステップへ。openCropStage内でキャンバスサイズが前回から
// 変わっていれば自動でリセットされ、変わっていなければ調整済みの位置を引き継ぐ
function confirmSizeStage(){
  document.getElementById("artConvertSizeStage").style.display = "none";
  openCropStage(false);
}

// ── 位置・拡大縮小の調整ステップ（サイズ確定後、または「位置を調整する」から再度開く） ──
// reset=trueの場合、または前回調整した時とキャンバスサイズ(比率)が変わっている場合は、
// 中央基準のcover（画面いっぱいに収める最小倍率）にリセットする
function openCropStage(reset){
  if(!sourceImage) return;
  document.getElementById("artConvertSizeStage").style.display = "none";
  document.getElementById("artConvertPreview").style.display = "none";
  document.getElementById("artConvertPanel").style.display = "none";
  document.getElementById("artCropStage").style.display = "block";

  const targetKey = `${settings.width}x${settings.height}`;
  const viewport = document.getElementById("artCropViewport");
  viewport.style.aspectRatio = `${settings.width} / ${settings.height}`;
  document.getElementById("artCropImg").src = sourceImage.src;

  requestAnimationFrame(() => {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    cropCoverScale = Math.max(vw / sourceImage.naturalWidth, vh / sourceImage.naturalHeight);
    if(reset || cropTargetKey !== targetKey){
      cropZoom = 1;
      cropLeft = (vw - sourceImage.naturalWidth * cropCoverScale) / 2;
      cropTop = (vh - sourceImage.naturalHeight * cropCoverScale) / 2;
      cropTargetKey = targetKey;
    }
    document.getElementById("artCropZoomSlider").value = Math.round(cropZoom * 100);
    applyCropTransform();
    renderCropMaskOverlay();
    bindCropInteractions();
    maybeStartConvertTutorialPhase("crop");
  });
}

// ── 輪郭線オーバーレイ（アイテム別プリセットのみ）。切り抜き位置を決める段階から、
// 画像のどの部分が襟ぐりや家具のどのパーツに対応するかを視覚的に把握できるよう、
// キャンバス編集画面（js/art-editor.jsのrebuildActiveMask）と同じmaskLinesデータを
// そのまま再利用する。線の位置はビューポート（＝確定する切り抜き範囲）に対して固定で、
// 画像側をドラッグ・ズームしても動かない（「窓枠」の役割のため、画像の位置調整とは独立） ──
function renderCropMaskOverlay(){
  const canvas = document.getElementById("artCropOverlay");
  const hint = document.getElementById("artCropMaskHint");
  const viewport = document.getElementById("artCropViewport");
  if(!canvas || !viewport) return;
  const ctx = canvas.getContext("2d");
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  canvas.width = vw;
  canvas.height = vh;
  ctx.clearRect(0, 0, vw, vh);

  const preset = selectedFrameId && typeof PRESET_MASKS !== "undefined" ? PRESET_MASKS[selectedFrameId] : null;
  const part = preset && selectedFramePartId ? preset[selectedFramePartId] : null;
  const maskLines = part ? part.maskLines : null;
  if(!maskLines || !maskLines.length){
    if(hint) hint.style.display = "none";
    return;
  }
  if(hint) hint.style.display = "";

  // 背景は任意の写真のため、キャンバス編集画面のようなテーマ別の黒/白ではなく、
  // どんな写真の上でも視認できるよう白線＋影の組み合わせで固定する
  const cellW = vw / settings.width;
  const cellH = vh / settings.height;
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = Math.max(1.5, Math.min(cellW, cellH) * 0.09);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 2.5;
  maskLines.forEach(path => {
    if(!path || path.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(path[0].x * cellW, path[0].y * cellH);
    for(let i = 1; i < path.length; i++){
      ctx.lineTo(path[i].x * cellW, path[i].y * cellH);
    }
    ctx.stroke();
  });
}

// 画像が常にビューポート全体を覆うようclampしつつ、実際の位置・大きさをimg要素に反映する
function applyCropTransform(){
  const viewport = document.getElementById("artCropViewport");
  const img = document.getElementById("artCropImg");
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  const scale = cropCoverScale * cropZoom;
  const dispW = sourceImage.naturalWidth * scale;
  const dispH = sourceImage.naturalHeight * scale;
  cropLeft = Math.min(0, Math.max(vw - dispW, cropLeft));
  cropTop = Math.min(0, Math.max(vh - dispH, cropTop));
  img.style.width = dispW + "px";
  img.style.height = dispH + "px";
  img.style.left = cropLeft + "px";
  img.style.top = cropTop + "px";
}

// ドラッグ（パン）・スライダー（ズーム）・リセット・確定ボタンの結線（初回のみ）
function bindCropInteractions(){
  const viewport = document.getElementById("artCropViewport");
  if(viewport.dataset.bound) return;
  viewport.dataset.bound = "1";

  viewport.addEventListener("pointerdown", (e) => {
    viewport.setPointerCapture(e.pointerId);
    cropDragState = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startLeft: cropLeft, startTop: cropTop };
  });
  viewport.addEventListener("pointermove", (e) => {
    if(!cropDragState || e.pointerId !== cropDragState.pointerId) return;
    cropLeft = cropDragState.startLeft + (e.clientX - cropDragState.startX);
    cropTop = cropDragState.startTop + (e.clientY - cropDragState.startY);
    applyCropTransform();
  });
  const endDrag = (e) => {
    if(cropDragState && e.pointerId === cropDragState.pointerId) cropDragState = null;
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  document.getElementById("artCropZoomSlider").addEventListener("input", (e) => {
    // ズーム中もビューポート中央が指す画像上の位置を変えない（中心を軸に拡大縮小する）
    const newZoom = Number(e.target.value) / 100;
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const oldScale = cropCoverScale * cropZoom;
    const newScale = cropCoverScale * newZoom;
    const cx = vw / 2, cy = vh / 2;
    const ix = (cx - cropLeft) / oldScale;
    const iy = (cy - cropTop) / oldScale;
    cropZoom = newZoom;
    cropLeft = cx - ix * newScale;
    cropTop = cy - iy * newScale;
    applyCropTransform();
  });

  document.getElementById("artCropResetBtn").addEventListener("click", () => openCropStage(true));
  document.getElementById("artCropConfirmBtn").addEventListener("click", confirmCrop);
}

function confirmCrop(){
  const viewport = document.getElementById("artCropViewport");
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  const scale = cropCoverScale * cropZoom;
  manualCropRect = {
    sx: Math.max(0, -cropLeft / scale),
    sy: Math.max(0, -cropTop / scale),
    sw: Math.min(sourceImage.naturalWidth, vw / scale),
    sh: Math.min(sourceImage.naturalHeight, vh / scale),
  };
  document.getElementById("artCropStage").style.display = "none";
  document.getElementById("artConvertPreview").style.display = "block";
  document.getElementById("artConvertPanel").style.display = "block";
  convert();
  maybeStartConvertTutorialPhase("panel");
}

function scheduleConvert(){
  clearTimeout(convertTimer);
  convertTimer = setTimeout(convert, 150);
}

// ── 変換処理 ──
// 指定された設定値だけをもとにピクセル配列を計算する純粋関数（グローバル状態は変更しない）。
// 変換方式プレビューのサムネイル生成でも同じ処理を使い回すためのもの。
function computePixelsForSettings(s){
  if(!sourceImage) return null;
  const w = s.width, h = s.height;

  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");

  if(s.fitMode === "fit"){
    // 画像全体を表示（コンテイン）。余白は透明のまま、または指定色で塗りつぶす
    if(s.fitBgMode === "custom"){
      octx.fillStyle = s.fitBgColor;
      octx.fillRect(0, 0, w, h);
    }
    const scale = Math.min(w / sourceImage.naturalWidth, h / sourceImage.naturalHeight);
    const dw = sourceImage.naturalWidth * scale, dh = sourceImage.naturalHeight * scale;
    const dx = (w - dw) / 2, dy = (h - dh) / 2;
    octx.drawImage(sourceImage, 0, 0, sourceImage.naturalWidth, sourceImage.naturalHeight, dx, dy, dw, dh);
  }else{
    // crop / fill: 位置調整ステップで確定した範囲（manualCropRect）があればそれを使い、
    // なければキャンバス比率に合わせて中央基準でクロップする（cover）
    const rect = manualCropRect || coverCropRect(sourceImage.naturalWidth, sourceImage.naturalHeight, w, h);
    octx.drawImage(sourceImage, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, w, h);
  }

  const imgData = octx.getImageData(0, 0, w, h);
  applyBrightnessContrast(imgData, s.brightness, s.contrast);
  if(s.noiseReduction > 0) applyNoiseReduction(imgData, s.noiseReduction);
  if(s.edge !== "off") applyEdgeEnhance(imgData, s.edge);

  const bgMask = computeBackgroundMask(imgData, s.background);
  // Fitモードで生じる透明な余白は、背景設定に関わらず常に透明のまま扱う
  const d = imgData.data;
  for(let i = 0; i < bgMask.length; i++){
    if(d[i * 4 + 3] < 128) bgMask[i] = true;
  }

  const palette = buildPalette(imgData, s.colors, bgMask);
  return s.dither
    ? ditherToPalette(imgData, palette, bgMask)
    : mapToPalette(imgData, palette, bgMask);
}

function convert(){
  if(!sourceImage) return;
  resultPixels = computePixelsForSettings(settings);
  renderResultPreview();
  renderPresetPreviews();
}

// 変換方式プレビュー（標準／なめらか／くっきり）のサムネイルを描画
function renderPresetPreviews(){
  const el = document.getElementById("artConvertPresetOptions");
  if(!el || !sourceImage) return;
  el.innerHTML = CONVERT_PRESETS.map(p => `
    <button class="art-preset-preview-btn${settings.preset === p.id ? " active" : ""}" data-preset="${p.id}">
      <canvas class="art-preset-preview-canvas" id="artPresetPreview_${p.id}"></canvas>
      <span>${T(p.labelKey, p.labelFallback)}</span>
    </button>
  `).join("");
  CONVERT_PRESETS.forEach(p => {
    const pixels = computePixelsForSettings({ ...settings, ...p.overrides });
    drawPixelsToCanvas(document.getElementById(`artPresetPreview_${p.id}`), pixels, settings.width, settings.height, 64);
  });
  el.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = CONVERT_PRESETS.find(p => p.id === btn.dataset.preset);
      Object.assign(settings, preset.overrides);
      settings.preset = preset.id;
      document.getElementById("artDitherToggle").checked = settings.dither;
      renderConvertOptionLabels();
      convert();
    });
  });
}

function drawPixelsToCanvas(canvas, pixels, w, h, maxBox){
  if(!canvas) return;
  const cell = Math.max(1, Math.floor(maxBox / Math.max(w, h)));
  canvas.width = w * cell;
  canvas.height = h * cell;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const c = pixels[y * w + x];
      if(c){
        ctx.fillStyle = c;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
}

// 中央基準でキャンバス比率(targetW:targetH)に合わせてクロップする範囲を求める（cover fit）
function coverCropRect(srcW, srcH, targetW, targetH){
  const srcRatio = srcW / srcH;
  const targetRatio = targetW / targetH;
  let sw, sh;
  if(srcRatio > targetRatio){
    sh = srcH;
    sw = srcH * targetRatio;
  }else{
    sw = srcW;
    sh = srcW / targetRatio;
  }
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh };
}

function applyBrightnessContrast(imgData, brightness, contrast){
  const d = imgData.data;
  const c = contrast / 100 + 1;
  const cOffset = 128 * (1 - c);
  const b = (brightness / 100) * 128;
  for(let i = 0; i < d.length; i += 4){
    for(let ch = 0; ch < 3; ch++){
      let v = d[i + ch] * c + cOffset + b;
      d[i + ch] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
}

function applyEdgeEnhance(imgData, level){
  const amount = { weak: 0.3, mid: 0.6, strong: 1.0 }[level] || 0;
  if(amount <= 0) return;
  const w = imgData.width, h = imgData.height;
  const src = new Uint8ClampedArray(imgData.data);
  const d = imgData.data;
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      for(let ch = 0; ch < 3; ch++){
        let sum = 0, ki = 0;
        for(let ky = -1; ky <= 1; ky++){
          for(let kx = -1; kx <= 1; kx++){
            const sx = Math.min(w - 1, Math.max(0, x + kx));
            const sy = Math.min(h - 1, Math.max(0, y + ky));
            sum += src[(sy * w + sx) * 4 + ch] * kernel[ki++];
          }
        }
        const idx = (y * w + x) * 4 + ch;
        const sharpened = sum < 0 ? 0 : sum > 255 ? 255 : sum;
        d[idx] = src[idx] * (1 - amount) + sharpened * amount;
      }
    }
  }
}

// ノイズ除去（3×3メディアンフィルタをstrengthの割合だけ元画像とブレンド）
function applyNoiseReduction(imgData, strength){
  const amount = strength / 100;
  if(amount <= 0) return;
  const w = imgData.width, h = imgData.height;
  const src = new Uint8ClampedArray(imgData.data);
  const d = imgData.data;
  const win = new Array(9);
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      for(let ch = 0; ch < 3; ch++){
        let wi = 0;
        for(let ky = -1; ky <= 1; ky++){
          for(let kx = -1; kx <= 1; kx++){
            const sx = Math.min(w - 1, Math.max(0, x + kx));
            const sy = Math.min(h - 1, Math.max(0, y + ky));
            win[wi++] = src[(sy * w + sx) * 4 + ch];
          }
        }
        win.sort((a, b) => a - b);
        const idx = (y * w + x) * 4 + ch;
        d[idx] = src[idx] * (1 - amount) + win[4] * amount;
      }
    }
  }
}

function computeBackgroundMask(imgData, mode){
  const w = imgData.width, h = imgData.height;
  const d = imgData.data;
  const mask = new Array(w * h).fill(false);
  if(mode === "keep") return mask;

  if(mode === "white"){
    for(let i = 0; i < w * h; i++){
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      if(r > 235 && g > 235 && b > 235) mask[i] = true;
    }
    return mask;
  }

  // auto: 四隅から連結する近似色領域を背景とみなす簡易フラッドフィル
  const threshold = 40;
  const visited = new Array(w * h).fill(false);
  const getColor = (x, y) => {
    const i = (y * w + x) * 4;
    return [d[i], d[i + 1], d[i + 2]];
  };
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  const stack = [];
  corners.forEach(([cx, cy]) => stack.push([cx, cy, getColor(cx, cy)]));
  while(stack.length){
    const [x, y, refColor] = stack.pop();
    if(x < 0 || y < 0 || x >= w || y >= h) continue;
    const idx = y * w + x;
    if(visited[idx]) continue;
    const col = getColor(x, y);
    if(dist(col, refColor) > threshold) continue;
    visited[idx] = true;
    mask[idx] = true;
    stack.push([x + 1, y, refColor], [x - 1, y, refColor], [x, y + 1, refColor], [x, y - 1, refColor]);
  }
  return mask;
}

// ── パレット生成 ──
// ゲーム内で実際に選べる色（js/art-config.jsのGAME_PALETTE、約125色）のみを使う。
// まず各ピクセルを最も近い固定パレット色に丸め、その出現頻度が多い上位n色を
// 「この変換で使う色」として残し、残りのピクセルもその上位n色の中から最も近い色に丸め直す
// （＝「125色の中から何色まで絞り込むか」を n で調整する）。
function buildPalette(imgData, n, bgMask){
  const d = imgData.data;
  const counts = new Map();
  for(let i = 0; i < bgMask.length; i++){
    if(bgMask[i]) continue;
    const hex = nearestGamePaletteHex([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  if(counts.size === 0) return [hexToRgb(GAME_PALETTE_FLAT[0].hex)];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([hex]) => hexToRgb(hex));
}

function nearestPaletteIndex(rgb, palette){
  let best = 0, bestDist = Infinity;
  palette.forEach((p, i) => {
    const dist = (rgb[0] - p[0]) ** 2 + (rgb[1] - p[1]) ** 2 + (rgb[2] - p[2]) ** 2;
    if(dist < bestDist){ bestDist = dist; best = i; }
  });
  return best;
}

function rgbToHex(rgb){
  return ("#" + rgb.map(v => {
    const n = Math.max(0, Math.min(255, Math.round(v)));
    return n.toString(16).padStart(2, "0");
  }).join("")).toUpperCase();
}

function mapToPalette(imgData, palette, bgMask){
  const w = imgData.width, h = imgData.height, d = imgData.data;
  const out = new Array(w * h).fill(null);
  for(let i = 0; i < w * h; i++){
    if(bgMask[i]) continue;
    const rgb = [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
    out[i] = rgbToHex(palette[nearestPaletteIndex(rgb, palette)]);
  }
  return out;
}

function ditherToPalette(imgData, palette, bgMask){
  const w = imgData.width, h = imgData.height;
  const buf = [];
  for(let i = 0; i < w * h; i++){
    buf.push([imgData.data[i * 4], imgData.data[i * 4 + 1], imgData.data[i * 4 + 2]]);
  }
  const out = new Array(w * h).fill(null);
  const spread = (x, y, err, dx, dy, factor) => {
    const nx = x + dx, ny = y + dy;
    if(nx < 0 || ny < 0 || nx >= w || ny >= h) return;
    const ni = ny * w + nx;
    if(bgMask[ni]) return;
    buf[ni] = [
      buf[ni][0] + err[0] * factor,
      buf[ni][1] + err[1] * factor,
      buf[ni][2] + err[2] * factor,
    ];
  };
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const i = y * w + x;
      if(bgMask[i]) continue;
      const old = buf[i];
      const nearest = palette[nearestPaletteIndex(old, palette)];
      out[i] = rgbToHex(nearest);
      const err = [old[0] - nearest[0], old[1] - nearest[1], old[2] - nearest[2]];
      spread(x, y, err, 1, 0, 7 / 16);
      spread(x, y, err, -1, 1, 3 / 16);
      spread(x, y, err, 0, 1, 5 / 16);
      spread(x, y, err, 1, 1, 1 / 16);
    }
  }
  return out;
}

// ── 結果プレビュー ──
function renderResultPreview(){
  const canvas = document.getElementById("artResultCanvas");
  drawPixelsToCanvas(canvas, resultPixels, settings.width, settings.height, 320);
}

// ── エディターへ渡す ──
function useResultInEditor(){
  if(!resultPixels) return;
  const existing = localStorage.getItem("hatopiArt_currentDraft");
  if(existing){
    const proceed = confirm(T("art_overwrite_draft_confirm", "編集中の下書きがあります。変換結果で上書きしますか？"));
    if(!proceed) return;
  }
  localStorage.setItem("hatopiArt_currentDraft", JSON.stringify({
    width: settings.width,
    height: settings.height,
    pixelData: resultPixels,
    // デザイン枠（衣装など）のキャンバスで変換した場合、frameId/partIdをそのまま
    // 引き継がないとエディタ側で枠のマスク（輪郭線・使用不可マス）を判定できず、
    // 補助線が表示されなくなる
    frameId: selectedFrameId || null,
    partId: selectedFramePartId || null,
    // エディタ側で「制作開始時の作業モード選択ウィザード」を出すための目印。
    // エディタ側で読み込んだ直後に消費され、以後の下書きには残らない
    justCreated: true,
  }));
  location.href = "art-create.html";
}

// ── チュートリアル（アップロード→位置調整→設定パネルと、画面が段階的に切り替わる
// フローに合わせて、各段階が実際に表示されたタイミングで続きを案内する。
// 一度最後まで見る／スキップすると再表示しない（ヘルプモーダルの「もう一度見る」から
// はいつでも再生できる） ──
const CONVERT_TUTORIAL_DONE_KEY = "hatopiArt_convertTutorialDone";
const CONVERT_TUTORIAL_STEPS = [
  { phase: "upload", selector: "#artUploadBtn", title: "① 画像を選ぶ", text: "変換したい画像をアップロードします。JPG・PNG・WebPに対応しています。" },
  { phase: "size", selector: "#artConvertSizeStep1", title: "② キャンバスサイズ", text: "比率、またはゲーム内のデザイン枠（衣装・家具など）に合わせてサイズを選びます。先にサイズを決めておくと、次の位置調整をやり直さずに済みます。" },
  { phase: "crop", selector: "#artCropViewport", title: "③ 位置とサイズを調整", text: "ドラッグで位置を、下のスライダーで拡大縮小して、切り抜く範囲を決めます。決まったら「この位置で決定」で次に進みます。" },
  { phase: "panel", selector: "#artConvertPresetOptions", title: "④ 変換方式", text: "写真には「標準」、イラストには「なめらか」、線画やアイコンには「くっきり」がおすすめです。" },
  { phase: "panel", selector: "#artNoiseRange", title: "⑤ ノイズ除去", text: "写真のザラつきが気になる場合に調整します。色数を減らす前に整えるのがおすすめです。" },
  { phase: "panel", selector: "#artConvertColorOptions", title: "⑥ 色数", text: "少ないほどゲーム内で塗りやすくなります。まずは16色前後から試してみてください。" },
  { phase: "panel", selector: "#artAdvancedToggle", title: "⑦ 詳細設定", text: "配置方法・明るさ・コントラストなど、必須ではない細かい調整はここにまとめています。必要な時だけ開いてください。" },
  { phase: "panel", selector: "#artUseInEditorBtn", title: "⑧ エディターで編集する", text: "納得のいく結果になったら、このボタンでアートエディターに移動して、続きを手描きで仕上げられます。" },
];
let convertTutorialStep = 0;
let convertTutorialActive = false;

// phase（upload/crop/panel）の最初のステップから開始する。既にそのフェーズ以降まで
// 進んでいる場合は巻き戻さない（「位置を調整する」で後からcrop画面に戻った場合など）
function maybeStartConvertTutorialPhase(phase){
  if(localStorage.getItem(CONVERT_TUTORIAL_DONE_KEY) === "true") return;
  const firstIdx = CONVERT_TUTORIAL_STEPS.findIndex((s) => s.phase === phase);
  if(firstIdx === -1) return;
  if(convertTutorialActive && convertTutorialStep >= firstIdx) return;
  convertTutorialStep = firstIdx;
  convertTutorialActive = true;
  document.getElementById("artTutorialBackdrop").style.display = "block";
  document.getElementById("artTutorialHighlight").style.display = "block";
  document.getElementById("artTutorialPopup").style.display = "block";
  renderConvertTutorialStep();
}

function renderConvertTutorialStep(){
  const step = CONVERT_TUTORIAL_STEPS[convertTutorialStep];
  const target = step ? document.querySelector(step.selector) : null;
  if(!step || !target || target.offsetParent === null){
    // 対象要素がまだ表示されていない段階なら、そこで一旦チュートリアルを止めて待つ
    // （次のフェーズの画面が表示された時点でmaybeStartConvertTutorialPhaseが続きを開始する）
    endConvertTutorial(false);
    return;
  }
  document.getElementById("artTutorialStepLabel").textContent = `${convertTutorialStep + 1} / ${CONVERT_TUTORIAL_STEPS.length}`;
  document.getElementById("artTutorialText").innerHTML = `<strong>${step.title}</strong><br>${step.text}`;
  document.getElementById("artTutorialNextBtn").textContent = convertTutorialStep === CONVERT_TUTORIAL_STEPS.length - 1 ? "はじめる" : "次へ";
  target.scrollIntoView({ block: "center", behavior: "auto" });
  requestAnimationFrame(() => requestAnimationFrame(() => positionConvertTutorialElements(target)));
}

function positionConvertTutorialElements(target){
  const rect = target.getBoundingClientRect();
  const pad = 6;
  const highlight = document.getElementById("artTutorialHighlight");
  highlight.style.left = (rect.left - pad) + "px";
  highlight.style.top = (rect.top - pad) + "px";
  highlight.style.width = (rect.width + pad * 2) + "px";
  highlight.style.height = (rect.height + pad * 2) + "px";

  const popup = document.getElementById("artTutorialPopup");
  const margin = 12;
  const popupRect = popup.getBoundingClientRect();
  let top = rect.bottom + margin;
  if(top + popupRect.height > window.innerHeight - 12){
    top = rect.top - popupRect.height - margin;
  }
  top = Math.max(12, Math.min(top, window.innerHeight - popupRect.height - 12));
  let left = rect.left + rect.width / 2 - popupRect.width / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - popupRect.width - 12));
  popup.style.top = top + "px";
  popup.style.left = left + "px";
}

function nextConvertTutorialStep(){
  if(convertTutorialStep >= CONVERT_TUTORIAL_STEPS.length - 1){
    endConvertTutorial(true);
    return;
  }
  convertTutorialStep++;
  renderConvertTutorialStep();
}

// done=true: 最後まで見終えた（次に見せるべきフェーズがまだ来ていないだけの場合はfalseで、
// 「完了扱い」にはせず、後続フェーズの画面が表示された時に続きから再開できるようにする）
function endConvertTutorial(done){
  convertTutorialActive = false;
  if(done) localStorage.setItem(CONVERT_TUTORIAL_DONE_KEY, "true");
  document.getElementById("artTutorialBackdrop").style.display = "none";
  document.getElementById("artTutorialHighlight").style.display = "none";
  document.getElementById("artTutorialPopup").style.display = "none";
}

function skipConvertTutorial(){
  endConvertTutorial(true);
}

function replayConvertTutorial(){
  closeHelpModal();
  localStorage.removeItem(CONVERT_TUTORIAL_DONE_KEY);
  convertTutorialActive = false;
  // 現在表示されている画面に応じて、該当フェーズから再生し直す
  const phase = document.getElementById("artConvertPanel").style.display !== "none"
    ? "panel"
    : document.getElementById("artCropStage").style.display !== "none"
      ? "crop"
      : document.getElementById("artConvertSizeStage").style.display !== "none"
        ? "size"
        : "upload";
  setTimeout(() => maybeStartConvertTutorialPhase(phase), 250);
}

function bindConvertTutorialControls(){
  document.getElementById("artTutorialSkipBtn").addEventListener("click", skipConvertTutorial);
  document.getElementById("artTutorialNextBtn").addEventListener("click", nextConvertTutorialStep);
  const repositionIfActive = () => {
    if(document.getElementById("artTutorialPopup").style.display === "none") return;
    const step = CONVERT_TUTORIAL_STEPS[convertTutorialStep];
    const target = step ? document.querySelector(step.selector) : null;
    if(target) positionConvertTutorialElements(target);
  };
  window.addEventListener("resize", repositionIfActive);
  window.addEventListener("scroll", repositionIfActive, { passive: true });
}

// 言語切替時に動的コンテンツ（i18n読み込み前に描画されたUI）を再描画
document.addEventListener("langchange", () => {
  renderConvertSizeOptions();
  if(document.getElementById("artConvertSizeStep2").style.display !== "none"){
    renderConvertFramePartOptions();
  }
  renderConvertOptionLabels();
  renderPresetPreviews();
});

initArtConverter();
