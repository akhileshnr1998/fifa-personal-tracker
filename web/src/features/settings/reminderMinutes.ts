export const DEFAULT_REMINDER_MINUTES = 5;

export const REMINDER_PRESETS = [
  { minutes: 5, label: '5 minutes before kickoff' },
  { minutes: 15, label: '15 minutes before kickoff' },
  { minutes: 60, label: '1 hour before kickoff' },
  { minutes: 180, label: '3 hours before kickoff' },
  { minutes: 1440, label: '1 day before kickoff' },
] as const;

export type ReminderMinutes = (typeof REMINDER_PRESETS)[number]['minutes'];

const allowedMinutes = new Set<number>(
  REMINDER_PRESETS.map((preset) => preset.minutes),
);

export function normalizeReminderMinutes(
  value: number | undefined | null,
): ReminderMinutes {
  if (typeof value === 'number' && allowedMinutes.has(value)) {
    return value as ReminderMinutes;
  }

  return DEFAULT_REMINDER_MINUTES;
}
