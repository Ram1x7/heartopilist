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

// 低い壁は幅4のパネルなので、支柱換算での敷地幅上限（SITE_MAX_WIDTH＝96マス分）
// をそのまま「列数」の上限にすると、実際の物理幅は4倍（384マス分）になって
// しまい敷地からはみ出す。横一列に敷き詰められる最大数は 96 ÷ 4 = 24枚
const WALL_MAX_WIDTH = Math.floor(SITE_MAX_WIDTH / 4);

// 低い壁は高さ2のパネルで、ゲーム内では地面から16枚分（実際の高さ32マス分）
// までしか積み上げられない。支柱用のSITE_MAX_HEIGHT（68）をそのまま流用すると
// 実際には置けない段数まで指定できてしまうため、低い壁専用の上限を別に持つ
const WALL_MAX_HEIGHT_TIERS = 16;

// 現在のモードにおける「幅」スライダーの上限マス数
function currentWidthMax(){
  return settings.mode === "wall" ? WALL_MAX_WIDTH : SITE_MAX_WIDTH;
}

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
  mode: "solid",       // "solid"（立体・像） | "flat"（平面・床） | "wall"（低い壁・壁画）
  width: 24,           // 幅マス数（画像の横方向解像度）。もう一方の軸は画像比率から自動算出
  thickness: 6,        // solid: 奥行きの押し出し量 / flat: 起伏の最大高さ（wallでは未使用）
  hollow: true,         // 空洞化（solidのみ有効）
  autoTransparentBg: false,
  limitColors: false,  // 色数を絞る
  colorCount: 16,       // 絞り込む色数の上限
  // 低い壁モード専用：サイズの基準（"width"＝幅を指定して積む段数を自動算出／
  // "height"＝積む段数を指定して幅を自動算出）。どちらを選んでも画像の縦横比に
  // 合わせてもう一方の軸が自動計算される
  wallSizeBasis: "width",
  wallHeight: 16,       // 高さ基準時に使う段数（低い壁を積む段数）
};

let resultVoxels = null;   // [{x,y,z,materialId,hex,name}]（solid/flat用）
let resultDims = null;     // {w,h,d}（solid/flat用）

// 低い壁（壁画）モード専用の結果データ。低い壁は幅4×奥行き0.5×高さ2という
// 支柱とは全く異なる実寸のパネルで、押し出し・起伏を持たない単層の壁画なので、
// resultVoxels/resultDimsとは別に持つ（x:列, y:行。行y=0が壁画の最上段）
let resultWallSegments = null; // [{x,y,materialId,hex,name}]
let resultWallDims = null;     // {w,h}

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

// 現在のモードの結果データ（solid/flat=resultVoxels、wall=resultWallSegments）
// と、その外枠サイズを返す。wallモードのdimsには奥行き(d)が無い（常に単層のため）
function currentResultList(){
  return settings.mode === "wall" ? resultWallSegments : resultVoxels;
}
function currentResultDims(){
  return settings.mode === "wall" ? resultWallDims : resultDims;
}

// 3Dビューの再描画。wallモードは低い壁専用の描画関数（Build3D.setWallSegments）
// を使う。それ以外（solid/flat）は従来通り支柱用のsetVoxelsを使う
function refreshResultView(opts){
  if(settings.mode === "wall"){
    Build3D.setWallSegments(getVisibleVoxels(), resultWallDims, opts);
  }else{
    Build3D.setVoxels(getVisibleVoxels(), opts);
  }
}

function refreshVoxelView(){
  refreshResultView({ fit: false });
  renderBuildMaterialList();
  renderBuildBlockList();
}

function inBounds(x, y, z){
  return resultDims && x >= 0 && x < resultDims.w && y >= 0 && y < resultDims.h && z >= 0 && z < resultDims.d;
}

// ══════════════════════════════════════
// 施工ステージ表示
// 立体・低い壁モード：下から積み上げた場合に何段目（Y軸）まで見えるかのスライダー
// 平面モード：画像の上端の行から何列目（Z軸）まで見えるかのスライダー
// （平面は高さの起伏がほぼ無い床パターンのため、Y軸で段階分けしても
// 　ほとんど動きが無い＝実質スライダーが機能しない。行単位の方が
// 　実際の設置順序（1列ずつ奥/手前へ敷いていく）に対応する）
// ══════════════════════════════════════
let progressLayer = 1; // 1〜progressMax()。progressMax()＝全て表示

function progressAxis(){
  return settings.mode === "flat" ? "z" : "y";
}

function progressMax(){
  const dims = currentResultDims();
  if(!dims) return 1;
  return settings.mode === "flat" ? dims.d : dims.h;
}

function isProgressFull(){
  return !currentResultDims() || progressLayer >= progressMax();
}

function getVisibleVoxels(){
  const list = currentResultList();
  if(!list) return [];
  if(isProgressFull()) return list;
  const axis = progressAxis();
  return list.filter(v => v[axis] < progressLayer);
}

function setupProgressSlider(){
  const slider = document.getElementById("buildProgressSlider");
  if(!currentResultDims()) return;
  const max = progressMax();
  slider.max = String(Math.max(1, max));
  progressLayer = max;
  slider.value = String(progressLayer);
  updateProgressUI();
}

function updateProgressUI(){
  const output = document.getElementById("buildProgressOutput");
  const hint = document.getElementById("buildProgressHint");
  const full = isProgressFull();
  const label = settings.mode === "flat" ? "build_progress_row" : "build_progress_layer";
  const fallback = settings.mode === "flat" ? "{n}列目" : "{n}段目";
  output.textContent = full ? T("build_progress_all", "全て") : T(label, fallback).replace("{n}", progressLayer);
  hint.style.display = full ? "none" : "block";
  // 施工ステージ表示中（全て以外）はペン/消しゴム/建材選択を無効化する
  // （Undo/Redoは編集履歴の有無で別途制御するため、ここでは触らない。
  // 　低い壁モードはそもそも編集ツールバー自体を非表示にしている）
  ["buildToolPenBtn", "buildToolEraserBtn", "buildPaletteBtn"].forEach(id => {
    document.getElementById(id).disabled = !full;
  });
  document.getElementById("buildProgressMinusBtn").disabled = progressLayer <= 1;
  document.getElementById("buildProgressPlusBtn").disabled = !currentResultDims() || progressLayer >= progressMax();
}

function applyProgressLayer(){
  const slider = document.getElementById("buildProgressSlider");
  slider.value = String(progressLayer);
  updateProgressUI();
  refreshResultView({ fit: false });
}

function handleProgressSliderChange(){
  const slider = document.getElementById("buildProgressSlider");
  progressLayer = Number(slider.value);
  applyProgressLayer();
}

