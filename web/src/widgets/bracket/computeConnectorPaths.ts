export interface ConnectorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConnectorEdge {
  parentA: ConnectorRect;
  parentB: ConnectorRect;
  child: ConnectorRect;
  columnGap: number;
}

function centerY(rect: ConnectorRect): number {
  return rect.y + rect.height / 2;
}

function rightX(rect: ConnectorRect): number {
  return rect.x + rect.width;
}

/**
 * Bracket fork routed through the column gap immediately after the parents,
 * then across the gap before the child — never through intermediate columns.
 */
export function computePairConnectorPath(
  parentA: ConnectorRect,
  parentB: ConnectorRect,
  child: ConnectorRect,
  columnGap: number,
): string {
  const ya = centerY(parentA);
  const yb = centerY(parentB);
  const yc = centerY(child);
  const parentRight = Math.max(rightX(parentA), rightX(parentB));
  const railX = parentRight + columnGap / 2;
  const childLeft = child.x;
  const childApproachX = childLeft - columnGap / 2;
  const joinY = (ya + yb) / 2;

  const segments = [
    `M ${rightX(parentA)} ${ya} H ${railX}`,
    `M ${rightX(parentB)} ${yb} H ${railX}`,
    `M ${railX} ${ya} V ${yb}`,
    `M ${railX} ${joinY} V ${yc}`,
  ];

  if (childApproachX > railX + 0.5) {
    segments.push(`M ${railX} ${yc} H ${childApproachX}`);
    segments.push(`M ${childApproachX} ${yc} H ${childLeft}`);
  } else {
    segments.push(`M ${railX} ${yc} H ${childLeft}`);
  }

  return segments.join(' ');
}

export function computeConnectorPaths(edges: ConnectorEdge[]): string[] {
  return edges.map(({ parentA, parentB, child, columnGap }) =>
    computePairConnectorPath(parentA, parentB, child, columnGap),
  );
}
