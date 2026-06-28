const APP_VERSION = "2.3.2";

let currentFilter="all";
let currentSort = "book";
let weatherMode = "current";
let multiSelectMode = false;
let selectedItems = {};

let currentZone="";
let currentWeather="";

let minLevel = 1;
let maxLevel = 14;

let checkedData =
  JSON.parse(localStorage.getItem("checkedData") || "{}");
let authData =
  JSON.parse(localStorage.getItem("authData") || "{}");

// 天気データ
const weatherData = {
 "2026-06-30": {
   "6-12":"晴れ",
   "12-18":"晴れ",
   "18-0":"晴れ",
   "0-6":"晴れ"
 },
 "2026-07-01": {
   "6-12":"晴れ",
   "12-18":"晴れ",
   "18-0":"晴れ",
   "0-6":"晴れ"
 },
 "2026-06-29": {
   "6-12":"晴れ",
   "12-18":"晴れ",
   "18-0":"晴れ",
   "0-6":"晴れ"
 }
};

const ALL_WEATHER = ["晴れ","雨","虹"];
const ALL_TIME = ["6-12","12-18","18-0","0-6"];

const creatures = [
 ...fishData,
 ...bugData,
 ...birdData
];

function getZone(){
 const h=new Date().getHours();
 if(h>=6&&h<12)return"6-12";
 if(h>=12&&h<18)return"12-18";
 if(h>=18&&h<24)return"18-0";
 return"0-6";
}

// ======================================================
// i18n対応: 天気・時間のフォーマット関数
// ======================================================

/** 天気の内部値（日本語）→ i18n キーのマップ */
const WEATHER_KEY_MAP = {
  "晴れ": "weather_sunny",
  "雨":   "weather_rain",
  "虹":   "weather_rainbow",
  "流星雨": "weather_meteor",
  "不明": "weather_unknown"
};

/** 天気配列を翻訳して表示 */
function formatWeather(arr){
  if(arr.length === ALL_WEATHER.length) return i18n.t("modal_all_weather");
  return arr.map(w => i18n.t(WEATHER_KEY_MAP[w] || "weather_unknown")).join(" · ");
}

/** 時間帯配列を翻訳して表示 */
function formatTime(arr){
  const order = ["0-6","6-12","12-18","18-0"];
  if(arr.length === 4) return i18n.t("modal_all_time");

  const sorted = order.filter(t => arr.includes(t));
  let result = [];
  let start = null;
  let prev = null;

  for(let i=0;i<sorted.length;i++){
    const cur = sorted[i];
    if(start === null){ start=cur; prev=cur; continue; }
    const prevIndex = order.indexOf(prev);
    const curIndex  = order.indexOf(cur);
    if(curIndex === prevIndex + 1){
      prev = cur;
    } else {
      result.push(slotLabel(start, prev));
      start=cur; prev=cur;
    }
  }
  if(start) result.push(slotLabel(start, prev));
  return result.join(" / ");
}

/** 開始〜終了スロットをラベル化 */
function slotLabel(from, to){
  const s = from.split("-")[0];
  const e = to.split("-")[1];
  return `${s}:00〜${e}:00`;
}

/** 現在天気の翻訳表示 */
function weatherLabel(raw){
  return i18n.t(WEATHER_KEY_MAP[raw] || "weather_unknown");
}

// ======================================================
// 検索
// ======================================================
const searchInput = document.getElementById("search");
const miniSearch  = document.getElementById("miniSearch");
const clearBtn    = document.getElementById("clearBtn");

let searchTimer;

searchInput.addEventListener("input", ()=>{
  miniSearch.value = searchInput.value;
  clearBtn.style.display = searchInput.value ? "block" : "none";
  localStorage.setItem("searchKeyword", searchInput.value);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(()=>{ render(); }, 180);
});

miniSearch.addEventListener("input", ()=>{
  searchInput.value = miniSearch.value;
  clearBtn.style.display = miniSearch.value ? "block" : "none";
  localStorage.setItem("searchKeyword", miniSearch.value);
  render();
});

clearBtn.onclick = ()=>{
  searchInput.value = "";
  miniSearch.value  = "";
  localStorage.removeItem("searchKeyword");
  clearBtn.style.display = "none";
  render();
};

