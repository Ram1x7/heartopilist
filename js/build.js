// js/build.js
// 建築サポートページ（build.html）：統合3Dボクセル編集ツール（MVP・第2弾）
// 画面の流れ: ①画像＋建築モード・オプションを選ぶ → ②位置調整（正面画像） →
//            ③3D結果表示・手動編集（ペン/消しゴム・Undo/Redo）・建材一覧・保存
// 色→建材のマッチングは支柱系（grid_cell配置）のみを対象にし、Lab色空間での
// 誤差拡散ディザリング＋輪郭保持（旧・壁画モードから流用）を行う。3D描画・
// クリック編集の当たり判定はjs/build3d-scene.js（Three.js・InstancedMesh）に
// 委譲する。すべてブラウザ内で完結し、画像を外部に送信しない。
//
// 【このバージョンでの既知の未実装（次のフェーズ予定）】
// ・範囲選択（ドラッグで囲んでの一括編集）
// ・自動再生（下から積み上げるアニメーション）と「現在の層のみハイライト」
// ・共有リンク(URL)機能

import * as Build3D from "./build3d-scene.js";

// ── 敷地の座標上限（ボクセル換算、幅×奥行き×高さ） ──
const SITE_MAX_WIDTH = 96;
const SITE_MAX_DEPTH = 120;
const SITE_MAX_HEIGHT = 68;

let frontImage = null;
let backImage = null;

// 位置・拡大縮小の調整ステップ（front画像のみ手動調整。back画像は自動カバー
// フィットのみ・調整UIなし＝スコープを絞ったMVPの割り切り）
let cropZoom = 1;
let cropLeft = 0;
let cropTop = 0;
let cropCoverScale = 1;
let cropTargetKey = null;
let manualCropRect = null;
let cropDragState = null;

let settings = {
  mode: "solid",       // "solid"（立体・像） | "flat"（平面・床）
  width: 24,           // 幅マス数（画像の横方向解像度）。もう一方の軸は画像比率から自動算出
  thickness: 6,        // solid: 奥行きの押し出し量 / flat: 起伏の最大高さ
  hollow: true,         // 空洞化（solidのみ有効）
  autoTransparentBg: false,
};

let resultVoxels = null;   // [{x,y,z,materialId,hex,name}]
let resultDims = null;     // {w,h,d}

const BUILD_DESIGNS_KEY = "hatopiBuild_designs";
let savedDesigns = [];

// ══════════════════════════════════════
// 手動編集（ペン/消しゴム・Undo/Redo）
// ══════════════════════════════════════
let editTool = "pen"; // "pen" | "eraser"
let selectedMaterial = null; // {materialId, hex, name}（パレットから選んだ、ペンで使う建材）
const EDIT_HISTORY_LIMIT = 50;
let undoStack = [];
let redoStack = [];

function cloneVoxels(voxels){
  return voxels.map(v => ({ ...v }));
}

function pushHistory(){
  if(!resultVoxels) return;
  undoStack.push(cloneVoxels(resultVoxels));
  if(undoStack.length > EDIT_HISTORY_LIMIT) undoStack.shift();
  redoStack = [];
  updateUndoRedoButtons();
}

function clearHistory(){
  undoStack = [];
  redoStack = [];
  updateUndoRedoButtons();
}

function updateUndoRedoButtons(){
  const undoBtn = document.getElementById("buildUndoBtn");
  const redoBtn = document.getElementById("buildRedoBtn");
  if(undoBtn) undoBtn.disabled = undoStack.length === 0;
  if(redoBtn) redoBtn.disabled = redoStack.length === 0;
}

function undoEdit(){
  if(undoStack.length === 0) return;
  redoStack.push(cloneVoxels(resultVoxels));
  resultVoxels = undoStack.pop();
  refreshVoxelView();
  updateUndoRedoButtons();
}

function redoEdit(){
  if(redoStack.length === 0) return;
  undoStack.push(cloneVoxels(resultVoxels));
  resultVoxels = redoStack.pop();
  refreshVoxelView();
  updateUndoRedoButtons();
}

function refreshVoxelView(){
  Build3D.setVoxels(getVisibleVoxels(), { fit: false });
  renderBuildMaterialList();
}

function inBounds(x, y, z){
  return resultDims && x >= 0 && x < resultDims.w && y >= 0 && y < resultDims.h && z >= 0 && z < resultDims.d;
}

// ══════════════════════════════════════
// 施工ステージ表示（下から積み上げた場合に何段目まで見えるかのスライダー）
// ══════════════════════════════════════
let progressLayer = 1; // 1〜resultDims.h。resultDims.h＝全て表示

function isProgressFull(){
  return !resultDims || progressLayer >= resultDims.h;
}

function getVisibleVoxels(){
  if(!resultVoxels) return [];
  if(isProgressFull()) return resultVoxels;
  return resultVoxels.filter(v => v.y < progressLayer);
}

function setupProgressSlider(){
  const slider = document.getElementById("buildProgressSlider");
  if(!resultDims) return;
  slider.max = String(Math.max(1, resultDims.h));
  progressLayer = resultDims.h;
  slider.value = String(progressLayer);
  updateProgressUI();
}

