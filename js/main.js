const APP_VERSION = "2.4.1";

// ── サーバー設定 ──
// weatherData や生き物の出現時間帯（time配列）は Asia(UTC+9) 基準で入力されている。
// 選択中サーバーのオフセットに応じて「今が何時・何ゾーンか」を計算し直すことで、
// 天気判定・出現判定・時計表示すべてを選択サーバーに合わせる。
const SERVERS = {
  asia:     { label:"Asia",     short:"JP",  offset: 9  },
  tw_hk_mo: { label:"TW/HK/MO", short:"TW",  offset: 8  },
  sea:      { label:"SEA",      short:"SEA", offset: 7  },
  global:   { label:"Global",   short:"EU",  offset: 1  },
  america:  { label:"America",  short:"US",  offset: -5 },
};
let currentServer = localStorage.getItem("gameServer") || "asia";
if(!SERVERS[currentServer]) currentServer = "asia";

let currentFilter="all";
let currentSort = "book";
let weatherMode = "current"; 
// "current" = 今の天気で出るやつ全部
// "only" = 今の天気でしか出ないやつ
let multiSelectMode = false;
let selectedItems = {};

let currentZone="";
let currentWeather="";

let minLevel = 1;
let maxLevel = 14;
  // チェック保存
let checkedData =
  JSON.parse(localStorage.getItem("checkedData") || "{}");
// 認証マスター記録
let authData =
  JSON.parse(localStorage.getItem("authData") || "{}");

// 天気(毎日入力する) 
const weatherData = {
 "2026-07-21": {
   "6-12":"晴れ",
   "12-18":"晴れ",
   "18-0":"晴れ",
   "0-6":"雨"
 },
  "2026-07-22": {
   "6-12":"晴れ",
   "12-18":"晴れ",
   "18-0":"晴れ",
   "0-6":"晴れ"
 },
   "2026-07-23": {
   "6-12":"晴れ",
   "12-18":"晴れ",
   "18-0":"晴れ",
   "0-6":"晴れ"
 }
};

const ALL_WEATHER = ["晴れ","雨","虹"];
const ALL_TIME = ["6-12","12-18","18-0","0-6"];

// 最後にまとめる（超重要）
const creatures = [
 ...fishData,
 ...bugData,
 ...birdData
];

// サーバーのUTCオフセット（時間）
function getServerOffset(){
  return (SERVERS[currentServer] || SERVERS.asia).offset;
}

// 実際のUTC時刻（ブラウザのタイムゾーンに依存しない）に、
// 選択中サーバーのオフセットを足した「サーバー上の今」を返す。
// ※ これは【表示専用】（時計の表示・生き物の出現時間帯の表示ラベル用）。
//   天気判定・出現判定は下のgetZone/getDateKeyの通り常にJST(UTC+9)固定。
// ※ 以降は必ず getUTCHours() / getUTCDate() など UTC系メソッドで読むこと。
//   （getHours()等で読むとブラウザのタイムゾーンが二重に適用されてしまう）
function getServerDate(){
  return new Date(Date.now() + getServerOffset() * 3600 * 1000);
}

// 実際のJST(UTC+9)の「今」を返す（天気データ・出現判定はこれが基準＝サーバー選択の影響を受けない）
function getJstDate(){
  return new Date(Date.now() + 9 * 3600 * 1000);
}

// 時間帯取得（天気判定・出現判定用／常にJST固定）
function getZone(){
 const h = getJstDate().getUTCHours();
 if(h>=6&&h<12)return"6-12";
 if(h>=12&&h<18)return"12-18";
 if(h>=18&&h<24)return"18-0";
 return"0-6";
}

// i18n連携用ヘルパー（i18n未準備時は日本語フォールバックを返す）
function T(key, fallback, vars){
  if(window.i18n && typeof window.i18n.isReady === "function" && window.i18n.isReady()){
    return window.i18n.t(key, vars);
  }
  return fallback;
}

// 生き物名・場所名の表示用翻訳（未整備の言語は日本語にフォールバック）
function currentLang(){
  return (window.i18n && typeof window.i18n.getCurrentLang === "function")
    ? window.i18n.getCurrentLang()
    : "ja";
}

function displayName(c){
  if(!c.nameI18n) return c.name;
  const lang = currentLang();
  return c.nameI18n[lang] || c.name;
}

function displayLocation(c){
  if(!c.locationI18n) return c.location;
  const lang = currentLang();
  return c.locationI18n[lang] || c.location;
}

// フォーマット
function formatTime(arr){

  const order = ["0-6","6-12","12-18","18-0"];

  // 全部ある場合
  if(arr.length === 4) return T("time_all","全時間");

  // 並び順に揃える
  const sorted = order.filter(t => arr.includes(t));

  // 連続をまとめる
  let result = [];
  let start = null;
  let prev = null;

  const convert = (t) => {
    if(t === "0-6") return 0;
    if(t === "6-12") return 6;
    if(t === "12-18") return 12;
    if(t === "18-0") return 18;
  };

  for(let i=0;i<sorted.length;i++){
    const cur = sorted[i];

    if(start === null){
      start = cur;
      prev = cur;
      continue;
    }

    // 連続しているかチェック
    const prevIndex = order.indexOf(prev);
    const curIndex = order.indexOf(cur);

    if(curIndex === prevIndex + 1){
      prev = cur;
    } else {
      result.push(`${start.replace("-", "〜").split("〜")[0]}〜${prev.replace("-", "〜").split("〜")[1]}`);
      start = cur;
      prev = cur;
    }
  }

  if(start){
    result.push(`${start.replace("-", "〜").split("〜")[0]}〜${prev.replace("-", "〜").split("〜")[1]}`);
  }

  return result.join("/");
}

