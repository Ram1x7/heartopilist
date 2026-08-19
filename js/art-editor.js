// js/art-editor.js
// 「アート」ページ（art-create.html）のCanvasエディター
// Phase 2: ペン・消しゴム・バケツ・スポイト、カラーパレット・カスタムカラー、ズーム、使用色の集計・ハイライト
// Phase 3: Undo/Redo（スナップショット方式、最大50段階）
// Phase 4.5: キャンバスの「実データのマス数」と「画面上の表示サイズ」を分離し、
//   正方形以外の比率にも対応（1マスは常に正方形として描画）
// キャンバスサイズはjs/art-config.jsのFREE_CANVAS_RATIOS（比率×サイズレベル、
// art-pia.comのConsole出力から確認済みの実数値）から選択する

// ズーム100%＝画面（.art-canvas-area、固定サイズの表示エリア）にキャンバス全体が
// ちょうど収まる大きさ。1マスのピクセルサイズはfitCellSize()で動的に求める
const ZOOM_LEVELS = [25, 50, 100, 200, 400, 800, 1600];
const BRUSH_SIZES = [1, 2, 3, 4];
const DRAFT_KEY = "hatopiArt_currentDraft";
const SAVED_DESIGNS_KEY = "hatopiArt_savedDesigns";
const MAX_HISTORY = 50;
const BLOCK_SIZE = 10;

let gridWidth = 30;
let gridHeight = 30;
let pixels = [];
let currentColor = "#EF6E72"; // 初期選択色（05 コーラル）
let expandedPaletteMain = null; // カラーパレットで展開表示中のメインカラー番号
let selectedMainNo = "05"; // 現在の選択色が属するメインカラー番号（マーク表示用。hexの一致では判定しない）
let currentTool = "pen";
let brushSize = 1; // ペン・消しゴムの太さ（1マス～。太いほど中心のマスを基準にN×Nマスへ反映する）
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
let myDesignsFilter = "all"; // マイデザイン一覧の絞り込み（all/notStarted/inProgress/done）
let newCanvasModalCancelable = false; // 新規キャンバス作成モーダルを「新規作成」ボタンから開いた場合のみキャンセル可能にする
let editMode = false; // 編集モード（ONの間だけキャンバスタップでペン/消しゴム/塗りつぶしが発動する。誤タップ防止）
let isLocked = false; // キャンバスの固定（ロック）。ロック中は編集モードに関わらず描画系ツールを一切受け付けない
let activeFrameId = null; // 現在のキャンバスが紐づくデザイン枠プリセットID（自由サイズならnull）。マスク表示・使用不可マス判定に使う
let activePartId = null; // 現在のキャンバスが紐づくデザイン枠パーツID
let activePointers = new Map(); // 現在キャンバスに触れているポインター（pointerId → {x, y, type}）。2本指ジェスチャー判定に使う
let pinchState = null; // 2本指ジェスチャー中の基準値（{startDist, startZoom, startMidX, startMidY, startScrollLeft, startScrollTop}）
let pinchRafPending = false; // 2本指のpointermoveは指ごとに別々のイベントとして届くため、
  // 片方の指だけ座標が更新された「途中の不整合な状態」でupdatePinch()が呼ばれるのを防ぐために、
  // 同一フレーム内の複数回の呼び出しをrequestAnimationFrameで1回にまとめる
let pendingTouchPaint = null; // タッチ開始直後、2本目の指が来るかを一定時間待つためのタイマー情報（{timer, cx, cy}）
let activeMaskLines = null; // 現在のキャンバスの輪郭線パス配列（[[{x,y},...], ...]）。マスクなしならnull
let inspectedCell = null; // タップして調べた（ハイライト表示中の）マスの座標（{cx, cy}）。編集モードに関わらず動作する
let recentColors = []; // 直近使用した色（新しい順、最大RECENT_COLORS_MAX件）。ワンタップで選び直せるようにする
const RECENT_COLORS_KEY = "hatopiArt_recentColors";
const RECENT_COLORS_MAX = 8;

const canvas = document.getElementById("artCanvas");
const ctx = canvas.getContext("2d");

// ── 初期化 ──
function initArtEditor(){
  loadSavedDesigns();
  recentColors = loadRecentColors();

  const originalDraft = loadDraft();
  const draft = applyShareCodeFromUrlIfPresent(originalDraft);
  const loadedFromShareUrl = draft !== originalDraft;
  if(draft && draft.width && draft.height && Array.isArray(draft.pixelData)){
    gridWidth = draft.width;
    gridHeight = draft.height;
    pixels = draft.pixelData.slice();
    blockStatus = draft.blockStatus || {};
    currentDesignId = draft.designId || null;
    activeFrameId = draft.frameId || null;
    activePartId = draft.partId || null;
    isLocked = !!draft.locked;
    rebuildActiveMask();
    if(loadedFromShareUrl) saveDraft(); // URLのコードから読み込んだ内容を下書きとして永続化する
  }else{
    showFrameStep1();
    renderFreeSizeOptions();
    document.getElementById("gridSizeModal").style.display = "block";
  }

  renderToolbar();
  renderZoomControls();
  renderBrushSizeControls();
  renderPalette();
  renderRecentColors();
  renderCanvas();
  updateColorUsage();
  renderBlockList();
  renderLockUI();
  bindCanvasEvents();
  bindDisplayToggles();
  bindMyDesignsControls();
  bindLockControls();
  bindTutorialControls();
  bindShareCodeControls();
  maybeStartTutorial();
}

// ── 編集モード・固定（ロック）ボタンの結線 ──
function bindLockControls(){
  document.getElementById("artEditModeBtn").addEventListener("click", toggleEditMode);
  document.getElementById("artLockBtn").addEventListener("click", toggleLock);
}

// ── デザイン枠のマスク（輪郭線）キャッシュ ──
// activeFrameId/activePartIdが変わるたびに呼び直す（js/art-masks.jsのPRESET_MASKS参照）。
// 輪郭線より外のマスも、ゲーム内の実際の仕様に合わせて描画できる（使用不可扱いにはしない）。
function rebuildActiveMask(){
  const preset = activeFrameId && typeof PRESET_MASKS !== "undefined" ? PRESET_MASKS[activeFrameId] : null;
  const part = preset && activePartId ? preset[activePartId] : null;
  activeMaskLines = part ? part.maskLines : null;
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
// 「比率」欄には自由サイズの比率とデザイン枠アイテムを同じ選択肢として並べているため、
// 両者は排他的に選ぶ（比率を選んだらデザイン枠の選択は解除、逆も同様）
function selectFreeRatio(id){
  selectedRatioId = id;
  selectedFrameId = null;
  selectedFramePartId = null;
  renderFreeSizeOptions();
}

function renderFreeSizeOptions(){
  renderRatioOptions("artRatioOptions", selectedRatioId, selectFreeRatio);
  renderLevelOptions();
  renderFrameOptions();
}

function renderRatioOptions(containerId, currentId, onSelect){
  const el = document.getElementById(containerId);
  // デザイン枠アイテムが選択中の間は、比率側のマークを表示しない（両方同時に選択済みに見えるのを防ぐ）
  el.innerHTML = FREE_CANVAS_RATIOS.map(r => {
    const box = ratioShapeBox(r.id, 28);
    return `
    <button class="art-ratio-btn${r.id === currentId && !selectedFrameId ? " active" : ""}" data-ratio="${r.id}">
      <span class="art-ratio-shape" style="width:${box.width}px;height:${box.height}px;"></span>
      <span class="art-ratio-label">${r.ratio}</span>
    </button>
  `;
  }).join("");
  el.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => onSelect(btn.dataset.ratio));
  });
}

