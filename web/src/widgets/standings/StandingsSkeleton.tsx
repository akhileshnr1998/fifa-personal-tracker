import styles from './standings.module.css';

export function StandingsSkeleton() {
  return (
    <div className={styles.widget} aria-busy="true" aria-label="Loading standings">
      <div className={styles.skeletonTabs}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.skeletonTab} />
        ))}
      </div>
      <div className={styles.skeletonCard}>
        <div className={styles.skeletonCardHeader} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.skeletonRow}>
            <div className={styles.skeletonRowLine} style={{ width: '1.5rem' }} />
            <div className={styles.skeletonRowLine} style={{ width: '55%' }} />
            <div className={styles.skeletonRowLine} style={{ width: '6%' }} />
            <div className={styles.skeletonRowLine} style={{ width: '6%' }} />
            <div className={styles.skeletonRowLine} style={{ width: '6%' }} />
            <div className={styles.skeletonRowLine} style={{ width: '6%' }} />
            <div className={styles.skeletonRowLine} style={{ width: '8%' }} />
            <div className={styles.skeletonRowLine} style={{ width: '8%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
