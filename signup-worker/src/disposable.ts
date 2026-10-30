import { DISPOSABLE_DOMAIN_LIST } from './data/disposable-domains';

const DISPOSABLE_SET: Set<string> = new Set(DISPOSABLE_DOMAIN_LIST);

/**
 * Extract the email domain and all parent suffixes
 * (e.g. a.b.mailinator.com → a.b.mailinator.com, b.mailinator.com, mailinator.com).
 */
export function emailDomainCandidates(email: string): string[] {
  const at = email.lastIndexOf('@');
  if (at < 0) return [];
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain || domain.includes(' ') || !domain.includes('.')) return [];

  const labels = domain.split('.').filter(Boolean);
  if (labels.length < 2) return [];

  const candidates: string[] = [];
  for (let i = 0; i <= labels.length - 2; i++) {
    candidates.push(labels.slice(i).join('.'));
  }
  return candidates;
}

/**
 * True if the email's domain (or a parent suffix) is on the disposable snapshot.
 * Observe-only — lists lag and can false-positive; do not block solely on this.
 */
export function isDisposableEmailDomain(email: string): boolean {
  for (const d of emailDomainCandidates(email)) {
    if (DISPOSABLE_SET.has(d)) return true;
  }
  return false;
}

export function disposableListSize(): number {
  return DISPOSABLE_SET.size;
}
