const APP_VERSION = "3.2.0";

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
let limitedOnly = false;
let weatherMode = "current";
// "current" = 今の天気で出るやつ全部
// "only" = 今の天気でしか出ないやつ
let multiSelectMode = false;
let selectedItems = {};

let currentZone="";
let currentWeather="";
// 天気の手動入力（運営者様のデータ入力が間に合わず「不明」になっている間だけ、
// この端末上でユーザー自身が現在の天気を仮に選べるようにする。他のユーザーとは
// 共有されず、この端末のlocalStorageにのみ保存する。運営者様の公式データが
// 入力され次第、そちらを優先して自動的に手動入力は表示されなくなる
let currentWeatherIsManual = false;
let currentWeatherDateKey = "";

let minLevel = 1;
let maxLevel = 14;
  // チェック保存
let checkedData =
  JSON.parse(localStorage.getItem("checkedData") || "{}");
// 認証マスター記録
let authData =
  JSON.parse(localStorage.getItem("authData") || "{}");

// 「未完了順」「未認証順」ソート中はチェック/認証をつけた直後に対象が
// リストの下へ移動し、別の項目が同じ画面位置に入れ替わる。連続タップ時に
// 意図しない項目を巻き込んで切り替えてしまわないよう、切り替え直後は
// 短時間だけ再操作を無視する。
let toggleGuard = false;
function guardToggle(){
  if(toggleGuard) return true;
  toggleGuard = true;
  setTimeout(()=>{ toggleGuard = false; }, 400);
  return false;
}

// 天気データは js/data-weather.js の weatherData を使用（毎日手入力・別ファイル管理）

const ALL_WEATHER = ["晴れ","雨","虹"];
const ALL_TIME = ["6-12","12-18","18-0","0-6"];

// ── 天気の手動入力（「不明」の間だけ使える、この端末限定の仮設定） ──
const MANUAL_WEATHER_KEY = "manualWeatherOverrides";
const MANUAL_WEATHER_OPTIONS = ["晴れ","雨","虹","流星雨"];

function loadManualWeatherOverrides(){
  try { return JSON.parse(localStorage.getItem(MANUAL_WEATHER_KEY) || "{}"); }
  catch(e){ return {}; }
}

// 運営者様の公式データ(weatherData)が入っている間は、そちらを常に優先する
// （officialWeatherがある場合はこの関数自体を呼ばない）ため、公式データが
// 後から入力されると自動的に手動入力より優先される
function getManualWeatherOverride(dateKey, zone){
  const overrides = loadManualWeatherOverrides();
  return overrides[`${dateKey}_${zone}`] || null;
}

function setManualWeatherOverride(dateKey, zone, value){
  const overrides = loadManualWeatherOverrides();
  if(value) overrides[`${dateKey}_${zone}`] = value;
  else delete overrides[`${dateKey}_${zone}`];
  localStorage.setItem(MANUAL_WEATHER_KEY, JSON.stringify(overrides));
}

// #weatherNowの下に、天気が「不明」（公式データ未入力）の間だけ選択欄を表示する。
// 選択するとこの端末にだけ保存され、他のユーザーには共有されない
function renderWeatherOverrideControl(officialWeather, dateKey, zone){
  const wrap = document.getElementById("weatherOverrideWrap");
  if(!wrap) return;

  if(officialWeather){
    wrap.style.display = "none";
    wrap.innerHTML = "";
    return;
  }

  const current = getManualWeatherOverride(dateKey, zone) || "";
  const options = [`<option value="">${T("weather_manual_placeholder","天気を選択")}</option>`]
    .concat(MANUAL_WEATHER_OPTIONS.map(w => `<option value="${w}"${w === current ? " selected" : ""}>${translateWeatherWord(w)}</option>`))
    .join("");
  wrap.innerHTML = `<select id="weatherOverrideSelect" class="weather-override-select" onchange="onWeatherOverrideChange(this.value)">${options}</select>`;
  wrap.style.display = "";
}

function onWeatherOverrideChange(value){
  setManualWeatherOverride(currentWeatherDateKey, currentZone, value);
  updateTime();
}

// 最後にまとめる（超重要）
const creatures = [
 ...fishData,
 ...bugData,
 ...birdData,
 ...(typeof sandData  !== "undefined" ? sandData  : []),
 ...(typeof snowData  !== "undefined" ? snowData  : []),
 ...(typeof shellData !== "undefined" ? shellData : [])
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
    return window.i18n.t(key, vars, fallback);
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
  if(!c.locationI18n) return c.location || "";
  const lang = currentLang();
  return c.locationI18n[lang] || c.location || "";
}

