import { MatchEventType } from '../entities/match-event.entity';

export interface MatchEventDto {
  type: MatchEventType;
  minute: number | null;
  team_id: number | null;
  player_name: string | null;
  assist_name: string | null;
  is_extra_time: boolean;
}

export interface MatchStatDto {
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

export interface MatchSummaryResponseDto {
  fixture_id: number;
  available: true;
  events: MatchEventDto[];
  stats: MatchStatDto[];
}

export interface MatchSummaryUnavailableDto {
  fixture_id: number;
  available: false;
}
