# 建築AI試験版の接続

既存の `build.html` に文章から支柱の立体物を作る入口を追加する。
Cloudflare Workers Free + SQLite Durable Object + Gemini Developer APIの無料枠を使う構成。
初期状態は無効。APIキー・クラウド接続・有料化はこの変更では実施していない。

## 接続手順

1. Geminiの専用プロジェクトを作成。AI Studio上で対象モデルが無料枠対象で、プロジェクトのPlanがFreeであることを確認する。課金を有効にしない。Google Cloudや他用途の有料プロジェクトのキーを流用しない。
2. CloudflareのWorkers FreeアカウントとTurnstileウィジェットを用意。許可ホストは `ram1x7.github.io`。Workers Paidへ切り替えない。
3. このディレクトリで `npx wrangler secret put GEMINI_API_KEY`、`TURNSTILE_SECRET`、`CLIENT_HASH_SECRET` をそれぞれ設定。CLIENT_HASH_SECRETは十分長いランダム値にする。秘密値はGitに保存しない。
4. `wrangler.toml` のOrigin/hostnameと無料枠を再確認。確認後のみ `FREE_TIER_CONFIRMED = "true"`、`ENABLED = "true"` にする。`npx wrangler deploy` で公開する。
5. `js/build-ai-config.mjs` に公開Workerの `/generate` URLとTurnstileの公開site keyを設定する。秘密のAPIキーは書かない。
6. 実際のAI出力で形・サイズ・建材数・エラー時の表示を検証してから一般公開する。

初期の自主制限は全体20回/日、同一接続元2回/日、全体2回/分。これらはGeminiの保証された無料枠の数値ではない。実際の利用枠に合わせて減らす。1回の出力は最大6000トークン。全体制限は最大100回/日までの設定のみ受け付ける。

「無料枠のみ」はプロバイダー側のFree設定で担保する。コードの `FREE_TIER_CONFIRMED` は運営者の確認フラグであり、APIから課金状態を検証するものではない。有料プロジェクトのキーを設定すると、このコードでも従量料金が発生し得る。自動モデル変更・有料フォールバック・自動再試行は実装しない。

## 設計と制限

- AIは40個までの箱・楕円体・円錐を返す。ブラウザが建材配置に展開し、指定サイズ・支柱17段・敷地24×30床マスを検査する。外れたAI出力は自動で隠して切り詰めず、エラーを表示する。
- まずは支柱による外形のみ。画像入力AI、通常の壁・扉・階段・屋根を使った建築や動線の検証は未実装。床モードは従来どおり支柱の地上絵であり、床材の自動配置は未実装。
- 生成後の3D編集・保存・JSON書き出しを既存機能と共有する。
- 高さ0.5床マス、低い壁の厚さ0.05床マスは推定。壁は13枚、支柱は17本、床設置高さは低い壁12枚分まで。
- 低い壁の現在のパレットは板張り1模様のみ。色違いを模様追加として数えない。新しい模様を導入するときはpatternIdを必須にする。
- 耐荷重は設計図単体が対象。既存建築との初回加算共有は未対応。床・壁は模様加算を別々に数える。
- IPを日替わりHMAC化して利用制限に使用。ログインによる個人識別ではない。家族・共有回線は枠を共有し、回線変更で迂回され得る。全体上限は別に維持する。
- カウンターの日付はUTC（日本時間9:00切替）。当日データのみ保持。生IPと入力文を保存しない。文章はGemini、認証情報はTurnstileへ送信する。
- Turnstileはサーバーで検証し、ホスト・actionを確認。カウンターはDurable Object内のトランザクションで予約する。予約後の失敗・タイムアウトも回数を消費する。
- APIキーはWorker側のみ。無効設定・秘密値不足・無料枠超過時は生成を止める。画像変換は引き続きブラウザ内で動く。
- Workerが返すプランの検証はサーバーとクライアント両方で実施。展開後30,000本を超える設計はクライアントで拒否する。

## 確認

`node --test tests/build-rules.test.mjs tests/build-ai-worker.test.mjs tests/build-editor.test.mjs`（リポジトリルートで実行）。クラウドへの実配備、実API課金状態、実AI生成品質は別途確認が必要。

参照：
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/structured-output
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
