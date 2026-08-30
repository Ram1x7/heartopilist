// js/build.js
// 建築サポートページ（build.html）：壁画モード（2D）
// 画面の流れ: ①画像を選ぶ → ②壁画サイズ → ③位置とサイズを調整 → ④配置図・建材一覧・保存
// 画像のピクセル化（切り抜き矩形の計算・キャンバス描画）は js/art-pixelate.js の
// coverCropRect を再利用する。色→建材のマッチングは支柱系（grid_cell配置）のみを対象にし、
// 二乗ユークリッドRGB距離で最も近い色を持つ建材を選ぶ（js/art-pixelate.jsの
// nearestPaletteIndexと同じ考え方）。すべてブラウザ内で完結し、画像を外部に送信しない。
// 立体モード（3D・AI奥行き推測）は今回のバージョンでは未実装。

let sourceImage = null;
// 位置・拡大縮小の調整ステップ（js/art-converter.jsの同名変数と同じ役割）
let cropZoom = 1;
let cropLeft = 0;
let cropTop = 0;
let cropCoverScale = 1;
let cropTargetKey = null;
let manualCropRect = null;
let cropDragState = null;

let settings = {
  width: 16,
  height: 16,
};

let resultCells = null; // 長さwidth*height。各要素は {materialId, hex, name} または null
let pickerCellIndex = null;

const BUILD_DESIGNS_KEY = "hatopiBuild_designs";
let savedDesigns = [];

// ── 建材マッチング ──
function hexToRgb(hex){
  const v = hex.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

// 支柱系（grid_cell配置）の全建材・全色から、対象RGBに最も近い色を持つものを選ぶ
function nearestMaterial(rgb, materialItems){
  let best = null;
  let bestDist = Infinity;
  materialItems.forEach(material => {
    material.colors.forEach(hex => {
      const c = hexToRgb(hex);
      const dist = (rgb[0] - c[0]) ** 2 + (rgb[1] - c[1]) ** 2 + (rgb[2] - c[2]) ** 2;
      if(dist < bestDist){
        bestDist = dist;
        best = { materialId: material.id, name: material.name, hex };
      }
    });
  });
  return best;
}

// ── ステップ進捗表示 ──
const BUILD_STAGE_ORDER = ["upload", "size", "crop", "finish"];
const BUILD_STAGE_JUMP_FN = {
  size: () => showBuildSizeStage(),
  crop: () => openBuildCropStage(false),
};

function updateBuildStepProgress(stage){
  const idx = BUILD_STAGE_ORDER.indexOf(stage);
  document.querySelectorAll("#buildProgress .art-convert-progress-step").forEach(btn => {
    const bIdx = BUILD_STAGE_ORDER.indexOf(btn.dataset.stage);
    const isPast = bIdx < idx;
    btn.classList.toggle("completed", isPast);
    btn.classList.toggle("active", bIdx === idx);
    const canJump = isPast && !!BUILD_STAGE_JUMP_FN[btn.dataset.stage] && !!sourceImage;
    btn.disabled = !canJump;
  });
}

function bindBuildStepProgress(){
  document.querySelectorAll("#buildProgress .art-convert-progress-step").forEach(btn => {
    btn.addEventListener("click", () => {
      const fn = BUILD_STAGE_JUMP_FN[btn.dataset.stage];
      if(fn && !btn.disabled) fn();
    });
  });
}

// ── 画像アップロード ──
function handleBuildFileSelect(file){
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
      showBuildSizeStage();
    };
    img.onerror = () => alert(T("art_image_load_failed", "画像の読み込みに失敗しました"));
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── 壁画サイズ選択 ──
function showBuildSizeStage(){
  if(!sourceImage) return;
  document.getElementById("buildUploadArea").style.display = "none";
  document.getElementById("buildCropStage").style.display = "none";
  document.getElementById("buildResultStage").style.display = "none";
  document.getElementById("buildSizeStage").style.display = "block";
  document.getElementById("buildWidthInput").value = settings.width;
  document.getElementById("buildHeightInput").value = settings.height;
  updateBuildStepProgress("size");
}

function readSizeInputs(){
  const w = Math.min(24, Math.max(1, Number(document.getElementById("buildWidthInput").value) || 1));
  const h = Math.min(17, Math.max(1, Number(document.getElementById("buildHeightInput").value) || 1));
  if(w !== settings.width || h !== settings.height) manualCropRect = null;
  settings.width = w;
  settings.height = h;
}

function confirmBuildSizeStage(){
  readSizeInputs();
  document.getElementById("buildSizeStage").style.display = "none";
  openBuildCropStage(false);
}

// ── 位置・拡大縮小の調整（js/art-converter.jsのopenCropStage/applyCropTransform/
// bindCropInteractionsと同じロジック。デザイン枠・輪郭オーバーレイは無し） ──
function openBuildCropStage(reset){
  if(!sourceImage) return;
  document.getElementById("buildUploadArea").style.display = "none";
  document.getElementById("buildSizeStage").style.display = "none";
  document.getElementById("buildResultStage").style.display = "none";
  document.getElementById("buildCropStage").style.display = "block";
  updateBuildStepProgress("crop");

  const targetKey = `${settings.width}x${settings.height}`;
  const viewport = document.getElementById("buildCropViewport");
  viewport.style.aspectRatio = `${settings.width} / ${settings.height}`;
  document.getElementById("buildCropImg").src = sourceImage.src;

  requestAnimationFrame(() => {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    cropCoverScale = Math.max(vw / sourceImage.naturalWidth, vh / sourceImage.naturalHeight);
    if(reset || cropTargetKey !== targetKey){
      cropZoom = 1;
      cropLeft = (vw - sourceImage.naturalWidth * cropCoverScale) / 2;
      cropTop = (vh - sourceImage.naturalHeight * cropCoverScale) / 2;
      cropTargetKey = targetKey;
    }
    document.getElementById("buildCropZoomSlider").value = Math.round(cropZoom * 100);
    applyBuildCropTransform();
    renderBuildCropGridOverlay();
    bindBuildCropInteractions();
  });
}

// 位置調整ステージに、確定する切り抜き範囲（＝ビューポートそのもの）を
// settings.width×settings.heightのマス目で区切った目安線を重ねる。
// 画像のドラッグ・ズームとは独立して、ビューポートに対して固定表示する
function renderBuildCropGridOverlay(){
  const canvas = document.getElementById("buildCropOverlay");
  const viewport = document.getElementById("buildCropViewport");
  if(!canvas || !viewport) return;
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  canvas.width = vw;
  canvas.height = vh;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, vw, vh);

  const cellW = vw / settings.width;
  const cellH = vh / settings.height;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1;
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 1.5;
  ctx.beginPath();
  for(let x = 1; x < settings.width; x++){
    const px = Math.round(x * cellW) + 0.5;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, vh);
  }
  for(let y = 1; y < settings.height; y++){
    const py = Math.round(y * cellH) + 0.5;
    ctx.moveTo(0, py);
    ctx.lineTo(vw, py);
  }
  ctx.stroke();
}

