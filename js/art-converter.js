// js/art-converter.js
// 「画像から作る」ページ（art-convert.html）: 画像→ドット絵変換
// アップロード → 配置（Crop/Fit/Fill、キャンバス比率に合わせる）→ 明るさ/コントラスト
// → 輪郭強調 → 背景処理 → 色数削減 → パレット変換（ディザリング対応）
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
  { id: "standard", labelKey: "art_preset_standard", labelFallback: "標準", overrides: { dither: false, edge: "off" } },
  { id: "smooth", labelKey: "art_preset_smooth", labelFallback: "なめらか", overrides: { dither: true, edge: "off" } },
  { id: "crisp", labelKey: "art_preset_crisp", labelFallback: "くっきり", overrides: { dither: false, edge: "mid" } },
];

let sourceImage = null;
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

function renderConvertFramePartOptions(){
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === selectedFrameId);
  if(!frame) return;
  const lang = currentLang();
  renderOptionGroup(
    "artConvertFramePartOptions",
    frame.parts.map(p => ({ id: p.id, label: frameName(p, lang) })),
    selectedFramePartId,
    (v) => selectFramePart(v)
  );
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
      document.getElementById("artOriginalImg").src = e.target.result;
      document.getElementById("artConvertPreview").style.display = "block";
      document.getElementById("artConvertPanel").style.display = "block";
      convert();
    };
    img.onerror = () => alert(T("art_image_load_failed", "画像の読み込みに失敗しました"));
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
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
    // crop / fill: どちらもキャンバス比率に合わせて中央を基準にクロップする（cover）
    const rect = coverCropRect(sourceImage.naturalWidth, sourceImage.naturalHeight, w, h);
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
  }));
  location.href = "art-create.html";
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
