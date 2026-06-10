import { useState } from 'react';
import { DayWiseFixturesList } from './DayWiseFixturesList';
import { FixturesEmptyState } from './FixturesEmptyState';
import { FixturesSkeleton } from './FixturesSkeleton';
import styles from './fixtures.module.css';
import { useFixtures } from './useFixtures';

export default function FixturesWidget() {
  const { fixtures, status, refresh } = useFixtures();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (status === 'loading') {
    return <FixturesSkeleton />;
  }

  if (status === 'empty' || status === 'error') {
    return (
      <FixturesEmptyState
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  return (
    <section className={styles.widget}>
      <div className={styles.heroStrip}>
        <span className={styles.heroIcon} aria-hidden="true">
          ⚽
        </span>
        <span>Kickoff June 11, 2026 — 48 nations, one dream</span>
      </div>
      <DayWiseFixturesList fixtures={fixtures} />
    </section>
  );
}
