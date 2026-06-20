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

// バックグラウンド通知の受信
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body: body || "",
    icon: icon || "./apple-touch-icon.png",
    badge: "./apple-touch-icon.png",
    tag: payload.data?.tag || "hatopi-notif",
    requireInteraction: false,
  });
});
