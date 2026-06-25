export interface EspnSummaryTeamRef {
  id: string;
}

export interface EspnSummaryAthlete {
  displayName: string;
}

export interface EspnScoringPlay {
  team?: EspnSummaryTeamRef;
  clock?: { displayValue?: string };
  type?: { text?: string };
  athletesInvolved?: EspnSummaryAthlete[];
}

export interface EspnBoxscoreStatistic {
  name: string;
  displayValue: string;
}

export interface EspnBoxscoreTeam {
  team: EspnSummaryTeamRef;
  statistics: EspnBoxscoreStatistic[];
}

export interface EspnKeyEvent {
  team?: EspnSummaryTeamRef;
  clock?: { displayValue?: string };
  type?: { text?: string };
  text?: string;
  athletesInvolved?: EspnSummaryAthlete[] | null;
}

export interface EspnSummaryResponse {
  scoringPlays?: EspnScoringPlay[];
  keyEvents?: EspnKeyEvent[];
  boxscore?: {
    teams?: EspnBoxscoreTeam[];
  };
}
