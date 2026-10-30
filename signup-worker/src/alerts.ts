import type { Env } from './env';

/**
 * POST alert JSON to ALERT_WEBHOOK_URL.
 *
 * Payload is Teams Workflows–friendly (`{ text }`) and also works with
 * Slack-style incoming webhooks. Set the secret to a Teams channel webhook
 * from: channel ⋯ → Workflows → "Send webhook alerts to a channel"
 * (Who can trigger = Anyone). See README.
 */
export async function sendAlert(
  env: Env,
  payload: Record<string, unknown>
): Promise<boolean> {
  const url = env.ALERT_WEBHOOK_URL;
  if (!url) {
    console.log(JSON.stringify({ outcome: 'alert_skipped', reason: 'no_webhook' }));
    return false;
  }

  const text =
    typeof payload.text === 'string'
      ? payload.text
      : `Signup worker alert: ${JSON.stringify(payload)}`;

  try {
    // Keep body minimal: Workflows templates and classic webhooks key off `text`.
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      console.log(
        JSON.stringify({
          outcome: 'alert_failed',
          status: res.status,
          detail: (await res.text()).slice(0, 200)
        })
      );
      return false;
    }
    console.log(
      JSON.stringify({ outcome: 'alert_sent', status: res.status })
    );
    return true;
  } catch {
    // Never fail the request because alerting failed
    console.log(JSON.stringify({ outcome: 'alert_failed' }));
    return false;
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
  const ok = await sendAlert(env, payload);
  if (!ok) return false;
  // Only dedupe after a successful webhook POST so a bad URL can be retried.
  await env.SIGNUP_STATE.put(guardKey, '1', {
    expirationTtl: Math.max(60, ttlSeconds)
  });
  return true;
}
