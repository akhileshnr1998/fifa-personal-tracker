export interface EspnTeamSummary {
  id: string;
  displayName?: string;
  abbreviation?: string;
  slug?: string;
}

export interface EspnTeamsLeague {
  teams?: Array<{ team?: EspnTeamSummary }>;
}

export interface EspnTeamsSport {
  leagues?: EspnTeamsLeague[];
}

export interface EspnTeamsResponse {
  sports?: EspnTeamsSport[];
}
