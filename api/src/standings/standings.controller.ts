import { Controller, Get, Query } from '@nestjs/common';
import { GroupStandingsDto } from './dto/standings-response.dto';
import { StandingsService } from './standings.service';

@Controller('api/standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get('groups')
  async getGroupStandings(
    @Query('refresh') refresh?: string,
  ): Promise<GroupStandingsDto[]> {
    const forceSync = refresh === 'true';
    return this.standingsService.getGroupStandings(forceSync);
  }
}
