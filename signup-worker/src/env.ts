export interface Env {
  SIGNUP_STATE: KVNamespace;

  MAILCHIMP_API_KEY: string;
  TURNSTILE_SECRET: string;
  ALERT_WEBHOOK_URL: string;

  MAILCHIMP_DC: string;
  ALLOWED_ORIGINS: string;
  TURNSTILE_ALLOWED_HOSTNAMES: string;
  BODY_MAX_BYTES: string;
  EMAIL_MAX_PER_HOUR: string;
  IP_MAX_PER_HOUR: string;
  BREAKER_MAX_SIGNUPS_PER_HOUR: string;
  BREAKER_MAX_MAILCHIMP_ERRORS_PER_5MIN: string;
  BREAKER_COOLDOWN_SECONDS: string;
  TURNSTILE_FAIL_ALERT_PER_10MIN: string;
  TURNSTILE_FAIL_MAX_PER_IP_10MIN: string;
  TURNSTILE_FAIL_BLOCK_SECONDS: string;
}

export function parseList(csv: string): string[] {
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function num(envValue: string, fallback: number): number {
  const n = Number(envValue);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
