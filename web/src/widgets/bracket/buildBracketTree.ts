import { formatStageLabel } from '../fixtures/stageLabels';
import type { Fixture } from '../fixtures/types';
import { BRACKET_SLOTS } from './bracketTopology';
import type { BracketNode, BracketRound, BracketTree } from './types';

export function resolveFixtureWinner(fixture: Fixture): number | null {
  if (fixture.status !== 'finished') return null;
  if (fixture.home_score === null || fixture.away_score === null) return null;

  if (fixture.decided_by === 'penalties') {
    if (
      fixture.home_penalty_score == null ||
      fixture.away_penalty_score == null
    ) {
      return null;
    }
    if (fixture.home_penalty_score > fixture.away_penalty_score) {
      return fixture.home_team.id;
    }
    if (fixture.away_penalty_score > fixture.home_penalty_score) {
      return fixture.away_team.id;
    }
    return null;
  }

  if (fixture.home_score > fixture.away_score) return fixture.home_team.id;
  if (fixture.away_score > fixture.home_score) return fixture.away_team.id;
  return null;
}

function sortNodesForColumn(nodes: BracketNode[]): BracketNode[] {
  const halfOrder = { upper: 0, lower: 1, 'third-place': 2 } as const;
  return [...nodes].sort((left, right) => {
    const halfDiff =
      halfOrder[left.slot.half] - halfOrder[right.slot.half];
    if (halfDiff !== 0) return halfDiff;
    return left.slot.row - right.slot.row;
  });
}

function buildRoundColumns(nodes: Map<number, BracketNode>): BracketRound[] {
  const columns: BracketRound[] = [];

  for (const roundIndex of [0, 1, 2, 3]) {
    const roundNodes = sortNodesForColumn(
      BRACKET_SLOTS.filter((slot) => slot.roundIndex === roundIndex).map(
        (slot) => nodes.get(slot.matchNumber)!,
      ),
    );
    columns.push({
      roundIndex,
      stageId: roundNodes[0]?.slot.stageId ?? 0,
      label: formatStageLabel(roundNodes[0]?.slot.stageId ?? 0),
      columnId: `round-${roundIndex}`,
      nodes: roundNodes,
    });
  }

  columns.push({
    roundIndex: 4,
    stageId: 7,
    label: formatStageLabel(7),
    columnId: 'final',
    nodes: [nodes.get(104)!],
  });

  columns.push({
    roundIndex: 4,
    stageId: 6,
    label: formatStageLabel(6),
    columnId: 'third-place',
    nodes: [nodes.get(103)!],
  });

  return columns;
}

export function buildBracketTree(fixtures: Fixture[]): BracketTree {
  const fixtureByMatchNumber = new Map<number, Fixture>();
  for (const fixture of fixtures) {
    if (
      fixture.match_number != null &&
      fixture.match_number >= 73 &&
      fixture.match_number <= 104
    ) {
      fixtureByMatchNumber.set(fixture.match_number, fixture);
    }
  }

  const nodes = new Map<number, BracketNode>();
  for (const slot of BRACKET_SLOTS) {
    const fixture = fixtureByMatchNumber.get(slot.matchNumber) ?? null;
    nodes.set(slot.matchNumber, {
      slot,
      fixture,
      winnerTeamId: fixture ? resolveFixtureWinner(fixture) : null,
    });
  }

  return {
    rounds: buildRoundColumns(nodes),
    nodes,
  };
}

export function hasKnockoutFixtures(fixtures: Fixture[]): boolean {
  return fixtures.some(
    (fixture) =>
      fixture.stage_id >= 2 ||
      (fixture.match_number != null && fixture.match_number >= 73),
  );
}
