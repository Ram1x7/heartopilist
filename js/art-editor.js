// js/art-editor.js
// 「アート」ページ（art-create.html）のCanvasエディター
// Phase 2: ペン・消しゴム・バケツ・スポイト、カラーパレット・カスタムカラー、ズーム、使用色の集計・ハイライト
// Phase 3: Undo/Redo（スナップショット方式、最大50段階）
// Phase 4.5: キャンバスの「実データのマス数」と「画面上の表示サイズ」を分離し、
//   正方形以外の比率にも対応（1マスは常に正方形として描画）
// キャンバスサイズはjs/art-config.jsのFREE_CANVAS_SIZES（固定4サイズ）から選択する

const BASE_CELL = 16; // 100%ズーム時の1マスのピクセルサイズ
const ZOOM_LEVELS = [25, 50, 100, 200, 400, 800, 1600];
const BASE_PALETTE = [
  "#e0453c", "#e58a2e", "#e8c93c", "#5a9e4a",
  "#4fb0c6", "#3c5a6e", "#8a5ec7", "#e06fa0",
  "#8a5a3c", "#2b2620", "#fdf9ef", "#9a9488",
];
const DRAFT_KEY = "hatopiArt_currentDraft";
const CUSTOM_COLORS_KEY = "hatopiArt_customColors";
const MAX_HISTORY = 50;
const BLOCK_SIZE = 10;

let gridWidth = 30;
let gridHeight = 30;
let pixels = [];
let customColors = [];
let currentColor = BASE_PALETTE[0];
let currentTool = "pen";
let zoom = 100;
let highlightedColor = null;
let isDrawing = false;
let lastCell = null;
let saveTimer = null;
let undoStack = [];
let redoStack = [];
let colorNumberMap = {};
let showColorNumbers = false;
let showCellNumbers = false;
let blockMode = false;
let blockStatus = {};

const canvas = document.getElementById("artCanvas");
const ctx = canvas.getContext("2d");

// ── 初期化 ──
function initArtEditor(){
  try{
    customColors = JSON.parse(localStorage.getItem(CUSTOM_COLORS_KEY) || "[]");
  }catch(e){
    customColors = [];
  }

  const draft = loadDraft();
  if(draft && draft.width && draft.height && Array.isArray(draft.pixelData)){
    gridWidth = draft.width;
    gridHeight = draft.height;
    pixels = draft.pixelData.slice();
    blockStatus = draft.blockStatus || {};
  }else{
    renderFreeSizeOptions();
    document.getElementById("gridSizeModal").style.display = "block";
  }

  renderToolbar();
  renderZoomControls();
  renderPalette();
  renderCanvas();
  updateColorUsage();
  renderBlockList();
  bindCanvasEvents();
  bindDisplayToggles();
}

// ── 表示切替（色番号・マス番号・ブロック表示） ──
function bindDisplayToggles(){
  document.getElementById("artColorNumberToggle").addEventListener("change", (e) => {
    showColorNumbers = e.target.checked;
    renderCanvas();
  });
  document.getElementById("artCellNumberToggle").addEventListener("change", (e) => {
    showCellNumbers = e.target.checked;
    renderCanvas();
  });
  document.getElementById("artBlockModeToggle").addEventListener("change", (e) => {
    blockMode = e.target.checked;
    renderToolbar();
    renderCanvas();
    renderBlockList();
  });
}

// ── 新規キャンバス作成モーダル（固定4サイズから選択。すべて正方形） ──
function renderFreeSizeOptions(){
  const el = document.getElementById("artFreeSizeOptions");
  el.innerHTML = FREE_CANVAS_SIZES.map(s => `
    <button onclick="createCanvas(${s}, ${s})">${s} × ${s}</button>
  `).join("");
}

function createCanvas(w, h){
  gridWidth = w;
  gridHeight = h;
  pixels = new Array(w * h).fill(null);
  blockStatus = {};
  undoStack = [];
  redoStack = [];
  document.getElementById("gridSizeModal").style.display = "none";
  renderCanvas();
  updateColorUsage();
  updateUndoRedoButtons();
  renderBlockList();
  saveDraft();
}

