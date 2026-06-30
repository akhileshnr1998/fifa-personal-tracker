import type { Fixture } from './types';

export function formatFixtureScore(
  fixture: Pick<
    Fixture,
    | 'status'
    | 'home_score'
    | 'away_score'
    | 'decided_by'
    | 'home_penalty_score'
    | 'away_penalty_score'
  >,
): string | null {
  if (fixture.status !== 'finished') return null;
  if (fixture.home_score === null || fixture.away_score === null) return null;

  const base = `${fixture.home_score} – ${fixture.away_score}`;
  if (
    fixture.decided_by === 'penalties' &&
    fixture.home_penalty_score != null &&
    fixture.away_penalty_score != null
  ) {
    return `${base} (${fixture.home_penalty_score}–${fixture.away_penalty_score})`;
  }
  return base;
}

export function formatFixtureScoreMeta(
  decidedBy: Fixture['decided_by'],
): string | null {
  if (decidedBy === 'extra_time') return 'AET';
  if (decidedBy === 'penalties') return 'Pens';
  return null;
}
