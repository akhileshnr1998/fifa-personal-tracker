import { isShootoutEvent } from './matchSummaryHelpers';
import type { DecidedBy, MatchEvent } from './types';

export interface MatchEventSection {
  id: 'shootout' | 'extra_time' | 'regulation';
  title: string;
  events: MatchEvent[];
  defaultCollapsed?: boolean;
}

export interface ShootoutRound {
  round: number;
  home: MatchEvent | null;
  away: MatchEvent | null;
}

export type ShootoutDot = 'scored' | 'missed';

/** True for 91'+ ET period events — not stoppage time (45+2', 90+4'). */
export function isExtraPeriodEvent(event: MatchEvent): boolean {
  return (
    !isShootoutEvent(event.type) &&
    event.minute != null &&
    event.minute > 90 &&
    event.is_extra_time
  );
}

export function isRegulationPeriodEvent(event: MatchEvent): boolean {
  return !isShootoutEvent(event.type) && !isExtraPeriodEvent(event);
}

/** Sort key for reverse-chronological display within a period. */
export function eventSortKey(event: MatchEvent): number {
  if (event.minute === null) return -1;
  if (isExtraPeriodEvent(event)) return event.minute;
  if (event.is_extra_time && event.minute <= 90) return event.minute + 0.5;
  return event.minute;
}

export function sortEventsLatestFirst(events: MatchEvent[]): MatchEvent[] {
  return [...events].sort((a, b) => eventSortKey(b) - eventSortKey(a));
}

export function sortShootoutLatestFirst(events: MatchEvent[]): MatchEvent[] {
  return [...events].reverse();
}

export function splitShootoutByTeam(
  events: MatchEvent[],
  homeTeamId: number,
  awayTeamId: number,
): { home: MatchEvent[]; away: MatchEvent[] } {
  const home: MatchEvent[] = [];
  const away: MatchEvent[] = [];

  for (const event of events) {
    if (event.team_id === awayTeamId) {
      away.push(event);
    } else if (event.team_id === homeTeamId) {
      home.push(event);
    } else if (event.team_id == null) {
      // Unknown team — append to shorter column to keep balance
      if (home.length <= away.length) home.push(event);
      else away.push(event);
    }
  }

  return { home, away };
}

export function shootoutDotSequence(events: MatchEvent[]): ShootoutDot[] {
  return [...events].reverse().map((e) =>
    e.type === 'shootout_goal' ? 'scored' : 'missed',
  );
}

export function buildShootoutRounds(
  events: MatchEvent[],
  homeTeamId: number,
  awayTeamId: number,
): ShootoutRound[] {
  const hasShotNumbers = events.some((e) => e.shot_number != null);

  if (hasShotNumbers) {
    const roundMap = new Map<number, ShootoutRound>();
    for (const event of events) {
      const round = event.shot_number ?? 0;
      if (!roundMap.has(round)) {
        roundMap.set(round, { round, home: null, away: null });
      }
      const row = roundMap.get(round)!;
      if (event.team_id === homeTeamId) row.home = event;
      else if (event.team_id === awayTeamId) row.away = event;
    }
    return [...roundMap.values()].sort((a, b) => b.round - a.round);
  }

  const { home, away } = splitShootoutByTeam(events, homeTeamId, awayTeamId);
  const maxLen = Math.max(home.length, away.length);
  const rounds: ShootoutRound[] = [];
  for (let i = 0; i < maxLen; i++) {
    rounds.push({
      round: maxLen - i,
      home: home[i] ?? null,
      away: away[i] ?? null,
    });
  }
  return rounds;
}

/**
 * Groups match events into display sections, newest period first:
 * Penalty Shootout → Extra Time → Full Time.
 * Within each section, latest event appears first.
 */
export function groupMatchEventsForDisplay(
  events: MatchEvent[],
  decidedBy: DecidedBy,
): MatchEventSection[] {
  const shootout = sortShootoutLatestFirst(
    events.filter((e) => isShootoutEvent(e.type)),
  );
  const extraTime = sortEventsLatestFirst(events.filter(isExtraPeriodEvent));
  const regulation = sortEventsLatestFirst(events.filter(isRegulationPeriodEvent));

  const multiPeriod = shootout.length > 0 || extraTime.length > 0;
  const sections: MatchEventSection[] = [];

  if (shootout.length > 0) {
    sections.push({
      id: 'shootout',
      title: 'Penalty Shootout',
      events: shootout,
    });
  }
  if (extraTime.length > 0) {
    sections.push({
      id: 'extra_time',
      title: 'Extra Time',
      events: extraTime,
      defaultCollapsed: decidedBy === 'penalties',
    });
  }
  if (regulation.length > 0) {
    sections.push({
      id: 'regulation',
      title: multiPeriod ? 'Full Time' : 'Match Events',
      events: regulation,
      defaultCollapsed:
        decidedBy === 'penalties' || decidedBy === 'extra_time',
    });
  }

  return sections;
}
