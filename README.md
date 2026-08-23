# はとぴ図鑑

Heartopia（ハートピアスローライフ）の攻略情報をまとめた非公式ファンツールです。
魚・虫・野鳥の出現情報から、料理レシピ、園芸、ペットのエサ管理、商店アイテム、ギフトコード、イベント情報まで、ゲームプレイに必要な情報をひとつのサイトで確認できます。

https://ram1x7.github.io/heartopilist/

## ページ構成

| ページ | 内容 |
|---|---|
| 図鑑（`index.html`） | 魚・虫・野鳥のリアルタイム出現情報、今日やることリスト |
| 料理（`foods.html`） | 料理レシピと認証マスター計算ツール |
| 園芸（`garden.html`） | 作物・花の育成情報と収穫通知 |
| ペット（`pet.html`） | ペットのエサ管理・進捗トラッキング |
| 商店（`shop.html`） | シーズン限定アイテムの購入状況トラッキング |
| コード（`codes.html`） | 有効なギフトコード一覧 |
| イベント（`events.html`） | 開催中・開催予定のイベント／ガチャ情報 |
| 場所動画（`videos.html`） | ピンクバブル・虹の日・流星雨の発生記録動画 |
| アート（`art-create.html`） | ドット絵デザインの作成・変換・3Dプレビュー（`art-convert.html`は「画像から作る」単体ページ） |
| 楽譜（`music.html`） | 数字譜（簡譜）の作成・自動採譜・演奏練習 |
| Q&A（`faq.html`） | よくある質問・要望・不具合の対応状況 |

## 主な機能

### 図鑑
- 現在の天気・時間帯に出現する魚・虫・野鳥・砂像・雪像・貝殻をリアルタイム表示
- 種類別フィルター
- 出現モード切替（全表示 / 今の天気限定 / 今は出ないもの）
- 図鑑順・レベル順・未コンプ順・未認証順での並び替え
- レベル範囲の絞り込み
- 名前・出現場所での検索
- コンプリートチェック機能（複数選択・一括チェック対応）
- 認証マスター記録機能（複数選択・一括チェック対応）
- コンプ状況のシェア画像生成・X（Twitter）投稿
- サーバー選択による表示時間帯の切替（判定は常に日本時間基準）
- 蛍石・オークの木の今日の出現場所・出現カレンダー
- 今日やることリスト（今日の天気予報、定時クエストの残り時間、毎日更新項目のチェックリスト、もうすぐ終わるイベント・コードのまとめ表示）

### 料理
- 料理レシピ一覧（材料・材料費・売価・利益を表示）
- レア度（☆1〜☆5）ごとの売価比較
- 認証マスター計算ツール
  - 料理ごとに設定した目標作成数から、残り必要数を自動計算
  - 素材の所持数を入力すると、不足数をリアルタイム表示
  - 素材の所持数はグローバルな在庫として保存され、どの料理を選んでも共有される
  - 中間素材（他の料理を経由する素材）を実レシピまで自動分解して計算
  - 「〜ならなんでもOK」系の素材は自由入力で内訳を登録可能
- シーズン・フェス限定レシピの表示（開催状況バナー付き）

### 園芸
- 作物・花の成長時間、種の値段、売価一覧
- 花の交配で作れる色の一覧・組み合わせ例（その花で実際に作れる色のみ表示）
- 収穫通知機能（Firebase Cloud Messaging によるバックグラウンドプッシュ通知）
  - 通常モード：収穫タイミングで通知
  - 草抜きモード：草抜きタイミング3回＋収穫時に通知
- カード上でのリアルタイムタイマー・進行バー表示
- シーズン・フェス限定の作物／花にも対応

### ペット
- 複数ペットの登録・管理（犬・猫）
- エサの好き嫌い記録・優先順位に応じた自動並び替え
- エサ名での検索
- 進捗トラッキング
- データのバックアップ書き出し・読み込み（インポート／エクスポート）

### 商店
- シーズン限定商品の一覧・価格・購入制限数の表示
- 購入済みチェック機能・進捗表示
- アイテム名での検索、未所持順での並び替え

### ギフトコード
- 有効なコード一覧（タップでコピー可能）
- 期限切れコードの表示切替

### イベント情報
- 開催中・開催予定のガチャ／イベント情報
- 開催期間・アイテム交換期限の表示

### 場所動画
- ピンクバブル（毎週）・虹の日（不定期）・流星雨（不定期）の発生記録動画をカテゴリごとにまとめて視聴
- カテゴリタブ切り替え、日付をタップすると動画がその場で展開再生
- 直近発生したものは自動的に展開表示（流星雨は発生から24時間以内、虹の日は6時間以内、ピンクバブルはその週の間）
- 図鑑ページの「今日やることリスト」から、該当カテゴリへワンタップで移動可能