function stepProgressLayer(delta){
  if(!currentResultDims()) return;
  progressLayer = Math.min(progressMax(), Math.max(1, progressLayer + delta));
  applyProgressLayer();
}

// ══════════════════════════════════════
// 配置ガイド（平面モード限定：4×4/8×8/16×16マスごとの罫線）
// アートのドット絵変換にある「10×10ブロックごとに塗る」効率化と同じ発想で、
// 建築を切りのいいブロック単位に分けて計画しやすくする。オフがデフォルト
// ══════════════════════════════════════
let blockGuideSize = 0; // 0＝オフ

// 低い壁（壁画）モードは手動でのペン/消しゴム編集に対応していない
// （壁パネルは支柱と実寸・グリッド単位が異なり、当たり判定を別途実装する必要が
// あるため、このバージョンでは配置図の自動生成のみ対応する）ので、
// 編集ツールバー自体を隠す
function updateEditToolbarVisibility(){
  const toolbar = document.getElementById("buildEditToolbar");
  if(toolbar) toolbar.style.display = settings.mode === "wall" ? "none" : "flex";
  // 低い壁モードはペン/消しゴム編集に対応していないため、案内文からも触れない
  const hint = document.getElementById("buildStageHint");
  if(hint){
    hint.textContent = settings.mode === "wall"
      ? T("build_stage_hint_wall", "ドラッグ：回転 / ホイール：ズーム")
      : T("build_stage_hint", "ドラッグ：回転 / ホイール：ズーム / タップ：ペンで追加・消しゴムで削除");
  }
}

function updateGuideRow(){
  const row = document.getElementById("buildGuideRow");
  if(!row) return;
  row.style.display = settings.mode === "flat" ? "flex" : "none";
  row.querySelectorAll(".build-guide-size-btn").forEach(btn => {
    btn.classList.toggle("active", Number(btn.dataset.size) === blockGuideSize);
  });
}

function applyBlockGuide(){
  const dark = document.body.classList.contains("dark");
  if(!resultDims || settings.mode !== "flat" || blockGuideSize <= 0){
    Build3D.setBlockGuide(0, null, dark);
    return;
  }
  Build3D.setBlockGuide(blockGuideSize, { w: resultDims.w, d: resultDims.d }, dark);
}

// ══════════════════════════════════════
// 設置手順ガイド（平面モード限定）
// アートのドット絵変換にある「ぬり方ガイド（効率のいい順番を見る）」と同じ
// 発想で、上の「配置ガイド」で区切ったブロック単位に、建材ごとにどのマスへ
// 置けばいいかを順番に確認できる。「効率のいい置き方を見る」ボタンは、置かれて
// いる全ブロックを番号順に自動で通しで案内する（アート版のぬり方ガイドと同じ
// 使い方）。ブロック一覧から番号を選ぶと、そのブロックだけに絞って同じ手順を
// 確認することもできる。ゲーム内の建築にはバケツ（まとめ塗り）のような機能が
// ないため、アート版のような境目/内側マスの区別・バケツ手順は行わず、建材ごとに
// 置くマスを個別に示すだけのシンプルな構成にしてある。積む段数（高さ）が2以上
// あるマスには、その場でスタックする個数を数字で表示する
// ══════════════════════════════════════
// [{bx, bz, bw, bh, blockNum, materialId, hex, name, cells:[{x,z,height}]}]
let flatGuideOrder = [];
let flatGuideStepIndex = 0;
let flatGuideIsFull = false; // true＝「効率のいい置き方を見る」で全ブロック通し、false＝1ブロックのみ

// 完成図の全マス（列ごとにまとめる。厚さ方向へ積まれた同じ建材は1マス＝1本の
// 支柱として数え、その本数をheightとして持つ）
function computeFlatTopCells(){
  if(!resultVoxels) return [];
  const map = new Map();
  resultVoxels.forEach(v => {
    const key = `${v.x},${v.z}`;
    const entry = map.get(key);
    if(entry) entry.height++;
    else map.set(key, { x: v.x, z: v.z, materialId: v.materialId, hex: v.hex, name: v.name, height: 1 });
  });
  return Array.from(map.values());
}

// 指定ブロック内のマスを建材ごとにまとめ、マス数が多い建材から手順化する
// （ブロックの位置情報bx/bz/bw/bh・番号blockNumを各手順に持たせておくことで、
// 単体ブロック表示・全ブロック通し表示のどちらも同じ描画コードで扱える）
function computeFlatBlockSteps(bx, bz, blockNum){
  const bw = Math.min(blockGuideSize, resultDims.w - bx * blockGuideSize);
  const bh = Math.min(blockGuideSize, resultDims.d - bz * blockGuideSize);
  const x0 = bx * blockGuideSize, z0 = bz * blockGuideSize;
  const inBlock = computeFlatTopCells().filter(c => c.x >= x0 && c.x < x0 + bw && c.z >= z0 && c.z < z0 + bh);
  const map = new Map();
  inBlock.forEach(c => {
    const key = c.materialId + "_" + c.hex;
    if(!map.has(key)) map.set(key, { materialId: c.materialId, hex: c.hex, name: c.name, cells: [] });
    map.get(key).cells.push({ x: c.x, z: c.z, height: c.height });
  });
  return Array.from(map.values())
    .sort((a, b) => b.cells.length - a.cells.length)
    .map(s => ({ bx, bz, bw, bh, blockNum, ...s }));
}

// 置かれているブロックの番号一覧（配置ガイドのマス割り・ブロック一覧と同じ並び）
function nonEmptyFlatBlocks(){
  if(!resultDims || blockGuideSize <= 0) return [];
  const blocksX = Math.ceil(resultDims.w / blockGuideSize);
  const blocksZ = Math.ceil(resultDims.d / blockGuideSize);
  const nonEmpty = new Set();
  computeFlatTopCells().forEach(c => {
    nonEmpty.add(`${Math.floor(c.x / blockGuideSize)}_${Math.floor(c.z / blockGuideSize)}`);
  });
  const blocks = [];
  for(let bz = 0; bz < blocksZ; bz++){
    for(let bx = 0; bx < blocksX; bx++){
      if(nonEmpty.has(`${bx}_${bz}`)) blocks.push({ bx, bz, blockNum: bz * blocksX + bx + 1 });
    }
  }
  return blocks;
}

