import { isPlaceholderTeam } from './is-placeholder-team';

describe('isPlaceholderTeam', () => {
  it.each(['1A', '2B', 'W74', 'L101', 'TBD', '3A/B/C/D/F', '3C/E/F/H/I'])(
    'treats %s as a placeholder',
    (name) => {
      expect(isPlaceholderTeam(name)).toBe(true);
    },
  );

  it.each(['Mexico', 'Argentina', 'USA', 'Bosnia & Herzegovina'])(
    'treats %s as a real team',
    (name) => {
      expect(isPlaceholderTeam(name)).toBe(false);
    },
  );
});