### アート
- ドット絵デザインの作成ツール（ペン・消しゴム・バケツ・スポイト・直線/四角/円などの図形ツール、太さ変更、色の置き換え、反転・移動）
- ゲーム内で実際に選べる色と完全一致したカラーパレット
- デザイン枠（衣装・家具などの実寸キャンバス）の輪郭線表示、10×10ブロック表示・進捗記録
- 画像から作る（写真・イラストをドット絵に自動変換。色数・ディザリング・背景処理などを調整可能）
- スクショから取り込む（ゲーム内デザイン画面のスクリーンショットをアップロードすると、画面に写り込む補助線を照合してキャンバスと位置を自動判定。自動判定が難しい場合は候補一覧からの手動選択や、範囲のドラッグ移動・リサイズによる手動調整も可能）
- ぬり方ガイド（10×10ブロックごとに効率のいい塗り順を自動ズームで案内、残り時間の目安、完了までの進捗記録）
- 3Dプレビュー（試験公開。対応キャンバスをドラッグで回転させて立体的に確認）
- マイデザイン一覧（未着手／作業中／完了のステータス管理、進捗％表示）
- PNGエクスポート・画像共有
- 共有コード（アカウント不要で、デザインを文字列・URL・QRコードとしてバックアップ・受け渡し。サーバー送信なし）
- 拡大率スライダー・ピンチズーム、マスの座標・使用色番号の確認機能
- 完全オフライン対応（アカウント登録不要、データはブラウザ内のみに保存）

### 楽譜
- 数字譜（簡譜）エディタ。楽器を選び、音の長さを指定してタップ入力、または演奏しながら録音してそのまま譜面化（複数同時押しで和音も記録）
- ハミングから作る／音源から作る／動画から作る：鼻歌の録音や既存の音声・動画ファイルから自動で採譜し、譜面を生成
- テンポ（BPM）・拍子の設定、休符の追加、区間リピート（苦手な部分だけを選んで繰り返し練習）
- 練習モード：譜面と演奏ボタンのみの全画面表示。実機と同じ指の感覚になるよう自動レイアウトされ、譜面を0.1〜1.0倍速で自動再生しながらタップ練習ができる。演奏ボタンの位置・大きさは実機画面の写真を重ねながら微調整可能
- 追従モード：iPadの分割画面（Split View）などで実機と並べて使う想定の、次に弾く音を大きく表示するモード
- 保存・一覧から呼び出し（アカウント不要、ブラウザ内保存のみ）

### Q&A
- 質問・要望・不具合の対応状況を一覧表示（対応済み／対応中／検討中／対応見送り）
- 匿名フォームからの問い合わせ受付

### データ同期
- コンプ状況・認証記録・料理計算機・園芸通知設定・ペットデータ・商店チェック状況など、サイト全体のデータをファイルとして書き出し・読み込みできます
- 機種変更やブラウザの変更時のバックアップ、複数端末間でのデータ引き継ぎに利用できます
- サーバーには一切送信されず、書き出したファイルを手動でやり取りする方式です

### 多言語対応
- 日本語 / 英語 / 韓国語 / タイ語 / 中国語（簡体字・繁体字）に対応
- 端末の言語設定を自動検出し、言語セレクターから手動切替も可能

### 共通機能
- ダークモード対応
- PWA対応（ホーム画面に追加してアプリのように起動可能）
- データはブラウザ内（LocalStorage）で管理

## 使い方

ブラウザでアクセスするだけで使えます。
ホーム画面に追加するとアプリのように起動できます。

https://ram1x7.github.io/heartopilist/

## 技術構成

- フロントエンド：素のHTML / CSS / JavaScript（フレームワーク不使用）
- ホスティング：GitHub Pages
- 通知機能：Firebase Cloud Messaging + Cloud Functions（Firestore）
- Firebase Functionsのデプロイは GitHub Actions で自動化（`functions/` 配下の変更時にトリガー）

### ディレクトリ構成（抜粋）