function applyBuildCropTransform(){
  const viewport = document.getElementById("buildCropViewport");
  const img = document.getElementById("buildCropImg");
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

function bindBuildCropInteractions(){
  const viewport = document.getElementById("buildCropViewport");
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
    applyBuildCropTransform();
  });
  const endDrag = (e) => {
    if(cropDragState && e.pointerId === cropDragState.pointerId) cropDragState = null;
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  document.getElementById("buildCropZoomSlider").addEventListener("input", (e) => {
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
    applyBuildCropTransform();
  });

  document.getElementById("buildCropResetBtn").addEventListener("click", () => openBuildCropStage(true));
  document.getElementById("buildCropConfirmBtn").addEventListener("click", confirmBuildCrop);
}

function confirmBuildCrop(){
  const viewport = document.getElementById("buildCropViewport");
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  const scale = cropCoverScale * cropZoom;
  manualCropRect = {
    sx: Math.max(0, -cropLeft / scale),
    sy: Math.max(0, -cropTop / scale),
    sw: Math.min(sourceImage.naturalWidth, vw / scale),
    sh: Math.min(sourceImage.naturalHeight, vh / scale),
  };
  document.getElementById("buildCropStage").style.display = "none";
  document.getElementById("buildResultStage").style.display = "block";
  updateBuildStepProgress("finish");
  convertBuildImage();
}

// ── 画像→建材グリッド変換 ──
function computeResultCells(){
  const w = settings.width, h = settings.height;
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");
  const rect = manualCropRect || coverCropRect(sourceImage.naturalWidth, sourceImage.naturalHeight, w, h);
  octx.drawImage(sourceImage, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, w, h);
  const imgData = octx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const supportItems = MATERIALS.support_pillars.items;
  const cells = new Array(w * h);
  for(let i = 0; i < w * h; i++){
    if(d[i * 4 + 3] < 128){
      cells[i] = null;
      continue;
    }
    cells[i] = nearestMaterial([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]], supportItems);
  }
  return cells;
}

function convertBuildImage(){
  if(!sourceImage) return;
  resultCells = computeResultCells();
  renderBuildGrid();
  renderBuildMaterialList();
}

