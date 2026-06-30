import { Injectable } from '@nestjs/common';
import { FixturesService } from '../fixtures/fixtures.service';
import { buildBracketTree } from './build-bracket-tree';
import { BracketResponseDto } from './dto/bracket-response.dto';

@Injectable()
export class BracketService {
  constructor(private readonly fixturesService: FixturesService) {}

  async getBracket(forceSync = false): Promise<BracketResponseDto> {
    const fixtures = await this.fixturesService.getFixtures(forceSync);
    return buildBracketTree(fixtures);
  }
}
