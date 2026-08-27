// js/art-screenshot-import.js
// 「スクショから取り込む」機能（art-create.htmlの「新規作成」モーダルから開く）。
//
// フロー：スクショをアップロード → スクショに写り込む補助線（ゲーム内デザイン枠画面に
// 表示される目安線で、はとぴ図鑑のアートページで使っているPRESET_MASKSの輪郭線と
// 同じ形のもの）を検出し、各テンプレートパーツの輪郭線データと照合してキャンバス判定＋
// 位置合わせを同時に行う → 候補キャンバスを提示（ユーザーが確認、または一覧から手動選択）
// → パーツ選択 → 色数・背景処理を調整しながらプレビュー →
// 既存のhatopiArt_currentDraft経由でart-editorへ引き渡す。
//
// 重要：外部AI APIには一切依存しない。テンプレート照合はjs/art-template-match.js
// （エッジ検出→距離変換→チャンファーマッチングという古典的な画像処理のみ）、
// 画像処理・パレット変換はjs/art-pixelate.js（元々js/art-converter.jsにあった処理を
// 共通化したもの）をそのまま利用する。
//
// キャンバス判定・位置合わせについて（正直な制約の開示）：
// スクショに実際に補助線がはっきり写っている（背景・キャラクターに隠れていない、
// 極端に暗い/ぼやけていない）ことを前提にした精度になる。補助線が写っていない、
// または不明瞭な通常の写真等では自動判定の精度は低くなるため、自信度が低い場合は
// 「自動判定できませんでした」として手動でのテンプレート選択を促す
// （間違ったテンプレートを自動適用するより、候補を提示して確認してもらうことを優先）。

const SSI_MAX_WORKING_DIM = 1600; // iPad等でのメモリ超過を避けるための内部処理用画像の最大辺（最終的な切り抜き用）
const SSI_SEARCH_MAX_DIM = 360; // テンプレート照合（エッジ検出・チャンファーマッチング）専用の、さらに縮小した探索用画像の最大辺
const SSI_MIN_IMAGE_DIM = 64; // これより小さい画像はエラーにする
const SSI_COLOR_COUNTS = [4, 8, 16, 32, 64, 128];
const SSI_BG_MODES = [
  { id: "auto", labelKey: "art_ssi_bg_auto", labelFallback: "自動" },
  { id: "keep", labelKey: "art_ssi_bg_keep", labelFallback: "そのまま" },
  { id: "white", labelKey: "art_ssi_bg_white", labelFallback: "白背景" },
];
// チャンファーマッチングの探索パラメータ。精度と処理時間のバランスを見て調整したもの
// （js/art-template-match.jsの既定値より軽め。iPad等でも実用的な時間で終わらせるため）
const SSI_MATCH_OPTIONS = { spacing: 4, scaleSteps: 8, posSteps: 6, refineIters: 20 };
// チャンファーコスト→0〜1スコアへ変換する際の正規化係数（探索用画像のピクセル単位が基準）
const SSI_SCORE_NORMALIZER = 6;
// このスコアを下回ったら「自動判定できませんでした」として手動選択を促す。
// また、選択されたテンプレートの当てはめスコアがこれを下回る場合、位置合わせ結果は
// 信頼できないとみなし、切り抜き範囲は画像全体にフォールバックする
const SSI_CONFIDENCE_THRESHOLD = 0.35;

let ssiWorkingCanvas = null; // 縮小済みの内部処理用画像（ここから範囲切り抜き・変換を行う）
let ssiSearchScaleToWorking = 1; // 探索用画像の座標をssiWorkingCanvas座標へ変換する倍率
let ssiMatchResults = []; // 全テンプレートパーツの照合結果 [{frameId, partId, frame, part, match, score}, ...]（スコア降順）
let ssiRegionRect = null; // 選択中のテンプレートについて決定した切り抜き範囲（working canvas座標）{x,y,w,h}
let ssiSelectedFrameId = null;
let ssiSelectedPartId = null;
// bgの既定値は"keep"（背景除去なし）。補助線照合による切り抜きは対象パーツの範囲へ
// 直接位置合わせされるため、そのままauto背景除去をかけると単色の衣装（例：無地Tシャツ）が
// 丸ごと「背景」と誤認されて消えてしまうことがある。背景の写り込みが残る場合のために
// "auto"/"white"は選べるようにしておくが、既定はユーザーが明示的に選ぶまで安全側の"keep"とする
let ssiSettings = { colors: 32, dither: true, bg: "keep" };
let ssiLastComputedPixels = null;

