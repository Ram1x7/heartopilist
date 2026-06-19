// Q&Aデータ
// category: "question" = 質問, "request" = 要望, "bug" = 不具合
// status  : "fixed"(修正済み) / "progress"(対応中) / "considering"(検討中) / "wontfix"(対応見送り)
//           質問カテゴリにはstatus不要（null推奨）
// answer内で改行したい場合は \n を使ってください

const faqData = [
  {
    id: 1,
    category: "question",
    question: "認証マスターって何ですか？",
    answer: "ゲーム内の仕様で、同じ生き物を一定数獲得すると「認証マスター」の称号が得られます。図鑑カードの🎖ボタンでチェックできます。",
    status: null,
  },
  {
    id: 2,
    category: "bug",
    question: "ダークモード時、ポップアップの文字が見えにくい",
    answer: "ダークモード使用時に修正ポップアップの文字色が背景と被って見えにくくなっていた不具合です。",
    status: "fixed",
  },
  {
    id: 3,
    category: "request",
    question: "採取物・作物・花の図鑑も追加してほしい",
    answer: "ご要望ありがとうございます！現在実装を検討しています。データの整理ができ次第、追加予定です。",
    status: "considering",
  },
  // 以下、追加していく
  // {
  //   id: 4,
  //   category: "question",
  //   question: "",
  //   answer: "",
  //   status: null,
  // },
];
