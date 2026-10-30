import type { Env } from './env';

export type AlertOptions = {
  /** Override destination (defaults to ALERT_WEBHOOK_URL). */
  webhookUrl?: string;
  /** Adaptive Card title line */
  title?: string;
};

/**
 * POST alert JSON to a Teams Workflows webhook.
 *
 * Templates that use **Post card in a chat or channel** require an Adaptive
 * Card root (`type: "AdaptiveCard"`). Plain `{ text }` fails with:
 * Property 'type' must be 'AdaptiveCard'.
 *
 * - Breaker / config / Turnstile wave → `ALERT_WEBHOOK_URL` (ops channel)
 * - Daily disposable digest → `DIGEST_WEBHOOK_URL` (separate chat/channel)
 */
export async function sendAlert(
  env: Env,
  payload: Record<string, unknown>,
  opts: AlertOptions = {}
): Promise<boolean> {
  const url = opts.webhookUrl || env.ALERT_WEBHOOK_URL;
  if (!url) {
    console.log(JSON.stringify({ outcome: 'alert_skipped', reason: 'no_webhook' }));
    return false;
  }

  const text =
    typeof payload.text === 'string'
      ? payload.text
      : `Signup worker alert: ${JSON.stringify(payload)}`;

  const title = opts.title || 'SaskToday signup worker';

  const body = {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: title,
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
    console.log(JSON.stringify({ outcome: 'alert_sent', status: res.status }));
    return true;
  } catch {
    console.log(JSON.stringify({ outcome: 'alert_failed' }));
    return false;
  }
}

/** Send at most one alert per guard key until TTL expires. */
export async function sendAlertOnce(
  env: Env,
  guardKey: string,
  ttlSeconds: number,
  payload: Record<string, unknown>,
  opts: AlertOptions = {}
): Promise<boolean> {
  const existing = await env.SIGNUP_STATE.get(guardKey);
  if (existing) return false;
  const ok = await sendAlert(env, payload, opts);
  if (!ok) return false;
  await env.SIGNUP_STATE.put(guardKey, '1', {
    expirationTtl: Math.max(60, ttlSeconds)
  });
  return true;
}
