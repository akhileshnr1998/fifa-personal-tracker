import { Link } from 'react-router-dom';
import { getCurrentPhase } from './register-widgets';
import styles from './shell.module.css';

export function Header() {
  const showSettings = getCurrentPhase() >= 7;

  return (
    <header className={styles.header}>
      <div className={styles.hostStripe} aria-hidden="true" />
      <div className={styles.headerInner}>
        <div className={styles.brand}>
          <span className={styles.trophy} aria-hidden="true">
            🏆
          </span>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>FIFA World Cup 2026</h1>
            <p className={styles.hosts}>USA · CAN · MEX</p>
          </div>
        </div>
        {showSettings ? (
          <Link
            to="/settings"
            className={styles.settingsButton}
            aria-label="Settings"
          >
            ⚙️
          </Link>
        ) : null}
      </div>
    </header>
  );
}
