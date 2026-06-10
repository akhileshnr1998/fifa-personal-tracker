import { describe, expect, it } from 'vitest';
import { groupFixturesByDay } from './groupByDay';
import type { Fixture } from './types';

const sampleFixtures: Fixture[] = [
  {
    id: 2,
    match_number: 2,
    match_date_time: '2026-06-12T20:00:00.000Z',
    stage_id: 1,
    home_team: 'Argentina',
    away_team: 'Brazil',
    venue: 'MetLife Stadium',
  },
  {
    id: 1,
    match_number: 1,
    match_date_time: '2026-06-11T20:00:00.000Z',
    stage_id: 1,
    home_team: 'Mexico',
    away_team: 'TBD',
    venue: 'Estadio Azteca',
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
});
