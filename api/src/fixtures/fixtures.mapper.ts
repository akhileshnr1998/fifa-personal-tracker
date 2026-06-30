import { TeamSummaryDto } from '../teams/dto/team-summary.dto';
import { TeamEntity } from '../teams/entities/team.entity';
import { VenueSummaryDto } from '../venues/dto/venue-summary.dto';
import { VenueEntity } from '../venues/entities/venue.entity';
import { FixtureEntity } from './entities/fixture.entity';
import { FixtureResponseDto } from './dto/fixture-response.dto';

export function toTeamSummary(team: TeamEntity): TeamSummaryDto {
  return {
    id: team.id,
    name: team.name,
  };
}

export function toVenueSummary(venue: VenueEntity): VenueSummaryDto {
  return {
    id: venue.id,
    name: venue.name,
  };
}

export function toFixtureResponseDto(fixture: FixtureEntity): FixtureResponseDto {
  return {
    id: fixture.id,
    match_number: fixture.match_number,
    match_date_time: fixture.match_date_time.toISOString(),
    stage_id: fixture.stage_id,
    home_team: toTeamSummary(fixture.home_team),
    away_team: toTeamSummary(fixture.away_team),
    venue: toVenueSummary(fixture.venue),
    status: fixture.status,
    home_score: fixture.home_score,
    away_score: fixture.away_score,
    decided_by: fixture.decided_by,
    home_penalty_score: fixture.home_penalty_score,
    away_penalty_score: fixture.away_penalty_score,
  };
}

export function sortFixturesChronologically(
  fixtures: FixtureEntity[],
): FixtureEntity[] {
  return [...fixtures].sort(
    (a, b) => a.match_date_time.getTime() - b.match_date_time.getTime(),
  );
}
