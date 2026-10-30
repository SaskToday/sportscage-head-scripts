import { parseList } from './env';

/** Allow exact listed origins, plus any port on localhost / 127.0.0.1 for local previews. */
export function getAllowedOrigin(
  originHeader: string | null,
  allowedCsv: string
): string | null {
  if (!originHeader) return null;
  const allowed = parseList(allowedCsv);
  if (allowed.includes(originHeader)) return originHeader;

  try {
    const url = new URL(originHeader);
    const localHost =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol === 'http:' && localHost) {
      return originHeader;
    }
  } catch {
    return null;
  }

  return null;
}

export function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

export function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null,
  extraHeaders?: HeadersInit
): Response {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    ...(extraHeaders || {})
  });
  if (origin) {
    const cors = corsHeaders(origin);
    for (const [k, v] of Object.entries(cors)) {
      headers.set(k, v as string);
    }
  }
  return new Response(JSON.stringify(body), { status, headers });
}
