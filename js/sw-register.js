/**
 * sw-register.js
 * PWA用 Service Worker の登録・更新検知
 *
 * ・ページ読み込み時に service-worker.js を登録する
 * ・新しいバージョンの Service Worker が見つかったら自動でインストールし、
 *   有効化され次第ページを自動リロードして、常に最新のJS/CSS/HTMLが
 *   使われるようにする（PWAアプリでファイルが更新されない問題への対策）
 */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").then((registration) => {

      // 新しい Service Worker が見つかったとき
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          // 新しいSWが「インストール済み」になった時点で、
          // 既存のクライアント(このタブ)がまだ古いSWに制御されているなら更新とみなす
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // skipWaiting() 済みのSWなので、controllerchange で自動的に反映される
          }
        });
      });

    }).catch((err) => {
      console.warn("Service Worker registration failed:", err);
    });

    // 新しい Service Worker が実際に制御を引き継いだら、ページをリロードして
    // 最新のHTML/JS/CSSを確実に読み込み直す
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}
