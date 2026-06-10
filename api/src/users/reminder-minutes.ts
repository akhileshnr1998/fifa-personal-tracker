export const DEFAULT_REMINDER_MINUTES = 5;

export const ALLOWED_REMINDER_MINUTES = [5, 15, 60, 180, 1440] as const;

export type ReminderMinutes = (typeof ALLOWED_REMINDER_MINUTES)[number];

export const CRON_SLACK_MINUTES = 12;

export function normalizeReminderMinutes(
  value: number | undefined | null,
): ReminderMinutes {
  if (
    typeof value === 'number' &&
    ALLOWED_REMINDER_MINUTES.includes(value as ReminderMinutes)
  ) {
    return value as ReminderMinutes;
  }

  return DEFAULT_REMINDER_MINUTES;
}

export function formatReminderLeadLabel(minutes: ReminderMinutes): string {
  switch (minutes) {
    case 5:
      return '5 minutes before';
    case 15:
      return '15 minutes before';
    case 60:
      return '1 hour before';
    case 180:
      return '3 hours before';
    case 1440:
      return '1 day before';
    default:
      return '5 minutes before';
  }
}

export function formatReminderPushBody(
  homeTeam: string,
  awayTeam: string,
  minutes: ReminderMinutes,
): string {
  const matchup = `${homeTeam} vs ${awayTeam}`;

  switch (minutes) {
    case 5:
      return `${matchup} kicks off in ~5 minutes.`;
    case 15:
      return `${matchup} kicks off in ~15 minutes.`;
    case 60:
      return `${matchup} kicks off in about 1 hour.`;
    case 180:
      return `${matchup} kicks off in about 3 hours.`;
    case 1440:
      return `${matchup} kicks off in about 1 day.`;
    default:
      return `${matchup} kicks off soon.`;
  }
}
