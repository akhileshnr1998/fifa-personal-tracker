const STAGE_LABELS: Record<number, string> = {
  1: 'Group Stage',
  2: 'Round of 32',
  3: 'Round of 16',
  4: 'Quarter-final',
  5: 'Semi-final',
  6: '3rd Place',
  7: 'Final',
};

export function formatStageLabel(stageId: number): string {
  return STAGE_LABELS[stageId] ?? `Stage ${stageId}`;
}
