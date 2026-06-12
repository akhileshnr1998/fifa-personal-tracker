import { getUserId } from '../../lib/userId';
import type { UserPreferences } from './preferences';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

function buildUrl(path: string): string {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export interface TeamPickerOption {
  id: number;
  name: string;
}

export async function fetchTeamPickerOptions(): Promise<TeamPickerOption[]> {
  const response = await fetch(buildUrl('/api/teams/names'));

  if (response.status === 429) {
    throw new Error('Too many requests — please wait a moment and try again.');
  }

  if (!response.ok) {
    throw new Error('Unable to load teams');
  }

  return response.json() as Promise<TeamPickerOption[]>;
}

export async function fetchVapidPublicKey(): Promise<string> {
  const response = await fetch(buildUrl('/api/user/vapid-public-key'));
  if (!response.ok) {
    throw new Error('Unable to load push configuration');
  }

  const data = (await response.json()) as { publicKey: string };
  return data.publicKey;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function saveUserSettings(
  preferences: UserPreferences,
  subscription: PushSubscriptionPayload | null,
): Promise<void> {
  const response = await fetch(buildUrl('/api/user/settings'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify({
      userName: preferences.userName,
      teams: preferences.teams,
      pushNotificationsEnabled: preferences.pushNotificationsEnabled,
      reminderMinutesBefore: preferences.reminderMinutesBefore,
      subscription: preferences.pushNotificationsEnabled ? subscription : null,
    }),
  });

  if (response.status === 429) {
    throw new Error('Too many requests — please wait a moment and try again.');
  }

  if (!response.ok) {
    throw new Error('Unable to save settings');
  }
}
