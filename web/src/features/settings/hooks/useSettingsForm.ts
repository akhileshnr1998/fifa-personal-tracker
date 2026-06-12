import { FormEvent, useMemo, useState } from 'react';
import { saveUserSettings } from '../api';
import { loadPreferences, savePreferences } from '../preferences';
import { subscribeToPush } from '../push';
import { normalizeReminderMinutes, type ReminderMinutes } from '../reminderMinutes';

interface UseSettingsFormResult {
  userName: string;
  setUserName: (name: string) => void;
  teams: number[];
  addTeam: (teamId: number) => void;
  removeTeam: (teamId: number) => void;
  pushEnabled: boolean;
  setPushEnabled: (enabled: boolean) => void;
  reminderMinutes: ReminderMinutes;
  setReminderMinutes: (minutes: ReminderMinutes) => void;
  saving: boolean;
  toast: string | null;
  error: string | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function useSettingsForm(): UseSettingsFormResult {
  const stored = useMemo(() => loadPreferences(), []);

  const [userName, setUserName] = useState(stored.userName);
  const [teams, setTeams] = useState<number[]>(stored.teams);
  const [pushEnabled, setPushEnabled] = useState(stored.pushNotificationsEnabled);
  const [reminderMinutes, setReminderMinutes] = useState<ReminderMinutes>(
    stored.reminderMinutesBefore,
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function addTeam(teamId: number) {
    setTeams((current) =>
      current.includes(teamId) ? current : [...current, teamId],
    );
  }

  function removeTeam(teamId: number) {
    setTeams((current) => current.filter((id) => id !== teamId));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setToast(null);

    const trimmedName = userName.trim();
    if (!trimmedName) {
      setError('Please enter your name before saving.');
      return;
    }

    setSaving(true);

    try {
      let subscription = null;
      if (pushEnabled) {
        subscription = await subscribeToPush();
      }

      const preferences = {
        userName: trimmedName,
        teams,
        pushNotificationsEnabled: pushEnabled,
        reminderMinutesBefore: reminderMinutes,
      };

      await saveUserSettings(preferences, subscription);
      savePreferences(preferences);
      setToast('Notification preferences saved.');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save settings.',
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    userName,
    setUserName,
    teams,
    addTeam,
    removeTeam,
    pushEnabled,
    setPushEnabled,
    reminderMinutes,
    setReminderMinutes: (m) => setReminderMinutes(normalizeReminderMinutes(m)),
    saving,
    toast,
    error,
    handleSubmit,
  };
}
