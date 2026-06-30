import { describe, expect, it } from 'vitest';
import { formatFixtureScore, formatFixtureScoreMeta } from './formatFixtureScore';

describe('formatFixtureScore', () => {
  const base = {
    status: 'finished' as const,
    home_score: 1,
    away_score: 1,
    decided_by: 'regulation' as const,
    home_penalty_score: null,
    away_penalty_score: null,
  };

  it('returns null for scheduled matches', () => {
    expect(
      formatFixtureScore({ ...base, status: 'scheduled', home_score: null }),
    ).toBeNull();
  });
  it('returns plain score for regulation', () => {
    expect(formatFixtureScore({ ...base, home_score: 2, away_score: 1 })).toBe(
      '2 – 1',
    );
  });
  it('returns score with pens suffix', () => {
    expect(
      formatFixtureScore({
        ...base,
        decided_by: 'penalties',
        home_penalty_score: 3,
        away_penalty_score: 4,
      }),
    ).toBe('1 – 1 (3–4)');
  });
});

describe('formatFixtureScoreMeta', () => {
  it('returns "AET" for extra_time', () => {
    expect(formatFixtureScoreMeta('extra_time')).toBe('AET');
  });
  it('returns "Pens" for penalties', () => {
    expect(formatFixtureScoreMeta('penalties')).toBe('Pens');
  });
  it('returns null for regulation', () => {
    expect(formatFixtureScoreMeta('regulation')).toBeNull();
  });
});
