import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTeamNames, saveUserSettings } from './api';
import { IosInstallHint } from './IosInstallHint';
import { loadPreferences, savePreferences } from './preferences';
import { subscribeToPush } from './push';
import {
  normalizeReminderMinutes,
  REMINDER_PRESETS,
} from './reminderMinutes';
import styles from './settings.module.css';

export function SettingsPage() {
  const stored = useMemo(() => loadPreferences(), []);
  const [userName, setUserName] = useState(stored.userName);
  const [teams, setTeams] = useState<string[]>(stored.teams);
  const [pushEnabled, setPushEnabled] = useState(stored.pushNotificationsEnabled);
  const [reminderMinutes, setReminderMinutes] = useState(
    stored.reminderMinutesBefore,
  );
  const [teamOptions, setTeamOptions] = useState<string[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchTeamNames()
      .then((names) => {
        if (!cancelled) {
          setTeamOptions(names);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load teams. Try again from the fixtures screen.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTeams(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const availableTeams = teamOptions.filter((name) => !teams.includes(name));

  function addTeam(teamName: string) {
    setTeams((current) =>
      current.includes(teamName) ? current : [...current, teamName],
    );
  }

  function removeTeam(teamName: string) {
    setTeams((current) => current.filter((name) => name !== teamName));
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
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save settings.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Link to="/" className={styles.backLink}>
          ← Fixtures
        </Link>
        <h2 className={styles.pageTitle}>Notification Settings</h2>
        <p className={styles.pageSubtitle}>
          Follow teams and get a push alert before they kick off.
        </p>
      </div>

      <IosInstallHint />

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Profile</h3>
          <label className={styles.fieldLabel} htmlFor="userName">
            Name
          </label>
          <input
            id="userName"
            className={styles.textInput}
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            placeholder="Your name"
            autoComplete="name"
            required
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Teams You Follow</h3>
          <p className={styles.helperText}>
            You&apos;ll be notified before these teams kick off.
          </p>
          {teams.length > 0 ? (
            <ul className={styles.selectedTeams} aria-label="Teams you follow">
              {teams.map((teamName) => (
                <li key={teamName} className={styles.selectedTeamChip}>
                  <span>{teamName}</span>
                  <button
                    type="button"
                    className={styles.removeTeamButton}
                    onClick={() => removeTeam(teamName)}
                    aria-label={`Remove ${teamName}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.mutedText}>No teams selected yet.</p>
          )}
          {loadingTeams ? (
            <p className={styles.mutedText}>Loading teams…</p>
          ) : (
            <select
              className={styles.selectInput}
              value=""
              onChange={(event) => {
                const teamName = event.target.value;
                if (teamName) {
                  addTeam(teamName);
                }
              }}
              aria-label="Add a team to follow"
            >
              <option value="" disabled>
                {availableTeams.length === 0
                  ? teams.length === teamOptions.length
                    ? 'All teams selected'
                    : 'No teams available'
                  : 'Select a team…'}
              </option>
              {availableTeams.map((teamName) => (
                <option key={teamName} value={teamName}>
                  {teamName}
                </option>
              ))}
            </select>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Push Notifications</h3>
          <label className={styles.toggleRow}>
            <span>Enable push alerts on this device</span>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(event) => setPushEnabled(event.target.checked)}
            />
          </label>
          <p className={styles.helperText}>
            We&apos;ll ask for browser permission when you save with push enabled.
          </p>

          {pushEnabled ? (
            <div className={styles.timingBlock}>
              <label className={styles.fieldLabel} htmlFor="reminderMinutes">
                When to notify
              </label>
              <select
                id="reminderMinutes"
                className={styles.selectInput}
                value={reminderMinutes}
                onChange={(event) =>
                  setReminderMinutes(
                    normalizeReminderMinutes(Number(event.target.value)),
                  )
                }
              >
                {REMINDER_PRESETS.map((preset) => (
                  <option key={preset.minutes} value={preset.minutes}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <p className={styles.helperText}>
                You&apos;ll get one alert per followed match at this time.
              </p>
            </div>
          ) : null}
        </section>

        {error ? <p className={styles.errorText}>{error}</p> : null}
        {toast ? <p className={styles.toastText}>{toast}</p> : null}

        <div className={styles.footer}>
          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
