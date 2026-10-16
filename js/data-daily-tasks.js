// 「今日やることリスト」ダッシュボード用データ
//
// ── 定時クエスト ──
// time: "HH:MM"（JST）で開催される毎日決まった時刻のクエスト
// 複数の時刻がある場合は times 配列に複数入れてください
// weekdays: 開催曜日を限定する場合のみ指定（0=日,1=月,...6=土）。省略時は毎日開催。
//
// ── 毎日更新系 ──
// 「家具屋の家具が毎日変わる」のような、時刻ではなく「1日1回更新される」タイプの項目
// resetTime: 更新される時刻（"HH:MM"、JST）。省略した場合は6:00（ゲーム内の日付更新時刻）扱い

const dailyQuests = [
  {
    name: "虫コイコイ（浪花主催）",
    nameI18n: {"ja":"虫コイコイ（浪花主催）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    times: ["11:00"],
    icon: "bug",
  },
  {
    name: "海釣り1号,2号（ビル主催）",
    nameI18n: {"ja":"海釣り1号,2号（ビル主催）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    times: ["12:00"],
    icon: "fish",
  },
  {
    name: "アヒルのジャンプステージ（ハリー主催）",
    nameI18n: {"ja":"アヒルのジャンプステージ（ハリー主催）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    times: ["14:00"],
    icon: "clock",
  },
  {
    name: "シャボン玉マシンチャレンジ（ビーチ客主催）",
    nameI18n: {"ja":"シャボン玉マシンチャレンジ（ビーチ客主催）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    times: ["15:00"],
    icon: "clock",
  },
  {
    name: "熱気球・花畑クルーズ（遠くを眺める少年主催）",
    nameI18n: {"ja":"熱気球・花畑クルーズ（遠くを眺める少年主催）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    times: ["16:00"],
    icon: "clock",
  },
  {
    name: "熱気球・町一周クルーズ（遠くを眺める少年主催）",
    nameI18n: {"ja":"熱気球・町一周クルーズ（遠くを眺める少年主催）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    times: ["16:30"],
    icon: "clock",
  },
  {
    name: "クエスト「巣ごもり」（ベイリー主催）",
    nameI18n: {"ja":"クエスト「巣ごもり」（ベイリー主催）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    times: ["17:00"],
    icon: "clock",
  },
  {
    name: "虫コイコイ（浪花主催）",
    nameI18n: {"ja":"虫コイコイ（浪花主催）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    times: ["20:00"],
    icon: "bug",
  },
  {
    name: "海洋清掃クエスト（オリバー主催）",
    nameI18n: {"ja":"海洋清掃クエスト（オリバー主催）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    times: ["20:30"],
    icon: "clock",
  },
  {
    name: "海釣り1号,2号（ビル主催）",
    nameI18n: {"ja":"海釣り1号,2号（ビル主催）","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    times: ["21:00"],
    icon: "fish",
  },
];

const dailyUpdates = [
  // ── 毎日 ──
  {
    name: "デイリー任務5個",
    nameI18n: {"ja":"デイリー任務5個","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    icon: "checklist",
  },
  {
    name: "花の交配",
    nameI18n: {"ja":"花の交配","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    icon: "flower",
  },
  {
    name: "ドロシーの服屋の服更新",
    nameI18n: {"ja":"ドロシーの服屋の服更新","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    icon: "shirt",
  },
  {
    name: "ボブおじさんの家具屋の１階家具更新",
    nameI18n: {"ja":"ボブおじさんの家具屋の１階家具更新","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    icon: "sofa",
  },
  {
    name: "ジョーンさんのペットショップのペット衣装更新",
    nameI18n: {"ja":"ジョーンさんのペットショップのペット衣装更新","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    icon: "shirt",
  },
  {
    name: "ベイリーへの情報カード提出",
    nameI18n: {"ja":"ベイリーへの情報カード提出","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    icon: "cardId",
  },
  {
    name: "カー・チンのパズル更新",
    nameI18n: {"ja":"カー・チンのパズル更新","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    icon: "dice",
  },
  {
    name: "マッシモから食材購入",
    nameI18n: {"ja":"マッシモから食材購入","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    icon: "ingredient",
  },

  // ── 金曜日 ──
  {
    name: "ホーム評価提出",
    nameI18n: {"ja":"ホーム評価提出","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    weekdays: [5],
    icon: "star",
  },
  {
    name: "週間購入制限系アイテムの買い忘れチェック",
    nameI18n: {"ja":"週間購入制限系アイテムの買い忘れチェック","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    weekdays: [5],
    icon: "warning",
  },
  {
    name: "週間リセット系アイテムの買い忘れチェック",
    nameI18n: {"ja":"週間リセット系アイテムの買い忘れチェック","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    weekdays: [5],
    icon: "warning",
  },
  {
    name: "ピンクバブルの取り忘れチェック",
    nameI18n: {"ja":"ピンクバブルの取り忘れチェック","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    weekdays: [5],
    icon: "warning",
  },

  // ── 土曜日 ──
  {
    name: "週間購入制限系アイテムのリセット",
    nameI18n: {"ja":"週間購入制限系アイテムのリセット","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    weekdays: [6],
    icon: "gift",
  },
  {
    name: "週間系アイテムのリセット",
    nameI18n: {"ja":"週間系アイテムのリセット","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    weekdays: [6],
    icon: "checklist",
  },
  {
    name: "ピンクバブル更新",
    nameI18n: {"ja":"ピンクバブル更新","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
    weekdays: [6],
    icon: "gift",
  },
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

  // 今日から7日先までの候補を作る（weekdays指定のクエストが1週間以上先になることはないため）
  for(let offset = 0; offset <= 7; offset++){
    quest.times.forEach(t => {
      candidates.push(timeStrToTodayDate(t, offset));
    });
  }

  // 開催曜日が指定されている場合はそれ以外を除外
  const onAllowedDay = quest.weekdays
    ? candidates.filter(d => quest.weekdays.includes(d.getUTCDay()))
    : candidates;

  // 現在時刻より後で最も近いものを選ぶ
  const future = onAllowedDay
    .filter(d => d.getTime() > jstNow.getTime())
    .sort((a, b) => a - b);

  if(future.length === 0) return null;

  const nextTime = future[0];
  const minutesUntil = Math.round((nextTime.getTime() - jstNow.getTime()) / 60000);
  return { nextTime, minutesUntil };
}

// 毎日更新系の「次の更新までの残り時間」を計算（更新時刻を過ぎていたら今日はもう更新済み扱い）
// weekdays が指定されている項目（金曜・土曜限定など）は、次に該当する曜日まで探す
function getNextUpdateTime(update){
  const resetTime = update.resetTime || "06:00";
  const jstNow = new Date(Date.now() + 9 * 3600 * 1000);

  for(let offset = 0; offset <= 7; offset++){
    const candidate = timeStrToTodayDate(resetTime, offset);
    if(update.weekdays && !update.weekdays.includes(candidate.getUTCDay())) continue;
    if(candidate.getTime() > jstNow.getTime()){
      const minutesUntil = Math.round((candidate.getTime() - jstNow.getTime()) / 60000);
      return { nextTime: candidate, minutesUntil };
    }
  }
  return null;
}

// 分数を "n分後" / "n時間m分後" / "n日m時間後" 形式の文字列に変換
function formatMinutesUntil(minutes){
  if(minutes < 60) return `${minutes}分後`;
  if(minutes < 1440){
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}時間後` : `${h}時間${m}分後`;
  }
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  return h === 0 ? `${d}日後` : `${d}日${h}時間後`;
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
