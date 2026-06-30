export interface BracketSlot {
  matchNumber: number;
  stageId: number;
  roundIndex: number;
  half: 'upper' | 'lower' | 'third-place';
  row: number;
  parentMatchNumbers: [number, number] | null;
}

export const KNOCKOUT_MATCH_NUMBERS = Array.from(
  { length: 32 },
  (_, index) => 73 + index,
) as readonly number[];

/**
 * ESPN labels like "Round of 32 5 Winner" use FIFA bracket slot numbers (M1–M16),
 * NOT chronological match_number offset (73 + N − 1). Our match_number comes from
 * ESPN kickoff sort order, so slot 5 (France–Sweden) is M78, not M77.
 */
export const R32_BRACKET_SLOT_TO_MATCH_NUMBER: Readonly<Record<number, number>> =
  {
    1: 73,
    2: 75,
    3: 76,
    4: 74,
    5: 78,
    6: 77,
    7: 79,
    8: 80,
    9: 82,
    10: 81,
    11: 84,
    12: 83,
    13: 85,
    14: 87,
    15: 88,
    16: 86,
  };

/**
 * FIFA 2026 knockout progression graph — parent pairs derived from ESPN
 * placeholder labels with R32 bracket-slot mapping above.
 */
const FIFA_2026_PARENTS: Readonly<Record<number, [number, number]>> = {
  89: [73, 76],
  90: [75, 78],
  91: [74, 77],
  92: [79, 80],
  93: [83, 84],
  94: [81, 82],
  95: [86, 87],
  96: [85, 88],
  97: [89, 90],
  98: [93, 94],
  99: [91, 92],
  100: [95, 96],
  101: [97, 98],
  102: [99, 100],
  103: [101, 102],
  104: [101, 102],
};

/** Upper-half R32 leaves in DFS order (feeds SF1 / M101). */
const UPPER_R32_ORDER = [73, 76, 75, 78, 83, 84, 81, 82] as const;

/** Lower-half R32 leaves in DFS order (feeds SF2 / M102). */
const LOWER_R32_ORDER = [74, 77, 79, 80, 86, 87, 85, 88] as const;

const UPPER_R16_ORDER = [89, 90, 93, 94] as const;
const LOWER_R16_ORDER = [91, 92, 95, 96] as const;

const UPPER_QF_ORDER = [97, 98] as const;
const LOWER_QF_ORDER = [99, 100] as const;

function buildBracketSlots(): BracketSlot[] {
  const slots: BracketSlot[] = [];

  for (const [row, matchNumber] of UPPER_R32_ORDER.entries()) {
    slots.push({
      matchNumber,
      stageId: 2,
      roundIndex: 0,
      half: 'upper',
      row,
      parentMatchNumbers: null,
    });
  }

  for (const [row, matchNumber] of LOWER_R32_ORDER.entries()) {
    slots.push({
      matchNumber,
      stageId: 2,
      roundIndex: 0,
      half: 'lower',
      row,
      parentMatchNumbers: null,
    });
  }

  for (const [row, matchNumber] of UPPER_R16_ORDER.entries()) {
    slots.push({
      matchNumber,
      stageId: 3,
      roundIndex: 1,
      half: 'upper',
      row,
      parentMatchNumbers: FIFA_2026_PARENTS[matchNumber],
    });
  }

  for (const [row, matchNumber] of LOWER_R16_ORDER.entries()) {
    slots.push({
      matchNumber,
      stageId: 3,
      roundIndex: 1,
      half: 'lower',
      row,
      parentMatchNumbers: FIFA_2026_PARENTS[matchNumber],
    });
  }

  for (const [row, matchNumber] of UPPER_QF_ORDER.entries()) {
    slots.push({
      matchNumber,
      stageId: 4,
      roundIndex: 2,
      half: 'upper',
      row,
      parentMatchNumbers: FIFA_2026_PARENTS[matchNumber],
    });
  }

  for (const [row, matchNumber] of LOWER_QF_ORDER.entries()) {
    slots.push({
      matchNumber,
      stageId: 4,
      roundIndex: 2,
      half: 'lower',
      row,
      parentMatchNumbers: FIFA_2026_PARENTS[matchNumber],
    });
  }

  slots.push({
    matchNumber: 101,
    stageId: 5,
    roundIndex: 3,
    half: 'upper',
    row: 0,
    parentMatchNumbers: FIFA_2026_PARENTS[101],
  });
  slots.push({
    matchNumber: 102,
    stageId: 5,
    roundIndex: 3,
    half: 'lower',
    row: 0,
    parentMatchNumbers: FIFA_2026_PARENTS[102],
  });

  slots.push({
    matchNumber: 103,
    stageId: 6,
    roundIndex: 4,
    half: 'third-place',
    row: 0,
    parentMatchNumbers: FIFA_2026_PARENTS[103],
  });

  slots.push({
    matchNumber: 104,
    stageId: 7,
    roundIndex: 4,
    half: 'upper',
    row: 0,
    parentMatchNumbers: FIFA_2026_PARENTS[104],
  });

  return slots;
}

export const BRACKET_SLOTS: BracketSlot[] = buildBracketSlots();
