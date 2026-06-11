import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamEntity } from './entities/team.entity';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let repository: jest.Mocked<Pick<Repository<TeamEntity>, 'find'>>;

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: getRepositoryToken(TeamEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(TeamsService);
  });

  it('returns sorted non-placeholder teams for the settings picker', async () => {
    repository.find.mockResolvedValue([
      {
        id: 203,
        name: 'Mexico',
        is_placeholder: false,
        espn_team_id: 203,
        updated_at: new Date(),
      },
      {
        id: 10,
        name: 'Argentina',
        is_placeholder: false,
        espn_team_id: 10,
        updated_at: new Date(),
      },
    ]);

    const result = await service.getPickerOptions();

    expect(repository.find).toHaveBeenCalledWith({
      where: { is_placeholder: false },
      order: { name: 'ASC' },
    });
    expect(result).toEqual([
      { id: 203, name: 'Mexico' },
      { id: 10, name: 'Argentina' },
    ]);
  });
});
