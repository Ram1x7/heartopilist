// js/art-screenshot-import.js
// 「スクショから取り込む」機能（art-create.htmlの「新規作成」モーダルから開く）。
//
// フロー：スクショをアップロード → 画像全体を自動解析して衣装らしき範囲を検出 →
// 既存のDESIGN_FRAME_PRESETS（js/art-config.js）と検出範囲のアスペクト比を比較して
// 候補キャンバスを提示 → ユーザーが確認（または一覧から手動選択）→ パーツ選択 →
// 色数・背景処理を調整しながらプレビュー → 既存のhatopiArt_currentDraft経由で
// art-editorへ引き渡す。
//
// 範囲はユーザーがドラッグ指定するのではなく、画像から自動検出する
// （手作業での範囲指定は不要という要望に基づく）。
//
// 重要：外部AI APIには一切依存しない。画像処理・パレット変換は js/art-pixelate.js
// （元々js/art-converter.jsにあった処理を共通化したもの）をそのまま利用する。
//
// 範囲の自動検出について（正直な制約の開示）：
// 四隅から連結する近似色領域を「背景」とみなすフラッドフィル（js/art-pixelate.jsの
// computeBackgroundMask、既存の「画像から作る」機能の背景除去と同じロジック）を使い、
// 背景ではないと判定された部分の外接矩形を「衣装が写っている範囲」とみなしている。
// そのため、背景が単色に近い（キャラクター表示画面のような無地寄りの背景）ほど精度が
// 上がり、背景が複雑な通常のゲーム画面では検出範囲が画像全体に近くなることがある。
// 本格的な人物・衣装の輪郭認識ではなく、あくまで背景色との差分に基づく簡易検出である。
//
// キャンバス自動判定について（正直な制約の開示）：
// 「衣装の輪郭・特徴点からの本格的な画像認識」はブラウザ内・AI API無しでは
// 安定した精度が出せないため、今回はアスペクト比（検出範囲の縦横比 と
// 各テンプレートパーツのwidth:height比の近さ）＋衣装カテゴリでの絞り込みのみを
// 使った控えめなヒューリスティックとしている。自信度が低い場合や、同じ比率の
// パーツ（例：Tシャツのフロントとバック）は区別できないため、常に手動選択・
// パーツ選択の導線を用意し、自動判定は「候補の提示」に留める。

const SSI_MAX_WORKING_DIM = 1600; // iPad等でのメモリ超過を避けるための内部処理用画像の最大辺
const SSI_MIN_IMAGE_DIM = 64; // これより小さい画像はエラーにする
const SSI_COLOR_COUNTS = [4, 8, 16, 32, 64, 128];
const SSI_BG_MODES = [
  { id: "auto", labelKey: "art_ssi_bg_auto", labelFallback: "自動" },
  { id: "keep", labelKey: "art_ssi_bg_keep", labelFallback: "そのまま" },
  { id: "white", labelKey: "art_ssi_bg_white", labelFallback: "白背景" },
];

let ssiWorkingCanvas = null; // 縮小済みの内部処理用画像（ここから範囲切り抜き・変換を行う）
let ssiRegionRect = null; // 自動検出された範囲（working canvasのピクセル座標）{x,y,w,h}
let ssiSelectedFrameId = null;
let ssiSelectedPartId = null;
// bgの既定値は"keep"（背景除去なし）にしている。自動検出した範囲は既に
// 「背景ではない部分」の外接矩形へタイトに切り詰められているため、ここでさらに
// auto背景除去をかけると、単色の衣装（例：無地Tシャツ）がクロップ全体を占めて
// 四隅まで同じ色になり、それ自体を「背景」と誤認して丸ごと消えてしまうことがある。
// 背景の写り込みが残っている場合のために"auto"/"white"は選べるようにしておくが、
// 既定はユーザーが明示的に選ぶまで安全側の"keep"とする
let ssiSettings = { colors: 32, dither: true, bg: "keep" };
let ssiLastComputedPixels = null;

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
  ssiRegionRect = null;
  ssiSelectedFrameId = null;
  ssiSelectedPartId = null;
  ssiLastComputedPixels = null;
  document.getElementById("artSsiFileInput").value = "";
  document.getElementById("artSsiUploadError").textContent = "";
  document.getElementById("artSsiSettingsError").textContent = "";
  document.getElementById("artSsiManualFrameOptions").style.display = "none";
}

const SSI_STEPS = ["upload", "candidates", "part", "settings"];
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
        ssiRegionRect = ssiAutoDetectRegion(ssiWorkingCanvas);
      }catch(e){
        console.error(e);
        errorEl.textContent = ssiT("art_ssi_error_processing", "この端末では画像の処理に失敗しました。別の画像や端末でお試しください");
        return;
      }
      ssiGoToStep("candidates");
      ssiRenderCandidates();
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

