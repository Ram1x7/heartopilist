// js/shop.js
// トレンド商店ページのロジック（データは js/data-shop.js）

// ── ダークモード ──
const darkToggle = document.getElementById("darkToggle");
const savedDark = localStorage.getItem("darkMode");
if(savedDark === "true") document.body.classList.add("dark");
else if(savedDark === null && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.body.classList.add("dark");

// 初回表示時もSafari再描画対策を行う（ページ遷移直後に背景が反映されない不具合対策）
if(document.body.classList.contains("dark")) forceRepaint();

darkToggle.onclick = ()=>{
  document.body.classList.toggle("dark");
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
  // Safari/iPad再描画バグ対策
  document.body.style.display = "none";
  document.body.offsetHeight;
  document.body.style.display = "";
}

// ── 多言語表示ヘルパー ──
function currentLang(){
  return (window.i18n && typeof window.i18n.getCurrentLang === "function")
    ? window.i18n.getCurrentLang()
    : "ja";
}

function T(key, fallback, vars){
  if(window.i18n && typeof window.i18n.isReady === "function" && window.i18n.isReady()){
    return window.i18n.t(key, vars);
  }
  return fallback;
}

function displayName(item){
  if(!item.nameI18n) return item.name;
  const lang = currentLang();
  return item.nameI18n[lang] || item.name;
}

// ── 購入チェックデータ ──
let shopChecked = JSON.parse(localStorage.getItem("shopChecked") || "{}");

function saveShopChecked(){
  localStorage.setItem("shopChecked", JSON.stringify(shopChecked));
}

// ── 検索・並び替え ──
let shopSearchKeyword = "";
let shopSortMode = "book"; // "book" = 並び順 / "unchecked" = 未所持順

const shopSearchInput = document.getElementById("shopSearch");
const shopClearBtn = document.getElementById("shopClearBtn");
shopClearBtn.innerHTML = icon("close", {size:13});
const shopSearchIconEl = document.querySelector(".shop-controls .search-icon");
if(shopSearchIconEl) shopSearchIconEl.innerHTML = icon("search", {size:15});

shopSearchInput.addEventListener("input", ()=>{
  shopSearchKeyword = shopSearchInput.value.trim();
  shopClearBtn.style.display = shopSearchKeyword ? "flex" : "none";
  render();
});

shopClearBtn.onclick = ()=>{
  shopSearchInput.value = "";
  shopSearchKeyword = "";
  shopClearBtn.style.display = "none";
  render();
};

function setShopSort(mode){
  shopSortMode = mode;
  document.getElementById("shopSort_book").classList.toggle("active", mode === "book");
  document.getElementById("shopSort_unchecked").classList.toggle("active", mode === "unchecked");
  render();
}

function matchesShopSearch(item){
  if(!shopSearchKeyword) return true;
  const keyword = shopSearchKeyword.toLowerCase();
  return item.name.toLowerCase().includes(keyword)
    || displayName(item).toLowerCase().includes(keyword);
}

function sortShopItems(items){
  if(shopSortMode !== "unchecked") return items;
  // 未所持（未購入）を先に、購入済みを後ろに（同じ状態内は元の並び順を維持）
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aChecked = shopChecked[a.item.id] ? 1 : 0;
      const bChecked = shopChecked[b.item.id] ? 1 : 0;
      if(aChecked !== bChecked) return aChecked - bChecked;
      return a.index - b.index;
    })
    .map(x => x.item);
}

// ── シーズン判定（開催期間はJST固定） ──
function parseJstDateTimeStr(str){
  const [datePart, timePart] = str.split(" ");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - 9, mi));
}

function isSeasonEnded(season){
  return Date.now() > parseJstDateTimeStr(season.end).getTime();
}

// ── カテゴリ・サブカテゴリの表示順とラベル ──
const SHOP_CATEGORIES = [
  {
    category: "fashion",
    labelKey: "shop_category_fashion",
    labelFallback: "ファッション",
    subcategories: [
      { key: "hat",         labelKey: "shop_sub_hat",         labelFallback: "帽子系" },
      { key: "top",         labelKey: "shop_sub_top",         labelFallback: "トップス系" },
      { key: "bottom",      labelKey: "shop_sub_bottom",      labelFallback: "ボトムス系" },
      { key: "setup",       labelKey: "shop_sub_setup",       labelFallback: "セットアップ系" },
      { key: "shoes",       labelKey: "shop_sub_shoes",       labelFallback: "靴系" },
      { key: "accessory",   labelKey: "shop_sub_accessory",   labelFallback: "装飾系" },
      { key: "petCostume",  labelKey: "shop_sub_pet_costume", labelFallback: "ペット衣装系" },
    ],
  },
  { category: "furniture", labelKey: "shop_category_furniture", labelFallback: "家具", subcategories: null },
  { category: "other",     labelKey: "shop_category_other",     labelFallback: "その他", subcategories: null },
];

