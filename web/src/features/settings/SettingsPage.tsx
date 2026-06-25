import { Link } from 'react-router-dom';
import { IosInstallHint } from './IosInstallHint';
import { useSettingsForm } from './hooks/useSettingsForm';
import { useTeamOptions } from './hooks/useTeamOptions';
import { PushNotificationsSection } from './PushNotificationsSection';
import styles from './settings.module.css';
import { TeamSelectorSection } from './TeamSelectorSection';

export function SettingsPage() {
  const { teamOptions, loadingTeams, teamLoadError } = useTeamOptions();
  const {
    userName,
    setUserName,
    teams,
    addTeam,
    removeTeam,
    pushEnabled,
    setPushEnabled,
    reminderMinutes,
    setReminderMinutes,
    saving,
    toast,
    error,
    handleSubmit,
  } = useSettingsForm();

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

      <form id="settings-form" className={styles.form} onSubmit={handleSubmit}>
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

        <TeamSelectorSection
          selectedTeamIds={teams}
          teamOptions={teamOptions}
          loadingTeams={loadingTeams}
          onAdd={addTeam}
          onRemove={removeTeam}
        />

        <PushNotificationsSection
          pushEnabled={pushEnabled}
          reminderMinutes={reminderMinutes}
          onToggle={setPushEnabled}
          onReminderChange={setReminderMinutes}
        />

        {(teamLoadError || error || toast) && (
          <div className={styles.formMessages}>
            {teamLoadError ? <p className={styles.errorText}>{teamLoadError}</p> : null}
            {error ? <p className={styles.errorText}>{error}</p> : null}
            {toast ? <p className={styles.toastText}>{toast}</p> : null}
          </div>
        )}
      </form>

      <div className={styles.footer}>
        <button
          type="submit"
          form="settings-form"
          className={styles.saveButton}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}