// 生き物の出現時間帯（JST基準のゾーン配列）を、選択中サーバーの現地時間に変換する
function shiftedHourRanges(arr){
  const zoneHours = { "0-6":[0,6], "6-12":[6,12], "12-18":[12,18], "18-0":[18,24] };
  const delta = getServerOffset() - 9; // Asiaとの差分（時間）

  const covered = new Array(24).fill(false);
  arr.forEach(z => {
    const range = zoneHours[z];
    if(!range) return;
    const [s,e] = range;
    for(let h=s; h<e; h++){
      const shifted = ((h + delta) % 24 + 24) % 24;
      covered[shifted] = true;
    }
  });

  if(covered.every(v => v)) return [[0,24]];
  if(covered.every(v => !v)) return [];

  const ranges = [];
  let start = null;
  for(let h=0; h<24; h++){
    if(covered[h] && start === null) start = h;
    if(!covered[h] && start !== null){ ranges.push([start,h]); start = null; }
  }
  if(start !== null) ranges.push([start,24]);

  // 深夜0時をまたいで連続している場合（末尾と先頭がどちらも埋まっている）は1つに繋げる
  if(ranges.length > 1 && ranges[0][0] === 0 && ranges[ranges.length-1][1] === 24){
    const first = ranges.shift();
    const last = ranges[ranges.length-1];
    last[1] = 24 + first[1];
  }

  return ranges;
}

// 出現時間帯を選択中サーバーの現地時間表記にして返す（Asia選択時はformatTimeと同じ表記）
function formatTimeForServer(arr){
  if(arr.length === 4) return T("time_all","全時間");

  const delta = getServerOffset() - 9;
  if(delta === 0) return formatTime(arr);

  const ranges = shiftedHourRanges(arr);
  if(ranges.length === 0) return "";

  return ranges
    .map(([s,e]) => `${s % 24}〜${e % 24}`)
    .join("/");
}

function formatWeather(arr){
 const all=["晴れ","雨","虹"];
 if(arr.length===all.length)return T("weather_all","全天気");
 const map = { "晴れ":"weather_sunny", "雨":"weather_rain", "虹":"weather_rainbow" };
 return arr.map(w => T(map[w], w)).join("・");
}

// 単一の天気ワード（晴れ/雨/虹/流星雨/不明）をi18n翻訳
function translateWeatherWord(w){
 const map = {
   "晴れ":"weather_sunny",
   "雨":"weather_rain",
   "虹":"weather_rainbow",
   "流星雨":"weather_meteor",
   "不明":"weather_unknown"
 };
 return map[w] ? T(map[w], w) : w;
}

const searchInput = document.getElementById("search");
const miniSearch = document.getElementById("miniSearch");
const clearBtn = document.getElementById("clearBtn");

// 入力時
let searchTimer;

// 通常検索バー
searchInput.addEventListener("input", ()=>{

  miniSearch.value = searchInput.value;

  clearBtn.style.display =
    searchInput.value ? "block" : "none";

  localStorage.setItem(
    "searchKeyword",
    searchInput.value
  );

  clearTimeout(searchTimer);

  searchTimer = setTimeout(()=>{
    render();
  },180);

});

// 最小化検索バー
miniSearch.addEventListener("input", ()=>{

  searchInput.value = miniSearch.value;

  clearBtn.style.display =
    miniSearch.value ? "block" : "none";

  localStorage.setItem(
    "searchKeyword",
    miniSearch.value
  );

  render();

});

// ×ボタン
clearBtn.onclick = ()=>{
  searchInput.value = "";
  localStorage.removeItem("searchKeyword");
  clearBtn.style.display = "none";
  render();
};

// 共通フィルター（タイプ・検索キーワード・レベル範囲）
function applyCommonFilters(arr){
  let out = arr;

  if(currentFilter !== "all"){
    out = out.filter(c => c.type === currentFilter);
  }

  const keyword = document.getElementById("search").value;
  if(keyword){
    const kw = keyword.toLowerCase();
    out = out.filter(c =>
      c.name.toLowerCase().includes(kw) ||
      c.location.toLowerCase().includes(kw) ||
      displayName(c).toLowerCase().includes(kw) ||
      displayLocation(c).toLowerCase().includes(kw)
    );
  }

  out = out.filter(c =>
    c.level >= minLevel &&
    c.level <= maxLevel
  );

  return out;
}

