// js/art-editor.js
// 「アート」ページ（art-create.html）のCanvasエディター
// Phase 2: ペン・消しゴム・バケツ・スポイト、カラーパレット・カスタムカラー、ズーム、使用色の集計・ハイライト
// Phase 3: Undo/Redo（スナップショット方式、最大50段階）
// Phase 4.5: キャンバスの「実データのマス数」と「画面上の表示サイズ」を分離し、
//   正方形以外の比率にも対応（1マスは常に正方形として描画）
// キャンバスサイズはjs/art-config.jsのFREE_CANVAS_RATIOS（比率×サイズレベル、
// art-pia.comのConsole出力から確認済みの実数値）から選択する

const BASE_CELL = 16; // 100%ズーム時の1マスのピクセルサイズ
const ZOOM_LEVELS = [25, 50, 100, 200, 400, 800, 1600];
const DRAFT_KEY = "hatopiArt_currentDraft";
const SAVED_DESIGNS_KEY = "hatopiArt_savedDesigns";
const MAX_HISTORY = 50;
const BLOCK_SIZE = 10;

let gridWidth = 30;
let gridHeight = 30;
let pixels = [];
let currentColor = "#EF6E72"; // 初期選択色（05 コーラル）
let expandedPaletteMain = null; // カラーパレットで展開表示中のメインカラー番号
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
let selectedRatioId = "1-1"; // 新規キャンバス作成モーダルで選択中の比率
let selectedFrameId = null; // 選択中のデザイン枠アイテム
let selectedFramePartId = null; // 選択中のデザイン枠アイテムのパーツ（複数パーツを持つ場合）
let savedDesigns = []; // 名前を付けて保存したデザインの一覧
let currentDesignId = null; // 保存済みデザインを読み込んで編集中の場合、そのID（未保存ならnull）
let newCanvasModalCancelable = false; // 新規キャンバス作成モーダルを「新規作成」ボタンから開いた場合のみキャンセル可能にする

const canvas = document.getElementById("artCanvas");
const ctx = canvas.getContext("2d");

// ── 初期化 ──
function initArtEditor(){
  loadSavedDesigns();

  const draft = loadDraft();
  if(draft && draft.width && draft.height && Array.isArray(draft.pixelData)){
    gridWidth = draft.width;
    gridHeight = draft.height;
    pixels = draft.pixelData.slice();
    blockStatus = draft.blockStatus || {};
    currentDesignId = draft.designId || null;
  }else{
    showFrameStep1();
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
  bindMyDesignsControls();
}

// ── マイデザイン・エクスポート/共有ボタンの結線 ──
function bindMyDesignsControls(){
  document.getElementById("artNewCanvasBtn").addEventListener("click", openNewCanvasModal);
  document.getElementById("artSaveBtn").addEventListener("click", saveCurrentAsDesign);
  document.getElementById("artMyDesignsBtn").addEventListener("click", openMyDesignsModal);
  document.getElementById("artExportBtn").addEventListener("click", exportPNG);
  document.getElementById("artShareBtn").addEventListener("click", shareDesign);
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

// ── 新規キャンバス作成モーダルを「新規作成」ボタンから開く（既存キャンバスがある場合のみキャンセル可能） ──
function openNewCanvasModal(){
  if(!confirm(T("art_confirm_new_canvas", "現在のキャンバスを保存せずに新しいキャンバスを作成しますか？"))) return;
  newCanvasModalCancelable = true;
  document.getElementById("gridSizeCancelWrap").style.display = "block";
  showFrameStep1();
  renderFreeSizeOptions();
  document.getElementById("gridSizeModal").style.display = "block";
}

// デザイン枠のパーツ選択は、元サイトと同様に「戻る」付きの別画面へ切り替える方式
function showFrameStep1(){
  document.getElementById("gridSizeStep1").style.display = "block";
  document.getElementById("gridSizeStep2").style.display = "none";
}

function showFrameStep2(){
  document.getElementById("gridSizeStep1").style.display = "none";
  document.getElementById("gridSizeStep2").style.display = "block";
}

function closeNewCanvasModal(){
  if(!newCanvasModalCancelable) return;
  document.getElementById("gridSizeModal").style.display = "none";
}

// ── 新規キャンバス作成モーダル（自由サイズ：比率→サイズレベルの2段階／デザイン枠：カテゴリ→アイテム→パーツ） ──
function renderFreeSizeOptions(){
  renderRatioOptions(
    "artRatioOptions",
    selectedRatioId,
    (id) => { selectedRatioId = id; renderLevelOptions(); }
  );
  renderLevelOptions();
  renderFrameOptions();
}

function renderRatioOptions(containerId, currentId, onSelect){
  const el = document.getElementById(containerId);
  el.innerHTML = FREE_CANVAS_RATIOS.map(r => `
    <button class="${r.id === currentId ? "active" : ""}" data-ratio="${r.id}">${r.ratio}</button>
  `).join("");
  el.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      el.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onSelect(btn.dataset.ratio);
    });
  });
}

