// キャッシュ名（更新時はバージョンを上げる）
const CACHE_NAME = "hatopi-v2.4.3";

// キャッシュするファイル一覧
const CACHE_FILES = [
  "./",
  "./index.html",
  "./foods.html",
  "./garden.html",
  "./pet.html",
  "./codes.html",
  "./events.html",
  "./faq.html",
  "./css/style.css",
  "./js/main.js",
  "./js/data-fish.js",
  "./js/data-bugs.js",
  "./js/data-birds.js",
  "./js/data-foods.js",
  "./js/data-cats.js",
  "./js/data-dogs.js",
  "./js/data-crops.js",
  "./js/data-flowers.js",
  "./js/data-codes.js",
  "./js/data-events.js",
  "./js/data-faq.js",
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
