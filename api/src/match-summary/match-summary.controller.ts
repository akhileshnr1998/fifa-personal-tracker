import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MatchSummaryService } from './match-summary.service';

@Controller('api/fixtures')
export class MatchSummaryController {
  constructor(private readonly matchSummaryService: MatchSummaryService) {}

  @Get(':id/summary')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  getSummary(@Param('id', ParseIntPipe) id: number) {
    return this.matchSummaryService.getSummary(id);
  }
}