function updateProgressUI(){
  const output = document.getElementById("buildProgressOutput");
  const hint = document.getElementById("buildProgressHint");
  const full = isProgressFull();
  output.textContent = full ? T("build_progress_all", "全て") : T("build_progress_layer", "{n}段目").replace("{n}", progressLayer);
  hint.style.display = full ? "none" : "block";
  // 施工ステージ表示中（全て以外）はペン/消しゴム/建材選択を無効化する
  // （Undo/Redoは編集履歴の有無で別途制御するため、ここでは触らない）
  ["buildToolPenBtn", "buildToolEraserBtn", "buildPaletteBtn"].forEach(id => {
    document.getElementById(id).disabled = !full;
  });
}

function handleProgressSliderChange(){
  const slider = document.getElementById("buildProgressSlider");
  progressLayer = Number(slider.value);
  updateProgressUI();
  Build3D.setVoxels(getVisibleVoxels(), { fit: false });
}

// build3d-scene.jsからの「編集クリック」通知（ドラッグを伴わないクリック/タップ）
function handleEditClick(hit){
  if(!hit || !resultVoxels || !isProgressFull()) return;
  if(editTool === "eraser"){
    if(!hit.voxel) return;
    pushHistory();
    resultVoxels = resultVoxels.filter(v => !(v.x === hit.voxel.x && v.y === hit.voxel.y && v.z === hit.voxel.z));
    refreshVoxelView();
    return;
  }
  // ペン：クリックした面の外側に隣接するマスへ、選択中の建材を1つ追加する
  // （既存の面に接する形でのみ置ける。何もない空間に単独で置くことはできない）
  if(!hit.adjacent || !selectedMaterial) return;
  const { x, y, z } = hit.adjacent;
  if(!inBounds(x, y, z)) return;
  if(resultVoxels.some(v => v.x === x && v.y === y && v.z === z)) return;
  pushHistory();
  resultVoxels.push({ x, y, z, materialId: selectedMaterial.materialId, hex: selectedMaterial.hex, name: selectedMaterial.name });
  refreshVoxelView();
}

function setEditTool(tool){
  editTool = tool;
  document.getElementById("buildToolPenBtn").classList.toggle("active", tool === "pen");
  document.getElementById("buildToolEraserBtn").classList.toggle("active", tool === "eraser");
}

function updateSelectedSwatch(){
  const el = document.getElementById("buildSelectedSwatch");
  if(el && selectedMaterial) el.style.background = selectedMaterial.hex;
}

function openMaterialPickerModal(){
  const body = document.getElementById("buildMaterialPickerBody");
  body.innerHTML = MATERIALS.support_pillars.items.map(material => `
    <div class="build-material-group-title">${material.name}</div>
    <div class="build-material-swatches">
      ${material.colors.map(hex => `
        <button type="button" class="build-material-swatch${selectedMaterial && selectedMaterial.materialId === material.id && selectedMaterial.hex === hex ? " active" : ""}"
          style="background:${hex}" data-material="${material.id}" data-hex="${hex}" data-name="${material.name}"
          aria-label="${material.name} ${hex}"></button>
      `).join("")}
    </div>
  `).join("");
  body.querySelectorAll(".build-material-swatch").forEach(swatchBtn => {
    swatchBtn.addEventListener("click", () => {
      selectedMaterial = { materialId: swatchBtn.dataset.material, hex: swatchBtn.dataset.hex, name: swatchBtn.dataset.name };
      updateSelectedSwatch();
      closeMaterialPickerModal();
    });
  });
  document.getElementById("buildMaterialPickerModal").style.display = "block";
}

function closeMaterialPickerModal(){
  document.getElementById("buildMaterialPickerModal").style.display = "none";
}

