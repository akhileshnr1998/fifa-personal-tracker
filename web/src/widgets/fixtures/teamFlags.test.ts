import { describe, expect, it } from 'vitest';
import {
  getFlagUrl,
  getTeamIsoCode,
  isPlaceholderTeam,
} from './teamFlags';

describe('teamFlags', () => {
  it('maps known teams to ISO codes', () => {
    expect(getTeamIsoCode('Mexico')).toBe('mx');
    expect(getTeamIsoCode('United States')).toBe('us');
    expect(getTeamIsoCode('England')).toBe('gb-eng');
    expect(getTeamIsoCode('Scotland')).toBe('gb-sct');
    expect(getTeamIsoCode('Bosnia & Herzegovina')).toBe('ba');
    expect(getTeamIsoCode('Austria')).toBe('at');
    expect(getTeamIsoCode('Jordan')).toBe('jo');
    expect(getTeamIsoCode('Curaçao')).toBe('cw');
    expect(getTeamIsoCode('Türkiye')).toBe('tr');
  });

  it('treats knockout placeholders as non-flag teams', () => {
    expect(isPlaceholderTeam('2A')).toBe(true);
    expect(isPlaceholderTeam('W74')).toBe(true);
    expect(isPlaceholderTeam('L101')).toBe(true);
    expect(isPlaceholderTeam('3A/B/C/D/F')).toBe(true);
    expect(isPlaceholderTeam('Group E Winner')).toBe(true);
    expect(isPlaceholderTeam('TBD')).toBe(true);
    expect(getTeamIsoCode('W74')).toBeNull();
    expect(getTeamIsoCode('Bosnia-Herzegovina')).toBe('ba');
  });

  it('builds flagcdn URLs', () => {
    expect(getFlagUrl('mx')).toBe('https://flagcdn.com/w40/mx.png');
  });
});
