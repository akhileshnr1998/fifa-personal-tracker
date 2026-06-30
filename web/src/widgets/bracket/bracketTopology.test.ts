import { describe, expect, it } from 'vitest';
import { BRACKET_SLOTS, KNOCKOUT_MATCH_NUMBERS } from './bracketTopology';

describe('bracketTopology', () => {
  it('defines 32 knockout slots spanning R32 through Final', () => {
    expect(KNOCKOUT_MATCH_NUMBERS).toHaveLength(32);
    expect(BRACKET_SLOTS).toHaveLength(32);
    const stages = new Set(BRACKET_SLOTS.map((slot) => slot.stageId));
    expect(stages).toEqual(new Set([2, 3, 4, 5, 6, 7]));
  });

  it('maps R16 slots to consecutive R32 parent pairs', () => {
    const r16 = BRACKET_SLOTS.filter((slot) => slot.stageId === 3);
    expect(r16).toHaveLength(8);
    r16.forEach((slot, index) => {
      expect(slot.parentMatchNumbers).toEqual([73 + index * 2, 74 + index * 2]);
    });
  });

  it('maps the Final to semifinal winners', () => {
    const finalSlot = BRACKET_SLOTS.find((slot) => slot.matchNumber === 104);
    expect(finalSlot?.parentMatchNumbers).toEqual([101, 102]);
  });
});
