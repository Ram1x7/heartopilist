// js/art-screenshot-import.js
// 「スクショから取り込む」機能（art-create.htmlの「新規作成」モーダルから開く）。
//
// フロー：スクショをアップロード → スクショに写り込む補助線（ゲーム内デザイン枠画面に
// 表示される目安線で、はとぴ図鑑のアートページで使っているPRESET_MASKSの輪郭線と
// 同じ形のもの）を検出し、各テンプレートパーツの輪郭線データと照合してキャンバス判定＋
// 位置合わせを同時に行う → 候補キャンバスを提示（ユーザーが確認、または一覧から手動選択）
// → パーツ選択 → 色数・背景処理を調整しながらプレビュー →
// 編集画面の状態と下書きをまとめて更新する。
//
// 画像処理は端末内で行う。補助線向けの照合、マス位置の補正、マス中央の代表色取得を
// js/art-screenshot-recovery.jsへ分離。通常の写真変換は従来のart-pixelate.jsを使う。
// 減色とディザリングは任意。型紙や格子が見えない画像は手動の範囲調整が必要になる。

const SSI_MAX_WORKING_DIM = 1600; // iPad等でのメモリ超過を避けるための内部処理用画像の最大辺（最終的な切り抜き用）
const SSI_SEARCH_MAX_DIM = 360; // テンプレート照合（エッジ検出・チャンファーマッチング）専用の、さらに縮小した探索用画像の最大辺
const SSI_MIN_IMAGE_DIM = 64; // これより小さい画像はエラーにする
const SSI_COLOR_COUNTS = [0, 4, 8, 16, 32, 64, 128];
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
let ssiSettings = { colors: 0, dither: false, bg: "keep", removeGuides: true, stabilizeColors: true };
let ssiWorkingData = null, ssiGuideField = null, ssiRecoveryInfo = null, ssiLoadGeneration = 0;
let ssiLastComputedPixels = null;

// 手動調整ステップ（自動検出がずれていた場合の補正用）の状態。
// 矩形は常に「調整用<img>の表示サイズ（CSSピクセル）」の座標系で保持し、
// working canvas座標への変換はssiWorkingRectToCss/ssiCssRectToWorkingで行う
let ssiAdjustRect = null; // {x,y,w,h}
let ssiAdjustDragMode = null; // "move" | "resize" | null
let ssiAdjustHandleIndex = null; // 0:左上 1:右上 2:右下 3:左下
let ssiAdjustDragStart = null; // {x,y,rect}
let ssiAdjustResizeObserver = null;
let ssiAdjustDisplaySize = null;
const SSI_ADJUST_HANDLE_RADIUS = 16; // iPadでも指で掴みやすいよう大きめに

function ssiT(key, fallback){
  const value=typeof T==='function'?T(key,fallback):typeof i18n!=='undefined'?i18n.t(key):fallback;
  return !value||value===key?fallback:value;
}

function ssiImportFrames(){
  return DESIGN_FRAME_PRESETS.filter(f => f.parts.some(p => PRESET_MASKS[f.id]?.[p.id]?.maskLines?.length));
}

// ── モーダルの開閉・ステップ切り替え ──
function openScreenshotImportModal(){
  ssiResetState();
  document.getElementById("gridSizeModal").style.display = "none";
  document.getElementById("artSsiModal").style.display = "block";
  ssiGoToStep("upload");
}

function closeScreenshotImportModal(){
  ssiLoadGeneration++;clearTimeout(ssiPreviewTimer);
  document.getElementById("artSsiModal").style.display = "none";
}

