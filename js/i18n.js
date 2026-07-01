/**
 * i18n.js — はとぴ図鑑 多言語対応スクリプト
 * 対応言語: ja / en / zh-CN / zh-TW / ko / th
 */

const i18n = (() => {
  const SUPPORTED = ["ja", "en", "zh-CN", "zh-TW", "ko", "th"];
  const DEFAULT_LANG = "ja";
  const STORAGE_KEY = "lang";

  // GitHub Pages対応
  const BASE_URL = (() => {
    const scripts = document.getElementsByTagName("script");
    for (const s of scripts) {
      if (s.src && s.src.includes("i18n.js")) {
        return s.src.replace(/js\/i18n\.js.*$/, "");
      }
    }
    return "./";
  })();

  let _translations = {};
  let _lang = DEFAULT_LANG;

  // ▼追加
  let ready = false;
  let initialized = false;

  /** ブラウザ言語判定 */
  function detectBrowserLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;

    const nav = navigator.languages || [navigator.language];

    for (const l of nav) {
      const exact = SUPPORTED.find(
        s => s.toLowerCase() === l.toLowerCase()
      );
      if (exact) return exact;

      const prefix = SUPPORTED.find(
        s => s.toLowerCase().startsWith(l.slice(0,2).toLowerCase())
      );
      if (prefix) return prefix;
    }

    return DEFAULT_LANG;
  }

  /** 翻訳JSON読込 */
  async function loadTranslations(lang){
    try{
      const url = `${BASE_URL}locales/${lang}.json?v=1`;
      const res = await fetch(url);

      if(!res.ok) throw new Error(res.status);

      return await res.json();

    }catch(e){

      console.warn(`[i18n] Failed to load ${lang}`,e);

      if(lang!==DEFAULT_LANG){
        const res = await fetch(`${BASE_URL}locales/${DEFAULT_LANG}.json?v=1`);
        return await res.json();
      }

      return {};
    }
  }

  /** 翻訳取得 */
  function t(key, vars){

    let text = _translations[key] ?? key;

    if(vars){
      Object.entries(vars).forEach(([k,v])=>{
        text = text.replaceAll(`{${k}}`,v);
      });
    }

    return text;
  }

  /** DOM翻訳 */
  function applyTranslations(){

    document.querySelectorAll("[data-i18n]").forEach(el=>{

      const key = el.dataset.i18n;
      const text = t(key);

      if(el.tagName==="INPUT" || el.tagName==="TEXTAREA"){
        el.value = text;
      }else{
        el.textContent = text;
      }

    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    document.querySelectorAll("[data-i18n-title]").forEach(el=>{
      el.title = t(el.dataset.i18nTitle);
    });

    document.querySelectorAll("[data-i18n-content]").forEach(el=>{
      el.setAttribute("content", t(el.dataset.i18nContent));
    });

    document.documentElement.lang = _lang;
  }

  /** 言語セレクター */
  function buildSelector(){

    const old = document.getElementById("lang-selector");
    if(old) old.remove();

    const langs = [
      {code:"ja",label:"🇯🇵 日本語"},
      {code:"en",label:"🇺🇸 English"},
      {code:"zh-CN",label:"🇨🇳 中文(简)"},
      {code:"zh-TW",label:"🇹🇼 中文(繁)"},
      {code:"ko",label:"🇰🇷 한국어"},
      {code:"th",label:"🇹🇭 ภาษาไทย"}
    ];

    const wrap = document.createElement("div");
    wrap.id="lang-selector";

    const select = document.createElement("select");
    select.id="lang-select";

    langs.forEach(l=>{

      const opt = document.createElement("option");
      opt.value=l.code;
      opt.textContent=l.label;

      if(l.code===_lang){
        opt.selected=true;
      }

      select.appendChild(opt);

    });

    select.onchange = async ()=>{
      await switchLang(select.value);
    };

    wrap.appendChild(select);

    const titleButtons=document.querySelector(".title-buttons");
    const titleBar=document.querySelector(".title-bar");

    if(titleButtons){
      titleButtons.insertBefore(wrap,titleButtons.firstChild);
    }else if(titleBar){
      titleBar.appendChild(wrap);
    }else{
      document.body.insertBefore(wrap,document.body.firstChild);
    }

  }

  /** 言語切替 */
  async function switchLang(lang){

    if(!SUPPORTED.includes(lang)){
      lang = DEFAULT_LANG;
    }

    _lang = lang;

    localStorage.setItem(STORAGE_KEY,lang);

    ready = false;

    _translations = await loadTranslations(lang);

    ready = true;

    applyTranslations();

    const sel=document.getElementById("lang-select");
    if(sel) sel.value=lang;

    document.dispatchEvent(
      new CustomEvent("langchange",{detail:{lang}})
    );

  }

  /** 初期化 */
  async function init(){

    if(initialized) return;

    initialized = true;

    _lang = detectBrowserLang();

    ready = false;

    _translations = await loadTranslations(_lang);

    ready = true;

    buildSelector();

    applyTranslations();

    document.dispatchEvent(
      new CustomEvent("langchange",{detail:{lang:_lang}})
    );

  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init);
  }else{
    init();
  }

  return{
    t,
    init,
    switchLang,
    isReady:()=>ready,
    getCurrentLang:()=>_lang
  };

})();
