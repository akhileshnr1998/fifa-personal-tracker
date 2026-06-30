import type { Fixture } from '../fixtures/types';
import type { BracketSlot } from './bracketTopology';

export interface BracketNode {
  slot: BracketSlot;
  fixture: Fixture | null;
  winnerTeamId: number | null;
}

export interface BracketRound {
  roundIndex: number;
  stageId: number;
  label: string;
  columnId: string;
  nodes: BracketNode[];
}

export interface BracketTree {
  rounds: BracketRound[];
  nodes: Map<number, BracketNode>;
}
