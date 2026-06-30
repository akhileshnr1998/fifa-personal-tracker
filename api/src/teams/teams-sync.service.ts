import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { EspnTeamsResponse } from './espn-teams.types';
import { parseEspnId } from './espn-roster.mapper';
import { TeamEntity } from './entities/team.entity';

const DEFAULT_ESPN_LEAGUE_SLUG = 'fifa.world';

@Injectable()
export class TeamsSyncService {
  private readonly logger = new Logger(TeamsSyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
  ) {}

  async syncFromEspn(): Promise<void> {
    const slug =
      this.configService.get<string>('ESPN_LEAGUE_SLUG') ?? DEFAULT_ESPN_LEAGUE_SLUG;
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<EspnTeamsResponse>(url),
      );

      const teams =
        response.data?.sports?.[0]?.leagues?.[0]?.teams?.map((entry) => entry.team) ??
        [];

      if (teams.length === 0) {
        this.logger.warn('ESPN teams endpoint returned no teams');
        return;
      }

      const entities = teams
        .map((team) => {
          const teamId = parseEspnId(team?.id);
          if (teamId === null) return null;

          const entity = new TeamEntity();
          entity.id = teamId;
          entity.name = team?.displayName ?? `Team ${teamId}`;
          entity.is_placeholder = false;
          entity.espn_team_id = teamId;
          entity.abbreviation = team?.abbreviation ?? null;
          entity.slug = team?.slug ?? null;
          return entity;
        })
        .filter((team): team is TeamEntity => team !== null);

      await this.teamsRepository.upsert(entities, ['id']);
      this.logger.log(`Teams synced: ${entities.length} national teams`);
    } catch (error) {
      this.logger.error('ESPN teams hydration failed', error);
    }
  }
}
