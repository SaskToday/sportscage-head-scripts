import type { Env } from './env';
import { num, parseList } from './env';
import { isValidEmail, normalizeEmail, sha256Hex } from './crypto';
import { resolveInterestKeys } from './interests';
import { corsHeaders, getAllowedOrigin, jsonResponse } from './cors';
import { verifyTurnstile } from './turnstile';
import { upsertMemberInterests } from './mailchimp';
import {
  countMailchimpError,
  countVerifiedSignup,
  getBreaker
} from './breaker';
import { hourBucket, incr, tenMinBucket } from './counters';
import { sendAlertOnce } from './alerts';

const SUCCESS_MESSAGE =
  "Thanks! If you're new, check your inbox to confirm. If you're already subscribed, you're all set.";

type SubscribeBody = {
  email?: unknown;
  interest?: unknown;
  interests?: unknown;
  turnstileToken?: unknown;
  widgetVersion?: unknown;
  /** @deprecated Prefer hp_field — "website" is often autofilled by browsers */
  website?: unknown;
  hp_field?: unknown;
};

/** Keep versions short and log-safe for Mailchimp event properties. */
function parseWidgetVersion(raw: unknown): string {
  if (typeof raw !== 'string') return 'unknown';
  const v = raw.trim().slice(0, 40);
  if (!/^[a-zA-Z0-9._+-]+$/.test(v)) return 'unknown';
  return v || 'unknown';
}

function honeypotFilled(body: SubscribeBody): boolean {
  const a = typeof body.hp_field === 'string' ? body.hp_field : '';
  const b = typeof body.website === 'string' ? body.website : '';
  return a.length > 0 || b.length > 0;
}

function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || '0.0.0.0';
}

function parseInterestKeys(body: SubscribeBody): string[] {
  const keys: string[] = [];
  if (typeof body.interest === 'string' && body.interest.trim()) {
    keys.push(body.interest.trim());
  }
  if (Array.isArray(body.interests)) {
    for (const item of body.interests) {
      if (typeof item === 'string' && item.trim()) keys.push(item.trim());
    }
  }
  // Dedupe
  return [...new Set(keys)];
}

function log(fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...fields }));
}

