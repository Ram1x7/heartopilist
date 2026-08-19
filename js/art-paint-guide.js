// js/art-paint-guide.js
// 「アート」エディターの塗り方ガイド機能
//
// ゲーム内のバケツ（塗りつぶし）ツールは、隙間なく囲まれた範囲を全部塗りつぶす。
// 逆に言えば、ほんの少しでも隙間があると、そこと繋がっている場所まで全部塗られて
// しまう。斜め方向にしか接していない（角だけで触れている）違う色があっても、
// その斜めの隙間から漏れて広がる可能性があるため、安全とは言えない。
// キャンバスの一番外側についても、本当に壁として機能するとは限らないため
// 特別扱いはせず、他の隙間と同じように扱う。
// そのため、上下左右だけでなく斜めも含めた周囲8マス全てが「同じ色のマスで
// 実際に埋まっている」場合だけを「内側マス」とし、それ以外（周囲8マスの
// どこかに違う色・未着色・キャンバスの外がある）は先に1マスずつ塗って
// 壁を作っておく「境目マス」として扱う。
//
//   ・完成図で周囲8マスのどこかに違う色／未着色／キャンバスの外がある＝「境目マス」→ 1マスずつタップ
//   ・周囲8マスが全部同じ色のマスで埋まっている＝「内側マス」→ 境目を塗った後ならバケツでまとめて塗れる
//
// 手順を「色ごと」だけでまとめると、同じ色が盤面のあちこちに散らばっている場合に
// 全体図の中の遠く離れた位置を指すだけになり、実際にゲーム内のどこを見ればいいか
// 分かりにくい。実際に操作するのは人間なので、まずは「10×10ブロック表示」機能と
// 同じ番号のブロック単位で場所をまとめ、ブロックの中では色ごとにまとめる2段階の
// 構成にした。ブロックは既存の進捗トラッカー（未着手/作業中/完了）と同じ番号・
// 並び順にしてあるので、ガイドを見ながら実際のブロック一覧で進捗も追いやすい。

let paintGuideOrder = [];
let paintGuideStepIndex = 0;
let paintGuideForceView = null; // null=現在のブロックへズーム / "full"=全体表示（ステップが変わるたびリセット）
let paintGuideStartedAt = null; // ガイドを開始した時刻（実測ペースからの残り時間再計算に使う）

// ── 所要時間の見積もり ──
// 開始直後はまだ実測ペースがないため、1マスずつのタップとバケツひと押しに
// それぞれ固定の目安秒数を割り当てて計算する。実際に「次へ」を押して手順を
// 進めるたびに、経過時間÷完了したアクション数から実測ペースを求め、以降は
// そちらを優先することで、人によって差が出る実際の作業速度に近づけていく
const PAINT_GUIDE_TAP_SECONDS = 1.4; // マスを探して正確にタップするまでの目安秒数
const PAINT_GUIDE_BUCKET_SECONDS = 2.2; // バケツで塗る範囲を確認して1回タップするまでの目安秒数

function stepActionCount(step){
  return step.borderCells.length + step.interiorClusters.length;
}

function estimateSecondsForStep(step){
  return step.borderCells.length * PAINT_GUIDE_TAP_SECONDS + step.interiorClusters.length * PAINT_GUIDE_BUCKET_SECONDS;
}

function completedPaintGuideActionCount(){
  let n = 0;
  for(let i = 0; i < paintGuideStepIndex; i++) n += stepActionCount(paintGuideOrder[i]);
  return n;
}

function estimateRemainingSeconds(){
  const done = completedPaintGuideActionCount();
  if(paintGuideStartedAt && done > 0){
    const elapsedSec = (Date.now() - paintGuideStartedAt) / 1000;
    const paceSecPerAction = elapsedSec / done;
    let remainingActions = 0;
    for(let i = paintGuideStepIndex; i < paintGuideOrder.length; i++) remainingActions += stepActionCount(paintGuideOrder[i]);
    return Math.max(0, Math.round(paceSecPerAction * remainingActions));
  }
  let sec = 0;
  for(let i = paintGuideStepIndex; i < paintGuideOrder.length; i++) sec += estimateSecondsForStep(paintGuideOrder[i]);
  return Math.round(sec);
}

