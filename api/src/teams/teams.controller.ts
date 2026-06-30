import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TeamPickerOptionDto } from './dto/team-summary.dto';
import { TeamProfileDto, TeamSquadDto } from './dto/team-profile.dto';
import { TeamsService } from './teams.service';

@Controller('api/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('names')
  async getTeamPickerOptions(): Promise<TeamPickerOptionDto[]> {
    return this.teamsService.getPickerOptions();
  }

  @Get()
  async getAllTeams(
    @Query('refresh') refresh?: string,
  ): Promise<TeamProfileDto[]> {
    return this.teamsService.getAllTeams(refresh === 'true');
  }

  @Get(':id/squad')
  async getTeamSquad(
    @Param('id', ParseIntPipe) id: number,
    @Query('refresh') refresh?: string,
  ): Promise<TeamSquadDto> {
    return this.teamsService.getTeamSquad(id, refresh === 'true');
  }
}
