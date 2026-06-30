import { mapDecidedBy } from './decided-by';

describe('mapDecidedBy', () => {
  it('returns regulation for STATUS_FULL_TIME', () => {
    expect(mapDecidedBy('STATUS_FULL_TIME', 'FT')).toBe('regulation');
  });
  it('returns extra_time for STATUS_AFTER_EXTRA_TIME', () => {
    expect(mapDecidedBy('STATUS_AFTER_EXTRA_TIME', 'AET')).toBe('extra_time');
  });
  it('returns penalties for STATUS_FINAL_PEN', () => {
    expect(mapDecidedBy('STATUS_FINAL_PEN', 'FT-Pens')).toBe('penalties');
  });
  it('returns penalties for STATUS_AFTER_SHOOTOUT', () => {
    expect(mapDecidedBy('STATUS_AFTER_SHOOTOUT', 'Pens')).toBe('penalties');
  });
  it('defaults to regulation for unknown status', () => {
    expect(mapDecidedBy(undefined, undefined)).toBe('regulation');
  });
});
