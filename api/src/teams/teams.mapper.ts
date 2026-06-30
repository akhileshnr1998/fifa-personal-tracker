import { TeamEntity } from './entities/team.entity';
import { PlayerEntity } from './entities/player.entity';
import { TeamSquadMemberEntity } from './entities/team-squad-member.entity';
import {
  SquadPlayerDto,
  TeamProfileDto,
  TeamSquadDto,
} from './dto/team-profile.dto';

export function toTeamProfileDto(team: TeamEntity): TeamProfileDto {
  return {
    id: team.id,
    name: team.name,
    abbreviation: team.abbreviation ?? null,
    slug: team.slug ?? null,
  };
}

export function toSquadPlayerDto(
  member: TeamSquadMemberEntity,
  player: PlayerEntity,
): SquadPlayerDto {
  return {
    id: player.id,
    full_name: player.full_name,
    display_name: player.display_name,
    jersey: member.jersey,
    position: player.position,
    position_abbr: player.position_abbr,
    age: player.age,
    height_display: player.height_display,
    weight_display: player.weight_display,
    appearances: player.appearances,
    goals: player.goals,
    assists: player.assists,
    yellow_cards: player.yellow_cards,
    red_cards: player.red_cards,
  };
}

export function toTeamSquadDto(
  team: TeamEntity,
  members: TeamSquadMemberEntity[],
): TeamSquadDto {
  const players = members
    .map((member) => {
      if (!member.player) return null;
      return toSquadPlayerDto(member, member.player);
    })
    .filter((player): player is SquadPlayerDto => player !== null)
    .sort((a, b) => {
      const jerseyA = Number.parseInt(a.jersey ?? '', 10);
      const jerseyB = Number.parseInt(b.jersey ?? '', 10);
      const aValid = Number.isFinite(jerseyA);
      const bValid = Number.isFinite(jerseyB);
      if (aValid && bValid && jerseyA !== jerseyB) return jerseyA - jerseyB;
      if (aValid !== bValid) return aValid ? -1 : 1;
      return a.display_name.localeCompare(b.display_name);
    });

  return {
    team: toTeamProfileDto(team),
    players,
  };
}
