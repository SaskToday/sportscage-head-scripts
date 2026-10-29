import { parseList } from './env';

export function getAllowedOrigin(
  originHeader: string | null,
  allowedCsv: string
): string | null {
  if (!originHeader) return null;
  const allowed = parseList(allowedCsv);
  return allowed.includes(originHeader) ? originHeader : null;
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