// 並び替え
function sortList(arr){
  let out = arr.slice();

  if(currentSort === "level"){
    out.sort((a,b)=>{
      const typeOrder = { fish:0, bug:1, bird:2 };

      if(typeOrder[a.type] !== typeOrder[b.type]){
        return typeOrder[a.type] - typeOrder[b.type];
      }

      return a.level - b.level;
    });
  }

  if(currentSort === "unchecked"){
    out.sort((a,b)=>{
      const aChecked = checkedData[a.name] ? 1 : 0;
      const bChecked = checkedData[b.name] ? 1 : 0;

      // まず未コンプ優先
      if(aChecked !== bChecked){
        return aChecked - bChecked;
      }

      const typeOrder = { fish:0, bug:1, bird:2 };

      // 次に種類順
      if(typeOrder[a.type] !== typeOrder[b.type]){
        return typeOrder[a.type] - typeOrder[b.type];
      }

      // 最後に図鑑順
      return a.bookIndex - b.bookIndex;
    });
  }

  if(currentSort === "unauth"){
    out = out
      .map((c, i) => ({ c, i }))
      .sort((a, b) => {

        // 認証マスターの仕様が無い生き物は後ろへ
        const aEligible = a.c.auth !== false ? 0 : 1;
        const bEligible = b.c.auth !== false ? 0 : 1;
        if(aEligible !== bEligible){
          return aEligible - bEligible;
        }

        // 未認証優先
        const aAuth = authData[a.c.name] ? 1 : 0;
        const bAuth = authData[b.c.name] ? 1 : 0;
        if(aAuth !== bAuth){
          return aAuth - bAuth;
        }

        const typeOrder = { fish:0, bug:1, bird:2 };
        if(typeOrder[a.c.type] !== typeOrder[b.c.type]){
          return typeOrder[a.c.type] - typeOrder[b.c.type];
        }

        // 元の表示順を保持
        return a.i - b.i;
      })
      .map(x => x.c);
  }

  return out;
}