function currentLang(){
  return window.i18n && typeof window.i18n.getCurrentLang === "function" ? window.i18n.getCurrentLang() : "ja";
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

// レンダリングそのものではキャンバスを作成しない（モーダル再オープン時に古い選択状態が
// 残っていても、クリックしていないのに勝手に新規作成されてしまうのを防ぐため）。
// 作成は必ずクリックハンドラー内（アイテム選択 or パーツ選択）からのみ行う。
function renderFrameOptions(){
  const lang = currentLang();
  renderOptionGroup(
    "artFrameItemOptions",
    DESIGN_FRAME_PRESETS.map(f => ({ id: f.id, label: frameName(f, lang) })),
    selectedFrameId,
    (v) => {
      selectedFrameId = v;
      selectedFramePartId = null;
      const frame = DESIGN_FRAME_PRESETS.find(f => f.id === v);
      if(frame.parts.length === 1){
        createFrameCanvas(frame.parts[0].id);
      }else{
        renderFramePartOptions();
        showFrameStep2();
      }
    }
  );
}

function renderFramePartOptions(){
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === selectedFrameId);
  if(!frame) return;
  const lang = currentLang();
  renderOptionGroup(
    "artFramePartOptions",
    frame.parts.map(p => ({ id: p.id, label: frameName(p, lang) })),
    selectedFramePartId,
    (v) => createFrameCanvas(v)
  );
}

function createFrameCanvas(partId){
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === selectedFrameId);
  if(!frame) return;
  const part = frame.parts.find(p => p.id === partId);
  if(!part) return;
  selectedFramePartId = partId;
  createCanvas(part.width, part.height);
}

function renderLevelOptions(){
  const ratio = FREE_CANVAS_RATIOS.find(r => r.id === selectedRatioId);
  const el = document.getElementById("artLevelOptions");
  el.innerHTML = ratio.levels.map(lv => `
    <button onclick="createCanvas(${lv.w}, ${lv.h})">${lv.w} × ${lv.h}</button>
  `).join("");
}

function createCanvas(w, h){
  gridWidth = w;
  gridHeight = h;
  pixels = new Array(w * h).fill(null);
  blockStatus = {};
  undoStack = [];
  redoStack = [];
  currentDesignId = null;
  newCanvasModalCancelable = false;
  document.getElementById("gridSizeCancelWrap").style.display = "none";
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
// ゲーム内で実際に選択できる色（js/art-config.jsのGAME_PALETTE）に完全一致させた
// 階層UI（メインカラー→サブカラー）のみを通じて色を選ぶ。任意の色を自由入力する手段は持たない。
function renderPalette(){
  const mainsEl = document.getElementById("artPaletteMains");
  mainsEl.innerHTML = GAME_PALETTE.map(entry => {
    const isNone = entry.no === "04";
    const hasSubs = entry.subs.length > 0;
    const isActive = isNone
      ? currentColor === null
      : hasSubs
        ? entry.subs.some(h => h.toUpperCase() === String(currentColor).toUpperCase())
        : entry.hex.toUpperCase() === String(currentColor).toUpperCase();
    const cls = ["art-swatch", "art-swatch-main"];
    // "active"は全体で*{background:var(--indigo)!important}という汎用クラスと衝突し
    // スウォッチ本来の色を上書きしてしまうため、専用クラス名にする
    if(isActive) cls.push("is-selected");
    if(isNone) cls.push("art-swatch-none");
    const style = isNone ? "" : ` style="background:${entry.hex}"`;
    return `<button class="${cls.join(" ")}"${style} data-main="${entry.no}" aria-label="${entry.no} ${entry.name}"></button>`;
  }).join("");
  mainsEl.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => selectPaletteMain(btn.dataset.main));
  });
  renderPaletteSubs();
}

