/**
 * toast.js
 * サイト共通のトースト通知（画面下部に一時表示するメッセージ）。
 * 呼び出し側で翻訳済みの文字列を渡すこと（i18n変換はここでは行わない）。
 */

function ensureToastContainer(){
  let el = document.getElementById("dsToastContainer");
  if(!el){
    el = document.createElement("div");
    el.id = "dsToastContainer";
    el.className = "ds-toast-container";
    document.body.appendChild(el);
  }
  return el;
}

// showToast(message, type) : type は見た目の変更には使わず、将来の拡張用に受け取るのみ
function showToast(message, type){
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = "ds-toast";
  toast.textContent = message;
  container.appendChild(toast);

  // 描画直後にクラスを付けてフェードイン（transition発火のため1フレーム遅らせる）
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

window.showToast = showToast;