// ── ツールバー ──
const TOOLS = [
  { id: "pen", icon: "pen", labelKey: "art_tool_pen", labelFallback: "ペン" },
  { id: "eraser", icon: "eraser", labelKey: "art_tool_eraser", labelFallback: "消しゴム" },
  { id: "bucket", icon: "bucket", labelKey: "art_tool_bucket", labelFallback: "バケツ" },
  { id: "eyedropper", icon: "eyedropper", labelKey: "art_tool_eyedropper", labelFallback: "スポイト" },
];

function renderToolbar(){
  const el = document.getElementById("artToolbar");
  el.classList.toggle("art-toolbar-disabled", blockMode);
  const toolButtons = TOOLS.map(t => `
    <button class="art-tool-btn${currentTool === t.id ? " active" : ""}" onclick="setTool('${t.id}')" aria-label="${T(t.labelKey, t.labelFallback)}" aria-pressed="${currentTool === t.id}">
      ${icon(t.icon, { size: 18 })}
    </button>
  `).join("");
  const undoRedoButtons = `
    <button class="art-tool-btn" id="artUndoBtn" onclick="undo()" aria-label="${T('art_undo', '元に戻す')}" ${undoStack.length === 0 ? "disabled" : ""}>
      ${icon("undo", { size: 18 })}
    </button>
    <button class="art-tool-btn" id="artRedoBtn" onclick="redo()" aria-label="${T('art_redo', 'やり直す')}" ${redoStack.length === 0 ? "disabled" : ""}>
      ${icon("redo", { size: 18 })}
    </button>
  `;
  const clearButton = `
    <button class="art-tool-btn" onclick="clearAll()" aria-label="${T('art_tool_clear', '全消去')}">
      ${icon("trash", { size: 18 })}
    </button>
  `;
  el.innerHTML = toolButtons + undoRedoButtons + clearButton;
}

function updateUndoRedoButtons(){
  const undoBtn = document.getElementById("artUndoBtn");
  const redoBtn = document.getElementById("artRedoBtn");
  if(undoBtn) undoBtn.disabled = undoStack.length === 0;
  if(redoBtn) redoBtn.disabled = redoStack.length === 0;
}

// ── Undo / Redo（スナップショット方式） ──
// スナップショットはpixelsに加えgridWidth/gridHeightも保持する
// （キャンバスサイズ変更もUndo/Redo対象にするため）
function snapshotState(){
  return { pixels: pixels.slice(), width: gridWidth, height: gridHeight };
}

