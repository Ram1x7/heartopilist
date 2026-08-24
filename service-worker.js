// キャッシュ名（更新時はバージョンを上げる）
const CACHE_NAME = "hatopi-v2.178.0";

// キャッシュするファイル一覧
const CACHE_FILES = [
  "./",
  "./index.html",
  "./foods.html",
  "./garden.html",
  "./pet.html",
  "./shop.html",
  "./codes.html",
  "./events.html",
  "./videos.html",
  "./art-create.html",
  "./art-convert.html",
  "./music.html",
  "./faq.html",
  "./css/style.css?v=11",
  "./css/design-system.css?v=1",
  "./css/art.css?v=49",
  "./css/music.css?v=38",
  "./js/main.js?v=15",
  "./js/toast.js",
  "./js/bottom-nav.js",
  "./js/price-calc.js",
  "./js/shop.js?v=3",
  "./js/data-shop.js",
  "./js/data-sync.js",
  "./js/data-weather.js",
  "./js/data-fish.js",
  "./js/data-bugs.js",
  "./js/data-birds.js",
  "./js/data-sand.js",
  "./js/data-snow.js",
  "./js/data-shell.js",
  "./js/data-daily-spots.js",
  "./js/data-daily-tasks.js",
  "./js/data-weekly-tasks.js",
  "./js/data-foods.js",
  "./js/data-cats.js",
  "./js/data-dogs.js",
  "./js/data-crops.js",
  "./js/data-flowers.js",
  "./js/data-codes.js",
  "./js/data-events.js",
  "./js/data-faq.js",
  "./js/data-videos.js",
  "./js/art-config.js",
  "./js/art-masks.js",
  "./js/art-pixelate.js",
  "./js/art-template-match.js",
  "./js/lz-string.min.js",
  "./js/qrcode.js",
  "./js/art-share-code.js",
  "./js/art-editor.js",
  "./js/art-paint-guide.js",
  "./js/art-3d.js",
  "./js/art-screenshot-import.js",
  "./js/art-converter.js",
  "./js/music-config.js",
  "./js/music-editor.js",
  "./js/music-hum.js",
  "./js/music-midi-import.js",
  "./js/music-presets.js",
  "./js/i18n.js",
  "./js/icons.js",
  "./js/icon-size.js",
  "./js/currency-icons.js",
  "./js/sw-register.js",
  "./locales/ja.json?v=15",
  "./locales/en.json?v=15",
  "./locales/ko.json?v=15",
  "./locales/th.json?v=15",
  "./locales/zh-CN.json?v=15",
  "./locales/zh-TW.json?v=15",
  "./manifest.json",
];

// インストール時：キャッシュを作成
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES);
    })
  );
  // 新しいSWをすぐに有効化
  self.skipWaiting();
});

// 有効化時：古いキャッシュを削除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  // すぐに全クライアントを制御下に置く
  self.clients.claim();
});

// フェッチ時：ネットワーク優先（失敗時のみキャッシュを使う）
self.addEventListener("fetch", (e) => {
  // GETリクエスト以外はスルー
  if(e.request.method !== "GET") return;

  // 画像：キャッシュ優先＋裏で更新（stale-while-revalidate）
  // 図鑑の画像は数が多く更新頻度も低いため、毎回ネットワークを待たせず
  // キャッシュがあれば即座に表示し、裏で最新版に更新しておく
  if(e.request.destination === "image"){
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const networkFetch = fetch(e.request)
          .then((response) => {
            if(response && response.status === 200){
              const cloned = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cloned));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // 正常なレスポンスならキャッシュを更新
        if(response && response.status === 200){
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, cloned);
          });
        }
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(e.request);
      })
  );
});
