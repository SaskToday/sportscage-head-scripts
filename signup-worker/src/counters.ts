/**
 * Fixed-window KV counters. Eventually consistent / non-atomic — fine for
 * breakers and soft rate limits (may undercount slightly under concurrency).
 */

export interface CounterStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export function hourBucket(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  return `${y}${m}${day}${h}`;
}

export function tenMinBucket(d = new Date()): string {
  const slot = Math.floor(d.getUTCMinutes() / 10) * 10;
  return `${hourBucket(d)}${String(slot).padStart(2, '0')}`;
}

export function fiveMinBucket(d = new Date()): string {
  const slot = Math.floor(d.getUTCMinutes() / 5) * 5;
  return `${hourBucket(d)}${String(slot).padStart(2, '0')}`;
}

export async function incr(
  kv: CounterStore,
  key: string,
  ttlSeconds: number
): Promise<number> {
  const current = Number((await kv.get(key)) || '0') || 0;
  const next = current + 1;
  await kv.put(key, String(next), { expirationTtl: Math.max(60, ttlSeconds) });
  return next;
}

export async function readCount(kv: CounterStore, key: string): Promise<number> {
  return Number((await kv.get(key)) || '0') || 0;
}
