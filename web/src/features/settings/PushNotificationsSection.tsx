import { REMINDER_PRESETS, type ReminderMinutes } from './reminderMinutes';
import styles from './settings.module.css';

interface Props {
  pushEnabled: boolean;
  reminderMinutes: ReminderMinutes;
  onToggle: (enabled: boolean) => void;
  onReminderChange: (minutes: ReminderMinutes) => void;
}

export function PushNotificationsSection({
  pushEnabled,
  reminderMinutes,
  onToggle,
  onReminderChange,
}: Props) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Push Notifications</h3>

      <label className={styles.toggleRow}>
        <span>Enable push alerts on this device</span>
        <input
          type="checkbox"
          checked={pushEnabled}
          onChange={(event) => onToggle(event.target.checked)}
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
              onReminderChange(Number(event.target.value) as ReminderMinutes)
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
  );
}
