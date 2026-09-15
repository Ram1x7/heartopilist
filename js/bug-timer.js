// js/bug-timer.js
// 虫のリポップタイマー（図鑑ページ限定のフローティングウィジェット）。
// 虫を捕獲した瞬間にボタンを押すと、そこから1分のカウントダウンを開始する。
// 複数回押した分はそれぞれ独立してカウントダウンし、0になったものは自動で
// リストから消える。押した回数（捕獲回数）はリセットするまでlocalStorageに
// 保持し続ける。

const BUG_TIMER_DURATION_MS = 60 * 1000;
const BUG_TIMER_COUNT_KEY = "hatopiBugTimerCount";
const BUG_TIMER_ACTIVE_KEY = "hatopiBugTimerActive";

let bugTimerCount = 0;
let bugTimerActive = []; // [{id, endAt}]
let bugTimerIdSeq = 1;

function loadBugTimerState(){
  bugTimerCount = Number(localStorage.getItem(BUG_TIMER_COUNT_KEY)) || 0;
  try{
    const saved = JSON.parse(localStorage.getItem(BUG_TIMER_ACTIVE_KEY) || "[]");
    const now = Date.now();
    // ページを閉じている間に期限切れになったものはここで取り除く
    bugTimerActive = saved.filter(t => t && typeof t.endAt === "number" && t.endAt > now);
  }catch(e){
    bugTimerActive = [];
  }
  bugTimerIdSeq = bugTimerActive.reduce((max, t) => Math.max(max, t.id || 0), 0) + 1;
  saveBugTimerActive();
}

function saveBugTimerCount(){
  localStorage.setItem(BUG_TIMER_COUNT_KEY, String(bugTimerCount));
}
function saveBugTimerActive(){
  localStorage.setItem(BUG_TIMER_ACTIVE_KEY, JSON.stringify(bugTimerActive));
}

function renderBugTimer(){
  const badge = document.getElementById("bugTimerBadge");
  if(badge) badge.textContent = String(bugTimerCount);
  const countValue = document.getElementById("bugTimerCountValue");
  if(countValue) countValue.textContent = String(bugTimerCount);

  const list = document.getElementById("bugTimerList");
  const emptyHint = document.getElementById("bugTimerEmptyHint");
  if(!list) return;

  const now = Date.now();
  const sorted = [...bugTimerActive].sort((a, b) => a.endAt - b.endAt);
  list.innerHTML = sorted.map(t => {
    const remainMs = Math.max(0, t.endAt - now);
    const sec = Math.ceil(remainMs / 1000);
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `<div class="bug-timer-item" data-id="${t.id}">
      <span>${mm}:${ss}</span>
      <button type="button" class="bug-timer-item-remove" data-remove-id="${t.id}" aria-label="remove">✕</button>
    </div>`;
  }).join("");
  if(emptyHint) emptyHint.style.display = sorted.length ? "none" : "block";

  list.querySelectorAll("[data-remove-id]").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.removeId);
      bugTimerActive = bugTimerActive.filter(t => t.id !== id);
      saveBugTimerActive();
      renderBugTimer();
    };
  });
}

// 1秒ごとに期限切れのものを取り除きつつ再描画する
function tickBugTimer(){
  const now = Date.now();
  const before = bugTimerActive.length;
  bugTimerActive = bugTimerActive.filter(t => t.endAt > now);
  if(bugTimerActive.length !== before) saveBugTimerActive();
  renderBugTimer();
}

function captureBugTimer(){
  bugTimerCount++;
  saveBugTimerCount();
  bugTimerActive.push({ id: bugTimerIdSeq++, endAt: Date.now() + BUG_TIMER_DURATION_MS });
  saveBugTimerActive();
  renderBugTimer();
}

function resetBugTimer(){
  bugTimerCount = 0;
  bugTimerActive = [];
  saveBugTimerCount();
  saveBugTimerActive();
  renderBugTimer();
}

function toggleBugTimerPanel(){
  const panel = document.getElementById("bugTimerPanel");
  const btn = document.getElementById("bugTimerToggleBtn");
  if(!panel) return;
  const willShow = panel.hidden;
  panel.hidden = !willShow;
  if(btn) btn.classList.toggle("active", willShow);
}

function initBugTimer(){
  const widget = document.getElementById("bugTimerWidget");
  if(!widget) return;
  loadBugTimerState();

  const captureIcon = widget.querySelector(".bug-timer-capture-icon");
  if(captureIcon && typeof icon === "function") captureIcon.innerHTML = icon("bug", { size: 24 });
  const toggleBtn = document.getElementById("bugTimerToggleBtn");
  if(toggleBtn && typeof icon === "function") toggleBtn.innerHTML = icon("chevronDown", { size: 14 });

  document.getElementById("bugTimerCaptureBtn").addEventListener("click", captureBugTimer);
  document.getElementById("bugTimerToggleBtn").addEventListener("click", toggleBugTimerPanel);
  document.getElementById("bugTimerResetBtn").addEventListener("click", resetBugTimer);

  renderBugTimer();
  setInterval(tickBugTimer, 1000);
}

initBugTimer();
