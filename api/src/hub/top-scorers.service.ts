import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchEventEntity } from '../match-summary/entities/match-event.entity';
import { TopScorerEntryDto } from './dto/hub-response.dto';

const SCORING_EVENT_TYPES = ['goal', 'penalty_goal'] as const;
const TOP_SCORERS_LIMIT = 10;

interface ScorerAggregateRow {
  player_name: string;
  team_id: number;
  team_name: string;
  goals: string;
}

@Injectable()
export class TopScorersService {
  constructor(
    @InjectRepository(MatchEventEntity)
    private readonly matchEventsRepository: Repository<MatchEventEntity>,
  ) {}

  async getTopScorers(): Promise<TopScorerEntryDto[]> {
    const rows = await this.matchEventsRepository
      .createQueryBuilder('event')
      .innerJoin('event.team', 'team')
      .select('event.player_name', 'player_name')
      .addSelect('event.team_id', 'team_id')
      .addSelect('team.name', 'team_name')
      .addSelect('COUNT(*)', 'goals')
      .where('event.type IN (:...types)', { types: SCORING_EVENT_TYPES })
      .andWhere('event.player_name IS NOT NULL')
      .groupBy('event.player_name')
      .addGroupBy('event.team_id')
      .addGroupBy('team.name')
      .orderBy('COUNT(*)', 'DESC')
      .addOrderBy('event.player_name', 'ASC')
      .limit(TOP_SCORERS_LIMIT)
      .getRawMany<ScorerAggregateRow>();

    return rows.map((row, index) => ({
      rank: index + 1,
      player_name: row.player_name,
      team: { id: Number(row.team_id), name: row.team_name },
      goals: Number(row.goals),
    }));
  }
}
