import { Test, TestingModule } from '@nestjs/testing';
import { FixturesService } from '../fixtures/fixtures.service';
import { MatchSummaryService } from '../match-summary/match-summary.service';
import { TeamsService } from '../teams/teams.service';
import { HubService } from './hub.service';
import { TopScorersService } from './top-scorers.service';

describe('HubService', () => {
  let service: HubService;
  let fixturesService: { getFixtures: jest.Mock };
  let matchSummaryService: { backfillFinishedSummaries: jest.Mock };
  let topScorersService: { getTopScorers: jest.Mock };
  let teamsService: { getPickerOptions: jest.Mock };

  beforeEach(async () => {
    fixturesService = { getFixtures: jest.fn() };
    matchSummaryService = { backfillFinishedSummaries: jest.fn().mockResolvedValue(undefined) };
    topScorersService = { getTopScorers: jest.fn() };
    teamsService = { getPickerOptions: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HubService,
        { provide: FixturesService, useValue: fixturesService },
        { provide: MatchSummaryService, useValue: matchSummaryService },
        { provide: TopScorersService, useValue: topScorersService },
        { provide: TeamsService, useValue: teamsService },
      ],
    }).compile();

    service = module.get(HubService);
  });

  it('returns top scorers and team quick links', async () => {
    topScorersService.getTopScorers.mockResolvedValue([
      {
        rank: 1,
        player_name: 'Lionel Messi',
        team: { id: 10, name: 'Argentina' },
        goals: 5,
      },
    ]);
    teamsService.getPickerOptions.mockResolvedValue([
      { id: 10, name: 'Argentina' },
    ]);

    const result = await service.getHub();

    expect(matchSummaryService.backfillFinishedSummaries).toHaveBeenCalled();
    expect(fixturesService.getFixtures).not.toHaveBeenCalled();
    expect(result.top_scorers.available).toBe(true);
    expect(result.top_scorers.entries).toHaveLength(1);
    expect(result.teams_quick_links).toHaveLength(1);
  });

  it('marks top scorers unavailable when empty', async () => {
    topScorersService.getTopScorers.mockResolvedValue([]);
    teamsService.getPickerOptions.mockResolvedValue([]);

    const result = await service.getHub();

    expect(result.top_scorers).toEqual({ available: false, entries: [] });
    expect(result.teams_quick_links).toEqual([]);
  });

  it('refreshes fixtures on demand before backfilling summaries', async () => {
    fixturesService.getFixtures.mockResolvedValue([]);
    topScorersService.getTopScorers.mockResolvedValue([]);
    teamsService.getPickerOptions.mockResolvedValue([]);

    await service.getHub(true);

    expect(fixturesService.getFixtures).toHaveBeenCalledWith(true);
    expect(matchSummaryService.backfillFinishedSummaries).toHaveBeenCalled();
    expect(topScorersService.getTopScorers).toHaveBeenCalled();
    expect(teamsService.getPickerOptions).toHaveBeenCalled();
  });
});
