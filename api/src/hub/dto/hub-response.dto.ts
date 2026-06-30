import { TeamPickerOptionDto } from '../../teams/dto/team-summary.dto';

export interface TopScorerEntryDto {
  rank: number;
  player_name: string;
  team: { id: number; name: string };
  goals: number;
}

export interface TopScorersDto {
  available: boolean;
  entries: TopScorerEntryDto[];
}

export interface HubResponseDto {
  top_scorers: TopScorersDto;
  teams_quick_links: TeamPickerOptionDto[];
}
