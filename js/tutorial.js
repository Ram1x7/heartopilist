/**
 * tutorial.js
 * サイト共通の初回チュートリアル（スポットライト形式）。
 * js/art-editor.jsの初回チュートリアルと同じUXパターン（背景を暗くし、
 * 案内対象のボタンだけを枠で囲んで吹き出しで順番に説明する）を、
 * 任意のページから最小限の呼び出しだけで使えるよう共通化したもの。
 * オーバーレイDOM要素はここでdocument.bodyへ動的に追加するため、
 * 各ページのHTML側に専用マークアップを用意する必要はない。
 *
 * ページ側の呼び出し方:
 *   maybeStartPageTutorial(doneKey, steps) … 初回訪問時のみ自動開始
 *   replayPageTutorial(doneKey, steps)     … ヘルプモーダル等から再生
 * steps は { selector, titleKey, titleFallback, textKey, textFallback } の配列。
 * titleKey/textKeyはページ側のグローバル関数 T(key, fallback) で解決する
 * （T()未定義のページではtitleFallback/textFallbackがそのまま使われる）。
 */

let _tutDoneKey = "";
let _tutSteps = [];
let _tutStep = 0;

function tutT(key, fallback){
  return (typeof T === "function") ? T(key, fallback) : fallback;
}

function ensureTutorialDom(){
  if(document.getElementById("dsTutorialBackdrop")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
<div id="dsTutorialBackdrop" class="ds-tutorial-backdrop" style="display:none;"></div>
<div id="dsTutorialHighlight" class="ds-tutorial-highlight" style="display:none;"></div>
<div id="dsTutorialPopup" class="ds-tutorial-popup" style="display:none;">
  <div class="ds-tutorial-step" id="dsTutorialStepLabel"></div>
  <div class="ds-tutorial-text" id="dsTutorialText"></div>
  <div class="ds-tutorial-actions">
    <button type="button" id="dsTutorialSkipBtn" class="ds-tutorial-skip"></button>
    <button type="button" id="dsTutorialNextBtn" class="ds-tutorial-next"></button>
  </div>
</div>`.trim();
  while(wrap.firstChild) document.body.appendChild(wrap.firstChild);

  document.getElementById("dsTutorialSkipBtn").addEventListener("click", endPageTutorial);
  document.getElementById("dsTutorialNextBtn").addEventListener("click", nextTutorialStep);

  const repositionIfActive = () => {
    if(document.getElementById("dsTutorialPopup").style.display === "none") return;
    const step = _tutSteps[_tutStep];
    const target = step ? document.querySelector(step.selector) : null;
    if(target) positionTutorialElements(target);
  };
  window.addEventListener("resize", repositionIfActive);
  // ページ側のレイアウトが原因でわずかにスクロール位置がずれるケースの保険として、
  // スクロール中も枠がターゲットに追従するようにする
  window.addEventListener("scroll", repositionIfActive, { passive: true });
}

// 初回訪問時のみ自動開始（既読ならなにもしない）
function maybeStartPageTutorial(doneKey, steps){
  if(localStorage.getItem(doneKey) === "true") return;
  setTimeout(() => startPageTutorial(doneKey, steps), 400);
}

function startPageTutorial(doneKey, steps){
  ensureTutorialDom();
  _tutDoneKey = doneKey;
  _tutSteps = steps;
  _tutStep = 0;
  document.getElementById("dsTutorialBackdrop").style.display = "block";
  document.getElementById("dsTutorialHighlight").style.display = "block";
  document.getElementById("dsTutorialPopup").style.display = "block";
  document.getElementById("dsTutorialSkipBtn").textContent = tutT("tutorial_skip", "スキップ");
  renderTutorialStep();
}

function renderTutorialStep(){
  const step = _tutSteps[_tutStep];
  const target = step ? document.querySelector(step.selector) : null;
  if(!step || !target || target.offsetParent === null){
    // 対象要素が非表示（フィルター等の状態次第で出ない場合)はスキップして次へ
    if(_tutStep < _tutSteps.length - 1){
      _tutStep++;
      renderTutorialStep();
    }else{
      endPageTutorial();
    }
    return;
  }
  document.getElementById("dsTutorialStepLabel").textContent = `${_tutStep + 1} / ${_tutSteps.length}`;
  const title = tutT(step.titleKey, step.titleFallback);
  const text = tutT(step.textKey, step.textFallback);
  document.getElementById("dsTutorialText").innerHTML = `<strong>${title}</strong><br>${text}`;
  document.getElementById("dsTutorialNextBtn").textContent =
    _tutStep === _tutSteps.length - 1 ? tutT("tutorial_start", "はじめる") : tutT("tutorial_next", "次へ");
  // スムーススクロールだとアニメーション完了前に位置を確定してしまい枠がズレるため、
  // 即座にジャンプさせてからレイアウト確定後（次の描画フレーム）に位置を合わせる
  target.scrollIntoView({ block: "center", behavior: "auto" });
  requestAnimationFrame(() => requestAnimationFrame(() => positionTutorialElements(target)));
}

function positionTutorialElements(target){
  const rect = target.getBoundingClientRect();
  const pad = 6;
  const highlight = document.getElementById("dsTutorialHighlight");
  highlight.style.left = (rect.left - pad) + "px";
  highlight.style.top = (rect.top - pad) + "px";
  highlight.style.width = (rect.width + pad * 2) + "px";
  highlight.style.height = (rect.height + pad * 2) + "px";

  const popup = document.getElementById("dsTutorialPopup");
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
  if(_tutStep >= _tutSteps.length - 1){
    endPageTutorial();
    return;
  }
  _tutStep++;
  renderTutorialStep();
}

function endPageTutorial(){
  if(_tutDoneKey) localStorage.setItem(_tutDoneKey, "true");
  const backdrop = document.getElementById("dsTutorialBackdrop");
  const highlight = document.getElementById("dsTutorialHighlight");
  const popup = document.getElementById("dsTutorialPopup");
  if(backdrop) backdrop.style.display = "none";
  if(highlight) highlight.style.display = "none";
  if(popup) popup.style.display = "none";
}

// ヘルプモーダル等からの手動再生（既読フラグを消してから開始）
function replayPageTutorial(doneKey, steps){
  localStorage.removeItem(doneKey);
  setTimeout(() => startPageTutorial(doneKey, steps), 250);
}

window.maybeStartPageTutorial = maybeStartPageTutorial;
window.startPageTutorial = startPageTutorial;
window.replayPageTutorial = replayPageTutorial;
