// js/art-editor.js
// 「アート」ページ（art-create.html）のCanvasエディター（Phase 2: 基本描画）
// ペン・消しゴム・バケツ・スポイト、カラーパレット・カスタムカラー、
// ズーム、使用色の集計・ハイライトを実装。Undo/Redoは次フェーズで対応。

const BASE_CELL = 16; // 100%ズーム時の1マスのピクセルサイズ
const ZOOM_LEVELS = [25, 50, 100, 200, 400, 800, 1600];
const BASE_PALETTE = [
  "#e0453c", "#e58a2e", "#e8c93c", "#5a9e4a",
  "#4fb0c6", "#3c5a6e", "#8a5ec7", "#e06fa0",
  "#8a5a3c", "#2b2620", "#fdf9ef", "#9a9488",
];
const DRAFT_KEY = "hatopiArt_currentDraft";
const CUSTOM_COLORS_KEY = "hatopiArt_customColors";

let gridSize = 32;
let pixels = [];
let customColors = [];
let currentColor = BASE_PALETTE[0];
let currentTool = "pen";
let zoom = 100;
let highlightedColor = null;
let isDrawing = false;
let lastCell = null;
let saveTimer = null;

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
  if(draft && draft.width && Array.isArray(draft.pixelData)){
    gridSize = draft.width;
    pixels = draft.pixelData.slice();
  }else{
    document.getElementById("gridSizeModal").style.display = "block";
  }

  renderToolbar();
  renderZoomControls();
  renderPalette();
  renderGridSizeOptions();
  renderCanvas();
  updateColorUsage();
  bindCanvasEvents();
}

// ── キャンバスサイズ選択 ──
function renderGridSizeOptions(){
  const el = document.getElementById("artGridSizeOptions");
  const sizes = [16, 24, 32, 48, 64];
  el.innerHTML = sizes.map(s => `<button onclick="chooseGridSize(${s})">${s}×${s}</button>`).join("");
}

function chooseGridSize(size){
  gridSize = size;
  pixels = new Array(size * size).fill(null);
  document.getElementById("gridSizeModal").style.display = "none";
  renderCanvas();
  updateColorUsage();
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
  const toolButtons = TOOLS.map(t => `
    <button class="art-tool-btn${currentTool === t.id ? " active" : ""}" onclick="setTool('${t.id}')" aria-label="${T(t.labelKey, t.labelFallback)}" aria-pressed="${currentTool === t.id}">
      ${icon(t.icon, { size: 18 })}
    </button>
  `).join("");
  const clearButton = `
    <button class="art-tool-btn" onclick="clearAll()" aria-label="${T('art_tool_clear', '全消去')}">
      ${icon("trash", { size: 18 })}
    </button>
  `;
  el.innerHTML = toolButtons + clearButton;
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
  const fitCell = availW / gridSize;
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
  const el = document.getElementById("artColorUsage");
  el.innerHTML = entries.length
    ? entries.map(([c, n]) => `
        <div class="art-usage-row${highlightedColor === c ? " active" : ""}" onclick="toggleHighlight('${c}')">
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

// ── 描画 ──
function renderCanvas(){
  const cell = BASE_CELL * zoom / 100;
  canvas.width = gridSize * cell;
  canvas.height = gridSize * cell;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for(let y = 0; y < gridSize; y++){
    for(let x = 0; x < gridSize; x++){
      const c = pixels[y * gridSize + x];
      if(c){
        ctx.fillStyle = c;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  if(highlightedColor){
    ctx.fillStyle = document.body.classList.contains("dark") ? "rgba(26,24,20,0.6)" : "rgba(255,255,255,0.65)";
    for(let y = 0; y < gridSize; y++){
      for(let x = 0; x < gridSize; x++){
        if(pixels[y * gridSize + x] !== highlightedColor){
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
  }

  if(cell >= 6){
    ctx.strokeStyle = document.body.classList.contains("dark") ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    for(let i = 0; i <= gridSize; i++){
      ctx.beginPath();
      ctx.moveTo(i * cell + 0.5, 0);
      ctx.lineTo(i * cell + 0.5, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell + 0.5);
      ctx.lineTo(canvas.width, i * cell + 0.5);
      ctx.stroke();
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
  if(cx < 0 || cy < 0 || cx >= gridSize || cy >= gridSize) return null;
  return { cx, cy };
}

function applyToolAt(cx, cy){
  const idx = cy * gridSize + cx;
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
  const startIdx = cy * gridSize + cx;
  const target = pixels[startIdx];
  if(target === color) return;
  const stack = [[cx, cy]];
  while(stack.length){
    const [x, y] = stack.pop();
    if(x < 0 || y < 0 || x >= gridSize || y >= gridSize) continue;
    const i = y * gridSize + x;
    if(pixels[i] !== target) continue;
    pixels[i] = color;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

function bindCanvasEvents(){
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    isDrawing = true;
    const c = cellFromEvent(e);
    if(c){
      applyToolAt(c.cx, c.cy);
      lastCell = c;
      renderCanvas();
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if(!isDrawing) return;
    if(currentTool !== "pen" && currentTool !== "eraser") return;
    const c = cellFromEvent(e);
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
  canvas.addEventListener("pointerleave", finishStroke);
}

// ── 全消去 ──
function clearAll(){
  if(!confirm(T("art_confirm_clear", "すべて消去しますか？この操作は取り消せません（Undo機能は今後のアップデートで追加予定です）"))) return;
  pixels = new Array(gridSize * gridSize).fill(null);
  highlightedColor = null;
  renderCanvas();
  updateColorUsage();
  saveDraft();
}

// ── 下書きの自動保存（単一スロット。複数下書き管理は次フェーズで対応） ──
function saveDraft(){
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ width: gridSize, height: gridSize, pixelData: pixels }));
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

initArtEditor();
