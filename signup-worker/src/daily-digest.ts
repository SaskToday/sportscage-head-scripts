import type { Env } from './env';
import { hourBucket, readCount } from './counters';
import { sendAlertOnce } from './alerts';

const REPORT_TZ = 'America/Edmonton';

/** Calendar date YYYY-MM-DD in America/Edmonton. */
export function edmontonDateString(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

/** Previous calendar day in America/Edmonton (relative to `now`). */
export function previousEdmontonDay(now = new Date()): string {
  // Walk back hour-by-hour until the Edmonton calendar date changes.
  const today = edmontonDateString(now);
  let t = now.getTime();
  for (let i = 0; i < 48; i++) {
    t -= 3600_000;
    const day = edmontonDateString(new Date(t));
    if (day !== today) return day;
  }
  // Fallback: subtract 24h wall time
  return edmontonDateString(new Date(now.getTime() - 24 * 3600_000));
}

/**
 * UTC hour-bucket keys (YYYYMMDDHH) whose instant falls on the given
 * America/Edmonton calendar day.
 */
export function utcHourBucketsForEdmontonDay(day: string): string[] {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return [];

  const buckets = new Set<string>();
  // Scan a wide UTC window covering any offset for that civil date.
  const start = Date.UTC(y, m - 1, d - 1, 0, 0, 0);
  const end = Date.UTC(y, m - 1, d + 2, 0, 0, 0);
  for (let t = start; t < end; t += 3600_000) {
    const dt = new Date(t);
    if (edmontonDateString(dt) === day) {
      buckets.add(hourBucket(dt));
    }
  }
  return [...buckets].sort();
}

export async function sumCounterPrefix(
  kv: Env['SIGNUP_STATE'],
  prefix: string,
  buckets: string[]
): Promise<number> {
  let total = 0;
  for (const b of buckets) {
    total += await readCount(kv, `${prefix}${b}`);
  }
  return total;
}

export function formatDisposableDigest(opts: {
  day: string;
  signups: number;
  disposable: number;
}): string {
  const { day, signups, disposable } = opts;
  const pct =
    signups > 0 ? ((100 * disposable) / signups).toFixed(1) : disposable > 0 ? 'n/a' : '0.0';

  return (
    `SaskToday signup digest (${day} America/Edmonton)\n` +
    `Verified signups: ${signups}\n` +
    `Disposable-domain matches: ${disposable}` +
    (signups > 0 ? ` (${pct}% of verified)` : disposable > 0 ? ' (no verified total — check counters)' : ' (0%)') +
    `\nObserve-only — matches are not blocked.`
  );
}

/**
 * Cron: send yesterday's America/Edmonton disposable % digest to Teams.
 * Deduped per day via KV so retries don't spam.
 */
export async function sendDisposableDailyDigest(
  env: Env,
  now = new Date()
): Promise<{ ok: boolean; day: string; signups: number; disposable: number }> {
  const day = previousEdmontonDay(now);
  const buckets = utcHourBucketsForEdmontonDay(day);
  const signups = await sumCounterPrefix(env.SIGNUP_STATE, 'count:signups:', buckets);
  const disposable = await sumCounterPrefix(
    env.SIGNUP_STATE,
    'count:disposable:',
    buckets
  );

  const text = formatDisposableDigest({ day, signups, disposable });
  // Prefer DIGEST_WEBHOOK_URL (separate Teams chat/channel); fall back to ops webhook.
  const digestUrl = env.DIGEST_WEBHOOK_URL || env.ALERT_WEBHOOK_URL;
  const sent = await sendAlertOnce(
    env,
    `alert:disposable_daily:${day}`,
    3 * 24 * 3600,
    { text },
    {
      webhookUrl: digestUrl,
      title: 'SaskToday signup digest'
    }
  );

  console.log(
    JSON.stringify({
      outcome: sent ? 'disposable_daily_sent' : 'disposable_daily_skipped',
      day,
      signups,
      disposable
    })
  );

  return { ok: sent, day, signups, disposable };
}
