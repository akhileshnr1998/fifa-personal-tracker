import { isIosDevice, isStandalonePwa } from './push';
import styles from './settings.module.css';

export function IosInstallHint() {
  if (!isIosDevice() || isStandalonePwa()) {
    return null;
  }

  return (
    <aside className={styles.iosHint} role="note">
      <p className={styles.iosHintTitle}>Add to Home Screen for push alerts</p>
      <p className={styles.iosHintCopy}>
        On iPhone, tap the Share icon in Safari, then choose{' '}
        <strong>Add to Home Screen</strong> before enabling notifications.
      </p>
    </aside>
  );
}