// ── 配置図（グリッド）表示・手動修正 ──
function renderBuildGrid(){
  const grid = document.getElementById("buildGrid");
  const w = settings.width, h = settings.height;
  grid.style.gridTemplateColumns = `repeat(${w}, 1fr)`;
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();
  for(let i = 0; i < w * h; i++){
    const cell = resultCells[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "build-cell";
    btn.style.background = cell ? cell.hex : "transparent";
    btn.title = cell ? `${cell.name} (${cell.hex})` : "";
    btn.addEventListener("click", () => openMaterialPicker(i));
    frag.appendChild(btn);
  }
  grid.appendChild(frag);
}

function openMaterialPicker(index){
  pickerCellIndex = index;
  const current = resultCells[index];
  const body = document.getElementById("buildMaterialPickerBody");
  body.innerHTML = MATERIALS.support_pillars.items.map(material => `
    <div class="build-material-group-title">${material.name}</div>
    <div class="build-material-swatches">
      ${material.colors.map(hex => `
        <button type="button" class="build-material-swatch${current && current.materialId === material.id && current.hex === hex ? " active" : ""}"
          style="background:${hex}" data-material="${material.id}" data-hex="${hex}" data-name="${material.name}"
          aria-label="${material.name} ${hex}"></button>
      `).join("")}
    </div>
  `).join("");
  body.querySelectorAll(".build-material-swatch").forEach(swatchBtn => {
    swatchBtn.addEventListener("click", () => {
      resultCells[pickerCellIndex] = {
        materialId: swatchBtn.dataset.material,
        hex: swatchBtn.dataset.hex,
        name: swatchBtn.dataset.name,
      };
      closeMaterialPicker();
      renderBuildGrid();
      renderBuildMaterialList();
    });
  });
  document.getElementById("buildMaterialPickerModal").style.display = "block";
}

function closeMaterialPicker(){
  document.getElementById("buildMaterialPickerModal").style.display = "none";
}

// ── 必要な建材一覧（種類別個数） ──
function renderBuildMaterialList(){
  if(!resultCells) return;
  const counts = {};
  let cellCount = 0;
  resultCells.forEach(cell => {
    if(!cell) return;
    cellCount++;
    const key = cell.materialId + "_" + cell.hex;
    if(!counts[key]) counts[key] = { name: cell.name, hex: cell.hex, count: 0 };
    counts[key].count++;
  });
  const entries = Object.values(counts).sort((a, b) => b.count - a.count);

  document.getElementById("buildMaterialCount").textContent = entries.length;
  document.getElementById("buildCellCount").textContent = cellCount.toLocaleString();

  document.getElementById("buildMaterialRows").innerHTML = entries.map(e => `
    <div class="art-result-color-row">
      <span class="art-result-color-swatch" style="background:${e.hex}"></span>
      <span class="art-result-color-code">${e.name}</span>
      <span class="art-result-color-count">${e.count}${T("art_unit_cells", "マス")}</span>
    </div>
  `).join("");
}

// ── 最初からやり直す ──
function resetBuildToUpload(){
  sourceImage = null;
  resultCells = null;
  manualCropRect = null;
  cropTargetKey = null;
  document.getElementById("buildResultStage").style.display = "none";
  document.getElementById("buildSizeStage").style.display = "none";
  document.getElementById("buildCropStage").style.display = "none";
  document.getElementById("buildUploadArea").style.display = "block";
  updateBuildStepProgress("upload");
}

// ── 設計図の保存・一覧・読込・削除（js/music-editor.jsのSAVED_SCORES_KEY相当の
// 配列localStorage永続化パターンを踏襲） ──
function generateDesignId(){
  return "design-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function loadSavedDesigns(){
  try{
    const raw = localStorage.getItem(BUILD_DESIGNS_KEY);
    savedDesigns = raw ? JSON.parse(raw) : [];
    if(!Array.isArray(savedDesigns)) savedDesigns = [];
  }catch(e){
    savedDesigns = [];
  }
}

function persistSavedDesigns(){
  try{
    localStorage.setItem(BUILD_DESIGNS_KEY, JSON.stringify(savedDesigns));
    return true;
  }catch(e){
    console.error("failed to persist build designs", e);
    return false;
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}

function renderBuildLibraryList(){
  const el = document.getElementById("buildLibraryList");
  if(savedDesigns.length === 0){
    el.innerHTML = `<p style="font-size:12px; color:var(--text-sub);">${T("build_library_empty", "まだ保存した設計図がありません")}</p>`;
    return;
  }
  el.innerHTML = savedDesigns.slice().reverse().map(d => `
    <div class="build-library-item">
      <span class="build-library-item-name">${escapeHtml(d.name)}（${d.width}×${d.height}）</span>
      <div class="build-library-item-actions">
        <button type="button" data-action="load" data-id="${d.id}">${T("build_library_load", "読込")}</button>
        <button type="button" data-action="delete" data-id="${d.id}">${T("build_library_delete", "削除")}</button>
      </div>
    </div>
  `).join("");
  el.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if(btn.dataset.action === "load") loadDesign(id);
      else if(btn.dataset.action === "delete") deleteDesign(id);
    });
  });
}

