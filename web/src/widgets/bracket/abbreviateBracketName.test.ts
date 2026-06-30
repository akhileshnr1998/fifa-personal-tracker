import { describe, expect, it } from 'vitest';
import { abbreviateBracketName } from './abbreviateBracketName';

describe('abbreviateBracketName', () => {
  it('shortens ESPN knockout placeholders', () => {
    expect(abbreviateBracketName('Round of 16 8 Winner')).toBe('R16 W8');
    expect(abbreviateBracketName('Round of 32 3 Winner')).toBe('R32 W3');
    expect(abbreviateBracketName('Group E Winner')).toBe('Grp E');
  });

  it('keeps real team names readable', () => {
    expect(abbreviateBracketName('Netherlands')).toBe('Netherlands');
  });
});
