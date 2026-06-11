import styles from './fixtures.module.css';

interface FixturesEmptyStateProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FixturesEmptyState({
  onRefresh,
  isRefreshing,
}: FixturesEmptyStateProps) {
  return (
    <section className={styles.emptyState}>
      <div className={styles.emptyEmojiWrap} aria-hidden="true">
        🏆
      </div>
      <h2 className={styles.emptyTitle}>The wait is almost over</h2>
      <p className={styles.emptyCopy}>
        FIFA World Cup 2026 schedules aren&apos;t ready yet — but the world&apos;s
        greatest tournament is coming. Tap refresh to load fixtures and scores.
      </p>
      <button
        type="button"
        className={styles.refreshButton}
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? 'Loading fixtures…' : '🔄 Refresh Fixtures'}
      </button>
    </section>
  );
}
