// js/shop.js
// トレンド商店ページのロジック（データは js/data-shop.js）

// ── ダークモード ──
const darkToggle = document.getElementById("darkToggle");
const savedDark = localStorage.getItem("darkMode");
if(savedDark === "true") document.body.classList.add("dark");
else if(savedDark === null && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.body.classList.add("dark");

darkToggle.onclick = ()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  updateDarkButton();
};

function updateDarkButton(){
  darkToggle.innerHTML =
    document.body.classList.contains("dark") ? icon("sun") : icon("moon");
}
updateDarkButton();

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

  SHOP_CATEGORIES.forEach(catDef => {
    const catItems = shopData.filter(i => i.category === catDef.category);
    if(catItems.length === 0) return;

    const catTitle = document.createElement("div");
    catTitle.className = "shop-category-title";
    catTitle.textContent = `【${T(catDef.labelKey, catDef.labelFallback)}】`;
    content.appendChild(catTitle);

    if(catDef.subcategories){
      catDef.subcategories.forEach(subDef => {
        const subItems = catItems.filter(i => i.subcategory === subDef.key);
        if(subItems.length === 0) return;

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
      const grid = document.createElement("div");
      grid.className = "shop-grid";
      catItems.forEach(item => grid.appendChild(createShopCard(item)));
      content.appendChild(grid);
    }
  });
}

// 言語切替時に再描画
document.addEventListener("langchange", render);

render();
