// functions/index.js
// Firebase Cloud Functionsにデプロイするファイルです

const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// ── タイマー登録API ──────────────────────────
exports.registerTimer = onRequest(
  { cors: ["https://ram1x7.github.io"] },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { fcmToken, cropName, mode, notifyTimes } = req.body;

    if (!fcmToken || !cropName || !notifyTimes) {
      return res.status(400).send("Bad Request");
    }

    try {
      // ★ 既存の未送信タイマーを先に削除（二重登録防止）
      const existing = await db
        .collection("timers")
        .where("fcmToken", "==", fcmToken)
        .where("cropName", "==", cropName)
        .where("sent", "==", false)
        .get();

      const batch = db.batch();

      existing.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      notifyTimes.forEach((n) => {
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

      console.log(
        `Timer registered: ${cropName} (${notifyTimes.length}件, 既存${existing.size}件削除)`
      );

      res.status(200).json({ success: true });
    } catch (err) {
      console.error("registerTimer error:", err);
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

      snap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(
        `Timer cancelled: ${cropName} (${snap.size}件削除)`
      );

      res.status(200).json({ success: true });
    } catch (err) {
      console.error("cancelTimer error:", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

// ── 1分ごとに通知チェック ──────────────────────────
exports.checkAndSendNotifications = onSchedule(
  "every 1 minutes",
  async () => {
    console.log(
      "Scheduler executed:",
      new Date().toISOString()
    );

    const now = admin.firestore.Timestamp.now();

    try {
      const snap = await db
        .collection("timers")
        .where("sent", "==", false)
        .where("notifyAt", "<=", now)
        .limit(100)
        .get();

      console.log(`Found timers: ${snap.size}`);

      if (snap.empty) {
        console.log("No pending notifications");
        return;
      }

      await Promise.all(
        snap.docs.map(async (doc) => {
          const data = doc.data();

          // ★ 先にsentをtrueにして二重送信を防ぐ
          await doc.ref.update({ sent: true });

          let title;
          let body;

          if (data.label === "harvest") {
            title = "🌾 収穫タイム！";
            body = `${data.cropName}が育ちました！収穫しましょう！`;
          } else {
            title = "🌿 草抜きタイム！";
            body = `${data.cropName}の${data.label}です！草を抜きましょう！`;
          }

          console.log(
            `Sending notification: ${data.cropName} (${data.label})`
          );

          try {
            await admin.messaging().send({
              token: data.fcmToken,
              notification: {
                title,
                body,
              },
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

            console.log(`Notification sent: ${data.cropName}`);
          } catch (err) {
            console.error(
              `Notification failed: ${data.cropName}`,
              err
            );

            // トークンが無効な場合はドキュメントを削除
            if (
              err.code === "messaging/invalid-registration-token" ||
              err.code === "messaging/registration-token-not-registered"
            ) {
              await doc.ref.delete();
            }
          }
        })
      );

      console.log("All notifications processed");
    } catch (err) {
      console.error("checkAndSendNotifications error:", err);
    }
  }
);