function selectPaletteMain(no){
  const entry = GAME_PALETTE.find(e => e.no === no);
  // 04（透明/なし）・02・03（サブカラーなし）はメインカラーのタップだけで選択が確定するため、
  // 別のメインカラーのサブカラー一覧が開いたままにならないよう、常にサブカラー欄を閉じる
  // （例：#FEFFFFは01のサブカラーにも含まれるが、02をタップして01のサブ一覧が開くのは避ける）
  if(no === "04"){
    currentColor = null;
    expandedPaletteMain = null;
    renderPalette();
    return;
  }
  if(entry.subs.length === 0){
    currentColor = entry.hex;
    expandedPaletteMain = null;
    renderPalette();
    return;
  }
  expandedPaletteMain = expandedPaletteMain === no ? null : no;
  renderPalette();
}

function renderPaletteSubs(){
  const wrap = document.getElementById("artPaletteSubs");
  const entry = GAME_PALETTE.find(e => e.no === expandedPaletteMain);
  if(!entry || entry.subs.length === 0){
    wrap.style.display = "none";
    wrap.innerHTML = "";
    return;
  }
  wrap.style.display = "flex";
  wrap.innerHTML = entry.subs.map((hex, i) => `
    <button class="art-swatch art-swatch-sub${hex.toUpperCase() === String(currentColor).toUpperCase() ? " is-selected" : ""}" style="background:${hex}" data-hex="${hex}" aria-label="${entry.no}-${i + 1}"></button>
  `).join("");
  wrap.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => setCurrentColor(btn.dataset.hex));
  });
}

function setCurrentColor(c){
  currentColor = c;
  const group = c === null ? null : gamePaletteGroupForHex(c);
  expandedPaletteMain = group && group.subs.length > 0 ? group.no : null;
  renderPalette();
}

// ── 使用色の集計・ハイライト ──
function updateColorUsage(){
  const counts = {};
  pixels.forEach(c => { if(c) counts[c] = (counts[c] || 0) + 1; });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  colorNumberMap = {};
  entries.forEach(([c]) => { colorNumberMap[c] = gamePaletteCode(c); });
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
      // 拾った色が固定パレット外（旧データ等）の場合は最も近いパレット色に丸める
      setCurrentColor(nearestGamePaletteHex(hexToRgb(pixels[idx])));
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

// ── 下書きの自動保存（作業中の状態のみ。名前を付けた保存はSAVED_DESIGNS_KEY側で管理） ──
function saveDraft(){
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ width: gridWidth, height: gridHeight, pixelData: pixels, blockStatus, designId: currentDesignId }));
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

// ── 名前を付けて保存したデザインの一覧管理 ──
function loadSavedDesigns(){
  try{
    const raw = localStorage.getItem(SAVED_DESIGNS_KEY);
    savedDesigns = raw ? JSON.parse(raw) : [];
    if(!Array.isArray(savedDesigns)) savedDesigns = [];
  }catch(e){
    savedDesigns = [];
  }
}

function persistSavedDesigns(){
  localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(savedDesigns));
}

function saveCurrentAsDesign(){
  const existing = savedDesigns.find(d => d.id === currentDesignId);
  if(existing){
    existing.width = gridWidth;
    existing.height = gridHeight;
    existing.pixelData = pixels.slice();
    existing.blockStatus = { ...blockStatus };
    existing.updatedAt = Date.now();
    persistSavedDesigns();
    showToast(T("art_toast_updated", "更新しました"));
    return;
  }

  const name = prompt(T("art_save_prompt", "デザイン名を入力してください"), T("art_default_design_name", "デザイン"));
  if(name === null) return; // キャンセル
  const design = {
    id: "design-" + Date.now(),
    name: name.trim() || T("art_default_design_name", "デザイン"),
    width: gridWidth,
    height: gridHeight,
    pixelData: pixels.slice(),
    blockStatus: { ...blockStatus },
    updatedAt: Date.now(),
  };
  savedDesigns.push(design);
  persistSavedDesigns();
  currentDesignId = design.id;
  saveDraft();
  showToast(T("art_toast_saved", "保存しました"));
}

function openMyDesignsModal(){
  renderMyDesignsList();
  document.getElementById("myDesignsModal").style.display = "block";
}

