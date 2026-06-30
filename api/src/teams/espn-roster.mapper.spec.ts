import { getAthleteStat, parseEspnId } from './espn-roster.mapper';
import { EspnRosterAthlete } from './espn-roster.types';

describe('espn-roster.mapper', () => {
  it('parses ESPN string ids', () => {
    expect(parseEspnId('137038')).toBe(137038);
    expect(parseEspnId(undefined)).toBeNull();
    expect(parseEspnId('abc')).toBeNull();
  });

  it('extracts tournament stats from athlete splits', () => {
    const athlete: EspnRosterAthlete = {
      statistics: {
        splits: {
          categories: [
            {
              stats: [
                { name: 'appearances', value: 2 },
                { name: 'totalGoals', value: 1 },
                { name: 'goalAssists', value: 3 },
              ],
            },
            {
              stats: [
                { name: 'yellowCards', value: 1 },
                { name: 'redCards', value: 0 },
              ],
            },
          ],
        },
      },
    };

    expect(getAthleteStat(athlete, 'appearances')).toBe(2);
    expect(getAthleteStat(athlete, 'totalGoals')).toBe(1);
    expect(getAthleteStat(athlete, 'goalAssists')).toBe(3);
    expect(getAthleteStat(athlete, 'yellowCards')).toBe(1);
    expect(getAthleteStat(athlete, 'saves')).toBe(0);
  });
});