// 手動調整ステップ（自動検出がずれていた場合の補正用）の状態。
// 矩形は常に「調整用<img>の表示サイズ（CSSピクセル）」の座標系で保持し、
// working canvas座標への変換はssiWorkingRectToCss/ssiCssRectToWorkingで行う
let ssiAdjustRect = null; // {x,y,w,h}
let ssiAdjustDragMode = null; // "move" | "resize" | null
let ssiAdjustHandleIndex = null; // 0:左上 1:右上 2:右下 3:左下
let ssiAdjustDragStart = null; // {x,y,rect}
let ssiAdjustResizeObserver = null;
const SSI_ADJUST_HANDLE_RADIUS = 16; // iPadでも指で掴みやすいよう大きめに

function ssiT(key, fallback){
  return (typeof T === "function") ? T(key, fallback) : (typeof i18n !== "undefined" ? i18n.t(key) : fallback) || fallback;
}

function ssiClothesFrames(){
  return DESIGN_FRAME_PRESETS.filter(f => f.category === "clothes");
}

// ── モーダルの開閉・ステップ切り替え ──
function openScreenshotImportModal(){
  ssiResetState();
  document.getElementById("gridSizeModal").style.display = "none";
  document.getElementById("artSsiModal").style.display = "block";
  ssiGoToStep("upload");
}

function closeScreenshotImportModal(){
  document.getElementById("artSsiModal").style.display = "none";
}

function ssiResetState(){
  ssiWorkingCanvas = null;
  ssiMatchResults = [];
  ssiRegionRect = null;
  ssiSelectedFrameId = null;
  ssiSelectedPartId = null;
  ssiLastComputedPixels = null;
  ssiAdjustRect = null;
  if(ssiAdjustResizeObserver){
    ssiAdjustResizeObserver.disconnect();
    ssiAdjustResizeObserver = null;
  }
  document.getElementById("artSsiFileInput").value = "";
  document.getElementById("artSsiUploadError").textContent = "";
  document.getElementById("artSsiSettingsError").textContent = "";
  document.getElementById("artSsiManualFrameOptions").style.display = "none";
}

const SSI_STEPS = ["upload", "candidates", "part", "adjust", "settings"];
function ssiGoToStep(step){
  SSI_STEPS.forEach(s => {
    document.getElementById(`artSsiStep${s.charAt(0).toUpperCase()}${s.slice(1)}`).style.display = (s === step) ? "" : "none";
  });
  document.getElementById("artSsiProgress").style.display = "none";
}

