import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixtureEntity } from '../fixtures/entities/fixture.entity';
import { isPlaceholderTeam } from './is-placeholder-team';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(FixtureEntity)
    private readonly fixturesRepository: Repository<FixtureEntity>,
  ) {}

  async getTeamNames(): Promise<string[]> {
    const fixtures = await this.fixturesRepository.find({
      select: ['home_team', 'away_team'],
    });

    const names = new Set<string>();
    for (const fixture of fixtures) {
      for (const teamName of [fixture.home_team, fixture.away_team]) {
        if (!isPlaceholderTeam(teamName)) {
          names.add(teamName);
        }
      }
    }

    return [...names].sort((a, b) => a.localeCompare(b));
  }
}
