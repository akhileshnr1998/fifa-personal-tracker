import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { FixtureEntity } from './entities/fixture.entity';
import {
  SportmonksFixture,
  SportmonksFixturesResponse,
} from './sportmonks.types';

@Injectable()
export class FixturesSyncService {
  private readonly logger = new Logger(FixturesSyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(FixtureEntity)
    private readonly fixturesRepository: Repository<FixtureEntity>,
  ) {}

  async syncFromSportmonks(): Promise<FixtureEntity[]> {
    const apiKey = this.configService.get<string>('SPORTMONKS_API_KEY');
    const leagueId =
      this.configService.get<string>('SPORTMONKS_LEAGUE_ID') ?? '2370';

    if (!apiKey) {
      this.logger.warn('SPORTMONKS_API_KEY not configured; skipping hydration');
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<SportmonksFixturesResponse>(
          `https://api.sportmonks.com/v3/football/fixtures`,
          {
            params: {
              api_token: apiKey,
              filters: `fixtureLeagues:${leagueId}`,
              include: 'participants;venue;stage',
              per_page: 250,
            },
          },
        ),
      );

      const rawFixtures = response.data?.data ?? [];
      if (rawFixtures.length === 0) {
        return [];
      }

      const entities = rawFixtures.map((fixture, index) =>
        this.mapSportmonksFixture(fixture, index + 1),
      );

      await this.fixturesRepository.upsert(entities, ['id']);
      return this.fixturesRepository.find();
    } catch (error) {
      this.logger.error('Sportmonks hydration failed', error);
      return [];
    }
  }

  mapSportmonksFixture(
    fixture: SportmonksFixture,
    fallbackMatchNumber: number,
  ): FixtureEntity {
    const homeParticipant = fixture.participants?.find(
      (participant) => participant.meta?.location === 'home',
    );
    const awayParticipant = fixture.participants?.find(
      (participant) => participant.meta?.location === 'away',
    );

    const entity = new FixtureEntity();
    entity.id = fixture.id;
    entity.match_number = fallbackMatchNumber;
    entity.match_date_time = fixture.starting_at
      ? new Date(fixture.starting_at)
      : new Date();
    entity.stage_id = fixture.stage_id ?? fixture.stage?.id ?? 0;
    entity.home_team = this.normalizeTeamName(homeParticipant?.name);
    entity.away_team = this.normalizeTeamName(awayParticipant?.name);
    entity.venue = fixture.venue?.name?.trim() || 'TBD';
    return entity;
  }

  normalizeTeamName(name?: string): string {
    const trimmed = name?.trim();
    if (!trimmed || trimmed.toUpperCase() === 'TBD') {
      return 'TBD';
    }
    return trimmed;
  }
}
