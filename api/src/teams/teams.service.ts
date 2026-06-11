import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TeamPickerOptionDto } from './dto/team-summary.dto';
import { TeamEntity } from './entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
  ) {}

  async getPickerOptions(): Promise<TeamPickerOptionDto[]> {
    const teams = await this.teamsRepository.find({
      where: { is_placeholder: false },
      order: { name: 'ASC' },
    });

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
    }));
  }

  async findFollowableTeamsByIds(teamIds: number[]): Promise<TeamEntity[]> {
    if (teamIds.length === 0) {
      return [];
    }

    return this.teamsRepository.find({
      where: {
        id: In(teamIds),
        is_placeholder: false,
      },
    });
  }
}
