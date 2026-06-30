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

export interface FixtureScoreDisplay {
  regulation: string | null;
  pensLine: string | null;
  outcome: string | null;
}

export function formatFixtureScoreDisplay(
  fixture: Pick<
    Fixture,
    | 'status'
    | 'home_score'
    | 'away_score'
    | 'decided_by'
    | 'home_penalty_score'
    | 'away_penalty_score'
    | 'home_team'
    | 'away_team'
  >,
): FixtureScoreDisplay {
  if (fixture.status !== 'finished') {
    return { regulation: null, pensLine: null, outcome: null };
  }
  if (fixture.home_score === null || fixture.away_score === null) {
    return { regulation: null, pensLine: null, outcome: null };
  }

  const regulation = `${fixture.home_score} – ${fixture.away_score}`;
  let pensLine: string | null = null;
  let outcome: string | null = null;

  if (
    fixture.decided_by === 'penalties' &&
    fixture.home_penalty_score != null &&
    fixture.away_penalty_score != null
  ) {
    pensLine = `${fixture.home_penalty_score} – ${fixture.away_penalty_score} pens`;
    if (fixture.home_penalty_score > fixture.away_penalty_score) {
      outcome = `${fixture.home_team.name} win on penalties`;
    } else if (fixture.away_penalty_score > fixture.home_penalty_score) {
      outcome = `${fixture.away_team.name} win on penalties`;
    }
  } else if (fixture.decided_by === 'extra_time') {
    if (fixture.home_score > fixture.away_score) {
      outcome = `${fixture.home_team.name} win after extra time`;
    } else if (fixture.away_score > fixture.home_score) {
      outcome = `${fixture.away_team.name} win after extra time`;
    }
  }

  return { regulation, pensLine, outcome };
}

/** Compact pens subline for fixture cards, e.g. "3–4 pens". */
export function formatFixturePensSubline(
  fixture: Pick<
    Fixture,
    'decided_by' | 'home_penalty_score' | 'away_penalty_score'
  >,
): string | null {
  if (
    fixture.decided_by !== 'penalties' ||
    fixture.home_penalty_score == null ||
    fixture.away_penalty_score == null
  ) {
    return null;
  }
  return `${fixture.home_penalty_score}–${fixture.away_penalty_score} pens`;
}
