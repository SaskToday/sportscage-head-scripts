import type { Env } from './env';
import { num } from './env';
import { incr, fiveMinBucket, hourBucket, readCount } from './counters';
import { sendAlertOnce } from './alerts';

const BREAKER_KEY = 'breaker:tripped';
const BREAKER_ALERT_KEY = 'breaker:alerted';

export type BreakerState = {
  reason: string;
  trippedAt: string;
} | null;

export async function getBreaker(env: Env): Promise<BreakerState> {
  const raw = await env.SIGNUP_STATE.get(BREAKER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BreakerState;
  } catch {
    return { reason: 'unknown', trippedAt: new Date().toISOString() };
  }
}

export async function tripBreaker(
  env: Env,
  reason: string,
  counts: Record<string, number>
): Promise<void> {
  const cooldown = num(env.BREAKER_COOLDOWN_SECONDS, 3600);
  const trippedAt = new Date().toISOString();
  await env.SIGNUP_STATE.put(
    BREAKER_KEY,
    JSON.stringify({ reason, trippedAt }),
    { expirationTtl: cooldown }
  );

  await sendAlertOnce(env, BREAKER_ALERT_KEY, cooldown, {
    text:
      `🚨 Signup worker circuit breaker tripped.\n` +
      `Reason: ${reason}\n` +
      `Counts: ${JSON.stringify(counts)}\n` +
      `Tripped at: ${trippedAt}\n` +
      `Auto-resets in ~${cooldown}s.\n` +
      `Manual reset: wrangler kv key delete --binding SIGNUP_STATE "${BREAKER_KEY}" && ` +
      `wrangler kv key delete --binding SIGNUP_STATE "${BREAKER_ALERT_KEY}"`
  });
}

/** Count a verified signup toward the hourly breaker. */
export async function countVerifiedSignup(env: Env): Promise<void> {
  const max = num(env.BREAKER_MAX_SIGNUPS_PER_HOUR, 100);
  const key = `count:signups:${hourBucket()}`;
  // Keep ~3 days so the daily digest can sum yesterday's hour buckets.
  const count = await incr(env.SIGNUP_STATE, key, 3 * 24 * 3600);
  if (count > max) {
    await tripBreaker(env, 'signups_per_hour', { signups: count, max });
  }
}

/** Count a Mailchimp upstream/config error toward the error breaker. */
export async function countMailchimpError(env: Env): Promise<void> {
  const max = num(env.BREAKER_MAX_MAILCHIMP_ERRORS_PER_5MIN, 20);
  const key = `count:mc_err:${fiveMinBucket()}`;
  const count = await incr(env.SIGNUP_STATE, key, 15 * 60);
  if (count > max) {
    await tripBreaker(env, 'mailchimp_errors', { errors: count, max });
  }
}

export async function getSignupCount(env: Env): Promise<number> {
  return readCount(env.SIGNUP_STATE, `count:signups:${hourBucket()}`);
}