// ── STEP1: アップロード ──
function ssiHandleFileSelect(file){
  const errorEl = document.getElementById("artSsiUploadError");
  errorEl.textContent = "";
  if(!file) return;
  if(!/^image\//.test(file.type)){
    errorEl.textContent = ssiT("art_ssi_error_unsupported_file", "この形式の画像には対応していません。スクリーンショット画像（JPEG/PNG等）を選んでください");
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => {
    errorEl.textContent = ssiT("art_ssi_error_load_failed", "画像を読み込めませんでした。別の画像でお試しください");
  };
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => {
      errorEl.textContent = ssiT("art_ssi_error_load_failed", "画像を読み込めませんでした。別の画像でお試しください");
    };
    img.onload = () => {
      if(img.naturalWidth < SSI_MIN_IMAGE_DIM || img.naturalHeight < SSI_MIN_IMAGE_DIM){
        errorEl.textContent = ssiT("art_ssi_error_too_small", "画像が小さすぎます。もっと大きいスクリーンショットでお試しください");
        return;
      }
      try{
        ssiPrepareWorkingCanvas(img);
      }catch(e){
        console.error(e);
        errorEl.textContent = ssiT("art_ssi_error_processing", "この端末では画像の処理に失敗しました。別の画像や端末でお試しください");
        return;
      }
      // テンプレート照合（エッジ検出＋チャンファーマッチング）は数百ms〜数秒かかりうるため、
      // 進捗表示を実際に描画させてから重い同期処理を実行する
      document.getElementById("artSsiProgress").textContent = ssiT("art_ssi_matching", "補助線を照合中…");
      document.getElementById("artSsiProgress").style.display = "";
      setTimeout(() => {
        try{
          ssiRunTemplateMatching();
        }catch(e){
          console.error(e);
          errorEl.textContent = ssiT("art_ssi_error_processing", "この端末では画像の処理に失敗しました。別の画像や端末でお試しください");
          document.getElementById("artSsiProgress").style.display = "none";
          return;
        }
        ssiGoToStep("candidates");
        ssiRenderCandidates();
      }, 30);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

// iPad等でのメモリ超過を避けるため、内部処理用に長辺SSI_MAX_WORKING_DIM以下へ縮小した
// オフスクリーンcanvasを作る（最終的な書き出し解像度＝各パーツのwidth/heightには影響しない）
function ssiPrepareWorkingCanvas(img){
  const scale = Math.min(1, SSI_MAX_WORKING_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  ssiWorkingCanvas = canvas;
}

// ── 補助線照合（テンプレート判定＋位置合わせ） ──
// js/art-template-match.jsのアルゴリズム（エッジ検出→距離変換→チャンファーマッチング）を
// 使い、衣装カテゴリの全パーツについて、スクショ内の補助線との当てはまりを評価する
function ssiRunTemplateMatching(){
  // 探索はssiWorkingCanvasよりさらに縮小した専用の画像で行う（速度優先。最終的な
  // 切り抜き自体はssiWorkingCanvas側の座標へスケールし直すため、精度への影響は小さい）
  const searchScale = Math.min(1, SSI_SEARCH_MAX_DIM / Math.max(ssiWorkingCanvas.width, ssiWorkingCanvas.height));
  const sw = Math.max(1, Math.round(ssiWorkingCanvas.width * searchScale));
  const sh = Math.max(1, Math.round(ssiWorkingCanvas.height * searchScale));
  const searchCanvas = document.createElement("canvas");
  searchCanvas.width = sw;
  searchCanvas.height = sh;
  searchCanvas.getContext("2d").drawImage(ssiWorkingCanvas, 0, 0, sw, sh);
  ssiSearchScaleToWorking = ssiWorkingCanvas.width / sw;

  const imgData = searchCanvas.getContext("2d").getImageData(0, 0, sw, sh);
  const mag = computeEdgeMagnitude(imgData);
  const edgeMask = binarizeEdgesOtsu(mag);
  const distField = computeDistanceTransform(edgeMask, sw, sh);

  const candidateParts = [];
  ssiClothesFrames().forEach(frame => {
    frame.parts.forEach(part => {
      const maskEntry = (typeof PRESET_MASKS !== "undefined" && PRESET_MASKS[frame.id]) ? PRESET_MASKS[frame.id][part.id] : null;
      if(!maskEntry || !maskEntry.maskLines || !maskEntry.maskLines.length) return;
      candidateParts.push({ frameId: frame.id, partId: part.id, frame, part, width: part.width, height: part.height, maskLines: maskEntry.maskLines });
    });
  });

  const scored = scoreAllTemplateMatches(distField, sw, sh, candidateParts, SSI_MATCH_OPTIONS, edgeMask);
  ssiMatchResults = scored.map(r => ({
    frameId: r.entry.frameId,
    partId: r.entry.partId,
    frame: r.entry.frame,
    part: r.entry.part,
    match: r.match,
    score: chamferCostToScore(r.match.cost, SSI_SCORE_NORMALIZER),
  }));
}

function ssiFindMatchResult(frameId, partId){
  return ssiMatchResults.find(r => r.frameId === frameId && r.partId === partId) || null;
}

// 選択されたテンプレートパーツの当てはめ結果から、working canvas座標での切り抜き範囲を決める。
// 当てはめの信頼度が低い場合（十分に一致する補助線が見つからなかった場合）は、
// 誤った位置合わせのまま切り抜くよりも安全な「画像全体」にフォールバックする
function ssiResolveRegionRect(frameId, partId){
  const result = ssiFindMatchResult(frameId, partId);
  if(result && result.score >= SSI_CONFIDENCE_THRESHOLD){
    const m = result.match;
    return {
      x: Math.round(m.offsetX * ssiSearchScaleToWorking),
      y: Math.round(m.offsetY * ssiSearchScaleToWorking),
      w: Math.max(1, Math.round(result.part.width * m.scale * ssiSearchScaleToWorking)),
      h: Math.max(1, Math.round(result.part.height * m.scale * ssiSearchScaleToWorking)),
    };
  }
  return { x: 0, y: 0, w: ssiWorkingCanvas.width, h: ssiWorkingCanvas.height };
}

// ── STEP2: キャンバス候補 ──
function ssiRenderCandidates(){
  const lang = (typeof currentLang === "function") ? currentLang() : "ja";

  // フレーム単位で最良スコアのパーツを代表として候補一覧に出す（同じフレームの
  // 複数パーツが上位を占めて紛らわしくなるのを防ぐため。パーツそのものの選択は次のステップで行う）
  const byFrame = new Map();
  ssiMatchResults.forEach(r => {
    const existing = byFrame.get(r.frameId);
    if(!existing || r.score > existing.score) byFrame.set(r.frameId, r);
  });
  const top = [...byFrame.values()].sort((a, b) => b.score - a.score).slice(0, 5);

  const listEl = document.getElementById("artSsiCandidateList");
  listEl.innerHTML = top.map((c, i) => `
    <div class="art-ssi-candidate-item${i === 0 ? " art-ssi-candidate-top" : ""}" data-frame="${c.frameId}">
      <img class="art-ssi-candidate-icon" src="${c.frame.icon}" alt="" width="36" height="36">
      <div class="art-ssi-candidate-info">
        <div class="art-ssi-candidate-name">${frameName(c.frame, lang)}</div>
        <div class="art-ssi-candidate-score-bar"><div class="art-ssi-candidate-score-fill" style="width:${Math.round(c.score * 100)}%"></div></div>
        <div class="art-ssi-candidate-score-label">${Math.round(c.score * 100)}%</div>
      </div>
      <button class="art-header-btn art-ssi-candidate-use-btn" data-frame="${c.frameId}">${ssiT("art_ssi_use_canvas_btn", "このキャンバスを使用")}</button>
    </div>
  `).join("");
  listEl.querySelectorAll(".art-ssi-candidate-use-btn").forEach(btn => {
    btn.addEventListener("click", () => ssiSelectFrame(btn.dataset.frame));
  });

  const lowConfidence = top.length === 0 || top[0].score < SSI_CONFIDENCE_THRESHOLD;
  document.getElementById("artSsiLowConfidenceHint").style.display = lowConfidence ? "" : "none";
  const manualFrameOptions = document.getElementById("artSsiManualFrameOptions");
  ssiRenderManualFrameOptions();
  manualFrameOptions.style.display = lowConfidence ? "" : "none";
}

function ssiRenderManualFrameOptions(){
  const lang = (typeof currentLang === "function") ? currentLang() : "ja";
  const el = document.getElementById("artSsiManualFrameOptions");
  el.innerHTML = ssiClothesFrames().map(f => `
    <button class="art-frame-btn" data-value="${f.id}">
      <img class="art-frame-icon" src="${f.icon}" alt="" width="29" height="29">
      <span>${frameName(f, lang)}</span>
    </button>
  `).join("");
  el.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => ssiSelectFrame(btn.dataset.value));
  });
}

function ssiSelectFrame(frameId){
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === frameId);
  if(!frame) return;
  ssiSelectedFrameId = frameId;
  if(frame.parts.length === 1){
    ssiSelectedPartId = frame.parts[0].id;
    ssiGoToStep("adjust");
    ssiSetupAdjustStage();
  }else{
    ssiRenderPartOptions(frame);
    ssiGoToStep("part");
  }
}

