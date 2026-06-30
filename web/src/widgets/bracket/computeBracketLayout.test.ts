import { describe, expect, it } from 'vitest';
import { BRACKET_LAYOUT, computeBracketLayout } from './computeBracketLayout';

describe('computeBracketLayout', () => {
  it('centers R16 nodes between their R32 parents', () => {
    const layout = computeBracketLayout();
    const parentA = layout.nodes.get(73)!;
    const parentB = layout.nodes.get(76)!;
    const child = layout.nodes.get(89)!;

    const parentCenter = (parentA.top + parentB.top + parentA.height) / 2;
    const childCenter = child.top + child.height / 2;

    expect(childCenter).toBeCloseTo(parentCenter, 0);
  });

  it('places the Final between upper and lower semifinals', () => {
    const layout = computeBracketLayout();
    const sf101 = layout.nodes.get(101)!;
    const sf102 = layout.nodes.get(102)!;
    const finalNode = layout.nodes.get(104)!;

    const sfMid = (sf101.top + sf102.top + sf101.height) / 2;
    const finalCenter = finalNode.top + finalNode.height / 2;

    expect(finalCenter).toBeCloseTo(sfMid, 0);
  });

  it('keeps a clear vertical gap between adjacent upper-half R32 matches', () => {
    const layout = computeBracketLayout();
    const first = layout.nodes.get(73)!;
    const second = layout.nodes.get(76)!;
    const gap = second.top - (first.top + first.height);

    expect(gap).toBeGreaterThanOrEqual(BRACKET_LAYOUT.minNodeGap);
  });

  it('separates upper and lower bracket halves', () => {
    const layout = computeBracketLayout();
    const lastUpper = layout.nodes.get(82)!;
    const firstLower = layout.nodes.get(74)!;
    const gap = firstLower.top - (lastUpper.top + lastUpper.height);

    expect(gap).toBeGreaterThanOrEqual(BRACKET_LAYOUT.halfGap - 4);
  });
});
