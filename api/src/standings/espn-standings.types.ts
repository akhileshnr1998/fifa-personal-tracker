export interface EspnStandingStat {
  name: string;
  value?: number;
  displayValue?: string;
  shortDisplayName?: string;
}

export interface EspnStandingNote {
  color?: string;
  description?: string;
  rank?: number;
}

export interface EspnStandingTeam {
  id?: string;
  displayName?: string;
  name?: string;
  abbreviation?: string;
}

export interface EspnStandingEntry {
  team?: EspnStandingTeam;
  note?: EspnStandingNote;
  stats?: EspnStandingStat[];
}

export interface EspnGroupStandingsBlock {
  entries?: EspnStandingEntry[];
}

export interface EspnStandingGroup {
  id?: string;
  name?: string;
  abbreviation?: string;
  standings?: EspnGroupStandingsBlock;
}

export interface EspnStandingsResponse {
  children?: EspnStandingGroup[];
}
