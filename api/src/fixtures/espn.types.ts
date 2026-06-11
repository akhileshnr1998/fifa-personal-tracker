export interface EspnStatusType {
  id?: string;
  name?: string;
  state?: string;
  completed?: boolean;
  description?: string;
}

export interface EspnCompetitor {
  homeAway?: string;
  winner?: boolean;
  score?: string;
  team?: {
    id?: string;
    displayName?: string;
    name?: string;
    abbreviation?: string;
  };
}

export interface EspnVenueSource {
  id?: string;
  fullName?: string;
  address?: {
    city?: string;
    country?: string;
  };
}

export interface EspnCompetition {
  date?: string;
  startDate?: string;
  status?: {
    type?: EspnStatusType;
  };
  venue?: EspnVenueSource;
  competitors?: EspnCompetitor[];
}

export interface EspnEvent {
  id: string;
  date?: string;
  name?: string;
  season?: {
    slug?: string;
  };
  competitions?: EspnCompetition[];
  venue?: EspnVenueSource;
}

export interface EspnScoreboardResponse {
  events?: EspnEvent[];
}
