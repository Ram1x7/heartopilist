import { BUILD_AI_CONFIG as config } from './build-ai-config.mjs';

export async function initAIForm(onPlan) {
  const form = document.getElementById('buildAIForm');
  const status = document.getElementById('buildAIStatus');
  const button = document.getElementById('buildAIGenerate');
  let busy = false;
  if (!config.endpoint) return;
  try {
    if (new URL(config.endpoint).protocol !== 'https:') throw new Error();
    button.disabled = false;
    status.textContent = '本人専用の試験キーで生成できます。無料枠の上限で受付を停止します。';
  } catch {
    status.textContent = 'AI接続先の設定を確認してください。';
    return;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true; button.disabled = true;
    status.textContent = 'AIが形を考えています…';
    const limits = {
      w: Number(document.getElementById('buildAIWidth').value) * 4,
      d: Number(document.getElementById('buildAIDepth').value) * 4,
      h: Number(document.getElementById('buildAIHeight').value),
    };
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + document.getElementById('buildAIPrivateKey').value},
        body: JSON.stringify({prompt: document.getElementById('buildAIPrompt').value.trim(), limits}),
        signal: AbortSignal.timeout(65000),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || '生成できませんでした');
      onPlan(body.plan, limits);
      const fitted = body.adjustment ? (body.adjustment.scale < 1 ? '指定範囲に収まるよう全体を縮小しました。細部は支柱のマスに合わせて調整しています。' : '指定範囲に収まるよう位置を調整しました。') : '';
      status.textContent = '生成しました。' + fitted + '形を確認して編集・保存できます。推定した形は元の作品と一致しない場合があります。';
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' ? '時間内に生成できませんでした。再試行も利用回数に数えられます。' : error.message;
    } finally {
      busy = false; button.disabled = false;
    }
  });
}
