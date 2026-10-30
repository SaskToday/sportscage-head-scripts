import { describe, expect, it } from 'vitest';
import { isUsableClientIp } from '../src/mailchimp';

describe('isUsableClientIp', () => {
  it('accepts public IPv4', () => {
    expect(isUsableClientIp('203.0.113.10')).toBe(true);
  });

  it('accepts IPv6', () => {
    expect(isUsableClientIp('2001:db8::1')).toBe(true);
  });

  it('rejects placeholders and loopback', () => {
    expect(isUsableClientIp('0.0.0.0')).toBe(false);
    expect(isUsableClientIp('127.0.0.1')).toBe(false);
    expect(isUsableClientIp('::')).toBe(false);
    expect(isUsableClientIp('::1')).toBe(false);
    expect(isUsableClientIp('')).toBe(false);
    expect(isUsableClientIp(null)).toBe(false);
    expect(isUsableClientIp(undefined)).toBe(false);
  });

  it('rejects garbage', () => {
    expect(isUsableClientIp('not-an-ip')).toBe(false);
    expect(isUsableClientIp('203.0.113')).toBe(false);
  });
});
