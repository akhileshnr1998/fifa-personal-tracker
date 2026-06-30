import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerEntity } from './entities/player.entity';
import { TeamSquadMemberEntity } from './entities/team-squad-member.entity';
import { TeamEntity } from './entities/team.entity';
import { SquadSyncService } from './squad-sync.service';
import { TeamsController } from './teams.controller';
import { TeamsSyncService } from './teams-sync.service';
import { TeamsService } from './teams.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamEntity, PlayerEntity, TeamSquadMemberEntity]),
    HttpModule,
  ],
  controllers: [TeamsController],
  providers: [TeamsService, TeamsSyncService, SquadSyncService],
  exports: [TeamsService, TypeOrmModule],
})
export class TeamsModule {}
