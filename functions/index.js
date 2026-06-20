// functions/index.js
// Firebase Cloud Functionsにデプロイするファイルです

const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// ── タイマー登録API ──────────────────────────
// garden.htmlからfetchで呼ばれる
exports.registerTimer = onRequest(
  { cors: ["https://ram1x7.github.io"] },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { fcmToken, cropName, mode, notifyTimes } = req.body;
    // notifyTimes: [{ label: "W1", time: 1750000000000 }, ...]
    // time はUNIXタイムスタンプ（ミリ秒）

    if (!fcmToken || !cropName || !notifyTimes) {
      return res.status(400).send("Bad Request");
    }

    try {
      // Firestoreにタイマーを保存
      const batch = db.batch();
      notifyTimes.forEach((n, i) => {
        const ref = db.collection("timers").doc();
        batch.set(ref, {
          fcmToken,
          cropName,
          mode,
          label: n.label,
          notifyAt: admin.firestore.Timestamp.fromMillis(n.time),
          sent: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }
);

// ── タイマーキャンセルAPI ──────────────────────────
exports.cancelTimer = onRequest(
  { cors: ["https://ram1x7.github.io"] },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { fcmToken, cropName } = req.body;

    if (!fcmToken || !cropName) {
      return res.status(400).send("Bad Request");
    }

    try {
      const snap = await db
        .collection("timers")
        .where("fcmToken", "==", fcmToken)
        .where("cropName", "==", cropName)
        .where("sent", "==", false)
        .get();

      const batch = db.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }
);

// ── 1分ごとに通知チェック ──────────────────────────
exports.checkAndSendNotifications = onSchedule(
  "every 1 minutes",
  async () => {
    const now = admin.firestore.Timestamp.now();

    // 送信時刻を過ぎていて未送信のものを取得
    const snap = await db
      .collection("timers")
      .where("notifyAt", "<=", now)
      .where("sent", "==", false)
      .limit(100)
      .get();

    if (snap.empty) return;

    const batch = db.batch();

    await Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data();

        // 通知のタイトル・本文を決定
        let title, body;
        if (data.label === "harvest") {
          title = "🌾 収穫タイム！";
          body = `${data.cropName}が育ちました！収穫しましょう！`;
        } else {
          title = "🌿 草抜きタイム！";
          body = `${data.cropName}の${data.label}です！草を抜きましょう！`;
        }

        try {
          await admin.messaging().send({
            token: data.fcmToken,
            notification: { title, body },
            webpush: {
              notification: {
                title,
                body,
                icon: "https://ram1x7.github.io/heartopilist/apple-touch-icon.png",
                badge: "https://ram1x7.github.io/heartopilist/apple-touch-icon.png",
                requireInteraction: false,
              },
            },
          });

          // 送信済みにマーク
          batch.update(doc.ref, { sent: true });
        } catch (err) {
          console.error(`通知送信失敗: ${data.cropName}`, err);
          // トークンが無効な場合は削除
          if (
            err.code === "messaging/invalid-registration-token" ||
            err.code === "messaging/registration-token-not-registered"
          ) {
            batch.delete(doc.ref);
          }
        }
      })
    );

    await batch.commit();
  }
);
