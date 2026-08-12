// js/data-videos.js
// 「場所動画」ページ用データ。YouTubeに投稿した動画を手動で追加する。
//
// category: "pink_bubble"（ピンクバブル・毎週） / "rainbow_day"（虹の日・不定期） / "meteor_shower"（流星雨・不定期）
// date:     動画で紹介している回の日付（YYYY-MM-DD）。新しい順に自動で並ぶ。
// videoId:  YouTube動画のID（URLの https://www.youtube.com/watch?v=◯◯◯ の ◯◯◯ の部分）
// note:     任意。動画の下に表示する一言メモ（省略可）
//
// 例:
// { category:"pink_bubble", date:"2026-08-10", videoId:"dQw4w9WgXcQ", note:"" },

const videoData = [
  { category:"rainbow_day", date:"2026-01-17", videoId:"sSAFnXMJEyc", note:"18:00~24:00" },
  { category:"meteor_shower", date:"2026-01-24", videoId:"NseJtUPwK7g", note:"18:00~24:00" },
  { category:"pink_bubble", date:"2026-03-28", videoId:"_R5hpYsCPBc", note:"3/28 6:00~4/3 5:59" },
];
