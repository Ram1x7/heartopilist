# 本人専用・建築AI試験版

一般公開は保留。Gemini APIの年齢要件を確認したため、運営者本人のみが利用できる認証付きの試験に限定する。既存の画像変換は従来どおりブラウザ内で利用可能。

## 接続

1. AI Studioで専用プロジェクトの請求階層が「無料枠」であることを確認する。課金を有効にしない。現在のモデルは gemini-3.5-flash-lite。利用可能性・無料枠は接続時に再確認する。
2. Cloudflare Workers FreeでSQLite Durable Objectを使う。Workers Paidへ切り替えない。
3. Workerの秘密値に GEMINI_API_KEY、CLIENT_HASH_SECRET、PRIVATE_TRIAL_TOKEN を設定する。PRIVATE_TRIAL_TOKENは20文字以上のランダムな本人専用キー。GeminiのAPIキーとは別にする。これらはソースやGitHubに保存しない。
4. wrangler.tomlのALLOWED_ORIGINを試験画面のOriginに合わせる。PRIVATE_TRIAL_ONLYはtrueのまま維持する。
5. 無料枠確認後にFREE_TIER_CONFIRMED、ENABLEDをtrueにし、npx wrangler deployで配備する。
6. js/build-ai-config.mjsのendpointにWorkerの /generate URLを設定する。フロント側に秘密値は書かない。試験画面も一般公開への導線を設けず運用する。
7. 本人専用キーを画面で入力して生成する。キーはブラウザ保存領域に記録せず、Authorizationヘッダーで接続先Workerへ送信する。入力文はGeminiへ送信する。

コードのFREE_TIER_CONFIRMEDは運営者の確認フラグであり、プロバイダーの課金状態を検証しない。有料プロジェクトのAPIキーを設定すると料金が発生し得る。無料枠のみの運用はプロバイダーのFree設定を維持することで担保する。モデルの自動切替・有料フォールバック・自動再試行はない。

## 制限

- 本人専用認証が必須。PRIVATE_TRIAL_ONLYがtrueでない場合、または秘密値不足の場合は503で停止。認証失敗時は外部AIを呼ぶ前に401で拒否する。
- 初期自主制限：全体20回/日、接続元2回/日、全体2回/分。実際のGemini無料枠の保証値ではない。無料枠がより少なければ自主制限も下げる。
- 1回の出力は6000トークンまで。失敗後も利用回数を消費する。Durable Objectのトランザクションで同時予約を管理。
- 接続元IPを日替わりHMAC化して当日分のみ保持。生IP・入力文を保存しない。日付切替はUTC（日本時間9時）。
- 初期構成のTurnstile認証は本人専用試験では使わず、強い専用キーに置き換えている。匿名公開には対応していない。
- AIは40個までの箱・楕円体・円錐を返す。ブラウザで支柱に展開し、指定範囲・支柱17段・敷地24×30床マス・最大30,000本を検査。元の画像や建物に一致する保証はない。
- 支柱による外形の提案のみ。画像入力AI、床材の自動配置、通常の壁・扉・階段・屋根による入れる建物は未実装。既存の平面変換は支柱の地上絵。
- 生成後の編集・保存・施工表示は既存ページを共有。保存データが現行上限を超える場合、削除せず読込を止める。
- 高さ0.5床マス、低い壁厚さ0.05床マスは推定。壁13枚、支柱17本、床の設置高さは低い壁12枚分まで。
- 耐荷重は設計図単体。既存建築との初回加算の共有は未対応。低い壁の現在のパレットは板張り1模様のみとして計算する。

## 確認

リポジトリルートで実行：

node --test tests/build-rules.test.mjs tests/build-ai-worker.test.mjs tests/build-editor.test.mjs

実API生成、クラウド配備、画面の実ブラウザ確認は別途必要。

## 試験画面の配信

Wranglerのカスタムビルドで `prepare-trial.mjs` を実行し、既存の `build.html` と必要な公開スクリプト・CSS・翻訳だけを `.trial-public` にまとめる。生成物はGitへ保存しない。WorkerのStatic Assetsで `/build` を配信する。解析・更新通知・Service Workerは試験画面では読み込まない。ほかの図鑑ページへのリンクは既存のGitHub Pagesへ向ける。

現在の試験画面は `https://hatopi-build-ai.saiyowa0517.workers.dev/build`。Workerの `ALLOWED_ORIGIN` も同じOriginに固定する。ページ自体は閲覧可能で検索対象外、AI生成は引き続き本人専用キーを必須とする。秘密値は生成物やHTMLへ埋め込まない。GitHub Pagesの公開済みページは変更しない。

ローカルでの梱包確認: `node ai-worker/prepare-trial.mjs`。配備後は画面表示、シークレット不足時の停止、本人専用キーによる実生成を別途確認する。

## 参照

- https://ai.google.dev/gemini-api/terms
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/structured-output
- https://developers.cloudflare.com/durable-objects/platform/pricing/

## Cloudflareダッシュボードからの初回配備

作成画面でブランチを選べない場合は、Hello Worldで hatopi-build-ai を作成し、設定のビルドから既存WorkerへGitHubリポジトリを接続する。

- リポジトリ: Ram1x7/heartopilist
- プロダクションブランチ: codex/build-ai-free-trial
- ビルドコマンド: 空欄
- デプロイコマンド: npx wrangler deploy --config ai-worker/wrangler.toml
- パス: /
- プレビュービルド: 無効

接続後、上記ブランチへのコミットのプッシュで最初のビルドを開始する。接続時のビルド変数にはGeminiの秘密値を入れない。実行時の秘密値はWorkerの「変数とシークレット」に設定する。

初回配備ではENABLEDとFREE_TIER_CONFIRMEDをfalseのままにする。この段階ではAI生成を有効化しない。ビルドログで配備結果を確認後、無料枠・本人専用認証・実行時シークレットを確認してから有効化する。mainへのマージは不要。

2026-10-23: 新規プロジェクトで制限される2.5系から、無料枠のある gemini-3.5-flash-lite に切替。RESTの現行 responseFormat を使用。接続不備で消費した試験受付枠は修正時のカウンター名変更で更新（通常の各上限は維持）。自動再試行・他モデルへのフォールバックは行わない。

接続形式: 旧 responseMimeType/responseJsonSchema は使わず、現行 responseFormat.text に mimeType=APPLICATION_JSON と schema を指定する。スキーマには指定寸法に対応する座標・サイズの上限を含める。受信後も validatePlan で整数・寸法の合計・建材・色を独立検証する。完全なJSONコードフェンスのみ除去できるが、不正JSONの補修・不正寸法の黙った変更・自動再試行は行わない。受付カウンターは global-structured-format-v4（各上限は維持）。

失敗は quota / network / response / json / validation の段階で区別する。タイムアウトや建築ルール違反は具体的な固定文言で通知し、AI出力本文や例外の生メッセージは公開しない。実APIでの生成成功は未確認。
