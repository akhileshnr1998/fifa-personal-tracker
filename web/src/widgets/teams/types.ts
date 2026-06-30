export interface TeamProfile {
  id: number;
  name: string;
  abbreviation: string | null;
  slug: string | null;
}

export interface SquadPlayer {
  id: number;
  full_name: string;
  display_name: string;
  jersey: string | null;
  position: string | null;
  position_abbr: string | null;
  age: number | null;
  height_display: string | null;
  weight_display: string | null;
  appearances: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
}

export interface TeamSquad {
  team: TeamProfile;
  players: SquadPlayer[];
}
