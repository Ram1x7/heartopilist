// js/update-popup.js
// サイト共通：新しいアップデート情報（js/data-updates.js の最新エントリ）を
// 未読の場合のみ、ページ読み込み時に一度だけポップアップで知らせる。
// 既読管理はlocalStorage（全ページ共通・端末単位）で行う。
// updates.html自身では表示しない（ページ本文に既に一覧が出ているため）。

(function () {
  var SEEN_KEY = "lastSeenUpdateId";

  function currentLang() {
    return (window.i18n && typeof window.i18n.getCurrentLang === "function")
      ? window.i18n.getCurrentLang()
      : "ja";
  }

  function displayField(obj, field) {
    var i18nField = obj[field + "I18n"];
    if (!i18nField) return obj[field];
    var lang = currentLang();
    return i18nField[lang] || obj[field];
  }

  // window.i18n.t(key, vars, fallback) がサイト共通のAPI（各ページの T()
  // ヘルパーはこれをラップしたページローカル関数のため、ここでは直接呼ぶ）
  function tr(key, fallback) {
    if (window.i18n && typeof window.i18n.isReady === "function" && window.i18n.isReady()) {
      return window.i18n.t(key, null, fallback);
    }
    return fallback;
  }

  function getSeenId() {
    try {
      var v = localStorage.getItem(SEEN_KEY);
      return v === null ? null : Number(v);
    } catch (e) {
      return null;
    }
  }

  function setSeenId(id) {
    try {
      localStorage.setItem(SEEN_KEY, String(id));
    } catch (e) {}
  }

  // 図鑑のチェック状態は、ユーザーが実際にアイテムをチェックした場合にのみ
  // 書き込まれる（main.js等がページ読み込み時に自動で書き込むweatherMode等の
  // 設定系キーとは違い、必ず能動的な操作の結果としてのみ存在する）。
  // そのため「既に何かチェックしたことがあるか」を、この機能が追加される前
  // からのユーザーかどうかの判定に使う。
  function hasEngagedBefore() {
    try {
      var raw = localStorage.getItem("checkedData");
      if (!raw) return false;
      var obj = JSON.parse(raw);
      return !!(obj && Object.keys(obj).length > 0);
    } catch (e) {
      return false;
    }
  }

  function showUpdatePopup() {
    if (typeof updatesData === "undefined" || !updatesData.length) return;

    var latest = updatesData[updatesData.length - 1];
    var seenId = getSeenId();

    if (seenId === null) {
      // 既読記録がまだない場合、図鑑のチェック実績もなければ本当の初回訪問と
      // みなし、ポップアップは出さず現時点を既読扱いにする（今までの更新を
      // 遡って全部見せてしまわないため）。
      // 一方、チェック実績が既にあれば、この機能自体が新規追加された既存
      // ユーザーなので、最新の更新を一度お知らせする。
      if (!hasEngagedBefore()) {
        setSeenId(latest.id);
        return;
      }
      seenId = 0;
    }
    if (seenId >= latest.id) return;

    var overlay = document.createElement("div");
    overlay.id = "updatePopupOverlay";
    overlay.className = "up-overlay";
    overlay.innerHTML =
      '<div class="up-box">' +
        '<div class="up-head">' +
          '<span class="up-icon">' + ((typeof icon === "function") ? icon("bell", { size: 18 }) : "🔔") + '</span>' +
          '<div class="up-head-text">' +
            '<div class="up-date">' + latest.date + '</div>' +
            '<div class="up-title">' + displayField(latest, "title") + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="up-body">' + displayField(latest, "body") + '</div>' +
        '<a class="up-link" href="updates.html">' +
          tr("update_popup_history_link", "アプデ履歴ページで過去の更新も見られます") +
        ' →</a>' +
        '<button class="ds-btn ds-btn-primary up-close-btn" id="updatePopupCloseBtn">' +
          tr("update_popup_close", "閉じる") +
        '</button>' +
      '</div>';

    document.body.appendChild(overlay);

    function close() {
      setSeenId(latest.id);
      overlay.remove();
    }

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    overlay.querySelector("#updatePopupCloseBtn").addEventListener("click", close);
  }

  // i18n.jsは非同期でロケールJSONを読み込むため、DOMContentLoaded直後は
  // まだ言語判定・翻訳が終わっていないことがある（その時点で組み立てると
  // 本来の言語より先にjaのフォールバック文言が一瞬見えてしまう）。
  // 準備が整うと必ず一度発火する"langchange"イベントを待ってから表示する。
  function init() {
    if (!window.i18n || typeof window.i18n.isReady !== "function") {
      showUpdatePopup();
      return;
    }
    if (window.i18n.isReady()) {
      showUpdatePopup();
    } else {
      document.addEventListener("langchange", showUpdatePopup, { once: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
