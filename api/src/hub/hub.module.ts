import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixturesModule } from '../fixtures/fixtures.module';
import { MatchEventEntity } from '../match-summary/entities/match-event.entity';
import { MatchSummaryModule } from '../match-summary/match-summary.module';
import { TeamsModule } from '../teams/teams.module';
import { HubController } from './hub.controller';
import { HubService } from './hub.service';
import { TopScorersService } from './top-scorers.service';

@Module({
  imports: [
    FixturesModule,
    MatchSummaryModule,
    TeamsModule,
    TypeOrmModule.forFeature([MatchEventEntity]),
  ],
  controllers: [HubController],
  providers: [HubService, TopScorersService],
})
export class HubModule {}
