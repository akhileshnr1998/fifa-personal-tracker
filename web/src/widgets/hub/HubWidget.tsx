import { useEffect, useMemo } from 'react';
import { getFollowedTeamIds } from '../../features/settings/preferences';
import { useFixturesRefresh } from '../../shell/FixturesRefreshContext';
import shared from '../../shared/emptyState.module.css';
import { HubSkeleton } from './HubSkeleton';
import { TeamsQuickLinksSection } from './sections/TeamsQuickLinksSection';
import { TopScorersSection } from './sections/TopScorersSection';
import styles from './hub.module.css';
import { useHub } from './useHub';

export default function HubWidget() {
  const { hub, status, refresh } = useHub();
  const { setRefreshHandler, requestRefresh, isRefreshing } = useFixturesRefresh();
  const followedTeamIds = useMemo(() => getFollowedTeamIds(), []);

  useEffect(() => {
    setRefreshHandler(refresh);
    return () => setRefreshHandler(null);
  }, [refresh, setRefreshHandler]);

  if (status === 'loading') {
    return <HubSkeleton />;
  }

  if (status === 'error' || !hub) {
    return (
      <section className={styles.widget}>
        <div className={shared.emptyState}>
          <p className={shared.emptyTitle}>Hub unavailable</p>
          <p className={shared.emptyCopy}>
            Tournament hub data is not ready yet. Try a manual refresh below.
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
      <div className={styles.heroStrip}>
        <span className={styles.heroIcon} aria-hidden="true">
          🏆
        </span>
        <span>FIFA World Cup 2026 — tournament hub</span>
      </div>

      {status === 'stale' && (
        <p className={styles.staleNotice} role="status" aria-live="polite">
          Syncing latest hub data…
        </p>
      )}

      <TopScorersSection
        available={hub.top_scorers.available}
        entries={hub.top_scorers.entries}
      />

      <TeamsQuickLinksSection
        teams={hub.teams_quick_links}
        followedTeamIds={followedTeamIds}
      />
    </section>
  );
}
