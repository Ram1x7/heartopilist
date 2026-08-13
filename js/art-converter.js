// js/art-converter.js
// 「画像から作る」ページ（art-convert.html）: 画像→ドット絵変換
// アップロード → 配置（Crop/Fit/Fill、キャンバス比率に合わせる）→ 明るさ/コントラスト
// → 輪郭強調 → 背景処理 → 色数削減（メディアンカット）→ パレット変換（ディザリング対応）
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

let sourceImage = null;
let settings = {
  width: FREE_CANVAS_SIZES[0],
  height: FREE_CANVAS_SIZES[0],
  fitMode: "fill",
  fitBgMode: "transparent",
  fitBgColor: "#ffffff",
  colors: 16,
  dither: false,
  edge: "off",
  brightness: 0,
  contrast: 0,
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

  const fileInput = document.getElementById("artFileInput");
  document.getElementById("artUploadBtn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    if(e.target.files && e.target.files[0]) handleFileSelect(e.target.files[0]);
  });

  document.getElementById("artUseInEditorBtn").addEventListener("click", useResultInEditor);
}

// キャンバスサイズ選択（自由サイズ4種＋デザイン枠プリセット）
function renderConvertSizeOptions(){
  renderOptionGroup(
    "artConvertFreeSizeOptions",
    FREE_CANVAS_SIZES.map(s => ({ id: s, label: `${s} × ${s}` })),
    settings.width === settings.height ? settings.width : null,
    (v) => {
      settings.width = Number(v);
      settings.height = Number(v);
      scheduleConvert();
    }
  );
  const el = document.getElementById("artConvertFramePresetOptions");
  el.innerHTML = DESIGN_FRAME_PRESETS.map(p => `
    <button disabled title="${T("art_frame_unconfirmed", "実際のゲーム内サイズを確認後に対応予定です")}">
      ${T(p.nameKey, p.nameFallback)}<br><span class="art-preset-badge">${T("art_preset_coming_soon", "準備中")}</span>
    </button>
  `).join("");
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

function renderOptionGroup(containerId, options, currentValue, onSelect){
  const el = document.getElementById(containerId);
  el.innerHTML = options.map(o => `
    <button class="${String(o.id) === String(currentValue) ? "active" : ""}" data-value="${o.id}">${o.label}</button>
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
function convert(){
  if(!sourceImage) return;
  const w = settings.width, h = settings.height;

  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");

  if(settings.fitMode === "fit"){
    // 画像全体を表示（コンテイン）。余白は透明のまま、または指定色で塗りつぶす
    if(settings.fitBgMode === "custom"){
      octx.fillStyle = settings.fitBgColor;
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
  applyBrightnessContrast(imgData, settings.brightness, settings.contrast);
  if(settings.edge !== "off") applyEdgeEnhance(imgData, settings.edge);

  const bgMask = computeBackgroundMask(imgData, settings.background);
  // Fitモードで生じる透明な余白は、背景設定に関わらず常に透明のまま扱う
  const d = imgData.data;
  for(let i = 0; i < bgMask.length; i++){
    if(d[i * 4 + 3] < 128) bgMask[i] = true;
  }

  const palette = buildPalette(imgData, settings.colors, bgMask);
  resultPixels = settings.dither
    ? ditherToPalette(imgData, palette, bgMask)
    : mapToPalette(imgData, palette, bgMask);

  renderResultPreview();
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

// ── パレット生成（メディアンカット法） ──
function buildPalette(imgData, n, bgMask){
  const d = imgData.data;
  const pts = [];
  for(let i = 0; i < bgMask.length; i++){
    if(bgMask[i]) continue;
    pts.push([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
  }
  if(pts.length === 0) return [[0, 0, 0]];
  return medianCut(pts, n);
}

function medianCut(points, n){
  let buckets = [points];
  while(buckets.length < n){
    let idx = -1, maxRange = -1;
    buckets.forEach((b, i) => {
      const r = channelRange(b);
      if(r.max > maxRange && b.length > 1){
        maxRange = r.max;
        idx = i;
      }
    });
    if(idx === -1) break;
    const bucket = buckets[idx];
    const ch = channelRange(bucket).channel;
    bucket.sort((a, b) => a[ch] - b[ch]);
    const mid = Math.floor(bucket.length / 2);
    buckets.splice(idx, 1, bucket.slice(0, mid), bucket.slice(mid));
  }
  return buckets.filter(b => b.length > 0).map(averageColor);
}

function channelRange(points){
  const min = [255, 255, 255], max = [0, 0, 0];
  points.forEach(p => {
    for(let c = 0; c < 3; c++){
      if(p[c] < min[c]) min[c] = p[c];
      if(p[c] > max[c]) max[c] = p[c];
    }
  });
  const ranges = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  let channel = 0, best = ranges[0];
  for(let c = 1; c < 3; c++){
    if(ranges[c] > best){ best = ranges[c]; channel = c; }
  }
  return { channel, max: best };
}

function averageColor(points){
  const sum = [0, 0, 0];
  points.forEach(p => { sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2]; });
  return [Math.round(sum[0] / points.length), Math.round(sum[1] / points.length), Math.round(sum[2] / points.length)];
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
  return "#" + rgb.map(v => {
    const n = Math.max(0, Math.min(255, Math.round(v)));
    return n.toString(16).padStart(2, "0");
  }).join("");
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
  const w = settings.width, h = settings.height;
  const canvas = document.getElementById("artResultCanvas");
  const cell = Math.max(2, Math.floor(320 / Math.max(w, h)));
  canvas.width = w * cell;
  canvas.height = h * cell;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const c = resultPixels[y * w + x];
      if(c){
        ctx.fillStyle = c;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
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
  renderConvertOptionLabels();
});

initArtConverter();
