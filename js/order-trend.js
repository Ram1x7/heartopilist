// js/order-trend.js
// オーダーチケット（商品注文）ページのロジック（データは js/data-order-trend.js）

// ── ダークモード ──
const darkToggle = document.getElementById("darkToggle");
const savedDark = localStorage.getItem("darkMode");
if(savedDark === "true") document.body.classList.add("dark");
else if(savedDark === null && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.body.classList.add("dark");

document.documentElement.classList.toggle("dark", document.body.classList.contains("dark"));

if(document.body.classList.contains("dark")) forceRepaint();

darkToggle.onclick = ()=>{
  document.body.classList.toggle("dark");
  document.documentElement.classList.toggle("dark", document.body.classList.contains("dark"));
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  updateDarkButton();
  forceRepaint();
};

function updateDarkButton(){
  darkToggle.innerHTML =
    document.body.classList.contains("dark") ? icon("sun") : icon("moon");
}
updateDarkButton();

function forceRepaint(){
  document.body.style.display = "none";
  document.body.offsetHeight;
  document.body.style.display = "";
}

document.getElementById("helpBtn").innerHTML = icon("help");

function openHelpModal(){
  document.getElementById("helpModal").style.display = "block";
}

function closeHelpModal(){
  document.getElementById("helpModal").style.display = "none";
}

// ── 検索 ──
let otSearchKeyword = "";
const otSearchInput = document.getElementById("otSearch");
const otClearBtn = document.getElementById("otClearBtn");
otClearBtn.innerHTML = icon("close", {size:13});
const otSearchIconEl = document.querySelector(".ot-controls .search-icon");
if(otSearchIconEl) otSearchIconEl.innerHTML = icon("search", {size:15});

otSearchInput.addEventListener("input", ()=>{
  otSearchKeyword = otSearchInput.value.trim();
  otClearBtn.style.display = otSearchKeyword ? "flex" : "none";
  renderOtContent();
});

otClearBtn.onclick = ()=>{
  otSearchInput.value = "";
  otSearchKeyword = "";
  otClearBtn.style.display = "none";
  renderOtContent();
};

// ── シーズン絞り込み ──
let otSeason = "all";
const otSeasonKeys = typeof orderTrendSeasons === "object"
  ? Object.keys(orderTrendSeasons).sort((a, b)=> (orderTrendSeasons[a].order||0) - (orderTrendSeasons[b].order||0))
  : [];

(function buildSeasonFilter(){
  const row = document.getElementById("otSeasonRow");
  if(!row) return;
  const allBtn = document.createElement("button");
  allBtn.id = "otSeason_all";
  allBtn.className = "active";
  allBtn.setAttribute("data-i18n", "order_trend_season_all");
  allBtn.textContent = "すべてのシーズン";
  allBtn.onclick = ()=> setOtSeason("all");
  row.appendChild(allBtn);

  otSeasonKeys.forEach((key)=>{
    const season = orderTrendSeasons[key];
    const btn = document.createElement("button");
    btn.id = "otSeason_" + key;
    btn.textContent = (season.labelI18n && season.labelI18n[typeof currentLang === "function" ? currentLang() : "ja"]) || season.label;
    btn.onclick = ()=> setOtSeason(key);
    row.appendChild(btn);
  });
  // 横スクロールのフェード＋矢印表示はjs/scroll-hint.js（.scroll-hint-wrap共通）が担当
})();

function setOtSeason(key){
  otSeason = key;
  ["all", ...otSeasonKeys].forEach((k)=>{
    const btn = document.getElementById("otSeason_" + k);
    if(btn) btn.classList.toggle("active", k === key);
  });
  renderOtContent();
}

// ── カテゴリ絞り込み ──
let otCategory = "all";
function setOtCategory(cat){
  otCategory = cat;
  ["all","furniture","clothing","other"].forEach((c)=>{
    const btn = document.getElementById("otCat_" + c);
    if(btn) btn.classList.toggle("active", c === cat);
  });
  renderOtContent();
}

function otMatchesFilters(item){
  if(otSeason !== "all" && item.season !== otSeason) return false;
  if(otCategory !== "all" && item.category !== otCategory) return false;
  if(otSearchKeyword){
    if(!item.name) return false;
    if(item.name.toLowerCase().indexOf(otSearchKeyword.toLowerCase()) === -1) return false;
  }
  return true;
}

function fmtOtPrice(item){
  const iconHTML = typeof currencyIcon === "function" ? currencyIcon(item.currency) : "";
  let html = `<span class="ot-item-price-icon">${iconHTML}</span>${item.price.toLocaleString()}`;
  if(item.originalPrice != null){
    html += ` <span class="ot-original">${item.originalPrice.toLocaleString()}</span>`;
  }
  if(item.discountPercent != null){
    html += ` <span class="ot-discount">${item.discountPercent}%OFF</span>`;
  }
  return html;
}

function otCardHTML(item){
  const nameHTML = item.name
    ? `<div class="ot-item-name">${item.name}</div>`
    : `<div class="ot-item-name unconfirmed">${item.note || "?"}</div>`;
  const subParts = [];
  if(item.size) subParts.push(`${item.size}`);
  if(item.stampsRequired != null){
    subParts.push(`${T("order_trend_stamps_label","必要チケット")}:${item.stampsRequired}`);
  }
  if(item.arrivalDays != null){
    subParts.push(`${T("order_trend_days_label","入荷まで")}:${item.arrivalDays}${T("order_trend_days_unit","日")}`);
  }
  return `
    <div class="ot-card">
      <img src="${item.img}" loading="lazy" alt="">
      ${nameHTML}
      <div class="ot-item-price">${fmtOtPrice(item)}</div>
      ${subParts.length ? `<div class="ot-item-sub">${subParts.join("　")}</div>` : ""}
    </div>
  `;
}

function renderOtContent(){
  const content = document.getElementById("otContent");
  const items = orderTrendData.filter(otMatchesFilters);

  if(items.length === 0){
    content.innerHTML = `<div class="ot-empty" data-i18n="order_trend_empty">該当するアイテムがありません</div>`;
    if(typeof applyI18n === "function") applyI18n();
    return;
  }

  const lang = typeof currentLang === "function" ? currentLang() : "ja";
  const bySeasonKey = new Map();
  const noSeasonItems = [];
  items.forEach((item)=>{
    if(!item.season){ noSeasonItems.push(item); return; }
    if(!bySeasonKey.has(item.season)) bySeasonKey.set(item.season, []);
    bySeasonKey.get(item.season).push(item);
  });

  const blocks = [];
  otSeasonKeys.forEach((key)=>{
    const seasonItems = bySeasonKey.get(key);
    if(!seasonItems || seasonItems.length === 0) return;
    const season = orderTrendSeasons[key];
    const label = (season.labelI18n && season.labelI18n[lang]) || season.label;
    blocks.push(`
      <div class="ot-season-block">
        <h2 class="ot-season-title">${label}</h2>
        <div class="ot-grid">${seasonItems.map(otCardHTML).join("")}</div>
      </div>
    `);
  });
  if(noSeasonItems.length){
    blocks.push(`<div class="ot-season-block"><div class="ot-grid">${noSeasonItems.map(otCardHTML).join("")}</div></div>`);
  }

  content.innerHTML = blocks.join("");
}

// i18n連携用ヘルパー（i18n未準備時は日本語フォールバックを返す）
function T(key, fallback, vars){
  if(window.i18n && typeof window.i18n.isReady === "function" && window.i18n.isReady()){
    return window.i18n.t(key, vars, fallback);
  }
  return fallback;
}

renderOtContent();
