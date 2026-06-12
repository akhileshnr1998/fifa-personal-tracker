import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { TeamEntity } from '../teams/entities/team.entity';
import { buildTeamRecord, TBD_TEAM_ID } from '../teams/resolve-team-id';
import { VenueEntity } from '../venues/entities/venue.entity';
import { buildVenueRecord, TBD_VENUE_ID } from '../venues/resolve-venue-id';
import { FixtureEntity } from './entities/fixture.entity';
import { EspnCompetition, EspnEvent, EspnScoreboardResponse } from './espn.types';
import { getVenueSource, mapEspnEvents } from './espn.mapper';

const DEFAULT_ESPN_DATE_RANGE = '20260611-20260719';
const DEFAULT_ESPN_LEAGUE_SLUG = 'fifa.world';
const DEFAULT_ESPN_FETCH_LIMIT = 200;

@Injectable()
export class FixturesSyncService {
  private readonly logger = new Logger(FixturesSyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(FixtureEntity)
    private readonly fixturesRepository: Repository<FixtureEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
    @InjectRepository(VenueEntity)
    private readonly venuesRepository: Repository<VenueEntity>,
  ) {}

  async syncFromEspn(): Promise<FixtureEntity[]> {
    const slug =
      this.configService.get<string>('ESPN_LEAGUE_SLUG') ?? DEFAULT_ESPN_LEAGUE_SLUG;
    const dateRange =
      this.configService.get<string>('ESPN_WC_DATE_RANGE') ?? DEFAULT_ESPN_DATE_RANGE;
    const limit =
      this.configService.get<number>('ESPN_FETCH_LIMIT') ?? DEFAULT_ESPN_FETCH_LIMIT;

    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<EspnScoreboardResponse>(url, {
          params: { dates: dateRange, limit },
        }),
      );

      const rawEvents = response.data?.events ?? [];
      if (rawEvents.length === 0) {
        return [];
      }

      await this.ensurePlaceholderRows();
      await this.upsertTeamsFromEvents(rawEvents);
      await this.upsertVenuesFromEvents(rawEvents);
      const entities = mapEspnEvents(rawEvents);
      await this.fixturesRepository.upsert(entities, ['id']);
      return this.fixturesRepository.find({
        relations: ['home_team', 'away_team', 'venue'],
      });
    } catch (error) {
      this.logger.error('ESPN hydration failed', error);
      return [];
    }
  }

  async upsertTeamsFromEvents(events: EspnEvent[]): Promise<void> {
    const teams = new Map<number, TeamEntity>();

    for (const event of events) {
      for (const competitor of event.competitions?.[0]?.competitors ?? []) {
        const record = buildTeamRecord(competitor);
        const team = new TeamEntity();
        team.id = record.id;
        team.name = record.name;
        team.is_placeholder = record.is_placeholder;
        team.espn_team_id = record.espn_team_id;
        teams.set(team.id, team);
      }
    }

    if (teams.size === 0) return;
    await this.teamsRepository.upsert([...teams.values()], ['id']);
  }

  async upsertVenuesFromEvents(events: EspnEvent[]): Promise<void> {
    const venues = new Map<number, VenueEntity>();

    for (const event of events) {
      const competition = event.competitions?.[0];
      const record = buildVenueRecord(getVenueSource(event, competition));
      const venue = new VenueEntity();
      venue.id = record.id;
      venue.name = record.name;
      venue.city = record.city;
      venue.country = record.country;
      venue.espn_venue_id = record.espn_venue_id;
      venues.set(venue.id, venue);
    }

    if (venues.size === 0) return;
    await this.venuesRepository.upsert([...venues.values()], ['id']);
  }

  private async ensurePlaceholderRows(): Promise<void> {
    const tbdTeam = new TeamEntity();
    tbdTeam.id = TBD_TEAM_ID;
    tbdTeam.name = 'TBD';
    tbdTeam.is_placeholder = true;
    tbdTeam.espn_team_id = null;

    const tbdVenue = new VenueEntity();
    tbdVenue.id = TBD_VENUE_ID;
    tbdVenue.name = 'TBD';
    tbdVenue.city = null;
    tbdVenue.country = null;
    tbdVenue.espn_venue_id = null;

    await this.teamsRepository.upsert([tbdTeam], ['id']);
    await this.venuesRepository.upsert([tbdVenue], ['id']);
  }
}
