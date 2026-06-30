import type { BracketNode, BracketRound, BracketTree } from './types';

export interface BracketApiResponse {
  knockoutStarted: boolean;
  rounds: BracketRound[];
  nodes: Record<string, BracketNode>;
}

export function hydrateBracketTree(response: BracketApiResponse): BracketTree {
  const nodes = new Map<number, BracketNode>();
  for (const [matchNumber, node] of Object.entries(response.nodes)) {
    nodes.set(Number(matchNumber), node);
  }

  return {
    rounds: response.rounds,
    nodes,
  };
}