// 画像全体から「衣装が写っていそうな範囲」を自動検出する。
// js/art-pixelate.jsのcomputeBackgroundMask（四隅から連結する近似色領域を背景とみなす
// フラッドフィル、既存の「画像から作る」機能の背景除去と同じロジック）を流用し、
// 背景ではないと判定された全ピクセルの外接矩形を範囲として使う。
// 背景除去で何も検出できなかった場合（画面全体が単色に近い等）は画像全体を対象にする
function ssiAutoDetectRegion(canvas){
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d");
  const imgData = ctx.getImageData(0, 0, w, h);
  const bgMask = computeBackgroundMask(imgData, "auto");
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      if(!bgMask[y * w + x]){
        if(x < minX) minX = x;
        if(x > maxX) maxX = x;
        if(y < minY) minY = y;
        if(y > maxY) maxY = y;
      }
    }
  }
  if(maxX < minX || maxY < minY){
    return { x: 0, y: 0, w, h };
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// ── STEP2: キャンバス候補 ──
// 正直な前提：ここでは本格的な画像認識は行わず、自動検出した範囲のアスペクト比と
// 各テンプレートパーツのwidth:height比の近さだけをスコアにしている（対数比の差を正規化）。
// 同じ比率のパーツ（例：フロントとバック）は区別できないため、フレーム単位で
// スコアリングし、パーツの選択は次のステップでユーザー自身に行ってもらう。
function ssiComputeCandidates(rect){
  const cropRatio = rect.w / rect.h;
  const frames = ssiClothesFrames();
  const scored = frames.map(frame => {
    let bestScore = -Infinity, bestPart = frame.parts[0];
    frame.parts.forEach(part => {
      const partRatio = part.width / part.height;
      const diff = Math.abs(Math.log(cropRatio / partRatio));
      const score = Math.max(0, 1 - diff / Math.log(3));
      if(score > bestScore){ bestScore = score; bestPart = part; }
    });
    return { frame, bestPart, score: bestScore };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

const SSI_CONFIDENCE_THRESHOLD = 0.55;

function ssiRenderCandidates(){
  const lang = (typeof currentLang === "function") ? currentLang() : "ja";

  // 自動検出した範囲をプレビュー表示（透明性のため。操作は不要）
  const previewCanvas = document.getElementById("artSsiDetectedPreview");
  if(previewCanvas && ssiWorkingCanvas && ssiRegionRect){
    const maxBox = 140;
    const scale = Math.min(1, maxBox / Math.max(ssiRegionRect.w, ssiRegionRect.h));
    previewCanvas.width = Math.max(1, Math.round(ssiRegionRect.w * scale));
    previewCanvas.height = Math.max(1, Math.round(ssiRegionRect.h * scale));
    previewCanvas.getContext("2d").drawImage(
      ssiWorkingCanvas,
      ssiRegionRect.x, ssiRegionRect.y, ssiRegionRect.w, ssiRegionRect.h,
      0, 0, previewCanvas.width, previewCanvas.height
    );
  }

  const candidates = ssiComputeCandidates(ssiRegionRect);
  const top = candidates.slice(0, 5);
  const listEl = document.getElementById("artSsiCandidateList");
  listEl.innerHTML = top.map((c, i) => `
    <div class="art-ssi-candidate-item${i === 0 ? " art-ssi-candidate-top" : ""}" data-frame="${c.frame.id}">
      <img class="art-ssi-candidate-icon" src="${c.frame.icon}" alt="" width="36" height="36">
      <div class="art-ssi-candidate-info">
        <div class="art-ssi-candidate-name">${frameName(c.frame, lang)}</div>
        <div class="art-ssi-candidate-score-bar"><div class="art-ssi-candidate-score-fill" style="width:${Math.round(c.score * 100)}%"></div></div>
        <div class="art-ssi-candidate-score-label">${Math.round(c.score * 100)}%</div>
      </div>
      <button class="art-header-btn art-ssi-candidate-use-btn" data-frame="${c.frame.id}">${ssiT("art_ssi_use_canvas_btn", "このキャンバスを使用")}</button>
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
    ssiGoToStep("settings");
    ssiSetupSettingsStage();
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
      ssiGoToStep("settings");
      ssiSetupSettingsStage();
    });
  });
}

// ── STEP3: 色数・背景の調整とプレビュー ──
function ssiCurrentPart(){
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === ssiSelectedFrameId);
  if(!frame) return null;
  return frame.parts.find(p => p.id === ssiSelectedPartId) || null;
}

function ssiSetupSettingsStage(){
  renderOptionGroup("artSsiColorOptions", SSI_COLOR_COUNTS.map(n => ({ id: n, label: String(n) })), ssiSettings.colors, (v) => {
    ssiSettings.colors = Number(v);
    ssiUpdatePreview();
  });
  renderOptionGroup(
    "artSsiBgOptions",
    SSI_BG_MODES.map(m => ({ id: m.id, label: ssiT(m.labelKey, m.labelFallback) })),
    ssiSettings.bg,
    (v) => { ssiSettings.bg = v; ssiUpdatePreview(); }
  );
  document.getElementById("artSsiDitherToggle").checked = ssiSettings.dither;
  ssiUpdatePreview();
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
    ssiUpdatePreview();
  });
  document.getElementById("artSsiApplyBtn").addEventListener("click", ssiApplyToEditor);
}

bindScreenshotImportControls();
