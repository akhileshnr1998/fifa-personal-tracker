export interface SportmonksParticipant {
  id?: number;
  name?: string;
  meta?: {
    location?: 'home' | 'away';
  };
}

export interface SportmonksVenue {
  name?: string;
}

export interface SportmonksStage {
  id?: number;
  name?: string;
}

export interface SportmonksFixture {
  id: number;
  starting_at?: string;
  stage_id?: number;
  stage?: SportmonksStage;
  participants?: SportmonksParticipant[];
  venue?: SportmonksVenue;
  round?: {
    name?: string;
  };
}

export interface SportmonksFixturesResponse {
  data?: SportmonksFixture[];
}
