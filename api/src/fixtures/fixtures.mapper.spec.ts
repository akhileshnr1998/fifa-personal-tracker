import { TeamEntity } from '../teams/entities/team.entity';
import { VenueEntity } from '../venues/entities/venue.entity';
import { FixtureEntity } from './entities/fixture.entity';
import {
  sortFixturesChronologically,
  toFixtureResponseDto,
} from './fixtures.mapper';

function makeTeam(id: number, name: string): TeamEntity {
  return {
    id,
    name,
    is_placeholder: false,
    espn_team_id: id,
    abbreviation: null,
    slug: null,
    updated_at: new Date(),
  };
}

function makeVenue(id: number, name: string): VenueEntity {
  return {
    id,
    name,
    city: null,
    country: null,
    espn_venue_id: id,
    updated_at: new Date(),
  };
}

describe('fixtures.mapper', () => {
  it('serializes fixture dates, team ids, venue, and scores as API fields', () => {
    const fixture: FixtureEntity = {
      id: 760415,
      match_number: 1,
      match_date_time: new Date('2026-06-11T20:00:00.000Z'),
      stage_id: 1,
      home_team_id: 203,
      away_team_id: 467,
      home_team: makeTeam(203, 'Mexico'),
      away_team: makeTeam(467, 'South Africa'),
      venue_id: 1672,
      venue: makeVenue(1672, 'Estadio Banorte'),
      status: 'finished',
      home_score: 2,
      away_score: 1,
      decided_by: 'regulation',
      home_penalty_score: null,
      away_penalty_score: null,
      summary_fetched: false,
      updated_at: new Date(),
    };

    expect(toFixtureResponseDto(fixture)).toMatchObject({
      match_date_time: '2026-06-11T20:00:00.000Z',
      home_team: { id: 203, name: 'Mexico' },
      away_team: { id: 467, name: 'South Africa' },
      venue: { id: 1672, name: 'Estadio Banorte' },
      status: 'finished',
      home_score: 2,
      away_score: 1,
      decided_by: 'regulation',
      home_penalty_score: null,
      away_penalty_score: null,
    });
  });

  it('sorts fixtures chronologically', () => {
    const later: FixtureEntity = {
      id: 2,
      match_number: 2,
      match_date_time: new Date('2026-06-12T20:00:00.000Z'),
      stage_id: 1,
      home_team_id: 1,
      away_team_id: 2,
      home_team: makeTeam(1, 'A'),
      away_team: makeTeam(2, 'B'),
      venue_id: 10,
      venue: makeVenue(10, 'Venue'),
      status: 'scheduled',
      home_score: null,
      away_score: null,
      decided_by: 'regulation',
      home_penalty_score: null,
      away_penalty_score: null,
      summary_fetched: false,
      updated_at: new Date(),
    };
    const earlier: FixtureEntity = {
      id: 1,
      match_number: 1,
      match_date_time: new Date('2026-06-11T20:00:00.000Z'),
      stage_id: 1,
      home_team_id: 3,
      away_team_id: 4,
      home_team: makeTeam(3, 'C'),
      away_team: makeTeam(4, 'D'),
      venue_id: 11,
      venue: makeVenue(11, 'Venue'),
      status: 'scheduled',
      home_score: null,
      away_score: null,
      decided_by: 'regulation',
      home_penalty_score: null,
      away_penalty_score: null,
      summary_fetched: false,
      updated_at: new Date(),
    };

    const sorted = sortFixturesChronologically([later, earlier]);
    expect(sorted.map((fixture) => fixture.id)).toEqual([1, 2]);
  });
});
