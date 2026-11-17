/**
 * sw-register.js
 * PWA用 Service Worker の登録
 *
 * ・ページ読み込み時に service-worker.js を登録する
 *
 * 補足: service-worker.js のfetchハンドラはHTML/CSS/JS等をネットワーク優先方式
 * にしているため、通常のページ遷移だけで常に最新の内容が読み込まれる（画像のみ
 * 表示速度を優先してキャッシュ優先方式）。そのため新しいSWが制御を引き継いだ際の
 * 強制リロードは行わない（ユーザーの操作中に予期しないタイミングでリロードが走り、
 * 　読み込みが遅い環境では画面が真っ白のまま固まって見える不具合の原因になっていた）。
 */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((err) => {
      console.warn("Service Worker registration failed:", err);
    });
  });
}
