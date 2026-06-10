import {
  formatReminderPushBody,
  normalizeReminderMinutes,
} from './reminder-minutes';

describe('reminder-minutes', () => {
  it('defaults invalid values to 5 minutes', () => {
    expect(normalizeReminderMinutes(undefined)).toBe(5);
    expect(normalizeReminderMinutes(99)).toBe(5);
  });

  it('accepts allowed preset values', () => {
    expect(normalizeReminderMinutes(1440)).toBe(1440);
  });

  it('formats push copy for each preset', () => {
    expect(formatReminderPushBody('Mexico', 'Argentina', 5)).toContain(
      '~5 minutes',
    );
    expect(formatReminderPushBody('Mexico', 'Argentina', 1440)).toContain(
      'about 1 day',
    );
  });
});
