import {
  DEFAULT_REMINDER_MINUTES,
  normalizeReminderMinutes,
  type ReminderMinutes,
} from './reminderMinutes';

export interface UserPreferences {
  userName: string;
  teams: number[];
  pushNotificationsEnabled: boolean;
  reminderMinutesBefore: ReminderMinutes;
}

const PREFERENCES_KEY = 'wc2026_preferences';

const defaultPreferences: UserPreferences = {
  userName: '',
  teams: [],
  pushNotificationsEnabled: false,
  reminderMinutesBefore: DEFAULT_REMINDER_MINUTES,
};

function normalizeStoredTeams(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry));
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) {
      return { ...defaultPreferences };
    }

    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      userName: parsed.userName ?? '',
      teams: normalizeStoredTeams(parsed.teams),
      pushNotificationsEnabled: Boolean(parsed.pushNotificationsEnabled),
      reminderMinutesBefore: normalizeReminderMinutes(
        parsed.reminderMinutesBefore,
      ),
    };
  } catch {
    return { ...defaultPreferences };
  }
}

export function savePreferences(preferences: UserPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export function getFollowedTeamIds(): number[] {
  return loadPreferences().teams;
}
