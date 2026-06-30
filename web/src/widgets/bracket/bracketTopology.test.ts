import { describe, expect, it } from 'vitest';
import {
  BRACKET_SLOTS,
  KNOCKOUT_MATCH_NUMBERS,
  R32_BRACKET_SLOT_TO_MATCH_NUMBER,
} from './bracketTopology';

const FIFA_2026_PARENTS: Record<number, [number, number]> = {
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

describe('bracketTopology', () => {
  it('defines 32 knockout slots spanning R32 through Final', () => {
    expect(KNOCKOUT_MATCH_NUMBERS).toHaveLength(32);
    expect(BRACKET_SLOTS).toHaveLength(32);
    const stages = new Set(BRACKET_SLOTS.map((slot) => slot.stageId));
    expect(stages).toEqual(new Set([2, 3, 4, 5, 6, 7]));
  });

  it('maps ESPN R32 bracket slots to chronological match_numbers', () => {
    expect(R32_BRACKET_SLOT_TO_MATCH_NUMBER[5]).toBe(78);
    expect(R32_BRACKET_SLOT_TO_MATCH_NUMBER[6]).toBe(77);
  });

  it('maps R16 slots to FIFA 2026 cross-bracket R32 parent pairs', () => {
    const r16 = BRACKET_SLOTS.filter((slot) => slot.stageId === 3);
    expect(r16).toHaveLength(8);
    for (const slot of r16) {
      expect(slot.parentMatchNumbers).toEqual(FIFA_2026_PARENTS[slot.matchNumber]);
    }
  });

  it('routes Paraguay to the France-Sweden winner path', () => {
    const paraguayR16 = BRACKET_SLOTS.find((slot) => slot.matchNumber === 90);
    expect(paraguayR16?.parentMatchNumbers).toEqual([75, 78]);
  });

  it('routes Brazil to the Ivory Coast-Norway winner path', () => {
    const brazilR16 = BRACKET_SLOTS.find((slot) => slot.matchNumber === 91);
    expect(brazilR16?.parentMatchNumbers).toEqual([74, 77]);
  });

  it('maps QF and SF slots to FIFA 2026 parent pairs', () => {
    for (const matchNumber of [97, 98, 99, 100, 101, 102, 103, 104]) {
      const slot = BRACKET_SLOTS.find((entry) => entry.matchNumber === matchNumber);
      expect(slot?.parentMatchNumbers).toEqual(FIFA_2026_PARENTS[matchNumber]);
    }
  });

  it('assigns R32 leaves to bracket halves by subtree, not match_number order', () => {
    const upperR32 = BRACKET_SLOTS.filter(
      (slot) => slot.stageId === 2 && slot.half === 'upper',
    )
      .sort((left, right) => left.row - right.row)
      .map((slot) => slot.matchNumber);
    const lowerR32 = BRACKET_SLOTS.filter(
      (slot) => slot.stageId === 2 && slot.half === 'lower',
    )
      .sort((left, right) => left.row - right.row)
      .map((slot) => slot.matchNumber);

    expect(upperR32).toEqual([73, 76, 75, 78, 83, 84, 81, 82]);
    expect(lowerR32).toEqual([74, 77, 79, 80, 86, 87, 85, 88]);
  });

  it('maps the Final to semifinal winners', () => {
    const finalSlot = BRACKET_SLOTS.find((slot) => slot.matchNumber === 104);
    expect(finalSlot?.parentMatchNumbers).toEqual([101, 102]);
  });
});
