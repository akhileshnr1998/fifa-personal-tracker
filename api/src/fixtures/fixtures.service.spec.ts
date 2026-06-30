import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamEntity } from '../teams/entities/team.entity';
import { VenueEntity } from '../venues/entities/venue.entity';
import { FixtureEntity } from './entities/fixture.entity';
import { FixturesService } from './fixtures.service';
import { FixturesSyncService } from './fixtures-sync.service';

describe('FixturesService', () => {
  let service: FixturesService;
  let repository: jest.Mocked<Pick<Repository<FixtureEntity>, 'count' | 'find'>>;
  let syncService: { syncFromEspn: jest.Mock };

  const mexico: TeamEntity = {
    id: 203,
    name: 'Mexico',
    is_placeholder: false,
    espn_team_id: 203,
    abbreviation: null,
    slug: null,
    updated_at: new Date(),
  };
  const southAfrica: TeamEntity = {
    id: 467,
    name: 'South Africa',
    is_placeholder: false,
    espn_team_id: 467,
    abbreviation: null,
    slug: null,
    updated_at: new Date(),
  };
  const estadio: VenueEntity = {
    id: 1672,
    name: 'Estadio Banorte',
    city: 'Mexico City',
    country: 'Mexico',
    espn_venue_id: 1672,
    updated_at: new Date(),
  };

  const sampleFixtures: FixtureEntity[] = [
    {
      id: 760416,
      match_number: 2,
      match_date_time: new Date('2026-06-12T20:00:00.000Z'),
      stage_id: 1,
      home_team_id: 10,
      away_team_id: 11,
      home_team: { ...mexico, id: 10, name: 'Argentina' },
      away_team: { ...southAfrica, id: 11, name: 'Brazil' },
      venue_id: 200,
      venue: { ...estadio, id: 200, name: 'MetLife Stadium' },
      status: 'scheduled',
      home_score: null,
      away_score: null,
      decided_by: 'regulation',
      home_penalty_score: null,
      away_penalty_score: null,
      summary_fetched: false,
      updated_at: new Date(),
    },
    {
      id: 760415,
      match_number: 1,
      match_date_time: new Date('2026-06-11T20:00:00.000Z'),
      stage_id: 1,
      home_team_id: 203,
      away_team_id: 467,
      home_team: mexico,
      away_team: southAfrica,
      venue_id: 1672,
      venue: estadio,
      status: 'finished',
      home_score: 2,
      away_score: 1,
      decided_by: 'regulation',
      home_penalty_score: null,
      away_penalty_score: null,
      summary_fetched: false,
      updated_at: new Date(),
    },
  ];

  beforeEach(async () => {
    repository = {
      count: jest.fn(),
      find: jest.fn(),
    };
    syncService = { syncFromEspn: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixturesService,
        {
          provide: getRepositoryToken(FixtureEntity),
          useValue: repository,
        },
        {
          provide: FixturesSyncService,
          useValue: syncService,
        },
      ],
    }).compile();

    service = module.get(FixturesService);
  });

  it('hydrates from ESPN when database is empty', async () => {
    repository.count.mockResolvedValue(0);
    repository.find.mockResolvedValue(sampleFixtures);

    await service.getFixtures();

    expect(syncService.syncFromEspn).toHaveBeenCalled();
    expect(repository.find).toHaveBeenCalledWith({
      relations: ['home_team', 'away_team', 'venue'],
    });
  });

  it('serves from Postgres without sync when rows exist', async () => {
    repository.count.mockResolvedValue(2);
    repository.find.mockResolvedValue(sampleFixtures);

    const result = await service.getFixtures();

    expect(syncService.syncFromEspn).not.toHaveBeenCalled();
    expect(result[0].venue.id).toBe(1672);
    expect(result[1].home_team.id).toBe(10);
  });

  it('forces re-sync when refresh is requested', async () => {
    repository.count.mockResolvedValue(2);
    repository.find.mockResolvedValue(sampleFixtures);

    await service.getFixtures(true);

    expect(syncService.syncFromEspn).toHaveBeenCalled();
  });
});
