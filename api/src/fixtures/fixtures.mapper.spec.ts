import { FixtureEntity } from './entities/fixture.entity';
import {
  sortFixturesChronologically,
  toFixtureResponseDto,
} from './fixtures.mapper';

describe('fixtures.mapper', () => {
  it('serializes fixture dates as ISO strings', () => {
    const fixture: FixtureEntity = {
      id: 1,
      match_number: 1,
      match_date_time: new Date('2026-06-11T20:00:00.000Z'),
      stage_id: 12049,
      home_team: 'Mexico',
      away_team: 'TBD',
      venue: 'Estadio Azteca',
      updated_at: new Date(),
    };

    expect(toFixtureResponseDto(fixture).match_date_time).toBe(
      '2026-06-11T20:00:00.000Z',
    );
  });

  it('sorts fixtures chronologically', () => {
    const later: FixtureEntity = {
      id: 2,
      match_number: 2,
      match_date_time: new Date('2026-06-12T20:00:00.000Z'),
      stage_id: 1,
      home_team: 'A',
      away_team: 'B',
      venue: 'Venue',
      updated_at: new Date(),
    };
    const earlier: FixtureEntity = {
      id: 1,
      match_number: 1,
      match_date_time: new Date('2026-06-11T20:00:00.000Z'),
      stage_id: 1,
      home_team: 'C',
      away_team: 'D',
      venue: 'Venue',
      updated_at: new Date(),
    };

    const sorted = sortFixturesChronologically([later, earlier]);
    expect(sorted.map((fixture) => fixture.id)).toEqual([1, 2]);
  });
});