function currentLang(){
  return window.i18n && typeof window.i18n.getCurrentLang === "function" ? window.i18n.getCurrentLang() : "ja";
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

// レンダリングそのものではキャンバスを作成しない（モーダル再オープン時に古い選択状態が
// 残っていても、クリックしていないのに勝手に新規作成されてしまうのを防ぐため）。
// 作成は必ずクリックハンドラー内（アイテム選択 or パーツ選択）からのみ行う。
function renderFrameOptions(){
  const lang = currentLang();
  renderOptionGroup(
    "artFrameItemOptions",
    DESIGN_FRAME_PRESETS.map(f => ({ id: f.id, label: frameName(f, lang), icon: f.icon })),
    selectedFrameId,
    (v) => {
      selectedFrameId = v;
      selectedFramePartId = null;
      renderRatioOptions("artRatioOptions", selectedRatioId, selectFreeRatio); // 比率側のマークを消す
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
  createCanvas(part.width, part.height, selectedFrameId, partId);
}

function renderLevelOptions(){
  const ratio = FREE_CANVAS_RATIOS.find(r => r.id === selectedRatioId);
  const el = document.getElementById("artLevelOptions");
  el.innerHTML = ratio.levels.map(lv => `
    <button onclick="createCanvas(${lv.w}, ${lv.h})">${lv.w} × ${lv.h}</button>
  `).join("");
}

// frameId/partIdは、アイテム別プリセットから作成した場合のみ渡される
// （自由サイズの場合はundefined→活動中のマスク関連付けなしとして扱う）
function createCanvas(w, h, frameId, partId){
  gridWidth = w;
  gridHeight = h;
  pixels = new Array(w * h).fill(null);
  blockStatus = {};
  inspectedCell = null;
  activeFrameId = frameId || null;
  activePartId = partId || null;
  // 自由サイズ（frameId未指定）で作成した場合は、モーダルの選択状態も
  // デザイン枠の選択なしに揃えておく（次回モーダルを開いた時の表示を一致させるため）
  if(!frameId){
    selectedFrameId = null;
    selectedFramePartId = null;
  }
  rebuildActiveMask();
  isLocked = false;
  editMode = false;
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
  renderLockUI();
  saveDraft();
  maybeStartTutorial();
}

// ── ツールバー ──
// アイコンは和モダンな見た目にするため筆（fude）・字消し（sumiKeshi）を使うが、
// ツールのid（"pen"/"eraser"）自体はロジック側の分岐に使われているため変更しない
const TOOLS = [
  { id: "pen", icon: "fude", labelKey: "art_tool_pen", labelFallback: "ペン" },
  { id: "eraser", icon: "sumiKeshi", labelKey: "art_tool_eraser", labelFallback: "消しゴム" },
  { id: "bucket", icon: "bucket", labelKey: "art_tool_bucket", labelFallback: "バケツ" },
  { id: "eyedropper", icon: "eyedropper", labelKey: "art_tool_eyedropper", labelFallback: "スポイト" },
];

function renderToolbar(){
  const el = document.getElementById("artToolbar");
  el.classList.toggle("art-toolbar-disabled", blockMode || isLocked);
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

// ── 編集モード・固定（ロック） ──
// 編集モードOFFの間はキャンバスタップでペン/消しゴム/塗りつぶしが発動しない（誤タップ防止、閲覧・確認専用）。
// 固定（ロック）は編集モードより強く、ロック中は編集モードに関わらず描画系ツールを一切受け付けない。
function toggleEditMode(){
  if(isLocked) return; // ロック中は編集モードの切り替え自体を受け付けない
  editMode = !editMode;
  renderLockUI();
}

function toggleLock(){
  if(isLocked){
    if(!confirm(T("art_confirm_unlock", "固定を解除しますか？誤って上書きしないようご注意ください。"))) return;
    isLocked = false;
  }else{
    isLocked = true;
    editMode = false; // 固定したら編集モードも自動でOFFにする
  }
  renderLockUI();
  renderToolbar();
  renderCanvas();
  saveDraft();
}

function renderLockUI(){
  const editBtn = document.getElementById("artEditModeBtn");
  const lockBtn = document.getElementById("artLockBtn");
  if(!editBtn || !lockBtn) return;
  // 固定中も非表示にはせず、無効化(グレーアウト)して「固定中は編集できない」という
  // 上書き関係が見た目で分かるようにする
  editBtn.disabled = isLocked;
  editBtn.title = isLocked ? T("art_edit_disabled_by_lock", "固定を解除すると編集できます") : "";
  editBtn.textContent = editMode ? T("art_edit_mode_off", "編集を終える") : T("art_edit_mode_on", "編集する");
  editBtn.classList.toggle("is-active", editMode);
  lockBtn.textContent = isLocked ? T("art_unlock", "固定を解除") : T("art_lock", "固定する");
  lockBtn.classList.toggle("is-locked", isLocked);
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
  showToast(T("art_undo", "元に戻す"));
}

function redo(){
  if(redoStack.length === 0) return;
  undoStack.push(snapshotState());
  restoreSnapshot(redoStack.pop());
  updateUndoRedoButtons();
  showToast(T("art_redo", "やり直す"));
}

// ツールボタンをタップした際、何を選んだかが一瞬わかるようトーストで表示する
function setTool(tool){
  currentTool = tool;
  renderToolbar();
  renderBrushSizeControls();
  const t = TOOLS.find(x => x.id === tool);
  if(t) showToast(T(t.labelKey, t.labelFallback));
}

// ── 太さ（ペン・消しゴム共通） ──
// ペン/消しゴムを選んでいる時だけ表示する（バケツ・スポイトには無関係のため）
function renderBrushSizeControls(){
  const section = document.getElementById("artBrushSizeSection");
  const el = document.getElementById("artBrushSizeOptions");
  if(!section || !el) return;
  const show = currentTool === "pen" || currentTool === "eraser";
  section.style.display = show ? "" : "none";
  if(!show) return;
  el.innerHTML = BRUSH_SIZES.map(s => `
    <button class="${s === brushSize ? "active" : ""}" onclick="setBrushSize(${s})" aria-label="${s}">${s}</button>
  `).join("");
}

function setBrushSize(s){
  brushSize = s;
  renderBrushSizeControls();
}

// ── ズーム（スライダーで連続的に拡大率を変更する） ──
function renderZoomControls(){
  const el = document.getElementById("artZoomControls");
  el.innerHTML = `
    <input type="range" class="art-zoom-slider" id="artZoomSlider" min="${MIN_ZOOM}" max="${MAX_ZOOM}" step="1" value="${zoom}" aria-label="${T('art_zoom_label', '拡大率')}">
    <span class="art-zoom-label" id="artZoomLabel">${zoom}%</span>
    <button class="art-zoom-text-btn" onclick="zoomReset()">100%</button>
  `;
  const slider = document.getElementById("artZoomSlider");
  slider.addEventListener("input", () => {
    const c = containerCenterClientPoint();
    zoomAt(Number(slider.value), c.x, c.y);
  });
}

function updateZoomLabel(){
  const el = document.getElementById("artZoomLabel");
  if(el) el.textContent = zoom + "%";
  const slider = document.getElementById("artZoomSlider");
  if(slider) slider.value = zoom;
}

const MIN_ZOOM = ZOOM_LEVELS[0];
const MAX_ZOOM = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

// w×hのグリッド全体が.art-canvas-area（固定サイズの表示エリア）にちょうど収まる
// 1マスのピクセルサイズ。表示エリア自体はCSSで高さが固定されているため、
// ズームや内容が変わってもこの基準値がぶれない（「背景の画面」が動かなくなる）
function fitCellSize(w, h){
  const area = document.querySelector(".art-canvas-area");
  const availW = Math.max(area.clientWidth - 32, 40);
  const availH = Math.max(area.clientHeight - 32, 40);
  return Math.min(availW / w, availH / h);
}

// 現在のキャンバス・ズームでの1マスのピクセルサイズ（ズーム100%＝画面に合わせた表示）
function currentCellSize(){
  return fitCellSize(gridWidth, gridHeight) * zoom / 100;
}

// 表示エリア（.art-canvas-area）の中心を、画面上の座標（clientX/Y）として返す。
// ボタン操作など、特定の指の位置がないズーム操作の基準点に使う
function containerCenterClientPoint(){
  const area = document.querySelector(".art-canvas-area");
  const rect = area.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// 画面上の座標（clientX/Y）が指すグリッド座標（マス単位、小数可）を、現在のズームで求める
function gridPointFromClient(clientX, clientY){
  const rect = canvas.getBoundingClientRect();
  const cell = currentCellSize();
  return {
    gx: (clientX - rect.left) * (canvas.width / rect.width) / cell,
    gy: (clientY - rect.top) * (canvas.height / rect.height) / cell,
  };
}

// グリッド座標（マス単位）が、現在のズームで画面上のどこに来るかを返す
function clientPointFromGrid(gx, gy){
  const rect = canvas.getBoundingClientRect();
  const cell = currentCellSize();
  return {
    clientX: rect.left + gx * cell * (rect.width / canvas.width),
    clientY: rect.top + gy * cell * (rect.height / canvas.height),
  };
}

// ズームを変更しつつ、画面上の指定位置（clientX/Y）が指していたグリッド座標が
// ズーム後も同じ画面位置に留まるよう、.art-canvas-areaのスクロール位置を補正する。
// これにより、ボタン操作でもピンチ操作でも「今見ている場所を中心に」拡大縮小され、
// 見えている場所が急に変わる（ズームが機能していないように感じる）問題を防ぐ
function zoomAt(newZoomRaw, clientX, clientY){
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(newZoomRaw)));
  if(newZoom === zoom) return;

  const area = document.querySelector(".art-canvas-area");
  const before = gridPointFromClient(clientX, clientY);

  zoom = newZoom;
  renderCanvas();
  updateZoomLabel();

  const after = clientPointFromGrid(before.gx, before.gy);
  area.scrollLeft += after.clientX - clientX;
  area.scrollTop += after.clientY - clientY;
}

// ズーム100%＝画面に合わせた表示（fitCellSize）そのものなので、「100%に戻す」は
// そのまま「画面に合わせる」を兼ねる
function zoomReset(){
  const area = document.querySelector(".art-canvas-area");
  zoom = 100;
  renderCanvas();
  updateZoomLabel();
  area.scrollLeft = 0;
  area.scrollTop = 0;
}

// ── カラーパレット ──
// ゲーム内で実際に選択できる色（js/art-config.jsのGAME_PALETTE）に完全一致させた
// 階層UI（メインカラー→サブカラー）のみを通じて色を選ぶ。任意の色を自由入力する手段は持たない。
// メインカラーは単なる色見本のグリッドではなく、和名（GAME_PALETTE.name）を
// 添えた「紙のチップ」として並べる。ゲーム内ピッカーの色名とそのまま一致する
// 実用的な名前なので、RGB値だけでは分かりにくい色の見分けに役立つ
function renderPalette(){
  const mainsEl = document.getElementById("artPaletteMains");
  mainsEl.innerHTML = GAME_PALETTE.map(entry => {
    const isNone = entry.no === "04";
    // 選択中のマークは「実際に選んだメインカラー番号(selectedMainNo)」だけで判定する。
    // hexの一致だけで判定すると、01のサブカラーと02・03のメインカラーが同じ値を共有している
    // （例：#FEFFFFは01の5番目のサブカラーであり、かつ02のメインカラーそのもの）ため、
    // 本来1つだけのはずのマークが同時に2箇所へついてしまう不具合になる。
    const isActive = entry.no === selectedMainNo;
    const cls = ["art-paper-chip"];
    if(isActive) cls.push("is-selected");
    const swatchCls = ["art-paper-chip-swatch"];
    if(isNone) swatchCls.push("art-swatch-none");
    const style = isNone ? "" : ` style="background:${entry.hex}"`;
    return `<button class="${cls.join(" ")}" data-main="${entry.no}" aria-label="${entry.no} ${entry.name}">
      <span class="${swatchCls.join(" ")}"${style}></span>
      <span class="art-paper-chip-name">${entry.name}</span>
    </button>`;
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
    setCurrentColor(null, "04");
    return;
  }
  if(entry.subs.length === 0){
    setCurrentColor(entry.hex, no);
    return;
  }
  if(expandedPaletteMain === no){
    // 展開中の同じメインカラーを再タップ → 閉じるだけ（選択色はそのまま）
    expandedPaletteMain = null;
    renderPalette();
    return;
  }
  // メインカラーをタップした時点で、選択中マークがすぐに追従するようそのメインの代表色
  // （＝メインカラー自体のhex。サブカラーの1つと同じ値）を選択しつつサブカラー一覧を展開する。
  // より具体的な色合いはサブカラーをタップして選び直せる。
  currentColor = entry.hex;
  selectedMainNo = no;
  expandedPaletteMain = no;
  renderPalette();
  pushRecentColor(entry.hex);
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
    btn.addEventListener("click", () => setCurrentColor(btn.dataset.hex, entry.no));
  });
}

// mainNoを渡すと、選択元のメインカラー番号が確定しているものとして扱う
// （サブカラーのクリックなど）。渡さない場合（スポイト等）はhexから逆引きする。
function setCurrentColor(c, mainNo){
  currentColor = c;
  if(c === null){
    selectedMainNo = mainNo || "04";
    expandedPaletteMain = null;
    renderPalette();
    return;
  }
  const group = mainNo ? GAME_PALETTE.find(e => e.no === mainNo) : gamePaletteGroupForHex(c);
  selectedMainNo = group ? group.no : null;
  expandedPaletteMain = group && group.subs.length > 0 ? group.no : null;
  renderPalette();
  pushRecentColor(c);
}

// ── 最近使った色（メイン→サブの2段階を踏まなくても、直近の色へワンタップで戻れるようにする） ──
function loadRecentColors(){
  try{
    const arr = JSON.parse(localStorage.getItem(RECENT_COLORS_KEY));
    return Array.isArray(arr) ? arr.filter(c => typeof c === "string") : [];
  }catch(e){
    return [];
  }
}

function pushRecentColor(c){
  recentColors = [c, ...recentColors.filter(x => x !== c)].slice(0, RECENT_COLORS_MAX);
  localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(recentColors));
  renderRecentColors();
}

function renderRecentColors(){
  const section = document.getElementById("artRecentColorsSection");
  const el = document.getElementById("artRecentColors");
  if(!section || !el) return;
  if(recentColors.length === 0){
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  el.innerHTML = recentColors.map(c => {
    const code = gamePaletteCode(c);
    const isSelected = String(c).toUpperCase() === String(currentColor).toUpperCase();
    return `<button class="art-swatch${isSelected ? " is-selected" : ""}" style="background:${c}" data-hex="${c}" aria-label="${code || c}"></button>`;
  }).join("");
  el.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => setCurrentColor(btn.dataset.hex));
  });
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
        <div class="art-usage-row${highlightedColor === c ? " active" : ""}" data-hex="${c}">
          <span class="art-usage-number">${colorNumberMap[c]}</span>
          <button class="art-usage-swatch" style="background:${c}" data-select-hex="${c}" aria-label="${T("art_select_this_color", "この色を選ぶ")}"></button>
          <span class="art-usage-count">${n}${T("art_unit_cells", "マス")}</span>
        </div>
      `).join("")
    : `<div class="art-usage-empty">${T("art_usage_empty", "まだ何も塗られていません")}</div>`;
  // 行全体のタップ＝ハイライト切り替え、スウォッチ自体のタップ＝色をワンタップ選択（別動作）
  el.querySelectorAll(".art-usage-row").forEach(row => {
    row.addEventListener("click", () => toggleHighlight(row.dataset.hex));
  });
  el.querySelectorAll("[data-select-hex]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setCurrentColor(btn.dataset.selectHex);
    });
  });
}

function toggleHighlight(c){
  highlightedColor = highlightedColor === c ? null : c;
  updateColorUsage();
  renderCanvas();
}

// ── 描画（1マスは常に正方形。gridWidth/gridHeightが異なっても比率を維持） ──
function renderCanvas(){
  const cell = currentCellSize();
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
    // 灰色・黒ではなく、サイト全体のテーマカラーである藍色をごく薄く使う
    ctx.strokeStyle = document.body.classList.contains("dark") ? "rgba(139,169,201,0.14)" : "rgba(60,90,110,0.16)";
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

  // デザイン枠の輪郭線（襟ぐりなどの曲線・本の3分割のような直線区切り、どちらも
  // maskLinesの頂点座標をそのまま線として描くことで対応する。ズーム/パンにもcellの
  // スケールを通じて自動的に追従する）
  if(activeMaskLines && activeMaskLines.length){
    ctx.strokeStyle = document.body.classList.contains("dark") ? "rgba(255,255,255,0.9)" : "rgba(26,24,20,0.85)";
    ctx.lineWidth = Math.max(1.5, cell * 0.09);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    activeMaskLines.forEach(path => {
      if(!path || path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x * cell, path[0].y * cell);
      for(let i = 1; i < path.length; i++){
        ctx.lineTo(path[i].x * cell, path[i].y * cell);
      }
      ctx.stroke();
    });
  }

  if((showColorNumbers || showCellNumbers) && cell >= 12){
    drawCellLabels(cell);
  }

  if(blockMode){
    drawBlockOverlay(cell);
  }else if(gridWidth > BLOCK_SIZE || gridHeight > BLOCK_SIZE){
    // ブロック表示モードでなくても、10×10の区切りがどこにあるかは常に分かるよう
    // 薄い境界線・番号だけを表示し続ける（進捗の色分け・タップでの切り替えはしない）
    drawBlockBoundaryLines(cell);
  }

  // タップして調べたマスのハイライト（座標・使用色をはっきり分かるように、常に最前面に描く）
  if(inspectedCell && inspectedCell.cx < gridWidth && inspectedCell.cy < gridHeight){
    const ix = inspectedCell.cx, iy = inspectedCell.cy;
    ctx.strokeStyle = document.body.classList.contains("dark") ? "#8fbdc9" : "#3c5a6e";
    ctx.lineWidth = Math.max(2, cell * 0.12);
    const half = ctx.lineWidth / 2;
    ctx.strokeRect(ix * cell + half, iy * cell + half, cell - ctx.lineWidth, cell - ctx.lineWidth);
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

// ブロック表示モードでなくても常時見せる、軽量な境界線・番号表示
// (drawBlockOverlayと違い進捗の色分けはしない。「10×10の区切りがどこか」だけを
// 塗り作業の邪魔にならない薄さで示し続け、ジャンプの有無に関わらずどこでも見える)
function drawBlockBoundaryLines(cell){
  const blocksX = Math.ceil(gridWidth / BLOCK_SIZE);
  const blocksY = Math.ceil(gridHeight / BLOCK_SIZE);
  const dark = document.body.classList.contains("dark");

  ctx.strokeStyle = dark ? "rgba(232,201,60,0.5)" : "rgba(177,80,59,0.45)";
  ctx.lineWidth = 1.5;
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
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.strokeText(label, px + 3, py + 2);
        ctx.fillStyle = dark ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.8)";
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
  const cell = currentCellSize();
  const cx = Math.floor(x / cell);
  const cy = Math.floor(y / cell);
  if(cx < 0 || cy < 0 || cx >= gridWidth || cy >= gridHeight) return null;
  return { cx, cy };
}

function applyToolAt(cx, cy){
  const idx = cy * gridWidth + cx;
  if(currentTool === "pen"){
    paintBrush(cx, cy, currentColor);
  }else if(currentTool === "eraser"){
    paintBrush(cx, cy, null);
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

// brushSize×brushSizeのマスへ一括反映する（1なら従来通り1マスのみ）。
// 基準マス(cx,cy)を左上寄りの中心として、はみ出た部分はキャンバス外として無視する。
function paintBrush(cx, cy, color){
  const half = Math.floor((brushSize - 1) / 2);
  for(let dy = 0; dy < brushSize; dy++){
    for(let dx = 0; dx < brushSize; dx++){
      const x = cx - half + dx;
      const y = cy - half + dy;
      if(x < 0 || y < 0 || x >= gridWidth || y >= gridHeight) continue;
      pixels[y * gridWidth + x] = color;
    }
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

// タッチでの単発描画は、①2本目の指（ピンチ/パン開始）、②長押し（マス確認への切り替え）と
// 区別するため、指を離した時（クイックタップ）か、閾値を超えて動かした時（ドラッグ開始）に
// 確定する。動かさずに長押しし続けた場合は、編集モードのままでも描画せずマス確認（座標・
// 使用色表示）に切り替える（作業中に別の場所の色を確認したい、という要望への対応）
const TOUCH_LONG_PRESS_DELAY = 450; // これ以上動かさずに押し続けたら、描画の代わりにマス確認へ切り替える待ち時間(ms)
const TOUCH_MOVE_CANCEL_THRESHOLD = 8; // これ以上動いたら長押し確認をキャンセルし、通常の描画（ドラッグ）として扱う距離(px)

function cancelPendingTouchPaint(){
  if(pendingTouchPaint){
    clearTimeout(pendingTouchPaint.longPressTimer);
    pendingTouchPaint = null;
  }
}

// ── 2本指ジェスチャー（ピンチズーム・パン） ──
// 1本指＝描画、2本指＝表示のズーム/移動という一般的な描画アプリの操作体系にする
function startPinch(){
  const pts = [...activePointers.values()];
  if(pts.length < 2) return;
  const [p1, p2] = pts;
  const area = document.querySelector(".art-canvas-area");
  pinchState = {
    startDist: Math.hypot(p1.x - p2.x, p1.y - p2.y),
    startZoom: zoom,
    startMidX: (p1.x + p2.x) / 2,
    startMidY: (p1.y + p2.y) / 2,
    startScrollLeft: area.scrollLeft,
    startScrollTop: area.scrollTop,
  };
}

function updatePinch(){
  const pts = [...activePointers.values()];
  if(pts.length < 2 || !pinchState) return;
  const [p1, p2] = pts;
  const area = document.querySelector(".art-canvas-area");
  const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;

  // 2本指の平行移動量をそのままパンとして反映する
  area.scrollLeft = pinchState.startScrollLeft - (midX - pinchState.startMidX);
  area.scrollTop = pinchState.startScrollTop - (midY - pinchState.startMidY);

  // 指の間隔の変化に応じてズームし、中点の位置が画面上で動かないよう補正する
  if(pinchState.startDist > 10){
    const newZoom = pinchState.startZoom * (dist / pinchState.startDist);
    zoomAt(newZoom, midX, midY);
  }
}

function bindCanvasEvents(){
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });

    if(activePointers.size >= 2){
      // 2本目の指が触れた→ピンチ/パン開始。進行中だった単発描画の予約や描画は打ち切る
      cancelPendingTouchPaint();
      finishStroke();
      startPinch();
      return;
    }

    const c = cellFromEvent(e);
    updateCoordReadout(c);
    if(!c) return;

    if(blockMode){
      cycleBlockStatus(Math.floor(c.cx / BLOCK_SIZE), Math.floor(c.cy / BLOCK_SIZE));
      return;
    }

    // 実際に描画・消去・塗りつぶしを行うタップかどうか（下の誤タップ防止の条件と同じ）
    const willPaint = currentTool !== "eyedropper" && editMode && !isLocked;

    if(willPaint){
      // 描画中はハイライトが操作の邪魔になるため、表示中なら消しておく（描画のたびに
      // 再描画が増えるのを避けるため、消す必要がある時だけrenderCanvas()を呼ぶ）
      if(inspectedCell){
        inspectedCell = null;
        renderCanvas();
      }
    }else{
      // タップしたマスをハイライト表示する（座標・使用色の確認用）。編集モードOFF・固定中や
      // スポイト使用時など、実際に描画しないタップの時だけ動作する（描画時の操作感を妨げないため）
      inspectedCell = c;
      renderCanvas();
    }

    // スポイトは閲覧・確認に近い非破壊操作のため、編集モードOFF・固定中でも発動できる。
    // ペン/消しゴム/塗りつぶしは、誤タップ防止のため編集モードON時のみ発動する
    if(currentTool !== "eyedropper" && (!editMode || isLocked)) return;

    if(e.pointerType === "touch" && currentTool !== "eyedropper"){
      // 指を離す（クイックタップ）か動かす（ドラッグ開始）まで確定を待つ。動かさずに
      // TOUCH_LONG_PRESS_DELAYを超えて押し続けたら、描画せずマス確認に切り替える
      pendingTouchPaint = {
        pointerId: e.pointerId,
        cx: c.cx, cy: c.cy,
        startX: e.clientX, startY: e.clientY,
        longPressTimer: setTimeout(() => {
          if(!pendingTouchPaint || pendingTouchPaint.pointerId !== e.pointerId) return;
          pendingTouchPaint = null;
          if(pinchState || !activePointers.has(e.pointerId)) return;
          inspectedCell = { cx: c.cx, cy: c.cy };
          updateCoordReadout(c);
          renderCanvas();
        }, TOUCH_LONG_PRESS_DELAY),
      };
      return;
    }

    isDrawing = true;
    if(currentTool !== "eyedropper") pushHistory();
    applyToolAt(c.cx, c.cy);
    lastCell = c;
    renderCanvas();
  });

  canvas.addEventListener("pointermove", (e) => {
    if(activePointers.has(e.pointerId)){
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    }

    if(pinchState){
      // 2本指それぞれのpointermoveは別々のイベントとして届くため、両方の座標が
      // 更新された後の状態で1フレームに1回だけ計算する（片方だけ新しい座標の
      // 「不整合な瞬間」で計算すると、指の間隔が一瞬だけ揺れてズームが暴れる）
      if(activePointers.size >= 2 && !pinchRafPending){
        pinchRafPending = true;
        requestAnimationFrame(() => {
          pinchRafPending = false;
          if(pinchState && activePointers.size >= 2) updatePinch();
        });
      }
      return;
    }

    // 長押し確認待ち中のタップが、閾値を超えて動いたらドラッグ開始とみなし、
    // マス確認をキャンセルして通常の描画（ストローク）に切り替える
    if(pendingTouchPaint && pendingTouchPaint.pointerId === e.pointerId){
      const moved = Math.hypot(e.clientX - pendingTouchPaint.startX, e.clientY - pendingTouchPaint.startY);
      if(moved > TOUCH_MOVE_CANCEL_THRESHOLD){
        clearTimeout(pendingTouchPaint.longPressTimer);
        const p = pendingTouchPaint;
        pendingTouchPaint = null;
        if(!pinchState && currentTool !== "eyedropper" && editMode && !isLocked){
          isDrawing = true;
          pushHistory();
          applyToolAt(p.cx, p.cy);
          lastCell = { cx: p.cx, cy: p.cy };
          renderCanvas();
        }
      }
    }

    const c = cellFromEvent(e);
    updateCoordReadout(c);
    if(!isDrawing || blockMode) return;

    if(currentTool !== "pen" && currentTool !== "eraser") return;
    if(!editMode || isLocked) return;
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

  const releasePointer = (e) => {
    activePointers.delete(e.pointerId);

    if(pendingTouchPaint && pendingTouchPaint.pointerId === e.pointerId){
      // 長押し確認・ドラッグのどちらにもならず指を離した＝単発タップとして、保留していた描画を確定する
      clearTimeout(pendingTouchPaint.longPressTimer);
      const p = pendingTouchPaint;
      pendingTouchPaint = null;
      if(!pinchState && currentTool !== "eyedropper" && editMode && !isLocked){
        pushHistory();
        applyToolAt(p.cx, p.cy);
        renderCanvas();
        updateColorUsage();
        saveDraftDebounced();
      }
    }

    if(pinchState && activePointers.size < 2){
      pinchState = null;
    }
    finishStroke();
  };
  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("pointerleave", (e) => {
    finishStroke();
    updateCoordReadout(null);
  });

  // Ctrl+ホイール（トラックパッドの2本指ピンチはブラウザがこの形で発火する）でもズームできる
  canvas.addEventListener("wheel", (e) => {
    if(!e.ctrlKey) return;
    e.preventDefault();
    zoomAt(zoom * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
  }, { passive: false });
}

function updateCoordReadout(c){
  const el = document.getElementById("artCoordReadout");
  if(!el) return;
  if(c){
    const color = pixels[c.cy * gridWidth + c.cx];
    const code = color ? gamePaletteCode(color) : "";
    el.textContent = `X: ${String(c.cx).padStart(2, "0")}  Y: ${String(c.cy).padStart(2, "0")}` + (code ? `   ${code}` : "");
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
    el.style.gridTemplateColumns = "";
    return;
  }
  const blocksX = Math.ceil(gridWidth / BLOCK_SIZE);
  const blocksY = Math.ceil(gridHeight / BLOCK_SIZE);
  // 実際のキャンバス配置（横blocksX×縦blocksY）と同じ並びのグリッドにする。
  // 単純な固定3列の数字リストだと、目的のブロックがキャンバス上のどこに
  // あるか一覧内で見た目から判断できず探しにくいため、見たままの位置で選べるようにする
  el.style.gridTemplateColumns = `repeat(${blocksX}, 1fr)`;
  // 完了（2）はチェック文字ではなく、.art-block-status-2 側のCSSで丸い朱印（判子）風の
  // 見た目にするため、ここでは文字を出さない
  const statusIcon = { 0: "", 1: "◐", 2: "" };
  let html = "";
  for(let by = 0; by < blocksY; by++){
    for(let bx = 0; bx < blocksX; bx++){
      const num = by * blocksX + bx + 1;
      const status = blockStatus[blockKey(bx, by)] || 0;
      html += `<button class="art-block-btn art-block-status-${status}" onclick="zoomToBlock(${bx},${by})" aria-label="${num}">${statusIcon[status]}${num}</button>`;
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
  // ズーム100%＝キャンバス全体を画面に合わせた大きさが基準になったため、
  // 「このブロックを画面に合わせた大きさ」を、その基準に対する相対的なズーム%に変換する
  const blockFitCell = fitCellSize(bw, bh);
  const fitZoomRaw = (blockFitCell / fitCellSize(gridWidth, gridHeight)) * 100;
  let best = ZOOM_LEVELS[0];
  ZOOM_LEVELS.forEach(z => { if(z <= fitZoomRaw) best = z; });
  zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, best));

  renderToolbar();
  renderCanvas();
  updateZoomLabel();
  renderBlockList();

  const cell = currentCellSize();
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
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    width: gridWidth, height: gridHeight, pixelData: pixels, blockStatus, designId: currentDesignId,
    frameId: activeFrameId, partId: activePartId, locked: isLocked,
  }));
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
    existing.frameId = activeFrameId;
    existing.partId = activePartId;
    existing.locked = isLocked;
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
    frameId: activeFrameId,
    partId: activePartId,
    locked: isLocked,
    updatedAt: Date.now(),
  };
  savedDesigns.push(design);
  persistSavedDesigns();
  currentDesignId = design.id;
  saveDraft();
  showToast(T("art_toast_saved", "保存しました"));
}

// ── 進捗（未着手/作業中/完了）の判定 ──
// ぬり方ガイドの完了時と、10×10ブロック表示のタップ（未着手/作業中/完了の3段階）で
// 更新される既存のblockStatusをそのまま進捗の元データとして使う。新しいデータを
// 持たせず、既存の仕組みと完全に連動させるため
function computeDesignProgress(design){
  const blocksX = Math.ceil(design.width / BLOCK_SIZE);
  const blocksY = Math.ceil(design.height / BLOCK_SIZE);
  const totalBlocks = blocksX * blocksY;
  const statuses = Object.values(design.blockStatus || {});
  const doneBlocks = statuses.filter(s => s === 2).length;
  const anyProgress = statuses.length > 0;
  const percent = totalBlocks > 0 ? Math.round((doneBlocks / totalBlocks) * 100) : 0;
  const status = doneBlocks >= totalBlocks && totalBlocks > 0 ? "done" : anyProgress ? "inProgress" : "notStarted";
  return { status, percent };
}

function openMyDesignsModal(){
  renderMyDesignsFilters();
  renderMyDesignsList();
  document.getElementById("myDesignsModal").style.display = "block";
}

function closeMyDesignsModal(){
  document.getElementById("myDesignsModal").style.display = "none";
}

function renderMyDesignsFilters(){
  const el = document.getElementById("artMyDesignsFilters");
  if(!el) return;
  if(!savedDesigns.length){
    el.innerHTML = "";
    return;
  }
  const progressById = new Map(savedDesigns.map(d => [d.id, computeDesignProgress(d)]));
  const counts = { all: savedDesigns.length, notStarted: 0, inProgress: 0, done: 0 };
  progressById.forEach(p => { counts[p.status]++; });
  const filters = [
    ["all", T("art_mydesigns_filter_all", "すべて")],
    ["notStarted", T("art_mydesigns_filter_not_started", "未着手")],
    ["inProgress", T("art_mydesigns_filter_in_progress", "作業中")],
    ["done", T("art_mydesigns_filter_done", "完了")],
  ];
  el.innerHTML = filters.map(([key, label]) => `
    <button class="art-mydesigns-filter-chip${myDesignsFilter === key ? " is-active" : ""}" data-filter="${key}">${label}（${counts[key]}）</button>
  `).join("");
  el.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      myDesignsFilter = btn.dataset.filter;
      renderMyDesignsFilters();
      renderMyDesignsList();
    });
  });
}

function renderMyDesignsList(){
  const el = document.getElementById("artMyDesignsList");
  if(!savedDesigns.length){
    el.innerHTML = `<div class="art-mydesigns-empty">${T("art_mydesigns_empty", "保存したデザインはまだありません")}</div>`;
    return;
  }
  const withProgress = savedDesigns.map(d => ({ design: d, progress: computeDesignProgress(d) }));
  const filtered = myDesignsFilter === "all" ? withProgress : withProgress.filter(x => x.progress.status === myDesignsFilter);
  if(!filtered.length){
    el.innerHTML = `<div class="art-mydesigns-empty">${T("art_mydesigns_filter_empty", "該当するデザインはありません")}</div>`;
    return;
  }
  // 作業中のデザインを常に上に固定し、それ以外は更新日時の新しい順にする
  const sorted = filtered.slice().sort((a, b) => {
    const aPinned = a.progress.status === "inProgress" ? 1 : 0;
    const bPinned = b.progress.status === "inProgress" ? 1 : 0;
    if(aPinned !== bPinned) return bPinned - aPinned;
    return b.design.updatedAt - a.design.updatedAt;
  });
  const statusLabel = {
    notStarted: T("art_mydesigns_filter_not_started", "未着手"),
    inProgress: T("art_mydesigns_filter_in_progress", "作業中"),
    done: T("art_mydesigns_filter_done", "完了"),
  };
  el.innerHTML = sorted.map(({ design: d, progress }) => `
    <div class="art-mydesign-item${d.id === currentDesignId ? " current" : ""}">
      <canvas class="art-mydesign-thumb" id="artMyDesignThumb_${d.id}"></canvas>
      <div class="art-mydesign-info">
        <div class="art-mydesign-name">${escapeHtml(d.name)}</div>
        <div class="art-mydesign-meta">${d.width} × ${d.height}</div>
        <div class="art-mydesign-progress-row">
          <div class="art-mydesign-progress-bar"><div class="art-mydesign-progress-fill is-${progress.status}" style="width:${progress.percent}%"></div></div>
          <span class="art-mydesign-progress-label is-${progress.status}">${statusLabel[progress.status]} ${progress.percent}%</span>
        </div>
      </div>
      <div class="art-mydesign-actions">
        <button onclick="loadDesign('${d.id}')">${T("art_open", "開く")}</button>
        <button onclick="deleteDesign('${d.id}')">${T("art_delete", "削除")}</button>
      </div>
    </div>
  `).join("");
  sorted.forEach(({ design: d }) => {
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
  inspectedCell = null;
  currentDesignId = design.id;
  activeFrameId = design.frameId || null;
  activePartId = design.partId || null;
  isLocked = !!design.locked;
  editMode = false;
  rebuildActiveMask();
  undoStack = [];
  redoStack = [];
  highlightedColor = null;
  closeMyDesignsModal();
  renderToolbar();
  renderCanvas();
  updateColorUsage();
  updateUndoRedoButtons();
  renderBlockList();
  renderLockUI();
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
  renderMyDesignsFilters();
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

// ── 共有コード（アカウント不要で、文字列だけでデザインを共有・バックアップする） ──
function bindShareCodeControls(){
  document.getElementById("artShareCodeBtn").addEventListener("click", openShareCodeModal);
  document.getElementById("artShareCodeCloseBtn").addEventListener("click", closeShareCodeModal);
  document.getElementById("artShareCodeCopyBtn").addEventListener("click", () =>
    copyTextToClipboard(document.getElementById("artShareCodeText").value, "artShareCodeCopyBtn"));
  document.getElementById("artShareUrlCopyBtn").addEventListener("click", () =>
    copyTextToClipboard(document.getElementById("artShareUrlText").value, "artShareUrlCopyBtn"));

  document.getElementById("artImportCodeBtn").addEventListener("click", openImportCodeModal);
  document.getElementById("artImportCodeCloseBtn").addEventListener("click", closeImportCodeModal);
  document.getElementById("artImportCodeSubmitBtn").addEventListener("click", importFromPastedCode);
}

function currentDesignName(){
  const design = currentDesignId ? savedDesigns.find(d => d.id === currentDesignId) : null;
  return design ? design.name : "";
}

function openShareCodeModal(){
  const code = encodeDesignToShareCode({
    width: gridWidth, height: gridHeight, pixelData: pixels,
    frameId: activeFrameId, partId: activePartId, name: currentDesignName(),
  });
  const url = buildShareUrl(code);
  document.getElementById("artShareCodeText").value = code;
  document.getElementById("artShareUrlText").value = url;
  renderShareQrCode(url);
  document.getElementById("artShareCodeModal").style.display = "block";
}

function closeShareCodeModal(){
  document.getElementById("artShareCodeModal").style.display = "none";
}

function renderShareQrCode(url){
  const el = document.getElementById("artShareQr");
  el.innerHTML = "";
  // QRコードに収まらないほど長いURLになった場合（巨大なキャンバス等）は、コード/URLの
  // コピーは引き続き使えるようにしつつ、QR表示だけ静かに諦める
  try{
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    const img = document.createElement("img");
    img.src = qr.createDataURL(4, 4);
    img.alt = "";
    img.className = "art-share-qr-img";
    el.appendChild(img);
  }catch(e){
    el.innerHTML = `<p class="art-share-qr-fallback">${T("art_share_qr_too_long", "QRコードにするには長すぎるため、コードかURLをコピーしてください")}</p>`;
  }
}

// navigator.clipboardが使えない環境（iOSの一部条件など）向けに、textareaのselect+execCommandへ
// フォールバックする汎用のクリップボードコピー
function copyTextToClipboard(text, btnId){
  const showCopied = () => {
    const btn = document.getElementById(btnId);
    if(!btn) return;
    const original = btn.dataset.label || btn.textContent;
    btn.dataset.label = original;
    btn.textContent = T("art_copied", "コピーしました");
    setTimeout(() => { btn.textContent = original; }, 1500);
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(showCopied).catch(() => fallbackCopyToClipboard(text, showCopied));
  }else{
    fallbackCopyToClipboard(text, showCopied);
  }
}

function fallbackCopyToClipboard(text, onDone){
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try{
    document.execCommand("copy");
    onDone();
  }catch(e){
    // コピーに失敗しても、テキストは画面上に表示されたままなので手動選択で対応できる
  }
  document.body.removeChild(ta);
}

function openImportCodeModal(){
  document.getElementById("artImportCodeInput").value = "";
  document.getElementById("artImportCodeError").textContent = "";
  document.getElementById("artImportCodeModal").style.display = "block";
}

function closeImportCodeModal(){
  document.getElementById("artImportCodeModal").style.display = "none";
}

function importFromPastedCode(){
  const raw = document.getElementById("artImportCodeInput").value;
  const result = decodeShareCode(raw);
  if(result.error){
    document.getElementById("artImportCodeError").textContent = T(result.error, "共有コードの読み込みに失敗しました");
    return;
  }
  const hasExistingContent = pixels.some(c => c);
  if(hasExistingContent && !confirm(T("art_share_import_confirm_overwrite", "現在編集中のデザインを、共有されたデザインに置き換えます。よろしいですか？"))){
    return;
  }
  applyImportedDesign(result);
  closeImportCodeModal();
  showToast(T("art_import_success", "デザインを読み込みました"));
}

// 編集中に共有コードを読み込んだ場合：ライブの状態を直接置き換えて再描画する
function applyImportedDesign(design){
  gridWidth = design.width;
  gridHeight = design.height;
  pixels = design.pixelData.slice();
  blockStatus = {};
  currentDesignId = null;
  activeFrameId = design.frameId;
  activePartId = design.partId;
  isLocked = false;
  editMode = false;
  inspectedCell = null;
  highlightedColor = null;
  undoStack = [];
  redoStack = [];
  rebuildActiveMask();
  renderToolbar();
  renderCanvas();
  updateColorUsage();
  renderBlockList();
  renderLockUI();
  saveDraft();
}

// 起動時：URLの?d=を検知して読み込む（上書き確認付き）。initArtEditor()内、通常の下書き
// 読み込みより前に呼ばれ、下書き代わりのオブジェクトを返すことで以降の初期化処理に合流する
function applyShareCodeFromUrlIfPresent(existingDraft){
  const params = new URLSearchParams(location.search);
  const code = params.get("d");
  if(!code) return existingDraft;

  // 一度読み込んだらURLから消す（リロード・戻る操作での再適用を防ぐ）
  params.delete("d");
  const newSearch = params.toString();
  history.replaceState(null, "", location.pathname + (newSearch ? `?${newSearch}` : "") + location.hash);

  const result = decodeShareCode(code);
  if(result.error){
    alert(T(result.error, "共有コードの読み込みに失敗しました"));
    return existingDraft;
  }

  const hasExistingContent = existingDraft && Array.isArray(existingDraft.pixelData) && existingDraft.pixelData.some(c => c);
  if(hasExistingContent && !confirm(T("art_share_import_confirm_overwrite", "現在編集中のデザインを、共有されたデザインに置き換えます。よろしいですか？"))){
    return existingDraft;
  }

  return {
    width: result.width, height: result.height, pixelData: result.pixelData,
    frameId: result.frameId, partId: result.partId, blockStatus: {}, designId: null, locked: false,
  };
}

// ── ヘルプモーダル ──
function openHelpModal(){
  document.getElementById("helpModal").style.display = "block";
}

function closeHelpModal(){
  document.getElementById("helpModal").style.display = "none";
}

// ── 初回チュートリアル（ゲームのチュートリアルのように、関連ボタンを順番に吹き出しで案内する） ──
// 一度最後まで見る／スキップすると再表示しない（ヘルプモーダルの「もう一度見る」からはいつでも再生できる）
const TUTORIAL_DONE_KEY = "hatopiArt_tutorialDone";
const TUTORIAL_STEPS = [
  { selector: "#artEditModeBtn", title: "① 編集する", text: "まずはこのボタンをONにしてください。ONの間だけキャンバスに描き込めます（誤タップ防止のためです）。" },
  { selector: "#artToolbar", title: "② ツール", text: "ペン・消しゴム・バケツ（塗りつぶし）・スポイト（色を拾う）を切り替えられます。元に戻す・やり直す・全消去もここから。" },
  { selector: "#artBrushSizeSection", title: "③ 太さ", text: "ペン・消しゴムの太さを1〜4マスから選べます。" },
  { selector: "#artPaletteMains", title: "④ カラー", text: "ゲーム内と同じ色から選びます。タップするとサブカラー（詳細な色合い）が展開します。" },
  { selector: "#artZoomControls", title: "⑤ 拡大率", text: "スライダーで自由に拡大・縮小できます。スマホなら2本指のピンチ操作でも変更できます。" },
  { selector: "#artLockBtn", title: "⑥ 固定する", text: "描き終えたら固定しておくと、誤って上書きしてしまうのを防げます。" },
  { selector: "#artSaveBtn", title: "⑦ 保存する", text: "名前を付けて保存すると、「一覧を見る」からいつでも呼び出せます。エクスポートからPNG保存・共有もできます。" },
];
let tutorialStep = 0;

// gridSizeModal表示中（＝まだキャンバスを作成していない）はチュートリアルを開始しない。
// キャンバス作成完了（createCanvas）のタイミングで呼び直される
function maybeStartTutorial(){
  if(document.getElementById("gridSizeModal").style.display === "block") return;
  if(localStorage.getItem(TUTORIAL_DONE_KEY) === "true") return;
  setTimeout(startTutorial, 400);
}

function startTutorial(){
  tutorialStep = 0;
  document.getElementById("artTutorialBackdrop").style.display = "block";
  document.getElementById("artTutorialHighlight").style.display = "block";
  document.getElementById("artTutorialPopup").style.display = "block";
  renderTutorialStep();
}

function renderTutorialStep(){
  const step = TUTORIAL_STEPS[tutorialStep];
  const target = step ? document.querySelector(step.selector) : null;
  if(!step || !target || target.offsetParent === null){
    // 対象ボタンが非表示（別ツール選択中など）の場合はスキップして次へ
    if(tutorialStep < TUTORIAL_STEPS.length - 1){
      tutorialStep++;
      renderTutorialStep();
    }else{
      endTutorial();
    }
    return;
  }
  document.getElementById("artTutorialStepLabel").textContent = `${tutorialStep + 1} / ${TUTORIAL_STEPS.length}`;
  document.getElementById("artTutorialText").innerHTML = `<strong>${step.title}</strong><br>${step.text}`;
  document.getElementById("artTutorialNextBtn").textContent = tutorialStep === TUTORIAL_STEPS.length - 1 ? "はじめる" : "次へ";
  // スムーススクロールだとアニメーション完了前に位置を確定してしまい枠がズレるため、
  // 即座にジャンプさせてからレイアウト確定後（次の描画フレーム）に位置を合わせる
  target.scrollIntoView({ block: "center", behavior: "auto" });
  requestAnimationFrame(() => requestAnimationFrame(() => positionTutorialElements(target)));
}

function positionTutorialElements(target){
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

function nextTutorialStep(){
  if(tutorialStep >= TUTORIAL_STEPS.length - 1){
    endTutorial();
    return;
  }
  tutorialStep++;
  renderTutorialStep();
}

function endTutorial(){
  localStorage.setItem(TUTORIAL_DONE_KEY, "true");
  document.getElementById("artTutorialBackdrop").style.display = "none";
  document.getElementById("artTutorialHighlight").style.display = "none";
  document.getElementById("artTutorialPopup").style.display = "none";
}

function replayTutorial(){
  closeHelpModal();
  localStorage.removeItem(TUTORIAL_DONE_KEY);
  setTimeout(startTutorial, 250);
}

function bindTutorialControls(){
  document.getElementById("artTutorialSkipBtn").addEventListener("click", endTutorial);
  document.getElementById("artTutorialNextBtn").addEventListener("click", nextTutorialStep);
  const repositionIfActive = () => {
    if(document.getElementById("artTutorialPopup").style.display === "none") return;
    const step = TUTORIAL_STEPS[tutorialStep];
    const target = step ? document.querySelector(step.selector) : null;
    if(target) positionTutorialElements(target);
  };
  window.addEventListener("resize", repositionIfActive);
  // ページ側のレイアウトが原因でわずかにスクロール位置がずれるケースの保険として、
  // スクロール中も枠がターゲットに追従するようにする
  window.addEventListener("scroll", repositionIfActive, { passive: true });
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
  renderBrushSizeControls();
  renderLockUI();
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
