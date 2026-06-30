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

function buildBracketSlots(): BracketSlot[] {
  const slots: BracketSlot[] = [];

  for (let index = 0; index < 16; index += 1) {
    const matchNumber = 73 + index;
    slots.push({
      matchNumber,
      stageId: 2,
      roundIndex: 0,
      half: index < 8 ? 'upper' : 'lower',
      row: index % 8,
      parentMatchNumbers: null,
    });
  }

  for (let index = 0; index < 8; index += 1) {
    const matchNumber = 89 + index;
    slots.push({
      matchNumber,
      stageId: 3,
      roundIndex: 1,
      half: index < 4 ? 'upper' : 'lower',
      row: index % 4,
      parentMatchNumbers: [73 + index * 2, 74 + index * 2],
    });
  }

  for (let index = 0; index < 4; index += 1) {
    const matchNumber = 97 + index;
    slots.push({
      matchNumber,
      stageId: 4,
      roundIndex: 2,
      half: index < 2 ? 'upper' : 'lower',
      row: index % 2,
      parentMatchNumbers: [89 + index * 2, 90 + index * 2],
    });
  }

  slots.push({
    matchNumber: 101,
    stageId: 5,
    roundIndex: 3,
    half: 'upper',
    row: 0,
    parentMatchNumbers: [97, 98],
  });
  slots.push({
    matchNumber: 102,
    stageId: 5,
    roundIndex: 3,
    half: 'lower',
    row: 0,
    parentMatchNumbers: [99, 100],
  });

  slots.push({
    matchNumber: 103,
    stageId: 6,
    roundIndex: 4,
    half: 'third-place',
    row: 0,
    parentMatchNumbers: [101, 102],
  });

  slots.push({
    matchNumber: 104,
    stageId: 7,
    roundIndex: 4,
    half: 'upper',
    row: 0,
    parentMatchNumbers: [101, 102],
  });

  return slots;
}

export const BRACKET_SLOTS: BracketSlot[] = buildBracketSlots();
