import { Controller, Get } from '@nestjs/common';
import { TeamPickerOptionDto } from './dto/team-summary.dto';
import { TeamsService } from './teams.service';

@Controller('api/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('names')
  async getTeamPickerOptions(): Promise<TeamPickerOptionDto[]> {
    return this.teamsService.getPickerOptions();
  }
}
