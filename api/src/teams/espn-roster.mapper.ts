import { EspnRosterAthlete, EspnRosterStat } from './espn-roster.types';

export function parseEspnId(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getAthleteStat(
  athlete: EspnRosterAthlete,
  statName: string,
): number {
  const categories = athlete.statistics?.splits?.categories ?? [];
  for (const category of categories) {
    const stat = category.stats?.find((entry) => entry.name === statName);
    if (stat?.value !== undefined && stat.value !== null) {
      return Math.round(stat.value);
    }
  }
  return 0;
}

export function collectAthleteStats(
  athlete: EspnRosterAthlete,
): EspnRosterStat[] {
  const categories = athlete.statistics?.splits?.categories ?? [];
  return categories.flatMap((category) => category.stats ?? []);
}
