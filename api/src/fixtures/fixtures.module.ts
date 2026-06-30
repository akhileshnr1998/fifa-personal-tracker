import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamEntity } from '../teams/entities/team.entity';
import { VenueEntity } from '../venues/entities/venue.entity';
import { FixtureEntity } from './entities/fixture.entity';
import { FixturesController } from './fixtures.controller';
import { FixturesService } from './fixtures.service';
import { FixturesSyncService } from './fixtures-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FixtureEntity, TeamEntity, VenueEntity]),
    HttpModule,
  ],
  controllers: [FixturesController],
  providers: [FixturesService, FixturesSyncService],
  exports: [FixturesService],
})
export class FixturesModule {}
