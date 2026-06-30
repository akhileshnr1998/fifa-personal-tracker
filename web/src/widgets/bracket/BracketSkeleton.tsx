import styles from './bracket.module.css';

export function BracketSkeleton() {
  return (
    <div
      className={styles.widget}
      aria-busy="true"
      aria-label="Loading bracket"
    >
      <div className={styles.skeletonCanvas}>
        <div className={styles.skeletonContent}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={styles.skeletonColumn}>
              <div className={styles.skeletonHeader} />
              {Array.from({ length: 4 }).map((__, nodeIndex) => (
                <div key={nodeIndex} className={styles.skeletonNode} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