// ======================================================
// レンダリング
// ======================================================
function render(){
 if(!currentWeather || !currentZone) return;

 let list = creatures.filter(c => {
  const weatherForCheck = currentWeather === "流星雨" ? "晴れ" : currentWeather;
  const weatherMatch = c.weather.length === ALL_WEATHER.length || c.weather.includes(weatherForCheck);
  const timeMatch    = c.time.length === ALL_TIME.length || c.time.includes(currentZone);
  const isNow        = weatherMatch && timeMatch;

  if (weatherMode === "current") return isNow;

  if (weatherMode === "only") {
    if (c.weather.length === ALL_WEATHER.length) return false;
    if (weatherForCheck === "晴れ") {
      return (c.weather.length === 2 && c.weather.includes("晴れ") && c.weather.includes("虹") && timeMatch);
    }
    if (weatherForCheck === "雨") {
      return (c.weather.length === 2 && c.weather.includes("雨") && c.weather.includes("虹") && timeMatch);
    }
    if (weatherForCheck === "虹") {
      return (c.weather.length === 1 && c.weather.includes("虹") && timeMatch);
    }
    return false;
  }

  if (weatherMode === "hidden") return !isNow;
  return false;
 });

 if(currentFilter !== "all"){
   list = list.filter(c => c.type === currentFilter);
 }

 const keyword = document.getElementById("search").value;
 if(keyword){
  list = list.filter(c =>
    c.name.includes(keyword) ||
    c.location.includes(keyword)
  );
 }

 list = list.filter(c => c.level >= minLevel && c.level <= maxLevel);

 if(currentSort === "level"){
  list.sort((a,b)=>{
    const typeOrder = { fish:0, bug:1, bird:2 };
    if(typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
    return a.level - b.level;
  });
 }

 if(currentSort === "unchecked"){
  list.sort((a,b)=>{
    const aChecked = checkedData[a.name] ? 1 : 0;
    const bChecked = checkedData[b.name] ? 1 : 0;
    if(aChecked !== bChecked) return aChecked - bChecked;
    const typeOrder = { fish:0, bug:1, bird:2 };
    if(typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
    return a.bookIndex - b.bookIndex;
  });
 }

 if(currentSort === "unauth"){
  list = list.map((c, i) => ({ c, i })).sort((a, b) => {
    const aE = a.c.auth !== false ? 0 : 1;
    const bE = b.c.auth !== false ? 0 : 1;
    if(aE !== bE) return aE - bE;
    const aA = authData[a.c.name] ? 1 : 0;
    const bA = authData[b.c.name] ? 1 : 0;
    if(aA !== bA) return aA - bA;
    const typeOrder = { fish:0, bug:1, bird:2 };
    if(typeOrder[a.c.type] !== typeOrder[b.c.type]) return typeOrder[a.c.type] - typeOrder[b.c.type];
    return a.i - b.i;
  }).map(x => x.c);
 }

 const el = document.getElementById("list");
 el.innerHTML = "";

 if(list.length === 0){
  el.innerHTML = `<p>${i18n.t("no_results")}</p>`;
  return;
 }

 list.forEach(c=>{
  const div = document.createElement("div");
  div.className = "item" + (selectedItems[c.name] ? " selected" : "");

  div.innerHTML=`
  <div class="img-wrap">
  <div class="level-badge">Lv.${c.level ?? "-"}</div>
  ${c.shadow ? `
  <div class="shadow-badge ${c.shadow==="金"?"shadow-gold":""} ${c.shadow==="青"?"shadow-blue":""}">
    ${c.shadow}
  </div>` : ""}
  <button class="check-btn ${checkedData[c.name]?"checked":""}">
    ${checkedData[c.name]?"⭐️":""}
  </button>
  ${c.auth !== false ? `
  <button class="auth-btn ${authData[c.name]?"checked":""}">
    ${authData[c.name]?"🎖":""}
  </button>` : ""}
  <img src="${c.img}" loading="lazy" decoding="async">
  </div>
  <div class="item-name">${c.name}</div>`;

  div.onclick = ()=>{
    if(multiSelectMode){
      selectedItems[c.name] = !selectedItems[c.name];
      div.classList.toggle("selected", selectedItems[c.name]);
      return;
    }
    openModal(c);
  };

  const checkBtn = div.querySelector(".check-btn");
  checkBtn.onclick = (e)=>{
    e.stopPropagation();
    if(multiSelectMode) return;
    checkedData[c.name] = !checkedData[c.name];
    localStorage.setItem("checkedData", JSON.stringify(checkedData));
    render();
  };

  const authBtn = div.querySelector(".auth-btn");
  if(authBtn){
    authBtn.onclick = (e)=>{
      e.stopPropagation();
      if(multiSelectMode) return;
      authData[c.name] = !authData[c.name];
      localStorage.setItem("authData", JSON.stringify(authData));
      render();
    };
  }

  el.appendChild(div);
 });
}

// ======================================================
// 時間更新
// ======================================================
function updateTime(){
 if (!i18n.isReady()) return;
  
 const now = new Date();
 const zone = getZone();
 const todayKey    = getDateKey(0);
 const tomorrowKey = getDateKey(1);
 const todayWeather = weatherData[todayKey] || {};
 const weather = todayWeather[zone] || "不明";
 const changed = (zone !== currentZone) || (weather !== currentWeather);

 currentZone    = zone;
 currentWeather = weather;

 const zones = ["6-12","12-18","18-0","0-6"];
 const nextIndex = (zones.indexOf(zone)+1) % 4;
 const nextZone  = zones[nextIndex];
 let nextWeather;
 if(nextZone === "0-6"){
   const tomorrowWeather = weatherData[tomorrowKey] || {};
   nextWeather = tomorrowWeather[nextZone] || "不明";
 } else {
   nextWeather = todayWeather[nextZone] || "不明";
 }

 document.getElementById("time").innerText = now.toLocaleTimeString();

 // 翻訳された天気名で表示
 document.getElementById("weatherNow").innerText =
   i18n.t("weather_now_label") + weatherLabel(weather);
 document.getElementById("weatherNext").innerText =
   i18n.t("weather_next_label") + weatherLabel(nextWeather);
 document.getElementById("miniTime").innerText =
   now.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
 document.getElementById("miniWeather").innerText = weatherLabel(weather);

 if(changed) render();
}

function getDateKey(offset=0){
  const d = new Date();
  d.setHours(d.getHours() + 9);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0,10);
}

// ======================================================
// モード・フィルター・ソート
// ======================================================
function setWeatherMode(mode){
  weatherMode = mode;
  localStorage.setItem("weatherMode", mode);
  ["current","only","hidden"].forEach(x=>{
    document.getElementById("w_"+x).classList.remove("active");
  });
  document.getElementById("w_"+mode).classList.add("active");
  render();
}

function setFilter(t){
 currentFilter = t;
 localStorage.setItem("currentFilter", t);
 ["all","fish","bug","bird"].forEach(x=>{
  document.getElementById("f_"+x).classList.remove("active");
 });
 document.getElementById("f_"+t).classList.add("active");
 render();
}

function setSort(type){
  currentSort = type;
  localStorage.setItem("currentSort", type);
  ["book","level","unchecked","unauth"].forEach(x=>{
    document.getElementById("s_"+x).classList.remove("active");
  });
  document.getElementById("s_"+type).classList.add("active");
  render();
}

// ======================================================
// ダークモード
// ======================================================
const darkToggle = document.getElementById("darkToggle");
const savedDark = localStorage.getItem("darkMode");
if(savedDark === "true"){
  document.body.classList.add("dark");
} else if(savedDark === null){
  if(window.matchMedia("(prefers-color-scheme: dark)").matches){
    document.body.classList.add("dark");
  }
}

darkToggle.onclick = ()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  updateDarkButton();
  forceRepaint();
};

