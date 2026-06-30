import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { Repository } from 'typeorm';
import { TeamEntity } from '../teams/entities/team.entity';
import { VenueEntity } from '../venues/entities/venue.entity';
import { FixtureEntity } from './entities/fixture.entity';
import { mapEspnEvent, mapEspnEvents } from './espn.mapper';
import { FixturesSyncService } from './fixtures-sync.service';

describe('FixturesSyncService', () => {
  let service: FixturesSyncService;
  let fixturesRepository: jest.Mocked<
    Pick<Repository<FixtureEntity>, 'upsert' | 'find'>
  >;
  let teamsRepository: jest.Mocked<Pick<Repository<TeamEntity>, 'upsert'>>;
  let venuesRepository: jest.Mocked<Pick<Repository<VenueEntity>, 'upsert'>>;
  let httpService: { get: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    fixturesRepository = {
      upsert: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([]),
    };
    teamsRepository = {
      upsert: jest.fn().mockResolvedValue(undefined),
    };
    venuesRepository = {
      upsert: jest.fn().mockResolvedValue(undefined),
    };
    httpService = { get: jest.fn() };
    configService = {
      get: jest.fn(() => undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixturesSyncService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
        {
          provide: getRepositoryToken(FixtureEntity),
          useValue: fixturesRepository,
        },
        {
          provide: getRepositoryToken(TeamEntity),
          useValue: teamsRepository,
        },
        {
          provide: getRepositoryToken(VenueEntity),
          useValue: venuesRepository,
        },
      ],
    }).compile();

    service = module.get(FixturesSyncService);
  });

  it('maps ESPN fixtures with team and venue ids', () => {
    const [mapped] = mapEspnEvents([
      {
        id: '760415',
        date: '2026-06-11T19:00Z',
        season: { slug: 'group-stage' },
        competitions: [
          {
            startDate: '2026-06-11T19:00Z',
            status: {
              type: {
                name: 'STATUS_FULL_TIME',
                state: 'post',
                completed: true,
              },
            },
            venue: {
              id: '1672',
              fullName: 'Estadio Banorte',
              address: { city: 'Mexico City', country: 'Mexico' },
            },
            competitors: [
              {
                homeAway: 'home',
                score: '2',
                team: { id: '203', displayName: 'Mexico' },
              },
              {
                homeAway: 'away',
                score: '1',
                team: { id: '467', displayName: 'South Africa' },
              },
            ],
          },
        ],
      },
    ]);

    expect(mapped).toMatchObject({
      id: 760415,
      match_number: 1,
      stage_id: 1,
      home_team_id: 203,
      away_team_id: 467,
      venue_id: 1672,
      status: 'finished',
      home_score: 2,
      away_score: 1,
    });
  });

  it('maps venue from competition.venue when event.venue is missing', () => {
    const [mapped] = mapEspnEvents([
      {
        id: '760415',
        date: '2026-06-11T19:00Z',
        season: { slug: 'group-stage' },
        competitions: [
          {
            startDate: '2026-06-11T19:00Z',
            venue: {
              id: '1672',
              fullName: 'Estadio Banorte',
              address: { city: 'Mexico City', country: 'Mexico' },
            },
            competitors: [
              {
                homeAway: 'home',
                team: { id: '203', displayName: 'Mexico' },
              },
              {
                homeAway: 'away',
                team: { id: '467', displayName: 'South Africa' },
              },
            ],
          },
        ],
      },
    ]);

    expect(mapped.venue_id).toBe(1672);
  });

  it('maps penalty shootout scores and decided_by', () => {
    const entity = mapEspnEvent(
      {
        id: '760489',
        date: '2026-06-30T19:00Z',
        season: { slug: 'round-of-32' },
        competitions: [
          {
            startDate: '2026-06-30T19:00Z',
            status: {
              type: {
                name: 'STATUS_FINAL_PEN',
                state: 'post',
                completed: true,
                detail: 'FT-Pens',
              },
            },
            competitors: [
              {
                homeAway: 'home',
                score: '1',
                shootoutScore: 3,
                team: { id: '481', displayName: 'Germany' },
              },
              {
                homeAway: 'away',
                score: '1',
                shootoutScore: 4,
                team: { id: '490', displayName: 'Paraguay' },
              },
            ],
          },
        ],
      },
      50,
    );

    expect(entity.home_score).toBe(1);
    expect(entity.away_score).toBe(1);
    expect(entity.home_penalty_score).toBe(3);
    expect(entity.away_penalty_score).toBe(4);
    expect(entity.decided_by).toBe('penalties');
  });

  it('upserts venues from competition.venue when event.venue is missing', async () => {
    await service.upsertVenuesFromEvents([
      {
        id: '760415',
        competitions: [
          {
            venue: { id: '1672', fullName: 'Estadio Banorte' },
          },
        ],
      },
    ]);

    expect(venuesRepository.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 1672, name: 'Estadio Banorte' }),
      ]),
      ['id'],
    );
  });

  it('upserts teams, venues, and fixtures from ESPN response', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          events: [
            {
              id: '760415',
              date: '2026-06-11T19:00Z',
              season: { slug: 'group-stage' },
              competitions: [
                {
                  startDate: '2026-06-11T19:00Z',
                  status: {
                    type: {
                      name: 'STATUS_SCHEDULED',
                      state: 'pre',
                      completed: false,
                    },
                  },
                  venue: { id: '1672', fullName: 'Estadio Banorte' },
                  competitors: [
                    {
                      homeAway: 'home',
                      team: { id: '203', displayName: 'Mexico' },
                    },
                    {
                      homeAway: 'away',
                      team: { id: '467', displayName: 'South Africa' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    );
    fixturesRepository.find.mockResolvedValue([
      {
        id: 760415,
        match_number: 1,
        match_date_time: new Date('2026-06-11T19:00:00.000Z'),
        stage_id: 1,
        home_team_id: 203,
        away_team_id: 467,
        venue_id: 1672,
        home_team: {
          id: 203,
          name: 'Mexico',
          is_placeholder: false,
          espn_team_id: 203,
          abbreviation: null,
          slug: null,
          updated_at: new Date(),
        },
        away_team: {
          id: 467,
          name: 'South Africa',
          is_placeholder: false,
          espn_team_id: 467,
          abbreviation: null,
          slug: null,
          updated_at: new Date(),
        },
        venue: {
          id: 1672,
          name: 'Estadio Banorte',
          city: null,
          country: null,
          espn_venue_id: 1672,
          updated_at: new Date(),
        },
        status: 'scheduled',
        home_score: null,
        away_score: null,
        decided_by: 'regulation',
        home_penalty_score: null,
        away_penalty_score: null,
        summary_fetched: false,
        updated_at: new Date(),
      },
    ]);

    const result = await service.syncFromEspn();

    expect(teamsRepository.upsert).toHaveBeenCalled();
    expect(venuesRepository.upsert).toHaveBeenCalled();
    expect(fixturesRepository.upsert).toHaveBeenCalled();
    expect(fixturesRepository.find).toHaveBeenCalledWith({
      relations: ['home_team', 'away_team', 'venue'],
    });
    expect(result).toHaveLength(1);
  });
});
