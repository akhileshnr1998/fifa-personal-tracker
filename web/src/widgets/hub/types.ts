export interface TeamQuickLink {
  id: number;
  name: string;
}

export interface TopScorerEntry {
  rank: number;
  player_name: string;
  team: { id: number; name: string };
  goals: number;
}

export interface HubData {
  top_scorers: {
    available: boolean;
    entries: TopScorerEntry[];
  };
  teams_quick_links: TeamQuickLink[];
}
