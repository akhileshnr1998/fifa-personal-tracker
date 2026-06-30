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
 * FIFA 2026 knockout progression graph — derived from official bracket flow
 * (Final → SF → QF → R16 → R32), not chronological match_number order.
 *
 * R32 leaf order within each half follows DFS tree order so connector lines
 * do not cross.
 */
const FIFA_2026_PARENTS: Readonly<Record<number, [number, number]>> = {
  89: [73, 76],
  90: [75, 77],
  91: [74, 78],
  92: [79, 80],
  93: [83, 84],
  94: [81, 82],
  95: [86, 88],
  96: [85, 87],
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
const UPPER_R32_ORDER = [73, 76, 75, 77, 83, 84, 81, 82] as const;

/** Lower-half R32 leaves in DFS order (feeds SF2 / M102). */
const LOWER_R32_ORDER = [74, 78, 79, 80, 86, 88, 85, 87] as const;

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
