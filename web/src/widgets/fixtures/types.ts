export type FixtureStatus = 'scheduled' | 'finished' | 'postponed';

export interface TeamSummary {
  id: number;
  name: string;
}

export interface VenueSummary {
  id: number;
  name: string;
}

export interface Fixture {
  id: number;
  match_number: number | null;
  match_date_time: string;
  stage_id: number;
  home_team: TeamSummary;
  away_team: TeamSummary;
  venue: VenueSummary;
  status: FixtureStatus;
  home_score: number | null;
  away_score: number | null;
}
