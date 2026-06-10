import type { Fixture } from './types';

export function findNearestUpcomingFixture(
  fixtures: Fixture[],
  now: Date = new Date(),
): Fixture | null {
  if (fixtures.length === 0) {
    return null;
  }

  const sorted = [...fixtures].sort(
    (left, right) =>
      new Date(left.match_date_time).getTime() -
      new Date(right.match_date_time).getTime(),
  );

  const nowMs = now.getTime();
  const upcoming = sorted.find(
    (fixture) => new Date(fixture.match_date_time).getTime() >= nowMs,
  );

  return upcoming ?? sorted[sorted.length - 1] ?? null;
}

export function fixtureElementId(fixtureId: number): string {
  return `fixture-${fixtureId}`;
}
