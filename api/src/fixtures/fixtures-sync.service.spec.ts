import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { Repository } from 'typeorm';
import { FixtureEntity } from './entities/fixture.entity';
import { FixturesSyncService } from './fixtures-sync.service';

describe('FixturesSyncService', () => {
  let service: FixturesSyncService;
  let repository: jest.Mocked<Pick<Repository<FixtureEntity>, 'upsert' | 'find'>>;
  let httpService: { get: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    repository = {
      upsert: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([]),
    };
    httpService = { get: jest.fn() };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'SPORTMONKS_API_KEY') return 'test-key';
        if (key === 'SPORTMONKS_LEAGUE_ID') return '2370';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixturesSyncService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
        {
          provide: getRepositoryToken(FixtureEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(FixturesSyncService);
  });

  it('maps Sportmonks fixtures including TBD placeholders', () => {
    const mapped = service.mapSportmonksFixture(
      {
        id: 439281,
        starting_at: '2026-06-11T20:00:00.000Z',
        stage_id: 12049,
        participants: [
          { name: 'Mexico', meta: { location: 'home' } },
          { name: 'TBD', meta: { location: 'away' } },
        ],
        venue: { name: 'Estadio Azteca' },
      },
      1,
    );

    expect(mapped).toMatchObject({
      id: 439281,
      match_number: 1,
      stage_id: 12049,
      home_team: 'Mexico',
      away_team: 'TBD',
      venue: 'Estadio Azteca',
    });
  });

  it('returns empty array when API key is missing', async () => {
    configService.get.mockImplementation((key: string) =>
      key === 'SPORTMONKS_API_KEY' ? undefined : '2370',
    );

    const result = await service.syncFromSportmonks();

    expect(result).toEqual([]);
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('upserts fixtures from Sportmonks response', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          data: [
            {
              id: 1,
              starting_at: '2026-06-11T20:00:00.000Z',
              stage_id: 10,
              participants: [
                { name: 'Mexico', meta: { location: 'home' } },
                { name: 'Canada', meta: { location: 'away' } },
              ],
              venue: { name: 'Estadio Azteca' },
            },
          ],
        },
      }),
    );
    repository.find.mockResolvedValue([
      {
        id: 1,
        match_number: 1,
        match_date_time: new Date('2026-06-11T20:00:00.000Z'),
        stage_id: 10,
        home_team: 'Mexico',
        away_team: 'Canada',
        venue: 'Estadio Azteca',
        updated_at: new Date(),
      },
    ]);

    const result = await service.syncFromSportmonks();

    expect(repository.upsert).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});