function pushHistory(){
  undoStack.push(snapshotState());
  if(undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateUndoRedoButtons();
}

function restoreSnapshot(snap){
  pixels = snap.pixels;
  gridWidth = snap.width;
  gridHeight = snap.height;
  highlightedColor = null;
  renderCanvas();
  updateColorUsage();
  renderBlockList();
  saveDraftDebounced();
}

function undo(){
  if(undoStack.length === 0) return;
  redoStack.push(snapshotState());
  restoreSnapshot(undoStack.pop());
  updateUndoRedoButtons();
}

function redo(){
  if(redoStack.length === 0) return;
  undoStack.push(snapshotState());
  restoreSnapshot(redoStack.pop());
  updateUndoRedoButtons();
}

function setTool(tool){
  currentTool = tool;
  renderToolbar();
}

// ── ズーム ──
function renderZoomControls(){
  const el = document.getElementById("artZoomControls");
  el.innerHTML = `
    <button onclick="zoomOut()" aria-label="${T('art_zoom_out', '縮小')}">${icon("minus", { size: 16 })}</button>
    <span class="art-zoom-label" id="artZoomLabel">${zoom}%</span>
    <button onclick="zoomIn()" aria-label="${T('art_zoom_in', '拡大')}">${icon("plus", { size: 16 })}</button>
    <button class="art-zoom-text-btn" onclick="zoomReset()">100%</button>
    <button class="art-zoom-text-btn" onclick="zoomFit()">${T('art_zoom_fit', '画面に合わせる')}</button>
  `;
}

function updateZoomLabel(){
  const el = document.getElementById("artZoomLabel");
  if(el) el.textContent = zoom + "%";
}

function zoomIn(){
  const i = ZOOM_LEVELS.indexOf(zoom);
  zoom = ZOOM_LEVELS[Math.min(i + 1, ZOOM_LEVELS.length - 1)];
  renderCanvas();
  updateZoomLabel();
}

function zoomOut(){
  const i = ZOOM_LEVELS.indexOf(zoom);
  zoom = ZOOM_LEVELS[Math.max(i - 1, 0)];
  renderCanvas();
  updateZoomLabel();
}

function zoomReset(){
  zoom = 100;
  renderCanvas();
  updateZoomLabel();
}

function zoomFit(){
  const area = document.querySelector(".art-canvas-area");
  const availW = Math.max(area.clientWidth - 32, 40);
  const availH = Math.max(area.clientHeight - 32, 40);
  const fitCell = Math.min(availW / gridWidth, availH / gridHeight);
  const fitZoomRaw = (fitCell / BASE_CELL) * 100;
  let best = ZOOM_LEVELS[0];
  ZOOM_LEVELS.forEach(z => { if(z <= fitZoomRaw) best = z; });
  zoom = best;
  renderCanvas();
  updateZoomLabel();
}

// ── カラーパレット ──
function renderPalette(){
  const el = document.getElementById("artPalette");
  const swatches = [...BASE_PALETTE, ...customColors];
  el.innerHTML = swatches.map(c => `
    <button class="art-swatch${c === currentColor ? " active" : ""}" style="background:${c}" onclick="setCurrentColor('${c}')" aria-label="${c}"></button>
  `).join("");
}

function setCurrentColor(c){
  currentColor = c;
  renderPalette();
}

function addCustomColor(){
  const input = document.getElementById("artHexInput");
  let hex = input.value.trim();
  if(!hex) return;
  if(!hex.startsWith("#")) hex = "#" + hex;
  if(!/^#[0-9a-fA-F]{6}$/.test(hex)){
    alert(T("art_invalid_hex", "カラーコードの形式が正しくありません（例：#FF0000）"));
    return;
  }
  if(!customColors.includes(hex)){
    customColors.push(hex);
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(customColors));
  }
  setCurrentColor(hex);
  input.value = "";
}

document.getElementById("artAddColorBtn").addEventListener("click", addCustomColor);
document.getElementById("artColorPicker").addEventListener("input", (e) => {
  setCurrentColor(e.target.value);
});

// ── 使用色の集計・ハイライト ──
function updateColorUsage(){
  const counts = {};
  pixels.forEach(c => { if(c) counts[c] = (counts[c] || 0) + 1; });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  colorNumberMap = {};
  entries.forEach(([c], i) => { colorNumberMap[c] = String(i + 1).padStart(2, "0"); });
  const el = document.getElementById("artColorUsage");
  el.innerHTML = entries.length
    ? entries.map(([c, n]) => `
        <div class="art-usage-row${highlightedColor === c ? " active" : ""}" onclick="toggleHighlight('${c}')">
          <span class="art-usage-number">${colorNumberMap[c]}</span>
          <span class="art-usage-swatch" style="background:${c}"></span>
          <span class="art-usage-count">${n}${T("art_unit_cells", "マス")}</span>
        </div>
      `).join("")
    : `<div class="art-usage-empty">${T("art_usage_empty", "まだ何も塗られていません")}</div>`;
}

function toggleHighlight(c){
  highlightedColor = highlightedColor === c ? null : c;
  updateColorUsage();
  renderCanvas();
}

