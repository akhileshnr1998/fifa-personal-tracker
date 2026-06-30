import { BRACKET_SLOTS } from './bracketTopology';

const LEAF_STRIDE = 8;
const DEPTH_IN_HALF = 3;

export const BRACKET_LAYOUT = {
  slotUnit: 14,
  nodeHeight: 48,
  minNodeGap: 18,
  columnWidth: 156,
  columnGap: 44,
  treePaddingTop: 8,
  halfGap: 48,
  canvasPadding: 16,
  headerRowHeight: 32,
  headerGap: 10,
  thirdPlaceGap: 28,
  finalExtraHeight: 4,
} as const;

export interface NodeLayout {
  matchNumber: number;
  columnIndex: number;
  top: number;
  height: number;
}

export interface BracketLayout {
  nodes: Map<number, NodeLayout>;
  treeHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

const ROUND_COLUMN_INDEX: Record<number, number> = {
  2: 0,
  3: 1,
  4: 2,
  5: 3,
  7: 4,
  6: 4,
};

function assertSpacing(): void {
  const leafPixelStride = LEAF_STRIDE * BRACKET_LAYOUT.slotUnit;
  const gap = leafPixelStride - BRACKET_LAYOUT.nodeHeight;
  if (gap < BRACKET_LAYOUT.minNodeGap) {
    throw new Error(
      `Bracket leaf gap ${gap}px is below minNodeGap ${BRACKET_LAYOUT.minNodeGap}px`,
    );
  }
}

assertSpacing();

function computeTreeRows(): Map<number, number> {
  const rows = new Map<number, number>();

  for (const slot of BRACKET_SLOTS) {
    if (slot.stageId === 2) {
      rows.set(slot.matchNumber, slot.row * 2 ** DEPTH_IN_HALF);
    }
  }

  for (const roundIndex of [1, 2, 3, 4]) {
    for (const slot of BRACKET_SLOTS) {
      if (slot.roundIndex !== roundIndex || !slot.parentMatchNumbers) continue;
      const [parentA, parentB] = slot.parentMatchNumbers;
      const rowA = rows.get(parentA);
      const rowB = rows.get(parentB);
      if (rowA == null || rowB == null) continue;
      rows.set(slot.matchNumber, (rowA + rowB) / 2);
    }
  }

  return rows;
}

function upperBracketBodyHeight(treeRows: Map<number, number>): number {
  const upperR32 = BRACKET_SLOTS.filter(
    (slot) => slot.stageId === 2 && slot.half === 'upper',
  );
  const maxRow = Math.max(
    ...upperR32.map((slot) => treeRows.get(slot.matchNumber) ?? 0),
  );
  return (
    BRACKET_LAYOUT.treePaddingTop +
    maxRow * BRACKET_LAYOUT.slotUnit +
    BRACKET_LAYOUT.nodeHeight
  );
}

function lowerHalfOffset(treeRows: Map<number, number>): number {
  return upperBracketBodyHeight(treeRows) + BRACKET_LAYOUT.halfGap;
}

export function columnLeft(columnIndex: number): number {
  const { canvasPadding, columnWidth, columnGap } = BRACKET_LAYOUT;
  return canvasPadding + columnIndex * (columnWidth + columnGap);
}

export function computeBracketLayout(): BracketLayout {
  const treeRows = computeTreeRows();
  const nodes = new Map<number, NodeLayout>();
  const lowerOffset = lowerHalfOffset(treeRows);
  const {
    nodeHeight,
    columnWidth,
    columnGap,
    canvasPadding,
    treePaddingTop,
    slotUnit,
    thirdPlaceGap,
    finalExtraHeight,
    headerRowHeight,
    headerGap,
  } = BRACKET_LAYOUT;

  for (const slot of BRACKET_SLOTS) {
    if (slot.matchNumber === 104 || slot.half === 'third-place') {
      continue;
    }

    const treeRow = treeRows.get(slot.matchNumber) ?? 0;
    const top =
      slot.half === 'lower'
        ? lowerOffset + treeRow * slotUnit
        : treePaddingTop + treeRow * slotUnit;

    nodes.set(slot.matchNumber, {
      matchNumber: slot.matchNumber,
      columnIndex: ROUND_COLUMN_INDEX[slot.stageId] ?? 0,
      top,
      height: nodeHeight,
    });
  }

  const sf101 = nodes.get(101)!;
  const sf102 = nodes.get(102)!;
  const finalHeight = nodeHeight + finalExtraHeight;
  const sfMid = (sf101.top + sf102.top + sf101.height) / 2;
  const finalTop = sfMid - finalHeight / 2;

  nodes.set(104, {
    matchNumber: 104,
    columnIndex: ROUND_COLUMN_INDEX[7],
    top: finalTop,
    height: finalHeight,
  });

  nodes.set(103, {
    matchNumber: 103,
    columnIndex: ROUND_COLUMN_INDEX[6],
    top: finalTop + finalHeight + thirdPlaceGap,
    height: nodeHeight,
  });

  const treeHeight =
    Math.max(...[...nodes.values()].map((node) => node.top + node.height)) +
    canvasPadding;

  const columnCount = 5;
  const canvasWidth =
    canvasPadding * 2 +
    columnCount * columnWidth +
    (columnCount - 1) * columnGap;

  return {
    nodes,
    treeHeight,
    canvasWidth,
    canvasHeight: headerRowHeight + headerGap + treeHeight,
  };
}

export const COLUMN_LABELS = [
  'R32',
  'R16',
  'QF',
  'SF',
  'Final',
] as const;

export const COLUMN_LABELS_FULL = [
  'Round of 32',
  'Round of 16',
  'Quarter-finals',
  'Semi-finals',
  'Final & 3rd Place',
] as const;
