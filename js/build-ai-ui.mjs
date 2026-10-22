import { BUILD_AI_CONFIG as config } from './build-ai-config.mjs';

export async function initAIForm(onPlan) {
  const form = document.getElementById('buildAIForm');
  const status = document.getElementById('buildAIStatus');
  const button = document.getElementById('buildAIGenerate');
  let widget, token = '', busy = false;
  if (!config.endpoint || !config.turnstileSiteKey) return;
  try {
    if (new URL(config.endpoint).protocol !== 'https:') throw new Error('接続先はHTTPSで指定してください');
    await new Promise((resolve, reject) => {
      if (window.turnstile) return resolve();
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.onload = resolve; script.onerror = reject;
      document.head.append(script);
    });
    widget = window.turnstile.render('#buildAIChallenge', {
      sitekey: config.turnstileSiteKey, action: 'build-generate',
      callback: value => { token = value; if(!busy) button.disabled = false; },
      'expired-callback': () => { token = ''; button.disabled = true; },
      'error-callback': () => { token = ''; button.disabled = true; status.textContent = '認証を読み込めません。ページを開き直してください。'; },
    });
    status.textContent = '認証後に生成できます。無料枠の上限に達すると受付を停止します。';
  } catch {
    status.textContent = 'AIへの接続を準備できませんでした。画像からの変換は利用できます。';
    return;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !token || !form.reportValidity()) return;
    busy = true; button.disabled = true;
    status.textContent = 'AIが形を考えています…';
    const limits = {
      w: Number(document.getElementById('buildAIWidth').value) * 4,
      d: Number(document.getElementById('buildAIDepth').value) * 4,
      h: Number(document.getElementById('buildAIHeight').value),
    };
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prompt: document.getElementById('buildAIPrompt').value.trim(), limits, token}),
        signal: AbortSignal.timeout(65000),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || '生成できませんでした');
      onPlan(body.plan, limits);
      status.textContent = '生成しました。形を確認して編集・保存できます。推定した形は元の作品と一致しない場合があります。';
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' ? '時間内に生成できませんでした。再試行も利用回数に数えられます。' : error.message;
    } finally {
      busy = false; token = ''; button.disabled = true;
      window.turnstile.reset(widget);
    }
  });
}