```
heartopilist/
├── index.html / foods.html / garden.html / pet.html / shop.html
├── codes.html / events.html / videos.html / faq.html
├── art-create.html / art-convert.html      … アートページ（作成 / 画像から作る単体ページ）
├── music.html                                … 楽譜ページ
├── js/
│   ├── data-*.js          … 各ページのデータ定義
│   ├── main.js             … 図鑑ページのロジック
│   ├── shop.js              … 商店ページのロジック
│   ├── food-auth-calc.js    … 認証マスター計算ツール
│   ├── data-sync.js         … データ同期（書き出し・読み込み）
│   ├── i18n.js               … 多言語対応
│   ├── firebase-init.js      … 通知機能の初期化
│   ├── art-editor.js / art-config.js / art-masks.js … アートページ本体・キャンバス定義・輪郭線データ
│   ├── art-converter.js / art-pixelate.js            … 画像→ドット絵変換の共通処理
│   ├── art-template-match.js / art-screenshot-import.js … スクショから取り込む機能（補助線照合）
│   ├── art-paint-guide.js / art-3d.js / art-share-code.js … ぬり方ガイド・3Dプレビュー・共有コード
│   └── music-editor.js / music-config.js / music-hum.js … 楽譜エディタ本体・設定・自動採譜
├── locales/                  … 多言語翻訳ファイル（ja / en / ko / th / zh-CN / zh-TW）
├── images/ / fish/ / bugs/ / birds/ … 画像アセット
├── functions/                 … Firebase Cloud Functions（通知API）
├── tools/                      … 天気データ入力・検証ツール
└── manifest.json               … PWA設定
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
tracking to recipes, gardening, pet food management, trend shop tracking,
gift codes, and event info.

https://ram1x7.github.io/heartopilist/

## Pages

| Page | Description |
|---|---|
| Encyclopedia (`index.html`) | Real-time fish, bug, and bird spawn info, plus a daily to-do dashboard |
| Recipes (`foods.html`) | Cooking recipes and a master certification calculator |
| Garden (`garden.html`) | Crop/flower growth info and harvest notifications |
| Pet (`pet.html`) | Pet food management and progress tracking |
| Shop (`shop.html`) | Seasonal trend shop purchase tracking |
| Codes (`codes.html`) | List of active gift codes |
| Events (`events.html`) | Ongoing and upcoming events/gacha info |
| Location Videos (`videos.html`) | Pink Bubble / Rainbow Day / Meteor Shower footage archive |
| Art (`art-create.html`) | Pixel art design creation, image conversion, and 3D preview (`art-convert.html` is a standalone "create from image" page) |
| Sheet Music (`music.html`) | Numbered-notation sheet music editor, auto-transcription, and performance practice |
| Q&A (`faq.html`) | FAQ, feature requests, and bug status |

## Features

### Encyclopedia
- Real-time display of fish, bugs, birds, sand sculptures, snow sculptures, and shells based on current weather and time
- Filter by type
- Appearance mode switching (All / Current weather only / Not appearing now)
- Sort by: Pokédex order / Level / Incomplete first / Uncertified first
- Level range filter
- Search by name or location
- Completion check (multi-select, bulk check supported)
- Authentication Master record (multi-select, bulk check supported)
- Share card image generation & X (Twitter) post
- Server selector for the displayed time zone (appearance logic always uses Japan time)
- Today's spawn location and appearance calendar for Firefly Stones and Oak Trees
- Daily to-do dashboard: today's weather forecast, time remaining until the next scheduled quest, a checklist of daily-reset items, and events/codes ending soon

### Recipes
- Full recipe list with ingredients, cost, sell price, and profit
- Sell price comparison across rarity (1–5 stars)
- Master certification calculator
  - Set a target count per recipe and see the remaining amount needed
  - Enter materials on hand to see real-time shortages
  - Material inventory is shared globally across all recipes
  - Automatically breaks down intermediate ingredients (recipes used as materials) into their base ingredients
  - Free-form input for "any of category X" ingredient slots
- Seasonal/festival-limited recipes with an active/ended status banner

### Garden
- Growth time, seed price, and sell price for crops and flowers
- List of breedable flower colors with combination examples (only showing colors that flower can actually produce)
- Harvest notifications via Firebase Cloud Messaging (background push)
  - Normal mode: notify at harvest time
  - Weeding mode: 3 weeding alerts + harvest notification
- Live countdown timer and progress bar on each card
- Support for seasonal/festival-limited crops and flowers

### Pet
- Manage multiple pets (dogs and cats)
- Record food likes/dislikes, with automatic sorting by priority
- Search by food name
- Progress tracking
- Backup export/import for your data

### Shop
- List of seasonal items with prices and purchase limits
- Purchased-item check and progress display
- Search by item name, sort by not-yet-owned first

### Gift Codes
- List of active codes (tap to copy)
- Toggle to show expired codes

### Events
- Ongoing and upcoming gacha/event info
- Event duration and item exchange deadlines

### Location Videos
- Watch footage of Pink Bubble (weekly), Rainbow Day (irregular), and Meteor Shower (irregular) occurrences, grouped by category
- Switch categories with tabs; tap a date to expand and play the video in place
- The most recent occurrence auto-expands (Meteor Shower within 24 hours of starting, Rainbow Day within 6 hours, Pink Bubble for the rest of its week)
- One tap from the Encyclopedia page's daily to-do dashboard jumps straight to the relevant category

### Art
- Pixel art creation tools (pen, eraser, bucket fill, eyedropper, line/rectangle/circle shape tools, adjustable brush size, color replace, flip/move)
- Color palette that exactly matches the colors actually selectable in-game
- Outline overlay for design frames (the actual in-game canvas area for clothing/furniture), 10x10 block view with per-block progress tracking
- Create from image (auto-converts a photo or illustration into pixel art, with adjustable color count, dithering, and background handling)
- Import from screenshot (upload a screenshot of the in-game design screen; the guide lines visible in the screenshot are matched against each canvas template to automatically detect the canvas and position. If auto-detection isn't confident, you can pick from a candidate list or manually drag-move/resize the crop area)
- Paint order guide (walks through efficient painting order block-by-block with auto-zoom, an estimated time remaining, and progress tracking to completion)
- 3D preview (experimental; drag to rotate supported canvases in 3D)
- My Designs list (not-started / in-progress / complete status tracking with progress %)
- PNG export and image sharing
- Share codes (back up or hand off a design as a short code, URL, or QR code — no account needed, nothing sent to a server)
- Zoom slider and pinch-to-zoom, tap-to-inspect a cell's coordinates and color number
- Fully offline-capable (no account needed, all data stored locally in your browser)

### Sheet Music
- Numbered-notation (jianpu-style) sheet music editor. Pick an instrument, choose a note length and tap to enter notes, or record while performing to transcribe as you play (simultaneous key presses are recorded as chords)
- Create from humming / Create from audio / Create from video: auto-transcribes a hummed recording or an existing audio/video file into sheet music
- Tempo (BPM) and time signature settings, adding rests, section repeat (select and loop just the part you're struggling with)
- Practice mode: a full-screen view with just the score and performance buttons. The layout automatically matches the finger spacing of the real in-game controls, and you can tap along as the score auto-plays at 0.1x–1.0x speed. Button position/size can be fine-tuned by overlaying a photo of your real device
- Follow mode: a mode meant for use alongside the real game (e.g. in iPad Split View), showing the current and next note large on screen
- Save and recall from a list (no account needed, browser-local storage only)

### Q&A
- Status tracking for questions, feature requests, and bug reports
  (fixed / in progress / considering / won't fix)
- Anonymous contact form

### Data Sync
- Export or import all of your site data (completion status, certification records, recipe calculator, garden notification settings, pet data, shop check status, and more) as a single file
- Useful as a backup when switching devices/browsers, or for carrying your data across multiple devices
- Nothing is sent to any server — you exchange the exported file yourself

### Multi-language support
- Available in Japanese / English / Korean / Thai / Chinese (Simplified & Traditional)
- Auto-detects your device language, with a manual language switcher

### Shared features
- Dark mode support
- PWA support (add to home screen to use like an app)
- All data is stored locally in your browser (LocalStorage)

## How to Use

Just open the link in your browser — no installation needed.
You can also add it to your home screen to use it like an app.

https://ram1x7.github.io/heartopilist/

## Tech Stack

- Frontend: Vanilla HTML / CSS / JavaScript (no framework)
- Hosting: GitHub Pages
- Notifications: Firebase Cloud Messaging + Cloud Functions (Firestore)
- Firebase Functions are deployed automatically via GitHub Actions
  (triggered on changes under `functions/`)

### Directory structure (excerpt)

```
heartopilist/
├── index.html / foods.html / garden.html / pet.html / shop.html
├── codes.html / events.html / videos.html / faq.html
├── art-create.html / art-convert.html   … Art pages (main editor / standalone "create from image")
├── music.html                             … Sheet music page
├── js/
│   ├── data-*.js          … Data definitions for each page
│   ├── main.js             … Encyclopedia page logic
│   ├── shop.js              … Shop page logic
│   ├── food-auth-calc.js    … Master certification calculator
│   ├── data-sync.js         … Data sync (export/import)
│   ├── i18n.js               … Multi-language support
│   ├── firebase-init.js      … Notification setup
│   ├── art-editor.js / art-config.js / art-masks.js … Art editor core / canvas definitions / outline data
│   ├── art-converter.js / art-pixelate.js            … Shared image → pixel art conversion logic
│   ├── art-template-match.js / art-screenshot-import.js … Import-from-screenshot (guide-line matching)
│   ├── art-paint-guide.js / art-3d.js / art-share-code.js … Paint order guide / 3D preview / share codes
│   └── music-editor.js / music-config.js / music-hum.js … Sheet music editor core / config / auto-transcription
├── locales/                  … Translation files (ja / en / ko / th / zh-CN / zh-TW)
├── images/ / fish/ / bugs/ / birds/ … Image assets
├── functions/                 … Firebase Cloud Functions (notification API)
├── tools/                      … Weather data entry/validation tools
└── manifest.json               … PWA settings
```

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
