/**
 * Client sends short interest keys only. Never accept raw Mailchimp group IDs.
 *
 * Interest IDs below come from the Mailchimp embed form field names
 * (`group[categoryId][interestId]`). Confirm against the Marketing API before
 * production:
 *   GET /3.0/lists/{audience_id}/interest-categories
 *   GET /3.0/lists/{audience_id}/interest-categories/{id}/interests
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
    interestId: '8',
    label: 'ReginaToday Daily'
  },
  'saskatoontoday-daily': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '32',
    label: 'SaskatoonToday Daily'
  },
  'estevantoday-daily': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '1',
    label: 'EstevanToday Daily'
  },
  // Yorkton reserved until embed / group exists
  // 'yorktontoday-daily': { ... },

  'sasktoday-daily': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '2',
    label: 'SaskToday Daily'
  },
  'sasktoday-weekly': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '4',
    label: 'SaskToday Weekly'
  },
  'saskagtoday-daily': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '64',
    label: 'SaskAgToday Daily'
  },
  'crime-cops-court-daily': {
    audienceId: SASKTODAY_AUDIENCE_ID,
    interestId: '16',
    label: 'Crime, Cops & Court Daily'
  },
  'sportscage-insider': {
    audienceId: SPORTSCAGE_AUDIENCE_ID,
    interestId: '1',
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