function ssiRenderPartOptions(frame){
  const lang = (typeof currentLang === "function") ? currentLang() : "ja";
  const el = document.getElementById("artSsiPartOptions");
  el.innerHTML = frame.parts.map(p => `
    <button class="art-frame-btn" data-value="${p.id}">
      ${partOutlineThumbSvg(frame.id, p.id, 54)}
      <span>${frameName(p, lang)}</span>
    </button>
  `).join("");
  el.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      ssiSelectedPartId = btn.dataset.value;
      ssiGoToStep("adjust");
      ssiSetupAdjustStage();
    });
  });
}

// ── STEP3: 検出範囲の手動調整 ──
// 自動検出（補助線照合）がずれている・不正確な場合の補正手段。
// working canvas全体を表示し、その上に検出済み（または画像全体フォールバック）の
// 矩形を重ねて、ドラッグでの移動・四隅ドラッグでのリサイズができるようにする
function ssiSetupAdjustStage(){
  const img = document.getElementById("artSsiAdjustImg");
  const seedRect = ssiResolveRegionRect(ssiSelectedFrameId, ssiSelectedPartId);
  img.onload = () => {
    ssiAdjustRect = ssiWorkingRectToCss(seedRect);
    ssiDrawAdjustOverlay();
    ssiBindAdjustResize();
  };
  img.src = ssiWorkingCanvas.toDataURL();
}

