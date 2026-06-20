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
      const batch = db.batch();

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
        `Timer registered: ${cropName} (${notifyTimes.length}件)`
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
        .where("notifyAt", "<=", now)
        .where("sent", "==", false)
        .limit(100)
        .get();

      console.log(
        `Found timers: ${snap.size}`
      );

      if (snap.empty) {
        console.log("No pending notifications");
        return;
      }

      const batch = db.batch();

      await Promise.all(
        snap.docs.map(async (doc) => {
          const data = doc.data();

          let title;
          let body;

          if (data.label === "harvest") {
            title = "🌾 収穫タイム！";
            body =
              `${data.cropName}が育ちました！収穫しましょう！`;
          } else {
            title = "🌿 草抜きタイム！";
            body =
              `${data.cropName}の${data.label}です！草を抜きましょう！`;
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
                  icon:
                    "https://ram1x7.github.io/heartopilist/apple-touch-icon.png",
                  badge:
                    "https://ram1x7.github.io/heartopilist/apple-touch-icon.png",
                  requireInteraction: false,
                },
              },
            });

            console.log(
              `Notification sent: ${data.cropName}`
            );

            batch.update(doc.ref, {
              sent: true,
            });
          } catch (err) {
            console.error(
              `Notification failed: ${data.cropName}`,
              err
            );

            if (
              err.code ===
                "messaging/invalid-registration-token" ||
              err.code ===
                "messaging/registration-token-not-registered"
            ) {
              batch.delete(doc.ref);
            }
          }
        })
      );

      await batch.commit();

      console.log("Batch commit completed");
    } catch (err) {
      console.error(
        "checkAndSendNotifications error:",
        err
      );
    }
  }
);
