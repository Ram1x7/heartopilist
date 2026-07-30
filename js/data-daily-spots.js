// 蛍石・オークの木の出現場所（50日周期）
//
// ── データの入れ方 ──
// 1. BASE_DATE : 周期の起算日（"YYYY-MM-DD"、JST基準）。LOCATIONS配列の1番目(index0)に対応する日付。
// 2. LOCATIONS : BASE_DATEを1日目として、50日分の場所名を順番に並べる配列
//    （51日目からはまた1番目の場所に戻る＝周期する）
// 3. 画像を表示したい場合は LOCATION_IMAGES に「場所名: 画像パス」を登録する
//
// 2026-07-26時点で周期表の23番目（=温泉山4番地/温泉山1番地）が「今日」となるよう、
// BASE_DATEは23番目から22日前の 2026-07-04 に設定しています。

const dailySpots = {

  hotaru: { // 蛍石
    label: "蛍石",
    labelI18n:{"ja":"蛍石","en":"Firefly Stone","zh-CN":"萤石","zh-TW":"螢石","ko":"반딧불이 돌","th":"หินหิ่งห้อย"},
    icon: "💎",
    BASE_DATE: "2026-07-04",
    LOCATIONS: [
      "6番地","2番地","2番地","3番地","12番地","4番地","温泉山-遺跡","8番地","5番地","4番地",
      "11番地","温泉山-遺跡","8番地","8番地","2番地","2番地","2番地","1番地","1番地","4番地",
      "4番地","4番地","1番地","温泉山-遺跡","8番地","8番地","6番地","2番地","2番地","温泉山-遺跡",
      "5番地","11番地","11番地","2番地","12番地","4番地","11番地","7番地","9番地","4番地",
      "4番地","11番地","5番地","8番地","7番地","7番地","9番地","7番地","6番地","11番地"
    ],
    LOCATION_IMAGES: {
      // 全地点共通で1枚の画像を使う場合は itemImg のみでOK。
      // 場所ごとに別画像を出したい場合はここに追加してください。
      // "温泉山-遺跡": "images/hotaruishi_iseki.PNG",
    },
    itemImg: "images/hotaruishi.PNG"
  },

  oak: { // オークの木
    label: "オークの木",
    labelI18n:{"ja":"オークの木","en":"Oak Tree","zh-CN":"橡树","zh-TW":"橡樹","ko":"참나무","th":"ต้นโอ๊ก"},
    icon: "🌳",
    BASE_DATE: "2026-07-04",
    LOCATIONS: [
      "7番地","6番地","11番地","2番地","12番地","11番地","12番地","不思議な松林","2番地","1番地",
      "10番地","5番地","10番地","4番地","7番地","3番地","不思議な松林","3番地","5番地","12番地",
      "2番地","8番地","4番地","8番地","6番地","8番地","12番地","10番地","7番地","12番地",
      "8番地","6番地","11番地","2番地","9番地","3番地","6番地","2番地","11番地","不思議な松林",
      "不思議な松林","11番地","9番地","10番地","9番地","6番地","5番地","3番地","10番地","不思議な松林"
    ],
    LOCATION_IMAGES: {
      // "不思議な松林": "images/oku_matsubayashi.PNG",
    },
    itemImg: "images/o-ku.PNG"
  }

};

// JST基準の日付キー（YYYY-MM-DD）を取得
// ゲーム内の「今日」の日付キー（YYYY-MM-DD）を取得
// このゲームは JST 6:00 が日付更新のため、JST 0:00〜5:59 はまだ「前日」扱いになる。
// 例）7/26 5:59 JST までは "2026-07-26" ではなく "2026-07-25" を返す
//     7/26 6:00 JST になった瞬間から "2026-07-26" を返す
// offsetDays はこの「ゲーム内の今日」からさらに何日後/前かを指定する
function getDailySpotDateKey(offsetDays = 0){
  const jstNow = new Date(Date.now() + 9 * 3600 * 1000); // JSTの現在時刻
  // 6時間分を引くことで「6:00更新」を「0:00更新」の暦日計算に変換する
  jstNow.setUTCHours(jstNow.getUTCHours() - 6);
  jstNow.setUTCDate(jstNow.getUTCDate() + offsetDays);
  return jstNow.toISOString().slice(0, 10);
}

// 2つの日付キー（YYYY-MM-DD）の日数差を計算
function daysBetween(dateKeyA, dateKeyB){
  const a = new Date(dateKeyA + "T00:00:00Z");
  const b = new Date(dateKeyB + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

// 指定した日（offsetDays日後、デフォルト0=今日）の場所を取得
// 戻り値: { location, image } または null（データ未設定時）
function getDailySpotFor(key, offsetDays = 0){
  const spot = dailySpots[key];
  if(!spot || !spot.LOCATIONS || spot.LOCATIONS.length === 0) return null;

  const todayKey = getDailySpotDateKey(offsetDays);
  const diff = daysBetween(spot.BASE_DATE, todayKey);
  const cycleLen = spot.LOCATIONS.length; // 通常50
  const idx = ((diff % cycleLen) + cycleLen) % cycleLen;

  const location = spot.LOCATIONS[idx];
  const image = spot.LOCATION_IMAGES && spot.LOCATION_IMAGES[location]
    ? spot.LOCATION_IMAGES[location]
    : null;

  return { location, image, dateKey: todayKey };
}

// 指定した日数分（今日からdays日間）の場所一覧を取得（カレンダー表示用）
function getDailySpotCalendar(key, days = 30){
  const result = [];
  for(let i = 0; i < days; i++){
    const spot = getDailySpotFor(key, i);
    if(spot) result.push({ offset: i, ...spot });
  }
  return result;
}
