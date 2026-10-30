/**
 * Client sends short interest keys only. Never accept raw Mailchimp group IDs.
 *
 * Interest IDs are Marketing API interest `id` values (not embed
 * `group[category][bit]` values). Confirmed 2026-10-29 from list API.
 */

export type InterestTarget = {
  audienceId: string;
  interestId: string;
  /** Human label for logs / alerts only */
  label: string;
};

/** SaskToday main audience (sasktoday.us18) */
export const SASKTODAY_AUDIENCE_ID = 'b666fb9950';

/** SportsCage Insider audience (harvardmedia.us18) — same account / DC as SaskToday */
export const SPORTSCAGE_AUDIENCE_ID = 'e0e70bc1df';

export const INTERESTS: Record<string, InterestTarget> = {
  'reginatoday-daily': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '529636a6ae',
    label: 'ReginaToday Daily'
  },
  'saskatoontoday-daily': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '8d20fcd7c5',
    label: 'SaskatoonToday Daily'
  },
  'estevantoday-daily': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: 'e83801031f',
    label: 'EstevanToday Daily'
  },
  // Yorkton reserved until group exists
  // 'yorktontoday-daily': { ... },

  'sasktoday-daily': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '1f6feffe71',
    label: 'SaskToday Daily'
  },
  'sasktoday-weekly': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '7cb137b2ea',
    label: 'SaskToday Weekly'
  },
  'saskagtoday-daily': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '8ec9e02d98',
    label: 'SaskAgToday Daily'
  },
  'crime-cops-court-daily': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '4dd03444bf',
    label: 'Crime, Cops & Court Daily'
  },
  'sportscage-insider': {
    audienceId: SPORTSCAGE_AUDIENCE_ID,
    interestId: 'e87c90a88d',
    label: 'SportsCage Insider'
  }
};

export function resolveInterestKeys(keys: string[]): {
  ok: true;
  targets: InterestTarget[];
  /** Grouped by audience for Mailchimp PUTs */
  byAudience: Map<string, InterestTarget[]>;
} | { ok: false; reason: 'empty' | 'unknown'; unknownKey?: string } {
  if (!keys.length) return { ok: false, reason: 'empty' };

  const targets: InterestTarget[] = [];
  const byAudience = new Map<string, InterestTarget[]>();

  for (const key of keys) {
    const target = INTERESTS[key];
    if (!target) return { ok: false, reason: 'unknown', unknownKey: key };
    targets.push(target);
    const list = byAudience.get(target.audienceId) || [];
    list.push(target);
    byAudience.set(target.audienceId, list);
  }

  return { ok: true, targets, byAudience };
}