async function handleSubscribe(
  request: Request,
  env: Env,
  origin: string
): Promise<Response> {
  const ip = clientIp(request);

  // Content-Type
  const ct = (request.headers.get('content-type') || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (ct !== 'application/json') {
    return jsonResponse(
      { ok: false, code: 'unsupported_media' },
      415,
      origin
    );
  }

  // Body size
  const maxBytes = num(env.BODY_MAX_BYTES, 2048);
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > maxBytes) {
    return jsonResponse({ ok: false, code: 'payload_too_large' }, 413, origin);
  }

  const raw = await request.arrayBuffer();
  if (raw.byteLength > maxBytes) {
    return jsonResponse({ ok: false, code: 'payload_too_large' }, 413, origin);
  }

  let body: SubscribeBody;
  try {
    body = JSON.parse(new TextDecoder().decode(raw)) as SubscribeBody;
  } catch {
    return jsonResponse({ ok: false, code: 'bad_json' }, 400, origin);
  }

  // Honeypot — fake success, no further work
  // Note: browsers often autofill name="website"; prefer hp_field on the client.
  if (honeypotFilled(body)) {
    log({ outcome: 'honeypot', ipHash: await sha256Hex(ip) });
    return jsonResponse({ ok: true, message: SUCCESS_MESSAGE }, 200, origin);
  }

  const emailRaw = typeof body.email === 'string' ? body.email : '';
  const email = normalizeEmail(emailRaw);
  if (!isValidEmail(email)) {
    return jsonResponse(
      { ok: false, code: 'invalid_email', message: 'Please check your email address.' },
      400,
      origin
    );
  }

  const interestKeys = parseInterestKeys(body);
  const widgetVersion = parseWidgetVersion(body.widgetVersion);
  const resolved = resolveInterestKeys(interestKeys);
  if (!resolved.ok) {
    return jsonResponse(
      {
        ok: false,
        code: resolved.reason === 'empty' ? 'missing_interest' : 'unknown_interest'
      },
      400,
      origin
    );
  }

  // Breaker
  const breaker = await getBreaker(env);
  if (breaker) {
    log({ outcome: 'paused', reason: breaker.reason });
    return jsonResponse(
      {
        ok: false,
        code: 'paused',
        message: 'Signups are temporarily unavailable, please try again later.'
      },
      503,
      origin
    );
  }

  // Per-IP Turnstile fail block
  const blockKey = `block:ts:${ip}`;
  if (await env.SIGNUP_STATE.get(blockKey)) {
    return jsonResponse(
      {
        ok: false,
        code: 'rate_limited',
        message: 'Too many attempts, try again later.'
      },
      429,
      origin
    );
  }

  // Turnstile
  const token =
    typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
  const ts = await verifyTurnstile({
    secret: env.TURNSTILE_SECRET,
    token,
    remoteip: ip,
    allowedHostnamesCsv: env.TURNSTILE_ALLOWED_HOSTNAMES
  });

  if (!ts.ok) {
    const failKey = `count:ts_fail:${ip}:${tenMinBucket()}`;
    const failCount = await incr(env.SIGNUP_STATE, failKey, 15 * 60);
    const maxFail = num(env.TURNSTILE_FAIL_MAX_PER_IP_10MIN, 5);
    if (failCount > maxFail) {
      const blockSecs = num(env.TURNSTILE_FAIL_BLOCK_SECONDS, 600);
      await env.SIGNUP_STATE.put(blockKey, '1', {
        expirationTtl: blockSecs
      });
    }

    const alertMax = num(env.TURNSTILE_FAIL_ALERT_PER_10MIN, 200);
    const globalFailKey = `count:ts_fail_all:${tenMinBucket()}`;
    const globalFails = await incr(env.SIGNUP_STATE, globalFailKey, 15 * 60);
    if (globalFails > alertMax) {
      await sendAlertOnce(env, `alert:ts_wave:${tenMinBucket()}`, 15 * 60, {
        text: `⚠️ Turnstile failure wave: ${globalFails} failures in 10m (alert only, signups not paused).`
      });
    }

    log({
      outcome: 'turnstile_fail',
      reason: ts.reason,
      interests: interestKeys
    });
    return jsonResponse(
      { ok: false, code: 'turnstile_failed' },
      400,
      origin
    );
  }

  // Rate limits (IP + email)
  const emailHash = await sha256Hex(email);
  const ipLimit = num(env.IP_MAX_PER_HOUR, 10);
  const emailLimit = num(env.EMAIL_MAX_PER_HOUR, 3);
  const hb = hourBucket();

  const ipCount = await incr(
    env.SIGNUP_STATE,
    `count:ip:${ip}:${hb}`,
    2 * 3600
  );
  if (ipCount > ipLimit) {
    log({ outcome: 'rate_limited_ip', interests: interestKeys });
    return jsonResponse(
      {
        ok: false,
        code: 'rate_limited',
        message: 'Too many attempts, try again later.'
      },
      429,
      origin
    );
  }

  const emailCount = await incr(
    env.SIGNUP_STATE,
    `count:email:${emailHash}:${hb}`,
    2 * 3600
  );
  if (emailCount > emailLimit) {
    log({ outcome: 'rate_limited_email', emailHash, interests: interestKeys });
    return jsonResponse(
      {
        ok: false,
        code: 'rate_limited',
        message: 'Too many attempts, try again later.'
      },
      429,
      origin
    );
  }

  // Count toward signup breaker only after Turnstile + rate limits
  await countVerifiedSignup(env);

  // Mailchimp upsert per audience
  for (const [audienceId, targets] of resolved.byAudience) {
    const result = await upsertMemberInterests({
      apiKey: env.MAILCHIMP_API_KEY,
      dc: env.MAILCHIMP_DC,
      audienceId,
      email,
      interests: targets,
      interestKeys,
      widgetVersion,
      signupIp: ip
    });

    if (result.kind === 'ok' || result.kind === 'member_state') {
      log({
        outcome:
          result.kind === 'member_state'
            ? 'member_state'
            : result.resubscribed
              ? 'resubscribe_pending'
              : result.previousStatus === 'subscribed'
                ? 'preference_update'
                : 'subscribed',
        emailHash,
        interests: interestKeys,
        audienceId,
        widgetVersion,
        activityEventRecorded:
          result.kind === 'ok' ? result.activityEventRecorded : undefined,
        title: result.kind === 'member_state' ? result.title : undefined
      });
      continue;
    }

    if (result.kind === 'invalid_email') {
      log({ outcome: 'invalid_email', emailHash, interests: interestKeys });
      return jsonResponse(
        {
          ok: false,
          code: 'invalid_email',
          message: 'Please check your email address.'
        },
        400,
        origin
      );
    }

    // config_error or upstream
    await countMailchimpError(env);
    if (result.kind === 'config_error') {
      await sendAlertOnce(env, `alert:mc_config:${hb}`, 3600, {
        text: `🚨 Mailchimp config error on signup worker: ${result.title} (status ${result.status}). Check API key / audience / interest IDs.`
      });
    }

    log({
      outcome: result.kind,
      emailHash,
      interests: interestKeys,
      title: result.title,
      status: result.status
    });

    return jsonResponse(
      {
        ok: false,
        code: 'upstream_error',
        message: 'Something went wrong. Please try again later.'
      },
      502,
      origin
    );
  }

  return jsonResponse({ ok: true, message: SUCCESS_MESSAGE }, 200, origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== '/subscribe') {
      return new Response('Not found', { status: 404 });
    }

    const origin = getAllowedOrigin(
      request.headers.get('Origin'),
      env.ALLOWED_ORIGINS
    );

    if (request.method === 'OPTIONS') {
      if (!origin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Missing or disallowed Origin → reject
    if (!origin) {
      log({ outcome: 'origin_rejected' });
      return new Response(JSON.stringify({ ok: false, code: 'origin_rejected' }), {
        status: 403,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      });
    }

    try {
      return await handleSubscribe(request, env, origin);
    } catch (e) {
      log({
        outcome: 'unhandled',
        error: e instanceof Error ? e.message : 'unknown'
      });
      return jsonResponse(
        {
          ok: false,
          code: 'error',
          message: 'Something went wrong. Please try again later.'
        },
        500,
        origin
      );
    }
  }
} satisfies ExportedHandler<Env>;
