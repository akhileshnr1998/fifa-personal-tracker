import { Test, TestingModule } from '@nestjs/testing';
import { FixtureResponseDto } from '../fixtures/dto/fixture-response.dto';
import { FixturesService } from '../fixtures/fixtures.service';
import { BracketService } from './bracket.service';

describe('BracketService', () => {
  let service: BracketService;
  let fixturesService: { getFixtures: jest.Mock };

  const r32Fixture: FixtureResponseDto = {
    id: 760489,
    match_number: 73,
    match_date_time: '2026-06-29T19:00:00.000Z',
    stage_id: 2,
    home_team: { id: 481, name: 'Germany' },
    away_team: { id: 490, name: 'Paraguay' },
    venue: { id: 1, name: 'Stadium' },
    status: 'finished',
    home_score: 1,
    away_score: 1,
    decided_by: 'penalties',
    home_penalty_score: 3,
    away_penalty_score: 4,
  };

  beforeEach(async () => {
    fixturesService = { getFixtures: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BracketService,
        {
          provide: FixturesService,
          useValue: fixturesService,
        },
      ],
    }).compile();

    service = module.get(BracketService);
  });

  it('builds bracket from fixtures returned by FixturesService', async () => {
    fixturesService.getFixtures.mockResolvedValue([r32Fixture]);

    const result = await service.getBracket();

    expect(fixturesService.getFixtures).toHaveBeenCalledWith(false);
    expect(result.knockoutStarted).toBe(true);
    expect(result.nodes['73']?.winnerTeamId).toBe(490);
    expect(result.rounds).toHaveLength(6);
  });

  it('forces fixture refresh when requested', async () => {
    fixturesService.getFixtures.mockResolvedValue([r32Fixture]);

    await service.getBracket(true);

    expect(fixturesService.getFixtures).toHaveBeenCalledWith(true);
  });
});