// ── 描画（1マスは常に正方形。gridWidth/gridHeightが異なっても比率を維持） ──
function renderCanvas(){
  const cell = BASE_CELL * zoom / 100;
  canvas.width = gridWidth * cell;
  canvas.height = gridHeight * cell;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for(let y = 0; y < gridHeight; y++){
    for(let x = 0; x < gridWidth; x++){
      const c = pixels[y * gridWidth + x];
      if(c){
        ctx.fillStyle = c;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  if(highlightedColor){
    ctx.fillStyle = document.body.classList.contains("dark") ? "rgba(26,24,20,0.6)" : "rgba(255,255,255,0.65)";
    for(let y = 0; y < gridHeight; y++){
      for(let x = 0; x < gridWidth; x++){
        if(pixels[y * gridWidth + x] !== highlightedColor){
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
  }

  if(cell >= 6){
    ctx.strokeStyle = document.body.classList.contains("dark") ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    for(let i = 0; i <= gridWidth; i++){
      ctx.beginPath();
      ctx.moveTo(i * cell + 0.5, 0);
      ctx.lineTo(i * cell + 0.5, canvas.height);
      ctx.stroke();
    }
    for(let i = 0; i <= gridHeight; i++){
      ctx.beginPath();
      ctx.moveTo(0, i * cell + 0.5);
      ctx.lineTo(canvas.width, i * cell + 0.5);
      ctx.stroke();
    }
  }

  if((showColorNumbers || showCellNumbers) && cell >= 12){
    drawCellLabels(cell);
  }

  if(blockMode){
    drawBlockOverlay(cell);
  }
}

// ── 色番号・マス番号ラベル ──
function drawCellLabels(cell){
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = Math.max(6, Math.floor(cell * 0.38));
  ctx.font = `${fontSize}px sans-serif`;
  ctx.lineWidth = Math.max(1, fontSize * 0.22);
  for(let y = 0; y < gridHeight; y++){
    for(let x = 0; x < gridWidth; x++){
      const idx = y * gridWidth + x;
      let label = "";
      if(showCellNumbers){
        label = String(idx + 1).padStart(3, "0");
      }else if(showColorNumbers && pixels[idx]){
        label = colorNumberMap[pixels[idx]] || "";
      }
      if(!label) continue;
      const px = x * cell + cell / 2, py = y * cell + cell / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.strokeText(label, px, py);
      ctx.fillStyle = "#1a1814";
      ctx.fillText(label, px, py);
    }
  }
}

// ── 10×10ブロック表示（境界線・進捗状態の色分け・番号） ──
function blockKey(bx, by){
  return bx + "_" + by;
}

function drawBlockOverlay(cell){
  const blocksX = Math.ceil(gridWidth / BLOCK_SIZE);
  const blocksY = Math.ceil(gridHeight / BLOCK_SIZE);
  const dark = document.body.classList.contains("dark");
  const statusFill = {
    1: dark ? "rgba(232,201,60,0.22)" : "rgba(232,201,60,0.28)",
    2: dark ? "rgba(90,158,74,0.28)" : "rgba(90,158,74,0.26)",
  };

  for(let by = 0; by < blocksY; by++){
    for(let bx = 0; bx < blocksX; bx++){
      const bw = Math.min(BLOCK_SIZE, gridWidth - bx * BLOCK_SIZE);
      const bh = Math.min(BLOCK_SIZE, gridHeight - by * BLOCK_SIZE);
      const px = bx * BLOCK_SIZE * cell, py = by * BLOCK_SIZE * cell;
      const status = blockStatus[blockKey(bx, by)] || 0;
      if(statusFill[status]){
        ctx.fillStyle = statusFill[status];
        ctx.fillRect(px, py, bw * cell, bh * cell);
      }
    }
  }

  ctx.strokeStyle = dark ? "rgba(232,201,60,0.9)" : "rgba(177,80,59,0.85)";
  ctx.lineWidth = 2.5;
  for(let bx = 0; bx <= blocksX; bx++){
    const x = Math.min(bx * BLOCK_SIZE, gridWidth) * cell;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for(let by = 0; by <= blocksY; by++){
    const y = Math.min(by * BLOCK_SIZE, gridHeight) * cell;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  if(cell >= 8){
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const fontSize = Math.max(9, Math.floor(cell * 0.7));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.lineWidth = Math.max(1, fontSize * 0.22);
    for(let by = 0; by < blocksY; by++){
      for(let bx = 0; bx < blocksX; bx++){
        const num = by * blocksX + bx + 1;
        const px = bx * BLOCK_SIZE * cell, py = by * BLOCK_SIZE * cell;
        const label = String(num).padStart(2, "0");
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.strokeText(label, px + 3, py + 2);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillText(label, px + 3, py + 2);
      }
    }
  }
}

// ── ポインター操作（マウス・タッチ・Apple Pencil共通） ──
function cellFromEvent(e){
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  const cell = BASE_CELL * zoom / 100;
  const cx = Math.floor(x / cell);
  const cy = Math.floor(y / cell);
  if(cx < 0 || cy < 0 || cx >= gridWidth || cy >= gridHeight) return null;
  return { cx, cy };
}

function applyToolAt(cx, cy){
  const idx = cy * gridWidth + cx;
  if(currentTool === "pen"){
    pixels[idx] = currentColor;
  }else if(currentTool === "eraser"){
    pixels[idx] = null;
  }else if(currentTool === "bucket"){
    floodFill(cx, cy, currentColor);
  }else if(currentTool === "eyedropper"){
    if(pixels[idx]){
      setCurrentColor(pixels[idx]);
    }
    setTool("pen");
  }
}

function floodFill(cx, cy, color){
  const startIdx = cy * gridWidth + cx;
  const target = pixels[startIdx];
  if(target === color) return;
  const stack = [[cx, cy]];
  while(stack.length){
    const [x, y] = stack.pop();
    if(x < 0 || y < 0 || x >= gridWidth || y >= gridHeight) continue;
    const i = y * gridWidth + x;
    if(pixels[i] !== target) continue;
    pixels[i] = color;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

function bindCanvasEvents(){
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    const c = cellFromEvent(e);
    updateCoordReadout(c);
    if(!c) return;

    if(blockMode){
      cycleBlockStatus(Math.floor(c.cx / BLOCK_SIZE), Math.floor(c.cy / BLOCK_SIZE));
      return;
    }

    isDrawing = true;
    if(currentTool !== "eyedropper") pushHistory();
    applyToolAt(c.cx, c.cy);
    lastCell = c;
    renderCanvas();
  });

  canvas.addEventListener("pointermove", (e) => {
    const c = cellFromEvent(e);
    updateCoordReadout(c);
    if(!isDrawing || blockMode) return;

    if(currentTool !== "pen" && currentTool !== "eraser") return;
    if(c && (!lastCell || c.cx !== lastCell.cx || c.cy !== lastCell.cy)){
      applyToolAt(c.cx, c.cy);
      lastCell = c;
      renderCanvas();
    }
  });

  const finishStroke = () => {
    if(!isDrawing) return;
    isDrawing = false;
    lastCell = null;
    updateColorUsage();
    saveDraftDebounced();
  };
  canvas.addEventListener("pointerup", finishStroke);
  canvas.addEventListener("pointercancel", finishStroke);
  canvas.addEventListener("pointerleave", (e) => {
    finishStroke();
    updateCoordReadout(null);
  });
}

function updateCoordReadout(c){
  const el = document.getElementById("artCoordReadout");
  if(!el) return;
  if(c){
    el.textContent = `X: ${String(c.cx).padStart(2, "0")}  Y: ${String(c.cy).padStart(2, "0")}`;
    el.style.display = "block";
  }else{
    el.style.display = "none";
  }
}

// ── ブロック進捗の切り替え・一覧・拡大表示 ──
function cycleBlockStatus(bx, by){
  const key = blockKey(bx, by);
  const cur = blockStatus[key] || 0;
  const next = (cur + 1) % 3;
  if(next === 0) delete blockStatus[key];
  else blockStatus[key] = next;
  renderCanvas();
  renderBlockList();
  saveDraftDebounced();
}

function renderBlockList(){
  const el = document.getElementById("artBlockList");
  if(!el) return;
  if(!blockMode){
    el.innerHTML = "";
    return;
  }
  const blocksX = Math.ceil(gridWidth / BLOCK_SIZE);
  const blocksY = Math.ceil(gridHeight / BLOCK_SIZE);
  const statusIcon = { 0: "□", 1: "◐", 2: "✓" };
  let html = "";
  for(let by = 0; by < blocksY; by++){
    for(let bx = 0; bx < blocksX; bx++){
      const num = by * blocksX + bx + 1;
      const status = blockStatus[blockKey(bx, by)] || 0;
      html += `<button class="art-block-btn art-block-status-${status}" onclick="zoomToBlock(${bx},${by})">${statusIcon[status]} ${String(num).padStart(2, "0")}</button>`;
    }
  }
  el.innerHTML = html;
}

function zoomToBlock(bx, by){
  blockMode = false;
  const toggle = document.getElementById("artBlockModeToggle");
  if(toggle) toggle.checked = false;

  const bw = Math.min(BLOCK_SIZE, gridWidth - bx * BLOCK_SIZE);
  const bh = Math.min(BLOCK_SIZE, gridHeight - by * BLOCK_SIZE);
  const area = document.querySelector(".art-canvas-area");
  const availW = Math.max(area.clientWidth - 32, 40);
  const availH = Math.max(area.clientHeight - 32, 40);
  const fitCell = Math.min(availW / bw, availH / bh);
  const fitZoomRaw = (fitCell / BASE_CELL) * 100;
  let best = ZOOM_LEVELS[0];
  ZOOM_LEVELS.forEach(z => { if(z <= fitZoomRaw) best = z; });
  zoom = best;

  renderToolbar();
  renderCanvas();
  updateZoomLabel();
  renderBlockList();

  const cell = BASE_CELL * zoom / 100;
  area.scrollLeft = Math.max(0, (bx * BLOCK_SIZE + bw / 2) * cell - area.clientWidth / 2);
  area.scrollTop = Math.max(0, (by * BLOCK_SIZE + bh / 2) * cell - area.clientHeight / 2);
}

// ── 全消去 ──
function clearAll(){
  if(!confirm(T("art_confirm_clear", "すべて消去しますか？（Undoで元に戻せます）"))) return;
  pushHistory();
  pixels = new Array(gridWidth * gridHeight).fill(null);
  highlightedColor = null;
  renderCanvas();
  updateColorUsage();
  saveDraft();
}

// ── 下書きの自動保存（単一スロット。複数下書き管理は次フェーズで対応） ──
function saveDraft(){
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ width: gridWidth, height: gridHeight, pixelData: pixels, blockStatus }));
}

function saveDraftDebounced(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 500);
}

function loadDraft(){
  try{
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){
    return null;
  }
}

// ── キーボードショートカット（PC向け：Ctrl/Cmd+Z で元に戻す、Shift併用でやり直す） ──
document.addEventListener("keydown", (e) => {
  if(!(e.ctrlKey || e.metaKey)) return;
  const key = e.key.toLowerCase();
  if(key === "z" && !e.shiftKey){
    e.preventDefault();
    undo();
  }else if((key === "z" && e.shiftKey) || key === "y"){
    e.preventDefault();
    redo();
  }
});

// 言語切替時に動的コンテンツ（i18n読み込み前に描画されたUI）を再描画
document.addEventListener("langchange", () => {
  renderToolbar();
  renderZoomControls();
  updateColorUsage();
  if(document.getElementById("gridSizeModal").style.display !== "none"){
    renderFreeSizeOptions();
  }
});

initArtEditor();
