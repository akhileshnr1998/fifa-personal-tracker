import styles from './hub.module.css';

export function HubSkeleton() {
  return (
    <div className={styles.widget} aria-busy="true" aria-label="Loading tournament hub">
      <div className={styles.skeletonHero} />
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className={styles.skeletonSection}>
          <div className={styles.skeletonSectionTitle} />
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      ))}
    </div>
  );
}