// カード生成
function createCard(c){
  const div=document.createElement("div");
  div.className =
  "item" +
  (selectedItems[c.name]
    ? " selected"
    : "");

  div.innerHTML=`

  <div class="img-wrap">

  <div class="level-badge">
    Lv.${c.level ?? "-"}
  </div>

 ${c.shadow ? `
  <div class="
    shadow-badge
    ${c.shadow === "金" ? "shadow-gold" : ""}
    ${c.shadow === "青" ? "shadow-blue" : ""}
  ">
    ${c.shadow}
  </div>
` : ""}

  <button class="
    check-btn
    ${checkedData[c.name] ? "checked" : ""}
  ">
    ${checkedData[c.name] ? "⭐️" : ""}
  </button>

  ${c.auth !== false ? `
  <button class="
    auth-btn
    ${authData[c.name] ? "checked" : ""}
  ">
    ${authData[c.name] ? "🎖" : ""}
  </button>
` : ""}

  <img src="${c.img}" loading="lazy" decoding="async">

</div>

  <div class="item-name">
    ${displayName(c)}
  </div>

`;
  // モーダル
  div.onclick = ()=>{
    if(multiSelectMode){
      selectedItems[c.name] =
        !selectedItems[c.name];
      div.classList.toggle(
        "selected",
        selectedItems[c.name]
      );
      return;
    }
    openModal(c);
  };

  // チェックボタン
  const checkBtn = div.querySelector(".check-btn");

  checkBtn.onclick = (e)=>{
    e.stopPropagation();
    // 複数選択中は星ボタン無効
    if(multiSelectMode){
      return;
    }
    checkedData[c.name] = !checkedData[c.name];
    localStorage.setItem(
      "checkedData",
      JSON.stringify(checkedData)
    );
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

  return div;
}

// 終了したフェス・シーズン セクション生成（園芸・料理ページと同じ表示方法）
function buildEndedSection(items, kind){
  const wrap = document.createElement("div");

  const lbl = document.createElement("div");
  lbl.className = "section-label";
  lbl.textContent = kind === "season" ? "🌸 シーズン限定" : "🎉 フェス限定";
  wrap.appendChild(lbl);

  const banner = document.createElement("div");
  banner.className = "event-ended-banner";
  banner.textContent =
    kind === "season"
    ? "⚠️ 現在このシーズンは終了しています"
    : "⚠️ 現在このフェスは終了しています";
  wrap.appendChild(banner);

  const grid = document.createElement("div");
  grid.className = "grid";
  items.forEach(c => grid.appendChild(createCard(c)));
  wrap.appendChild(grid);

  return wrap;
}

// 表示
function render(){

 if(!currentWeather || !currentZone) return;

 let list = creatures.filter(c => {

  // 終了したフェス・シーズン限定は別セクションで表示するためここでは除外
  if (c.ended) return false;

  // 流星雨は晴れ扱い
  const weatherForCheck =
   currentWeather === "流星雨"
    ? "晴れ"
    : currentWeather;
   
  // 天気一致
  const weatherMatch =
    c.weather.length === ALL_WEATHER.length ||
    c.weather.includes(weatherForCheck);

  // 時間一致
  const timeMatch =
    c.time.length === ALL_TIME.length ||
    c.time.includes(currentZone);

  // 今出現しているか
  const isNow = weatherMatch && timeMatch;

  // モード分岐
  if (weatherMode === "current") {
    return isNow;
  }

  if (weatherMode === "only") {
  // 全天気は除外
  if (c.weather.length === ALL_WEATHER.length) {
    return false;
  }
  // 晴れ・流星雨
  if (weatherForCheck === "晴れ") {
    return (
      c.weather.length === 2 &&
      c.weather.includes("晴れ") &&
      c.weather.includes("虹") &&
      timeMatch
    );
  }
  // 雨
  if (weatherForCheck === "雨") {
    return (
      c.weather.length === 2 &&
      c.weather.includes("雨") &&
      c.weather.includes("虹") &&
      timeMatch
    );
  }
  // 虹
  if (weatherForCheck === "虹") {
    return (
      c.weather.length === 1 &&
      c.weather.includes("虹") &&
      timeMatch
    );
  }
  return false;
}

  if (weatherMode === "hidden") {
    // 今出現していないもの全部
    return !isNow;
  }

  return false;
});
 list = applyCommonFilters(list);
 list = sortList(list);

 const el=document.getElementById("list");
 el.innerHTML="";

 // 出現なし
 if(list.length===0){
  el.innerHTML=`<p>${T("no_results","出現なし")}</p>`;
 } else {
  list.forEach(c => el.appendChild(createCard(c)));
 }

 // 終了したフェス・シーズン限定（「今は出現しない」表示時のみ、最下部に表示）
 const endedEl = document.getElementById("endedList");
 endedEl.innerHTML = "";

 if(weatherMode === "hidden"){
  let ended = creatures.filter(c => c.ended === true);
  ended = applyCommonFilters(ended);
  ended = sortList(ended);

  const seasonEnded = ended.filter(c => c.season);
  const fesEnded    = ended.filter(c => c.fes && !c.season);

  if(seasonEnded.length) endedEl.appendChild(buildEndedSection(seasonEnded, "season"));
  if(fesEnded.length)    endedEl.appendChild(buildEndedSection(fesEnded, "fes"));
 }
}

let lastZone=getZone();

// サーバー切替
function setServer(server){
  if(!SERVERS[server]) return;
  currentServer = server;
  localStorage.setItem("gameServer", server);
  updateTime();

  // モーダル表示中なら出現時間の表記を再計算して反映
  if(modal && modal.style.display === "block" && modal.dataset.currentCreature){
    const target = creatures.find(c => c.name === modal.dataset.currentCreature);
    if(target) openModal(target);
  }
}

function updateTime(){
 const now = getServerDate();
 const zone = getZone();

 const todayKey = getDateKey(0);
 const tomorrowKey = getDateKey(1);

 const todayWeather = weatherData[todayKey] || {};
 const weather = todayWeather[zone] || "不明";

 // ここで変化チェック
 const changed = (zone !== currentZone) || (weather !== currentWeather);

 currentZone = zone;
 currentWeather = weather;

 // 次の天気（そのままでOK）
 const zones = ["6-12","12-18","18-0","0-6"];
 const nextIndex = (zones.indexOf(zone)+1) % 4;
 const nextZone = zones[nextIndex];

 let nextWeather;

 if(nextZone === "0-6"){
   const tomorrowWeather = weatherData[tomorrowKey] || {};
   nextWeather = tomorrowWeather[nextZone] || "不明";
 }else{
   nextWeather = todayWeather[nextZone] || "不明";
 }

 const hh = String(now.getUTCHours()).padStart(2,"0");
 const mm = String(now.getUTCMinutes()).padStart(2,"0");
 const ss = String(now.getUTCSeconds()).padStart(2,"0");

 document.getElementById("time").innerText = `${hh}:${mm}:${ss}`;
 document.getElementById("weatherNow").innerText =
  `${T("weather_now_label","今：")}${translateWeatherWord(weather)}`;
 document.getElementById("weatherNext").innerText =
  `${T("weather_next_label","次：")}${translateWeatherWord(nextWeather)}`;
 document.getElementById("miniTime").innerText = `${hh}:${mm}`;

document.getElementById("miniWeather").innerText =
  weather;

 // 👇 変化した時だけrender
 if(changed){
   render();
 }
}

// 今日の日付取得（天気データのルックアップ用／常にJST固定）
function getDateKey(offset=0){
  const d = getJstDate();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0,10);
}
  
// 切替関数
function setWeatherMode(mode){
  weatherMode = mode;
  localStorage.setItem("weatherMode", mode);
  ["current","only","hidden"].forEach(x=>{
    document.getElementById("w_"+x).classList.remove("active");
  });

  document.getElementById("w_"+mode).classList.add("active");

  render();
}

// フィルター
function setFilter(t){
 currentFilter=t;
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


// ダークモード
const darkToggle = document.getElementById("darkToggle");

// 保存確認
const savedDark = localStorage.getItem("darkMode");

// 初回
if(savedDark === "true"){

  document.body.classList.add("dark");

}else if(savedDark === null){

  // 端末設定
  if(window.matchMedia("(prefers-color-scheme: dark)").matches){
    document.body.classList.add("dark");
  }

}

// ボタン
darkToggle.onclick = ()=>{
  // 切替
  document.body.classList.toggle("dark");
  // 保存
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );
  // ボタン更新
  updateDarkButton();
  // Safari再描画対策
  forceRepaint();
};

