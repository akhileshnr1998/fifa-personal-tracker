import { FixtureResponseDto } from '../../fixtures/dto/fixture-response.dto';
import { BracketSlot } from '../bracket-topology';

export interface BracketNodeDto {
  slot: BracketSlot;
  fixture: FixtureResponseDto | null;
  winnerTeamId: number | null;
}

export interface BracketRoundDto {
  roundIndex: number;
  stageId: number;
  label: string;
  columnId: string;
  nodes: BracketNodeDto[];
}

export interface BracketResponseDto {
  knockoutStarted: boolean;
  rounds: BracketRoundDto[];
  nodes: Record<string, BracketNodeDto>;
}
