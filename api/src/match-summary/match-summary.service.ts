import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { FixtureEntity } from '../fixtures/entities/fixture.entity';
import {
  MatchEventDto,
  MatchStatDto,
  MatchSummaryResponseDto,
  MatchSummaryUnavailableDto,
} from './dto/match-summary-response.dto';
import { MatchEventEntity, MatchEventType } from './entities/match-event.entity';
import { MatchStatEntity } from './entities/match-stat.entity';
import {
  mapKeyEventType,
  parseKeyEventText,
} from './espn-key-event.parser';
import {
  EspnBoxscoreTeam,
  EspnKeyEvent,
  EspnScoringPlay,
  EspnSummaryResponse,
} from './espn-summary.types';

const DEFAULT_ESPN_LEAGUE_SLUG = 'fifa.world';

const EVENT_TYPE_MAP: Record<string, MatchEventType> = {
  'Goal': 'goal',
  'Own Goal': 'own_goal',
  'Penalty - Goal': 'penalty_goal',
  'Penalty - Miss': 'penalty_miss',
  'Penalty - Saved': 'penalty_miss',
  'Yellow Card': 'yellow_card',
  'Red Card': 'red_card',
  'Yellow-Red Card': 'red_card',
};

type NumericStatKey = Extract<
  keyof MatchStatEntity,
  | 'possession_pct'
  | 'shots'
  | 'shots_on_target'
  | 'corners'
  | 'fouls'
  | 'yellow_cards'
  | 'red_cards'
  | 'offsides'
  | 'saves'
>;

const STAT_COLUMN_MAP: Record<string, NumericStatKey> = {
  possessionPct: 'possession_pct',
  totalShots: 'shots',
  shotsOnTarget: 'shots_on_target',
  corners: 'corners',
  wonCorners: 'corners',
  foulsCommitted: 'fouls',
  yellowCards: 'yellow_cards',
  redCards: 'red_cards',
  offsides: 'offsides',
  saves: 'saves',
};

@Injectable()
export class MatchSummaryService {
  private readonly logger = new Logger(MatchSummaryService.name);
  private readonly inFlightSummaries = new Map<
    number,
    Promise<MatchSummaryResponseDto | MatchSummaryUnavailableDto>
  >();

