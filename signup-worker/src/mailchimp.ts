import type { InterestTarget } from './interests';
import { md5Hex } from './crypto';

export type MailchimpOutcome =
  | { kind: 'ok'; resubscribed?: boolean }
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
 * Upsert interests on a member.
 *
 * - New / subscribed / pending: only `status_if_new: pending` (no `status`),
 *   so existing subscribed members keep their status.
 * - Unsubscribed: set `status: pending` + interests so they get a fresh
 *   double-opt-in email. Interests are stored on the pending member and
 *   remain after they confirm.
 * - Cleaned / compliance: treated as member_state (generic success to client).
 */
export async function upsertMemberInterests(opts: {
  apiKey: string;
  dc: string;
  audienceId: string;
  email: string;
  interests: InterestTarget[];
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

    if (res.ok) return { kind: 'ok', resubscribed: resubscribe };

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