function closeMyDesignsModal(){
  document.getElementById("myDesignsModal").style.display = "none";
}

function renderMyDesignsList(){
  const el = document.getElementById("artMyDesignsList");
  if(!savedDesigns.length){
    el.innerHTML = `<div class="art-mydesigns-empty">${T("art_mydesigns_empty", "保存したデザインはまだありません")}</div>`;
    return;
  }
  const sorted = savedDesigns.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  el.innerHTML = sorted.map(d => `
    <div class="art-mydesign-item${d.id === currentDesignId ? " current" : ""}">
      <canvas class="art-mydesign-thumb" id="artMyDesignThumb_${d.id}"></canvas>
      <div class="art-mydesign-info">
        <div class="art-mydesign-name">${escapeHtml(d.name)}</div>
        <div class="art-mydesign-meta">${d.width} × ${d.height}</div>
      </div>
      <div class="art-mydesign-actions">
        <button onclick="loadDesign('${d.id}')">${T("art_open", "開く")}</button>
        <button onclick="deleteDesign('${d.id}')">${T("art_delete", "削除")}</button>
      </div>
    </div>
  `).join("");
  sorted.forEach(d => {
    drawPixelsToThumb(document.getElementById(`artMyDesignThumb_${d.id}`), d.pixelData, d.width, d.height, 48);
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function drawPixelsToThumb(canvasEl, pixelData, w, h, maxBox){
  if(!canvasEl) return;
  const cell = Math.max(1, Math.floor(maxBox / Math.max(w, h)));
  canvasEl.width = w * cell;
  canvasEl.height = h * cell;
  const tctx = canvasEl.getContext("2d");
  tctx.imageSmoothingEnabled = false;
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const c = pixelData[y * w + x];
      if(c){
        tctx.fillStyle = c;
        tctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
}

function loadDesign(id){
  const design = savedDesigns.find(d => d.id === id);
  if(!design) return;
  gridWidth = design.width;
  gridHeight = design.height;
  pixels = design.pixelData.slice();
  blockStatus = { ...(design.blockStatus || {}) };
  currentDesignId = design.id;
  undoStack = [];
  redoStack = [];
  highlightedColor = null;
  closeMyDesignsModal();
  renderCanvas();
  updateColorUsage();
  updateUndoRedoButtons();
  renderBlockList();
  saveDraft();
}

function deleteDesign(id){
  if(!confirm(T("art_confirm_delete_design", "このデザインを削除しますか？"))) return;
  savedDesigns = savedDesigns.filter(d => d.id !== id);
  persistSavedDesigns();
  if(currentDesignId === id){
    currentDesignId = null;
    saveDraft();
  }
  renderMyDesignsList();
}

// ── PNGエクスポート・共有（既存のシェア機能と同じnavigator.shareパターン） ──
function buildExportCanvas(){
  const cell = Math.max(2, Math.floor(640 / Math.max(gridWidth, gridHeight)));
  const c = document.createElement("canvas");
  c.width = gridWidth * cell;
  c.height = gridHeight * cell;
  const ectx = c.getContext("2d");
  ectx.imageSmoothingEnabled = false;
  for(let y = 0; y < gridHeight; y++){
    for(let x = 0; x < gridWidth; x++){
      const col = pixels[y * gridWidth + x];
      if(col){
        ectx.fillStyle = col;
        ectx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
  return c;
}

function exportPNG(){
  const c = buildExportCanvas();
  c.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hatopi-art.png";
    a.click();
  });
}

function shareDesign(){
  const c = buildExportCanvas();
  c.toBlob(async (blob) => {
    const file = new File([blob], "hatopi-art.png", { type: "image/png" });
    if(navigator.canShare && navigator.canShare({ files: [file] })){
      try{
        await navigator.share({ files: [file], title: T("art_share_title", "はとぴアート") });
      }catch(e){}
    }else{
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hatopi-art.png";
      a.click();
    }
  });
}

// ── トースト通知 ──
function showToast(msg){
  const t = document.getElementById("artToast");
  if(!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
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
    if(document.getElementById("gridSizeStep2").style.display !== "none"){
      renderFramePartOptions();
    }
  }
  if(document.getElementById("myDesignsModal").style.display !== "none"){
    renderMyDesignsList();
  }
});

initArtEditor();