function formatEstimateSeconds(sec){
  if(sec < 60) return T("art_paint_guide_estimate_lt1min", "1分未満");
  const min = Math.max(1, Math.round(sec / 60));
  return T("art_paint_guide_estimate_min", `約${min}分`, { min });
}

function formatElapsedSeconds(sec){
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if(m === 0) return T("art_guide_complete_time_sec", `${s}秒`, { sec });
  return T("art_guide_complete_time_min_sec", `${m}分${s}秒`, { min: m, sec });
}

// ── マスの分類 ──
// 完成図の各マスについて、周囲8マス（斜め含む）のいずれかが違う色・未着色・
// キャンバスの外であれば「境目マス」、周囲8マス全てが同じ色で実際に埋まっていれば
// 「内側マス」とし、色ごとに集計する。斜めだけの隙間や、キャンバスの一番外側から
// 漏れる可能性を防ぐため、上下左右の4方向だけでなく斜め4方向も必ずチェックし、
// キャンバスの外も「壁」とは見なさない
function classifyPaintCells(){
  const colorMap = new Map(); // color -> { borderCells:[[x,y]], interiorCandidates:[[x,y]] }
  for(let y = 0; y < gridHeight; y++){
    for(let x = 0; x < gridWidth; x++){
      const color = pixels[y * gridWidth + x];
      if(!color) continue; // 未着色マスはガイドの対象外

      const neighbors = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],
        [x + 1, y + 1], [x + 1, y - 1], [x - 1, y + 1], [x - 1, y - 1],
      ];
      let isBorder = false;
      for(const [nx, ny] of neighbors){
        if(nx < 0 || ny < 0 || nx >= gridWidth || ny >= gridHeight){ isBorder = true; break; } // キャンバスの外周も境目として扱う
        if(pixels[ny * gridWidth + nx] !== color){ isBorder = true; break; }
      }

      if(!colorMap.has(color)) colorMap.set(color, { borderCells: [], interiorCandidates: [] });
      const entry = colorMap.get(color);
      (isBorder ? entry.borderCells : entry.interiorCandidates).push([x, y]);
    }
  }
  return colorMap;
}

// 「内側マス」だけを対象に4方向の連結成分を作る（境目マスをまたいでは繋がない）。
// 境目マスが塗られたあとにバケツを1回押すと、ちょうどこの1かたまり分だけが塗られる
function clusterInteriorCells(cells){
  const set = new Set(cells.map(([x, y]) => y * gridWidth + x));
  const visited = new Set();
  const clusters = [];
  cells.forEach(([x, y]) => {
    const startIdx = y * gridWidth + x;
    if(visited.has(startIdx)) return;
    visited.add(startIdx);
    const clusterCells = [[x, y]];
    const stack = [[x, y]];
    while(stack.length){
      const [cx, cy] = stack.pop();
      const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
      for(const [nx, ny] of neighbors){
        if(nx < 0 || ny < 0 || nx >= gridWidth || ny >= gridHeight) continue;
        const ni = ny * gridWidth + nx;
        if(visited.has(ni) || !set.has(ni)) continue;
        visited.add(ni);
        clusterCells.push([nx, ny]);
        stack.push([nx, ny]);
      }
    }
    clusters.push(clusterCells);
  });
  return clusters;
}