// ══════════════════════════════════════
// 色マッチング（Lab色空間、支柱系のみ対象）
// ══════════════════════════════════════
function hexToRgb(hex){
  const v = hex.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

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

const materialLabIndexCache = new WeakMap();
function getMaterialLabIndex(materialItems){
  let index = materialLabIndexCache.get(materialItems);
  if(index) return index;
  index = [];
  materialItems.forEach(material => {
    material.colors.forEach(hex => {
      index.push({ materialId: material.id, name: material.name, hex, lab: rgbToLab(hexToRgb(hex)) });
    });
  });
  materialLabIndexCache.set(materialItems, index);
  return index;
}

function nearestMaterialFromLab(lab, materialItems){
  const index = getMaterialLabIndex(materialItems);
  let best = null;
  let bestDist = Infinity;
  index.forEach(entry => {
    const dist = labDistSq(lab, entry.lab);
    if(dist < bestDist){
      bestDist = dist;
      best = { materialId: entry.materialId, name: entry.name, hex: entry.hex };
    }
  });
  return best;
}

// ══════════════════════════════════════
// ステップ進捗表示
// ══════════════════════════════════════
const BUILD_STAGE_ORDER = ["upload", "adjust", "finish"];
const BUILD_STAGE_JUMP_FN = {
  adjust: () => openBuildCropStage(false),
};

function updateBuildStepProgress(stage){
  const idx = BUILD_STAGE_ORDER.indexOf(stage);
  document.querySelectorAll("#buildProgress .art-convert-progress-step").forEach(btn => {
    const bIdx = BUILD_STAGE_ORDER.indexOf(btn.dataset.stage);
    const isPast = bIdx < idx;
    btn.classList.toggle("completed", isPast);
    btn.classList.toggle("active", bIdx === idx);
    const canJump = isPast && !!BUILD_STAGE_JUMP_FN[btn.dataset.stage] && !!frontImage;
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

// ══════════════════════════════════════
// 画像アップロード（正面・背面）
// ══════════════════════════════════════
function loadImageFile(file){
  return new Promise((resolve, reject) => {
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)){
      reject(new Error("invalid-type"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("load-failed"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

async function handleFrontFileSelect(file){
  try{
    frontImage = await loadImageFile(file);
    manualCropRect = null;
    cropTargetKey = null;
    updateBackImageVisibility();
    renderFrontPreview();
    document.getElementById("buildProceedBtn").disabled = false;
    document.getElementById("buildUploadBtnLabel").textContent = T("build_choose_again", "画像を選び直す");
  }catch(e){
    alert(T("art_invalid_image", "対応していないファイル形式です（JPG・PNG・WebPのみ）"));
  }
}

function renderFrontPreview(){
  const wrap = document.getElementById("buildFrontPreviewWrap");
  const img = document.getElementById("buildFrontPreviewImg");
  if(!wrap || !img || !frontImage) return;
  img.src = frontImage.src;
  wrap.style.display = "flex";
}

async function handleBackFileSelect(file){
  try{
    backImage = await loadImageFile(file);
    renderBackPreview();
  }catch(e){
    alert(T("art_invalid_image", "対応していないファイル形式です（JPG・PNG・WebPのみ）"));
  }
}

function renderBackPreview(){
  const wrap = document.getElementById("buildBackPreviewWrap");
  const img = document.getElementById("buildBackPreviewImg");
  if(!wrap || !img) return;
  if(backImage){
    img.src = backImage.src;
    wrap.style.display = "flex";
  }else{
    wrap.style.display = "none";
  }
}

function clearBackImage(){
  backImage = null;
  renderBackPreview();
}

function updateBackImageVisibility(){
  const backRow = document.getElementById("buildBackImageRow");
  if(backRow) backRow.style.display = settings.mode === "solid" ? "block" : "none";
}

// ══════════════════════════════════════
// モード・オプション（画像アップロード直後の設定ステップ）
// ══════════════════════════════════════
function setBuildMode(mode){
  settings.mode = mode;
  document.querySelectorAll(".build-mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  document.getElementById("buildThicknessLabel").textContent =
    mode === "solid"
      ? T("build_thickness_label_solid", "厚さ（奥行きの押し出し量）")
      : T("build_thickness_label_flat", "厚さ（起伏の最大高さ）");
  document.getElementById("buildHollowRow").style.display = mode === "solid" ? "flex" : "none";
  updateBackImageVisibility();
  if(frontImage) renderBuildCropGridOverlay();
}

function readOptionInputs(){
  settings.width = Math.min(SITE_MAX_WIDTH, Math.max(2, Number(document.getElementById("buildWidthInput").value) || 2));
  settings.thickness = Math.min(40, Math.max(1, Number(document.getElementById("buildThicknessInput").value) || 1));
  settings.hollow = document.getElementById("buildHollowCheckbox").checked;
  settings.autoTransparentBg = document.getElementById("buildAutoTransparentCheckbox").checked;
  document.getElementById("buildWidthOutput").textContent = `${settings.width}${T("build_unit_masu", "マス")}`;
  document.getElementById("buildThicknessOutput").textContent = `${settings.thickness}${T("build_unit_masu", "マス")}`;
}

let optionDebounceTimer = null;
function handleOptionInputChange(){
  readOptionInputs();
  clearTimeout(optionDebounceTimer);
  optionDebounceTimer = setTimeout(() => {
    if(frontImage) renderBuildCropGridOverlay();
  }, 150);
}

// 画像から求まる、幅に対するもう一方の軸（solid:高さ / flat:奥行き）のマス数
// 実際の支柱建材は1(幅)×1(奥行き)×2(高さ)で、幅・奥行きの2倍の高さがある
// （立方体の建材を前提にした換算ではない）。そのため立体モードで画像の縦横比
// から高さのマス数を決めるときは、ボクセル1段＝実際の支柱2個ぶんの高さに
// 相当することを踏まえ、単純な比率の半分のマス数にする。これにより、実際に
// 支柱で建てた完成物が、1×1×1の立方体で作った場合と同じ見た目の比率になる
// （平面モードのotherDimは奥行き軸で、この高さの特性とは無関係なので対象外）
const SOLID_HEIGHT_ASPECT_COMPENSATION = 2;

function computeOtherDim(){
  if(!frontImage) return settings.width;
  // 常に元画像そのものの縦横比を使う（切り抜き範囲＝manualCropRectは、
  // このwidth/otherDim比になるようcrop stageのビューポート自体を固定した上で
  // 選ばれるため、manualCropRect.sw/shから逆算すると、確定後は
  // 「width/otherDim」比そのものに一致してしまい、再度この関数を呼ぶたびに
  // 補正が重ねがけされてしまう＝毎回さらに半分になっていくバグになる）
  const aspect = frontImage.naturalWidth / frontImage.naturalHeight; // 幅/高さ
  const maxOther = settings.mode === "solid" ? SITE_MAX_HEIGHT : SITE_MAX_DEPTH;
  const compensation = settings.mode === "solid" ? SOLID_HEIGHT_ASPECT_COMPENSATION : 1;
  return Math.min(maxOther, Math.max(2, Math.round(settings.width / aspect / compensation)));
}

// ══════════════════════════════════════
// 位置・拡大縮小の調整（正面画像のみ）
// ══════════════════════════════════════
function openBuildCropStage(reset){
  if(!frontImage) return;
  document.getElementById("buildUploadArea").style.display = "none";
  document.getElementById("buildResultStage").style.display = "none";
  document.getElementById("buildCropStage").style.display = "block";
  updateBuildStepProgress("adjust");

  const otherDim = computeOtherDim();
  const targetKey = `${settings.width}x${otherDim}`;
  const viewport = document.getElementById("buildCropViewport");
  viewport.style.aspectRatio = `${settings.width} / ${otherDim}`;
  document.getElementById("buildCropImg").src = frontImage.src;

  requestAnimationFrame(() => {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    cropCoverScale = Math.max(vw / frontImage.naturalWidth, vh / frontImage.naturalHeight);
    if(reset || cropTargetKey !== targetKey){
      cropZoom = 1;
      cropLeft = (vw - frontImage.naturalWidth * cropCoverScale) / 2;
      cropTop = (vh - frontImage.naturalHeight * cropCoverScale) / 2;
      cropTargetKey = targetKey;
    }
    document.getElementById("buildCropZoomSlider").value = Math.round(cropZoom * 100);
    applyBuildCropTransform();
    renderBuildCropGridOverlay();
    bindBuildCropInteractions();
  });
}

function renderBuildCropGridOverlay(){
  const canvas = document.getElementById("buildCropOverlay");
  const viewport = document.getElementById("buildCropViewport");
  if(!canvas || !viewport || !frontImage) return;
  const otherDim = computeOtherDim();
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  canvas.width = vw;
  canvas.height = vh;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, vw, vh);

  const cellW = vw / settings.width;
  const cellH = vh / otherDim;
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
  for(let y = 1; y < otherDim; y++){
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
  const dispW = frontImage.naturalWidth * scale;
  const dispH = frontImage.naturalHeight * scale;
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
    sw: Math.min(frontImage.naturalWidth, vw / scale),
    sh: Math.min(frontImage.naturalHeight, vh / scale),
  };
  document.getElementById("buildCropStage").style.display = "none";
  document.getElementById("buildResultStage").style.display = "block";
  updateBuildStepProgress("finish");
  runBuildGeneration();
}

// ══════════════════════════════════════
// 画像→2D色グリッド（正面・背面共通で使う下請け関数）
// セルへの縮小は1段階で行わず、各セルにつき複数のサブピクセルをサンプリングしてから
// 代表色を決める。単純平均だと目・口などコントラストの強い細部がぼやけて消えて
// しまうため、セル内の明るさのばらつきが大きい（＝輪郭を含む）場合は平均ではなく
// 最も暗いサブピクセルを代表色として優先する
// ══════════════════════════════════════
const CELL_SUPERSAMPLE = 8;
const EDGE_LUMA_STDDEV_THRESHOLD = 28;

// 背景の自動透明化：4隅の平均色を背景色とみなし、近い色を透明化した作業用
// canvasを返す（元のImageオブジェクトはUIでの表示用にそのまま保持する）
function buildAutoTransparentCanvas(image){
  const maxEdge = 512; // サンプリング用の作業解像度上限（パフォーマンスのため）
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const w = Math.max(1, Math.round(image.naturalWidth * scale));
  const h = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  let br = 0, bg = 0, bb = 0;
  corners.forEach(([x, y]) => {
    const i = (y * w + x) * 4;
    br += d[i]; bg += d[i + 1]; bb += d[i + 2];
  });
  br /= 4; bg /= 4; bb /= 4;
  const THRESH = 42;
  for(let i = 0; i < d.length; i += 4){
    const dist = Math.sqrt((d[i] - br) ** 2 + (d[i + 1] - bg) ** 2 + (d[i + 2] - bb) ** 2);
    if(dist < THRESH) d[i + 3] = 0;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// image: HTMLImageElement または HTMLCanvasElement（drawImageに渡せるもの）
// naturalW/naturalH: サンプリング元の実サイズ（rectはこの座標系）
function sampleCellColors(image, naturalW, naturalH, rect, w, h){
  const sampleW = w * CELL_SUPERSAMPLE;
  const sampleH = h * CELL_SUPERSAMPLE;
  const off = document.createElement("canvas");
  off.width = sampleW;
  off.height = sampleH;
  const octx = off.getContext("2d");
  octx.drawImage(image, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, sampleW, sampleH);
  const d = octx.getImageData(0, 0, sampleW, sampleH).data;

  const colors = new Array(w * h);
  const alphas = new Array(w * h);
  const isEdgeCell = new Array(w * h);
  for(let cy = 0; cy < h; cy++){
    for(let cx = 0; cx < w; cx++){
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      let minLuma = Infinity;
      let darkest = null;
      const lumas = [];
      for(let sy = 0; sy < CELL_SUPERSAMPLE; sy++){
        for(let sx = 0; sx < CELL_SUPERSAMPLE; sx++){
          const px = cx * CELL_SUPERSAMPLE + sx;
          const py = cy * CELL_SUPERSAMPLE + sy;
          const i = (py * sampleW + px) * 4;
          const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
          rSum += r; gSum += g; bSum += b; aSum += a;
          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          lumas.push(luma);
          if(luma < minLuma){ minLuma = luma; darkest = [r, g, b]; }
        }
      }
      const n = CELL_SUPERSAMPLE * CELL_SUPERSAMPLE;
      const avg = [rSum / n, gSum / n, bSum / n];
      const meanLuma = lumas.reduce((s, v) => s + v, 0) / n;
      const variance = lumas.reduce((s, v) => s + (v - meanLuma) ** 2, 0) / n;
      const edge = Math.sqrt(variance) > EDGE_LUMA_STDDEV_THRESHOLD;
      const idx = cy * w + cx;
      colors[idx] = edge ? darkest : avg;
      alphas[idx] = aSum / n;
      isEdgeCell[idx] = edge;
    }
  }
  return { colors, alphas, isEdgeCell };
}

function diffuseLabError(errors, w, h, x, y, diff){
  const spread = [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]];
  spread.forEach(([dx, dy, factor]) => {
    const nx = x + dx, ny = y + dy;
    if(nx < 0 || nx >= w || ny < 0 || ny >= h) return;
    const nidx = ny * w + nx;
    const add = [diff[0] * factor, diff[1] * factor, diff[2] * factor];
    errors[nidx] = errors[nidx]
      ? [errors[nidx][0] + add[0], errors[nidx][1] + add[1], errors[nidx][2] + add[2]]
      : add;
  });
}

// 画像1枚をw×hの2Dグリッドへ変換する（建材マッチング＋ディザリング＋輪郭保持）。
// 戻り値: { cells: [{materialId,hex,name}|null], rawColors: [[r,g,b]|null] }
// rawColorsは平面モードの起伏（高さ）算出に使う量子化前の色
function computeMatchedGrid(image, naturalW, naturalH, rect, w, h, autoTransparentBg){
  const src = autoTransparentBg ? buildAutoTransparentCanvas(image) : image;
  const srcW = autoTransparentBg ? src.width : naturalW;
  const srcH = autoTransparentBg ? src.height : naturalH;
  const scaleX = autoTransparentBg ? srcW / naturalW : 1;
  const scaleY = autoTransparentBg ? srcH / naturalH : 1;
  const scaledRect = autoTransparentBg
    ? { sx: rect.sx * scaleX, sy: rect.sy * scaleY, sw: rect.sw * scaleX, sh: rect.sh * scaleY }
    : rect;

  const supportItems = MATERIALS.support_pillars.items;
  const { colors, alphas, isEdgeCell } = sampleCellColors(src, srcW, srcH, scaledRect, w, h);

  const errors = new Array(w * h).fill(null);
  const cells = new Array(w * h);
  const rawColors = new Array(w * h);
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const idx = y * w + x;
      rawColors[idx] = alphas[idx] < 128 ? null : colors[idx];
      if(alphas[idx] < 128){
        cells[idx] = null;
        continue;
      }
      const lab = rgbToLab(colors[idx]);
      if(isEdgeCell[idx]){
        cells[idx] = nearestMaterialFromLab(lab, supportItems);
        continue;
      }
      const err = errors[idx];
      const dithered = err ? [lab[0] + err[0], lab[1] + err[1], lab[2] + err[2]] : lab;
      const match = nearestMaterialFromLab(dithered, supportItems);
      cells[idx] = match;
      const matchLab = rgbToLab(hexToRgb(match.hex));
      diffuseLabError(errors, w, h, x, y, [lab[0] - matchLab[0], lab[1] - matchLab[1], lab[2] - matchLab[2]]);
    }
  }
  return { cells, rawColors };
}

// ══════════════════════════════════════
// 2Dグリッド → 3Dボクセル配列
// ══════════════════════════════════════
function lumaOf(rgb){
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

// シルエット内部の「奥行き」を距離変換で推定する：塗りセルそれぞれについて、
// 最も近い「空セル、またはグリッドの外側」までの距離（4近傍のマンハッタン距離、
// 多始点BFS）を求め、シルエット内での最大値で正規化した0〜1の値を返す。
// 0＝輪郭のすぐ内側（薄い）、1＝シルエットの最も奥まった中心（厚い）。
// これを使って押し出しに丸み（ドーム状の膨らみ）を持たせる
function computeInteriorBulge(cells, w, h){
  const n = w * h;
  const distFromEmpty = new Array(n).fill(Infinity);
  const queue = [];
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const i = y * w + x;
      if(!cells[i]){ distFromEmpty[i] = 0; queue.push(i); }
    }
  }
  let qi = 0;
  while(qi < queue.length){
    const i = queue[qi++];
    const x = i % w, y = (i / w) | 0;
    const d = distFromEmpty[i];
    const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    for(const [nx, ny] of neighbors){
      if(nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const ni = ny * w + nx;
      if(distFromEmpty[ni] > d + 1){ distFromEmpty[ni] = d + 1; queue.push(ni); }
    }
  }
  const dist = new Array(n).fill(0);
  let maxDist = 1;
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const i = y * w + x;
      if(!cells[i]) continue;
      // グリッドの端も「外側」とみなした距離（クロップ端で切れているシルエットも
      // そこで薄くなるようにする）
      const edgeDist = Math.min(x + 1, w - x, y + 1, h - y);
      const d = Math.min(distFromEmpty[i], edgeDist);
      dist[i] = d;
      if(d > maxDist) maxDist = d;
    }
  }
  const bulge = new Array(n).fill(0);
  for(let i = 0; i < n; i++){
    if(cells[i]) bulge[i] = dist[i] / maxDist;
  }
  return bulge;
}

// solid（立体・像）：正面グリッドの各セルを、シルエット内部の奥行き推定
// （computeInteriorBulge）に応じた厚みぶんだけ奥行き方向へ押し出す。輪郭付近は
// 薄く、シルエットの中心に近いほど厚くなり、丸み（ドーム状の膨らみ）が出る。
// 背面画像がある場合は、各列の最も奥のボクセルだけ背面グリッドの色に置き換える。
// 画像の行y=0（画像の上端）は立体の最上部（ワールドY最大）に対応させる
// （そのまま使うと上下が反転してしまうため反転させる）。
// 空洞化：全6方向の隣接ボクセルが埋まっている（＝外から絶対に見えない）
// ボクセルだけを間引く
function buildSolidVoxels(frontGrid, backGrid, w, h, thickness, hollow){
  const bulge = computeInteriorBulge(frontGrid.cells, w, h);
  const centerZ = (thickness - 1) / 2;
  const key = (x, y, z) => `${x},${y},${z}`;
  const map = new Map();
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const idx = y * w + x;
      const front = frontGrid.cells[idx];
      if(!front) continue;
      const worldY = h - 1 - y;
      const halfDepth = Math.max(0.5, bulge[idx] * (thickness - 1) / 2);
      const zFrom = Math.max(0, Math.round(centerZ - halfDepth));
      const zTo = Math.min(thickness - 1, Math.round(centerZ + halfDepth));
      for(let z = zFrom; z <= zTo; z++){
        let material = front;
        if(z === zTo && backGrid){
          const back = backGrid.cells[idx];
          if(back) material = back;
        }
        map.set(key(x, worldY, z), material);
      }
    }
  }
  if(hollow){
    const filled = (x, y, z) => map.has(key(x, y, z));
    const toRemove = [];
    map.forEach((_, k) => {
      const [x, y, z] = k.split(",").map(Number);
      const surrounded =
        filled(x - 1, y, z) && filled(x + 1, y, z) &&
        filled(x, y - 1, z) && filled(x, y + 1, z) &&
        filled(x, y, z - 1) && filled(x, y, z + 1);
      if(surrounded) toRemove.push(k);
    });
    toRemove.forEach(k => map.delete(k));
  }
  const voxels = [];
  map.forEach((material, k) => {
    const [x, y, z] = k.split(",").map(Number);
    voxels.push({ x, y, z, materialId: material.materialId, hex: material.hex, name: material.name });
  });
  return voxels;
}

// flat（平面・床）：グリッドの各セルを、量子化前の明るさ（luma）に応じた
// 高さ（1〜thickness）まで積み上げる。明るいほど高い、という単純なヒューリスティックで
// AIによる高さ推測は行わない（3-4章のPhase 2対象）。空洞化は対象外（元々薄いため）
function buildFlatVoxels(grid, w, d, thickness){
  const voxels = [];
  for(let z = 0; z < d; z++){
    for(let x = 0; x < w; x++){
      const idx = z * w + x;
      const material = grid.cells[idx];
      if(!material) continue;
      let height = 1;
      if(thickness > 1){
        const raw = grid.rawColors[idx];
        const norm = raw ? lumaOf(raw) / 255 : 0.5;
        height = Math.max(1, Math.min(thickness, Math.round(1 + norm * (thickness - 1))));
      }
      for(let y = 0; y < height; y++){
        voxels.push({ x, y, z, materialId: material.materialId, hex: material.hex, name: material.name });
      }
    }
  }
  return voxels;
}

// ══════════════════════════════════════
// 生成の実行
// ══════════════════════════════════════
function runBuildGeneration(){
  if(!frontImage) return;
  const rect = manualCropRect || coverCropRect(frontImage.naturalWidth, frontImage.naturalHeight, settings.width, settings.width);
  const otherDim = computeOtherDim();

  const frontGrid = computeMatchedGrid(
    frontImage, frontImage.naturalWidth, frontImage.naturalHeight,
    rect, settings.width, otherDim, settings.autoTransparentBg
  );

  if(settings.mode === "solid"){
    let backGrid = null;
    if(backImage){
      const backRect = coverCropRect(backImage.naturalWidth, backImage.naturalHeight, settings.width, otherDim);
      backGrid = computeMatchedGrid(
        backImage, backImage.naturalWidth, backImage.naturalHeight,
        backRect, settings.width, otherDim, settings.autoTransparentBg
      );
    }
    resultVoxels = buildSolidVoxels(frontGrid, backGrid, settings.width, otherDim, settings.thickness, settings.hollow);
    resultDims = { w: settings.width, h: otherDim, d: settings.thickness };
  }else{
    resultVoxels = buildFlatVoxels(frontGrid, settings.width, otherDim, settings.thickness);
    resultDims = { w: settings.width, h: settings.thickness, d: otherDim };
  }

  ensureSceneInitialized();
  setupProgressSlider();
  Build3D.setVoxels(getVisibleVoxels());
  renderBuildMaterialList();
  clearHistory();
}

// ══════════════════════════════════════
// 3Dビューア初期化
// ══════════════════════════════════════
let sceneInitialized = false;
function ensureSceneInitialized(){
  const canvas = document.getElementById("buildCanvas");
  if(!canvas) return;
  if(!sceneInitialized){
    Build3D.init(canvas, { w: SITE_MAX_WIDTH, h: SITE_MAX_HEIGHT, d: SITE_MAX_DEPTH });
    Build3D.setBackgroundColor(document.body.classList.contains("dark") ? 0x2c2823 : 0xf3ecdc);
    Build3D.setEditClickCallback(handleEditClick);
    sceneInitialized = true;
  }
}

// ══════════════════════════════════════
// 建材一覧（列＝(x,z)ごとに、縦方向へ同じ建材が続く区間を1本の支柱として
// まとめる。支柱は1マス×1マスの設置面に対して高さ方向へ伸縮するため、この
// 数え方が実際の建て方に最も近い）
// ══════════════════════════════════════
function computeBuildPillarSegments(){
  if(!resultVoxels || !resultDims) return [];
  const map = new Map();
  resultVoxels.forEach(v => map.set(`${v.x},${v.y},${v.z}`, v));

  const segments = [];
  for(let z = 0; z < resultDims.d; z++){
    for(let x = 0; x < resultDims.w; x++){
      let run = null;
      for(let y = 0; y < resultDims.h; y++){
        const v = map.get(`${x},${y},${z}`);
        const key = v ? v.materialId + "_" + v.hex : null;
        if(run && run.key === key){
          run.height++;
        }else{
          if(run && run.key) segments.push(run);
          run = key ? { key, name: v.name, hex: v.hex, height: 1 } : null;
        }
      }
      if(run && run.key) segments.push(run);
    }
  }
  return segments;
}

function renderBuildMaterialList(){
  if(!resultVoxels) return;
  const cellCount = resultVoxels.length;
  const segments = computeBuildPillarSegments();

  const counts = {};
  segments.forEach(seg => {
    const key = seg.key + "_" + seg.height;
    if(!counts[key]) counts[key] = { name: seg.name, hex: seg.hex, height: seg.height, count: 0 };
    counts[key].count++;
  });
  const entries = Object.values(counts).sort((a, b) => b.count - a.count);
  const materialTypeCount = new Set(segments.map(s => s.key)).size;

  document.getElementById("buildMaterialCount").textContent = materialTypeCount;
  document.getElementById("buildCellCount").textContent = cellCount.toLocaleString();
  document.getElementById("buildPillarCount").textContent = segments.length.toLocaleString();

  document.getElementById("buildMaterialRows").innerHTML = entries.map(e => `
    <div class="art-result-color-row">
      <span class="art-result-color-swatch" style="background:${e.hex}"></span>
      <span class="art-result-color-code">${e.name}${T("build_pillar_height_suffix", "（高さ{n}マス）").replace("{n}", e.height)}</span>
      <span class="art-result-color-count">${e.count}${T("build_unit_pillars", "本")}</span>
    </div>
  `).join("");
}

// ══════════════════════════════════════
// 最初からやり直す
// ══════════════════════════════════════
function resetBuildToUpload(){
  frontImage = null;
  backImage = null;
  resultVoxels = null;
  resultDims = null;
  manualCropRect = null;
  cropTargetKey = null;
  renderBackPreview();
  document.getElementById("buildFrontPreviewWrap").style.display = "none";
  document.getElementById("buildProceedBtn").disabled = true;
  document.getElementById("buildUploadBtnLabel").textContent = T("art_choose_image", "画像を選ぶ");
  document.getElementById("buildResultStage").style.display = "none";
  document.getElementById("buildCropStage").style.display = "none";
  document.getElementById("buildUploadArea").style.display = "block";
  updateBuildStepProgress("upload");
}

// ══════════════════════════════════════
// 設計図の保存・一覧・読込・削除・書き出し
// ══════════════════════════════════════
const BUILD_DESIGN_FORMAT_VERSION = 2; // v1=旧2D壁画形式（cells配列）。v2=3Dボクセル形式（voxels配列）

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
  el.innerHTML = savedDesigns.slice().reverse().map(d => {
    const legacy = d.formatVersion !== BUILD_DESIGN_FORMAT_VERSION;
    const dimsLabel = legacy
      ? `${d.width}×${d.height}`
      : `${d.dims.w}×${d.dims.h}×${d.dims.d}`;
    return `
    <div class="build-library-item">
      <span class="build-library-item-name">${escapeHtml(d.name)}（${dimsLabel}）${legacy ? `<br><span style="color:var(--vermillion);font-size:10px;">${T("build_legacy_design_note", "※旧バージョンの設計図（壁画モード）は読み込めません")}</span>` : ""}</span>
      <div class="build-library-item-actions">
        <button type="button" data-action="load" data-id="${d.id}" ${legacy ? "disabled" : ""}>${T("build_library_load", "読込")}</button>
        <button type="button" data-action="delete" data-id="${d.id}">${T("build_library_delete", "削除")}</button>
      </div>
    </div>
  `;
  }).join("");
  el.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if(btn.dataset.action === "load") loadDesign(id);
      else if(btn.dataset.action === "delete") deleteDesign(id);
    });
  });
}