function ssiResetState(){
  ssiLoadGeneration++;clearTimeout(ssiPreviewTimer);
  ssiSettings = { colors: 0, dither: false, bg: "keep", removeGuides: true, stabilizeColors: true };
  ssiWorkingData = null;ssiGuideField = null;ssiRecoveryInfo = null;ssiLastComputedPixels = null;
  ssiWorkingCanvas = null;ssiAdjustDisplaySize=null;
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
  document.getElementById("artSsiAlignInfo").textContent="";
  document.getElementById("artSsiRecoveryInfo").textContent="";
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
  const ticket=++ssiLoadGeneration;ssiLastComputedPixels=null;
  if(!/^image\//.test(file.type)){
    errorEl.textContent = ssiT("art_ssi_error_unsupported_file", "この形式の画像には対応していません。スクリーンショット画像（JPEG/PNG等）を選んでください");
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => {
    if(ticket!==ssiLoadGeneration)return;
    errorEl.textContent = ssiT("art_ssi_error_load_failed", "画像を読み込めませんでした。別の画像でお試しください");
  };
  reader.onload = () => {
    if(ticket!==ssiLoadGeneration)return;
    const img = new Image();
    img.onerror = () => {
      if(ticket!==ssiLoadGeneration)return;
      errorEl.textContent = ssiT("art_ssi_error_load_failed", "画像を読み込めませんでした。別の画像でお試しください");
    };
    img.onload = () => {
      if(ticket!==ssiLoadGeneration)return;
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
      setTimeout(async () => {
        if(ticket!==ssiLoadGeneration)return;
        try{
          const complete=await ssiRunTemplateMatching(ticket);
          if(!complete||ticket!==ssiLoadGeneration)return;
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
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(img, 0, 0, w, h);
  ssiWorkingCanvas = canvas;
  ssiWorkingData=ctx.getImageData(0,0,w,h);ssiGuideField=null;
}

// ── 補助線照合（テンプレート判定＋位置合わせ） ──
// js/art-template-match.jsのアルゴリズム（エッジ検出→距離変換→チャンファーマッチング）を
// 使い、対応する型紙の全パーツについて、スクショ内の補助線との当てはまりを評価する
async function ssiRunTemplateMatching(ticket=ssiLoadGeneration){
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
  ssiImportFrames().forEach(frame => {
    frame.parts.forEach(part => {
      const maskEntry = (typeof PRESET_MASKS !== "undefined" && PRESET_MASKS[frame.id]) ? PRESET_MASKS[frame.id][part.id] : null;
      if(!maskEntry || !maskEntry.maskLines || !maskEntry.maskLines.length) return;
      candidateParts.push({ frameId: frame.id, partId: part.id, frame, part, width: part.width, height: part.height, maskLines: maskEntry.maskLines });
    });
  });

  const ridge=HatopiScreenshotRecovery.guideField(imgData),ridgeMask=new Uint8Array(sw*sh);
  let ridgeCount=0;for(let i=0;i<ridgeMask.length;i++)if(ridge.data[i]>.2){ridgeMask[i]=1;ridgeCount++;}
  const fallback=[],primary=[],ridgeDistance=ridgeCount>=8?computeDistanceTransform(ridgeMask,sw,sh):null;
  const fallbackOptions={...SSI_MATCH_OPTIONS,integral:computeIntegralImage(edgeMask,sw,sh),totalEdgeCount:edgeMask.reduce((sum,n)=>sum+n,0)};
  for(let start=0;start<candidateParts.length;start+=2){
    if(ticket!==ssiLoadGeneration)return false;
    const batch=candidateParts.slice(start,start+2);
    fallback.push(...scoreAllTemplateMatches(distField,sw,sh,batch,fallbackOptions));
    if(ridgeDistance)primary.push(...scoreAllTemplateMatches(ridgeDistance,sw,sh,batch,SSI_MATCH_OPTIONS));
    const progress=document.getElementById('artSsiProgress');if(progress)progress.textContent=ssiT('art_ssi_matching','補助線を照合中…')+' '+Math.min(start+2,candidateParts.length)+'/'+candidateParts.length;
    await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(ticket!==ssiLoadGeneration)return false;
  const byPart=new Map();
  for(const r of fallback)byPart.set(r.entry.frameId+':'+r.entry.partId,{...r,score:Math.min(.3,chamferCostToScore(r.match.cost,SSI_SCORE_NORMALIZER)),method:'edges'});
  // Edge matches can provide a better starting point when JPEG artifacts create
  // extra ridges. Validate both seeds against the actual guide support.
  if(ridgeDistance)for(const r of [...primary,...fallback]){
    const seed={x:r.match.offsetX,y:r.match.offsetY,w:r.entry.width*r.match.scale,h:r.entry.height*r.match.scale};
    const guide=HatopiScreenshotRecovery.refineGuide(ridge,r.entry.maskLines,seed,r.entry.width,r.entry.height),rect=guide.rect;
    const match={scale:rect.w/r.entry.width,offsetX:rect.x,offsetY:rect.y};
    match.cost=chamferCost(sampleMaskLinePoints(r.entry.maskLines,4),ridgeDistance,sw,sh,match.scale,match.offsetX,match.offsetY,null);
    const score=guide.score/(1+match.cost*.35),key=r.entry.frameId+':'+r.entry.partId;
    if(score>(byPart.get(key)?.score||0))byPart.set(key,{...r,match,score,method:'guides'});
  }
  ssiMatchResults=[...byPart.values()].map(r=>({frameId:r.entry.frameId,partId:r.entry.partId,frame:r.entry.frame,part:r.entry.part,match:r.match,score:r.score,method:r.method})).sort((a,b)=>b.score-a.score);
  return true;
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
    const rect={x:m.offsetX*ssiSearchScaleToWorking,y:m.offsetY*ssiSearchScaleToWorking,w:result.part.width*m.scale*ssiSearchScaleToWorking,h:result.part.height*m.scale*ssiSearchScaleToWorking};
    return ssiAlignRect(rect,result.part,frameId).rect;
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
        <div class="art-ssi-candidate-score-label">${ssiT("art_ssi_match_hint", "一致の目安")} ${Math.round(c.score * 100)}%</div>
      </div>
      <button class="art-header-btn art-ssi-candidate-use-btn" data-frame="${c.frameId}">${ssiT("art_ssi_use_canvas_btn", "このキャンバスを使用")}</button>
    </div>
  `).join("");
  listEl.querySelectorAll(".art-ssi-candidate-use-btn").forEach(btn => {
    btn.addEventListener("click", () => ssiSelectFrame(btn.dataset.frame));
  });

  const lowConfidence = top.length === 0 || top[0].score < SSI_CONFIDENCE_THRESHOLD || (top.length>1 && top[0].score-top[1].score<.07);
  document.getElementById("artSsiLowConfidenceHint").style.display = lowConfidence ? "" : "none";
  const manualFrameOptions = document.getElementById("artSsiManualFrameOptions");
  ssiRenderManualFrameOptions();
  manualFrameOptions.style.display = lowConfidence ? "" : "none";
}

function ssiRenderManualFrameOptions(){
  const lang = (typeof currentLang === "function") ? currentLang() : "ja";
  const el = document.getElementById("artSsiManualFrameOptions");
  el.innerHTML = ssiImportFrames().map(f => `
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
  const seedRect = ssiResolveRegionRect(ssiSelectedFrameId, ssiSelectedPartId),ticket=ssiLoadGeneration;
  img.onload = () => {
    if(ticket!==ssiLoadGeneration)return;
    ssiAdjustDisplaySize=null;
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
    x: rect.x * scale,
    y: rect.y * scale,
    w: rect.w * scale,
    h: rect.h * scale,
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
  if(ssiAdjustDisplaySize){
    const sx=w/ssiAdjustDisplaySize.w,sy=h/ssiAdjustDisplaySize.h;
    ssiAdjustRect={x:ssiAdjustRect.x*sx,y:ssiAdjustRect.y*sy,w:ssiAdjustRect.w*sx,h:ssiAdjustRect.h*sy};
  }
  ssiAdjustDisplaySize={w,h};
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
  const part=ssiCurrentPart();
  if(part && document.getElementById('artSsiGridToggle').checked){
    ctx.save();ctx.beginPath();ctx.rect(ssiAdjustRect.x,ssiAdjustRect.y,ssiAdjustRect.w,ssiAdjustRect.h);ctx.clip();
    ctx.strokeStyle='rgba(60,90,110,.3)';ctx.lineWidth=.6;ctx.beginPath();
    const step=Math.min(ssiAdjustRect.w/part.width,ssiAdjustRect.h/part.height)<3?5:1;
    for(let x=0;x<=part.width;x+=step){const px=ssiAdjustRect.x+x*ssiAdjustRect.w/part.width;ctx.moveTo(px,ssiAdjustRect.y);ctx.lineTo(px,ssiAdjustRect.y+ssiAdjustRect.h);}
    for(let y=0;y<=part.height;y+=step){const py=ssiAdjustRect.y+y*ssiAdjustRect.h/part.height;ctx.moveTo(ssiAdjustRect.x,py);ctx.lineTo(ssiAdjustRect.x+ssiAdjustRect.w,py);}
    ctx.stroke();ctx.restore();
  }
  ctx.strokeStyle = "#3c5a6e";
  ctx.lineWidth = 2;
  ctx.strokeRect(ssiAdjustRect.x, ssiAdjustRect.y, ssiAdjustRect.w, ssiAdjustRect.h);
  ctx.fillStyle = "#3c5a6e";
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
  renderOptionGroup("artSsiColorOptions", SSI_COLOR_COUNTS.map(n => ({ id: n, label: n ? String(n) : ssiT("art_ssi_keep_colors", "色数を制限しない") })), ssiSettings.colors, (v) => {
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
  document.getElementById("artSsiGuideToggle").checked = ssiSettings.removeGuides;
  document.getElementById("artSsiColorStabilityToggle").checked = ssiSettings.stabilizeColors;
  ssiUpdatePreview();
}

let ssiPreviewTimer = null;
// 設定変更の連続入力（色数・背景・ディザリング切替）で毎回すぐ再計算しないよう、
// art-converter.jsのscheduleConvert()と同じ150msのデバウンスをかける
function ssiScheduleUpdatePreview(){
  clearTimeout(ssiPreviewTimer);
  ssiLastComputedPixels=null;
  ssiPreviewTimer = setTimeout(ssiUpdatePreview, 150);
}

function ssiUpdatePreview(){
  const errorEl = document.getElementById("artSsiSettingsError");
  errorEl.textContent = "";
  ssiLastComputedPixels=null;
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

function ssiGetGuideField(){
  if(!ssiWorkingData)ssiWorkingData=ssiWorkingCanvas.getContext('2d').getImageData(0,0,ssiWorkingCanvas.width,ssiWorkingCanvas.height);
  if(!ssiGuideField)ssiGuideField=HatopiScreenshotRecovery.guideField(ssiWorkingData);
  return ssiGuideField;
}
function ssiAlignRect(rect,part,frameId=ssiSelectedFrameId){
  const mask=PRESET_MASKS[frameId]?.[part.id];if(!mask)return {rect,improved:false};
  const field=ssiGetGuideField(),guide=HatopiScreenshotRecovery.refineGuide(field,mask.maskLines,rect,part.width,part.height);
  const grid=HatopiScreenshotRecovery.alignGrid(ssiWorkingData,guide.rect,part.width,part.height,HatopiScreenshotRecovery.cellMask(part.width,part.height,mask.maskLines,mask.disabledRanges));
  return {rect:grid.rect,improved:guide.improved||grid.improved};
}
function ssiComputePixels(width,height){
  const part=ssiCurrentPart(),mask=PRESET_MASKS[ssiSelectedFrameId]?.[part.id];
  ssiGetGuideField();
  const result=HatopiScreenshotRecovery.recover(ssiWorkingData,ssiRegionRect,width,height,{...mask,field:ssiGuideField,removeGuides:ssiSettings.removeGuides,stabilizeColors:ssiSettings.stabilizeColors});
  ssiRecoveryInfo=result;
  const bgMask=computeBackgroundMask(result.image,ssiSettings.bg);
  for(let i=0;i<bgMask.length;i++)if(!result.pixels[i])bgMask[i]=true;
  let output;
  if(!ssiSettings.colors && !ssiSettings.dither)output=result.pixels.map((hex,i)=>bgMask[i]?null:hex);
  else{
    const palette=ssiSettings.colors?buildPalette(result.image,ssiSettings.colors,bgMask):GAME_PALETTE_FLAT.map(p=>hexToRgb(p.hex));
    output=ssiSettings.dither?ditherToPalette(result.image,palette,bgMask):mapToPalette(result.image,palette,bgMask);
  }
  const info=document.getElementById('artSsiRecoveryInfo'),count=new Set(output.filter(Boolean)).size;
  info.textContent=count+' '+ssiT('art_ssi_recovered_colors','色を復元しました。')+' '+(result.smallCells?ssiT('art_ssi_small_cells','マスが小さいため、大きなスクショを使ってください。'):'')+(result.unreadable?' '+ssiT('art_ssi_unreadable_cells','読み取れないマス（未着色）')+': '+result.unreadable:'')+(result.weak?' '+ssiT('art_ssi_mixed_cells','色の判別が難しいマス（位置・画質を確認）')+': '+result.weak:'');
  return output;
}
function ssiApplyToEditor(){
  const part=ssiCurrentPart(),errorEl=document.getElementById('artSsiSettingsError');
  if(!part||!ssiLastComputedPixels){errorEl.textContent=ssiT('art_ssi_error_extract_failed','取り込み結果を確認してください。');return;}
  const same=typeof activeFrameId!=='undefined' && activeFrameId===ssiSelectedFrameId;
  if(localStorage.getItem('hatopiArt_currentDraft')&&!confirm(same?ssiT('art_ssi_replace_part','このパーツの内容をスクショで置き換えます。他のパーツは残ります。よろしいですか？'):ssiT('art_overwrite_draft_confirm','編集中の下書きを置き換えますか？')))return;
  try{
    const success=applyScreenshotToEditor({width:part.width,height:part.height,pixelData:ssiLastComputedPixels,frameId:ssiSelectedFrameId,partId:ssiSelectedPartId});
    if(!success){errorEl.textContent=ssiT('art_ssi_save_failed','保存できませんでした。端末の空き容量を確認してください。元の作品は変更していません。');return;}
    closeScreenshotImportModal();document.getElementById('gridSizeModal').style.display='none';
    if(typeof showModeWizard==='function')showModeWizard();
  }catch(error){console.error(error);errorEl.textContent=ssiT('art_ssi_error_processing','取り込めませんでした。もう一度お試しください。');}
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
    ssiLastComputedPixels=null;
    ssiGoToStep("settings");
    ssiSetupSettingsStage();
  });
  document.getElementById('artSsiGridToggle').addEventListener('change',ssiDrawAdjustOverlay);
  document.getElementById('artSsiColorStabilityToggle').addEventListener('change',e=>{ssiSettings.stabilizeColors=e.target.checked;ssiScheduleUpdatePreview();});
  document.getElementById('artSsiGuideToggle').addEventListener('change',e=>{ssiSettings.removeGuides=e.target.checked;ssiScheduleUpdatePreview();});
  document.getElementById('artSsiAutoAlignBtn').addEventListener('click',()=>{
    const part=ssiCurrentPart();if(!part||!ssiAdjustRect)return;
    const result=ssiAlignRect(ssiCssRectToWorking(ssiAdjustRect),part);ssiAdjustRect=ssiWorkingRectToCss(result.rect);ssiDrawAdjustOverlay();
    document.getElementById('artSsiAlignInfo').textContent=result.improved?ssiT('art_ssi_align_done','補助線とマス位置を補正しました。枠を確認してください。'):ssiT('art_ssi_align_uncertain','確かな補正位置を見つけられませんでした。枠を手動で調整してください。');
  });
  ssiBindAdjustInteractions();
}

bindScreenshotImportControls();
