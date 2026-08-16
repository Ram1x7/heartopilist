// js/art-paint-guide.js
// 「アート」エディターの塗り方ガイド機能
//
// ゲーム内のバケツ（塗りつぶし）ツールは、キャンバスの「今表示されている色」を
// 基準に流れ込む（何もしていない状態は全部同じ「未着色」という1色として繋がっている）。
// そのため、隣同士で違う色になる境目のマスを先に1マスずつ塗って壁を作っておかないと、
// バケツは意図した範囲を越えて隣の未着色マスにまで塗り広がってしまう。
// 逆に、周りをすべて同じ色のマスだけで囲まれている内側のマスは、境目さえ塗ってあれば
// バケツでまとめて塗っても安全に収まる。
//
// これを踏まえて、
//   ・完成図で隣に違う色（または未着色）のマスがある＝「境目マス」→ 1マスずつタップ
//   ・周りが全部同じ色＝「内側マス」→ 境目を塗った後ならバケツでまとめて塗れる
// に分類し、さらに手順は「色ごと」にまとめる（同じ色のマスが盤面のあちこちに
// 散らばっていても、1色選んだらまとめて片付けられるようにし、手順数を色の種類数まで
// 抑える）。色ごとの手順は、現在地から近い色を優先する貪欲法で並べる。

let paintGuideOrder = [];
let paintGuideStepIndex = 0;
let paintGuideForceView = null; // null=自動判定 / "zoom"=拡大 / "full"=全体表示（ステップが変わるたびリセット）

// ── マスの分類 ──
// 完成図の各マスについて、上下左右のいずれかが違う色（または未着色）なら「境目マス」、
// 全て同じ色なら「内側マス」とし、色ごとに集計する
function classifyPaintCells(){
  const colorMap = new Map(); // color -> { borderCells:[[x,y]], interiorCandidates:[[x,y]] }
  for(let y = 0; y < gridHeight; y++){
    for(let x = 0; x < gridWidth; x++){
      const color = pixels[y * gridWidth + x];
      if(!color) continue; // 未着色マスはガイドの対象外

      const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      let isBorder = false;
      for(const [nx, ny] of neighbors){
        if(nx < 0 || ny < 0 || nx >= gridWidth || ny >= gridHeight) continue; // キャンバスの外周は壁として扱う（塗る必要なし）
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

// ── 色ごとの手順データを組み立てる ──
function computePaintColorSteps(){
  const colorMap = classifyPaintCells();
  const steps = [];
  colorMap.forEach((entry, color) => {
    const allCells = entry.borderCells.concat(entry.interiorCandidates);
    if(allCells.length === 0) return;
    const interiorClusters = clusterInteriorCells(entry.interiorCandidates).map(cells => ({ cells }));
    const xs = allCells.map(c => c[0]);
    const ys = allCells.map(c => c[1]);
    const sumX = xs.reduce((s, v) => s + v, 0);
    const sumY = ys.reduce((s, v) => s + v, 0);
    steps.push({
      color,
      borderCells: entry.borderCells,
      interiorClusters,
      totalCells: allCells.length,
      centerX: sumX / allCells.length,
      centerY: sumY / allCells.length,
      bbox: {
        minX: Math.min(...xs), maxX: Math.max(...xs),
        minY: Math.min(...ys), maxY: Math.max(...ys),
      },
    });
  });
  return steps;
}

// ── 色の並び順の最適化 ──
// 貪欲法：現在地（直前の色の重心）から近い色を優先することで、移動距離を抑える
function orderColorSteps(steps){
  const remaining = steps.slice();
  const ordered = [];
  let current = { centerX: 0, centerY: 0 };
  while(remaining.length){
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((s, idx) => {
      const dist = Math.hypot(s.centerX - current.centerX, s.centerY - current.centerY);
      if(dist < bestDist){
        bestDist = dist;
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
  const steps = computePaintColorSteps();
  if(steps.length === 0){
    showToast(T("art_paint_guide_empty", "まだ何も塗られていません"));
    return;
  }
  paintGuideOrder = orderColorSteps(steps);
  paintGuideStepIndex = 0;
  paintGuideForceView = null;
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
  paintGuideForceView = null;
  renderPaintGuideStep();
}

function paintGuidePrev(){
  if(paintGuideStepIndex <= 0) return;
  paintGuideStepIndex--;
  paintGuideForceView = null;
  renderPaintGuideStep();
}

function paintGuideToggleZoom(){
  const step = paintGuideOrder[paintGuideStepIndex];
  const zoomedNow = shouldZoomForStep(step);
  paintGuideForceView = zoomedNow ? "full" : "zoom";
  renderPaintGuideCanvas();
  updateZoomBtnLabel();
}

// バウンディングボックスがキャンバス全体よりだいぶ小さければ、自動でそこへ寄せて表示する
function shouldZoomForStep(step){
  if(paintGuideForceView === "zoom") return true;
  if(paintGuideForceView === "full") return false;
  const bboxW = step.bbox.maxX - step.bbox.minX + 1;
  const bboxH = step.bbox.maxY - step.bbox.minY + 1;
  const bboxArea = bboxW * bboxH;
  const canvasArea = gridWidth * gridHeight;
  return bboxArea <= canvasArea * 0.55;
}

function updateZoomBtnLabel(){
  const step = paintGuideOrder[paintGuideStepIndex];
  const zoomed = shouldZoomForStep(step);
  document.getElementById("artGuideZoomBtn").textContent =
    zoomed ? T("art_paint_guide_zoom_full", "全体を表示") : T("art_paint_guide_zoom_fit", "拡大表示");
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
  const zoomed = shouldZoomForStep(step);
  const viewport = zoomed ? computeStepViewport(step) : { ox: 0, oy: 0, w: gridWidth, h: gridHeight };

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

// 表示範囲を、現在の色のマス全体のバウンディングボックス＋余白に絞り込む
function computeStepViewport(step){
  const pad = 2;
  const minX = Math.max(0, step.bbox.minX - pad);
  const minY = Math.max(0, step.bbox.minY - pad);
  const maxX = Math.min(gridWidth - 1, step.bbox.maxX + pad);
  const maxY = Math.min(gridHeight - 1, step.bbox.maxY + pad);
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
}

bindPaintGuideControls();
