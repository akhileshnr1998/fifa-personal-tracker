import { useEffect } from 'react';
import { useFixturesRefresh } from '../../shell/FixturesRefreshContext';
import { DayWiseFixturesList } from './DayWiseFixturesList';
import { FixturesEmptyState } from './FixturesEmptyState';
import { FixturesSkeleton } from './FixturesSkeleton';
import styles from './fixtures.module.css';
import { useFixtures } from './useFixtures';

export default function FixturesWidget() {
  const { fixtures, status, refresh } = useFixtures();
  const { requestRefresh, isRefreshing, setRefreshHandler } = useFixturesRefresh();

  useEffect(() => {
    setRefreshHandler(refresh);
    return () => setRefreshHandler(null);
  }, [refresh, setRefreshHandler]);

  if (status === 'loading') {
    return <FixturesSkeleton />;
  }

  if (status === 'empty' || status === 'error') {
    return (
      <FixturesEmptyState
        onRefresh={requestRefresh}
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
