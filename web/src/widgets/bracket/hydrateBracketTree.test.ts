import { describe, expect, it } from 'vitest';
import { hydrateBracketTree } from './hydrateBracketTree';
import type { BracketApiResponse } from './hydrateBracketTree';

describe('hydrateBracketTree', () => {
  it('converts nodes record into a Map keyed by match number', () => {
    const response: BracketApiResponse = {
      knockoutStarted: true,
      rounds: [],
      nodes: {
        '73': {
          slot: {
            matchNumber: 73,
            stageId: 2,
            roundIndex: 0,
            half: 'upper',
            row: 0,
            parentMatchNumbers: null,
          },
          fixture: null,
          winnerTeamId: null,
        },
      },
    };

    const tree = hydrateBracketTree(response);
    expect(tree.nodes.get(73)?.slot.matchNumber).toBe(73);
  });
});
