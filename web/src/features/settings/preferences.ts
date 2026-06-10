import {
  DEFAULT_REMINDER_MINUTES,
  normalizeReminderMinutes,
  type ReminderMinutes,
} from './reminderMinutes';

export interface UserPreferences {
  userName: string;
  teams: string[];
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

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) {
      return { ...defaultPreferences };
    }

    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      userName: parsed.userName ?? '',
      teams: Array.isArray(parsed.teams) ? parsed.teams : [],
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

export function getFollowedTeams(): string[] {
  return loadPreferences().teams;
}
