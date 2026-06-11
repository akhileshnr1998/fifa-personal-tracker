import { Link } from 'react-router-dom';
import { useFixturesRefresh } from './FixturesRefreshContext';
import { getCurrentPhase } from './register-widgets';
import styles from './shell.module.css';

export function Header() {
  const showSettings = getCurrentPhase() >= 7;
  const { requestRefresh, isRefreshing } = useFixturesRefresh();

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
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.iconButton} ${isRefreshing ? styles.iconButtonSpinning : ''}`}
            onClick={() => void requestRefresh()}
            disabled={isRefreshing}
            aria-label={isRefreshing ? 'Refreshing fixtures' : 'Refresh fixtures and scores'}
            title="Refresh fixtures and scores"
          >
            🔄
          </button>
          {showSettings ? (
            <Link
              to="/settings"
              className={styles.iconButton}
              aria-label="Settings"
              title="Notification settings"
            >
              ⚙️
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
