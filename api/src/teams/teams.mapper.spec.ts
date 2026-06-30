import { toTeamProfileDto, toTeamSquadDto } from './teams.mapper';
import { PlayerEntity } from './entities/player.entity';
import { TeamEntity } from './entities/team.entity';
import { TeamSquadMemberEntity } from './entities/team-squad-member.entity';

describe('teams.mapper', () => {
  it('maps team profiles', () => {
    const team = new TeamEntity();
    team.id = 203;
    team.name = 'Mexico';
    team.is_placeholder = false;
    team.espn_team_id = 203;
    team.abbreviation = 'MEX';
    team.slug = 'mex';
    team.updated_at = new Date();

    expect(toTeamProfileDto(team)).toEqual({
      id: 203,
      name: 'Mexico',
      abbreviation: 'MEX',
      slug: 'mex',
    });
  });

  it('sorts squad players by jersey then name', () => {
    const team = new TeamEntity();
    team.id = 203;
    team.name = 'Mexico';
    team.is_placeholder = false;
    team.espn_team_id = 203;
    team.abbreviation = 'MEX';
    team.slug = 'mex';
    team.updated_at = new Date();

    const makeMember = (
      playerId: number,
      displayName: string,
      jersey: string | null,
    ): TeamSquadMemberEntity => {
      const player = new PlayerEntity();
      player.id = playerId;
      player.full_name = displayName;
      player.display_name = displayName;
      player.position = 'Forward';
      player.position_abbr = 'F';
      player.age = 25;
      player.height_display = null;
      player.weight_display = null;
      player.appearances = 1;
      player.goals = 0;
      player.assists = 0;
      player.yellow_cards = 0;
      player.red_cards = 0;
      player.espn_athlete_id = playerId;
      player.updated_at = new Date();

      const member = new TeamSquadMemberEntity();
      member.team_id = 203;
      member.player_id = playerId;
      member.jersey = jersey;
      member.player = player;
      return member;
    };

    const result = toTeamSquadDto(team, [
      makeMember(2, 'Zorro', '9'),
      makeMember(1, 'Alpha', '1'),
      makeMember(3, 'Beta', null),
    ]);

    expect(result.players.map((player) => player.display_name)).toEqual([
      'Alpha',
      'Zorro',
      'Beta',
    ]);
  });
});
