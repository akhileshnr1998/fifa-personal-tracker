import { FixtureEntity } from './entities/fixture.entity';
import { FixtureResponseDto } from './dto/fixture-response.dto';

export function toFixtureResponseDto(fixture: FixtureEntity): FixtureResponseDto {
  return {
    id: fixture.id,
    match_number: fixture.match_number,
    match_date_time: fixture.match_date_time.toISOString(),
    stage_id: fixture.stage_id,
    home_team: fixture.home_team,
    away_team: fixture.away_team,
    venue: fixture.venue,
  };
}

export function sortFixturesChronologically(
  fixtures: FixtureEntity[],
): FixtureEntity[] {
  return [...fixtures].sort(
    (a, b) => a.match_date_time.getTime() - b.match_date_time.getTime(),
  );
}
