# はとぴ図鑑

Heartopia（ハートピアスローライフ）の攻略情報をまとめた非公式ファンツールです。
魚・虫・野鳥の出現情報から、料理レシピ、園芸、ペットのエサ管理、ギフトコード、イベント情報まで、ゲームプレイに必要な情報をひとつのサイトで確認できます。

🔗 https://ram1x7.github.io/heartopilist/

## ページ構成

| ページ | 内容 |
|---|---|
| 📖 図鑑（`index.html`） | 魚・虫・野鳥のリアルタイム出現情報 |
| 🍳 料理（`foods.html`） | 料理レシピと認証マスター計算ツール |
| 🌱 園芸（`garden.html`） | 作物・花の育成情報と収穫通知 |
| 🐾 ペット（`pet.html`） | ペットのエサ管理・進捗トラッキング |
| 🎁 コード（`codes.html`） | 有効なギフトコード一覧 |
| 🎉 イベント（`events.html`） | 開催中・開催予定のイベント／ガチャ情報 |
| ❓ Q&A（`faq.html`） | よくある質問・要望・不具合の対応状況 |

## 主な機能

### 📖 図鑑
- 現在の天気・時間帯に出現する魚・虫・野鳥をリアルタイム表示
- 種類別フィルター（魚 / 虫 / 野鳥）
- 出現モード切替（全表示 / 今の天気限定 / 今は出ないもの）
- 図鑑順・レベル順・未コンプ順・未認証順での並び替え
- レベル範囲の絞り込み
- 名前・出現場所での検索
- ⭐ コンプリートチェック機能（複数選択・一括チェック対応）
- 🎖 認証マスター記録機能（複数選択・一括チェック対応）
- コンプ状況のシェア画像生成・X（Twitter）投稿

### 🍳 料理
- 料理レシピ一覧（材料・材料費・売価・利益を表示）
- レア度（☆1〜☆5）ごとの売価比較
- 🏆 認証マスター計算ツール
  - 料理ごとに設定した目標作成数から、残り必要数を自動計算
  - 素材の所持数を入力すると、不足数をリアルタイム表示
  - 素材の所持数はグローバルな在庫として保存され、どの料理を選んでも共有される
  - 中間素材（他の料理を経由する素材）を実レシピまで自動分解して計算
  - 「〜ならなんでもOK」系の素材は自由入力で内訳を登録可能
- シーズン・フェス限定レシピの表示（開催状況バナー付き）

### 🌱 園芸
- 作物・花の成長時間、種の値段、売価一覧
- 花の交配で作れる色の一覧・組み合わせ例
- 🔔 収穫通知機能（Firebase Cloud Messaging によるバックグラウンドプッシュ通知）
  - 通常モード：収穫タイミングで通知
  - 草抜きモード：草抜きタイミング3回＋収穫時に通知
- カード上でのリアルタイムタイマー・進行バー表示
- シーズン・フェス限定の作物／花にも対応

### 🐾 ペット
- 複数ペットの登録・管理
- ペットごとのエサ優先度・進捗トラッキング
- データのバックアップ書き出し・読み込み（インポート／エクスポート）

### 🎁 ギフトコード
- 有効なコード一覧（タップでコピー可能）
- 期限切れコードの表示切替

### 🎉 イベント情報
- 開催中・開催予定のガチャ／イベント情報
- 開催期間・アイテム交換期限の表示

### ❓ Q&A
- 質問・要望・不具合の対応状況を一覧表示（対応済み／対応中／検討中／対応見送り）
- 匿名フォームからの問い合わせ受付

### 🌐 多言語対応
- 日本語 / 英語 / 韓国語 / タイ語 / 中国語（簡体字・繁体字）に対応
- 端末の言語設定を自動検出し、言語セレクターから手動切替も可能

### 共通機能
- ダークモード対応
- PWA対応（ホーム画面に追加してアプリのように起動可能）
- データはブラウザ内（LocalStorage）で管理

## 使い方

ブラウザでアクセスするだけで使えます。
ホーム画面に追加するとアプリのように起動できます。

🔗 https://ram1x7.github.io/heartopilist/

## 技術構成

- フロントエンド：素のHTML / CSS / JavaScript（フレームワーク不使用）
- ホスティング：GitHub Pages
- 通知機能：Firebase Cloud Messaging + Cloud Functions（Firestore）
- Firebase Functionsのデプロイは GitHub Actions で自動化（`functions/` 配下の変更時にトリガー）

### ディレクトリ構成（抜粋）

```
heartopilist/
├── index.html / foods.html / garden.html / pet.html
├── codes.html / events.html / faq.html
├── js/
│   ├── data-*.js       … 各ページのデータ定義
│   ├── main.js          … 図鑑ページのロジック
│   ├── food-auth-calc.js … 認証マスター計算ツール
│   ├── i18n.js           … 多言語対応
│   └── firebase-init.js  … 通知機能の初期化
├── locales/              … 多言語翻訳ファイル（ja / en / ko / th / zh-CN / zh-TW）
├── images/ / fish/ / bugs/ / birds/ … 画像アセット
├── functions/             … Firebase Cloud Functions（通知API）
└── manifest.json          … PWA設定
```

