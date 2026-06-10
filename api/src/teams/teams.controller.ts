import { Controller, Get } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('api/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('names')
  async getTeamNames(): Promise<string[]> {
    return this.teamsService.getTeamNames();
  }
}
