import type { InterestTarget } from './interests';
import { md5Hex } from './crypto';

export type MailchimpOutcome =
  | { kind: 'ok' }
  | { kind: 'member_state'; title: string }
  | { kind: 'invalid_email'; title: string }
  | { kind: 'config_error'; title: string; status: number }
  | { kind: 'upstream'; title: string; status: number };

const MEMBER_STATE_TITLES = new Set([
  'Member In Compliance State',
  'Forgotten Email Not Subscribed',
  'Invalid Resource' // often cleaned / permanently deleted — treat carefully below
]);

function classifyError(
  status: number,
  title: string,
  detail: string
): MailchimpOutcome {
  const t = title || '';
  const d = (detail || '').toLowerCase();

  if (
    MEMBER_STATE_TITLES.has(t) ||
    d.includes('compliance') ||
    d.includes('cleaned') ||
    d.includes('forgotten') ||
    d.includes('permanently deleted')
  ) {
    return { kind: 'member_state', title: t || 'member_state' };
  }

  if (
    status === 400 &&
    (t === 'Invalid Resource' ||
      d.includes('looks fake') ||
      d.includes('invalid email') ||
      d.includes('valid email'))
  ) {
    // Fake/invalid address vs wrong group ID both often use Invalid Resource.
    // Prefer invalid_email when the detail mentions the address/email format.
    if (
      d.includes('email') ||
      d.includes('fake') ||
      d.includes('domain')
    ) {
      return { kind: 'invalid_email', title: t || 'invalid_email' };
    }
  }

  if (status === 401 || status === 403 || status === 404) {
    return { kind: 'config_error', title: t || `http_${status}`, status };
  }

  if (status === 400) {
    // Bad interest / merge field / schema → config, must not look like success
    return { kind: 'config_error', title: t || 'bad_request', status };
  }

  if (status === 429 || status >= 500) {
    return { kind: 'upstream', title: t || `http_${status}`, status };
  }

  return { kind: 'config_error', title: t || `http_${status}`, status };
}

export async function upsertMemberInterests(opts: {
  apiKey: string;
  dc: string;
  audienceId: string;
  email: string;
  interests: InterestTarget[];
  timeoutMs?: number;
}): Promise<MailchimpOutcome> {
  const hash = await md5Hex(opts.email);
  const url = `https://${opts.dc}.api.mailchimp.com/3.0/lists/${opts.audienceId}/members/${hash}`;

  const interestsBody: Record<string, boolean> = {};
  for (const t of opts.interests) {
    interestsBody[t.interestId] = true;
  }

  const body = {
    email_address: opts.email,
    status_if_new: 'pending',
    interests: interestsBody
  };

  const auth = btoa(`any:${opts.apiKey}`);
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? 8000
  );

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        authorization: `Basic ${auth}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (res.ok) return { kind: 'ok' };

    let title = '';
    let detail = '';
    try {
      const errBody = (await res.json()) as {
        title?: string;
        detail?: string;
      };
      title = errBody.title || '';
      detail = errBody.detail || '';
      // Log server-side only — never return to client
      console.log(
        JSON.stringify({
          outcome: 'mailchimp_error',
          status: res.status,
          title,
          // detail may contain the email — keep off client; trim for logs
          detail: detail.slice(0, 200)
        })
      );
    } catch {
      console.log(
        JSON.stringify({
          outcome: 'mailchimp_error',
          status: res.status,
          title: 'unparseable'
        })
      );
    }

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
