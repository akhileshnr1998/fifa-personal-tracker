import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FixtureResponseDto } from './dto/fixture-response.dto';
import { FixturesService } from './fixtures.service';

@Controller('api/fixtures')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
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