function updateDarkButton(){
  darkToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}

function forceRepaint(){
  document.body.style.display = "none";
  document.body.offsetHeight;
  document.body.style.display = "";
}

// ======================================================
// モーダル
// ======================================================
function openModal(c){
 modal.style.display="block";
 m_name.innerText  = c.name;
 m_img.src         = c.img;
 m_loc.innerText   = c.location;
 m_weather.innerText = i18n.t("modal_weather") + formatWeather(c.weather);
 m_time.innerText    = i18n.t("modal_time") + formatTime(c.time);

 const basePrice = c.price ?? 0;

 if(c.type === "bird"){
  function birdStar2(base){
    const value = base * 4;
    if(value <= 16) return value;
    return Math.ceil(value / 10) * 10;
  }
  const star2 = birdStar2(basePrice);
  m_price1.innerText = `★1｜${basePrice || "-"}`;
  m_price2.innerText = `★2｜${basePrice ? star2 : "-"}`;
  m_price3.innerText = `★3｜${basePrice ? star2*2 : "-"}`;
  m_price4.innerText = `★4｜${basePrice ? star2*4 : "-"}`;
  m_price5.innerText = `★5｜${basePrice ? star2*8 : "-"}`;
 } else {
  m_price1.innerText = `★1｜${basePrice || "-"}`;
  m_price2.innerText = `★2｜${basePrice ? Math.floor(basePrice*1.5) : "-"}`;
  m_price3.innerText = `★3｜${basePrice ? Math.floor(basePrice*2)   : "-"}`;
  m_price4.innerText = `★4｜${basePrice ? Math.floor(basePrice*4)   : "-"}`;
  m_price5.innerText = `★5｜${basePrice ? Math.floor(basePrice*8)   : "-"}`;
 }

 m_star5.innerHTML = c.star5
  ? `${i18n.t("modal_star5_label")}<br>${c.star5}`
  : "";
}

