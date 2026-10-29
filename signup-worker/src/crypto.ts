/** Hex-encode an ArrayBuffer */
export function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 hex digest (for rate-limit KV keys — not stored as PII). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

/**
 * MD5 hex digest — required by Mailchimp for subscriber_hash.
 * This is an identifier, not a security control.
 * Cloudflare Workers support MD5 via SubtleCrypto for this use case.
 */
export async function md5Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('MD5', data);
  return toHex(digest);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Practical email shape check (not RFC-perfect). */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  // Basic local@domain with a dot in the domain
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
