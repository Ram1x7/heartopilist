// イベント・ガチャデータ
// category: "gacha" = ガチャ, "event" = イベント
// start/end: "YYYY-MM-DD HH:MM" 形式。未定の場合は null
// img: バナー画像パス。なければ null
// link: 公式リンク。なければ null

const eventData = [
  {
    id: 1,
    category: "gacha",
    name: "サンプルガチャ",
    img: null,
    start: "2026-06-01 00:00",
    end: "2026-07-01 00:59",
    detail: "限定衣装が登場！期間限定の特別ガチャです。",
    link: null,
  },
  {
    id: 2,
    category: "event",
    name: "サンプルイベント",
    img: null,
    start: "2026-06-15 00:00",
    end: "2026-07-15 00:59",
    detail: "期間限定のイベントクエストが登場。\n報酬に限定アイテムあり。",
    link: null,
  },
  // 以下、イベントを追加していく
  // {
  //   id: 3,
  //   category: "event",
  //   name: "夏祭りイベント",
  //   img: "./images/events/summer.png",
  //   start: "2026-07-10 00:00",
  //   end: "2026-07-31 00:59",
  //   detail: "夏限定のイベントです。",
  //   link: null,
  // },
];