// ボタン表示
function updateDarkButton(){

  darkToggle.textContent =
    document.body.classList.contains("dark")
    ? "☀️"
    : "🌙";
}

function forceRepaint(){
  // Safari/iPad再描画バグ対策
  document.body.style.display = "none";
  // 強制reflow
  document.body.offsetHeight;
  document.body.style.display = "";

}

// モーダル
function openModal(c){
 modal.style.display="block";
 modal.dataset.currentCreature = c.name;
 m_name.innerText=displayName(c);
 m_img.src=c.img;
 m_loc.innerText=displayLocation(c);
 m_weather.innerText=T("modal_weather","天気：")+formatWeather(c.weather);
 m_time.innerText=T("modal_time","時間：")+formatTimeForServer(c.time);
 const basePrice = c.price ?? 0;

 // 野鳥だけ特殊計算
if(c.type === "bird"){
  // ★2計算
  function birdStar2(base){
    const value = base * 4;
    // 小さい値はそのまま
    if(value <= 16){
      return value;
    }
    // 10単位切り上げ
    return Math.ceil(value / 10) * 10;
  }
  const star2 = birdStar2(basePrice);
  m_price1.innerText =`★1｜${basePrice || "-"}`;
  m_price2.innerText =`★2｜${basePrice ? star2 : "-"}`;
  m_price3.innerText =`★3｜${basePrice ? star2 * 2 : "-"}`;
  m_price4.innerText =`★4｜${basePrice ? star2 * 4 : "-"}`;
  m_price5.innerText =`★5｜${basePrice ? star2 * 8 : "-"}`;
}else{
  // 魚・虫
  m_price1.innerText =`★1｜${basePrice || "-"}`;
  m_price2.innerText =`★2｜${basePrice ? Math.floor(basePrice * 1.5) : "-"}`;
  m_price3.innerText =`★3｜${basePrice ? Math.floor(basePrice * 2) : "-"}`;
  m_price4.innerText =`★4｜${basePrice ? Math.floor(basePrice * 4) : "-"}`;
  m_price5.innerText =`★5｜${basePrice ? Math.floor(basePrice * 8) : "-"}`;
 }
 m_star5.innerHTML =
  c.star5
  ? `${T("modal_star5_label","★5条件：")}<br>${c.star5}`
  : "";
}
  
function closeModal(){
 modal.style.display="none";
}

function toggleMultiSelect(){
  multiSelectMode = !multiSelectMode;
  document.getElementById("multiBtn")
    .classList.toggle("active", multiSelectMode);
  document.getElementById("bulkCheckBtn").style.display =
    multiSelectMode ? "block" : "none";
  document.getElementById("bulkUncheckBtn").style.display =
    multiSelectMode ? "block" : "none";
  document.getElementById("authBulkRow").style.display =
    multiSelectMode ? "flex" : "none";
  if(!multiSelectMode){
    selectedItems = {};
  }
  render();
}

function bulkCheck(){
  Object.keys(selectedItems).forEach(name=>{
    if(selectedItems[name]){
      checkedData[name] = true;
    }
  });
  localStorage.setItem(
    "checkedData",
    JSON.stringify(checkedData)
  );
  selectedItems = {};
  render();
} 

function bulkUncheck(){
  Object.keys(selectedItems).forEach(name=>{
    if(selectedItems[name]){
      checkedData[name] = false;
    }
  });
  localStorage.setItem(
    "checkedData",
    JSON.stringify(checkedData)
  );
  selectedItems = {};
  render();
}

function bulkAuthCheck(){
  Object.keys(selectedItems).forEach(name=>{
    if(selectedItems[name]){
      const c = creatures.find(c => c.name === name);
      if(c && c.auth !== false){
        authData[name] = true;
      }
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
      if(c && c.auth !== false){
        authData[name] = false;
      }
    }
  });
  localStorage.setItem("authData", JSON.stringify(authData));
  selectedItems = {};
  render();
}


const shareBtn = document.getElementById("shareBtn");
const shareModal = document.getElementById("shareModal");
const shareCanvas = document.getElementById("shareCanvas");

shareBtn.onclick = async () => {
  // 未読み込みのデータを動的に読み込む
  await Promise.all([
    loadScriptOnce("js/data-foods.js"),
    loadScriptOnce("js/data-crops.js"),
    loadScriptOnce("js/data-flowers.js"),
  ]);
  drawShareCard();
  shareModal.style.display = "block";
};

function loadScriptOnce(src) {
  return new Promise((resolve) => {
    // すでに読み込み済みならスキップ
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = resolve; // 失敗してもブロックしない
    document.head.appendChild(s);
  });
}


function closeShareModal(){
  shareModal.style.display = "none";
}

shareModal.onclick = (e)=>{
  if(e.target === shareModal) closeShareModal();
};

