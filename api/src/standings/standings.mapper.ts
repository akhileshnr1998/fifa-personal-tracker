import { GroupStandingEntity } from './entities/group-standing.entity';
import { GroupEntryDto, GroupStandingsDto } from './dto/standings-response.dto';

export function toGroupEntryDto(standing: GroupStandingEntity): GroupEntryDto {
  return {
    rank: standing.rank,
    rank_change: standing.rank_change,
    team: { id: standing.team_id, name: standing.team.name },
    games_played: standing.games_played,
    wins: standing.wins,
    draws: standing.draws,
    losses: standing.losses,
    goals_for: standing.goals_for,
    goals_against: standing.goals_against,
    goal_diff: standing.goal_diff,
    points: standing.points,
    qualification_label: standing.qualification_label,
    qualification_color: standing.qualification_color,
  };
}

export function toGroupStandingsDtoList(
  standings: GroupStandingEntity[],
): GroupStandingsDto[] {
  const groupMap = new Map<number, GroupStandingsDto>();

  for (const standing of standings) {
    if (!groupMap.has(standing.group_id)) {
      groupMap.set(standing.group_id, {
        group_id: standing.group_id,
        group_name: standing.group.name,
        group_abbreviation: standing.group.abbreviation,
        entries: [],
      });
    }
    groupMap.get(standing.group_id)!.entries.push(toGroupEntryDto(standing));
  }

  return [...groupMap.values()];
}