// ── ブロック×色ごとの手順データを組み立てる ──
// 境目マスも内側マスも、まずそのマス自身が属するブロックに振り分けてから、
// 内側マスのかたまり（バケツひと押し分）はブロックの中だけで連結成分を作る。
// こうすることで、1回のバケツ操作が今表示しているブロックの外まで広がることはなく、
// 常に「今見えている範囲の中だけ」で完結する
function computePaintSteps(){
  const colorMap = classifyPaintCells();
  const blocksX = Math.ceil(gridWidth / BLOCK_SIZE);
  const blocksY = Math.ceil(gridHeight / BLOCK_SIZE);
  const blockMap = new Map(); // "bx_by" -> { bx, by, colors: Map(color -> {borderCells, interiorCandidates}) }

  function colorEntryFor(bx, by, color){
    const bk = `${bx}_${by}`;
    if(!blockMap.has(bk)) blockMap.set(bk, { bx, by, colors: new Map() });
    const block = blockMap.get(bk);
    if(!block.colors.has(color)) block.colors.set(color, { borderCells: [], interiorCandidates: [] });
    return block.colors.get(color);
  }

  colorMap.forEach((entry, color) => {
    entry.borderCells.forEach(([x, y]) => {
      const bx = Math.floor(x / BLOCK_SIZE), by = Math.floor(y / BLOCK_SIZE);
      colorEntryFor(bx, by, color).borderCells.push([x, y]);
    });
    entry.interiorCandidates.forEach(([x, y]) => {
      const bx = Math.floor(x / BLOCK_SIZE), by = Math.floor(y / BLOCK_SIZE);
      colorEntryFor(bx, by, color).interiorCandidates.push([x, y]);
    });
  });

  // ブロック番号順（既存の10×10ブロック表示・ブロック一覧と同じ並び）に、
  // ブロック内はマス数が多い色から手順化する
  const steps = [];
  for(let by = 0; by < blocksY; by++){
    for(let bx = 0; bx < blocksX; bx++){
      const block = blockMap.get(`${bx}_${by}`);
      if(!block) continue;
      const blockNum = by * blocksX + bx + 1;
      const bw = Math.min(BLOCK_SIZE, gridWidth - bx * BLOCK_SIZE);
      const bh = Math.min(BLOCK_SIZE, gridHeight - by * BLOCK_SIZE);
      const colorEntries = Array.from(block.colors.entries()).map(([color, data]) => {
        // 連結成分はこのブロックの候補マスだけを対象にするため、自然とブロックの外へは広がらない
        const interiorClusters = clusterInteriorCells(data.interiorCandidates).map(cells => ({ cells }));
        return {
          color,
          borderCells: data.borderCells,
          interiorClusters,
          cellCount: data.borderCells.length + data.interiorCandidates.length,
        };
      });
      colorEntries.sort((a, b) => b.cellCount - a.cellCount);
      colorEntries.forEach(entry => {
        steps.push({
          blockNum, bx, by, bw, bh,
          color: entry.color,
          borderCells: entry.borderCells,
          interiorClusters: entry.interiorClusters,
        });
      });
    }
  }
  return steps;
}

