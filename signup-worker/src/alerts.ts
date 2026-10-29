import type { Env } from './env';

export async function sendAlert(
  env: Env,
  payload: Record<string, unknown>
): Promise<void> {
  const url = env.ALERT_WEBHOOK_URL;
  if (!url) return;

  const text =
    typeof payload.text === 'string'
      ? payload.text
      : `Signup worker alert: ${JSON.stringify(payload)}`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text,
        ...payload
      })
    });
  } catch {
    // Never fail the request because alerting failed
    console.log(JSON.stringify({ outcome: 'alert_failed' }));
  }
}

/** Send at most one alert per guard key until TTL expires. */
export async function sendAlertOnce(
  env: Env,
  guardKey: string,
  ttlSeconds: number,
  payload: Record<string, unknown>
): Promise<boolean> {
  const existing = await env.SIGNUP_STATE.get(guardKey);
  if (existing) return false;
  await env.SIGNUP_STATE.put(guardKey, '1', {
    expirationTtl: Math.max(60, ttlSeconds)
  });
  await sendAlert(env, payload);
  return true;
}
