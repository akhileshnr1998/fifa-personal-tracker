import { isShootoutEvent } from './matchSummaryHelpers';
import type { DecidedBy, MatchEvent } from './types';

export interface MatchEventSection {
  id: 'shootout' | 'extra_time' | 'regulation';
  title: string;
  events: MatchEvent[];
}

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

/**
 * Groups match events into display sections, newest period first:
 * Penalty Shootout → Extra Time → Full Time.
 * Within each section, latest event appears first.
 */
export function groupMatchEventsForDisplay(
  events: MatchEvent[],
  _decidedBy: DecidedBy,
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
    });
  }
  if (regulation.length > 0) {
    sections.push({
      id: 'regulation',
      title: multiPeriod ? 'Full Time' : 'Match Events',
      events: regulation,
    });
  }

  return sections;
}
