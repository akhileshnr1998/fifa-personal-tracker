import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TeamPickerOptionDto } from './dto/team-summary.dto';
import { TeamProfileDto, TeamSquadDto } from './dto/team-profile.dto';
import { TeamSquadMemberEntity } from './entities/team-squad-member.entity';
import { TeamEntity } from './entities/team.entity';
import { SquadSyncService } from './squad-sync.service';
import { TeamsSyncService } from './teams-sync.service';
import { toTeamProfileDto, toTeamSquadDto } from './teams.mapper';

@Injectable()
export class TeamsService {
  private teamsSyncPromise: Promise<void> | null = null;
  private readonly squadSyncPromises = new Map<number, Promise<void>>();

  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
    @InjectRepository(TeamSquadMemberEntity)
    private readonly squadMembersRepository: Repository<TeamSquadMemberEntity>,
    private readonly teamsSyncService: TeamsSyncService,
    private readonly squadSyncService: SquadSyncService,
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

  async getAllTeams(forceSync = false): Promise<TeamProfileDto[]> {
    const profileCount = await this.teamsRepository.count({
      where: { is_placeholder: false },
    });

    if (profileCount < 48 || forceSync) {
      await this.runTeamsSync();
    }

    const teams = await this.teamsRepository.find({
      where: { is_placeholder: false },
      order: { name: 'ASC' },
    });

    return teams.map(toTeamProfileDto);
  }

  async getTeamSquad(teamId: number, forceSync = false): Promise<TeamSquadDto> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team || team.is_placeholder) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }

    const squadCount = await this.squadMembersRepository.count({
      where: { team_id: teamId },
    });

    if (squadCount === 0 || forceSync) {
      await this.runSquadSync(teamId);
    }

    const members = await this.squadMembersRepository.find({
      where: { team_id: teamId },
      relations: ['player'],
    });

    return toTeamSquadDto(team, members);
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

  private runTeamsSync(): Promise<void> {
    if (!this.teamsSyncPromise) {
      this.teamsSyncPromise = this.teamsSyncService
        .syncFromEspn()
        .then(() => undefined)
        .finally(() => {
          this.teamsSyncPromise = null;
        });
    }
    return this.teamsSyncPromise;
  }

  private runSquadSync(teamId: number): Promise<void> {
    const existing = this.squadSyncPromises.get(teamId);
    if (existing) return existing;

    const promise = this.squadSyncService
      .syncTeamSquadFromEspn(teamId)
      .then(() => undefined)
      .finally(() => {
        this.squadSyncPromises.delete(teamId);
      });

    this.squadSyncPromises.set(teamId, promise);
    return promise;
  }
}
