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
import {
  ESPN_STAGE_SLUG_TO_ID,
  FixtureStatus,
} from './fixture-status';
import {
  EspnCompetition,
  EspnEvent,
  EspnScoreboardResponse,
  EspnVenueSource,
} from './espn.types';

const ESPN_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const DEFAULT_ESPN_DATE_RANGE = '20260611-20260719';
const ESPN_FETCH_LIMIT = 200;

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
    const dateRange =
      this.configService.get<string>('ESPN_WC_DATE_RANGE') ??
      DEFAULT_ESPN_DATE_RANGE;

    try {
      const response = await firstValueFrom(
        this.httpService.get<EspnScoreboardResponse>(ESPN_SCOREBOARD_URL, {
          params: {
            dates: dateRange,
            limit: ESPN_FETCH_LIMIT,
          },
        }),
      );

      const rawEvents = response.data?.events ?? [];
      if (rawEvents.length === 0) {
        return [];
      }

      await this.ensurePlaceholderRows();
      await this.upsertTeamsFromEvents(rawEvents);
      await this.upsertVenuesFromEvents(rawEvents);
      const entities = this.mapEspnEvents(rawEvents);
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

    if (teams.size === 0) {
      return;
    }

    await this.teamsRepository.upsert([...teams.values()], ['id']);
  }

  async upsertVenuesFromEvents(events: EspnEvent[]): Promise<void> {
    const venues = new Map<number, VenueEntity>();

    for (const event of events) {
      const competition = event.competitions?.[0];
      const record = buildVenueRecord(this.getVenueSource(event, competition));
      const venue = new VenueEntity();
      venue.id = record.id;
      venue.name = record.name;
      venue.city = record.city;
      venue.country = record.country;
      venue.espn_venue_id = record.espn_venue_id;
      venues.set(venue.id, venue);
    }

    if (venues.size === 0) {
      return;
    }

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

  mapEspnEvents(events: EspnEvent[]): FixtureEntity[] {
    const sortedEvents = [...events].sort(
      (left, right) =>
        this.getEventKickoff(left).getTime() -
        this.getEventKickoff(right).getTime(),
    );

    return sortedEvents.map((event, index) =>
      this.mapEspnEvent(event, index + 1),
    );
  }

  mapEspnEvent(event: EspnEvent, matchNumber: number): FixtureEntity {
    const competition = event.competitions?.[0];
    const homeCompetitor = competition?.competitors?.find(
      (competitor) => competitor.homeAway === 'home',
    );
    const awayCompetitor = competition?.competitors?.find(
      (competitor) => competitor.homeAway === 'away',
    );
    const status = this.mapFixtureStatus(competition);
    const scores = this.mapFixtureScores(competition, status);

    const entity = new FixtureEntity();
    entity.id = Number.parseInt(event.id, 10);
    entity.match_number = matchNumber;
    entity.match_date_time = this.getEventKickoff(event, competition);
    entity.stage_id = this.mapStageId(event.season?.slug);
    entity.home_team_id = buildTeamRecord(homeCompetitor).id;
    entity.away_team_id = buildTeamRecord(awayCompetitor).id;
    entity.venue_id = buildVenueRecord(this.getVenueSource(event, competition)).id;
    entity.status = status;
    entity.home_score = scores.home;
    entity.away_score = scores.away;
    return entity;
  }

  getVenueSource(
    event: EspnEvent,
    competition?: EspnCompetition,
  ): EspnVenueSource | undefined {
    return competition?.venue ?? event.venue;
  }

  getEventKickoff(event: EspnEvent, competition?: EspnCompetition): Date {
    const kickoff =
      competition?.startDate ?? competition?.date ?? event.date ?? '';
    return kickoff ? new Date(kickoff) : new Date();
  }

  mapStageId(stageSlug?: string): number {
    if (!stageSlug) {
      return 0;
    }
    return ESPN_STAGE_SLUG_TO_ID[stageSlug] ?? 0;
  }

  mapFixtureStatus(competition?: EspnCompetition): FixtureStatus {
    const statusType = competition?.status?.type;
    if (!statusType) {
      return 'scheduled';
    }

    const statusName = statusType.name ?? '';
    if (
      statusType.completed === true ||
      statusType.state === 'post' ||
      /FULL_TIME|FINAL/i.test(statusName)
    ) {
      return 'finished';
    }

    if (/POSTPONED|CANCELLED|ABANDONED|SUSPENDED/i.test(statusName)) {
      return 'postponed';
    }

    return 'scheduled';
  }

  mapFixtureScores(
    competition: EspnCompetition | undefined,
    status: FixtureStatus,
  ): { home: number | null; away: number | null } {
    if (status !== 'finished' || !competition?.competitors) {
      return { home: null, away: null };
    }

    const homeCompetitor = competition.competitors.find(
      (competitor) => competitor.homeAway === 'home',
    );
    const awayCompetitor = competition.competitors.find(
      (competitor) => competitor.homeAway === 'away',
    );

    return {
      home: this.parseScore(homeCompetitor?.score),
      away: this.parseScore(awayCompetitor?.score),
    };
  }

  parseScore(score?: string): number | null {
    if (score === undefined || score === null || score === '') {
      return null;
    }

    const parsed = Number.parseInt(score, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