// ブロック選択一覧。既にマスが置かれているブロックだけタップできるようにする
function renderBuildBlockList(){
  const wrap = document.getElementById("buildGuidePickerWrap");
  const el = document.getElementById("buildBlockList");
  if(!wrap || !el) return;
  if(settings.mode !== "flat" || blockGuideSize <= 0 || !resultDims){
    wrap.style.display = "none";
    el.innerHTML = "";
    return;
  }
  const blocksX = Math.ceil(resultDims.w / blockGuideSize);
  const blocksZ = Math.ceil(resultDims.d / blockGuideSize);
  const nonEmptyBlocks = nonEmptyFlatBlocks();
  const hasAny = nonEmptyBlocks.length > 0;
  document.getElementById("buildGuideAllBtn").style.display = hasAny ? "flex" : "none";
  const nonEmptyKeys = new Set(nonEmptyBlocks.map(b => `${b.bx}_${b.bz}`));
  el.style.gridTemplateColumns = `repeat(${blocksX}, 1fr)`;
  let html = "";
  for(let bz = 0; bz < blocksZ; bz++){
    for(let bx = 0; bx < blocksX; bx++){
      const num = bz * blocksX + bx + 1;
      const empty = !nonEmptyKeys.has(`${bx}_${bz}`);
      html += `<button type="button" class="art-block-btn" ${empty ? "disabled" : ""} data-bx="${bx}" data-bz="${bz}">${num}</button>`;
    }
  }
  el.innerHTML = html;
  el.querySelectorAll(".art-block-btn:not(:disabled)").forEach(btn => {
    btn.addEventListener("click", () => openFlatGuide(Number(btn.dataset.bx), Number(btn.dataset.bz)));
  });
  wrap.style.display = "block";
}

// 1ブロックだけに絞ったガイド（ブロック一覧からの選択）
function openFlatGuide(bx, bz){
  const blocks = nonEmptyFlatBlocks();
  const found = blocks.find(b => b.bx === bx && b.bz === bz);
  if(!found) return;
  const steps = computeFlatBlockSteps(bx, bz, found.blockNum);
  if(steps.length === 0){
    if(typeof showToast === "function") showToast(T("build_guide_empty", "このブロックにはまだ何も配置されていません"));
    return;
  }
  flatGuideIsFull = false;
  startFlatGuide(steps);
}

// 置かれている全ブロックをブロック番号順に自動で通しで案内する
// （アートページの「効率のいい順番を見る」に相当）
function openFlatGuideAll(){
  const blocks = nonEmptyFlatBlocks();
  const steps = blocks.flatMap(b => computeFlatBlockSteps(b.bx, b.bz, b.blockNum));
  if(steps.length === 0){
    if(typeof showToast === "function") showToast(T("build_guide_empty", "このブロックにはまだ何も配置されていません"));
    return;
  }
  flatGuideIsFull = true;
  startFlatGuide(steps);
}