function ssiBindAdjustResize(){
  if(ssiAdjustResizeObserver) ssiAdjustResizeObserver.disconnect();
  if(typeof ResizeObserver === "undefined") return;
  const wrap = document.getElementById("artSsiAdjustWrap");
  ssiAdjustResizeObserver = new ResizeObserver(() => ssiDrawAdjustOverlay());
  ssiAdjustResizeObserver.observe(wrap);
}

// working canvas座標（元画像の内部処理解像度）⇔ 調整用<img>の表示サイズ（CSSピクセル）の相互変換
function ssiWorkingRectToCss(rect){
  const img = document.getElementById("artSsiAdjustImg");
  const scale = (img.clientWidth || ssiWorkingCanvas.width) / ssiWorkingCanvas.width;
  return { x: rect.x * scale, y: rect.y * scale, w: rect.w * scale, h: rect.h * scale };
}

function ssiCssRectToWorking(rect){
  const img = document.getElementById("artSsiAdjustImg");
  const scale = ssiWorkingCanvas.width / (img.clientWidth || ssiWorkingCanvas.width);
  return {
    x: Math.round(rect.x * scale),
    y: Math.round(rect.y * scale),
    w: Math.round(rect.w * scale),
    h: Math.round(rect.h * scale),
  };
}

function ssiAdjustHandlePoints(){
  const r = ssiAdjustRect;
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h },
  ];
}

