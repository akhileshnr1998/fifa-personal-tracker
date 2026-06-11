import { TeamSummaryDto } from '../../teams/dto/team-summary.dto';
import { VenueSummaryDto } from '../../venues/dto/venue-summary.dto';
import { FixtureStatus } from '../fixture-status';

export interface FixtureResponseDto {
  id: number;
  match_number: number | null;
  match_date_time: string;
  stage_id: number;
  home_team: TeamSummaryDto;
  away_team: TeamSummaryDto;
  venue: VenueSummaryDto;
  status: FixtureStatus;
  home_score: number | null;
  away_score: number | null;
}