function startFlatGuide(steps){
  flatGuideOrder = steps;
  flatGuideStepIndex = 0;
  document.getElementById("buildGuideOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";
  renderFlatGuideStep();
}

function closeFlatGuide(){
  const overlay = document.getElementById("buildGuideOverlay");
  if(overlay) overlay.style.display = "none";
  document.body.style.overflow = "";
}

// ブロック完了の軽い通知（振動含む。アートのぬり方ガイドと同じ演出）
function showGuideBlockCompleteFlash(blockNum){
  const el = document.getElementById("buildGuideBlockFlash");
  const textEl = document.getElementById("buildGuideBlockFlashText");
  if(!el || !textEl) return;
  textEl.textContent = T("build_guide_block_complete", `ブロック${blockNum} 完了！`, { block: blockNum });
  el.classList.add("is-visible");
  if(navigator.vibrate) navigator.vibrate(120);
  clearTimeout(showGuideBlockCompleteFlash._timer);
  showGuideBlockCompleteFlash._timer = setTimeout(() => el.classList.remove("is-visible"), 1100);
}

function flatGuideNext(){
  if(flatGuideStepIndex >= flatGuideOrder.length - 1){
    const label = flatGuideOrder[flatGuideStepIndex].blockNum;
    const wasFull = flatGuideIsFull;
    closeFlatGuide();
    if(typeof showToast === "function"){
      showToast(wasFull
        ? T("build_guide_all_done", "設置手順は以上です")
        : T("build_guide_block_done", `ブロック${label}の手順は以上です`, { block: label }));
    }
    return;
  }
  const prevBlockNum = flatGuideOrder[flatGuideStepIndex].blockNum;
  flatGuideStepIndex++;
  renderFlatGuideStep();
  const newBlockNum = flatGuideOrder[flatGuideStepIndex].blockNum;
  if(flatGuideIsFull && newBlockNum !== prevBlockNum) showGuideBlockCompleteFlash(prevBlockNum);
}

function flatGuidePrev(){
  if(flatGuideStepIndex <= 0) return;
  flatGuideStepIndex--;
  renderFlatGuideStep();
}

function renderFlatGuideStep(){
  const total = flatGuideOrder.length;
  const step = flatGuideOrder[flatGuideStepIndex];
  const stepNum = flatGuideStepIndex + 1;

  document.getElementById("buildGuideProgressLabel").textContent =
    T("build_guide_step_of", `${stepNum} / ${total}（ブロック${step.blockNum}）`, { current: stepNum, total, block: step.blockNum });
  document.getElementById("buildGuideProgressFill").style.width = `${(stepNum / total) * 100}%`;

  document.getElementById("buildGuideColorChip").style.background = step.hex;
  document.getElementById("buildGuideDetail").innerHTML = buildColorNumberLabel(step.materialId, step.hex) + step.name;

  const badges = document.getElementById("buildGuideMethodBadges");
  badges.innerHTML = "";
  const b = document.createElement("span");
  b.className = "art-guide-method-badge is-tap";
  b.textContent = T("build_guide_method_cells", `${step.cells.length}マスに設置`, { count: step.cells.length });
  badges.appendChild(b);

  document.getElementById("buildGuidePrevBtn").disabled = flatGuideStepIndex === 0;
  document.getElementById("buildGuideNextBtn").textContent =
    stepNum === total ? T("build_guide_finish", "完了") : T("build_guide_next", "次へ");

  renderFlatGuideCanvas();
}

// 今の手順のブロック＋周囲1マスの余白ぶんだけを表示範囲にする（配置ガイドの
// 罫線と同じブロック割りなので、実際の建築現場でも同じ単位で確認しやすい）
function flatGuideViewport(step){
  const pad = 1;
  const x0 = Math.max(0, step.bx * blockGuideSize - pad);
  const z0 = Math.max(0, step.bz * blockGuideSize - pad);
  const x1 = Math.min(resultDims.w - 1, step.bx * blockGuideSize + step.bw - 1 + pad);
  const z1 = Math.min(resultDims.d - 1, step.bz * blockGuideSize + step.bh - 1 + pad);
  return { ox: x0, oz: z0, w: x1 - x0 + 1, h: z1 - z0 + 1 };
}

function renderFlatGuideCanvas(){
  const cvs = document.getElementById("buildGuideCanvas");
  const step = flatGuideOrder[flatGuideStepIndex];
  if(!cvs || !step) return;
  const wrap = cvs.parentElement;
  const viewport = flatGuideViewport(step);
  const gctx = cvs.getContext("2d");
  const maxW = Math.max(40, wrap.clientWidth - 16);
  const maxH = Math.max(40, wrap.clientHeight - 16);
  const cell = Math.max(1, Math.floor(Math.min(maxW / viewport.w, maxH / viewport.h)));
  cvs.width = cell * viewport.w;
  cvs.height = cell * viewport.h;

  const dark = document.body.classList.contains("dark");
  gctx.clearRect(0, 0, cvs.width, cvs.height);
  gctx.fillStyle = dark ? "#1c1a17" : "#efe8d8";
  gctx.fillRect(0, 0, cvs.width, cvs.height);

  const currentKey = step.materialId + "_" + step.hex;
  const doneKeys = new Set();
  for(let i = 0; i < flatGuideStepIndex; i++){
    const s = flatGuideOrder[i];
    // 全ブロック通し表示では、後続ブロックにまだ手が付いていない同色マスまで
    // 「完了済み」扱いで表示されると紛らわしいため、今のブロックの手順だけを対象にする
    if(s.bx === step.bx && s.bz === step.bz) doneKeys.add(s.materialId + "_" + s.hex);
  }

  const cellMap = new Map();
  computeFlatTopCells().forEach(c => cellMap.set(`${c.x},${c.z}`, c));

  for(let vz = 0; vz < viewport.h; vz++){
    for(let vx = 0; vx < viewport.w; vx++){
      const c = cellMap.get(`${viewport.ox + vx},${viewport.oz + vz}`);
      if(!c) continue;
      const key = c.materialId + "_" + c.hex;
      const isCurrent = key === currentKey;
      gctx.globalAlpha = isCurrent || doneKeys.has(key) ? 1 : 0.25;
      gctx.fillStyle = c.hex;
      gctx.fillRect(vx * cell, vz * cell, cell, cell);
    }
  }
  gctx.globalAlpha = 1;

  // マス目の境界線（アートの塗り方ガイドと同じ、周りの色に関係なく見える縁取り線）
  if(cell >= 6){
    const gridPath = new Path2D();
    for(let vx = 0; vx <= viewport.w; vx++){ gridPath.moveTo(vx * cell, 0); gridPath.lineTo(vx * cell, cvs.height); }
    for(let vz = 0; vz <= viewport.h; vz++){ gridPath.moveTo(0, vz * cell); gridPath.lineTo(cvs.width, vz * cell); }
    gctx.strokeStyle = "rgba(255,255,255,0.9)";
    gctx.lineWidth = 2.4;
    gctx.stroke(gridPath);
    gctx.strokeStyle = "rgba(0,0,0,0.55)";
    gctx.lineWidth = 1;
    gctx.stroke(gridPath);
  }

  // 今のブロックの実際の範囲外は暗く重ね、外側の太枠で今のブロックをはっきり示す
  {
    const bvx0 = step.bx * blockGuideSize - viewport.ox;
    const bvz0 = step.bz * blockGuideSize - viewport.oz;
    const left = Math.max(0, bvx0 * cell), top = Math.max(0, bvz0 * cell);
    const right = Math.min(cvs.width, (bvx0 + step.bw) * cell), bottom = Math.min(cvs.height, (bvz0 + step.bh) * cell);
    gctx.fillStyle = "rgba(0,0,0,0.4)";
    gctx.fillRect(0, 0, cvs.width, top);
    gctx.fillRect(0, bottom, cvs.width, cvs.height - bottom);
    gctx.fillRect(0, top, left, bottom - top);
    gctx.fillRect(right, top, cvs.width - right, bottom - top);

    const frameWidth = Math.max(3, cell * 0.12);
    gctx.strokeStyle = "rgba(255,255,255,0.95)";
    gctx.lineWidth = frameWidth + 2.5;
    gctx.strokeRect(bvx0 * cell, bvz0 * cell, step.bw * cell, step.bh * cell);
    gctx.strokeStyle = "rgba(0,0,0,0.85)";
    gctx.lineWidth = frameWidth;
    gctx.strokeRect(bvx0 * cell, bvz0 * cell, step.bw * cell, step.bh * cell);
  }

  // 今の建材を置くマスに印を付ける（積む段数が2以上ある場合は本数を数字で表示）
  const dotColor = dark ? "#9ad0f0" : "#2373a8";
  gctx.fillStyle = dotColor;
  gctx.textAlign = "center";
  gctx.textBaseline = "middle";
  step.cells.forEach(({ x, z, height }) => {
    if(x < viewport.ox || z < viewport.oz || x >= viewport.ox + viewport.w || z >= viewport.oz + viewport.h) return;
    const vx = (x - viewport.ox) * cell, vz = (z - viewport.oz) * cell;
    if(height > 1){
      gctx.font = `bold ${Math.max(9, cell * 0.42)}px sans-serif`;
      gctx.fillText(String(height), vx + cell / 2, vz + cell / 2);
    }else{
      gctx.beginPath();
      gctx.arc(vx + cell / 2, vz + cell / 2, Math.max(1.2, cell * 0.2), 0, Math.PI * 2);
      gctx.fill();
    }
  });
}

// 3Dビューの床に1×1マスごとの点線・2×2マスごとの太線を常時表示する
// （トグルなし・全モード共通）。低い壁モードは支柱と実寸単位系が異なるため、
// build3d-scene.js側で低い壁専用の座標系を使う別関数（setWallFloorGrid）に
// 振り分ける
function applyFloorGrid(){
  const dark = document.body.classList.contains("dark");
  if(settings.mode === "wall"){
    // setFloorGrid/setWallFloorGridはどちらも呼び出し時に既存のグリッドを
    // 消してから描き直すため、直前が別モードの床グリッドでも問題なく切り替わる
    Build3D.setWallFloorGrid(resultWallDims, dark);
    return;
  }
  Build3D.setFloorGrid(resultDims ? { w: resultDims.w, d: resultDims.d } : null, dark);
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
      ${material.colors.map((hex, i) => `
        <button type="button" class="build-material-swatch${selectedMaterial && selectedMaterial.materialId === material.id && selectedMaterial.hex === hex ? " active" : ""}"
          style="background:${hex}" data-material="${material.id}" data-hex="${hex}" data-name="${material.name}"
          aria-label="${material.name} #${i + 1}"><span class="art-swatch-code">${i + 1}</span></button>
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

// index: [{materialId,name,hex,lab}]の配列（getMaterialLabIndex()の戻り値、
// または後述deriveRestrictedPaletteIndex()が返す絞り込み後の部分集合）
function nearestFromIndex(lab, index){
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

function nearestMaterialFromLab(lab, materialItems){
  return nearestFromIndex(lab, getMaterialLabIndex(materialItems));
}

// ══════════════════════════════════════
// 色数を絞る（js/art-pixelate.jsのbuildPalette()と同じ考え方：まず制限なしで
// マッチングした結果の出現頻度を数え、上位n色だけを「この変換で使う色」として
// 残す。以降のマッチングはこの絞り込んだ色の中からのみ選ぶ）
// ══════════════════════════════════════
function deriveRestrictedPaletteIndex(cellsList, maxColors, materialItems){
  const fullIndex = getMaterialLabIndex(materialItems || MATERIALS.support_pillars.items);
  const counts = new Map();
  cellsList.forEach(cells => {
    cells.forEach(c => {
      if(!c) return;
      const key = c.materialId + "_" + c.hex;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  const byKey = new Map(fullIndex.map(e => [e.materialId + "_" + e.hex, e]));
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(1, maxColors))
    .map(([key]) => byKey.get(key))
    .filter(Boolean);
  return top.length > 0 ? top : fullIndex.slice(0, Math.max(1, maxColors));
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
    syncWallWidthFromHeight(); // 新しい画像の縦横比に合わせて幅（高さ基準時）を再計算
    updateWallAutoDimHint();
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
  // 低い壁モードは常に1層の壁画のため、厚さ（押し出し・起伏）の概念がない
  document.getElementById("buildThicknessRow").style.display = mode === "wall" ? "none" : "block";
  document.getElementById("buildResolutionTip").style.display = mode === "wall" ? "none" : "block";
  document.getElementById("buildWallModeTip").style.display = mode === "wall" ? "block" : "none";
  updateBackImageVisibility();
  updateColorCountMax();
  updateWidthMax();
  updateWallSizeBasisUI();
  readOptionInputs();
  if(frontImage) renderBuildCropGridOverlay();
}

// 低い壁モード専用：「幅を指定」／「高さを指定」の切り替えに応じて、
// 幅スライダー・高さスライダーの表示と、切替ボタンのactive状態を揃える
function updateWallSizeBasisUI(){
  const basisRow = document.getElementById("buildWallSizeBasisRow");
  const widthRow = document.getElementById("buildWidthRow");
  const heightRow = document.getElementById("buildWallHeightRow");
  if(!basisRow || !widthRow || !heightRow) return;
  const isWall = settings.mode === "wall";
  basisRow.style.display = isWall ? "flex" : "none";
  const heightBasis = isWall && settings.wallSizeBasis === "height";
  widthRow.style.display = heightBasis ? "none" : "block";
  heightRow.style.display = heightBasis ? "block" : "none";
  document.querySelectorAll(".build-wall-basis-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.basis === settings.wallSizeBasis);
  });
}

function setWallSizeBasis(basis){
  settings.wallSizeBasis = basis;
  updateWallSizeBasisUI();
  readOptionInputs();
  if(frontImage) renderBuildCropGridOverlay();
}

// 「幅」スライダーの上限を、現在のモードの敷地幅上限に合わせる
// （低い壁は幅4のパネルのため、支柱換算の上限96マスをそのまま使うと
// 実際の物理幅が敷地をはみ出してしまう＝24マスが上限）
function updateWidthMax(){
  const widthInput = document.getElementById("buildWidthInput");
  if(!widthInput) return;
  const max = currentWidthMax();
  widthInput.max = String(max);
  if(Number(widthInput.value) > max) widthInput.value = String(max);
}

// 「色数を絞る」スライダーの上限を、現在のモードの建材パレットの総色数に
// 合わせる（支柱系78色 / 低い壁の板張り49色、など）
function updateColorCountMax(){
  const colorCountInput = document.getElementById("buildColorCountInput");
  if(!colorCountInput) return;
  const totalColorCount = currentModeMaterialItems().reduce((sum, m) => sum + m.colors.length, 0);
  colorCountInput.max = String(totalColorCount);
  if(Number(colorCountInput.value) > totalColorCount) colorCountInput.value = String(totalColorCount);
}

function readOptionInputs(){
  if(settings.mode === "wall" && settings.wallSizeBasis === "height"){
    settings.wallHeight = Math.min(WALL_MAX_HEIGHT_TIERS, Math.max(2, Number(document.getElementById("buildWallHeightInput").value) || 2));
    document.getElementById("buildWallHeightOutput").textContent = `${settings.wallHeight}${T("build_unit_masu", "マス")}`;
    syncWallWidthFromHeight(); // 指定された段数から幅を逆算してsettings.widthへ書き戻す
  }else{
    settings.width = Math.min(currentWidthMax(), Math.max(2, Number(document.getElementById("buildWidthInput").value) || 2));
    document.getElementById("buildWidthOutput").textContent = `${settings.width}${T("build_unit_masu", "マス")}`;
  }
  settings.thickness = Math.min(40, Math.max(1, Number(document.getElementById("buildThicknessInput").value) || 1));
  settings.hollow = document.getElementById("buildHollowCheckbox").checked;
  settings.autoTransparentBg = document.getElementById("buildAutoTransparentCheckbox").checked;
  settings.limitColors = document.getElementById("buildLimitColorsCheckbox").checked;
  const colorCountInput = document.getElementById("buildColorCountInput");
  settings.colorCount = Math.min(Number(colorCountInput.max) || 74, Math.max(2, Number(colorCountInput.value) || 2));
  document.getElementById("buildThicknessOutput").textContent = `${settings.thickness}${T("build_unit_masu", "マス")}`;
  document.getElementById("buildColorCountOutput").textContent = `${settings.colorCount}${T("build_unit_colors", "色")}`;
  document.getElementById("buildColorCountRow").style.display = settings.limitColors ? "block" : "none";
  updateWallAutoDimHint();
}

// 低い壁モードで、選んだ基準（幅／高さ）に応じて、自動計算されたもう一方の
// 軸の値を案内する（幅基準なら「高さは何マスになるか」、高さ基準なら
// 「幅は何マスになるか」）
function updateWallAutoDimHint(){
  const hint = document.getElementById("buildWallAutoDimHint");
  if(!hint) return;
  if(settings.mode !== "wall" || !frontImage){
    hint.style.display = "none";
    return;
  }
  const unit = T("build_unit_masu", "マス");
  if(settings.wallSizeBasis === "height"){
    hint.textContent = T("build_wall_auto_width_hint", "横：{n}に自動調整されます").replace("{n}", `${settings.width}${unit}`);
  }else{
    hint.textContent = T("build_wall_auto_height_hint", "高さ：{n}に自動調整されます").replace("{n}", `${computeOtherDim()}${unit}`);
  }
  hint.style.display = "block";
}

let optionDebounceTimer = null;
function handleOptionInputChange(){
  readOptionInputs();
  clearTimeout(optionDebounceTimer);
  optionDebounceTimer = setTimeout(() => {
    if(frontImage) renderBuildCropGridOverlay();
  }, 150);
}

// 画像から求まる、幅に対するもう一方の軸（solid:高さ / flat:奥行き / wall:行数）のマス数
// 実際の支柱建材は1(幅)×1(奥行き)×2(高さ)で、幅・奥行きの2倍の高さがある
// （立方体の建材を前提にした換算ではない）。そのため立体モードで画像の縦横比
// から高さのマス数を決めるときは、ボクセル1段＝実際の支柱2個ぶんの高さに
// 相当することを踏まえ、単純な比率の半分のマス数にする。これにより、実際に
// 支柱で建てた完成物が、1×1×1の立方体で作った場合と同じ見た目の比率になる
// （平面モードのotherDimは奥行き軸で、この高さの特性とは無関係なので対象外）
const SOLID_HEIGHT_ASPECT_COMPENSATION = 2;
// 低い壁は幅4×高さ2（幅が高さの2倍）なので、壁1枚を1マスとして単純に正方形の
// グリッドを敷くと横に間延びして見える。1行あたりの物理的な高さが1列あたりの
// 物理的な幅の半分しかない分、同じ縦横比に見せるには行数を2倍にする必要がある
const WALL_ROW_ASPECT_COMPENSATION = 0.5;
// 1マスあたりの実際の物理縦横比（幅÷高さ）。solid/flatは支柱1本分＝正方形
// なので1:1だが、wallは低い壁1枚が幅4×高さ2で正方形ではない（2:1）ため、
// 位置調整画面のプレビュー（切り抜きビューポート・マス目オーバーレイ）の
// 縦横比をこの値で補正しないと、実際に建てたときと違う比率で表示されてしまう
const WALL_CELL_ASPECT = 2; // 低い壁1枚の幅4 ÷ 高さ2
function cellAspectRatio(){
  return settings.mode === "wall" ? WALL_CELL_ASPECT : 1;
}

function computeOtherDim(){
  if(!frontImage) return settings.width;
  // 低い壁モードで「高さを基準にする」を選んでいる場合は、ユーザーが指定した
  // 段数をそのまま使う（幅はsyncWallWidthFromHeight()で別途逆算してsettings.width
  // に書き戻し済みなので、他の全コードは従来通りsettings.widthを見るだけでよい）
  if(settings.mode === "wall" && settings.wallSizeBasis === "height"){
    return Math.min(WALL_MAX_HEIGHT_TIERS, Math.max(2, settings.wallHeight));
  }
  // 常に元画像そのものの縦横比を使う（切り抜き範囲＝manualCropRectは、
  // このwidth/otherDim比になるようcrop stageのビューポート自体を固定した上で
  // 選ばれるため、manualCropRect.sw/shから逆算すると、確定後は
  // 「width/otherDim」比そのものに一致してしまい、再度この関数を呼ぶたびに
  // 補正が重ねがけされてしまう＝毎回さらに半分になっていくバグになる）
  const aspect = frontImage.naturalWidth / frontImage.naturalHeight; // 幅/高さ
  const maxOther = settings.mode === "flat" ? SITE_MAX_DEPTH
    : settings.mode === "wall" ? WALL_MAX_HEIGHT_TIERS
    : SITE_MAX_HEIGHT;
  const compensation = settings.mode === "solid" ? SOLID_HEIGHT_ASPECT_COMPENSATION
    : settings.mode === "wall" ? WALL_ROW_ASPECT_COMPENSATION
    : 1;
  return Math.min(maxOther, Math.max(2, Math.round(settings.width / aspect / compensation)));
}

// computeOtherDim()の逆算版：低い壁モードで「高さを基準にする」場合、指定された
// 段数（settings.wallHeight）と画像の縦横比から幅（列数）を求め、settings.width
// に書き戻す。生成・切り抜き・グリッド表示など既存のコードは全てsettings.width
// を直接参照しているため、こうして同期しておけば他のコードを一切変更せずに
// 「高さ基準」の指定方法をそのまま使い回せる
function syncWallWidthFromHeight(){
  if(!frontImage || settings.mode !== "wall" || settings.wallSizeBasis !== "height") return;
  const aspect = frontImage.naturalWidth / frontImage.naturalHeight; // 幅/高さ
  const derivedWidth = Math.round(settings.wallHeight * aspect * WALL_ROW_ASPECT_COMPENSATION);
  settings.width = Math.min(WALL_MAX_WIDTH, Math.max(2, derivedWidth));
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

  // 高さ基準の場合、settings.widthは前回の画像から逆算した値のままの
  // 可能性があるため、切り抜き画面を開くたびに現在の画像で必ず再同期する
  syncWallWidthFromHeight();
  const otherDim = computeOtherDim();
  const targetKey = `${settings.width}x${otherDim}`;
  const viewport = document.getElementById("buildCropViewport");
  viewport.style.aspectRatio = `${settings.width * cellAspectRatio()} / ${otherDim}`;
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

// 現在のモードでマッチングに使う建材リスト（solid/flat=支柱系、wall=低い壁系）
function currentModeMaterialItems(){
  return settings.mode === "wall" ? MATERIALS.low_walls.items : MATERIALS.support_pillars.items;
}

// 画像1枚をw×hの2Dグリッドへ変換する（建材マッチング＋ディザリング＋輪郭保持）。
// paletteIndex省略時はmaterialItems（省略時は支柱系）の全色から選ぶ。
// 色数を絞る場合はderiveRestrictedPaletteIndex()で作った部分集合を渡す
// 戻り値: { cells: [{materialId,hex,name}|null], rawColors: [[r,g,b]|null] }
// rawColorsは平面モードの起伏（高さ）算出に使う量子化前の色
function computeMatchedGrid(image, naturalW, naturalH, rect, w, h, autoTransparentBg, paletteIndex, materialItems){
  const src = autoTransparentBg ? buildAutoTransparentCanvas(image) : image;
  const srcW = autoTransparentBg ? src.width : naturalW;
  const srcH = autoTransparentBg ? src.height : naturalH;
  const scaleX = autoTransparentBg ? srcW / naturalW : 1;
  const scaleY = autoTransparentBg ? srcH / naturalH : 1;
  const scaledRect = autoTransparentBg
    ? { sx: rect.sx * scaleX, sy: rect.sy * scaleY, sw: rect.sw * scaleX, sh: rect.sh * scaleY }
    : rect;

  const index = paletteIndex || getMaterialLabIndex(materialItems || MATERIALS.support_pillars.items);
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
        cells[idx] = nearestFromIndex(lab, index);
        continue;
      }
      const err = errors[idx];
      const dithered = err ? [lab[0] + err[0], lab[1] + err[1], lab[2] + err[2]] : lab;
      const match = nearestFromIndex(dithered, index);
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
  // dist/maxDistをそのまま使うと断面が円錐（ピラミッド型）になり、中心から
  // 少し外れただけで急激に薄くなってしまう（輪郭からの距離はシルエット中心
  // からの距離rに対してほぼ線形＝(R-r)/Rのため）。参考サイトのような
  // ドーム（半球）型にするには、線形値t=(R-r)/Rを t=1-r/R とみなして
  // sqrt(1-(1-t)^2) = sqrt(1-(r/R)^2) の球断面カーブに変換する
  // （円形シルエットで検証済み：真の半球の理論値と完全に一致する）
  const bulge = new Array(n).fill(0);
  for(let i = 0; i < n; i++){
    if(cells[i]){
      const t = dist[i] / maxDist;
      bulge[i] = Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));
    }
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

// wall（低い壁・壁画）：正面グリッドの各マスを、そのまま低い壁パネル1枚に
// 変換する。押し出し・起伏なし（低い壁は常に単層の壁画として配置する）。
// 画像の行y=0（画像の上端）は壁画の最上段（ワールドY最大）に対応させるため
// 反転させる（立体モードの上下反転と同じ理由）
function buildWallMuralSegments(grid, w, h){
  const segments = [];
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const idx = y * w + x;
      const material = grid.cells[idx];
      if(!material) continue;
      segments.push({ x, y: h - 1 - y, materialId: material.materialId, hex: material.hex, name: material.name });
    }
  }
  return segments;
}

// ══════════════════════════════════════
// 生成の実行
// ══════════════════════════════════════
function runBuildGeneration(){
  if(!frontImage) return;
  const rect = manualCropRect || coverCropRect(frontImage.naturalWidth, frontImage.naturalHeight, settings.width, settings.width);
  const otherDim = computeOtherDim();
  const backRect = backImage ? coverCropRect(backImage.naturalWidth, backImage.naturalHeight, settings.width, otherDim) : null;
  const materialItems = currentModeMaterialItems();

  let paletteIndex; // undefined＝全色から選ぶ（デフォルト）
  if(settings.limitColors){
    // 1回目：制限なしでマッチングし、実際によく使われる色の出現頻度を数える
    const provisionalFront = computeMatchedGrid(
      frontImage, frontImage.naturalWidth, frontImage.naturalHeight,
      rect, settings.width, otherDim, settings.autoTransparentBg, undefined, materialItems
    );
    const provisionalCellsList = [provisionalFront.cells];
    if(settings.mode === "solid" && backImage){
      const provisionalBack = computeMatchedGrid(
        backImage, backImage.naturalWidth, backImage.naturalHeight,
        backRect, settings.width, otherDim, settings.autoTransparentBg, undefined, materialItems
      );
      provisionalCellsList.push(provisionalBack.cells);
    }
    paletteIndex = deriveRestrictedPaletteIndex(provisionalCellsList, settings.colorCount, materialItems);
  }

  const frontGrid = computeMatchedGrid(
    frontImage, frontImage.naturalWidth, frontImage.naturalHeight,
    rect, settings.width, otherDim, settings.autoTransparentBg, paletteIndex, materialItems
  );

  if(settings.mode === "solid"){
    let backGrid = null;
    if(backImage){
      backGrid = computeMatchedGrid(
        backImage, backImage.naturalWidth, backImage.naturalHeight,
        backRect, settings.width, otherDim, settings.autoTransparentBg, paletteIndex, materialItems
      );
    }
    resultVoxels = buildSolidVoxels(frontGrid, backGrid, settings.width, otherDim, settings.thickness, settings.hollow);
    resultDims = { w: settings.width, h: otherDim, d: settings.thickness };
    resultWallSegments = null;
    resultWallDims = null;
  }else if(settings.mode === "wall"){
    resultWallSegments = buildWallMuralSegments(frontGrid, settings.width, otherDim);
    resultWallDims = { w: settings.width, h: otherDim };
    resultVoxels = null;
    resultDims = null;
  }else{
    resultVoxels = buildFlatVoxels(frontGrid, settings.width, otherDim, settings.thickness);
    resultDims = { w: settings.width, h: settings.thickness, d: otherDim };
    resultWallSegments = null;
    resultWallDims = null;
  }

  ensureSceneInitialized();
  setupProgressSlider();
  blockGuideSize = 0;
  updateGuideRow();
  applyBlockGuide();
  renderBuildBlockList();
  applyFloorGrid();
  updateEditToolbarVisibility();
  Build3D.setBoundaryBoxVisible(settings.mode !== "wall");
  refreshResultView();
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
// 建材ID＋色hexから、その建材内での色番号（1始まり）を求める。ゲーム内の
// ペイント選択画面も同じ並び順で表示される想定のもと、data-materials.jsの
// colors配列の並び＝ゲーム内パレットの並びをそのまま番号として使う
function materialColorNumber(materialId, hex){
  for(const category of Object.values(MATERIALS)){
    const item = category.items.find(m => m.id === materialId);
    if(item){
      const idx = item.colors.indexOf(hex);
      return idx >= 0 ? idx + 1 : null;
    }
  }
  return null;
}

// 建材一覧・パレット選択などに差し込む色番号バッジのHTML
function buildColorNumberLabel(materialId, hex){
  const num = materialColorNumber(materialId, hex);
  return num ? `<span class="art-usage-number">#${num}</span> ` : "";
}

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
          run = key ? { key, materialId: v.materialId, name: v.name, hex: v.hex, height: 1 } : null;
        }
      }
      if(run && run.key) segments.push(run);
    }
  }
  return segments;
}

