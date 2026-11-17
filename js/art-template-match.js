// js/art-template-match.js
// スクショに写り込む「補助線」（ゲーム内デザイン枠画面に表示される目安線で、
// はとぴ図鑑のアートページで使っているPRESET_MASKS（js/art-masks.js）の輪郭線と
// 同じ形のもの）を検出し、各テンプレートパーツのmaskLinesと照合することで、
// テンプレート判定と位置合わせ（スケール・オフセット）を同時に行う。
//
// アルゴリズム（外部AI APIには一切依存しない、古典的な画像処理のみ）：
//   1. エッジ検出（Sobelフィルタ）でスクショ内の線・輪郭を検出
//   2. 距離変換（2パス法によるchamfer distance transform）で
//      「各画素から最も近いエッジまでの距離」のマップを作る
//   3. 各テンプレートパーツのmaskLinesを、様々なスケール・位置で仮当てはめし、
//      その点群が距離変換マップ上でどれだけエッジに近いか（＝ズレの小ささ）を評価する
//      （チャンファーマッチング）。粗い探索→局所改善（座標降下法）の2段階で
//      最も当てはまりの良いスケール・位置を探す
//   4. 全テンプレートパーツの中で最も当てはまりが良かったものを候補として提示する
//
// 正直な制約：これは輪郭線ベースの古典的なテンプレートマッチングであり、AIによる
// 画像認識ではない。スクショに実際に補助線がはっきり写っている（背景・キャラクターに
// 隠れていない、極端に暗い/ぼやけていない）ことを前提にした精度になる。

function templateMatchGrayscale(imgData){
  const w = imgData.width, h = imgData.height, d = imgData.data;
  const gray = new Float32Array(w * h);
  for(let i = 0; i < w * h; i++){
    gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  }
  return gray;
}

