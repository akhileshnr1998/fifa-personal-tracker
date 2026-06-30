import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { EspnRosterResponse } from './espn-roster.types';
import { getAthleteStat, parseEspnId } from './espn-roster.mapper';
import { PlayerEntity } from './entities/player.entity';
import { TeamSquadMemberEntity } from './entities/team-squad-member.entity';
import { TeamEntity } from './entities/team.entity';

const DEFAULT_ESPN_LEAGUE_SLUG = 'fifa.world';

@Injectable()
export class SquadSyncService {
  private readonly logger = new Logger(SquadSyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
    @InjectRepository(PlayerEntity)
    private readonly playersRepository: Repository<PlayerEntity>,
    @InjectRepository(TeamSquadMemberEntity)
    private readonly squadMembersRepository: Repository<TeamSquadMemberEntity>,
  ) {}

  async syncTeamSquadFromEspn(teamId: number): Promise<void> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team || team.is_placeholder) {
      return;
    }

    const espnTeamId = team.espn_team_id ?? team.id;
    const slug =
      this.configService.get<string>('ESPN_LEAGUE_SLUG') ?? DEFAULT_ESPN_LEAGUE_SLUG;
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams/${espnTeamId}/roster`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<EspnRosterResponse>(url),
      );

      const athletes = response.data?.athletes ?? [];
      if (athletes.length === 0) {
        this.logger.warn(`ESPN roster returned no athletes for team ${teamId}`);
        return;
      }

      const players: PlayerEntity[] = [];
      const members: TeamSquadMemberEntity[] = [];

      for (const athlete of athletes) {
        const playerId = parseEspnId(athlete.id);
        if (playerId === null) continue;

        const player = new PlayerEntity();
        player.id = playerId;
        player.full_name = athlete.fullName ?? athlete.displayName ?? `Player ${playerId}`;
        player.display_name = athlete.displayName ?? player.full_name;
        player.position = athlete.position?.name ?? null;
        player.position_abbr = athlete.position?.abbreviation ?? null;
        player.age = athlete.age ?? null;
        player.height_display = athlete.displayHeight ?? null;
        player.weight_display = athlete.displayWeight ?? null;
        player.appearances = getAthleteStat(athlete, 'appearances');
        player.goals = getAthleteStat(athlete, 'totalGoals');
        player.assists = getAthleteStat(athlete, 'goalAssists');
        player.yellow_cards = getAthleteStat(athlete, 'yellowCards');
        player.red_cards = getAthleteStat(athlete, 'redCards');
        player.espn_athlete_id = playerId;
        players.push(player);

        const member = new TeamSquadMemberEntity();
        member.team_id = teamId;
        member.player_id = playerId;
        member.jersey = athlete.jersey ?? null;
        members.push(member);
      }

      await this.playersRepository.upsert(players, ['id']);
      await this.squadMembersRepository.delete({ team_id: teamId });
      await this.squadMembersRepository.insert(members);

      this.logger.log(`Squad synced for team ${teamId}: ${members.length} players`);
    } catch (error) {
      this.logger.error(`ESPN roster hydration failed for team ${teamId}`, error);
    }
  }
}
