/**
 * sw-register.js
 * PWA用 Service Worker の登録
 *
 * ・ページ読み込み時に service-worker.js を登録する
 *
 * 補足: service-worker.js のfetchハンドラはネットワーク優先方式のため、
 * 通常のページ遷移だけで常に最新のHTML/CSS/JSが読み込まれる。そのため
 * 新しいSWが制御を引き継いだ際の強制リロードは行わない
 * （ユーザーの操作中に予期しないタイミングでリロードが走り、
 * 　読み込みが遅い環境では画面が真っ白のまま固まって見える不具合の原因になっていた）。
 */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((err) => {
      console.warn("Service Worker registration failed:", err);
    });
  });
}