function closeModal(){
 modal.style.display="none";
}

// ======================================================
// 複数選択
// ======================================================
function toggleMultiSelect(){
  multiSelectMode = !multiSelectMode;
  document.getElementById("multiBtn").classList.toggle("active", multiSelectMode);
  document.getElementById("bulkCheckBtn").style.display   = multiSelectMode ? "block" : "none";
  document.getElementById("bulkUncheckBtn").style.display = multiSelectMode ? "block" : "none";
  document.getElementById("authBulkRow").style.display    = multiSelectMode ? "flex"  : "none";
  if(!multiSelectMode) selectedItems = {};
  render();
}

function bulkCheck(){
  Object.keys(selectedItems).forEach(name=>{
    if(selectedItems[name]) checkedData[name] = true;
  });
  localStorage.setItem("checkedData", JSON.stringify(checkedData));
  selectedItems = {};
  render();
}

function bulkUncheck(){
  Object.keys(selectedItems).forEach(name=>{
    if(selectedItems[name]) checkedData[name] = false;
  });
  localStorage.setItem("checkedData", JSON.stringify(checkedData));
  selectedItems = {};
  render();
}

function bulkAuthCheck(){
  Object.keys(selectedItems).forEach(name=>{
    if(selectedItems[name]){
      const c = creatures.find(c => c.name === name);
      if(c && c.auth !== false) authData[name] = true;
    }
  });
  localStorage.setItem("authData", JSON.stringify(authData));
  selectedItems = {};
  render();
}

function bulkAuthUncheck(){
  Object.keys(selectedItems).forEach(name=>{
    if(selectedItems[name]){
      const c = creatures.find(c => c.name === name);
      if(c && c.auth !== false) authData[name] = false;
    }
  });
  localStorage.setItem("authData", JSON.stringify(authData));
  selectedItems = {};
  render();
}

// ======================================================
// シェア
// ======================================================
const shareBtn    = document.getElementById("shareBtn");
const shareModal  = document.getElementById("shareModal");
const shareCanvas = document.getElementById("shareCanvas");

shareBtn.onclick = ()=>{
  drawShareCard();
  shareModal.style.display = "block";
};

function closeShareModal(){
  shareModal.style.display = "none";
}

shareModal.onclick = (e)=>{
  if(e.target === shareModal) closeShareModal();
};

function getStats(){
  const total = creatures.length;
  const done  = creatures.filter(c=>checkedData[c.name]).length;
  const byType      = {fish:0,bug:0,bird:0};
  const totalByType = {fish:0,bug:0,bird:0};
  creatures.forEach(c=>{
    totalByType[c.type]++;
    if(checkedData[c.name]) byType[c.type]++;
  });
  const authEligible = creatures.filter(c => c.auth !== false);
  const authCount    = authEligible.filter(c => authData[c.name]).length;
  const authTotal    = authEligible.length;
  return {total, done, byType, totalByType, authCount, authTotal};
}

function drawShareCard(){
  const stats = getStats();
  const ctx   = shareCanvas.getContext("2d");
  const w = shareCanvas.width;
  const h = shareCanvas.height;

  const grad = ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,"#f7f2e7");
  grad.addColorStop(1,"#ece2cf");
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,w,h);

  ctx.textAlign = "center";
  ctx.fillStyle = "#3c5a6e";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(i18n.t("share_card_title"), w/2, 80);

  const percent = Math.floor(stats.done/stats.total*100);
  ctx.font = "bold 70px sans-serif";
  ctx.fillStyle = "#b1503b";
  ctx.fillText(`${percent}%`, w/2, 200);

  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#34302b";
  ctx.fillText(`${i18n.t("share_card_complete")} ${stats.done} / ${stats.total}`, w/2, 250);

  const types = [
    {key:"fish", label: i18n.t("share_card_fish")},
    {key:"bug",  label: i18n.t("share_card_bug")},
    {key:"bird", label: i18n.t("share_card_bird")}
  ];
  ctx.textAlign = "left";
  types.forEach((t,i)=>{
    ctx.fillText(`${t.label}：${stats.byType[t.key]} / ${stats.totalByType[t.key]}`, 80, 320 + i*40);
  });

  ctx.textAlign = "center";
  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = "#c8a86b";
  ctx.fillText(
    `${i18n.t("share_card_auth")}：${stats.authCount} / ${stats.authTotal} ${i18n.t("share_card_auth_unit")}`,
    w/2, 480
  );

  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#7a7164";
  ctx.fillText(new Date().toLocaleDateString(), w/2, h-40);
}

