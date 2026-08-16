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
//   ・完成図で隣に違う色（または未着色）のマスがある＝「境目マス」→ 1マスずつタップ
//   ・周りが全部同じ色＝「内側マス」→ 境目を塗った後ならバケツでまとめて塗れる
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

// ── ブロック×色ごとの手順データを組み立てる ──
// 境目マスはそのマス自身が属するブロックに、内側マスのかたまり（バケツひと押し分）は
// その左上のマスが属するブロックに割り当てる（かたまりがブロックをまたぐこともある。
// その場合はバケツ操作1回で表示範囲の外まで一気に塗られる旨を案内に添える）
function computePaintSteps(){
  const colorMap = classifyPaintCells();
  const blocksX = Math.ceil(gridWidth / BLOCK_SIZE);
  const blocksY = Math.ceil(gridHeight / BLOCK_SIZE);
  const blockMap = new Map(); // "bx_by" -> { bx, by, colors: Map(color -> {borderCells, interiorClusters}) }

  function colorEntryFor(bx, by, color){
    const bk = `${bx}_${by}`;
    if(!blockMap.has(bk)) blockMap.set(bk, { bx, by, colors: new Map() });
    const block = blockMap.get(bk);
    if(!block.colors.has(color)) block.colors.set(color, { borderCells: [], interiorClusters: [] });
    return block.colors.get(color);
  }

  colorMap.forEach((entry, color) => {
    entry.borderCells.forEach(([x, y]) => {
      const bx = Math.floor(x / BLOCK_SIZE), by = Math.floor(y / BLOCK_SIZE);
      colorEntryFor(bx, by, color).borderCells.push([x, y]);
    });

    clusterInteriorCells(entry.interiorCandidates).forEach(cells => {
      // 連結成分の中で一番上・その中で一番左のマスを代表点とし、そのマスが属する
      // ブロックへこのかたまりをまとめて割り当てる
      let anchor = cells[0];
      cells.forEach(c => {
        if(c[1] < anchor[1] || (c[1] === anchor[1] && c[0] < anchor[0])) anchor = c;
      });
      const bx = Math.floor(anchor[0] / BLOCK_SIZE), by = Math.floor(anchor[1] / BLOCK_SIZE);
      const bw = Math.min(BLOCK_SIZE, gridWidth - bx * BLOCK_SIZE);
      const bh = Math.min(BLOCK_SIZE, gridHeight - by * BLOCK_SIZE);
      const spansBeyondBlock = cells.some(([x, y]) =>
        x < bx * BLOCK_SIZE || x >= bx * BLOCK_SIZE + bw || y < by * BLOCK_SIZE || y >= by * BLOCK_SIZE + bh);
      colorEntryFor(bx, by, color).interiorClusters.push({ cells, spansBeyondBlock });
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
      const colorEntries = Array.from(block.colors.entries()).map(([color, data]) => ({
        color,
        borderCells: data.borderCells,
        interiorClusters: data.interiorClusters,
        cellCount: data.borderCells.length + data.interiorClusters.reduce((s, c) => s + c.cells.length, 0),
      }));
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
  if(step.interiorClusters.some(c => c.spansBeyondBlock)){
    const b = document.createElement("span");
    b.className = "art-guide-method-badge is-note";
    b.textContent = T("art_paint_guide_spans_note", "この範囲は表示エリアの外まで広がっています");
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

  // マス目の境界線（1マスずつはっきり分かるように、セルがある程度の大きさの時だけ表示）
  if(cell >= 6){
    gctx.strokeStyle = dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
    gctx.lineWidth = 1;
    gctx.beginPath();
    for(let vx = 0; vx <= viewport.w; vx++){
      gctx.moveTo(vx * cell, 0);
      gctx.lineTo(vx * cell, cvs.height);
    }
    for(let vy = 0; vy <= viewport.h; vy++){
      gctx.moveTo(0, vy * cell);
      gctx.lineTo(cvs.width, vy * cell);
    }
    gctx.stroke();
  }

  // 今のブロックの範囲を枠で示す（全体表示に切り替えたときに特に役立つ）
  if(!zoomed){
    const bx0 = step.bx * BLOCK_SIZE, by0 = step.by * BLOCK_SIZE;
    gctx.strokeStyle = dark ? "#ffe680" : "#ff7a1a";
    gctx.lineWidth = Math.max(2, cell * 0.15);
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
}

bindPaintGuideControls();
