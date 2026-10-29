import { parseList } from './env';

export type TurnstileResult =
  | { ok: true; hostname: string }
  | { ok: false; reason: string };

export async function verifyTurnstile(opts: {
  secret: string;
  token: string;
  remoteip?: string;
  allowedHostnamesCsv: string;
}): Promise<TurnstileResult> {
  if (!opts.token || typeof opts.token !== 'string') {
    return { ok: false, reason: 'missing_token' };
  }

  const form = new URLSearchParams();
  form.set('secret', opts.secret);
  form.set('response', opts.token);
  if (opts.remoteip) form.set('remoteip', opts.remoteip);

  let data: {
    success?: boolean;
    hostname?: string;
    'error-codes'?: string[];
  };

  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      }
    );
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, reason: 'siteverify_network' };
  }

  if (!data.success) {
    return {
      ok: false,
      reason: (data['error-codes'] || ['failed']).join(',')
    };
  }

  const hostname = data.hostname || '';
  const allowed = parseList(opts.allowedHostnamesCsv);
  if (!hostname || !allowed.includes(hostname)) {
    return { ok: false, reason: 'hostname_mismatch' };
  }

  return { ok: true, hostname };
}