  private readonly espnSummaryBase: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(FixtureEntity)
    private readonly fixturesRepository: Repository<FixtureEntity>,
    @InjectRepository(MatchEventEntity)
    private readonly eventsRepository: Repository<MatchEventEntity>,
    @InjectRepository(MatchStatEntity)
    private readonly statsRepository: Repository<MatchStatEntity>,
  ) {
    const slug =
      this.configService.get<string>('ESPN_LEAGUE_SLUG') ?? DEFAULT_ESPN_LEAGUE_SLUG;
    this.espnSummaryBase = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary`;
  }

  async getSummary(
    fixtureId: number,
  ): Promise<MatchSummaryResponseDto | MatchSummaryUnavailableDto> {
    const fixture = await this.fixturesRepository.findOne({
      where: { id: fixtureId },
    });

    if (!fixture) {
      throw new NotFoundException(`Fixture ${fixtureId} not found`);
    }

    // Guard 1 — status: only finished matches have meaningful summary data
    if (fixture.status !== 'finished') {
      return { fixture_id: fixtureId, available: false };
    }

    // Guard 2 — idempotency: serve from DB when events are already cached
    if (fixture.summary_fetched) {
      const cached = await this.loadFromDb(fixtureId);
      if (cached.events.length > 0) {
        return cached;
      }
      // Stats-only or empty stale cache — backfill from ESPN
    }

    // Guard 3 — concurrency: collapse concurrent requests into one ESPN call
    const inflight = this.inFlightSummaries.get(fixtureId);
    if (inflight) return inflight;

    const promise = this.fetchStoreAndReturn(fixture).finally(() => {
      this.inFlightSummaries.delete(fixtureId);
    });
    this.inFlightSummaries.set(fixtureId, promise);
    return promise;
  }

  private async fetchStoreAndReturn(
    fixture: FixtureEntity,
  ): Promise<MatchSummaryResponseDto | MatchSummaryUnavailableDto> {
    let espnData: EspnSummaryResponse;
    try {
      const response = await firstValueFrom(
        this.httpService.get<EspnSummaryResponse>(this.espnSummaryBase, {
          params: { event: fixture.id },
        }),
      );
      espnData = response.data ?? {};
    } catch (error) {
      this.logger.error(`ESPN summary fetch failed for fixture ${fixture.id}`, error);
      // summary_fetched stays false so the next request will retry
      return { fixture_id: fixture.id, available: false };
    }

    const eventEntities = this.mapEvents(fixture.id, espnData);
    const statEntities = this.mapBoxscoreStats(
      fixture.id,
      espnData.boxscore?.teams ?? [],
    );

    if (eventEntities.length === 0 && statEntities.length === 0) {
      return { fixture_id: fixture.id, available: false };
    }

    // Single transaction: insert rows then flip the flag atomically
    await this.dataSource.transaction(async (manager) => {
      if (eventEntities.length > 0) {
        await manager.delete(MatchEventEntity, { fixture_id: fixture.id });
        await manager.save(MatchEventEntity, eventEntities);
      }
      if (statEntities.length > 0) {
        await manager.upsert(MatchStatEntity, statEntities, [
          'fixture_id',
          'team_id',
        ]);
      }
      await manager.update(FixtureEntity, fixture.id, {
        summary_fetched: true,
      });
    });

    return {
      fixture_id: fixture.id,
      available: true,
      events: eventEntities.map(toEventDto),
      stats: statEntities.map(toStatDto),
    };
  }

  private async loadFromDb(fixtureId: number): Promise<MatchSummaryResponseDto> {
    const [events, stats] = await Promise.all([
      this.eventsRepository.find({
        where: { fixture_id: fixtureId },
        order: { event_order: 'ASC' },
      }),
      this.statsRepository.find({ where: { fixture_id: fixtureId } }),
    ]);
    return {
      fixture_id: fixtureId,
      available: true,
      events: events.map(toEventDto),
      stats: stats.map(toStatDto),
    };
  }

  private mapEvents(
    fixtureId: number,
    espnData: EspnSummaryResponse,
  ): MatchEventEntity[] {
    const scoringPlays = espnData.scoringPlays ?? [];
    if (scoringPlays.length > 0) {
      return this.mapScoringPlays(fixtureId, scoringPlays);
    }
    return this.mapKeyEvents(fixtureId, espnData.keyEvents ?? []);
  }

  private mapKeyEvents(
    fixtureId: number,
    events: EspnKeyEvent[],
  ): MatchEventEntity[] {
    const entities: MatchEventEntity[] = [];
    let order = 0;

    for (const event of events) {
      const rawType = event.type?.text ?? '';
      const mappedType = mapKeyEventType(rawType);
      if (!mappedType) continue;

      const fromAthletes = event.athletesInvolved?.[0]?.displayName ?? null;
      const parsed =
        fromAthletes != null
          ? {
              player_name: fromAthletes,
              assist_name:
                mappedType === 'goal'
                  ? (event.athletesInvolved?.[1]?.displayName ?? null)
                  : null,
            }
          : parseKeyEventText(rawType, event.text ?? '', mappedType);

      const e = new MatchEventEntity();
      e.fixture_id = fixtureId;
      e.event_order = order++;
      e.type = mappedType;
      e.team_id = event.team?.id ? parseInt(event.team.id, 10) : null;
      e.player_name = parsed.player_name;
      e.assist_name = parsed.assist_name;
      e.minute = parseMinute(event.clock?.displayValue);
      e.is_extra_time = isExtraTime(event.clock?.displayValue);
      entities.push(e);
    }

    return entities;
  }

  private mapScoringPlays(
    fixtureId: number,
    plays: EspnScoringPlay[],
  ): MatchEventEntity[] {
    const entities: MatchEventEntity[] = [];

    for (let i = 0; i < plays.length; i++) {
      const play = plays[i];
      const rawType = play.type?.text ?? '';
      const mappedType = EVENT_TYPE_MAP[rawType];
      if (!mappedType) continue;

      const e = new MatchEventEntity();
      e.fixture_id = fixtureId;
      e.event_order = i;
      e.type = mappedType;
      e.team_id = play.team?.id ? parseInt(play.team.id, 10) : null;
      e.player_name = play.athletesInvolved?.[0]?.displayName ?? null;
      e.assist_name =
        mappedType === 'goal'
          ? (play.athletesInvolved?.[1]?.displayName ?? null)
          : null;
      e.minute = parseMinute(play.clock?.displayValue);
      e.is_extra_time = isExtraTime(play.clock?.displayValue);
      entities.push(e);
    }

    return entities;
  }

  private mapBoxscoreStats(
    fixtureId: number,
    teams: EspnBoxscoreTeam[],
  ): MatchStatEntity[] {
    return teams
      .filter((t) => t.team?.id)
      .map((t) => {
        const s = new MatchStatEntity();
        s.fixture_id = fixtureId;
        s.team_id = parseInt(t.team.id, 10);

        for (const stat of t.statistics ?? []) {
          const col = STAT_COLUMN_MAP[stat.name];
          if (!col) continue;
          const val = parseFloat(stat.displayValue);
          if (!isNaN(val)) {
            Object.assign(s, { [col]: val });
          }
        }

        return s;
      });
  }
}

function parseMinute(displayValue: string | undefined): number | null {
  if (!displayValue) return null;
  // ESPN formats: "23'", "45+2'", "90+4'"
  const match = displayValue.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function isExtraTime(displayValue: string | undefined): boolean {
  if (!displayValue) return false;
  return displayValue.includes('+');
}

function toEventDto(e: MatchEventEntity): MatchEventDto {
  return {
    type: e.type,
    minute: e.minute,
    team_id: e.team_id,
    player_name: e.player_name,
    assist_name: e.assist_name,
    is_extra_time: e.is_extra_time,
  };
}

function toStatDto(s: MatchStatEntity): MatchStatDto {
  return {
    team_id: s.team_id,
    possession_pct: s.possession_pct != null ? Number(s.possession_pct) : null,
    shots: s.shots,
    shots_on_target: s.shots_on_target,
    corners: s.corners,
    fouls: s.fouls,
    yellow_cards: s.yellow_cards,
    red_cards: s.red_cards,
    offsides: s.offsides,
    saves: s.saves,
  };
}
