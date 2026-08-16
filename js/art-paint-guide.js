// js/art-paint-guide.js
// 「アート」エディターの塗り方ガイド機能
// 完成したキャンバスを、ゲーム内のバケツ（塗りつぶし）ツールを使う前提で
// 移動距離と色の切り替え回数が少なくなるように塗る順番を算出し、
// 音楽ページの練習モードのような対話的なステップガイドで案内する

const PAINT_GUIDE_COLOR_SWITCH_PENALTY = 6; // 色を切り替えるコストを、マス換算の距離に見積もる重み

let paintGuideOrder = [];
let paintGuideStepIndex = 0;

// ── 領域検出 ──
// 4方向で同色に連結したマスをひとまとめにする。これはゲーム内のバケツツールが
// 一度のタップで塗る範囲（floodFill()と同じ判定基準）と一致させてある
function computePaintRegions(){
  const visited = new Array(gridWidth * gridHeight).fill(false);
  const regions = [];
  for(let y = 0; y < gridHeight; y++){
    for(let x = 0; x < gridWidth; x++){
      const startIdx = y * gridWidth + x;
      if(visited[startIdx]) continue;
      visited[startIdx] = true;
      const color = pixels[startIdx];
      if(!color) continue; // 未着色マスはガイドの対象外

      const cells = [[x, y]];
      const stack = [[x, y]];
      while(stack.length){
        const [cx, cy] = stack.pop();
        const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
        for(const [nx, ny] of neighbors){
          if(nx < 0 || ny < 0 || nx >= gridWidth || ny >= gridHeight) continue;
          const ni = ny * gridWidth + nx;
          if(visited[ni]) continue;
          if(pixels[ni] !== color) continue;
          visited[ni] = true;
          cells.push([nx, ny]);
          stack.push([nx, ny]);
        }
      }

      const sumX = cells.reduce((s, c) => s + c[0], 0);
      const sumY = cells.reduce((s, c) => s + c[1], 0);
      regions.push({
        color,
        cells,
        size: cells.length,
        method: cells.length > 1 ? "bucket" : "tap",
        centerX: sumX / cells.length,
        centerY: sumY / cells.length,
      });
    }
  }
  return regions;
}

// ── 塗る順番の最適化 ──
// 貪欲法：現在地からの距離が近い領域を優先しつつ、色を切り替えると
// ペナルティを加算することで、同じ色をまとめて塗る流れになりやすくする
// （ゲーム内でパレットから色を選び直す回数を減らす狙い）
function orderPaintRegions(regions){
  const remaining = regions.slice();
  const ordered = [];
  let current = { centerX: 0, centerY: 0, color: null };
  while(remaining.length){
    let bestIdx = 0;
    let bestScore = Infinity;
    remaining.forEach((r, idx) => {
      const dist = Math.hypot(r.centerX - current.centerX, r.centerY - current.centerY);
      const penalty = current.color !== null && r.color !== current.color ? PAINT_GUIDE_COLOR_SWITCH_PENALTY : 0;
      const score = dist + penalty;
      if(score < bestScore){
        bestScore = score;
        bestIdx = idx;
      }
    });
    const [chosen] = remaining.splice(bestIdx, 1);
    ordered.push(chosen);
    current = chosen;
  }
  return ordered;
}

// ── ガイド画面の開閉 ──
function openPaintGuide(){
  const regions = computePaintRegions();
  if(regions.length === 0){
    showToast(T("art_paint_guide_empty", "まだ何も塗られていません"));
    return;
  }
  paintGuideOrder = orderPaintRegions(regions);
  paintGuideStepIndex = 0;
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
    closePaintGuide();
    return;
  }
  paintGuideStepIndex++;
  renderPaintGuideStep();
}

function paintGuidePrev(){
  if(paintGuideStepIndex <= 0) return;
  paintGuideStepIndex--;
  renderPaintGuideStep();
}

