import { describe, expect, it } from 'vitest';
import { groupFixturesByDay } from './groupByDay';
import type { Fixture } from './types';

const sampleFixtures: Fixture[] = [
  {
    id: 2,
    match_number: 2,
    match_date_time: '2026-06-12T20:00:00.000Z',
    stage_id: 1,
    home_team: { id: 10, name: 'Argentina' },
    away_team: { id: 11, name: 'Brazil' },
    venue: { id: 200, name: 'MetLife Stadium' },
    status: 'scheduled',
    home_score: null,
    away_score: null,
  },
  {
    id: 1,
    match_number: 1,
    match_date_time: '2026-06-11T20:00:00.000Z',
    stage_id: 1,
    home_team: { id: 203, name: 'Mexico' },
    away_team: { id: 0, name: 'TBD' },
    venue: { id: 1672, name: 'Estadio Azteca' },
    status: 'scheduled',
    home_score: null,
    away_score: null,
  },
];

describe('groupFixturesByDay', () => {
  it('groups fixtures under chronological day headings', () => {
    const groups = groupFixturesByDay(sampleFixtures);

    expect(groups).toHaveLength(2);
    expect(groups[0].fixtures[0].id).toBe(1);
    expect(groups[1].fixtures[0].id).toBe(2);
    expect(groups[0].heading).toMatch(/Jun/);
  });

  it('places each fixture in the day group matching the viewer local date, not UTC', () => {
    // Two fixtures on the same UTC calendar date (June 16) but at very different UTC hours.
    // In timezones ahead of UTC (e.g. IST +05:30) a fixture at 20:00 UTC already belongs
    // to the *next* local calendar day (01:30 AM the following morning), so it must NOT
    // land in the same day-group as a fixture at 01:00 UTC on the same UTC day.
    const earlyUTC: Fixture = {
      id: 1,
      match_number: 1,
      // 01:00 UTC on June 16 → local June 16 in UTC, local June 16 06:30 IST
      match_date_time: '2026-06-16T01:00:00.000Z',
      stage_id: 1,
      home_team: { id: 1, name: 'Team A' },
      away_team: { id: 2, name: 'Team B' },
      venue: { id: 1, name: 'Venue 1' },
      status: 'scheduled',
      home_score: null,
      away_score: null,
    };
    const lateUTC: Fixture = {
      id: 2,
      match_number: 2,
      // 20:00 UTC on June 16 → local June 16 in UTC, but local June 17 01:30 AM IST
      match_date_time: '2026-06-16T20:00:00.000Z',
      stage_id: 1,
      home_team: { id: 3, name: 'Team C' },
      away_team: { id: 4, name: 'Team D' },
      venue: { id: 2, name: 'Venue 2' },
      status: 'scheduled',
      home_score: null,
      away_score: null,
    };

    const groups = groupFixturesByDay([earlyUTC, lateUTC]);

    // Regardless of timezone the groups must be ordered: earlyUTC before lateUTC.
    const allIds = groups.flatMap((g) => g.fixtures.map((f) => f.id));
    expect(allIds.indexOf(1)).toBeLessThan(allIds.indexOf(2));

    // In timezones where the two UTC timestamps fall on different local dates,
    // they must produce separate day groups (not collapsed into one).
    // In UTC itself both are June 16, so we allow 1 or 2 groups — what matters
    // is that no fixture is placed in a group whose dateKey does NOT match its
    // local calendar date.
    for (const group of groups) {
      for (const fixture of group.fixtures) {
        const local = new Date(fixture.match_date_time);
        const localY = local.getFullYear();
        const localM = String(local.getMonth() + 1).padStart(2, '0');
        const localD = String(local.getDate()).padStart(2, '0');
        expect(group.dateKey).toBe(`${localY}-${localM}-${localD}`);
      }
    }
  });
});