function createShopCard(item){
  const div = document.createElement("div");
  div.className = "item";

  const checked = !!shopChecked[item.id];
  const limitLabel = item.limit === null
    ? ""
    : `<span class="shop-item-limit">${T("shop_limit_label","上限{n}個").replace("{n}", item.limit)}</span>`;

  div.innerHTML = `
    <div class="img-wrap">
      <div class="level-badge">${item.price.toLocaleString()}</div>
      <button class="check-btn ${checked ? "checked" : ""}">
        ${icon(checked ? "check" : "checkSquare", {size:13})}
      </button>
      <img src="${item.img}" loading="lazy" decoding="async" alt="${displayName(item)}">
    </div>
    <div class="item-name shop-item-name">${displayName(item)}</div>
    <div class="shop-item-price">${icon("coin",{size:11})} ${item.price.toLocaleString()} ${T("shop_currency","トレンドコイン")}</div>
    ${limitLabel}
  `;

  const checkBtn = div.querySelector(".check-btn");
  checkBtn.onclick = (e)=>{
    e.stopPropagation();
    shopChecked[item.id] = !shopChecked[item.id];
    saveShopChecked();
    render();
  };

  return div;
}

function renderSeasonBanner(){
  const banner = document.getElementById("shopSeasonBanner");
  if(!banner || typeof shopSeasons === "undefined") return;

  // 現在このページで使っているシーズン（複数対応時は表示中データのseasonを見る）
  const seasonKey = shopData[0] ? shopData[0].season : null;
  const season = seasonKey ? shopSeasons[seasonKey] : null;
  if(!season){ banner.style.display = "none"; return; }

  const ended = isSeasonEnded(season);
  const label = (season.labelI18n && season.labelI18n[currentLang()]) || season.label;
  const [startDate] = season.start.split(" ");
  const [endDate] = season.end.split(" ");

  banner.classList.toggle("ended", ended);
  banner.innerHTML = ended
    ? `${icon("warning",{size:13})} ${label}${T("shop_season_ended_suffix"," は終了しています")}（${startDate}〜${endDate}）`
    : `${icon("pin",{size:13})} ${label}${T("shop_season_active_suffix"," 開催中")}（${startDate}〜${endDate}）`;
}

function renderProgress(){
  const total = shopData.length;
  const done = shopData.filter(item => shopChecked[item.id]).length;
  document.getElementById("shopProgressLabel").textContent = `${done} / ${total}`;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("shopProgressFill").style.width = pct + "%";
}

function render(){
  renderSeasonBanner();
  renderProgress();

  const content = document.getElementById("shopContent");
  content.innerHTML = "";

  const visibleData = shopData.filter(matchesShopSearch);
  let anyResult = false;

  SHOP_CATEGORIES.forEach(catDef => {
    const catItems = visibleData.filter(i => i.category === catDef.category);
    if(catItems.length === 0) return;

    const catTitle = document.createElement("div");
    catTitle.className = "shop-category-title";
    catTitle.textContent = `【${T(catDef.labelKey, catDef.labelFallback)}】`;
    content.appendChild(catTitle);

    if(catDef.subcategories){
      catDef.subcategories.forEach(subDef => {
        const subItems = sortShopItems(catItems.filter(i => i.subcategory === subDef.key));
        if(subItems.length === 0) return;
        anyResult = true;

        const subTitle = document.createElement("div");
        subTitle.className = "section-label";
        subTitle.textContent = T(subDef.labelKey, subDef.labelFallback);
        content.appendChild(subTitle);

        const grid = document.createElement("div");
        grid.className = "shop-grid";
        subItems.forEach(item => grid.appendChild(createShopCard(item)));
        content.appendChild(grid);
      });
    } else {
      anyResult = true;
      const grid = document.createElement("div");
      grid.className = "shop-grid";
      sortShopItems(catItems).forEach(item => grid.appendChild(createShopCard(item)));
      content.appendChild(grid);
    }
  });

  if(!anyResult){
    content.innerHTML = `<div class="daily-task-empty">${T("shop_no_results","該当するアイテムがありません")}</div>`;
  }
}

// 言語切替時に再描画
document.addEventListener("langchange", render);

render();
