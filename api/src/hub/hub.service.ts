import { Injectable } from '@nestjs/common';
import { FixturesService } from '../fixtures/fixtures.service';
import { MatchSummaryService } from '../match-summary/match-summary.service';
import { TeamsService } from '../teams/teams.service';
import { HubResponseDto, TopScorersDto } from './dto/hub-response.dto';
import { TopScorersService } from './top-scorers.service';

@Injectable()
export class HubService {
  constructor(
    private readonly fixturesService: FixturesService,
    private readonly matchSummaryService: MatchSummaryService,
    private readonly topScorersService: TopScorersService,
    private readonly teamsService: TeamsService,
  ) {}

  async getHub(forceSync = false): Promise<HubResponseDto> {
    if (forceSync) {
      await this.fixturesService.getFixtures(true);
    }

    await this.matchSummaryService.backfillFinishedSummaries();

    const [topScorerEntries, teamsQuickLinks] = await Promise.all([
      this.topScorersService.getTopScorers(),
      this.teamsService.getPickerOptions(),
    ]);

    return {
      top_scorers: this.buildTopScorers(topScorerEntries),
      teams_quick_links: teamsQuickLinks,
    };
  }

  private buildTopScorers(
    entries: Awaited<ReturnType<TopScorersService['getTopScorers']>>,
  ): TopScorersDto {
    return {
      available: entries.length > 0,
      entries,
    };
  }
}
