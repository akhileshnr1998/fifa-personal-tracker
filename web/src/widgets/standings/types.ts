export interface GroupEntry {
  rank: number;
  rank_change: number;
  team: { id: number; name: string };
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  qualification_label: string | null;
  qualification_color: string | null;
}

export interface GroupStandings {
  group_id: number;
  group_name: string;
  group_abbreviation: string;
  entries: GroupEntry[];
}
