import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MatchEventEntity } from '../match-summary/entities/match-event.entity';
import { TopScorersService } from './top-scorers.service';

describe('TopScorersService', () => {
  let service: TopScorersService;
  let queryBuilder: jest.Mocked<
    Pick<
      SelectQueryBuilder<MatchEventEntity>,
      | 'innerJoin'
      | 'select'
      | 'addSelect'
      | 'where'
      | 'andWhere'
      | 'groupBy'
      | 'addGroupBy'
      | 'orderBy'
      | 'addOrderBy'
      | 'limit'
      | 'getRawMany'
    >
  >;

  beforeEach(async () => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as Repository<MatchEventEntity>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopScorersService,
        {
          provide: getRepositoryToken(MatchEventEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(TopScorersService);
  });

  it('returns empty array when no scoring events exist', async () => {
    queryBuilder.getRawMany.mockResolvedValue([]);

    const result = await service.getTopScorers();

    expect(result).toEqual([]);
    expect(queryBuilder.where).toHaveBeenCalledWith('event.type IN (:...types)', {
      types: ['goal', 'penalty_goal'],
    });
  });

  it('maps aggregated rows to ranked scorer entries', async () => {
    queryBuilder.getRawMany.mockResolvedValue([
      {
        player_name: 'Lionel Messi',
        team_id: 10,
        team_name: 'Argentina',
        goals: '5',
      },
      {
        player_name: 'Kylian Mbappé',
        team_id: 20,
        team_name: 'France',
        goals: '3',
      },
    ]);

    const result = await service.getTopScorers();

    expect(result).toEqual([
      {
        rank: 1,
        player_name: 'Lionel Messi',
        team: { id: 10, name: 'Argentina' },
        goals: 5,
      },
      {
        rank: 2,
        player_name: 'Kylian Mbappé',
        team: { id: 20, name: 'France' },
        goals: 3,
      },
    ]);
  });

  it('excludes own goals via type filter only', async () => {
    queryBuilder.getRawMany.mockResolvedValue([]);

    await service.getTopScorers();

    expect(queryBuilder.where).toHaveBeenCalledWith('event.type IN (:...types)', {
      types: ['goal', 'penalty_goal'],
    });
  });

  it('orders ties alphabetically by player name', async () => {
    queryBuilder.getRawMany.mockResolvedValue([]);

    await service.getTopScorers();

    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('event.player_name', 'ASC');
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('COUNT(*)', 'DESC');
  });
});
