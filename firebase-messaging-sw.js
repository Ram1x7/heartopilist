// firebase-messaging-sw.js
// ルートディレクトリに配置してください

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB6aGH4BCn2NFNUMeon9LTM_ck2vKoWYFI",
  authDomain: "heartopilist-c8b69.firebaseapp.com",
  projectId: "heartopilist-c8b69",
  storageBucket: "heartopilist-c8b69.firebasestorage.app",
  messagingSenderId: "906963149499",
  appId: "1:906963149499:web:14ab2b1bd7c079f616bf9e",
});

const messaging = firebase.messaging();

// ★ pushイベントを直接ハンドルしてFCMのデフォルト表示を上書き
// これによりonBackgroundMessageとの二重表示を防ぐ
self.addEventListener("push", (event) => {
  // FCMのデフォルト処理をここで止める
  event.stopImmediatePropagation();

  let title = "はとぴ図鑑";
  let body = "";
  let icon = "./apple-touch-icon.png";

  try {
    const data = event.data?.json();
    // FCMのペイロード構造に対応
    const notification = data?.notification || data?.data || {};
    title = notification.title || data?.data?.title || title;
    body  = notification.body  || data?.data?.body  || body;
    icon  = notification.icon  || data?.data?.icon  || icon;
  } catch(e) {
    console.error("push parse error:", e);
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: "./apple-touch-icon.png",
      tag: "hatopi-notif",
      renotify: false,
      requireInteraction: false,
    })
  );
});