function saveBuildDesign(){
  if(!resultCells){
    alert(T("build_save_no_result", "先に画像を変換してください"));
    return;
  }
  const nameInput = document.getElementById("buildDesignNameInput");
  const name = nameInput.value.trim() || T("build_design_default_name", "無題の設計図");
  savedDesigns.push({
    id: generateDesignId(),
    name,
    width: settings.width,
    height: settings.height,
    cells: resultCells,
    createdAt: Date.now(),
  });
  if(persistSavedDesigns()){
    nameInput.value = "";
    renderBuildLibraryList();
    if(typeof showToast === "function") showToast(T("build_save_done", "保存しました"));
  }
}

function loadDesign(id){
  const design = savedDesigns.find(d => d.id === id);
  if(!design) return;
  sourceImage = null;
  manualCropRect = null;
  settings.width = design.width;
  settings.height = design.height;
  resultCells = design.cells.map(c => (c ? { ...c } : null));
  document.getElementById("buildUploadArea").style.display = "none";
  document.getElementById("buildSizeStage").style.display = "none";
  document.getElementById("buildCropStage").style.display = "none";
  document.getElementById("buildResultStage").style.display = "block";
  document.getElementById("buildDesignNameInput").value = design.name;
  renderBuildGrid();
  renderBuildMaterialList();
  updateBuildStepProgress("finish");
}

function deleteDesign(id){
  if(!confirm(T("build_delete_confirm", "この設計図を削除しますか？"))) return;
  savedDesigns = savedDesigns.filter(d => d.id !== id);
  persistSavedDesigns();
  renderBuildLibraryList();
}

// ── 書き出し・読み込み（js/data-sync.jsのexportAllData/importAllDataと同じ
// Blob化＋<a download>、file.text()→JSON.parseのパターンを設計図一覧に限定して使う） ──
function exportBuildDesigns(){
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    designs: savedDesigns,
  };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `hatopi-build-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importBuildDesigns(event){
  const file = event.target.files[0];
  if(!file) return;
  try{
    const text = await file.text();
    const backup = JSON.parse(text);
    if(!backup.version || !Array.isArray(backup.designs)){
      alert(T("data_sync_invalid_format", "バックアップファイルの形式が違います。"));
      event.target.value = "";
      return;
    }
    if(!confirm(T("build_import_confirm", "読み込んだ設計図を追加しますか？（既存の設計図は残ります）"))){
      event.target.value = "";
      return;
    }
    backup.designs.forEach(d => {
      if(!d.id) d.id = generateDesignId();
      savedDesigns.push(d);
    });
    persistSavedDesigns();
    renderBuildLibraryList();
    event.target.value = "";
    alert(T("data_sync_import_done", "バックアップを読み込みました。"));
  }catch(e){
    console.error(e);
    alert(T("data_sync_import_failed", "読み込みに失敗しました。"));
    event.target.value = "";
  }
}

// ── 初期化 ──
function initBuildPage(){
  loadSavedDesigns();
  renderBuildLibraryList();
  bindBuildStepProgress();
  updateBuildStepProgress("upload");

  const fileInput = document.getElementById("buildFileInput");
  document.getElementById("buildUploadBtn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    if(e.target.files && e.target.files[0]) handleBuildFileSelect(e.target.files[0]);
  });

  document.getElementById("buildSizeConfirmBtn").addEventListener("click", confirmBuildSizeStage);
  document.getElementById("buildChangeSizeBtn").addEventListener("click", showBuildSizeStage);
  document.getElementById("buildAdjustCropBtn").addEventListener("click", () => openBuildCropStage(false));
  document.getElementById("buildNewImageBtn").addEventListener("click", resetBuildToUpload);
  document.getElementById("buildSaveDesignBtn").addEventListener("click", saveBuildDesign);
  document.getElementById("buildExportBtn").addEventListener("click", exportBuildDesigns);
  document.getElementById("buildImportBtn").addEventListener("click", () => document.getElementById("buildImportInput").click());
  document.getElementById("buildImportInput").addEventListener("change", importBuildDesigns);
}

document.addEventListener("langchange", () => {
  if(resultCells) renderBuildMaterialList();
  renderBuildLibraryList();
});

initBuildPage();
