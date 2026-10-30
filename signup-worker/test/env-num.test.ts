import { describe, expect, it } from 'vitest';
import { num } from '../src/env';

describe('num', () => {
  it('parses positive integers', () => {
    expect(num('10', 99)).toBe(10);
  });

  it('allows zero (do not fall back)', () => {
    expect(num('0', 100)).toBe(0);
  });

  it('falls back on empty or invalid', () => {
    expect(num('', 100)).toBe(100);
    expect(num('  ', 100)).toBe(100);
    expect(num('nope', 100)).toBe(100);
    expect(num('-1', 100)).toBe(100);
  });
});