async function shareImage(){
  shareCanvas.toBlob(async (blob)=>{
    const file = new File([blob], "hatopi-comp.png", {type:"image/png"});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      try {
        await navigator.share({
          files:[file],
          title: i18n.t("share_card_title"),
          text:  i18n.t("share_card_title")
        });
      } catch(e) {}
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "hatopi-comp.png"; a.click();
    }
  });
}

function shareToX(){
  const stats = getStats();
  const percent = Math.floor(stats.done/stats.total*100);
  const text = encodeURIComponent(
    i18n.t("share_tweet_text", { percent, authCount: stats.authCount })
  );
  window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
}

// ======================================================
// レベルレンジ
// ======================================================
const levelMin      = document.getElementById("levelMin");
const levelMax      = document.getElementById("levelMax");
const levelRangeText = document.getElementById("levelRangeText");

function updateLevelRange(){
  minLevel = Number(levelMin.value);
  maxLevel = Number(levelMax.value);
  if(minLevel > maxLevel) [minLevel,maxLevel] = [maxLevel,minLevel];
  levelRangeText.textContent = i18n.t("level_range_text", { min: minLevel, max: maxLevel });
  localStorage.setItem("minLevel", minLevel);
  localStorage.setItem("maxLevel", maxLevel);
  render();
}

levelMin.addEventListener("input", updateLevelRange);
levelMax.addEventListener("input", updateLevelRange);

// ======================================================
// アップデートポップアップ
// ======================================================
const popupVersion = "2.3.2";
if(localStorage.getItem("popupVersion") !== popupVersion){
  document.getElementById("updatePopup").style.display = "block";
}

function closeUpdatePopup(){
  localStorage.setItem("popupVersion", popupVersion);
  document.getElementById("updatePopup").style.display = "none";
}

// ======================================================
// 最小化
// ======================================================
const topPanel    = document.getElementById("topPanel");
const minimizeBtn = document.getElementById("minimizeBtn");

if(localStorage.getItem("topMinimized") === "true"){
  topPanel.classList.add("minimized");
  minimizeBtn.textContent = "＋";
}

minimizeBtn.onclick = ()=>{
  topPanel.classList.toggle("minimized");
  const minimized = topPanel.classList.contains("minimized");
  minimizeBtn.textContent = minimized ? "＋" : "－";
  localStorage.setItem("topMinimized", minimized);
};

// ======================================================
// ヘルプモーダル
// ======================================================
const helpBtn   = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
helpBtn.onclick = ()=>{ helpModal.style.display = "block"; };

function closeHelpModal(){
  helpModal.style.display = "none";
}

helpModal.onclick = (e)=>{
  if(e.target === helpModal) closeHelpModal();
};

// ======================================================
// 言語切り替え時に動的テキストを再描画
// ======================================================
document.addEventListener("langchange", ()=>{
  // 天気表示を再描画
  updateTime();
  // レベル範囲テキスト再描画
  levelRangeText.textContent = i18n.t("level_range_text", { min: minLevel, max: maxLevel });
  // リスト再描画（no_results テキストなど）
  render();
  // フッターの disclaimer と lastUpdate（i18n.t を使わない固定テキストはそのまま）
});

// ======================================================
// 初期化
// ======================================================
updateTime();
searchInput.value = localStorage.getItem("searchKeyword") || "";
clearBtn.style.display = searchInput.value ? "block" : "none";
levelMin.value = localStorage.getItem("minLevel") || 1;
levelMax.value = localStorage.getItem("maxLevel") || 14;
updateLevelRange();
setFilter(localStorage.getItem("currentFilter") || "all");
setSort(localStorage.getItem("currentSort") || "book");
setWeatherMode(localStorage.getItem("weatherMode") || "current");
setInterval(updateTime, 1000);

document.getElementById("version").textContent = "Ver " + APP_VERSION;
document.getElementById("disclaimer").textContent = i18n.t("disclaimer");
document.getElementById("lastUpdate").textContent = i18n.t("last_update_label") + " 2026/06/29";
