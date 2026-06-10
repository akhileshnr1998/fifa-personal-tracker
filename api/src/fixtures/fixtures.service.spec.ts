import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixtureEntity } from './entities/fixture.entity';
import { FixturesService } from './fixtures.service';
import { FixturesSyncService } from './fixtures-sync.service';

describe('FixturesService', () => {
  let service: FixturesService;
  let repository: jest.Mocked<Pick<Repository<FixtureEntity>, 'count' | 'find'>>;
  let syncService: { syncFromSportmonks: jest.Mock };

  const sampleFixtures: FixtureEntity[] = [
    {
      id: 2,
      match_number: 2,
      match_date_time: new Date('2026-06-12T20:00:00.000Z'),
      stage_id: 12049,
      home_team: 'Argentina',
      away_team: 'Brazil',
      venue: 'MetLife Stadium',
      updated_at: new Date(),
    },
    {
      id: 1,
      match_number: 1,
      match_date_time: new Date('2026-06-11T20:00:00.000Z'),
      stage_id: 12049,
      home_team: 'Mexico',
      away_team: 'TBD',
      venue: 'Estadio Azteca',
      updated_at: new Date(),
    },
  ];

  beforeEach(async () => {
    repository = {
      count: jest.fn(),
      find: jest.fn(),
    };
    syncService = { syncFromSportmonks: jest.fn().mockResolvedValue([]) };

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

  it('hydrates from Sportmonks when database is empty', async () => {
    repository.count.mockResolvedValue(0);
    repository.find.mockResolvedValue(sampleFixtures);

    await service.getFixtures();

    expect(syncService.syncFromSportmonks).toHaveBeenCalled();
  });

  it('serves from Postgres without sync when rows exist', async () => {
    repository.count.mockResolvedValue(2);
    repository.find.mockResolvedValue(sampleFixtures);

    const result = await service.getFixtures();

    expect(syncService.syncFromSportmonks).not.toHaveBeenCalled();
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it('forces re-sync when refresh is requested', async () => {
    repository.count.mockResolvedValue(2);
    repository.find.mockResolvedValue(sampleFixtures);

    await service.getFixtures(true);

    expect(syncService.syncFromSportmonks).toHaveBeenCalled();
  });
});
