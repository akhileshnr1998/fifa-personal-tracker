import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BracketService } from './bracket.service';
import { BracketResponseDto } from './dto/bracket-response.dto';

@Controller('api/bracket')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class BracketController {
  constructor(private readonly bracketService: BracketService) {}

  @Get()
  async getBracket(
    @Query('refresh') refresh?: string,
  ): Promise<BracketResponseDto> {
    const forceSync = refresh === 'true';
    return this.bracketService.getBracket(forceSync);
  }
}