// 残り分数を「◯日◯時間◯分」形式の文字列に整形
function formatMinutesUntil(minutes){
  if(minutes == null || isNaN(minutes) || minutes < 0) return "";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = Math.floor(minutes % 60);
  if(days > 0) return `${days}日${hours}時間`;
  if(hours > 0) return `${hours}時間${mins}分`;
  return `${mins}分`;
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

// 天気の単語（晴れ/雨/虹/流星雨）に対応するアイコンHTMLを返す（不明などは非表示）
function weatherIconHTML(w){
  const map = {
    "晴れ":"weatherSun",
    "雨":"weatherRain",
    "虹":"weatherRainbow",
    "流星雨":"weatherMeteor",
  };
  return map[w] ? `${icon(map[w], {size:13})} ` : "";
}

const searchInput = document.getElementById("search");
const miniSearch = document.getElementById("miniSearch");
const clearBtn = document.getElementById("clearBtn");
clearBtn.innerHTML = icon("close", {size:13});

const searchIconEl = document.querySelector(".search-icon");
if(searchIconEl) searchIconEl.innerHTML = icon("search", {size:15});
const serverSelectIconEl = document.querySelector(".server-select-icon");
if(serverSelectIconEl) serverSelectIconEl.innerHTML = icon("globe", {size:13});

// data-icon 属性を持つ .btn-icon / .help-icon 要素にまとめてSVGを流し込む
document.querySelectorAll(".btn-icon[data-icon]").forEach(el=>{
  el.innerHTML = icon(el.dataset.icon, {size:13});
});
document.querySelectorAll(".help-icon[data-icon]").forEach(el=>{
  el.innerHTML = icon(el.dataset.icon, {size:14});
});
const helpTitleIconEl = document.getElementById("helpTitleIcon");
if(helpTitleIconEl) helpTitleIconEl.innerHTML = icon("info", {size:17});

// ══════════════════════════════════════
// アコーディオン（絞り込み・並び替え / 複数選択・一括操作）
// ══════════════════════════════════════
function setupAccordion(toggleId, bodyId, storageKey, iconSelector, defaultOpen){
  const toggle = document.getElementById(toggleId);
  const body   = document.getElementById(bodyId);
  if(!toggle || !body) return;

  const iconEl = toggle.querySelector(iconSelector);
  if(iconEl) iconEl.innerHTML = icon("chevronDown", {size:15, className:"accordion-chevron-svg"});

  const saved = localStorage.getItem(storageKey);
  const isOpen = saved !== null ? saved === "true" : defaultOpen;
  toggle.classList.toggle("open", isOpen);
  body.classList.toggle("open", isOpen);

  toggle.addEventListener("click", ()=>{
    const nowOpen = !body.classList.contains("open");
    toggle.classList.toggle("open", nowOpen);
    body.classList.toggle("open", nowOpen);
    localStorage.setItem(storageKey, nowOpen);
  });
}

setupAccordion("filterAccordionToggle", "filterAccordionBody", "filterAccordionOpen", ".accordion-chevron", false);
setupAccordion("bulkAccordionToggle", "bulkAccordionBody", "bulkAccordionOpen", ".accordion-chevron", false);

const filterAccordionIconEl = document.querySelector("#filterAccordionToggle .accordion-toggle-icon");
if(filterAccordionIconEl) filterAccordionIconEl.innerHTML = icon("level", {size:15});
const bulkAccordionIconEl = document.querySelector("#bulkAccordionToggle .accordion-toggle-icon");
if(bulkAccordionIconEl) bulkAccordionIconEl.innerHTML = icon("checkSquare", {size:15});

// 入力時
let searchTimer;

// 通常検索バー
searchInput.addEventListener("input", ()=>{

  miniSearch.value = searchInput.value;

  clearBtn.style.display =
    searchInput.value ? "flex" : "none";

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
    miniSearch.value ? "flex" : "none";

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

  if(limitedOnly){
    // 「開催中のシーズン・フェス限定のみ」の絞り込みなので、
    // ・season/fesが終了済み（ended:true）のものは除外する
    // ・砂像・雪像はseason/fesフラグをバッジ表示用に持つが、過去シーズンの
    //   ものでも常時入手可能でendedも付けない仕様のため（data-sand.js/
    //   data-snow.js参照）、この絞り込みからは対象外にする
    out = out.filter(c => (c.season || c.fes) && !c.ended && c.type !== "sand" && c.type !== "snow");
  }

  const keyword = document.getElementById("search").value;
  if(keyword){
    const kw = keyword.toLowerCase();
    out = out.filter(c =>
      (c.name || "").toLowerCase().includes(kw) ||
      (c.location || "").toLowerCase().includes(kw) ||
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
      const typeOrder = { fish:0, bug:1, bird:2, sand:3, snow:4, shell:5 };

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

      const typeOrder = { fish:0, bug:1, bird:2, sand:3, snow:4, shell:5 };

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

        const typeOrder = { fish:0, bug:1, bird:2, sand:3, snow:4, shell:5 };
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

// 一覧カード用の軽量サムネイル画像パスを返す（詳細モーダルは元画像のまま）
function thumbSrc(path){
  if(!path) return path;
  const normalized = path.startsWith("./") ? path.slice(2) : path;
  if(!normalized.startsWith("images/")) return path;
  return normalized
    .replace(/^images\//, "images/thumb/")
    .replace(/\.[^./]+$/, ".jpg");
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
  " aria-pressed="${checkedData[c.name] ? "true" : "false"}" aria-label="${displayName(c)} ${T("aria_check_label","コンプ済みにする")}">
    ${icon(checkedData[c.name] ? "star" : "starOutline", {size:13})}
  </button>

  ${c.auth !== false ? `
  <button class="
    auth-btn
    ${authData[c.name] ? "checked" : ""}
  " aria-pressed="${authData[c.name] ? "true" : "false"}" aria-label="${displayName(c)} ${T("aria_auth_label","認証マスターにする")}">
    ${authData[c.name] ? icon("medal", {size:16}) : icon("medalOutline", {size:13})}
  </button>
` : ""}

  <img src="${thumbSrc(c.img)}" alt="${displayName(c)}" loading="lazy" decoding="async">

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
    if(guardToggle()) return;
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
      if(guardToggle()) return;
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
  lbl.innerHTML = kind === "season"
    ? `${icon("calendar", {size:15})} ${T("label_season_limited","シーズン限定")}`
    : `${icon("calendar", {size:15})} ${T("label_fes_limited","フェス限定")}`;
  wrap.appendChild(lbl);

  const banner = document.createElement("div");
  banner.className = "event-ended-banner";
  banner.innerHTML =
    `${icon("warning", {size:14})} ` +
    (kind === "season"
    ? T("banner_season_ended_note","現在このシーズンは終了しています")
    : T("banner_fes_ended_note","現在このフェスは終了しています"));
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
 const officialWeather = todayWeather[zone];
 // 公式データが無い間だけ、この端末の手動入力（あれば）を使う。
 // 公式データが入力されると、次にこの関数が呼ばれた時点で自動的にそちらへ切り替わる
 const manualWeather = !officialWeather ? getManualWeatherOverride(todayKey, zone) : null;
 const weather = officialWeather || manualWeather || "不明";

 // ここで変化チェック
 const changed = (zone !== currentZone) || (weather !== currentWeather);

 currentZone = zone;
 currentWeather = weather;
 currentWeatherIsManual = !officialWeather && !!manualWeather;
 currentWeatherDateKey = todayKey;

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
  `${T("weather_now_label","今：")}${translateWeatherWord(weather)}${currentWeatherIsManual ? T("weather_manual_suffix","（手動入力）") : ""}`;
 document.getElementById("weatherNext").innerText =
  `${T("weather_next_label","次：")}${translateWeatherWord(nextWeather)}`;
 renderWeatherOverrideControl(officialWeather, todayKey, zone);
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
 ["all","fish","bug","bird","sand","snow","shell"].forEach(x=>{
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

// シーズン・フェス限定のみ表示
function setLimitedOnly(v){
  limitedOnly = v;
  localStorage.setItem("limitedOnly", v ? "1" : "");
  document.getElementById("limitedOnlyBtn").classList.toggle("active", v);
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

// html側にもクラスを反映（Safariでbodyの背景がスクロール全域に伸びきらない対策）
document.documentElement.classList.toggle("dark", document.body.classList.contains("dark"));

// 初回表示時もSafari再描画対策を行う（ページ遷移直後に背景が反映されない不具合対策）
if(document.body.classList.contains("dark")){
  forceRepaint();
}

// ボタン
darkToggle.onclick = ()=>{
  // 切替
  document.body.classList.toggle("dark");
  document.documentElement.classList.toggle("dark", document.body.classList.contains("dark"));
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
  darkToggle.innerHTML =
    document.body.classList.contains("dark")
    ? icon("sun")
    : icon("moon");
}
updateDarkButton();

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
 m_img.alt=displayName(c);
 let locHtml = displayLocation(c);
 if(c.seasonName){
   locHtml += (locHtml ? "　" : "") + `<span class="modal-season-tag">${icon("calendar",{size:12})}${c.seasonName}</span>`;
 }
 m_loc.innerHTML = locHtml;
 m_weather.innerText = formatWeather(c.weather);
 m_time.innerText = formatTimeForServer(c.time);
 const basePrice = c.price ?? 0;

 // 星1しか存在しないアイテム（失敗作・壊れ物など）は★2〜5を非表示にする
 const star1Only = c.star1Only === true;

 // 売価セルの表示（コイン/フェスコインどちらも文字は出さずアイコン＋数字のみ）
 function fmtCell(value, currencyType){
   return value != null ? `${currencyIcon(currencyType)}${value.toLocaleString()}` : "-";
 }

 // 野鳥だけ特殊計算
 function birdStar2(base){
   const value = base * 4;
   // 小さい値はそのまま
   if(value <= 16){
     return value;
   }
   // 10単位切り上げ
   return Math.ceil(value / 10) * 10;
 }

 function calcStars(base, isBird){
   if(!base) return [null,null,null,null,null];
   if(isBird){
     const star2 = birdStar2(base);
     return [base, star2, star2 * 2, star2 * 4, star2 * 8];
   }
   return [base, Math.floor(base * 1.5), Math.floor(base * 2), Math.floor(base * 4), Math.floor(base * 8)];
 }

 const isBird = c.type === "bird";
 const prices = calcStars(basePrice, isBird);
 const priceEls = [m_price1, m_price2, m_price3, m_price4, m_price5];
 priceEls.forEach((el, i) => { el.innerHTML = fmtCell(prices[i], "coin"); });

 // フェス限定：フェスコインでの売却価格（通常コインと同じ計算方法で★1〜5を算出）
 const hasFesField = c.fesCoinPrice !== undefined;
 m_priceTable.classList.toggle("has-fes", hasFesField);
 const fesPrices = hasFesField ? calcStars(c.fesCoinPrice ?? 0, isBird) : [null,null,null,null,null];
 const fesPriceEls = [m_fesPrice1, m_fesPrice2, m_fesPrice3, m_fesPrice4, m_fesPrice5];
 fesPriceEls.forEach((el, i) => { el.innerHTML = hasFesField ? fmtCell(fesPrices[i], "fescoin") : ""; });

 // 星1しか存在しない場合は★2〜5の行を隠す
 [m_priceRow2, m_priceRow3, m_priceRow4, m_priceRow5].forEach(el=>{
   el.style.display = star1Only ? "none" : "";
 });

 m_star5.innerHTML = c.star5 || "";
 m_star5Row.style.display = c.star5 ? "" : "none";

 // 認証マスターに必要な捕獲・発見数（対象外の生き物や、まだ判明していない数値は非表示にする）
 m_authCount.innerHTML = c.authCount ? `${icon("medal",{size:14})} ${c.authCount.toLocaleString()}` : "";
 m_authCountRow.style.display = c.authCount ? "" : "none";

 // 作り方情報（砂像のデザイン形状・三択回答など）
 const craftEl = document.getElementById("m_craftInfo");
 if(craftEl){
   const craftRows = [];
   if(c.designShape){
     craftRows.push(`<div class="modal-craft-row"><span class="modal-craft-label">${T("modal_craft_design_label","デザイン形状")}</span><span>${c.designShape}</span></div>`);
   }
   if(c.craftAnswer){
     craftRows.push(`<div class="modal-craft-row"><span class="modal-craft-label">${T("modal_craft_answer_label","三択回答")}</span><span>${c.craftAnswer}</span></div>`);
   }
   if(craftRows.length){
     craftEl.innerHTML = `
       <div class="modal-make-steps-title">${T("modal_craft_info_title","作り方情報")}</div>
       ${craftRows.join("")}
     `;
     craftEl.style.display = "block";
   } else {
     craftEl.innerHTML = "";
     craftEl.style.display = "none";
   }
 }

 // 作り方（砂像など、決まった手順があるもの用）
 const stepsEl = document.getElementById("m_makeSteps");
 const stepsList = (c.makeStepsI18n && c.makeStepsI18n[i18n.getCurrentLang()] && c.makeStepsI18n[i18n.getCurrentLang()].length)
   ? c.makeStepsI18n[i18n.getCurrentLang()]
   : c.makeSteps;

 if(stepsList && stepsList.length){
   stepsEl.innerHTML = `
     <div class="modal-make-steps-title">${T("modal_make_steps_title","作り方")}</div>
     <ol class="modal-make-steps-list">
       ${stepsList.map(s => `<li>${s.replace(/^\d+\.\s*/, "")}</li>`).join("")}
     </ol>
   `;
   stepsEl.style.display = "block";
 } else {
   stepsEl.innerHTML = "";
   stepsEl.style.display = "none";
 }
}
  
function closeModal(){
 modal.style.display="none";
}

function toggleMultiSelect(){
  multiSelectMode = !multiSelectMode;
  document.getElementById("multiBtn")
    .classList.toggle("active", multiSelectMode);
  document.getElementById("bulkStarRow").style.display =
    multiSelectMode ? "flex" : "none";
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
shareBtn.innerHTML = icon("share");

// カード上部に飾るマスコット画像（サイトのアプリアイコンを流用）
const shareMascotImg = new Image();
shareMascotImg.src = "apple-touch-icon.png?v=10";
const shareMascotReady = new Promise((resolve) => {
  shareMascotImg.onload  = () => resolve(true);
  shareMascotImg.onerror = () => resolve(false);
});

shareBtn.onclick = async () => {
  // 未読み込みのデータを動的に読み込む
  await Promise.all([
    loadScriptOnce("js/data-foods.js"),
    loadScriptOnce("js/data-crops.js"),
    loadScriptOnce("js/data-flowers.js"),
  ]);
  // カード内の文字に使う明朝体を読み込んでおく（未読み込みだとcanvas描画時にフォールバック体になる）
  try {
    await Promise.all([
      document.fonts.load('700 32px "Shippori Mincho"'),
      document.fonts.load('600 16px "Shippori Mincho"'),
    ]);
  } catch(e) {}
  await shareMascotReady;
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

  const byType      = { fish:0, bug:0, bird:0, sand:0, snow:0, shell:0 };
  const totalByType = { fish:0, bug:0, bird:0, sand:0, snow:0, shell:0 };
  creatures.forEach(c => {
    totalByType[c.type]++;
    if (checkedData[c.name]) byType[c.type]++;
  });

  const authEligible    = creatures.filter(c => c.auth !== false);
  const authByType      = { fish:0, bug:0, bird:0, sand:0, snow:0, shell:0 };
  const authTotalByType = { fish:0, bug:0, bird:0, sand:0, snow:0, shell:0 };
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
  // 認証データは園芸専用の "garden_auth" キー（図鑑の authData とは分離済み）
  const gardenChecked   = JSON.parse(localStorage.getItem("garden_checked") || "{}");
  const gardenAuth      = JSON.parse(localStorage.getItem("garden_auth")    || "{}");
  const cropAll         = typeof cropData   !== "undefined" ? cropData   : [];
  const flowerAll       = typeof flowerData !== "undefined" ? flowerData : [];

  const cropDone        = cropAll.filter(g => gardenChecked[g.name]).length;
  const cropTotal       = cropAll.length;
  const cropAuthElig    = cropAll.filter(g => g.auth !== false);
  const cropAuthDone    = cropAuthElig.filter(g => gardenAuth[g.name]).length;
  const cropAuthTotal   = cropAuthElig.length;

  // ── 園芸：花 ──
  const flowerDone      = flowerAll.filter(g => gardenChecked[g.name]).length;
  const flowerTotal     = flowerAll.length;
  const flowerAuthElig  = flowerAll.filter(g => g.auth !== false);
  const flowerAuthDone  = flowerAuthElig.filter(g => gardenAuth[g.name]).length;
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

// 画像生成（サイトのアイコン/OGP画像に合わせた、生成り×金の線画×藍色の高級和風デザイン）
function drawShareCard() {
  const stats = getStats();

  // ── 配色（サイト本体の配色に統一） ──
  const INDIGO      = "#3c5a6e";
  const VERMILLION  = "#b1503b";
  const GOLD        = "#c8a86b";
  const GOLD_DEEP    = "#a3854f";
  const TEXT        = "#34302b";
  const TEXT_SUB     = "#7a7164";
  const BG_TOP      = "#f8f3e8";
  const BG_BOTTOM   = "#efe4cd";
  const PANEL       = "rgba(255,253,247,0.86)";
  const PANEL_LINE  = "rgba(200,168,107,0.55)";
  const TRACK       = "rgba(122,113,100,0.12)";
  const SERIF       = "'Shippori Mincho', serif";

  // ── 内訳データ ──
  const dexRows = [
    { label:"魚",   done:stats.byType.fish,  total:stats.totalByType.fish,  authDone:stats.authByType.fish,  authTotal:stats.authTotalByType.fish  },
    { label:"虫",   done:stats.byType.bug,   total:stats.totalByType.bug,   authDone:stats.authByType.bug,   authTotal:stats.authTotalByType.bug   },
    { label:"野鳥", done:stats.byType.bird,  total:stats.totalByType.bird,  authDone:stats.authByType.bird,  authTotal:stats.authTotalByType.bird  },
    { label:"砂像", done:stats.byType.sand,  total:stats.totalByType.sand,  authDone:stats.authByType.sand,  authTotal:stats.authTotalByType.sand  },
    { label:"雪像", done:stats.byType.snow,  total:stats.totalByType.snow,  authDone:stats.authByType.snow,  authTotal:stats.authTotalByType.snow  },
    { label:"貝殻", done:stats.byType.shell, total:stats.totalByType.shell, authDone:stats.authByType.shell, authTotal:stats.authTotalByType.shell },
  ];
  const gardenRows = [
    { label:"作物", done:stats.cropDone,   total:stats.cropTotal,   authDone:stats.cropAuthDone,   authTotal:stats.cropAuthTotal   },
    { label:"花",   done:stats.flowerDone, total:stats.flowerTotal, authDone:stats.flowerAuthDone, authTotal:stats.flowerAuthTotal },
  ];

  // ── レイアウト（3:4比率。カーソルを積み上げて要素の重なりを防ぐ） ──
  const w      = 960;
  const M      = 64;               // 左右の余白
  const rowH   = 54;
  const mascotR = 56;
  const medalR  = 76;
  const cardH   = 172;

  let cur = 34;
  cur += mascotR * 2;
  const mascotCy = cur - mascotR;
  cur += 18;                       // マスコット下の余白

  const titleY = cur + 26;
  cur = titleY + 8;
  const subtitleY = cur + 14;
  cur = subtitleY + 16;
  const dividerY = cur;
  cur += 34;

  const medalCy = cur + medalR;
  cur += medalR * 2;
  cur += 34;                       // メダル下の「done / total」表示分

  const cardY = cur;
  cur += cardH;
  cur += 38;

  const dexTitleY = cur;
  cur += 30 + dexRows.length * rowH;
  cur += 24;

  const dexDividerY = cur;
  cur += 26;

  const gardenTitleY = cur;
  cur += 30 + gardenRows.length * rowH;
  cur += 44;

  const h = cur + 36; // フッター分（URL行は省略し日付のみ）

  shareCanvas.width  = w;
  shareCanvas.height = h;
  const ctx = shareCanvas.getContext("2d");

  // ── 背景 ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, BG_TOP);
  bgGrad.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // ── ヘルパー：細い金の弧を重ねた装飾（青海波・流水紋風のあしらい） ──
  function drawFlourish(cx, cy, scale, rot, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = GOLD_DEEP;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(i * 26, 0, 30, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = GOLD_DEEP;
    ctx.fill();
    ctx.restore();
  }
  drawFlourish(w - 70, 44, 1, 0.15, 0.28);
  drawFlourish(70, h - 44, 1, Math.PI + 0.15, 0.28);

  // ── ヘルパー：桜の花びら（和のあしらい、控えめに散らす） ──
  function drawSakura(cx, cy, r, rot, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(177,80,59,0.16)";
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 / 5) * i);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 0.55, -r * 0.4, 0, -r);
      ctx.quadraticCurveTo(-r * 0.55, -r * 0.4, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,168,107,0.35)";
    ctx.fill();
    ctx.restore();
  }
  drawSakura(56,     mascotCy - 30, 20, -0.3, 1);
  drawSakura(w - 52, mascotCy + 60, 16,  1.9, 1);
  drawSakura(w - 44, h - 190,       18,  0.7, 1);
  drawSakura(50,     h - 90,        14, -1.4, 1);

  // 隅の淡い金の光暈
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.arc(w - 20, 10, 170, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, h - 10, 150, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── 外枠（二重の金の罫線） ──
  ctx.save();
  ctx.strokeStyle = "rgba(163,133,79,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(14, 14, w - 28, h - 28, 14); ctx.stroke();
  ctx.strokeStyle = "rgba(163,133,79,0.3)";
  ctx.beginPath(); ctx.roundRect(20, 20, w - 40, h - 40, 10); ctx.stroke();
  ctx.restore();

  // ── ヘルパー：角の飾り（額縁のコーナー金具風） ──
  function drawCorner(cx, cy, len, rot) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.strokeStyle = GOLD_DEEP;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, len); ctx.lineTo(0, 0); ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.restore();
  }

  // ── マスコット（アプリアイコン画像を円形フレームで） ──
  const mascotCx = w / 2;
  ctx.save();
  ctx.beginPath(); ctx.arc(mascotCx, mascotCy, mascotR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (shareMascotImg.complete && shareMascotImg.naturalWidth > 0) {
    ctx.drawImage(
      shareMascotImg,
      mascotCx - mascotR, mascotCy - mascotR, mascotR * 2, mascotR * 2
    );
  } else {
    ctx.fillStyle = PANEL;
    ctx.fillRect(mascotCx - mascotR, mascotCy - mascotR, mascotR * 2, mascotR * 2);
  }
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(mascotCx, mascotCy, mascotR, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  ctx.beginPath(); ctx.arc(mascotCx, mascotCy, mascotR + 6, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(163,133,79,0.4)";
  ctx.stroke();
  ctx.restore();

  // ── ヘッダー ──
  ctx.textAlign = "center";
  ctx.fillStyle = INDIGO;
  ctx.font = `700 32px ${SERIF}`;
  ctx.fillText("はとぴ図鑑", w / 2, titleY);

  ctx.fillStyle = TEXT_SUB;
  ctx.font = `12px ${SERIF}`;
  ctx.save();
  ctx.letterSpacing = "0.28em";
  ctx.fillText("C O M P L E T E   S T A T U S", w / 2, subtitleY);
  ctx.restore();

  // タイトル下の飾り罫（線 - 菱形 - 線）
  ctx.strokeStyle = "rgba(163,133,79,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 120, dividerY); ctx.lineTo(w / 2 - 14, dividerY);
  ctx.moveTo(w / 2 + 14, dividerY);  ctx.lineTo(w / 2 + 120, dividerY);
  ctx.stroke();
  ctx.save();
  ctx.translate(w / 2, dividerY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = GOLD;
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();

  // ── 総合コンプ率（二重リングのメダル） ──
  const totalAll = stats.total + stats.foodTotal + stats.gardenTotal;
  const doneAll  = stats.done  + stats.foodDone  + stats.gardenDone;
  const totalPct = totalAll > 0 ? Math.floor(doneAll / totalAll * 100) : 0;
  const medalCx  = w / 2;

  ctx.save();
  ctx.shadowColor  = "rgba(120,100,60,0.18)";
  ctx.shadowBlur   = 16;
  ctx.shadowOffsetY = 6;
  ctx.beginPath(); ctx.arc(medalCx, medalCy, medalR, 0, Math.PI * 2);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = GOLD;
  ctx.beginPath(); ctx.arc(medalCx, medalCy, medalR, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(163,133,79,0.45)";
  ctx.beginPath(); ctx.arc(medalCx, medalCy, medalR - 8, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = VERMILLION;
  ctx.font = `700 44px ${SERIF}`;
  ctx.fillText(`${totalPct}%`, medalCx, medalCy + 8);

  ctx.fillStyle = TEXT_SUB;
  ctx.font = `12px ${SERIF}`;
  ctx.fillText("総 合 コ ン プ 率", medalCx, medalCy + 34);

  ctx.fillStyle = TEXT;
  ctx.font = "13px sans-serif";
  ctx.fillText(`${doneAll} / ${totalAll}`, medalCx, medalCy + medalR + 28);

  // ── ヘルパー：プログレスバー（金のグラデーション） ──
  function drawProgressBar(x, py, bw, bh, pct) {
    ctx.fillStyle = TRACK;
    ctx.beginPath(); ctx.roundRect(x, py, bw, bh, bh / 2); ctx.fill();
    if (pct > 0) {
      const g = ctx.createLinearGradient(x, 0, x + bw, 0);
      g.addColorStop(0, GOLD_DEEP);
      g.addColorStop(1, GOLD);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(x, py, bw * pct / 100, bh, bh / 2); ctx.fill();
    }
  }

  // ── ヘルパー：カテゴリカード（印章風の〇の中に項目名を入れる） ──
  function drawCard(x, cy, cw, ch, label, done, total, authDone, authTotal) {
    ctx.save();
    ctx.shadowColor  = "rgba(120,100,60,0.14)";
    ctx.shadowBlur   = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = PANEL;
    ctx.beginPath(); ctx.roundRect(x, cy, cw, ch, 14); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = PANEL_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, cy, cw, ch, 14); ctx.stroke();
    ctx.restore();

    const cornerLen = 12;
    drawCorner(x + 6,      cy + 6,      cornerLen, 0);
    drawCorner(x + cw - 6, cy + 6,      cornerLen, Math.PI / 2);
    drawCorner(x + cw - 6, cy + ch - 6, cornerLen, Math.PI);
    drawCorner(x + 6,      cy + ch - 6, cornerLen, -Math.PI / 2);

    const cx  = x + cw / 2;
    const pct = total > 0 ? Math.floor(done / total * 100) : 0;

    // 印章風バッジ（〇の中に項目名を表示）
    const badgeR = 26;
    const badgeCy = cy + 40;
    ctx.beginPath(); ctx.arc(cx, badgeCy, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,168,107,0.12)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = GOLD;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = INDIGO;
    ctx.font = `700 14px ${SERIF}`;
    ctx.fillText(label, cx, badgeCy + 5);

    ctx.fillStyle = VERMILLION;
    ctx.font = `700 27px ${SERIF}`;
    ctx.fillText(`${pct}%`, cx, cy + 96);

    ctx.fillStyle = TEXT_SUB;
    ctx.font = "11px sans-serif";
    ctx.fillText(`${done} / ${total}`, cx, cy + 114);

    drawProgressBar(x + 16, cy + 126, cw - 32, 6, pct);

    ctx.fillStyle = TEXT_SUB;
    ctx.font = "10px sans-serif";
    ctx.fillText(`認証 ${authDone} / ${authTotal}`, cx, cy + 154);
  }

  // ── 3カード横並び ──
  const gap    = 20;
  const cardW  = (w - M * 2 - gap * 2) / 3;
  const startX = M;

  drawCard(startX,                 cardY, cardW, cardH, "図鑑",
    stats.done,       stats.total,       stats.authCount,      stats.authTotal);
  drawCard(startX + cardW + gap,   cardY, cardW, cardH, "料理",
    stats.foodDone,   stats.foodTotal,   stats.foodAuthDone,   stats.foodAuthTotal);
  drawCard(startX + cardW*2+gap*2, cardY, cardW, cardH, "園芸",
    stats.gardenDone, stats.gardenTotal, stats.gardenAuthDone, stats.gardenAuthTotal);

  // ── ヘルパー：内訳セクション ──
  function drawSubSection(titleY2, sectionLabel, rows) {
    ctx.textAlign = "left";
    ctx.fillStyle = INDIGO;
    ctx.font = `700 17px ${SERIF}`;
    ctx.fillText(sectionLabel, M, titleY2);

    ctx.textAlign = "right";
    ctx.fillStyle = TEXT_SUB;
    ctx.font = "10.5px sans-serif";
    ctx.fillText("コンプ / 認証", w - M, titleY2);

    const barX = M;
    const barW = w - M * 2;

    rows.forEach((t, i) => {
      const ty   = titleY2 + 26 + i * rowH;
      const pct  = t.total     > 0 ? Math.floor(t.done     / t.total     * 100) : 0;
      const aPct = t.authTotal > 0 ? Math.floor(t.authDone / t.authTotal * 100) : 0;

      // 金の菱形ブレット
      ctx.save();
      ctx.translate(barX + 3, ty - 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = GOLD;
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();

      ctx.fillStyle = TEXT;
      ctx.font = `600 13.5px ${SERIF}`;
      ctx.textAlign = "left";
      ctx.fillText(t.label, barX + 16, ty + 2);

      ctx.fillStyle = TEXT_SUB;
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${t.done}/${t.total}（${pct}%） ・ 認証 ${t.authDone}/${t.authTotal}`, w - M, ty + 2);

      drawProgressBar(barX, ty + 12, barW, 7, pct);
      drawProgressBar(barX, ty + 24, barW, 3, aPct);
    });
  }

  function drawDivider(dy) {
    ctx.strokeStyle = "rgba(163,133,79,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M, dy); ctx.lineTo(w - M, dy);
    ctx.stroke();
  }

  // ── 図鑑内訳 ──
  drawSubSection(dexTitleY, "図鑑内訳", dexRows);

  // ── 園芸内訳 ──
  drawDivider(dexDividerY);
  drawSubSection(gardenTitleY, "園芸内訳", gardenRows);

  // ── フッター（日付のみ。URL表記は省略） ──
  drawDivider(h - 34);
  ctx.textAlign = "center";
  ctx.fillStyle = GOLD_DEEP;
  ctx.font = `600 13px ${SERIF}`;
  ctx.fillText(new Date().toLocaleDateString("ja-JP"), w / 2, h - 14);
}


// シェア用の共通キャプション文言（画像シェア・Xポストで揃える）
function buildShareText(){
  const stats = getStats();
  const totalAll  = stats.total + stats.foodTotal + stats.gardenTotal;
  const doneAll   = stats.done  + stats.foodDone  + stats.gardenDone;
  const percent   = totalAll > 0 ? Math.floor(doneAll / totalAll * 100) : 0;
  const authAll   = stats.authCount + stats.foodAuthDone + stats.gardenAuthDone;
  return `はとぴ図鑑 コンプ率 ${percent}%！\n認証マスター ${authAll}種獲得！\n#ハートピア\n#ハートピアスローライフ\n#Heartopia\n#はとぴ図鑑`;
}

// 画像を保存・共有(Web Share API。対応端末では画像とテキストを同時に共有できる)
async function shareImage(){
  shareCanvas.toBlob(async (blob)=>{
    const file = new File([blob], "hatopi-comp.png", {type:"image/png"});
    const text = buildShareText();
    if(navigator.canShare && navigator.canShare({files:[file]})){
      try{
        await navigator.share({
          files:[file],
          title:"はとぴ図鑑 コンプ状況",
          text
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

const popupVersion = "3.4.0";

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

 // 更新通知を閉じた直後に、まだチュートリアル初回表示が済んでいなければ
 // ここから開始する（更新通知とチュートリアルが同時に重なって表示されるのを防ぐ）
 maybeStartPageTutorial(INDEX_TUTORIAL_DONE_KEY, INDEX_TUTORIAL_STEPS);
}

const topPanel =
  document.getElementById("topPanel");

const minimizeBtn =
  document.getElementById("minimizeBtn");

// 保存読み込み
if(localStorage.getItem("topMinimized") === "true"){
  topPanel.classList.add("minimized");
  minimizeBtn.innerHTML = icon("chevronDown");
}else{
  minimizeBtn.innerHTML = icon("minus");
}

// ボタン
minimizeBtn.onclick = ()=>{
  topPanel.classList.toggle("minimized");
  const minimized =
    topPanel.classList.contains("minimized");
  minimizeBtn.innerHTML =
    minimized
    ? icon("chevronDown")
    : icon("minus");
  localStorage.setItem(
    "topMinimized",
    minimized
  );
};

const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
helpBtn.innerHTML = icon("help");
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

const dataSyncBtn = document.getElementById("dataSyncBtn");
const dataSyncModal = document.getElementById("dataSyncModal");
if(dataSyncBtn){
  dataSyncBtn.innerHTML = icon("archive");
  dataSyncBtn.onclick = ()=>{
    dataSyncModal.style.display = "block";
  };
}
if(dataSyncModal){
  const dataSyncTitleIconEl = document.getElementById("dataSyncTitleIcon");
  if(dataSyncTitleIconEl) dataSyncTitleIconEl.innerHTML = icon("archive", {size:17});
  dataSyncModal.onclick = (e)=>{
    if(e.target === dataSyncModal){
      closeDataSyncModal();
    }
  };
}

// ── 初回チュートリアル（スポットライト形式、js/tutorial.js） ──
const INDEX_TUTORIAL_DONE_KEY = "hatopiIndex_tutorialDone";
const INDEX_TUTORIAL_STEPS = [
  { selector: "#search", titleKey: "tutorial_index_step1_title", titleFallback: "① 検索する", textKey: "tutorial_index_step1_body", textFallback: "名前や出現場所のキーワードで検索できます。" },
  { selector: "#typeFilterRow", titleKey: "tutorial_index_step2_title", titleFallback: "② 種類を切り替え", textKey: "tutorial_index_step2_body", textFallback: "魚・虫・野鳥に加え、砂像・雪像・貝殻の表示にも切り替えられます。" },
  { selector: "#filterAccordionToggle", titleKey: "tutorial_index_step3_title", titleFallback: "③ 絞り込み・並び替え", textKey: "tutorial_index_step3_body", textFallback: "出現モードやレベル範囲、並び順などをここで細かく設定できます。" },
  { selector: "#list", titleKey: "tutorial_index_step4_title", titleFallback: "④ 一覧をタップ", textKey: "tutorial_index_step4_body", textFallback: "気になる生き物をタップすると、出現条件や売価などの詳細が確認できます。" },
  { selector: "#helpBtn", titleKey: "tutorial_index_step5_title", titleFallback: "⑤ 使い方をもっと見る", textKey: "tutorial_index_step5_body", textFallback: "このボタンからいつでも詳しい使い方を見返せます。" },
];

// 初期化
updateTime();
// 保存データ読込
searchInput.value =
  localStorage.getItem("searchKeyword") || "";
clearBtn.style.display =
  searchInput.value ? "flex" : "none";
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
setLimitedOnly(
  localStorage.getItem("limitedOnly") === "1"
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
  T("last_update_label","最終更新") + " 2026/08/30";

// 更新通知が表示中は、閉じた直後（closeUpdatePopup）にチュートリアルを開始する
if(document.getElementById("updatePopup").style.display !== "block"){
  maybeStartPageTutorial(INDEX_TUTORIAL_DONE_KEY, INDEX_TUTORIAL_STEPS);
}

// 言語切替時に動的コンテンツを再描画
document.addEventListener("langchange", ()=>{
  updateTime();
  updateLevelRange();
  document.getElementById("disclaimer").textContent =
    T("disclaimer","※本ツールは個人が制作した非公式のものです。ゲーム公式とは一切関係ありません。");
  document.getElementById("lastUpdate").textContent =
    T("last_update_label","最終更新") + " 2026/08/30";

  // モーダル表示中なら翻訳を反映して再表示
  if(modal && modal.style.display === "block" && modal.dataset.currentCreature){
    const target = creatures.find(c => c.name === modal.dataset.currentCreature);
    if(target) openModal(target);
  }

  renderDailySpots();
  updateDailySpotCalendarTabLabels();
  if(dailySpotCalendarModal && dailySpotCalendarModal.style.display === "block"){
    renderDailySpotCalendar();
  }
});

// ══════════════════════════════════════
// 蛍石・オークの木：今日の場所
// ══════════════════════════════════════

function dailySpotLabel(key){
  const spot = dailySpots[key];
  if(!spot) return key;
  const lang = i18n.getCurrentLang();
  return (spot.labelI18n && spot.labelI18n[lang]) ? spot.labelI18n[lang] : spot.label;
}

function renderDailySpots(){
  const grid = document.getElementById("dailySpotGrid");
  if(!grid || typeof dailySpots === "undefined") return;

  const pinIconEl = document.getElementById("dailySpotPinIcon");
  if(pinIconEl) pinIconEl.innerHTML = icon("pin", {size:15});
  const calIconEl = document.getElementById("dailySpotCalIcon");
  if(calIconEl) calIconEl.innerHTML = icon("calendar", {size:13});
  const calTitleIconEl = document.getElementById("dailySpotCalTitleIcon");
  if(calTitleIconEl) calTitleIconEl.innerHTML = icon("calendar", {size:16});
  const tasksIconEl = document.getElementById("dailyTasksIcon");
  if(tasksIconEl) tasksIconEl.innerHTML = icon("checklist", {size:13});
  const tasksTitleIconEl = document.getElementById("dailyTasksTitleIcon");
  if(tasksTitleIconEl) tasksTitleIconEl.innerHTML = icon("checklist", {size:16});
  const weeklyShopIconEl = document.getElementById("weeklyShopIcon");
  if(weeklyShopIconEl) weeklyShopIconEl.innerHTML = icon("gift", {size:13});
  const weeklyShopTitleIconEl = document.getElementById("weeklyShopTitleIcon");
  if(weeklyShopTitleIconEl) weeklyShopTitleIconEl.innerHTML = icon("gift", {size:16});

  grid.innerHTML = Object.keys(dailySpots).map(key => {
    const today = getDailySpotFor(key, 0);
    const spot = dailySpots[key];
    if(!today) return "";

    const img = today.image || spot.itemImg || "";

    return `
      <div class="daily-spot-item">
        ${img ? `<img src="${img}" alt="${dailySpotLabel(key)}" onerror="this.style.display='none'">` : ""}
        <div class="daily-spot-item-info">
          <div class="daily-spot-item-label">${dailySpotLabel(key)}</div>
          <div class="daily-spot-item-location">${today.location}</div>
        </div>
      </div>
    `;
  }).join("");
}

// ── カレンダーモーダル ──
const dailySpotCalendarModal = document.getElementById("dailySpotCalendarModal");
const dailySpotCalendarBtn   = document.getElementById("dailySpotCalendarBtn");
let currentDailySpotCalendarTab = "hotaru";

if(dailySpotCalendarBtn){
  dailySpotCalendarBtn.onclick = () => {
    updateDailySpotCalendarTabLabels();
    renderDailySpotCalendar();
    dailySpotCalendarModal.style.display = "block";
  };
}

function closeDailySpotCalendar(){
  if(dailySpotCalendarModal) dailySpotCalendarModal.style.display = "none";
}

function setDailySpotCalendarTab(key){
  currentDailySpotCalendarTab = key;
  ["hotaru","oak"].forEach(k=>{
    const btn = document.getElementById("calTab_"+k);
    if(btn) btn.classList.toggle("active", k === key);
  });
  renderDailySpotCalendar();
}

function updateDailySpotCalendarTabLabels(){
  if(typeof dailySpots === "undefined") return;
  ["hotaru","oak"].forEach(key=>{
    const btn = document.getElementById("calTab_"+key);
    if(btn){
      btn.textContent = dailySpotLabel(key);
    }
  });
}

function renderDailySpotCalendar(){
  const listEl = document.getElementById("dailySpotCalendarList");
  if(!listEl || typeof getDailySpotCalendar === "undefined") return;

  const days = getDailySpotCalendar(currentDailySpotCalendarTab, 30);

  listEl.innerHTML = days.map(d => {
    const isToday = d.offset === 0;
    // 表示用の日付ラベル（例: 07/26）
    const [, m, day] = d.dateKey.split("-");
    const dateLabel = `${m}/${day}`;
    return `
      <div class="daily-spot-calendar-row ${isToday ? "today" : ""}">
        <span class="daily-spot-calendar-date">${dateLabel}${isToday ? " " + T("daily_spot_today_tag","(今日)") : ""}</span>
        <span>${d.location}</span>
      </div>
    `;
  }).join("");
}

// 初期描画
renderDailySpots();
updateDailySpotCalendarTabLabels();

// ══════════════════════════════════════
// 今日やることリスト ダッシュボード
// ══════════════════════════════════════
const dailyTasksModal = document.getElementById("dailyTasksModal");
const dailyTasksBtn   = document.getElementById("dailyTasksBtn");

if(dailyTasksBtn){
  dailyTasksBtn.onclick = async () => {
    await Promise.all([
      loadScriptOnce("js/data-daily-tasks.js"),
      loadScriptOnce("js/data-events.js"),
      loadScriptOnce("js/data-codes.js"),
    ]);
    renderDailyTasks();
    dailyTasksModal.style.display = "block";
  };
}

function closeDailyTasksModal(){
  if(dailyTasksModal) dailyTasksModal.style.display = "none";
}

// ══════════════════════════════════════
// 週替わり商店リスト（毎週土曜AM6:00(JST)リセット）
// ══════════════════════════════════════
const weeklyShopModal = document.getElementById("weeklyShopModal");
const weeklyShopBtn   = document.getElementById("weeklyShopBtn");

if(weeklyShopBtn){
  weeklyShopBtn.onclick = async () => {
    await loadScriptOnce("js/data-weekly-tasks.js");
    renderWeeklyShopList();
    weeklyShopModal.style.display = "block";
  };
}

function closeWeeklyShopModal(){
  if(weeklyShopModal) weeklyShopModal.style.display = "none";
}

// 直近の「今週の更新（毎週土曜6:00 JST）」の開始時刻をYYYY-MM-DD文字列で返す。
// この文字列をチェック状態のキーにすることで、次のリセットを跨ぐと自動的に未チェック扱いに戻る
function getWeeklyCycleKey(){
  const jstNow = getJstDate();
  for(let offset = 0; offset <= 7; offset++){
    const candidate = new Date(jstNow);
    candidate.setUTCDate(candidate.getUTCDate() - offset);
    candidate.setUTCHours(6, 0, 0, 0);
    if(candidate.getUTCDay() === 6 && candidate.getTime() <= jstNow.getTime()){
      return candidate.toISOString().slice(0,10);
    }
  }
  return jstNow.toISOString().slice(0,10); // 理論上は到達しない保険
}

// 次回の土曜6:00(JST)までの残り時間
function getNextWeeklyResetMinutes(){
  const jstNow = getJstDate();
  for(let offset = 0; offset <= 7; offset++){
    const candidate = new Date(jstNow);
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    candidate.setUTCHours(6, 0, 0, 0);
    if(candidate.getUTCDay() === 6 && candidate.getTime() > jstNow.getTime()){
      return Math.round((candidate.getTime() - jstNow.getTime()) / 60000);
    }
  }
  return null;
}

function renderWeeklyShopList(){
  const body = document.getElementById("weeklyShopBody");
  const countdownEl = document.getElementById("weeklyShopCountdown");
  if(!body) return;

  const nextMinutes = getNextWeeklyResetMinutes();
  if(countdownEl){
    countdownEl.textContent = nextMinutes != null
      ? T("weekly_shop_countdown", `次のリセットまで：${formatMinutesUntil(nextMinutes)}`, { time: formatMinutesUntil(nextMinutes) })
      : "";
  }

  if(typeof weeklyShops === "undefined" || weeklyShops.length === 0){
    body.innerHTML = `<div class="daily-task-empty">${T("daily_tasks_no_data","データ未登録")}</div>`;
    return;
  }

  const cycleKey = getWeeklyCycleKey();
  const checks = JSON.parse(localStorage.getItem("weeklyShopChecks") || "{}");

  const sections = weeklyShops.map(shop => {
    const shopLabel = shop.shopI18n && shop.shopI18n[currentLang()] ? shop.shopI18n[currentLang()] : shop.shop;
    const rows = shop.items.map((item, i) => {
      const key = `${shop.id}_${i}`;
      const isChecked = checks[key] === cycleKey;
      const label = item.nameI18n && item.nameI18n[currentLang()] ? item.nameI18n[currentLang()] : item.name;
      const detail = item.detailI18n && item.detailI18n[currentLang()] ? item.detailI18n[currentLang()] : item.detail;
      const detailWithIcons = injectCurrencyIcons(detail);
      const thumb = item.img ? `<img class="daily-task-thumb" src="${item.img}" alt="" loading="lazy">` : "";
      return `
        <div class="daily-task-row">
          <div class="daily-task-main">
            ${thumb}
            <span class="daily-task-label">${label}<span class="daily-task-sub">${detailWithIcons}</span></span>
          </div>
          <label class="daily-task-checkbox">
            <input type="checkbox" ${isChecked ? "checked" : ""} onchange="toggleWeeklyShopCheck(this, '${key}')">
          </label>
        </div>
      `;
    }).join("");
    return sectionHTML("gift", shopLabel, rows);
  });

  body.innerHTML = sections.join("");
}

function toggleWeeklyShopCheck(checkboxEl, key){
  const checks = JSON.parse(localStorage.getItem("weeklyShopChecks") || "{}");
  const cycleKey = getWeeklyCycleKey();
  if(checkboxEl.checked){
    checks[key] = cycleKey;
  } else {
    delete checks[key];
  }
  localStorage.setItem("weeklyShopChecks", JSON.stringify(checks));
}

function renderDailyTasks(){
  const body = document.getElementById("dailyTasksBody");
  if(!body) return;

  const todayWeekday = getJstDate().getUTCDay();
  // 毎日更新系の曜日指定は6:00〜5:59を1日とみなして判定する（更新サイクルの境目に合わせるため）
  const resetDayWeekday = new Date(getJstDate().getTime() - 6 * 3600000).getUTCDay();
  let sectionSpots, sectionWeather, sectionQuests, sectionUpdates, sectionEnding, sectionVideos;

  // 蛍石・オークの木
  if(typeof dailySpots !== "undefined" && typeof getDailySpotFor === "function"){
    const spotRows = Object.keys(dailySpots).map(key => {
      const today = getDailySpotFor(key, 0);
      if(!today) return "";
      return `
        <div class="daily-task-row">
          <span class="daily-task-label">${dailySpotLabel(key)}</span>
          <span class="daily-task-value">${today.location}</span>
        </div>
      `;
    }).join("");
    sectionSpots = sectionHTML("pin", T("daily_tasks_section_spots","蛍石・オークの木"), spotRows);
  }

  // 今日の天気予報
  if(typeof weatherData !== "undefined"){
    const todayKey = getDateKey(0);
    const todayWeather = weatherData[todayKey] || {};
    // [zoneキー, JST開始時, JST終了時]
    const zones = [
      ["0-6", 0, 6],
      ["6-12", 6, 12],
      ["12-18", 12, 18],
      ["18-0", 18, 24],
    ];
    const weatherRows = zones.map(([z, startH, endH]) => {
      const w = todayWeather[z] || "不明";
      return `
      <div class="daily-task-row">
        <span class="daily-task-label">${formatServerZoneLabel(startH, endH)}</span>
        <span class="daily-task-value">${weatherIconHTML(w)}${translateWeatherWord(w)}</span>
      </div>
    `;
    }).join("");
    sectionWeather = sectionHTML(null, T("daily_tasks_section_weather","今日の天気"), weatherRows);
  }

  // 場所動画への誘導（流星雨・虹の日は天気から、ピンクバブルは曜日から判定。タップでvideos.htmlの該当カテゴリへ）
  {
    const HOUR = 3600000;
    const now = Date.now();

    // "YYYY-MM-DD"（JST基準のカレンダー日付）を、そのJST 0:00に対応する絶対時刻(ms)に変換
    // ※ブラウザのローカルタイムゾーンに依存させないため、UTC解釈から9時間分を差し引く
    const jstMidnight = (dateStr) => {
      const t = Date.parse(dateStr + "T00:00:00Z");
      return isNaN(t) ? NaN : t - 9 * HOUR;
    };

    // 指定の天気が発生したゾーンの開始から、windowHours以内かどうか（今日・昨日の2日分をチェック）
    const isRecentWeatherZone = (targetWeather, windowHours) => {
      if(typeof weatherData === "undefined") return false;
      const zoneDefs = [["6-12", 6], ["12-18", 12], ["18-0", 18], ["0-6", 0]];
      for(let offset = 0; offset <= 1; offset++){
        const dateKey = getDateKey(-offset);
        const dayWeather = weatherData[dateKey];
        if(!dayWeather) continue;
        const base = jstMidnight(dateKey);
        for(const [z, startH] of zoneDefs){
          if(dayWeather[z] !== targetWeather) continue;
          const start = base + startH * HOUR;
          if(now >= start && now < start + windowHours * HOUR) return true;
        }
      }
      return false;
    };

    const videoLinkRow = (iconName, label, cat) => `
      <a class="daily-task-row daily-task-link" href="videos.html?cat=${cat}">
        <span class="daily-task-label">${icon(iconName,{size:13})} ${label}</span>
        <span class="daily-task-value">›</span>
      </a>
    `;

    let videoRows = "";
    if(isRecentWeatherZone("流星雨", 24)){
      videoRows += videoLinkRow("weatherMeteor", T("daily_tasks_video_meteor","流星雨の欠片が拾えます"), "meteor_shower");
    }
    if(isRecentWeatherZone("虹", 6)){
      videoRows += videoLinkRow("weatherRainbow", T("daily_tasks_video_rainbow","虹の日が発生中です"), "rainbow_day");
    }
    if(todayWeekday === 5){
      videoRows += videoLinkRow("bubbles", T("daily_tasks_video_pink_bubble","明日までのピンクバブルはこちら"), "pink_bubble");
    }
    if(videoRows){
      sectionVideos = sectionHTML("play", T("daily_tasks_section_videos","場所動画"), videoRows);
    }
  }

  // 定時クエスト
  if(typeof dailyQuests !== "undefined" && dailyQuests.length > 0){
    const questRows = dailyQuests
      .filter(q => !q.weekdays || q.weekdays.includes(todayWeekday))
      .map(q => {
        const next = getNextQuestTime(q);
        const label = q.nameI18n && q.nameI18n[currentLang()] ? q.nameI18n[currentLang()] : q.name;
        // 末尾の「（〇〇主催）」部分は見やすいよう改行する
        const labelWithBreak = label.replace(/(.+?)(（[^）]*）)$/, "$1<br>$2");
        // 表示時刻は選択中サーバーのタイムゾーンに変換する（開催判定自体はJST固定のまま）
        const timesLabel = (q.times || []).map(jstTimeStrToServerDisplay).join(" / ");
        return `
          <div class="daily-task-row">
            <span class="daily-task-label">${labelWithBreak}<span class="daily-task-sub">${timesLabel}</span></span>
            <span class="daily-task-value">${next ? formatMinutesUntil(next.minutesUntil) : "-"}</span>
          </div>
        `;
      }).join("");
    sectionQuests = sectionHTML("clock", T("daily_tasks_section_quests","定時クエスト"), questRows);
  }

  // 毎日更新系
  if(typeof dailyUpdates !== "undefined" && dailyUpdates.length > 0){
    const visibleUpdates = dailyUpdates.filter(u => !u.weekdays || u.weekdays.includes(resetDayWeekday));
    const checks = JSON.parse(localStorage.getItem("dailyUpdateChecks") || "{}");

    // 表示中の項目はほぼ全て同じ更新時刻（デフォルト6:00）なので、
    // 一番近い次回更新までの時間をタイトル右側にまとめて表示する
    const nextTimes = visibleUpdates
      .map(getNextUpdateTime)
      .filter(Boolean)
      .sort((a,b) => a.minutesUntil - b.minutesUntil);
    const titleCountdown = nextTimes.length ? formatMinutesUntil(nextTimes[0].minutesUntil) : "";

    const updateRows = visibleUpdates.map(u => {
      const label = u.nameI18n && u.nameI18n[currentLang()] ? u.nameI18n[currentLang()] : u.name;
      const cycleKey = getUpdateCycleKey(u.resetTime);
      const isChecked = checks[u.name] === cycleKey;
      return `
        <div class="daily-task-row">
          <span class="daily-task-label">${label}</span>
          <label class="daily-task-checkbox">
            <input type="checkbox" ${isChecked ? "checked" : ""} onchange="toggleDailyUpdateCheck(this, '${u.name}', ${u.resetTime ? `'${u.resetTime}'` : "undefined"})">
          </label>
        </div>
      `;
    }).join("");
    sectionUpdates = sectionHTML("sprout", T("daily_tasks_section_updates","毎日更新系"), updateRows, titleCountdown);
  }

  // もうすぐ終わるもの
  if(typeof getEndingSoonItems === "function"){
    const endingSoon = getEndingSoonItems(3);
    if(endingSoon.length > 0){
      const typeLabel = {
        event_end: T("daily_tasks_type_event_end","イベント終了"),
        event_exchange: T("daily_tasks_type_event_exchange","交換期限"),
        code_expiry: T("daily_tasks_type_code_expiry","コード期限"),
      };
      const endingRows = endingSoon.map(item => `
        <div class="daily-task-row">
          <span class="daily-task-label">${item.name}<span class="daily-task-sub">${typeLabel[item.type] || ""}</span></span>
          <span class="daily-task-value highlight">${T("daily_tasks_days_left","あと{n}日").replace("{n}", item.daysLeft)}</span>
        </div>
      `).join("");
      sectionEnding = sectionHTML("warning", T("daily_tasks_section_ending","もうすぐ終わるもの"), endingRows);
    }
  }

  // 表示順: もうすぐ終わるもの → 場所動画 → 蛍石・オークの木 → 今日の天気 → 毎日更新系 → 定時クエスト
  const sections = [sectionEnding, sectionVideos, sectionSpots, sectionWeather, sectionUpdates, sectionQuests].filter(Boolean);

  body.innerHTML = sections.length
    ? sections.join("")
    : `<div class="daily-task-empty">${T("daily_tasks_empty","現在表示できる情報がありません")}</div>`;
}

function sectionHTML(iconName, title, rowsHTML, titleRight){
  return `
    <div class="daily-task-section">
      <div class="daily-task-section-title">
        <span class="daily-task-section-title-main">${icon(iconName,{size:14})} ${title}</span>
        ${titleRight ? `<span class="daily-task-section-title-right">${titleRight}</span>` : ""}
      </div>
      ${rowsHTML || `<div class="daily-task-empty">${T("daily_tasks_no_data","データ未登録")}</div>`}
    </div>
  `;
}

// JST基準の時刻(0〜24)を、現在選択中サーバーのタイムゾーンでの時刻に変換（表示専用）
// ※ 出現判定・更新判定などのロジックには使わないこと（常にJST固定のため）
function jstHourToServerDisplayHour(hour){
  const diff = getServerOffset() - 9;
  return ((hour + diff) % 24 + 24) % 24;
}

// "HH:MM"（JST）をサーバー選択に応じた表示用の "H:MM" に変換
function jstTimeStrToServerDisplay(hhmm){
  const [h, m] = hhmm.split(":").map(Number);
  const displayHour = jstHourToServerDisplayHour(h);
  return `${displayHour}:${String(m).padStart(2,"0")}`;
}

// 天気の時間帯（開始・終了ともJST）を、サーバー選択に応じた表示ラベルに変換
// 終了時刻がちょうど0時になる場合は「24:00」表記にする（既存の表記に合わせるため）
function formatServerZoneLabel(startHourJst, endHourJst){
  const start = jstHourToServerDisplayHour(startHourJst);
  let end = jstHourToServerDisplayHour(endHourJst);
  if(end === 0) end = 24;
  return `${start}:00〜${end}:00`;
}

// ── 毎日更新系チェックボックス ──
// 更新サイクル（resetTimeの時刻を境に切り替わる「今のサイクル」を表すYYYY-MM-DD）を計算
function getUpdateCycleKey(resetTime){
  const [h, m] = (resetTime || "06:00").split(":").map(Number);
  const jstNow = getJstDate();
  const base = new Date(jstNow);
  base.setUTCHours(h, m, 0, 0);
  const d = new Date(jstNow);
  if(jstNow.getTime() < base.getTime()){
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return d.toISOString().slice(0,10);
}

function toggleDailyUpdateCheck(checkboxEl, name, resetTime){
  const checks = JSON.parse(localStorage.getItem("dailyUpdateChecks") || "{}");
  const cycleKey = getUpdateCycleKey(resetTime);
  if(checkboxEl.checked){
    checks[name] = cycleKey;
  } else {
    delete checks[name];
  }
  localStorage.setItem("dailyUpdateChecks", JSON.stringify(checks));
}
