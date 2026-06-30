export type FixtureStatus = 'scheduled' | 'finished' | 'postponed';

export type DecidedBy = 'regulation' | 'extra_time' | 'penalties';

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
  decided_by: DecidedBy;
  home_penalty_score: number | null;
  away_penalty_score: number | null;
}

export type MatchEventType =
  | 'goal'
  | 'own_goal'
  | 'penalty_goal'
  | 'penalty_miss'
  | 'yellow_card'
  | 'red_card'
  | 'shootout_goal'
  | 'shootout_miss';

export interface MatchEvent {
  type: MatchEventType;
  minute: number | null;
  team_id: number | null;
  player_name: string | null;
  assist_name: string | null;
  is_extra_time: boolean;
  shot_number: number | null;
}

export interface MatchStat {
  team_id: number;
  possession_pct: number | null;
  shots: number | null;
  shots_on_target: number | null;
  corners: number | null;
  fouls: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  offsides: number | null;
  saves: number | null;
}

export interface MatchSummary {
  fixture_id: number;
  available: true;
  events: MatchEvent[];
  stats: MatchStat[];
}

export interface MatchSummaryUnavailable {
  fixture_id: number;
  available: false;
}

export type MatchSummaryResult = MatchSummary | MatchSummaryUnavailable;
