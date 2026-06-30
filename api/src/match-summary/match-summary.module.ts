import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixtureEntity } from '../fixtures/entities/fixture.entity';
import { MatchEventEntity } from './entities/match-event.entity';
import { MatchStatEntity } from './entities/match-stat.entity';
import { MatchSummaryController } from './match-summary.controller';
import { MatchSummaryService } from './match-summary.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([FixtureEntity, MatchEventEntity, MatchStatEntity]),
  ],
  controllers: [MatchSummaryController],
  providers: [MatchSummaryService],
  exports: [MatchSummaryService],
})
export class MatchSummaryModule {}
