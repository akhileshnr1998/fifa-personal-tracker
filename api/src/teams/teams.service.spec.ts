import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixtureEntity } from '../fixtures/entities/fixture.entity';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let repository: jest.Mocked<Pick<Repository<FixtureEntity>, 'find'>>;

  beforeEach(async () => {
    repository = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: getRepositoryToken(FixtureEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(TeamsService);
  });

  it('returns deduplicated sorted national team names only', async () => {
    repository.find.mockResolvedValue([
      {
        home_team: 'Mexico',
        away_team: 'Argentina',
      },
      {
        home_team: '1A',
        away_team: 'W74',
      },
      {
        home_team: 'Brazil',
        away_team: '3C/E/F/H/I',
      },
      {
        home_team: 'L101',
        away_team: 'TBD',
      },
    ] as FixtureEntity[]);

    const names = await service.getTeamNames();

    expect(names).toEqual(['Argentina', 'Brazil', 'Mexico']);
  });
});
