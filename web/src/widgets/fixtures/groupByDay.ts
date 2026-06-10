import type { Fixture } from './types';

export interface FixtureDayGroup {
  dateKey: string;
  heading: string;
  fixtures: Fixture[];
}

export function groupFixturesByDay(fixtures: Fixture[]): FixtureDayGroup[] {
  const groups = new Map<string, Fixture[]>();

  for (const fixture of fixtures) {
    const date = new Date(fixture.match_date_time);
    const dateKey = date.toISOString().slice(0, 10);
    const existing = groups.get(dateKey) ?? [];
    existing.push(fixture);
    groups.set(dateKey, existing);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, dayFixtures]) => ({
      dateKey,
      heading: formatDayHeading(new Date(`${dateKey}T12:00:00`)),
      fixtures: dayFixtures,
    }));
}

export function formatDayHeading(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatKickoffTime(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate));
}