// 集計
function getStats() {

  // ── 図鑑 ──
  const total = creatures.length;
  const done  = creatures.filter(c => checkedData[c.name]).length;

  const byType      = { fish:0, bug:0, bird:0 };
  const totalByType = { fish:0, bug:0, bird:0 };
  creatures.forEach(c => {
    totalByType[c.type]++;
    if (checkedData[c.name]) byType[c.type]++;
  });

  const authEligible    = creatures.filter(c => c.auth !== false);
  const authByType      = { fish:0, bug:0, bird:0 };
  const authTotalByType = { fish:0, bug:0, bird:0 };
  authEligible.forEach(c => {
    authTotalByType[c.type]++;
    if (authData[c.name]) authByType[c.type]++;
  });
  const authCount = authEligible.filter(c => authData[c.name]).length;
  const authTotal = authEligible.length;

  // ── 料理 ──
  const foodChecked     = JSON.parse(localStorage.getItem("food_checked") || "{}");
  const foodAuth        = JSON.parse(localStorage.getItem("food_auth")    || "{}");
  const foodAll         = typeof foodsData !== "undefined" ? foodsData : [];
  const foodDone        = foodAll.filter(f => foodChecked[f.name]).length;
  const foodTotal       = foodAll.length;
  const foodAuthElig    = foodAll.filter(f => f.auth !== false);
  const foodAuthDone    = foodAuthElig.filter(f => foodAuth[f.name]).length;
  const foodAuthTotal   = foodAuthElig.length;

  // ── 園芸：作物 ──
  const gardenChecked   = JSON.parse(localStorage.getItem("garden_checked") || "{}");
  const cropAll         = typeof cropData   !== "undefined" ? cropData   : [];
  const flowerAll       = typeof flowerData !== "undefined" ? flowerData : [];

  const cropDone        = cropAll.filter(g => gardenChecked[g.name]).length;
  const cropTotal       = cropAll.length;
  const cropAuthElig    = cropAll.filter(g => g.auth !== false);
  const cropAuthDone    = cropAuthElig.filter(g => authData[g.name]).length;
  const cropAuthTotal   = cropAuthElig.length;

  // ── 園芸：花 ──
  const flowerDone      = flowerAll.filter(g => gardenChecked[g.name]).length;
  const flowerTotal     = flowerAll.length;
  const flowerAuthElig  = flowerAll.filter(g => g.auth !== false);
  const flowerAuthDone  = flowerAuthElig.filter(g => authData[g.name]).length;
  const flowerAuthTotal = flowerAuthElig.length;

  // ── 園芸：合計 ──
  const gardenDone      = cropDone  + flowerDone;
  const gardenTotal     = cropTotal + flowerTotal;
  const gardenAuthDone  = cropAuthDone  + flowerAuthDone;
  const gardenAuthTotal = cropAuthTotal + flowerAuthTotal;

  return {
    // 図鑑
    total, done, byType, totalByType,
    authCount, authTotal, authByType, authTotalByType,
    // 料理
    foodDone, foodTotal, foodAuthDone, foodAuthTotal,
    // 園芸
    gardenDone, gardenTotal, gardenAuthDone, gardenAuthTotal,
    cropDone,   cropTotal,   cropAuthDone,   cropAuthTotal,
    flowerDone, flowerTotal, flowerAuthDone, flowerAuthTotal,
  };
}

