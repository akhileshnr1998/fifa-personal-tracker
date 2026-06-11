import { describe, expect, it } from 'vitest';
import { findNearestUpcomingFixture } from './findNearestUpcomingFixture';
import type { Fixture } from './types';

function makeFixture(
  id: number,
  match_date_time: string,
): Fixture {
  return {
    id,
    match_number: id,
    match_date_time,
    stage_id: 1,
    home_team: { id: 1, name: 'Home' },
    away_team: { id: 2, name: 'Away' },
    venue: { id: 1, name: 'Stadium' },
    status: 'scheduled',
    home_score: null,
    away_score: null,
  };
}

describe('findNearestUpcomingFixture', () => {
  const now = new Date('2026-06-15T18:00:00.000Z');

  it('returns null for an empty list', () => {
    expect(findNearestUpcomingFixture([], now)).toBeNull();
  });

  it('returns the next upcoming match when some fixtures are in the past', () => {
    const fixtures = [
      makeFixture(1, '2026-06-14T18:00:00.000Z'),
      makeFixture(2, '2026-06-15T20:00:00.000Z'),
      makeFixture(3, '2026-06-16T18:00:00.000Z'),
    ];

    expect(findNearestUpcomingFixture(fixtures, now)?.id).toBe(2);
  });

  it('returns the earliest match when all kickoffs are still ahead', () => {
    const fixtures = [
      makeFixture(2, '2026-06-16T18:00:00.000Z'),
      makeFixture(1, '2026-06-15T19:00:00.000Z'),
    ];

    expect(findNearestUpcomingFixture(fixtures, now)?.id).toBe(1);
  });

  it('returns the most recent match when every kickoff is in the past', () => {
    const fixtures = [
      makeFixture(1, '2026-06-13T18:00:00.000Z'),
      makeFixture(2, '2026-06-14T20:00:00.000Z'),
    ];

    expect(findNearestUpcomingFixture(fixtures, now)?.id).toBe(2);
  });
});
