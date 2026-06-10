import styles from './fixtures.module.css';

export function FixturesSkeleton() {
  return (
    <div className={styles.widget} aria-busy="true" aria-label="Loading fixtures">
      <div className={styles.skeletonHero} />
      <div className={styles.skeletonList}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={styles.skeletonCard}>
            <div className={styles.skeletonLineShort} />
            <div className={styles.skeletonLineLong} />
            <div className={styles.skeletonLineMedium} />
          </div>
        ))}
      </div>
    </div>
  );
}
