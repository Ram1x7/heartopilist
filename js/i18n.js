/**
 * i18n.js — はとぴ図鑑 多言語対応スクリプト
 * 対応言語: ja / en / zh-CN / zh-TW / ko / th
 *
 * 使い方:
 *   1. <html lang="ja"> に lang 属性を設定
 *   2. 翻訳したい要素に data-i18n="キー" を付与
 *      (placeholder の場合は data-i18n-placeholder="キー")
 *   3. このスクリプトを読み込む
 *   4. i18n.init() を呼ぶ（または DOMContentLoaded で自動実行）
 *
 * JS から翻訳文字列を取得する:
 *   i18n.t("キー")
 *   i18n.t("level_range_text", { min: 1, max: 13 })
 */

const i18n = (() => {
  const SUPPORTED = ["ja", "en", "zh-CN", "zh-TW", "ko", "th"];
  const DEFAULT_LANG = "ja";
  const STORAGE_KEY = "lang";

  // ベースURL（GitHub Pages 対応）
  const BASE_URL = (() => {
    const scripts = document.getElementsByTagName("script");
    for (let s of scripts) {
      if (s.src && s.src.includes("i18n.js")) {
        return s.src.replace(/js\/i18n\.js.*$/, "");
      }
    }
    return "./";
  })();

  let _translations = {};
  let _lang = DEFAULT_LANG;

  /** ブラウザ言語から最適なサポート言語を選ぶ */
  function detectBrowserLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;

    const nav = navigator.languages || [navigator.language];
    for (const l of nav) {
      const exact = SUPPORTED.find(s => s.toLowerCase() === l.toLowerCase());
      if (exact) return exact;
      const prefix = SUPPORTED.find(s => s.toLowerCase().startsWith(l.slice(0, 2).toLowerCase()));
      if (prefix) return prefix;
    }
    return DEFAULT_LANG;
  }

  /** 翻訳ファイルを fetch で読み込む */
  async function loadTranslations(lang) {
    try {
      const url = `${BASE_URL}locales/${lang}.json?v=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn(`[i18n] Failed to load ${lang}, falling back to ${DEFAULT_LANG}`, e);
      if (lang !== DEFAULT_LANG) {
        const res = await fetch(`${BASE_URL}locales/${DEFAULT_LANG}.json?v=1`);
        return await res.json();
      }
      return {};
    }
  }

  /**
   * 翻訳テキストを取得
   * @param {string} key
   * @param {Object} [vars] - {min:1, max:13} のような変数
   */
  function t(key, vars) {
    let text = _translations[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replaceAll(`{${k}}`, v);
      });
    }
    return text;
  }

  /** DOM を走査して data-i18n 属性を翻訳 */
  function applyTranslations() {
    // テキストコンテンツ
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      const text = t(key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.value = text;
      } else {
        el.textContent = text;
      }
    });

    // placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    // title 属性
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });

    // <html lang>
    document.documentElement.lang = _lang;
  }

  /** 言語セレクターを構築して挿入 */
  function buildSelector() {
    const existing = document.getElementById("lang-selector");
    if (existing) existing.remove();

    const langs = [
      { code: "ja",    label: "🇯🇵 日本語" },
      { code: "en",    label: "🇺🇸 English" },
      { code: "zh-CN", label: "🇨🇳 中文(简)" },
      { code: "zh-TW", label: "🇹🇼 中文(繁)" },
      { code: "ko",    label: "🇰🇷 한국어" },
      { code: "th",    label: "🇹🇭 ภาษาไทย" },
    ];

    const wrap = document.createElement("div");
    wrap.id = "lang-selector";
    wrap.setAttribute("aria-label", "Language selector");

    const select = document.createElement("select");
    select.id = "lang-select";
    select.setAttribute("aria-label", "Select language");

    langs.forEach(({ code, label }) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = label;
      if (code === _lang) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener("change", async () => {
      await switchLang(select.value);
    });

    wrap.appendChild(select);

    // title-bar の中に挿入（なければ body 先頭）
    const titleBar = document.querySelector(".title-bar");
    const titleButtons = document.querySelector(".title-buttons");
    if (titleButtons) {
      titleButtons.insertBefore(wrap, titleButtons.firstChild);
    } else if (titleBar) {
      titleBar.appendChild(wrap);
    } else {
      document.body.insertBefore(wrap, document.body.firstChild);
    }
  }

  /** 言語を切り替える */
  async function switchLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    _lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    _translations = await loadTranslations(lang);
    applyTranslations();

    // セレクターの選択状態を同期
    const sel = document.getElementById("lang-select");
    if (sel) sel.value = lang;

    // カスタムイベント発行（main.js 側でフックできる）
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  /** 初期化 */
  async function init() {
    _lang = detectBrowserLang();
    _translations = await loadTranslations(_lang);
    buildSelector();
    applyTranslations();
  }

  // DOMContentLoaded 後に自動初期化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { t, switchLang, init, getCurrentLang: () => _lang };
})();
