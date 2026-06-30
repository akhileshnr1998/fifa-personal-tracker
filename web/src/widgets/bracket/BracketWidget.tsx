import { useEffect, useMemo, useState } from 'react';
import { getFollowedTeamIds } from '../../features/settings/preferences';
import { useFixturesRefresh } from '../../shell/FixturesRefreshContext';
import shared from '../../shared/emptyState.module.css';
import { MatchSummaryDrawer } from '../fixtures/MatchSummaryDrawer';
import { useMatchSummary } from '../fixtures/useMatchSummary';
import type { Fixture } from '../fixtures/types';
import { BracketCanvas } from './BracketCanvas';
import { BracketSkeleton } from './BracketSkeleton';
import styles from './bracket.module.css';
import { useBracket } from './useBracket';

export default function BracketWidget() {
  const { tree, status, refresh, knockoutStarted } = useBracket();
  const { setRefreshHandler, requestRefresh, isRefreshing } = useFixturesRefresh();
  const followedTeamIds = useMemo(() => getFollowedTeamIds(), []);
  const { summary, status: summaryStatus, load, reset } = useMatchSummary();
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);

  useEffect(() => {
    setRefreshHandler(refresh);
    return () => setRefreshHandler(null);
  }, [refresh, setRefreshHandler]);

  function openDrawer(fixture: Fixture) {
    setSelectedFixture(fixture);
    void load(fixture.id);
  }

  function closeDrawer() {
    setSelectedFixture(null);
    reset();
  }

  if (status === 'loading') {
    return <BracketSkeleton />;
  }

  if (status === 'empty' || status === 'error' || !knockoutStarted) {
    return (
      <section className={styles.widget}>
        <div className={shared.emptyState}>
          <p className={shared.emptyTitle}>Knockout bracket not ready yet</p>
          <p className={shared.emptyCopy}>
            Knockout bracket appears once Round of 32 begins.
          </p>
          <button
            type="button"
            className={shared.refreshButton}
            onClick={() => void requestRefresh()}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing…' : '🔄 Refresh'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.widget}>
      {status === 'stale' && (
        <p className={styles.staleNotice} role="status" aria-live="polite">
          Syncing latest bracket…
        </p>
      )}
      <BracketCanvas
        tree={tree}
        followedTeamIds={followedTeamIds}
        onSelect={openDrawer}
      />

      {selectedFixture && (
        <MatchSummaryDrawer
          fixture={selectedFixture}
          summary={summary}
          status={summaryStatus}
          onClose={closeDrawer}
        />
      )}
    </section>
  );
}
