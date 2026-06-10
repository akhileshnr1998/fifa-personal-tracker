import { Controller, Get, Query } from '@nestjs/common';
import { FixtureResponseDto } from './dto/fixture-response.dto';
import { FixturesService } from './fixtures.service';

@Controller('api/fixtures')
export class FixturesController {
  constructor(private readonly fixturesService: FixturesService) {}

  @Get()
  async getFixtures(
    @Query('refresh') refresh?: string,
  ): Promise<FixtureResponseDto[]> {
    const forceSync = refresh === 'true';
    return this.fixturesService.getFixtures(forceSync);
  }
}