function ssiDrawAdjustOverlay(){
  const img = document.getElementById("artSsiAdjustImg");
  const canvas = document.getElementById("artSsiAdjustOverlay");
  const w = img.clientWidth;
  const h = img.clientHeight;
  if(!w || !h || !ssiAdjustRect) return;
  canvas.width = w;
  canvas.height = h;
  // 画面回転等で表示サイズが変わった場合も矩形が枠内に収まるよう補正する
  ssiAdjustRect.w = Math.min(ssiAdjustRect.w, w);
  ssiAdjustRect.h = Math.min(ssiAdjustRect.h, h);
  ssiAdjustRect.x = Math.max(0, Math.min(ssiAdjustRect.x, w - ssiAdjustRect.w));
  ssiAdjustRect.y = Math.max(0, Math.min(ssiAdjustRect.y, h - ssiAdjustRect.h));
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, w, h);
  ctx.clearRect(ssiAdjustRect.x, ssiAdjustRect.y, ssiAdjustRect.w, ssiAdjustRect.h);
  ctx.strokeStyle = "#4dd0e1";
  ctx.lineWidth = 2;
  ctx.strokeRect(ssiAdjustRect.x, ssiAdjustRect.y, ssiAdjustRect.w, ssiAdjustRect.h);
  ctx.fillStyle = "#4dd0e1";
  ssiAdjustHandlePoints().forEach(pt => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, SSI_ADJUST_HANDLE_RADIUS / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function ssiHitTestHandle(x, y){
  const pts = ssiAdjustHandlePoints();
  for(let i = 0; i < pts.length; i++){
    const dx = x - pts[i].x, dy = y - pts[i].y;
    if(Math.sqrt(dx * dx + dy * dy) <= SSI_ADJUST_HANDLE_RADIUS) return i;
  }
  return null;
}

function ssiPointerPos(e, canvas){
  const rect = canvas.getBoundingClientRect();
  const point = (e.touches && e.touches[0]) ? e.touches[0] : e;
  return { x: point.clientX - rect.left, y: point.clientY - rect.top };
}

function ssiBindAdjustInteractions(){
  const canvas = document.getElementById("artSsiAdjustOverlay");
  const onStart = (e) => {
    if(!ssiAdjustRect) return;
    const pos = ssiPointerPos(e, canvas);
    const handle = ssiHitTestHandle(pos.x, pos.y);
    if(handle !== null){
      ssiAdjustDragMode = "resize";
      ssiAdjustHandleIndex = handle;
    }else if(
      pos.x >= ssiAdjustRect.x && pos.x <= ssiAdjustRect.x + ssiAdjustRect.w &&
      pos.y >= ssiAdjustRect.y && pos.y <= ssiAdjustRect.y + ssiAdjustRect.h
    ){
      ssiAdjustDragMode = "move";
    }else{
      return;
    }
    ssiAdjustDragStart = { x: pos.x, y: pos.y, rect: { ...ssiAdjustRect } };
    e.preventDefault();
  };
  const onMove = (e) => {
    if(!ssiAdjustDragMode) return;
    const pos = ssiPointerPos(e, canvas);
    const dx = pos.x - ssiAdjustDragStart.x;
    const dy = pos.y - ssiAdjustDragStart.y;
    const start = ssiAdjustDragStart.rect;
    const w = canvas.width, h = canvas.height;
    if(ssiAdjustDragMode === "move"){
      ssiAdjustRect.x = Math.max(0, Math.min(start.x + dx, w - start.w));
      ssiAdjustRect.y = Math.max(0, Math.min(start.y + dy, h - start.h));
      ssiAdjustRect.w = start.w;
      ssiAdjustRect.h = start.h;
    }else if(ssiAdjustDragMode === "resize"){
      let x0 = start.x, y0 = start.y, x1 = start.x + start.w, y1 = start.y + start.h;
      const minSize = 8;
      if(ssiAdjustHandleIndex === 0){ x0 += dx; y0 += dy; }
      else if(ssiAdjustHandleIndex === 1){ x1 += dx; y0 += dy; }
      else if(ssiAdjustHandleIndex === 2){ x1 += dx; y1 += dy; }
      else if(ssiAdjustHandleIndex === 3){ x0 += dx; y1 += dy; }
      x0 = Math.max(0, Math.min(x0, x1 - minSize));
      y0 = Math.max(0, Math.min(y0, y1 - minSize));
      x1 = Math.min(w, Math.max(x1, x0 + minSize));
      y1 = Math.min(h, Math.max(y1, y0 + minSize));
      ssiAdjustRect.x = x0;
      ssiAdjustRect.y = y0;
      ssiAdjustRect.w = x1 - x0;
      ssiAdjustRect.h = y1 - y0;
    }
    ssiDrawAdjustOverlay();
    e.preventDefault();
  };
  const onEnd = () => {
    ssiAdjustDragMode = null;
    ssiAdjustHandleIndex = null;
    ssiAdjustDragStart = null;
  };
  canvas.addEventListener("mousedown", onStart);
  canvas.addEventListener("touchstart", onStart, { passive: false });
  window.addEventListener("mousemove", onMove);
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("mouseup", onEnd);
  window.addEventListener("touchend", onEnd);
}

// ── STEP4: 色数・背景の調整とプレビュー ──
function ssiCurrentPart(){
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === ssiSelectedFrameId);
  if(!frame) return null;
  return frame.parts.find(p => p.id === ssiSelectedPartId) || null;
}

function ssiSetupSettingsStage(){
  // ssiRegionRectは手動調整ステップ（STEP3）で確定済みのためここでは再計算しない
  renderOptionGroup("artSsiColorOptions", SSI_COLOR_COUNTS.map(n => ({ id: n, label: String(n) })), ssiSettings.colors, (v) => {
    ssiSettings.colors = Number(v);
    ssiScheduleUpdatePreview();
  });
  renderOptionGroup(
    "artSsiBgOptions",
    SSI_BG_MODES.map(m => ({ id: m.id, label: ssiT(m.labelKey, m.labelFallback) })),
    ssiSettings.bg,
    (v) => { ssiSettings.bg = v; ssiScheduleUpdatePreview(); }
  );
  document.getElementById("artSsiDitherToggle").checked = ssiSettings.dither;
  ssiUpdatePreview();
}

let ssiPreviewTimer = null;
// 設定変更の連続入力（色数・背景・ディザリング切替）で毎回すぐ再計算しないよう、
// art-converter.jsのscheduleConvert()と同じ150msのデバウンスをかける
function ssiScheduleUpdatePreview(){
  clearTimeout(ssiPreviewTimer);
  ssiPreviewTimer = setTimeout(ssiUpdatePreview, 150);
}

