import { describe, expect, it } from 'vitest';
import {
  computeConnectorPaths,
  computePairConnectorPath,
  type ConnectorRect,
} from './computeConnectorPaths';

const COLUMN_GAP = 44;

describe('computeConnectorPaths', () => {
  const parentA: ConnectorRect = { x: 10, y: 20, width: 120, height: 40 };
  const parentB: ConnectorRect = { x: 10, y: 100, width: 120, height: 40 };
  const child: ConnectorRect = { x: 174, y: 50, width: 120, height: 40 };

  it('routes lines through the column gap, not through the child box', () => {
    const path = computePairConnectorPath(parentA, parentB, child, COLUMN_GAP);
    const railX = 130 + COLUMN_GAP / 2;

    expect(path).toContain(`M 130 40 H ${railX}`);
    expect(path).toContain(`M 130 120 H ${railX}`);
    expect(path).toContain(`M ${railX} 40 V 120`);
    expect(path).toContain(`M ${railX} 80 V 70`);
    expect(path).toContain(`M ${railX} 70 H 174`);
  });

  it('maps paired edges to paths', () => {
    const paths = computeConnectorPaths([
      { parentA, parentB, child, columnGap: COLUMN_GAP },
    ]);
    expect(paths).toHaveLength(1);
    expect(paths[0]).toContain('H 174');
  });
});