// 低い壁は支柱と違って高さ方向に伸縮する単位ではなく、1マス＝1枚の
// 固定サイズパネルなので、支柱のような縦方向の連続区間まとめ（高さNマス）は
// 行わず、色ごとの必要枚数を単純に数える
function computeWallSegmentCounts(){
  if(!resultWallSegments) return [];
  const counts = {};
  resultWallSegments.forEach(v => {
    const key = v.materialId + "_" + v.hex;
    if(!counts[key]) counts[key] = { materialId: v.materialId, name: v.name, hex: v.hex, count: 0 };
    counts[key].count++;
  });
  return Object.values(counts).sort((a, b) => b.count - a.count);
}

function renderBuildMaterialList(){
  const pillarCountLabel = document.getElementById("buildPillarCountLabel");
  if(settings.mode === "wall"){
    if(pillarCountLabel) pillarCountLabel.textContent = T("build_wall_count_label", "必要な壁の枚数");
    if(!resultWallSegments) return;
    const entries = computeWallSegmentCounts();
    document.getElementById("buildMaterialCount").textContent = entries.length;
    document.getElementById("buildCellCount").textContent = resultWallSegments.length.toLocaleString();
    document.getElementById("buildPillarCount").textContent = resultWallSegments.length.toLocaleString();
    document.getElementById("buildMaterialRows").innerHTML = entries.map(e => `
      <div class="art-result-color-row">
        <span class="art-result-color-swatch" style="background:${e.hex}"></span>
        <span class="art-result-color-code">${buildColorNumberLabel(e.materialId, e.hex)}${e.name}</span>
        <span class="art-result-color-count">${e.count}${T("build_unit_walls", "枚")}</span>
      </div>
    `).join("");
    return;
  }

  if(pillarCountLabel) pillarCountLabel.textContent = T("build_pillar_count_label", "必要な支柱の本数");
  if(!resultVoxels) return;
  const cellCount = resultVoxels.length;
  const segments = computeBuildPillarSegments();

  const counts = {};
  segments.forEach(seg => {
    const key = seg.key + "_" + seg.height;
    if(!counts[key]) counts[key] = { materialId: seg.materialId, name: seg.name, hex: seg.hex, height: seg.height, count: 0 };
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
      <span class="art-result-color-code">${buildColorNumberLabel(e.materialId, e.hex)}${e.name}${T("build_pillar_height_suffix", "（高さ{n}マス）").replace("{n}", e.height)}</span>
      <span class="art-result-color-count">${e.count}${T("build_unit_pillars", "本")}</span>
    </div>
  `).join("");
}

// ══════════════════════════════════════
// 最初からやり直す
// ══════════════════════════════════════
function resetBuildToUpload(){
  closeFlatGuide();
  frontImage = null;
  backImage = null;
  resultVoxels = null;
  resultDims = null;
  resultWallSegments = null;
  resultWallDims = null;
  manualCropRect = null;
  cropTargetKey = null;
  blockGuideSize = 0;
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
      : d.mode === "wall" ? `${d.dims.w}×${d.dims.h}` : `${d.dims.w}×${d.dims.h}×${d.dims.d}`;
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
  const isWall = settings.mode === "wall";
  if(isWall ? (!resultWallSegments || !resultWallDims) : (!resultVoxels || !resultDims)){
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
    // 低い壁モードはdims={w,h}・voxelsは{x,y,materialId,hex,name}の配列（z無し）
    dims: isWall ? resultWallDims : resultDims,
    voxels: isWall ? resultWallSegments : resultVoxels,
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
  if(design.mode === "wall"){
    resultWallDims = design.dims;
    resultWallSegments = design.voxels.map(v => ({ ...v }));
    resultDims = null;
    resultVoxels = null;
  }else{
    resultDims = design.dims;
    resultVoxels = design.voxels.map(v => ({ ...v }));
    resultWallDims = null;
    resultWallSegments = null;
  }
  document.getElementById("buildUploadArea").style.display = "none";
  document.getElementById("buildCropStage").style.display = "none";
  document.getElementById("buildResultStage").style.display = "block";
  document.getElementById("buildDesignNameInput").value = design.name;
  ensureSceneInitialized();
  setupProgressSlider();
  blockGuideSize = 0;
  updateGuideRow();
  applyBlockGuide();
  renderBuildBlockList();
  applyFloorGrid();
  updateEditToolbarVisibility();
  Build3D.setBoundaryBoxVisible(settings.mode !== "wall");
  refreshResultView();
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
// 旧・壁画モード時代のチュートリアル既読フラグとは別のキーにする（3Dツールへの
// 全面刷新で内容が大きく変わったため、以前見たことがあるユーザーにも新しい
// チュートリアルを一度表示したい）
const BUILD_TUTORIAL_DONE_KEY = "hatopiBuild_tutorialDone_v2";
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
  document.getElementById("buildWallHeightInput").addEventListener("input", handleOptionInputChange);
  document.getElementById("buildThicknessInput").addEventListener("input", handleOptionInputChange);
  document.querySelectorAll(".build-wall-basis-btn").forEach(btn => {
    btn.addEventListener("click", () => setWallSizeBasis(btn.dataset.basis));
  });
  document.getElementById("buildHollowCheckbox").addEventListener("change", readOptionInputs);
  document.getElementById("buildAutoTransparentCheckbox").addEventListener("change", readOptionInputs);
  document.getElementById("buildLimitColorsCheckbox").addEventListener("change", readOptionInputs);
  document.getElementById("buildColorCountInput").addEventListener("input", readOptionInputs);

  updateColorCountMax();
  updateWidthMax();

  document.querySelectorAll(".build-guide-size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      blockGuideSize = Number(btn.dataset.size) || 0;
      updateGuideRow();
      applyBlockGuide();
      renderBuildBlockList();
    });
  });

  document.getElementById("buildGuideCloseBtn").addEventListener("click", closeFlatGuide);
  document.getElementById("buildGuideNextBtn").addEventListener("click", flatGuideNext);
  document.getElementById("buildGuidePrevBtn").addEventListener("click", flatGuidePrev);
  document.getElementById("buildGuideAllBtn").addEventListener("click", openFlatGuideAll);
  window.addEventListener("resize", () => {
    if(document.getElementById("buildGuideOverlay").style.display !== "none") renderFlatGuideCanvas();
  });

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
  document.getElementById("buildProgressMinusBtn").addEventListener("click", () => stepProgressLayer(-1));
  document.getElementById("buildProgressPlusBtn").addEventListener("click", () => stepProgressLayer(1));

  // ヘルプモーダル内の「チュートリアルをもう一度見る」ボタン。build.jsが
  // ESモジュールになったことで、BUILD_TUTORIAL_DONE_KEY等のモジュール内定数は
  // グローバルスコープのinline onclickからは参照できないため、ここで
  // addEventListenerとして結線する（closeHelpModal/replayPageTutorial自体は
  // 従来通りのクラシックスクリプトが定義するグローバル関数なのでモジュール側
  // から呼び出すことは問題ない）
  document.getElementById("buildTutorialReplayBtn").addEventListener("click", () => {
    closeHelpModal();
    replayPageTutorial(BUILD_TUTORIAL_DONE_KEY, BUILD_TUTORIAL_STEPS);
  });

  document.addEventListener("darkmodechange", () => {
    if(sceneInitialized){
      Build3D.setBackgroundColor(document.body.classList.contains("dark") ? 0x2c2823 : 0xf3ecdc);
      applyBlockGuide();
      applyFloorGrid();
    }
    if(document.getElementById("buildGuideOverlay").style.display !== "none") renderFlatGuideCanvas();
  });
}

document.addEventListener("langchange", () => {
  if(resultVoxels || resultWallSegments) renderBuildMaterialList();
  renderBuildLibraryList();
  if(document.getElementById("buildGuideOverlay").style.display !== "none") renderFlatGuideStep();
});

initBuildPage();
