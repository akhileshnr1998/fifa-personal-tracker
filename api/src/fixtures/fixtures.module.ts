import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixtureEntity } from './entities/fixture.entity';
import { FixturesController } from './fixtures.controller';
import { FixturesService } from './fixtures.service';
import { FixturesSyncService } from './fixtures-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([FixtureEntity]), HttpModule],
  controllers: [FixturesController],
  providers: [FixturesService, FixturesSyncService],
})
export class FixturesModule {}
