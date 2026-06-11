import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamEntity } from '../teams/entities/team.entity';
import { GroupStandingEntity } from './entities/group-standing.entity';
import { TournamentGroupEntity } from './entities/tournament-group.entity';
import { StandingsController } from './standings.controller';
import { StandingsSyncService } from './standings-sync.service';
import { StandingsService } from './standings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TournamentGroupEntity,
      GroupStandingEntity,
      TeamEntity,
    ]),
    HttpModule,
  ],
  controllers: [StandingsController],
  providers: [StandingsService, StandingsSyncService],
})
export class StandingsModule {}
