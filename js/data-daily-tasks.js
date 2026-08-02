// 「今日やることリスト」ダッシュボード用データ
//
// ── 定時クエスト ──
// time: "HH:MM"（JST）で開催される毎日決まった時刻のクエスト
// 複数の時刻がある場合は times 配列に複数入れてください
//
// ── 毎日更新系 ──
// 「家具屋の家具が毎日変わる」のような、時刻ではなく「1日1回更新される」タイプの項目
// resetTime: 更新される時刻（"HH:MM"、JST）。省略した場合は6:00（ゲーム内の日付更新時刻）扱い

const dailyQuests = [
  // 例：
  // {
  //   name: "虫コイコイクエスト",
  //   nameI18n: {"ja":"虫コイコイクエスト","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  //   times: ["10:00", "22:00"],
  //   location: "森林",
  //   locationI18n: {"ja":"森林","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  //   icon: "bug",
  //   note: ""
  // },
];

const dailyUpdates = [
  // 例：
  // {
  //   name: "家具屋1階の家具更新",
  //   nameI18n: {"ja":"家具屋1階の家具更新","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  //   resetTime: "06:00",
  //   icon: "sofa",
  //   note: ""
  // },
  // {
  //   name: "服屋の服更新",
  //   nameI18n: {"ja":"服屋の服更新","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  //   resetTime: "06:00",
  //   icon: "shirt",
  //   note: ""
  // },
  // {
  //   name: "ベイリーへ情報カード提出",
  //   nameI18n: {"ja":"ベイリーへ情報カード提出","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  //   resetTime: "06:00",
  //   icon: "cardId",
  //   note: ""
  // },
];

// ── ヘルパー関数 ──

// "HH:MM" を今日の Date オブジェクトに変換（JST基準）
function timeStrToTodayDate(hhmm, offsetDays = 0){
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date(Date.now() + 9 * 3600 * 1000); // JST
  now.setUTCHours(h, m, 0, 0);
  now.setUTCDate(now.getUTCDate() + offsetDays);
  return now;
}

// 定時クエストの「次の開催時刻までの残り時間」を計算
// 戻り値: { nextTime: Date, minutesUntil: number } または null
function getNextQuestTime(quest){
  if(!quest.times || quest.times.length === 0) return null;

  const jstNow = new Date(Date.now() + 9 * 3600 * 1000);
  const candidates = [];

  // 今日と明日の候補を作る
  [0, 1].forEach(offset => {
    quest.times.forEach(t => {
      candidates.push(timeStrToTodayDate(t, offset));
    });
  });

  // 現在時刻より後で最も近いものを選ぶ
  const future = candidates
    .filter(d => d.getTime() > jstNow.getTime())
    .sort((a, b) => a - b);

  if(future.length === 0) return null;

  const nextTime = future[0];
  const minutesUntil = Math.round((nextTime.getTime() - jstNow.getTime()) / 60000);
  return { nextTime, minutesUntil };
}

// 毎日更新系の「次の更新までの残り時間」を計算（更新時刻を過ぎていたら今日はもう更新済み扱い）
function getNextUpdateTime(update){
  const resetTime = update.resetTime || "06:00";
  const jstNow = new Date(Date.now() + 9 * 3600 * 1000);

  let next = timeStrToTodayDate(resetTime, 0);
  if(next.getTime() <= jstNow.getTime()){
    next = timeStrToTodayDate(resetTime, 1);
  }

  const minutesUntil = Math.round((next.getTime() - jstNow.getTime()) / 60000);
  return { nextTime: next, minutesUntil };
}

// 分数を "n時間m分" 形式の文字列に変換
function formatMinutesUntil(minutes){
  if(minutes < 60) return `${minutes}分後`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if(m === 0) return `${h}時間後`;
  return `${h}時間${m}分後`;
}

// ── 「もうすぐ終わるもの」抽出 ──
// events.html の eventsData / codes.html の codesData から、
// 期限が近いもの（デフォルト3日以内）を抽出する。
// どちらのデータも読み込まれていないページでは空配列を返す。

// "YYYY-MM-DD HH:MM" または "YYYY-MM-DD" 形式の日時文字列をJSTのDateに変換
function parseJstDateTimeStr(str){
  if(!str) return null;
  const [datePart, timePart] = str.split(" ");
  const [y, mo, d] = datePart.split("-").map(Number);
  let h = 0, mi = 0;
  if(timePart){
    [h, mi] = timePart.split(":").map(Number);
  }
  // JSTの日時として組み立て、UTC相当のミリ秒に変換
  return new Date(Date.UTC(y, mo - 1, d, h - 9, mi));
}

// 現在時刻から指定日数以内に終了/期限切れになるものを集める
// 戻り値: [{ type: "event_end"|"event_exchange"|"code_expiry", name, deadline: Date, daysLeft }]
function getEndingSoonItems(withinDays = 3){
  const nowUtcEquiv = new Date(Date.now());
  const result = [];

  // イベントの終了日・交換期限
  if(typeof eventData !== "undefined"){
    eventData.forEach(ev => {
      if(ev.end){
        const endDate = parseJstDateTimeStr(ev.end);
        if(endDate){
          const daysLeft = (endDate.getTime() - nowUtcEquiv.getTime()) / 86400000;
          if(daysLeft > 0 && daysLeft <= withinDays){
            result.push({ type:"event_end", name: ev.name, deadline: endDate, daysLeft: Math.ceil(daysLeft) });
          }
        }
      }
      if(ev.exchangeEnd){
        const exDate = parseJstDateTimeStr(ev.exchangeEnd);
        if(exDate){
          const daysLeft = (exDate.getTime() - nowUtcEquiv.getTime()) / 86400000;
          if(daysLeft > 0 && daysLeft <= withinDays){
            result.push({ type:"event_exchange", name: ev.name, deadline: exDate, daysLeft: Math.ceil(daysLeft) });
          }
        }
      }
    });
  }

  // ギフトコードの期限
  if(typeof codesData !== "undefined"){
    codesData.forEach(c => {
      if(c.active === false) return;
      if(c.expiry){
        const expDate = parseJstDateTimeStr(c.expiry);
        if(expDate){
          const daysLeft = (expDate.getTime() - nowUtcEquiv.getTime()) / 86400000;
          if(daysLeft > 0 && daysLeft <= withinDays){
            result.push({ type:"code_expiry", name: c.code, deadline: expDate, daysLeft: Math.ceil(daysLeft) });
          }
        }
      }
    });
  }

  result.sort((a, b) => a.deadline - b.deadline);
  return result;
}
