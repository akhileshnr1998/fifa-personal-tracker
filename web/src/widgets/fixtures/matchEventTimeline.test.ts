import { describe, expect, it } from 'vitest';
import {
  eventSortKey,
  groupMatchEventsForDisplay,
  sortEventsLatestFirst,
  splitShootoutByTeam,
} from './matchEventTimeline';
import type { MatchEvent } from './types';

function evt(
  overrides: Partial<MatchEvent> & Pick<MatchEvent, 'type'>,
): MatchEvent {
  return {
    minute: null,
    team_id: 1,
    player_name: 'Player',
    assist_name: null,
    is_extra_time: false,
    ...overrides,
  };
}

describe('sortEventsLatestFirst', () => {
  it('orders regulation events with latest minute first', () => {
    const sorted = sortEventsLatestFirst([
      evt({ type: 'goal', minute: 23 }),
      evt({ type: 'goal', minute: 54 }),
      evt({ type: 'yellow_card', minute: 42 }),
    ]);
    expect(sorted.map((e) => e.minute)).toEqual([54, 42, 23]);
  });

  it('places stoppage time after the same base minute', () => {
    const sorted = sortEventsLatestFirst([
      evt({ type: 'yellow_card', minute: 45, is_extra_time: false }),
      evt({ type: 'yellow_card', minute: 45, is_extra_time: true }),
      evt({ type: 'goal', minute: 44 }),
    ]);
    expect(sorted.map((e) => eventSortKey(e))).toEqual([45.5, 45, 44]);
  });

  it('orders extra-time period events latest first', () => {
    const sorted = sortEventsLatestFirst([
      evt({ type: 'goal', minute: 91, is_extra_time: true }),
      evt({ type: 'goal', minute: 105, is_extra_time: true }),
    ]);
    expect(sorted.map((e) => e.minute)).toEqual([105, 91]);
  });
});

describe('groupMatchEventsForDisplay', () => {
  it('returns a single Match Events section for regulation-only games', () => {
    const events = [
      evt({ type: 'goal', minute: 23 }),
      evt({ type: 'goal', minute: 54 }),
    ];
    const sections = groupMatchEventsForDisplay(events, 'regulation');

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Match Events');
    expect(sections[0].events.map((e) => e.minute)).toEqual([54, 23]);
  });

  it('puts Extra Time above Full Time when match went to AET', () => {
    const events = [
      evt({ type: 'goal', minute: 42 }),
      evt({ type: 'goal', minute: 105, is_extra_time: true }),
      evt({ type: 'goal', minute: 54 }),
    ];
    const sections = groupMatchEventsForDisplay(events, 'extra_time');

    expect(sections.map((s) => s.id)).toEqual(['extra_time', 'regulation']);
    expect(sections[0].title).toBe('Extra Time');
    expect(sections[0].events.map((e) => e.minute)).toEqual([105]);
    expect(sections[1].title).toBe('Full Time');
    expect(sections[1].events.map((e) => e.minute)).toEqual([54, 42]);
  });

  it('puts Penalty Shootout on top, then Extra Time, then Full Time', () => {
    const events = [
      evt({ type: 'goal', minute: 42 }),
      evt({ type: 'goal', minute: 105, is_extra_time: true }),
      evt({ type: 'shootout_goal', minute: null }),
      evt({ type: 'shootout_miss', minute: null }),
      evt({ type: 'goal', minute: 54 }),
    ];
    const sections = groupMatchEventsForDisplay(events, 'penalties');

    expect(sections.map((s) => s.id)).toEqual([
      'shootout',
      'extra_time',
      'regulation',
    ]);
    expect(sections[0].events.map((e) => e.type)).toEqual([
      'shootout_miss',
      'shootout_goal',
    ]);
  });
});

describe('splitShootoutByTeam', () => {
  it('splits home and away shootout events into separate columns', () => {
    const events = [
      evt({ type: 'shootout_goal', team_id: 481, player_name: 'Kimmich' }),
      evt({ type: 'shootout_miss', team_id: 490, player_name: 'Canale' }),
      evt({ type: 'shootout_miss', team_id: 481, player_name: 'Tah' }),
      evt({ type: 'shootout_goal', team_id: 490, player_name: 'Galarza' }),
    ];
    const { home, away } = splitShootoutByTeam(events, 481, 490);

    expect(home.map((e) => e.player_name)).toEqual(['Kimmich', 'Tah']);
    expect(away.map((e) => e.player_name)).toEqual(['Canale', 'Galarza']);
  });
});