function saveBuildDesign(){
  if(!resultVoxels || !resultDims){
    alert(T("build_save_no_result", "先に画像を変換してください"));
    return;
  }
  const nameInput = document.getElementById("buildDesignNameInput");
  const name = nameInput.value.trim() || T("build_design_default_name", "無題の設計図");
  savedDesigns.push({
    id: generateDesignId(),
    formatVersion: BUILD_DESIGN_FORMAT_VERSION,
    name,
    mode: settings.mode,
    dims: resultDims,
    voxels: resultVoxels,
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
  if(!design || design.formatVersion !== BUILD_DESIGN_FORMAT_VERSION) return;
  frontImage = null;
  backImage = null;
  manualCropRect = null;
  settings.mode = design.mode;
  resultDims = design.dims;
  resultVoxels = design.voxels.map(v => ({ ...v }));
  document.getElementById("buildUploadArea").style.display = "none";
  document.getElementById("buildCropStage").style.display = "none";
  document.getElementById("buildResultStage").style.display = "block";
  document.getElementById("buildDesignNameInput").value = design.name;
  ensureSceneInitialized();
  setupProgressSlider();
  Build3D.setVoxels(getVisibleVoxels());
  renderBuildMaterialList();
  clearHistory();
  updateBuildStepProgress("finish");
}

function deleteDesign(id){
  if(!confirm(T("build_delete_confirm", "この設計図を削除しますか？"))) return;
  savedDesigns = savedDesigns.filter(d => d.id !== id);
  persistSavedDesigns();
  renderBuildLibraryList();
}

function exportBuildDesigns(){
  const backup = {
    version: BUILD_DESIGN_FORMAT_VERSION,
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

// ══════════════════════════════════════
// 初期化
// ══════════════════════════════════════
const BUILD_TUTORIAL_DONE_KEY = "hatopiBuild_tutorialDone";
const BUILD_TUTORIAL_STEPS = [
  { selector: "#buildUploadBtn", titleKey: "tutorial_build_step1_title", titleFallback: "① 画像を選ぶ", textKey: "tutorial_build_step1_body", textFallback: "画像をアップロードし、立体(像)か平面(床)かを選んでサイズ・厚さを指定します。" },
  { selector: "#buildLibraryPanel", titleKey: "tutorial_build_step2_title", titleFallback: "② 設計図を保存・管理", textKey: "tutorial_build_step2_body", textFallback: "保存した設計図はここから呼び出せます。JSON形式での書き出し・読み込みも可能です。" },
  { selector: "#helpBtn", titleKey: "tutorial_build_step3_title", titleFallback: "③ 使い方をもっと見る", textKey: "tutorial_build_step3_body", textFallback: "変換の流れなど、詳しい使い方はこのボタンから見返せます。" },
];

function initBuildPage(){
  loadSavedDesigns();
  renderBuildLibraryList();
  bindBuildStepProgress();
  updateBuildStepProgress("upload");
  updateBackImageVisibility();
  maybeStartPageTutorial(BUILD_TUTORIAL_DONE_KEY, BUILD_TUTORIAL_STEPS);

  const fileInput = document.getElementById("buildFileInput");
  document.getElementById("buildUploadBtn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    if(e.target.files && e.target.files[0]) handleFrontFileSelect(e.target.files[0]);
  });
  document.getElementById("buildProceedBtn").addEventListener("click", () => {
    if(frontImage) openBuildCropStage(true);
  });

  const backFileInput = document.getElementById("buildBackFileInput");
  document.getElementById("buildBackUploadBtn").addEventListener("click", () => backFileInput.click());
  backFileInput.addEventListener("change", (e) => {
    if(e.target.files && e.target.files[0]) handleBackFileSelect(e.target.files[0]);
  });
  document.getElementById("buildBackRemoveBtn").addEventListener("click", clearBackImage);

  document.querySelectorAll(".build-mode-btn").forEach(btn => {
    btn.addEventListener("click", () => setBuildMode(btn.dataset.mode));
  });

  document.getElementById("buildWidthInput").addEventListener("input", handleOptionInputChange);
  document.getElementById("buildThicknessInput").addEventListener("input", handleOptionInputChange);
  document.getElementById("buildHollowCheckbox").addEventListener("change", readOptionInputs);
  document.getElementById("buildAutoTransparentCheckbox").addEventListener("change", readOptionInputs);

  document.getElementById("buildAdjustBtn").addEventListener("click", () => openBuildCropStage(false));
  document.getElementById("buildNewImageBtn").addEventListener("click", resetBuildToUpload);
  document.getElementById("buildSaveDesignBtn").addEventListener("click", saveBuildDesign);
  document.getElementById("buildExportBtn").addEventListener("click", exportBuildDesigns);
  document.getElementById("buildImportBtn").addEventListener("click", () => document.getElementById("buildImportInput").click());
  document.getElementById("buildImportInput").addEventListener("change", importBuildDesigns);

  // 手動編集ツールバー
  const firstMaterial = MATERIALS.support_pillars.items[0];
  selectedMaterial = { materialId: firstMaterial.id, hex: firstMaterial.colors[0], name: firstMaterial.name };
  updateSelectedSwatch();
  document.getElementById("buildToolPenBtn").addEventListener("click", () => setEditTool("pen"));
  document.getElementById("buildToolEraserBtn").addEventListener("click", () => setEditTool("eraser"));
  document.getElementById("buildPaletteBtn").addEventListener("click", openMaterialPickerModal);
  document.getElementById("buildMaterialPickerCloseBtn").addEventListener("click", closeMaterialPickerModal);
  document.getElementById("buildMaterialPickerModal").addEventListener("click", (e) => {
    if(e.target.id === "buildMaterialPickerModal") closeMaterialPickerModal();
  });
  document.getElementById("buildUndoBtn").addEventListener("click", undoEdit);
  document.getElementById("buildRedoBtn").addEventListener("click", redoEdit);
  document.getElementById("buildProgressSlider").addEventListener("input", handleProgressSliderChange);

  document.addEventListener("darkmodechange", () => {
    if(sceneInitialized){
      Build3D.setBackgroundColor(document.body.classList.contains("dark") ? 0x2c2823 : 0xf3ecdc);
    }
  });
}

document.addEventListener("langchange", () => {
  if(resultVoxels) renderBuildMaterialList();
  renderBuildLibraryList();
});

initBuildPage();
