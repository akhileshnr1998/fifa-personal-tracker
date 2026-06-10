export interface Fixture {
  id: number;
  match_number: number | null;
  match_date_time: string;
  stage_id: number;
  home_team: string;
  away_team: string;
  venue: string;
}