function renderPaintGuideStep(){
  const total = paintGuideOrder.length;
  const step = paintGuideOrder[paintGuideStepIndex];
  const stepNum = paintGuideStepIndex + 1;

  document.getElementById("artGuideProgressLabel").textContent =
    T("art_paint_guide_step_of", `${stepNum} / ${total}`, { current: stepNum, total });
  document.getElementById("artGuideProgressFill").style.width = `${(stepNum / total) * 100}%`;

  document.getElementById("artGuideColorChip").style.background = step.color;

  const code = typeof gamePaletteCode === "function" ? gamePaletteCode(step.color) : "";
  document.getElementById("artGuideDetail").textContent = code;

  const methodBadge = document.getElementById("artGuideMethodBadge");
  if(step.method === "bucket"){
    methodBadge.textContent = T("art_paint_guide_method_bucket", `バケツでまとめて塗る（${step.size}マス）`, { count: step.size });
    methodBadge.className = "art-guide-method-badge is-bucket";
  }else{
    methodBadge.textContent = T("art_paint_guide_method_tap", "1マスだけ塗る");
    methodBadge.className = "art-guide-method-badge is-tap";
  }

  document.getElementById("artGuidePrevBtn").disabled = paintGuideStepIndex === 0;
  document.getElementById("artGuideNextBtn").textContent =
    stepNum === total ? T("art_paint_guide_finish", "完了") : T("art_paint_guide_next", "次へ");

  renderPaintGuideCanvas();
}

function renderPaintGuideCanvas(){
  const overlay = document.getElementById("artGuideOverlay");
  const cvs = document.getElementById("artGuideCanvas");
  if(!cvs || overlay.style.display === "none" || !paintGuideOrder.length) return;

  const gctx = cvs.getContext("2d");
  const wrap = cvs.parentElement;
  const maxW = Math.max(40, wrap.clientWidth - 16);
  const maxH = Math.max(40, wrap.clientHeight - 16);
  const cell = Math.max(1, Math.floor(Math.min(maxW / gridWidth, maxH / gridHeight)));
  cvs.width = cell * gridWidth;
  cvs.height = cell * gridHeight;

  const dark = document.body.classList.contains("dark");
  gctx.clearRect(0, 0, cvs.width, cvs.height);
  gctx.fillStyle = dark ? "#1c1a17" : "#efe8d8";
  gctx.fillRect(0, 0, cvs.width, cvs.height);

  const current = paintGuideOrder[paintGuideStepIndex];
  const currentSet = new Set(current.cells.map(([x, y]) => y * gridWidth + x));
  const doneSet = new Set();
  for(let i = 0; i < paintGuideStepIndex; i++){
    paintGuideOrder[i].cells.forEach(([x, y]) => doneSet.add(y * gridWidth + x));
  }

  // 完了済み・現在のステップはそのままの色、まだ塗っていない部分は薄く表示して
  // 「これから塗る参考図」と「今やること」が同時にわかるようにする
  for(let y = 0; y < gridHeight; y++){
    for(let x = 0; x < gridWidth; x++){
      const i = y * gridWidth + x;
      const color = pixels[i];
      if(!color) continue;
      const isCurrent = currentSet.has(i);
      const isDone = doneSet.has(i);
      gctx.globalAlpha = isCurrent || isDone ? 1 : 0.25;
      gctx.fillStyle = color;
      gctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  gctx.globalAlpha = 1;

  // 現在の領域だけ、外周に沿って輪郭を強調表示する
  gctx.strokeStyle = dark ? "#ffe680" : "#ff7a1a";
  gctx.lineWidth = Math.max(2, cell * 0.22);
  gctx.lineJoin = "round";
  gctx.beginPath();
  current.cells.forEach(([x, y]) => {
    const has = (nx, ny) => currentSet.has(ny * gridWidth + nx);
    const px = x * cell, py = y * cell;
    if(!has(x - 1, y)){ gctx.moveTo(px, py); gctx.lineTo(px, py + cell); }
    if(!has(x + 1, y)){ gctx.moveTo(px + cell, py); gctx.lineTo(px + cell, py + cell); }
    if(!has(x, y - 1)){ gctx.moveTo(px, py); gctx.lineTo(px + cell, py); }
    if(!has(x, y + 1)){ gctx.moveTo(px, py + cell); gctx.lineTo(px + cell, py + cell); }
  });
  gctx.stroke();
}

function bindPaintGuideControls(){
  document.getElementById("artPaintGuideBtn").addEventListener("click", openPaintGuide);
  document.getElementById("artGuideCloseBtn").addEventListener("click", closePaintGuide);
  document.getElementById("artGuideCloseBtn").innerHTML = icon("close");
  document.getElementById("artGuideNextBtn").addEventListener("click", paintGuideNext);
  document.getElementById("artGuidePrevBtn").addEventListener("click", paintGuidePrev);
  window.addEventListener("resize", renderPaintGuideCanvas);
}

bindPaintGuideControls();