// ── ガイド画面の開閉 ──
function openPaintGuide(){
  const steps = computePaintSteps();
  if(steps.length === 0){
    showToast(T("art_paint_guide_empty", "まだ何も塗られていません"));
    return;
  }
  paintGuideOrder = steps;
  paintGuideStepIndex = 0;
  paintGuideForceView = null;
  paintGuideStartedAt = Date.now();
  document.getElementById("artGuideOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";
  renderPaintGuideStep();
}

function closePaintGuide(){
  document.getElementById("artGuideOverlay").style.display = "none";
  document.body.style.overflow = "";
}

function paintGuideNext(){
  if(paintGuideStepIndex >= paintGuideOrder.length - 1){
    finishPaintGuide();
    return;
  }
  const prevBlockNum = paintGuideOrder[paintGuideStepIndex].blockNum;
  paintGuideStepIndex++;
  paintGuideForceView = null;
  renderPaintGuideStep();
  const newBlockNum = paintGuideOrder[paintGuideStepIndex].blockNum;
  if(newBlockNum !== prevBlockNum) showBlockCompleteFlash(prevBlockNum);
}

// ── ブロック完了の軽い通知（振動含む） ──
function showBlockCompleteFlash(blockNum){
  const el = document.getElementById("artGuideBlockFlash");
  const textEl = document.getElementById("artGuideBlockFlashText");
  textEl.textContent = T("art_guide_block_complete", `ブロック${blockNum} 完了！`, { block: blockNum });
  el.classList.add("is-visible");
  if(navigator.vibrate) navigator.vibrate(120);
  clearTimeout(showBlockCompleteFlash._timer);
  showBlockCompleteFlash._timer = setTimeout(() => el.classList.remove("is-visible"), 1100);
}

// ── 完了（全ブロック完走）：まとめ画面を表示する ──
function finishPaintGuide(){
  const elapsedSec = paintGuideStartedAt ? Math.max(0, Math.round((Date.now() - paintGuideStartedAt) / 1000)) : 0;
  const totalCells = pixels.filter(c => c).length;
  markAllBlocksCompleteForGuide();
  closePaintGuide();
  showPaintGuideCompleteScreen(elapsedSec, totalCells);
}

// ぬり方ガイドを最後まで進めたら、既存の10×10ブロック進捗（未着手/作業中/完了）も
// 完了扱いにする。マイデザイン一覧の進捗％・絞り込みと連動させるため
function markAllBlocksCompleteForGuide(){
  const blocksX = Math.ceil(gridWidth / BLOCK_SIZE);
  const blocksY = Math.ceil(gridHeight / BLOCK_SIZE);
  for(let by = 0; by < blocksY; by++){
    for(let bx = 0; bx < blocksX; bx++){
      blockStatus[blockKey(bx, by)] = 2;
    }
  }
  renderCanvas();
  renderBlockList();
  saveDraft();
}

function showPaintGuideCompleteScreen(elapsedSec, totalCells){
  document.getElementById("artGuideCompleteTime").textContent = formatElapsedSeconds(elapsedSec);
  document.getElementById("artGuideCompleteCells").textContent = T("art_guide_complete_cells_value", `${totalCells}マス`, { count: totalCells });
  document.getElementById("artGuideCompleteOverlay").style.display = "flex";
}

function closePaintGuideCompleteScreen(){
  document.getElementById("artGuideCompleteOverlay").style.display = "none";
}

function paintGuidePrev(){
  if(paintGuideStepIndex <= 0) return;
  paintGuideStepIndex--;
  paintGuideForceView = null;
  renderPaintGuideStep();
}

function paintGuideToggleZoom(){
  paintGuideForceView = shouldZoomForStep() ? "full" : null;
  renderPaintGuideCanvas();
  updateZoomBtnLabel();
}

// デフォルトは常に「今のブロック」へズームする（全体図だけではどこを塗ればいいか
// 分からない、という声を受けて、場所を毎回はっきり示すようにした）。
// 手動で切り替えたときだけ全体表示にする
function shouldZoomForStep(){
  return paintGuideForceView !== "full";
}

function updateZoomBtnLabel(){
  document.getElementById("artGuideZoomBtn").textContent =
    shouldZoomForStep() ? T("art_paint_guide_zoom_full", "全体を表示") : T("art_paint_guide_zoom_fit", "このブロックへ戻る");
}

function renderPaintGuideStep(){
  const total = paintGuideOrder.length;
  const step = paintGuideOrder[paintGuideStepIndex];
  const stepNum = paintGuideStepIndex + 1;

  document.getElementById("artGuideProgressLabel").textContent =
    T("art_paint_guide_step_of", `${stepNum} / ${total}（ブロック${step.blockNum}）`, { current: stepNum, total, block: step.blockNum });
  document.getElementById("artGuideProgressFill").style.width = `${(stepNum / total) * 100}%`;

  const estText = formatEstimateSeconds(estimateRemainingSeconds());
  document.getElementById("artGuideEstimate").textContent =
    T("art_guide_estimate_remaining", `残り目安 ${estText}`, { time: estText });

  document.getElementById("artGuideColorChip").style.background = step.color;

  const code = typeof gamePaletteCode === "function" ? gamePaletteCode(step.color) : "";
  document.getElementById("artGuideDetail").textContent = code;

  const badges = document.getElementById("artGuideMethodBadges");
  badges.innerHTML = "";
  if(step.interiorClusters.length > 0){
    const b = document.createElement("span");
    b.className = "art-guide-method-badge is-bucket";
    b.textContent = T("art_paint_guide_method_bucket", `バケツで${step.interiorClusters.length}箇所を塗る`, { count: step.interiorClusters.length });
    badges.appendChild(b);
  }
  if(step.borderCells.length > 0){
    const b = document.createElement("span");
    b.className = "art-guide-method-badge is-tap";
    b.textContent = T("art_paint_guide_method_tap", `${step.borderCells.length}マスを個別にタップ`, { count: step.borderCells.length });
    badges.appendChild(b);
  }
  document.getElementById("artGuidePrevBtn").disabled = paintGuideStepIndex === 0;
  document.getElementById("artGuideNextBtn").textContent =
    stepNum === total ? T("art_paint_guide_finish", "完了") : T("art_paint_guide_next", "次へ");

  updateZoomBtnLabel();
  renderPaintGuideCanvas();
}

function renderPaintGuideCanvas(){
  const overlay = document.getElementById("artGuideOverlay");
  const cvs = document.getElementById("artGuideCanvas");
  if(!cvs || overlay.style.display === "none" || !paintGuideOrder.length) return;

  const step = paintGuideOrder[paintGuideStepIndex];
  const zoomed = shouldZoomForStep();
  const viewport = zoomed ? computeBlockViewport(step) : { ox: 0, oy: 0, w: gridWidth, h: gridHeight };

  const gctx = cvs.getContext("2d");
  const wrap = cvs.parentElement;
  const maxW = Math.max(40, wrap.clientWidth - 16);
  const maxH = Math.max(40, wrap.clientHeight - 16);
  const cell = Math.max(1, Math.floor(Math.min(maxW / viewport.w, maxH / viewport.h)));
  cvs.width = cell * viewport.w;
  cvs.height = cell * viewport.h;

  const dark = document.body.classList.contains("dark");
  gctx.clearRect(0, 0, cvs.width, cvs.height);
  gctx.fillStyle = dark ? "#1c1a17" : "#efe8d8";
  gctx.fillRect(0, 0, cvs.width, cvs.height);

  const currentColor = step.color;
  const doneColors = new Set();
  for(let i = 0; i < paintGuideStepIndex; i++) doneColors.add(paintGuideOrder[i].color);

  // 完了済みの色・現在の色はそのまま、まだのマスは薄く表示（参考図＋進捗）
  for(let vy = 0; vy < viewport.h; vy++){
    for(let vx = 0; vx < viewport.w; vx++){
      const x = viewport.ox + vx, y = viewport.oy + vy;
      const color = pixels[y * gridWidth + x];
      if(!color) continue;
      const isCurrent = color === currentColor;
      const isDone = doneColors.has(color);
      gctx.globalAlpha = isCurrent || isDone ? 1 : 0.25;
      gctx.fillStyle = color;
      gctx.fillRect(vx * cell, vy * cell, cell, cell);
    }
  }
  gctx.globalAlpha = 1;

  // マス目の境界線（1マスずつはっきり分かるように、セルがある程度の大きさの時だけ表示）。
  // 単色の半透明線だと、マスの色と同系統の色（暗い線が黒系のマス、明るい線が
  // 白系のマスなど）に重なったときに見えなくなるため、明るい縁取り＋暗い本線を
  // 重ねて描く「縁取り線」にし、周りの色に関係なく常にはっきり見えるようにする
  if(cell >= 6){
    const gridPath = new Path2D();
    for(let vx = 0; vx <= viewport.w; vx++){
      gridPath.moveTo(vx * cell, 0);
      gridPath.lineTo(vx * cell, cvs.height);
    }
    for(let vy = 0; vy <= viewport.h; vy++){
      gridPath.moveTo(0, vy * cell);
      gridPath.lineTo(cvs.width, vy * cell);
    }
    gctx.strokeStyle = "rgba(255,255,255,0.9)";
    gctx.lineWidth = 2.4;
    gctx.stroke(gridPath);
    gctx.strokeStyle = "rgba(0,0,0,0.55)";
    gctx.lineWidth = 1;
    gctx.stroke(gridPath);
  }

  // 今のブロック（10×10）の一番外側の枠だけ太く表示する（ズーム時はブロックの
  // 実際の境目を、全体表示のときは今どこを見ているかを分かりやすくする）。
  // こちらも縁取り線にして、周りのマスの色に関係なく見えるようにする
  {
    const bx0 = step.bx * BLOCK_SIZE - viewport.ox, by0 = step.by * BLOCK_SIZE - viewport.oy;
    const frameWidth = Math.max(3, cell * 0.12);
    gctx.strokeStyle = "rgba(255,255,255,0.95)";
    gctx.lineWidth = frameWidth + 2.5;
    gctx.strokeRect(bx0 * cell, by0 * cell, step.bw * cell, step.bh * cell);
    gctx.strokeStyle = "rgba(0,0,0,0.85)";
    gctx.lineWidth = frameWidth;
    gctx.strokeRect(bx0 * cell, by0 * cell, step.bw * cell, step.bh * cell);
  }

  // 内側マス（バケツ範囲）のかたまりごとに外周を強調表示
  gctx.strokeStyle = dark ? "#ffe680" : "#ff7a1a";
  gctx.lineWidth = Math.max(2, cell * 0.22);
  gctx.lineJoin = "round";
  gctx.beginPath();
  step.interiorClusters.forEach(cluster => {
    const set = new Set(cluster.cells.map(([x, y]) => y * gridWidth + x));
    const has = (x, y) => set.has(y * gridWidth + x);
    cluster.cells.forEach(([x, y]) => {
      if(x < viewport.ox || y < viewport.oy || x >= viewport.ox + viewport.w || y >= viewport.oy + viewport.h) return;
      const vx = (x - viewport.ox) * cell, vy = (y - viewport.oy) * cell;
      if(!has(x - 1, y)){ gctx.moveTo(vx, vy); gctx.lineTo(vx, vy + cell); }
      if(!has(x + 1, y)){ gctx.moveTo(vx + cell, vy); gctx.lineTo(vx + cell, vy + cell); }
      if(!has(x, y - 1)){ gctx.moveTo(vx, vy); gctx.lineTo(vx + cell, vy); }
      if(!has(x, y + 1)){ gctx.moveTo(vx, vy + cell); gctx.lineTo(vx + cell, vy + cell); }
    });
  });
  gctx.stroke();

  // 境目マス（個別タップ）は中央に丸印で表示
  const dotColor = dark ? "#9ad0f0" : "#2373a8";
  step.borderCells.forEach(([x, y]) => {
    if(x < viewport.ox || y < viewport.oy || x >= viewport.ox + viewport.w || y >= viewport.oy + viewport.h) return;
    const vx = (x - viewport.ox) * cell, vy = (y - viewport.oy) * cell;
    gctx.beginPath();
    gctx.fillStyle = dotColor;
    gctx.arc(vx + cell / 2, vy + cell / 2, Math.max(1.2, cell * 0.24), 0, Math.PI * 2);
    gctx.fill();
  });
}

// 表示範囲を「今のブロック」の実マス範囲＋少し余白に固定する
// （既存の10×10ブロック表示と同じ区切りなので、実機の画面でも同じ単位で作業しやすい）
function computeBlockViewport(step){
  const pad = 1;
  const minX = Math.max(0, step.bx * BLOCK_SIZE - pad);
  const minY = Math.max(0, step.by * BLOCK_SIZE - pad);
  const maxX = Math.min(gridWidth - 1, step.bx * BLOCK_SIZE + step.bw - 1 + pad);
  const maxY = Math.min(gridHeight - 1, step.by * BLOCK_SIZE + step.bh - 1 + pad);
  return { ox: minX, oy: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function bindPaintGuideControls(){
  document.getElementById("artPaintGuideBtn").addEventListener("click", openPaintGuide);
  document.getElementById("artGuideCloseBtn").addEventListener("click", closePaintGuide);
  document.getElementById("artGuideCloseBtn").innerHTML = icon("close");
  document.getElementById("artGuideNextBtn").addEventListener("click", paintGuideNext);
  document.getElementById("artGuidePrevBtn").addEventListener("click", paintGuidePrev);
  document.getElementById("artGuideZoomBtn").addEventListener("click", paintGuideToggleZoom);
  window.addEventListener("resize", renderPaintGuideCanvas);

  document.getElementById("artGuideCompleteExportBtn").addEventListener("click", exportPNG);
  document.getElementById("artGuideCompleteShareBtn").addEventListener("click", () => {
    closePaintGuideCompleteScreen();
    openShareCodeModal();
  });
  document.getElementById("artGuideCompleteCloseBtn").addEventListener("click", closePaintGuideCompleteScreen);
}

bindPaintGuideControls();
