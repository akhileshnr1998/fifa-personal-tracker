import { describe, expect, it } from 'vitest';
import {
  eventIcon,
  eventLabel,
  formatMinute,
  statBarWidths,
} from './matchSummaryHelpers';

describe('eventIcon', () => {
  it('returns ⚽ for goal', () => {
    expect(eventIcon('goal')).toBe('⚽');
  });
  it('returns ⚽ for own_goal', () => {
    expect(eventIcon('own_goal')).toBe('⚽');
  });
  it('returns ⚽ for penalty_goal', () => {
    expect(eventIcon('penalty_goal')).toBe('⚽');
  });
  it('returns ❌ for penalty_miss', () => {
    expect(eventIcon('penalty_miss')).toBe('❌');
  });
  it('returns 🟨 for yellow_card', () => {
    expect(eventIcon('yellow_card')).toBe('🟨');
  });
  it('returns 🟥 for red_card', () => {
    expect(eventIcon('red_card')).toBe('🟥');
  });
});

describe('eventLabel', () => {
  it('returns "Goal" for goal', () => {
    expect(eventLabel('goal')).toBe('Goal');
  });
  it('returns "Own Goal" for own_goal', () => {
    expect(eventLabel('own_goal')).toBe('Own Goal');
  });
  it('returns "Penalty" for penalty_goal', () => {
    expect(eventLabel('penalty_goal')).toBe('Penalty');
  });
  it('returns "Penalty Miss" for penalty_miss', () => {
    expect(eventLabel('penalty_miss')).toBe('Penalty Miss');
  });
  it('returns "Yellow Card" for yellow_card', () => {
    expect(eventLabel('yellow_card')).toBe('Yellow Card');
  });
  it('returns "Red Card" for red_card', () => {
    expect(eventLabel('red_card')).toBe('Red Card');
  });
});

describe('formatMinute', () => {
  it("returns \"23'\" for minute 23 not in extra time", () => {
    expect(formatMinute(23, false)).toBe("23'");
  });
  it("returns \"45+'\" for minute 45 in extra time", () => {
    expect(formatMinute(45, true)).toBe("45+'");
  });
  it("returns \"?'\" when minute is null", () => {
    expect(formatMinute(null, false)).toBe("?'");
  });
  it("returns \"?'\" when minute is null even in extra time", () => {
    expect(formatMinute(null, true)).toBe("?'");
  });
});

describe('statBarWidths', () => {
  it('returns 50/50 when both values are null', () => {
    expect(statBarWidths(null, null)).toEqual({ homePct: 50, awayPct: 50 });
  });
  it('returns 50/50 when both values are 0', () => {
    expect(statBarWidths(0, 0)).toEqual({ homePct: 50, awayPct: 50 });
  });
  it('computes correct 60/40 split', () => {
    expect(statBarWidths(60, 40)).toEqual({ homePct: 60, awayPct: 40 });
  });
  it('handles 100/0 when away is 0', () => {
    expect(statBarWidths(10, 0)).toEqual({ homePct: 100, awayPct: 0 });
  });
  it('handles 0/100 when home is 0', () => {
    expect(statBarWidths(0, 5)).toEqual({ homePct: 0, awayPct: 100 });
  });
  it('rounds to nearest integer (25/75)', () => {
    expect(statBarWidths(1, 3)).toEqual({ homePct: 25, awayPct: 75 });
  });
  it('treats null as 0 (home null, away has value)', () => {
    expect(statBarWidths(null, 8)).toEqual({ homePct: 0, awayPct: 100 });
  });
});
