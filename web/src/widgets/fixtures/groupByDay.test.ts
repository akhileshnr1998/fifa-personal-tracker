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
});
