import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixtureResponseDto } from './dto/fixture-response.dto';
import { FixtureEntity } from './entities/fixture.entity';
import { FixturesSyncService } from './fixtures-sync.service';
import {
  sortFixturesChronologically,
  toFixtureResponseDto,
} from './fixtures.mapper';

@Injectable()
export class FixturesService {
  private syncPromise: Promise<void> | null = null;

  constructor(
    @InjectRepository(FixtureEntity)
    private readonly fixturesRepository: Repository<FixtureEntity>,
    private readonly fixturesSyncService: FixturesSyncService,
  ) {}

  async getFixtures(forceSync = false): Promise<FixtureResponseDto[]> {
    const count = await this.fixturesRepository.count();

    if (count === 0 || forceSync) {
      await this.runSync();
    }

    const fixtures = await this.fixturesRepository.find({
      relations: ['home_team', 'away_team', 'venue'],
    });
    return sortFixturesChronologically(fixtures).map(toFixtureResponseDto);
  }

  private runSync(): Promise<void> {
    if (!this.syncPromise) {
      this.syncPromise = this.fixturesSyncService
        .syncFromEspn()
        .then(() => undefined)
        .finally(() => {
          this.syncPromise = null;
        });
    }
    return this.syncPromise;
  }
}