// Sobelフィルタによるエッジ強度マップ
function computeEdgeMagnitude(imgData){
  const w = imgData.width, h = imgData.height;
  const gray = templateMatchGrayscale(imgData);
  const mag = new Float32Array(w * h);
  for(let y = 1; y < h - 1; y++){
    for(let x = 1; x < w - 1; x++){
      const tl = gray[(y - 1) * w + (x - 1)], tc = gray[(y - 1) * w + x], tr = gray[(y - 1) * w + (x + 1)];
      const ml = gray[y * w + (x - 1)], mr = gray[y * w + (x + 1)];
      const bl = gray[(y + 1) * w + (x - 1)], bc = gray[(y + 1) * w + x], br = gray[(y + 1) * w + (x + 1)];
      const gx = (tr + 2 * mr + br) - (tl + 2 * ml + bl);
      const gy = (bl + 2 * bc + br) - (tl + 2 * tc + tr);
      mag[y * w + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return mag;
}

// エッジ強度マップを二値化する。固定の絶対閾値や「上位◯%」のような決め打ちの割合ではなく、
// 大津の手法（Otsu's method）で「背景（勾配ほぼ0の画素が大多数）」と「エッジ」の
// 2つの集団に自動で分離する閾値を求める。
//
// 上位◯%方式は失敗しやすい：細い線1本の輪郭では、直線区間のほとんどが同程度の
// 勾配強度を持つ一方、頂点（線の合流点）はやや強い勾配になりやすい。「上位8%」のような
// 固定割合だと、直線区間の画素数がその割合を超えてしまい、閾値が頂点付近の強い勾配だけを
// 拾う位置まで押し上げられ、肝心の直線区間がまるごとエッジ扱いされなくなる。
// 大津の手法は「2群に分けたときの群間分散が最大になる閾値」を選ぶため、背景とエッジの
// 画素数比に関わらず、実際に2つの集団が分離できる閾値を安定して見つけられる
function binarizeEdgesOtsu(mag){
  let maxMag = 0;
  for(let i = 0; i < mag.length; i++) if(mag[i] > maxMag) maxMag = mag[i];
  if(maxMag <= 0) return new Uint8Array(mag.length);

  const BINS = 256;
  const hist = new Float64Array(BINS);
  const binScale = (BINS - 1) / maxMag;
  for(let i = 0; i < mag.length; i++){
    hist[Math.round(mag[i] * binScale)]++;
  }

  const total = mag.length;
  let sumAll = 0;
  for(let b = 0; b < BINS; b++) sumAll += b * hist[b];

  let sumB = 0, wB = 0, maxVariance = -1, bestBin = 0;
  for(let b = 0; b < BINS; b++){
    wB += hist[b];
    if(wB === 0) continue;
    const wF = total - wB;
    if(wF === 0) break;
    sumB += b * hist[b];
    const meanB = sumB / wB;
    const meanF = (sumAll - sumB) / wF;
    const variance = wB * wF * (meanB - meanF) * (meanB - meanF);
    if(variance > maxVariance){
      maxVariance = variance;
      bestBin = b;
    }
  }

  const threshold = bestBin / binScale;
  const mask = new Uint8Array(mag.length);
  for(let i = 0; i < mag.length; i++) mask[i] = mag[i] > threshold ? 1 : 0;
  return mask;
}

// 2パス法によるchamfer距離変換（近似ユークリッド距離）。各画素から最も近い
// エッジ画素までの距離を返す
function computeDistanceTransform(edgeMask, w, h){
  const INF = 1e6;
  const dist = new Float32Array(w * h);
  for(let i = 0; i < w * h; i++) dist[i] = edgeMask[i] ? 0 : INF;
  const D1 = 1, D2 = Math.SQRT2;
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const i = y * w + x;
      let d = dist[i];
      if(x > 0) d = Math.min(d, dist[i - 1] + D1);
      if(y > 0) d = Math.min(d, dist[i - w] + D1);
      if(x > 0 && y > 0) d = Math.min(d, dist[i - w - 1] + D2);
      if(x < w - 1 && y > 0) d = Math.min(d, dist[i - w + 1] + D2);
      dist[i] = d;
    }
  }
  for(let y = h - 1; y >= 0; y--){
    for(let x = w - 1; x >= 0; x--){
      const i = y * w + x;
      let d = dist[i];
      if(x < w - 1) d = Math.min(d, dist[i + 1] + D1);
      if(y < h - 1) d = Math.min(d, dist[i + w] + D1);
      if(x < w - 1 && y < h - 1) d = Math.min(d, dist[i + w + 1] + D2);
      if(x > 0 && y < h - 1) d = Math.min(d, dist[i + w - 1] + D2);
      dist[i] = d;
    }
  }
  return dist;
}

// maskLines(折れ線の配列)を、一定間隔でサンプリングした点列に変換する
function sampleMaskLinePoints(maskLines, spacing){
  const points = [];
  const step = spacing || 3;
  maskLines.forEach(path => {
    for(let i = 0; i < path.length - 1; i++){
      const a = path[i], b = path[i + 1];
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, Math.round(segLen / step));
      for(let s = 0; s < steps; s++){
        const t = s / steps;
        points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
  });
  return points;
}

// 画像範囲外に出た点に課す固定ペナルティ（範囲外へ大きくはみ出す当てはめを避けるため）
const TEMPLATE_MATCH_OOB_PENALTY = 40;
// 「テンプレートを検出したエッジ全体に対してどれだけ説明できているか」の不足分に
// 課すペナルティの重み。片方向（テンプレートの各点→最寄りのエッジ）だけで評価すると、
// テンプレートを極端に縮めて実際のエッジ1点だけへ収束させるだけで見かけ上コストが
// 下がってしまう退化解を選んでしまう（形状は何も一致していないのに、テンプレートの
// 全点がたまたま近くの同じエッジ点に張り付くだけで最小コストになるため）。
// これを防ぐため、逆方向（実際に検出されたエッジ全体のうち、テンプレートの外接矩形内に
// 収まっている割合＝カバー率）も評価に加える古典的な双方向チャンファーマッチングにしている
const TEMPLATE_MATCH_COVERAGE_WEIGHT = 12;

// 二値化されたエッジマスクの積分画像（summed-area table）を作る。
// これにより、任意の矩形範囲内のエッジ画素数をO(1)で求められるようになる
function computeIntegralImage(mask, w, h){
  const integral = new Float64Array((w + 1) * (h + 1));
  for(let y = 0; y < h; y++){
    let rowSum = 0;
    for(let x = 0; x < w; x++){
      rowSum += mask[y * w + x];
      integral[(y + 1) * (w + 1) + (x + 1)] = integral[y * (w + 1) + (x + 1)] + rowSum;
    }
  }
  return integral;
}

// 積分画像を使って、矩形[x0,x1)×[y0,y1)（画像範囲でクランプ済み）内のエッジ画素数を求める
function integralBoxSum(integral, w, h, x0, y0, x1, y1){
  const cx0 = Math.max(0, Math.min(w, Math.round(x0)));
  const cy0 = Math.max(0, Math.min(h, Math.round(y0)));
  const cx1 = Math.max(0, Math.min(w, Math.round(x1)));
  const cy1 = Math.max(0, Math.min(h, Math.round(y1)));
  if(cx1 <= cx0 || cy1 <= cy0) return 0;
  const stride = w + 1;
  return integral[cy1 * stride + cx1] - integral[cy0 * stride + cx1] - integral[cy1 * stride + cx0] + integral[cy0 * stride + cx0];
}

// 与えたスケール・オフセットで点群を距離変換マップに当てはめたときの「ズレの大きさ」
// （テンプレートの各点→最寄りのエッジまでの平均距離）に、カバー率不足のペナルティを
// 加えた値を返す（値が小さいほど良い当てはめ）。coverageOptsを渡さない場合は
// 片方向のチャンファー距離のみを返す（テスト等での単純な利用のため）
function chamferCost(points, distField, w, h, scale, offsetX, offsetY, coverageOpts){
  if(!points.length) return Infinity;
  let sum = 0;
  for(let i = 0; i < points.length; i++){
    const sx = points[i].x * scale + offsetX;
    const sy = points[i].y * scale + offsetY;
    if(sx < 0 || sy < 0 || sx >= w || sy >= h){
      sum += TEMPLATE_MATCH_OOB_PENALTY;
      continue;
    }
    const ix = Math.min(w - 1, Math.max(0, Math.round(sx)));
    const iy = Math.min(h - 1, Math.max(0, Math.round(sy)));
    sum += distField[iy * w + ix];
  }
  const forwardCost = sum / points.length;
  if(!coverageOpts || !coverageOpts.integral || !coverageOpts.totalEdgeCount) return forwardCost;

  const { integral, totalEdgeCount, bboxW, bboxH } = coverageOpts;
  const edgeCountInBBox = integralBoxSum(integral, w, h, offsetX, offsetY, offsetX + bboxW, offsetY + bboxH);
  const coverageRatio = Math.min(1, edgeCountInBBox / totalEdgeCount);
  return forwardCost + TEMPLATE_MATCH_COVERAGE_WEIGHT * (1 - coverageRatio);
}

// 指定したパーツ(width, height, maskLines)について、距離変換マップ上で最も当てはまりの
// 良いスケール・位置(オフセット)を「粗探索→局所改善(座標降下法)」の2段階で探す。
// integral/totalEdgeCountを渡すと、片方向のチャンファー距離に加えてカバー率不足の
// ペナルティも評価する（渡さない場合は片方向のみ、テスト等での単純な利用のため）
function matchTemplateToDistanceField(maskLines, partWidth, partHeight, distField, w, h, opts){
  const options = opts || {};
  const points = sampleMaskLinePoints(maskLines, options.spacing || 3);
  if(!points.length) return null;

  const coverageOptsFor = (bboxW, bboxH) => (options.integral && options.totalEdgeCount)
    ? { integral: options.integral, totalEdgeCount: options.totalEdgeCount, bboxW, bboxH }
    : null;

  const partMaxDim = Math.max(partWidth, partHeight);
  const imgMinDim = Math.min(w, h);
  const imgMaxDim = Math.max(w, h);
  const minScale = (imgMinDim * 0.2) / partMaxDim;
  const maxScale = (imgMaxDim * 1.1) / partMaxDim;
  const scaleSteps = options.scaleSteps || 10;
  const posSteps = options.posSteps || 8;

  let best = { scale: minScale, offsetX: 0, offsetY: 0, cost: Infinity };
  for(let si = 0; si < scaleSteps; si++){
    const t = scaleSteps === 1 ? 0 : si / (scaleSteps - 1);
    const scale = minScale * Math.pow(maxScale / Math.max(minScale, 1e-6), t);
    const scaledW = partWidth * scale, scaledH = partHeight * scale;
    for(let pxI = 0; pxI < posSteps; pxI++){
      const offsetX = (w - scaledW) * (posSteps === 1 ? 0.5 : pxI / (posSteps - 1));
      for(let pyI = 0; pyI < posSteps; pyI++){
        const offsetY = (h - scaledH) * (posSteps === 1 ? 0.5 : pyI / (posSteps - 1));
        const cost = chamferCost(points, distField, w, h, scale, offsetX, offsetY, coverageOptsFor(scaledW, scaledH));
        if(cost < best.cost) best = { scale, offsetX, offsetY, cost };
      }
    }
  }

  // 局所改善：粗探索の結果を起点に、スケール・位置を少しずつ動かしてコストが
  // 下がる方向へ進める（改善しなくなったら歩幅を縮めて打ち切る）
  let current = best;
  const refineIters = options.refineIters || 30;
  let scaleStep = current.scale * 0.15;
  let posStep = partMaxDim * current.scale * 0.15;
  // 粗探索の範囲を少し広げた程度にscaleをクランプする（安全のための緩い上下限。
  // 退化解そのものの防止は上のカバー率ペナルティが担う）
  const scaleMin = minScale * 0.7, scaleMax = maxScale * 1.3;
  for(let iter = 0; iter < refineIters; iter++){
    const candidates = [
      { scale: current.scale + scaleStep, offsetX: current.offsetX, offsetY: current.offsetY },
      { scale: current.scale - scaleStep, offsetX: current.offsetX, offsetY: current.offsetY },
      { scale: current.scale, offsetX: current.offsetX + posStep, offsetY: current.offsetY },
      { scale: current.scale, offsetX: current.offsetX - posStep, offsetY: current.offsetY },
      { scale: current.scale, offsetX: current.offsetX, offsetY: current.offsetY + posStep },
      { scale: current.scale, offsetX: current.offsetX, offsetY: current.offsetY - posStep },
    ];
    let improved = false;
    for(const cand of candidates){
      if(cand.scale < scaleMin || cand.scale > scaleMax) continue;
      const scaledW = partWidth * cand.scale, scaledH = partHeight * cand.scale;
      const cost = chamferCost(points, distField, w, h, cand.scale, cand.offsetX, cand.offsetY, coverageOptsFor(scaledW, scaledH));
      if(cost < current.cost){
        current = { scale: cand.scale, offsetX: cand.offsetX, offsetY: cand.offsetY, cost };
        improved = true;
      }
    }
    if(!improved){
      scaleStep *= 0.6;
      posStep *= 0.6;
      if(posStep < 0.5) break;
    }
  }

  return current;
}

// candidateParts: [{frameId, partId, width, height, maskLines}, ...]
// 各パーツについてmatchTemplateToDistanceFieldを実行し、コストの小さい(＝当てはまりの
// 良い)順に並べて返す。edgeMaskを渡すと、退化解防止のためのカバー率ペナルティ
// （実際に検出されたエッジ全体のうち、当てはめた外接矩形内に収まっている割合）も評価する
function scoreAllTemplateMatches(distField, w, h, candidateParts, opts, edgeMask){
  const options = { ...(opts || {}) };
  if(edgeMask && !options.integral){
    let totalEdgeCount = 0;
    for(let i = 0; i < edgeMask.length; i++) totalEdgeCount += edgeMask[i];
    options.integral = computeIntegralImage(edgeMask, w, h);
    options.totalEdgeCount = totalEdgeCount;
  }
  return candidateParts
    .map(entry => ({ entry, match: matchTemplateToDistanceField(entry.maskLines, entry.width, entry.height, distField, w, h, options) }))
    .filter(r => !!r.match)
    .sort((a, b) => a.match.cost - b.match.cost);
}

// chamferCostの値（画素単位の平均ズレ）を、UI表示用の0〜1のスコアへ変換する。
// normalizerは「これくらいのズレなら明確に不一致とみなす」画素数の目安
function chamferCostToScore(cost, normalizer){
  return Math.exp(-cost / Math.max(1e-6, normalizer));
}
