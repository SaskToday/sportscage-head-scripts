import type { Env } from './env';

/**
 * POST alert JSON to ALERT_WEBHOOK_URL.
 *
 * Teams Workflows templates that use **Post card in a chat or channel**
 * require an Adaptive Card root (`type: "AdaptiveCard"`). Plain `{ text }`
 * fails with: Property 'type' must be 'AdaptiveCard'.
 *
 * We also include top-level `text` for flows that use **Post message** instead.
 * See README for setup.
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

  // Adaptive Card for Teams "Post card in a chat or channel" (required shape).
  const body = {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: 'SaskToday signup worker',
        weight: 'Bolder',
        size: 'Medium',
        wrap: true
      },
      {
        type: 'TextBlock',
        text,
        wrap: true
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
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
