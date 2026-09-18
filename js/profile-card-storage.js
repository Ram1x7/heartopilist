// js/profile-card-storage.js
// プロフィールカードメーカーの永続化層。
// 文字・設定値はlocalStorage（hatopi_profile_card_v1）、
// アバター画像（サイズが大きくlocalStorageに不向き）はIndexedDBへ保存する。
// 既存の図鑑/料理/園芸/実績のlocalStorageキーは一切読み書きしない。

const PROFILE_CARD_STORAGE_KEY = "hatopi_profile_card_v1";
const PROFILE_CARD_DB_NAME = "hatopi-profile-card";
const PROFILE_CARD_DB_STORE = "avatar";
const PROFILE_CARD_DB_VERSION = 1;

function profileCardDefaultState() {
  return {
    playerName: "",
    playerId: "",
    level: 1,
    server: "",
    playStyle: "",
    activityTime: "",
    bio: "",
    tags: [],
    snsX: "",
    snsTiktok: "",
    snsYoutube: "",
    showSiteUrl: true,
    showSns: true,
    showDate: true,
    categoryIds: PROFILE_CARD_DEFAULT_CATEGORY_IDS.slice(),
    totalScope: "all", // "all" | "displayed"
    layout: "landscape", // "landscape" | "portrait"
    theme: "navy-gold",
    avatar: { offsetX: 0.5, offsetY: 0.5, zoom: 1 },
  };
}

function loadProfileCardState() {
  const base = profileCardDefaultState();
  try {
    const raw = localStorage.getItem(PROFILE_CARD_STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    return { ...base, ...saved, avatar: { ...base.avatar, ...(saved.avatar || {}) } };
  } catch (e) {
    console.warn("[profile-card] 保存済み設定の読み込みに失敗しました。初期値を使用します", e);
    return base;
  }
}

function saveProfileCardState(state) {
  try {
    localStorage.setItem(PROFILE_CARD_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn("[profile-card] 設定の保存に失敗しました", e);
    return false;
  }
}

function clearProfileCardState() {
  try {
    localStorage.removeItem(PROFILE_CARD_STORAGE_KEY);
  } catch (e) { /* no-op */ }
}

// ============================================================
// IndexedDB：アバター画像（Blob）の保存
// ============================================================
let profileCardDbPromise = null;

function openProfileCardDb() {
  if (profileCardDbPromise) return profileCardDbPromise;
  profileCardDbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("indexedDB unsupported"));
      return;
    }
    const req = indexedDB.open(PROFILE_CARD_DB_NAME, PROFILE_CARD_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROFILE_CARD_DB_STORE)) {
        db.createObjectStore(PROFILE_CARD_DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return profileCardDbPromise;
}

async function saveAvatarBlob(blob) {
  const db = await openProfileCardDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROFILE_CARD_DB_STORE, "readwrite");
    tx.objectStore(PROFILE_CARD_DB_STORE).put(blob, "current");
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function loadAvatarBlob() {
  const db = await openProfileCardDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROFILE_CARD_DB_STORE, "readonly");
    const req = tx.objectStore(PROFILE_CARD_DB_STORE).get("current");
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteAvatarBlob() {
  const db = await openProfileCardDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROFILE_CARD_DB_STORE, "readwrite");
    tx.objectStore(PROFILE_CARD_DB_STORE).delete("current");
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
