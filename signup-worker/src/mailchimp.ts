import type { InterestTarget } from './interests';
import { md5Hex } from './crypto';

export type MailchimpOutcome =
  | {
      kind: 'ok';
      resubscribed?: boolean;
      previousStatus?: MemberStatus;
      activityEventRecorded?: boolean;
    }
  | { kind: 'member_state'; title: string }
  | { kind: 'invalid_email'; title: string }
  | { kind: 'config_error'; title: string; status: number }
  | { kind: 'upstream'; title: string; status: number };

export type MemberStatus =
  | 'missing'
  | 'subscribed'
  | 'pending'
  | 'unsubscribed'
  | 'cleaned'
  | 'transactional'
  | 'other';

const MEMBER_STATE_TITLES = new Set([
  'Member In Compliance State',
  'Forgotten Email Not Subscribed',
  'Invalid Resource' // often cleaned / permanently deleted — treat carefully below
]);

function authHeader(apiKey: string): string {
  return `Basic ${btoa(`any:${apiKey}`)}`;
}

function classifyError(
  status: number,
  title: string,
  detail: string
): MailchimpOutcome {
  const t = title || '';
  const d = (detail || '').toLowerCase();

  // Config mistakes must never look like success (check before member_state —
  // Mailchimp often uses title "Invalid Resource" for bad interest IDs too).
  if (
    d.includes('invalid interest') ||
    d.includes('interest id') ||
    d.includes('interest category')
  ) {
    return { kind: 'config_error', title: t || 'invalid_interest', status };
  }

  if (
    d.includes('compliance') ||
    d.includes('cleaned') ||
    d.includes('forgotten') ||
    d.includes('permanently deleted') ||
    t === 'Member In Compliance State' ||
    t === 'Forgotten Email Not Subscribed'
  ) {
    return { kind: 'member_state', title: t || 'member_state' };
  }

  if (
    status === 400 &&
    (d.includes('looks fake') ||
      d.includes('invalid email') ||
      d.includes('valid email') ||
      (t === 'Invalid Resource' &&
        (d.includes('email') || d.includes('fake') || d.includes('domain'))))
  ) {
    return { kind: 'invalid_email', title: t || 'invalid_email' };
  }

  if (status === 401 || status === 403 || status === 404) {
    return { kind: 'config_error', title: t || `http_${status}`, status };
  }

  if (status === 400) {
    return { kind: 'config_error', title: t || 'bad_request', status };
  }

  if (status === 429 || status >= 500) {
    return { kind: 'upstream', title: t || `http_${status}`, status };
  }

  return { kind: 'config_error', title: t || `http_${status}`, status };
}

async function readErrorBody(res: Response): Promise<{ title: string; detail: string }> {
  try {
    const errBody = (await res.json()) as { title?: string; detail?: string };
    return { title: errBody.title || '', detail: errBody.detail || '' };
  } catch {
    return { title: 'unparseable', detail: '' };
  }
}

/**
 * Look up current member status. 404 → missing.
 * Failures that aren't 404 are returned as upstream/config so the caller
 * can decide; we do not invent a status.
 */
export async function getMemberStatus(opts: {
  apiKey: string;
  dc: string;
  audienceId: string;
  email: string;
  timeoutMs?: number;
}): Promise<
  | { ok: true; status: MemberStatus }
  | { ok: false; outcome: MailchimpOutcome }
> {
  const hash = await md5Hex(opts.email);
  const url = `https://${opts.dc}.api.mailchimp.com/3.0/lists/${opts.audienceId}/members/${hash}?fields=status`;

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? 8000
  );

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { authorization: authHeader(opts.apiKey) },
      signal: controller.signal
    });

    if (res.status === 404) {
      return { ok: true, status: 'missing' };
    }

    if (!res.ok) {
      const { title, detail } = await readErrorBody(res);
      console.log(
        JSON.stringify({
          outcome: 'mailchimp_get_error',
          status: res.status,
          title,
          detail: detail.slice(0, 200)
        })
      );
      return { ok: false, outcome: classifyError(res.status, title, detail) };
    }

    const data = (await res.json()) as { status?: string };
    const s = (data.status || '').toLowerCase();
    if (
      s === 'subscribed' ||
      s === 'pending' ||
      s === 'unsubscribed' ||
      s === 'cleaned' ||
      s === 'transactional'
    ) {
      return { ok: true, status: s };
    }
    return { ok: true, status: 'other' };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    return {
      ok: false,
      outcome: {
        kind: 'upstream',
        title: aborted ? 'timeout' : 'network',
        status: aborted ? 504 : 502
      }
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Record a custom event on the contact Activity feed.
 * Failures are logged only — preference updates should still succeed.
 */
export async function trackMemberEvent(opts: {
  apiKey: string;
  dc: string;
  audienceId: string;
  email: string;
  name: string;
  properties?: Record<string, string>;
  timeoutMs?: number;
}): Promise<boolean> {
  const hash = await md5Hex(opts.email);
  const url = `https://${opts.dc}.api.mailchimp.com/3.0/lists/${opts.audienceId}/members/${hash}/events`;

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? 8000
  );

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: authHeader(opts.apiKey),
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: opts.name,
        properties: opts.properties || {}
      }),
      signal: controller.signal
    });

    if (res.ok || res.status === 204) {
      return true;
    }

    const { title, detail } = await readErrorBody(res);
    console.log(
      JSON.stringify({
        outcome: 'mailchimp_event_error',
        status: res.status,
        title,
        detail: detail.slice(0, 200)
      })
    );
    return false;
  } catch (e) {
    console.log(
      JSON.stringify({
        outcome: 'mailchimp_event_error',
        title: e instanceof Error ? e.name : 'network'
      })
    );
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Mailchimp validates ip_signup / ip_opt as real IPv4/IPv6.
 * Skip placeholders and loopback so we never wipe a blank with junk.
 */
export function isUsableClientIp(ip: string | undefined | null): ip is string {
  if (!ip) return false;
  const v = ip.trim();
  if (
    !v ||
    v === '0.0.0.0' ||
    v === '::' ||
    v === '::1' ||
    v === '127.0.0.1'
  ) {
    return false;
  }
  // IPv4
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(v)) return true;
  // IPv6 (Cloudflare CF-Connecting-IP)
  if (v.includes(':') && /^[0-9a-fA-F:.]+$/.test(v)) return true;
  return false;
}

