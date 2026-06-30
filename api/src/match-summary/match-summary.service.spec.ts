import { HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';
import { DataSource } from 'typeorm';
import { FixtureEntity } from '../fixtures/entities/fixture.entity';
import { MatchSummaryService } from './match-summary.service';
import { MatchEventEntity } from './entities/match-event.entity';
import { MatchStatEntity } from './entities/match-stat.entity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFixture(overrides: Partial<FixtureEntity> = {}): FixtureEntity {
  return {
    id: 760415,
    match_number: 1,
    match_date_time: new Date('2026-06-11T19:00Z'),
    stage_id: 1,
    home_team_id: 203,
    away_team_id: 467,
    home_team: {} as any,
    away_team: {} as any,
    venue_id: 1672,
    venue: {} as any,
    status: 'finished',
    home_score: 2,
    away_score: 1,
    decided_by: 'regulation',
    home_penalty_score: null,
    away_penalty_score: null,
    summary_fetched: false,
    updated_at: new Date(),
    ...overrides,
  };
}

const ESPN_SUMMARY_RESPONSE = {
  scoringPlays: [
    {
      type: { text: 'Goal' },
      team: { id: '203' },
      clock: { displayValue: "23'" },
      athletesInvolved: [
        { displayName: 'Hirving Lozano' },
        { displayName: 'Chucky Lozano' },
      ],
    },
    {
      type: { text: 'Yellow Card' },
      team: { id: '467' },
      clock: { displayValue: "45+2'" },
      athletesInvolved: [{ displayName: 'Percy Tau' }],
    },
    {
      // Unknown type — must be skipped
      type: { text: 'Substitution' },
      team: { id: '203' },
    },
  ],
  boxscore: {
    teams: [
      {
        team: { id: '203' },
        statistics: [
          { name: 'possessionPct', displayValue: '58.3' },
          { name: 'totalShots', displayValue: '12' },
          { name: 'unknownStat', displayValue: '99' },
        ],
      },
      {
        team: { id: '467' },
        statistics: [
          { name: 'possessionPct', displayValue: '41.7' },
          { name: 'totalShots', displayValue: '5' },
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MatchSummaryService', () => {
  let service: MatchSummaryService;
  let httpService: { get: jest.Mock };
  let fixturesRepository: { findOne: jest.Mock };
  let eventsRepository: { find: jest.Mock };
  let statsRepository: { find: jest.Mock };
  let transactionCallback: jest.Mock;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };
    fixturesRepository = { findOne: jest.fn() };
    eventsRepository = { find: jest.fn() };
    statsRepository = { find: jest.fn() };
    transactionCallback = jest.fn();
    dataSource = {
      transaction: jest.fn().mockImplementation((cb) => {
        const manager = {
          save: jest.fn().mockResolvedValue(undefined),
          delete: jest.fn().mockResolvedValue(undefined),
          upsert: jest.fn().mockResolvedValue(undefined),
          update: jest.fn().mockResolvedValue(undefined),
        };
        transactionCallback(manager);
        return cb(manager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchSummaryService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(FixtureEntity), useValue: fixturesRepository },
        { provide: getRepositoryToken(MatchEventEntity), useValue: eventsRepository },
        { provide: getRepositoryToken(MatchStatEntity), useValue: statsRepository },
      ],
    }).compile();

    service = module.get(MatchSummaryService);
  });

  // -------------------------------------------------------------------------
  // Guard 0 — fixture existence
  // -------------------------------------------------------------------------

  it('throws NotFoundException when fixture does not exist', async () => {
    fixturesRepository.findOne.mockResolvedValue(null);

    await expect(service.getSummary(999)).rejects.toThrow(NotFoundException);
    expect(httpService.get).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Guard 1 — status
  // -------------------------------------------------------------------------

  it('returns available:false without calling ESPN when fixture is scheduled', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture({ status: 'scheduled' }));

    const result = await service.getSummary(760415);

    expect(result).toEqual({ fixture_id: 760415, available: false });
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('returns available:false without calling ESPN when fixture is postponed', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture({ status: 'postponed' }));

    const result = await service.getSummary(760415);

    expect(result).toEqual({ fixture_id: 760415, available: false });
    expect(httpService.get).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Guard 2 — idempotency
  // -------------------------------------------------------------------------

  it('loads from DB without calling ESPN when summary_fetched is true and events exist', async () => {
    fixturesRepository.findOne.mockResolvedValue(
      makeFixture({ summary_fetched: true }),
    );
    eventsRepository.find.mockResolvedValue([
      Object.assign(new MatchEventEntity(), {
        fixture_id: 760415,
        event_order: 0,
        type: 'goal',
        team_id: 203,
        player_name: 'Hirving Lozano',
        minute: 23,
        is_extra_time: false,
      }),
    ]);
    statsRepository.find.mockResolvedValue([]);

    const result = await service.getSummary(760415);

    expect(httpService.get).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(result).toMatchObject({ fixture_id: 760415, available: true, events: expect.any(Array) });
  });

  it('re-fetches from ESPN when summary_fetched is true but events were never stored', async () => {
    fixturesRepository.findOne.mockResolvedValue(
      makeFixture({ summary_fetched: true }),
    );
    eventsRepository.find.mockResolvedValue([]);
    statsRepository.find.mockResolvedValue([
      Object.assign(new MatchStatEntity(), {
        fixture_id: 760415,
        team_id: 203,
        possession_pct: 60.5,
        shots: 16,
      }),
    ]);
    httpService.get.mockReturnValue(of({ data: ESPN_SUMMARY_RESPONSE }));

    await service.getSummary(760415);

    expect(httpService.get).toHaveBeenCalledTimes(1);
  });

  it('returns cached events and stats in event_order from DB', async () => {
    fixturesRepository.findOne.mockResolvedValue(
      makeFixture({ summary_fetched: true }),
    );
    const eventRow = Object.assign(new MatchEventEntity(), {
      id: 1,
      fixture_id: 760415,
      event_order: 0,
      type: 'goal',
      team_id: 203,
      player_name: 'Hirving Lozano',
      assist_name: 'Chucky Lozano',
      minute: 23,
      is_extra_time: false,
    });
    eventsRepository.find.mockResolvedValue([eventRow]);
    statsRepository.find.mockResolvedValue([]);

    const result = await service.getSummary(760415);

    expect(result).toMatchObject({
      available: true,
      events: [
        {
          type: 'goal',
          minute: 23,
          team_id: 203,
          player_name: 'Hirving Lozano',
          assist_name: 'Chucky Lozano',
          is_extra_time: false,
        },
      ],
    });
    // Verify events are queried with ORDER BY event_order ASC
    expect(eventsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { event_order: 'ASC' } }),
    );
  });

  // -------------------------------------------------------------------------
  // ESPN error handling
  // -------------------------------------------------------------------------

  it('returns available:false when ESPN fetch throws and does not flip summary_fetched', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(throwError(() => new Error('network error')));

    const result = await service.getSummary(760415);

    expect(result).toEqual({ fixture_id: 760415, available: false });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Happy path — fetch, store, return
  // -------------------------------------------------------------------------

  it('fetches from ESPN, stores events and stats in a single transaction, and returns summary', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(of({ data: ESPN_SUMMARY_RESPONSE }));

    const result = await service.getSummary(760415);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      fixture_id: 760415,
      available: true,
      events: expect.arrayContaining([
        expect.objectContaining({ type: 'goal', minute: 23, player_name: 'Hirving Lozano' }),
        expect.objectContaining({ type: 'yellow_card', minute: 45, is_extra_time: true }),
      ]),
      stats: expect.arrayContaining([
        expect.objectContaining({ team_id: 203, possession_pct: 58.3, shots: 12 }),
        expect.objectContaining({ team_id: 467, possession_pct: 41.7, shots: 5 }),
      ]),
    });
  });

  it('skips events with unknown ESPN type.text values', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(of({ data: ESPN_SUMMARY_RESPONSE }));

    const result = await service.getSummary(760415);

    expect((result as any).events).toHaveLength(2); // 'Substitution' skipped
  });

  it('returns available:false without persisting when ESPN returns no mappable data', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(
      of({
        data: {
          keyEvents: [{ type: { text: 'Kickoff' } }],
          boxscore: { teams: [] },
        },
      }),
    );

    const result = await service.getSummary(760415);

    expect(result).toEqual({ fixture_id: 760415, available: false });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('maps keyEvents when scoringPlays is empty (FIFA World Cup shape)', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(
      of({
        data: {
          scoringPlays: [],
          keyEvents: [
            {
              type: { text: 'Goal' },
              team: { id: '203' },
              clock: { displayValue: "9'" },
              text: 'Goal! Mexico 1, South Africa 0. Julián Quiñones (Mexico) right footed shot from the centre of the box to the centre of the goal. Assisted by Érik Lira.',
            },
            {
              type: { text: 'Yellow Card' },
              team: { id: '467' },
              clock: { displayValue: "17'" },
              text: 'Teboho Mokoena (South Africa) is shown the yellow card for a bad foul.',
            },
            { type: { text: 'Substitution' }, team: { id: '203' } },
          ],
          boxscore: {
            teams: [
              {
                team: { id: '203' },
                statistics: [{ name: 'wonCorners', displayValue: '3' }],
              },
            ],
          },
        },
      }),
    );

    const result = await service.getSummary(760415);

    expect(result).toMatchObject({
      available: true,
      events: [
        expect.objectContaining({
          type: 'goal',
          minute: 9,
          player_name: 'Julián Quiñones',
          assist_name: 'Érik Lira',
        }),
        expect.objectContaining({
          type: 'yellow_card',
          minute: 17,
          player_name: 'Teboho Mokoena',
        }),
      ],
      stats: [
        expect.objectContaining({ team_id: 203, corners: 3 }),
      ],
    });
    expect((result as any).events).toHaveLength(2);
  });

  it('skips stat names not present in STAT_COLUMN_MAP', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(of({ data: ESPN_SUMMARY_RESPONSE }));

    const result = await service.getSummary(760415);

    const team203Stat = (result as any).stats.find((s: any) => s.team_id === 203);
    // 'unknownStat' must not appear on the entity
    expect(team203Stat).not.toHaveProperty('unknownStat');
    expect(team203Stat.possession_pct).toBe(58.3);
  });

  it('populates event_order from the ESPN scoringPlays array index', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(of({ data: ESPN_SUMMARY_RESPONSE }));
    let savedEvents: MatchEventEntity[] = [];
    dataSource.transaction.mockImplementation(async (cb: any) => {
      const manager = {
        save: jest.fn().mockImplementation((EntityClass: any, rows: any[]) => {
          if (EntityClass === MatchEventEntity) savedEvents = rows;
          return Promise.resolve();
        }),
        delete: jest.fn().mockResolvedValue(undefined),
        upsert: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      };
      return cb(manager);
    });

    await service.getSummary(760415);

    expect(savedEvents[0].event_order).toBe(0); // Goal is play[0]
    expect(savedEvents[1].event_order).toBe(1); // Yellow Card is play[1]
    // play[2] (Substitution) was skipped, so only 2 saved
    expect(savedEvents).toHaveLength(2);
  });

  // -------------------------------------------------------------------------
  // Guard 3 — concurrency / in-flight dedup
  // -------------------------------------------------------------------------

  it('collapses concurrent requests into a single ESPN call', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(of({ data: ESPN_SUMMARY_RESPONSE }));

    // Fire two requests simultaneously without awaiting between them
    const [r1, r2] = await Promise.all([
      service.getSummary(760415),
      service.getSummary(760415),
    ]);

    expect(httpService.get).toHaveBeenCalledTimes(1);
    expect(r1).toEqual(r2);
  });

  // -------------------------------------------------------------------------
  // Minute / extra-time parsing edge cases
  // -------------------------------------------------------------------------

  it('parses "45+2\'" as minute 45 with is_extra_time true', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(
      of({
        data: {
          scoringPlays: [
            {
              type: { text: 'Yellow Card' },
              team: { id: '467' },
              clock: { displayValue: "45+2'" },
              athletesInvolved: [{ displayName: 'Percy Tau' }],
            },
          ],
          boxscore: { teams: [] },
        },
      }),
    );

    const result = await service.getSummary(760415);

    expect((result as any).events[0]).toMatchObject({ minute: 45, is_extra_time: true });
  });

  it('returns null minute when clock is absent', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(
      of({
        data: {
          scoringPlays: [
            {
              type: { text: 'Goal' },
              team: { id: '203' },
              athletesInvolved: [{ displayName: 'Lozano' }],
            },
          ],
          boxscore: { teams: [] },
        },
      }),
    );

    const result = await service.getSummary(760415);

    expect((result as any).events[0].minute).toBeNull();
    expect((result as any).events[0].is_extra_time).toBe(false);
  });

  it('only sets assist_name for goal events, not for cards', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(
      of({
        data: {
          scoringPlays: [
            {
              type: { text: 'Yellow Card' },
              team: { id: '467' },
              clock: { displayValue: "30'" },
              athletesInvolved: [
                { displayName: 'Player A' },
                { displayName: 'Player B' },
              ],
            },
          ],
          boxscore: { teams: [] },
        },
      }),
    );

    const result = await service.getSummary(760415);

    expect((result as any).events[0].assist_name).toBeNull();
  });

  it('appends shootout events after regulation events', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(
      of({
        data: {
          scoringPlays: [
            {
              type: { text: 'Goal' },
              team: { id: '481' },
              clock: { displayValue: "42'" },
              athletesInvolved: [{ displayName: 'Julio Enciso' }],
            },
            {
              type: { text: 'Goal' },
              team: { id: '490' },
              clock: { displayValue: "54'" },
              athletesInvolved: [{ displayName: 'Kai Havertz' }],
            },
          ],
          shootout: [
            {
              id: '481',
              team: 'Germany',
              shots: [
                { player: 'Kai Havertz', shotNumber: 1, didScore: false },
                { player: 'Joshua Kimmich', shotNumber: 2, didScore: true },
              ],
            },
            {
              id: '490',
              team: 'Paraguay',
              shots: [{ player: 'Julio Enciso', shotNumber: 1, didScore: true }],
            },
          ],
          boxscore: { teams: [] },
        },
      }),
    );

    const result = await service.getSummary(760415);

    const types = (result as any).events.map((e: { type: string }) => e.type);
    expect(types).toContain('shootout_goal');
    expect(types).toContain('shootout_miss');
    expect(types.indexOf('shootout_goal')).toBeGreaterThan(
      types.lastIndexOf('goal'),
    );
  });

  it('parses "105\'" as minute 105 with is_extra_time true', async () => {
    fixturesRepository.findOne.mockResolvedValue(makeFixture());
    httpService.get.mockReturnValue(
      of({
        data: {
          scoringPlays: [
            {
              type: { text: 'Goal' },
              team: { id: '203' },
              clock: { displayValue: "105'" },
              athletesInvolved: [{ displayName: 'Striker' }],
            },
          ],
          boxscore: { teams: [] },
        },
      }),
    );

    const result = await service.getSummary(760415);

    expect((result as any).events[0]).toMatchObject({
      minute: 105,
      is_extra_time: true,
    });
  });

  it('re-fetches shootout events when fixture decided_by is penalties but cache lacks shootout events', async () => {
    fixturesRepository.findOne.mockResolvedValue(
      makeFixture({ summary_fetched: true, decided_by: 'penalties' }),
    );
    eventsRepository.find.mockResolvedValue([
      Object.assign(new MatchEventEntity(), {
        fixture_id: 760415,
        event_order: 0,
        type: 'goal',
        team_id: 481,
        player_name: 'Julio Enciso',
        minute: 42,
        is_extra_time: false,
      }),
    ]);
    statsRepository.find.mockResolvedValue([]);
    httpService.get.mockReturnValue(
      of({
        data: {
          shootout: [
            {
              id: '481',
              team: 'Germany',
              shots: [{ player: 'Joshua Kimmich', shotNumber: 1, didScore: true }],
            },
          ],
        },
      }),
    );

    const result = await service.getSummary(760415);

    expect(httpService.get).toHaveBeenCalledTimes(1);
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    const types = (result as any).events.map((e: { type: string }) => e.type);
    expect(types).toContain('shootout_goal');
  });
});
