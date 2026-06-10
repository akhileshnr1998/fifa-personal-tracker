import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDER_MINUTES,
  normalizeReminderMinutes,
} from './reminderMinutes';

describe('reminderMinutes', () => {
  it('defaults unknown values to 5 minutes', () => {
    expect(normalizeReminderMinutes(undefined)).toBe(DEFAULT_REMINDER_MINUTES);
    expect(normalizeReminderMinutes(42)).toBe(DEFAULT_REMINDER_MINUTES);
  });

  it('keeps allowed preset values', () => {
    expect(normalizeReminderMinutes(1440)).toBe(1440);
  });
});
