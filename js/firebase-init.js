// js/firebase-init.js
// garden.htmlで読み込んでください

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6aGH4BCn2NFNUMeon9LTM_ck2vKoWYFI",
  authDomain: "heartopilist-c8b69.firebaseapp.com",
  projectId: "heartopilist-c8b69",
  storageBucket: "heartopilist-c8b69.firebasestorage.app",
  messagingSenderId: "906963149499",
  appId: "1:906963149499:web:14ab2b1bd7c079f616bf9e",
};

const VAPID_KEY = "BHsuetgZxjPnNS1eiqkIRwmFhddZkN0FweRiAbwCv3ixBEnTODksIpyOoHi72HLtOLYdYZ9xno-K1RJE93247LQ";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// FCMトークンを取得してlocalStorageに保存
export async function initFCM() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("通知が拒否されました");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register(
        "./firebase-messaging-sw.js"
      ),
    });

    if (token) {
      localStorage.setItem("fcmToken", token);
      console.log("FCMトークン取得成功:", token);
      return token;
    }
  } catch (err) {
    console.error("FCM初期化エラー:", err);
    return null;
  }
}

// フォアグラウンド通知の受信
export function onForegroundMessage(callback) {
  onMessage(messaging, (payload) => {
    callback(payload);
  });
}
