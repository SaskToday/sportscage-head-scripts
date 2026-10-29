import { describe, expect, it } from 'vitest';
import {
  INTERESTS,
  SASKTODAY_AUDIENCE_ID,
  SPORTSCAGE_AUDIENCE_ID,
  resolveInterestKeys
} from '../src/interests';

describe('resolveInterestKeys', () => {
  it('rejects empty', () => {
    expect(resolveInterestKeys([]).ok).toBe(false);
  });

  it('rejects unknown keys', () => {
    const r = resolveInterestKeys(['nope']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.unknownKey).toBe('nope');
  });

  it('resolves Regina to SaskToday audience', () => {
    const r = resolveInterestKeys(['reginatoday-daily']);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.targets[0].audienceId).toBe(SASKTODAY_AUDIENCE_ID);
    expect(r.targets[0].interestId).toBe('529636a6ae');
  });

  it('groups SaskToday daily+weekly on one audience', () => {
    const r = resolveInterestKeys(['sasktoday-daily', 'sasktoday-weekly']);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.byAudience.size).toBe(1);
    expect(r.byAudience.get(SASKTODAY_AUDIENCE_ID)?.length).toBe(2);
  });

  it('keeps SportsCage on its own audience', () => {
    const r = resolveInterestKeys(['sportscage-insider', 'reginatoday-daily']);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.byAudience.size).toBe(2);
    expect(r.byAudience.has(SPORTSCAGE_AUDIENCE_ID)).toBe(true);
    expect(r.byAudience.has(SASKTODAY_AUDIENCE_ID)).toBe(true);
  });

  it('has an entry for every configured newsletter key we ship', () => {
    const expected = [
      'reginatoday-daily',
      'saskatoontoday-daily',
      'estevantoday-daily',
      'sasktoday-daily',
      'sasktoday-weekly',
      'saskagtoday-daily',
      'crime-cops-court-daily',
      'sportscage-insider'
    ];
    for (const key of expected) {
      expect(INTERESTS[key], key).toBeTruthy();
    }
  });

  it('uses Marketing API interest ids (not short embed bits)', () => {
    expect(INTERESTS['saskatoontoday-daily'].interestId).toBe('8d20fcd7c5');
    expect(INTERESTS['estevantoday-daily'].interestId).toBe('e83801031f');
    expect(INTERESTS['sasktoday-daily'].interestId).toBe('1f6feffe71');
    expect(INTERESTS['sasktoday-weekly'].interestId).toBe('7cb137b2ea');
    expect(INTERESTS['saskagtoday-daily'].interestId).toBe('8ec9e02d98');
    expect(INTERESTS['crime-cops-court-daily'].interestId).toBe('4dd03444bf');
    expect(INTERESTS['sportscage-insider'].interestId).toBe('e87c90a88d');
    expect(INTERESTS['sportscage-insider'].audienceId).toBe(SPORTSCAGE_AUDIENCE_ID);
  });
});