## 注意事項

- 本ツールは個人が制作した非公式のファンツールです
- ゲーム公式・開発元とは一切関係ありません
- データはブラウザ内（LocalStorage）のみで管理され、外部に送信されることはありません
- 収穫通知機能はホーム画面に追加し、通知を許可した状態でのみ利用できます

## お問い合わせ

不具合報告・機能リクエスト・感想は以下からどうぞ。

- X（旧Twitter）：[@_Ram1x](https://x.com/_ram1x?s=21)
- 匿名フォーム：https://forms.gle/Ns7ZrJyv4b45v5QNA

＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿

# Hatopi Zukan (はとぴ図鑑)

An unofficial fan tool that collects everything you need for Heartopia
(Heartopia Slow Life) in one place — from real-time fish/bug/bird
tracking to recipes, gardening, pet food management, gift codes, and
event info.

🔗 https://ram1x7.github.io/heartopilist/

## Pages

| Page | Description |
|---|---|
| 📖 Encyclopedia (`index.html`) | Real-time fish, bug, and bird spawn info |
| 🍳 Recipes (`foods.html`) | Cooking recipes and a master certification calculator |
| 🌱 Garden (`garden.html`) | Crop/flower growth info and harvest notifications |
| 🐾 Pet (`pet.html`) | Pet food management and progress tracking |
| 🎁 Codes (`codes.html`) | List of active gift codes |
| 🎉 Events (`events.html`) | Ongoing and upcoming events/gacha info |
| ❓ Q&A (`faq.html`) | FAQ, feature requests, and bug status |

## Features

### 📖 Encyclopedia
- Real-time display of fish, bugs, and birds based on current weather and time
- Filter by type: fish, bugs, or birds
- Appearance mode switching (All / Current weather only / Not appearing now)
- Sort by: Pokédex order / Level / Incomplete first / Uncertified first
- Level range filter
- Search by name or location
- ⭐ Completion check (multi-select, bulk check supported)
- 🎖 Authentication Master record (multi-select, bulk check supported)
- Share card image generation & X (Twitter) post

### 🍳 Recipes
- Full recipe list with ingredients, cost, sell price, and profit
- Sell price comparison across rarity (☆1–☆5)
- 🏆 Master certification calculator
  - Set a target count per recipe and see the remaining amount needed
  - Enter materials on hand to see real-time shortages
  - Material inventory is shared globally across all recipes
  - Automatically breaks down intermediate ingredients (recipes used as materials) into their base ingredients
  - Free-form input for "any of category X" ingredient slots
- Seasonal/festival-limited recipes with an active/ended status banner

### 🌱 Garden
- Growth time, seed price, and sell price for crops and flowers
- List of breedable flower colors with combination examples
- 🔔 Harvest notifications via Firebase Cloud Messaging (background push)
  - Normal mode: notify at harvest time
  - Weeding mode: 3 weeding alerts + harvest notification
- Live countdown timer and progress bar on each card
- Support for seasonal/festival-limited crops and flowers

### 🐾 Pet
- Manage multiple pets
- Per-pet food priority and progress tracking
- Backup export/import for your data

### 🎁 Gift Codes
- List of active codes (tap to copy)
- Toggle to show expired codes

### 🎉 Events
- Ongoing and upcoming gacha/event info
- Event duration and item exchange deadlines

### ❓ Q&A
- Status tracking for questions, feature requests, and bug reports
  (fixed / in progress / considering / won't fix)
- Anonymous contact form

### 🌐 Multi-language support
- Available in Japanese / English / Korean / Thai / Chinese (Simplified & Traditional)
- Auto-detects your device language, with a manual language switcher

### Shared features
- Dark mode support
- PWA support (add to home screen to use like an app)
- All data is stored locally in your browser (LocalStorage)

## How to Use

Just open the link in your browser — no installation needed.
You can also add it to your home screen to use it like an app.

🔗 https://ram1x7.github.io/heartopilist/

## Tech Stack

- Frontend: Vanilla HTML / CSS / JavaScript (no framework)
- Hosting: GitHub Pages
- Notifications: Firebase Cloud Messaging + Cloud Functions (Firestore)
- Firebase Functions are deployed automatically via GitHub Actions
  (triggered on changes under `functions/`)

## Disclaimer

- This is an unofficial fan-made tool and is not affiliated with
  the official game or its developers in any way.
- All data is stored locally in your browser (LocalStorage) only and is never sent externally.
- Harvest notifications only work when the site is added to your home screen
  and notification permission has been granted.

## Contact

Bug reports, feature requests, and feedback are welcome.

- X (Twitter)：[@_Ram1x](https://x.com/_ram1x?s=21)
- Anonymous form：https://forms.gle/Ns7ZrJyv4b45v5QNA