// 画像生成
function drawShareCard() {
  const stats = getStats();
  const ctx   = shareCanvas.getContext("2d");
  const w     = shareCanvas.width;   // 600
  const h     = shareCanvas.height;  // 1020 ← index.html の canvas height をこの値に変更

  // ── 背景 ──
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#f7f2e7");
  grad.addColorStop(1, "#ece2cf");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 装飾円
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "#c8a86b";
  ctx.beginPath(); ctx.arc(520, 80,  160, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#3c5a6e";
  ctx.beginPath(); ctx.arc(80,  940, 140, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── ヘッダー ──
  ctx.fillStyle = "#3c5a6e";
  ctx.fillRect(0, 0, w, 72);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fdf9ef";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("はとぴ図鑑  コンプ状況", w / 2, 46);

  // ── 総合コンプ率 ──
  const totalAll  = stats.total + stats.foodTotal + stats.gardenTotal;
  const doneAll   = stats.done  + stats.foodDone  + stats.gardenDone;
  const totalPct  = totalAll > 0 ? Math.floor(doneAll / totalAll * 100) : 0;

  ctx.save();
  ctx.beginPath();
  ctx.arc(w / 2, 172, 72, 0, Math.PI*2);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fill();
  ctx.strokeStyle = "#c8a86b";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "#b1503b";
  ctx.font = "bold 52px sans-serif";
  ctx.fillText(`${totalPct}%`, w / 2, 186);

  ctx.fillStyle = "#7a7164";
  ctx.font = "14px sans-serif";
  ctx.fillText("総合コンプ率", w / 2, 212);

  ctx.fillStyle = "#34302b";
  ctx.font = "15px sans-serif";
  ctx.fillText(`${doneAll} / ${totalAll}`, w / 2, 232);

  // ── ヘルパー：プログレスバー ──
  function drawProgressBar(x, y, bw, bh, pct, color) {
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.beginPath(); ctx.roundRect(x, y, bw, bh, bh / 2); ctx.fill();
    if (pct > 0) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(x, y, bw * pct / 100, bh, bh / 2); ctx.fill();
    }
  }

  // ── ヘルパー：セクションカード ──
  function drawCard(x, y, cw, ch, icon, label, done, total, authDone, authTotal, color) {
    ctx.save();
    ctx.shadowColor  = "rgba(52,48,43,0.12)";
    ctx.shadowBlur   = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 16); ctx.fill();
    ctx.restore();

    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(x, y, cw, 5, [16, 16, 0, 0]); ctx.fill();

    const cx  = x + cw / 2;
    const pct = total > 0 ? Math.floor(done / total * 100) : 0;

    ctx.textAlign = "center";
    ctx.font = "20px sans-serif";
    ctx.fillText(icon, cx, y + 34);

    ctx.fillStyle = "#3c5a6e";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(label, cx, y + 52);

    ctx.fillStyle = color;
    ctx.font = "bold 30px sans-serif";
    ctx.fillText(`${pct}%`, cx, y + 90);

    ctx.fillStyle = "#7a7164";
    ctx.font = "12px sans-serif";
    ctx.fillText(`${done} / ${total}`, cx, y + 110);

    drawProgressBar(x + 14, y + 120, cw - 28, 7, pct, color);

    ctx.fillStyle = "#c8a86b";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("🎖 認証", cx, y + 148);

    ctx.fillStyle = "#7a7164";
    ctx.font = "12px sans-serif";
    ctx.fillText(`${authDone} / ${authTotal}`, cx, y + 165);
  }

  // ── 3カード横並び ──
  const cardY  = 258;
  const cardH  = 178;
  const cardW  = 172;
  const gap    = 11;
  const startX = (w - cardW * 3 - gap * 2) / 2;

  drawCard(startX,                 cardY, cardW, cardH, "📖", "図鑑",
    stats.done,       stats.total,       stats.authCount,      stats.authTotal,      "#3c5a6e");
  drawCard(startX + cardW + gap,   cardY, cardW, cardH, "🍳", "料理",
    stats.foodDone,   stats.foodTotal,   stats.foodAuthDone,   stats.foodAuthTotal,  "#b1503b");
  drawCard(startX + cardW*2+gap*2, cardY, cardW, cardH, "🌱", "園芸",
    stats.gardenDone, stats.gardenTotal, stats.gardenAuthDone, stats.gardenAuthTotal,"#4a7c59");

// ── ヘルパー：内訳セクション ──
  function drawSubSection(titleY, sectionLabel, rows) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#3c5a6e";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(sectionLabel, 40, titleY);

    ctx.textAlign = "right";
    ctx.fillStyle = "#7a7164";
    ctx.font = "11px sans-serif";
    ctx.fillText("⭐ コンプ", w - 120, titleY);
    ctx.fillStyle = "#c8a86b";
    ctx.fillText("🎖 認証", w - 40, titleY);

    const barX = 40;
    const barW = w - 80;

    rows.forEach((t, i) => {
      const ty   = titleY + 22 + i * 62;
      const pct  = t.total     > 0 ? Math.floor(t.done     / t.total     * 100) : 0;
      const aPct = t.authTotal > 0 ? Math.floor(t.authDone / t.authTotal * 100) : 0;

      ctx.fillStyle = "#34302b";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(t.label, barX, ty + 13);

      ctx.fillStyle = "#7a7164";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`⭐ ${t.done}/${t.total}  🎖 ${t.authDone}/${t.authTotal}`, w - 40, ty + 13);

      drawProgressBar(barX, ty + 20, barW, 8, pct,  t.color);
      drawProgressBar(barX, ty + 34, barW, 6, aPct, "#c8a86b");
    });
  }

  function drawDivider(y) {
    ctx.strokeStyle = "#e4d9c2";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, y); ctx.lineTo(w - 40, y);
    ctx.stroke();
  }

  // ── 図鑑内訳 ──
  const figSubY = 462;
  drawSubSection(figSubY, "📖 図鑑内訳", [
    { label:"魚",   done:stats.byType.fish,  total:stats.totalByType.fish,  authDone:stats.authByType.fish,  authTotal:stats.authTotalByType.fish,  color:"#3c5a6e" },
    { label:"虫",   done:stats.byType.bug,   total:stats.totalByType.bug,   authDone:stats.authByType.bug,   authTotal:stats.authTotalByType.bug,   color:"#4a7c59" },
    { label:"野鳥", done:stats.byType.bird,  total:stats.totalByType.bird,  authDone:stats.authByType.bird,  authTotal:stats.authTotalByType.bird,  color:"#b1503b" },
  ]);

  // ── 園芸内訳 ──
  const gardenSubY = figSubY + 22 + 3 * 62 + 18;
  drawDivider(gardenSubY - 10);
  drawSubSection(gardenSubY, "🌱 園芸内訳", [
    { label:"作物", done:stats.cropDone,   total:stats.cropTotal,   authDone:stats.cropAuthDone,   authTotal:stats.cropAuthTotal,   color:"#4a7c59" },
    { label:"花",   done:stats.flowerDone, total:stats.flowerTotal, authDone:stats.flowerAuthDone, authTotal:stats.flowerAuthTotal, color:"#b1503b" },
  ]);

  // ── フッター ──
  ctx.fillStyle = "#3c5a6e";
  ctx.fillRect(0, h - 52, w, 52);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "12px sans-serif";
  ctx.fillText("ram1x7.github.io/heartopilist", w / 2, h - 30);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "13px sans-serif";
  ctx.fillText(new Date().toLocaleDateString("ja-JP"), w / 2, h - 12);
}


