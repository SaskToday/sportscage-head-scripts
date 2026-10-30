import { describe, expect, it } from 'vitest';
import {
  edmontonDateString,
  formatDisposableDigest,
  previousEdmontonDay,
  utcHourBucketsForEdmontonDay
} from '../src/daily-digest';

describe('daily disposable digest helpers', () => {
  it('formats en-CA Edmonton dates', () => {
    // 2026-10-30 18:00 UTC = 12:00 MDT
    const d = new Date('2026-10-30T18:00:00Z');
    expect(edmontonDateString(d)).toBe('2026-10-30');
  });

  it('previousEdmontonDay crosses local midnight', () => {
    // 2026-10-31 06:30 UTC ≈ 00:30 MDT on Oct 31 → previous = Oct 30
    const d = new Date('2026-10-31T06:30:00Z');
    expect(previousEdmontonDay(d)).toBe('2026-10-30');
  });

  it('returns 24 UTC hour buckets for an Edmonton day', () => {
    const buckets = utcHourBucketsForEdmontonDay('2026-10-30');
    expect(buckets.length).toBe(24);
    // MDT = UTC-6 → local Oct 30 00:00 = 2026-10-30 06:00 UTC → bucket 2026103006
    expect(buckets[0]).toBe('2026103006');
    expect(buckets[23]).toBe('2026103105');
  });

  it('formats digest with percentage', () => {
    const text = formatDisposableDigest({
      day: '2026-10-30',
      signups: 40,
      disposable: 2
    });
    expect(text).toContain('40');
    expect(text).toContain('2');
    expect(text).toContain('5.0%');
    expect(text).toContain('Observe-only');
  });

  it('formats zero signups cleanly', () => {
    const text = formatDisposableDigest({
      day: '2026-10-30',
      signups: 0,
      disposable: 0
    });
    expect(text).toContain('0%');
  });
});
