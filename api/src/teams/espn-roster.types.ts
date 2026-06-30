export interface EspnRosterStat {
  name?: string;
  value?: number;
}

export interface EspnRosterStatCategory {
  stats?: EspnRosterStat[];
}

export interface EspnRosterStatSplit {
  categories?: EspnRosterStatCategory[];
}

export interface EspnRosterPosition {
  name?: string;
  abbreviation?: string;
}

export interface EspnRosterAthlete {
  id?: string;
  fullName?: string;
  displayName?: string;
  age?: number;
  displayHeight?: string;
  displayWeight?: string;
  jersey?: string;
  position?: EspnRosterPosition;
  statistics?: {
    splits?: EspnRosterStatSplit;
  };
}

export interface EspnRosterResponse {
  athletes?: EspnRosterAthlete[];
}
