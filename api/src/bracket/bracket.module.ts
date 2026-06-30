import { Module } from '@nestjs/common';
import { FixturesModule } from '../fixtures/fixtures.module';
import { BracketController } from './bracket.controller';
import { BracketService } from './bracket.service';

@Module({
  imports: [FixturesModule],
  controllers: [BracketController],
  providers: [BracketService],
})
export class BracketModule {}
