import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail } from '../src/crypto';

describe('email helpers', () => {
  it('normalizes', () => {
    expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com');
  });

  it('validates shape', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});