function ssiUpdatePreview(){
  const errorEl = document.getElementById("artSsiSettingsError");
  errorEl.textContent = "";
  const part = ssiCurrentPart();
  if(!part || !ssiRegionRect) return;
  try{
    const origCanvas = document.getElementById("artSsiPreviewOriginal");
    const maxBox = 160;
    const origScale = Math.min(maxBox / ssiRegionRect.w, maxBox / ssiRegionRect.h);
    origCanvas.width = Math.round(ssiRegionRect.w * origScale);
    origCanvas.height = Math.round(ssiRegionRect.h * origScale);
    origCanvas.getContext("2d").drawImage(
      ssiWorkingCanvas,
      ssiRegionRect.x, ssiRegionRect.y, ssiRegionRect.w, ssiRegionRect.h,
      0, 0, origCanvas.width, origCanvas.height
    );

    const pixels = ssiComputePixels(part.width, part.height);
    ssiLastComputedPixels = pixels;
    const resultCanvas = document.getElementById("artSsiPreviewResult");
    drawPixelsToCanvas(resultCanvas, pixels, part.width, part.height, maxBox);
  }catch(e){
    console.error(e);
    errorEl.textContent = ssiT("art_ssi_error_extract_failed", "デザインの抽出に失敗しました。別の画像でお試しください");
  }
}

function ssiComputePixels(width, height){
  const off = document.createElement("canvas");
  off.width = width;
  off.height = height;
  const octx = off.getContext("2d");
  octx.drawImage(
    ssiWorkingCanvas,
    ssiRegionRect.x, ssiRegionRect.y, ssiRegionRect.w, ssiRegionRect.h,
    0, 0, width, height
  );
  const imgData = octx.getImageData(0, 0, width, height);
  const bgMask = computeBackgroundMask(imgData, ssiSettings.bg);
  const palette = buildPalette(imgData, ssiSettings.colors, bgMask);
  return ssiSettings.dither ? ditherToPalette(imgData, palette, bgMask) : mapToPalette(imgData, palette, bgMask);
}

function ssiApplyToEditor(){
  const part = ssiCurrentPart();
  const errorEl = document.getElementById("artSsiSettingsError");
  if(!part || !ssiLastComputedPixels){
    errorEl.textContent = ssiT("art_ssi_error_extract_failed", "デザインの抽出に失敗しました。別の画像でお試しください");
    return;
  }
  const existing = localStorage.getItem("hatopiArt_currentDraft");
  if(existing){
    const proceed = confirm(ssiT("art_overwrite_draft_confirm", "編集中の下書きがあります。変換結果で上書きしますか？"));
    if(!proceed) return;
  }
  document.getElementById("artSsiProgress").style.display = "";
  try{
    localStorage.setItem("hatopiArt_currentDraft", JSON.stringify({
      width: part.width,
      height: part.height,
      pixelData: ssiLastComputedPixels,
      frameId: ssiSelectedFrameId,
      partId: ssiSelectedPartId,
      justCreated: true,
    }));
  }catch(e){
    console.error(e);
    document.getElementById("artSsiProgress").style.display = "none";
    errorEl.textContent = ssiT("art_ssi_error_processing", "この端末では画像の処理に失敗しました。別の画像や端末でお試しください");
    return;
  }
  location.reload();
}

// ── 初期化 ──
function bindScreenshotImportControls(){
  document.getElementById("artScreenshotImportOpenBtn").addEventListener("click", openScreenshotImportModal);
  document.getElementById("artSsiFileInput").addEventListener("change", (e) => {
    ssiHandleFileSelect(e.target.files && e.target.files[0]);
  });
  document.getElementById("artSsiManualPickLink").addEventListener("click", () => {
    const el = document.getElementById("artSsiManualFrameOptions");
    el.style.display = el.style.display === "none" ? "" : "none";
  });
  document.getElementById("artSsiDitherToggle").addEventListener("change", (e) => {
    ssiSettings.dither = e.target.checked;
    ssiScheduleUpdatePreview();
  });
  document.getElementById("artSsiApplyBtn").addEventListener("click", ssiApplyToEditor);
  document.getElementById("artSsiAdjustConfirmBtn").addEventListener("click", () => {
    ssiRegionRect = ssiCssRectToWorking(ssiAdjustRect);
    ssiGoToStep("settings");
    ssiSetupSettingsStage();
  });
  ssiBindAdjustInteractions();
}

bindScreenshotImportControls();
