import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupStandingsDto } from './dto/standings-response.dto';
import { GroupStandingEntity } from './entities/group-standing.entity';
import { TournamentGroupEntity } from './entities/tournament-group.entity';
import { StandingsSyncService } from './standings-sync.service';
import { toGroupStandingsDtoList } from './standings.mapper';

@Injectable()
export class StandingsService {
  private syncPromise: Promise<void> | null = null;

  constructor(
    @InjectRepository(TournamentGroupEntity)
    private readonly groupsRepository: Repository<TournamentGroupEntity>,
    @InjectRepository(GroupStandingEntity)
    private readonly standingsRepository: Repository<GroupStandingEntity>,
    private readonly standingsSyncService: StandingsSyncService,
  ) {}

  async getGroupStandings(forceSync = false): Promise<GroupStandingsDto[]> {
    const count = await this.groupsRepository.count();

    if (count === 0 || forceSync) {
      await this.runSync();
    }

    const standings = await this.standingsRepository.find({
      relations: ['group', 'team'],
      order: { group_id: 'ASC', rank: 'ASC' },
    });

    return toGroupStandingsDtoList(standings);
  }

  private runSync(): Promise<void> {
    if (!this.syncPromise) {
      this.syncPromise = this.standingsSyncService
        .syncFromEspn()
        .then(() => undefined)
        .finally(() => {
          this.syncPromise = null;
        });
    }
    return this.syncPromise;
  }
}