/**
 * Upsert interests on a member.
 *
 * - New / subscribed / pending: only `status_if_new: pending` (no `status`),
 *   so existing subscribed members keep their status.
 * - Unsubscribed: set `status: pending` + interests so they get a fresh
 *   double-opt-in email. Interests are stored on the pending member and
 *   remain after they confirm.
 * - Cleaned / compliance: treated as member_state (generic success to client).
 * - After a successful upsert, record a custom Activity event (new + existing)
 *   including widget_version when provided.
 * - For new / resubscribe contacts, set `ip_signup` from CF-Connecting-IP
 *   so Mailchimp's "Signup IP address" is populated. Do not set `ip_opt` —
 *   Mailchimp fills that when they confirm the double-opt-in link.
 */
export async function upsertMemberInterests(opts: {
  apiKey: string;
  dc: string;
  audienceId: string;
  email: string;
  interests: InterestTarget[];
  /** Short interest keys from the client, for Activity event properties */
  interestKeys?: string[];
  /** Front-end widget build version from WIDGET_CHANGELOG.md */
  widgetVersion?: string;
  /** Client IP (CF-Connecting-IP) for Mailchimp ip_signup on new / resubscribe */
  signupIp?: string;
  timeoutMs?: number;
}): Promise<MailchimpOutcome> {
  const lookup = await getMemberStatus(opts);
  if (!lookup.ok) return lookup.outcome;

  if (lookup.status === 'cleaned') {
    return { kind: 'member_state', title: 'cleaned' };
  }

  const hash = await md5Hex(opts.email);
  const url = `https://${opts.dc}.api.mailchimp.com/3.0/lists/${opts.audienceId}/members/${hash}`;

  const interestsBody: Record<string, boolean> = {};
  for (const t of opts.interests) {
    interestsBody[t.interestId] = true;
  }

  const resubscribe = lookup.status === 'unsubscribed';
  const isNew = lookup.status === 'missing';
  const body: Record<string, unknown> = {
    email_address: opts.email,
    interests: interestsBody
  };

  if (resubscribe) {
    // Existing unsubscribed → pending triggers confirmation email again.
    // Interests on this PUT are kept when they confirm.
    body.status = 'pending';
  } else {
    // New contacts become pending; subscribed/pending keep their status.
    body.status_if_new = 'pending';
  }

  // Signup IP only on new / resubscribe — don't overwrite historical signup IP
  // on preference updates for already-subscribed members.
  if ((isNew || resubscribe) && isUsableClientIp(opts.signupIp)) {
    body.ip_signup = opts.signupIp.trim();
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? 8000
  );

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        authorization: authHeader(opts.apiKey),
        'content-type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) {
      const { title, detail } = await readErrorBody(res);
      console.log(
        JSON.stringify({
          outcome: 'mailchimp_error',
          status: res.status,
          title,
          detail: detail.slice(0, 200)
        })
      );
      return classifyError(res.status, title, detail);
    }

    const labels = opts.interests.map((t) => t.label).join(', ');
    const keys = (opts.interestKeys || []).join(',');
    const action =
      lookup.status === 'subscribed'
        ? 'preference_update'
        : lookup.status === 'unsubscribed'
          ? 'resubscribe'
          : lookup.status === 'pending'
            ? 'pending_update'
            : 'new_subscriber';

    const activityEventRecorded = await trackMemberEvent({
      apiKey: opts.apiKey,
      dc: opts.dc,
      audienceId: opts.audienceId,
      email: opts.email,
      name: 'newsletter_signup',
      properties: {
        action,
        newsletters: labels.slice(0, 100),
        interest_keys: keys.slice(0, 100),
        widget_version: (opts.widgetVersion || 'unknown').slice(0, 40),
        source: 'sasktoday-widget'
      }
    });

    return {
      kind: 'ok',
      resubscribed: resubscribe,
      previousStatus: lookup.status,
      activityEventRecorded
    };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    return {
      kind: 'upstream',
      title: aborted ? 'timeout' : 'network',
      status: aborted ? 504 : 502
    };
  } finally {
    clearTimeout(timer);
  }
}
