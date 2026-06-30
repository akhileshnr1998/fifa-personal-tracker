import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { HubResponseDto } from './dto/hub-response.dto';
import { HubService } from './hub.service';

@Controller('api/hub')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class HubController {
  constructor(private readonly hubService: HubService) {}

  @Get()
  async getHub(@Query('refresh') refresh?: string): Promise<HubResponseDto> {
    const forceSync = refresh === 'true';
    return this.hubService.getHub(forceSync);
  }
}
