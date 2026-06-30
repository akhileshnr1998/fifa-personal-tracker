import styles from './teams.module.css';

export function TeamsSkeleton() {
  return (
    <section className={styles.widget} aria-busy="true" aria-label="Loading teams">
      <div className={styles.skeletonLine} style={{ height: '2.75rem' }} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className={styles.skeletonCard} />
        ))}
      </div>
    </section>
  );
}