// 画像を保存・共有(Web Share API)
async function shareImage(){
  shareCanvas.toBlob(async (blob)=>{
    const file = new File([blob], "hatopi-comp.png", {type:"image/png"});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      try{
        await navigator.share({
          files:[file],
          title:"はとぴ図鑑 コンプ状況",
          text:"はとぴ図鑑のコンプ状況をシェア！"
        });
      }catch(e){}
    }else{
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hatopi-comp.png";
      a.click();
    }
  });
}

// Xへテキスト投稿(画像は別途手動添付)
function shareToX(){
  const stats = getStats();
  const percent = Math.floor(stats.done/stats.total*100);
  const text = encodeURIComponent(
    `はとぴ図鑑 コンプ率 ${percent}%！\n認証マスター ${stats.authCount}種獲得！\n#ハートピア\n#ハートピアスローライフ\n#Heartopia\n#はとぴ図鑑`
  );
  window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
}


const levelMin = document.getElementById("levelMin");
const levelMax = document.getElementById("levelMax");
const levelRangeText =
  document.getElementById("levelRangeText");

function updateLevelRange(){

  minLevel = Number(levelMin.value);
  maxLevel = Number(levelMax.value);

  // 入れ替わり防止
  if(minLevel > maxLevel){
    [minLevel,maxLevel] =
    [maxLevel,minLevel];
  }

  levelRangeText.textContent =
    T("level_range_text", `Lv.${minLevel}〜${maxLevel}`, {min:minLevel, max:maxLevel});

  localStorage.setItem("minLevel", minLevel);
  localStorage.setItem("maxLevel", maxLevel);
  
  render();
}

levelMin.addEventListener(
  "input",
  updateLevelRange
);

levelMax.addEventListener(
  "input",
  updateLevelRange
);

const popupVersion = "2.4.1";

if(
 localStorage.getItem("popupVersion")
 !== popupVersion
){
 document.getElementById(
   "updatePopup"
 ).style.display = "block";
}

function closeUpdatePopup(){

 localStorage.setItem(
   "popupVersion",
   popupVersion
 );

 document.getElementById(
   "updatePopup"
 ).style.display = "none";
}

const topPanel =
  document.getElementById("topPanel");

const minimizeBtn =
  document.getElementById("minimizeBtn");

// 保存読み込み
if(localStorage.getItem("topMinimized") === "true"){

  topPanel.classList.add("minimized");
  minimizeBtn.textContent = "＋";
}

// ボタン
minimizeBtn.onclick = ()=>{
  topPanel.classList.toggle("minimized");
  const minimized =
    topPanel.classList.contains("minimized");
  minimizeBtn.textContent =
    minimized
    ? "＋"
    : "－";
  localStorage.setItem(
    "topMinimized",
    minimized
  );
};

const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
helpBtn.onclick = ()=>{
  helpModal.style.display = "block";
};

function closeHelpModal(){
  helpModal.style.display = "none";
}

helpModal.onclick = (e)=>{
  if(e.target === helpModal){
    closeHelpModal();
  }
};

// 初期化
updateTime();
// 保存データ読込
searchInput.value =
  localStorage.getItem("searchKeyword") || "";
clearBtn.style.display =
  searchInput.value ? "block" : "none";
levelMin.value =
  localStorage.getItem("minLevel") || 1;
levelMax.value =
  localStorage.getItem("maxLevel") || 14;
updateLevelRange();
setFilter(
  localStorage.getItem("currentFilter") || "all"
);
setSort(
  localStorage.getItem("currentSort") || "book"
);
setWeatherMode(
  localStorage.getItem("weatherMode") || "current"
);

// サーバー選択の初期化
const serverSelect = document.getElementById("serverSelect");
if(serverSelect){
  serverSelect.value = currentServer;
  serverSelect.addEventListener("change", (e)=>{
    setServer(e.target.value);
  });
}

setInterval(updateTime,1000);

document.getElementById("version").textContent =
  "Ver " + APP_VERSION;

document.getElementById("disclaimer").textContent =
  T("disclaimer","※本ツールは個人が制作した非公式のものです。ゲーム公式とは一切関係ありません。");

document.getElementById("lastUpdate").textContent =
  T("last_update_label","最終更新") + " 2026/07/19";

// 言語切替時に動的コンテンツを再描画
document.addEventListener("langchange", ()=>{
  updateTime();
  updateLevelRange();
  document.getElementById("disclaimer").textContent =
    T("disclaimer","※本ツールは個人が制作した非公式のものです。ゲーム公式とは一切関係ありません。");
  document.getElementById("lastUpdate").textContent =
    T("last_update_label","最終更新") + " 2026/07/19";

  // モーダル表示中なら翻訳を反映して再表示
  if(modal && modal.style.display === "block" && modal.dataset.currentCreature){
    const target = creatures.find(c => c.name === modal.dataset.currentCreature);
    if(target) openModal(target);
  }
});
