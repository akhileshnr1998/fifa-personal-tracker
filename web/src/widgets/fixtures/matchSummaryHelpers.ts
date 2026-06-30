import type { MatchEventType } from './types';

export function eventIcon(type: MatchEventType): string {
  switch (type) {
    case 'goal':
    case 'own_goal':
    case 'penalty_goal':
      return '⚽';
    case 'penalty_miss':
      return '❌';
    case 'shootout_goal':
      return '✅';
    case 'shootout_miss':
      return '❌';
    case 'yellow_card':
      return '🟨';
    case 'red_card':
      return '🟥';
  }
}

export function eventLabel(type: MatchEventType): string {
  switch (type) {
    case 'goal':
      return 'Goal';
    case 'own_goal':
      return 'Own Goal';
    case 'penalty_goal':
      return 'Penalty';
    case 'penalty_miss':
      return 'Penalty Miss';
    case 'shootout_goal':
      return 'Scored';
    case 'shootout_miss':
      return 'Missed';
    case 'yellow_card':
      return 'Yellow Card';
    case 'red_card':
      return 'Red Card';
  }
}

export function formatMinute(minute: number | null, isExtraTime: boolean): string {
  if (minute === null) return "?'";
  if (isExtraTime && minute > 90) return `${minute}'`;
  if (isExtraTime) return `${minute}+'`;
  return `${minute}'`;
}

export function isShootoutEvent(type: MatchEventType): boolean {
  return type === 'shootout_goal' || type === 'shootout_miss';
}

/**
 * Returns 0–100 integer percentage widths for a dual-team comparison bar.
 * Null values are treated as 0. When both sides are 0, returns a 50/50 split
 * so the bar never renders as completely empty.
 */
export function statBarWidths(
  homeVal: number | null,
  awayVal: number | null,
): { homePct: number; awayPct: number } {
  const h = homeVal ?? 0;
  const a = awayVal ?? 0;
  const total = h + a;
  if (total === 0) return { homePct: 50, awayPct: 50 };
  const homePct = Math.round((h / total) * 100);
  return { homePct, awayPct: 100 - homePct };
}
