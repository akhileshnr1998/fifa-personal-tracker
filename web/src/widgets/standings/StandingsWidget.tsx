import { useEffect, useMemo, useState } from 'react';
import { useFixturesRefresh } from '../../shell/FixturesRefreshContext';
import { GroupTable } from './GroupTable';
import { StandingsSkeleton } from './StandingsSkeleton';
import styles from './standings.module.css';
import { useStandings } from './useStandings';

function getFollowedTeamIds(): Set<number> {
  try {
    const raw = localStorage.getItem('wc_settings');
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { teams?: number[] };
    return new Set(parsed.teams ?? []);
  } catch {
    return new Set();
  }
}

export default function StandingsWidget() {
  const { groups, status, refresh } = useStandings();
  const { setRefreshHandler, requestRefresh, isRefreshing } = useFixturesRefresh();
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const followedTeamIds = useMemo(() => getFollowedTeamIds(), []);

  useEffect(() => {
    setRefreshHandler(refresh);
    return () => setRefreshHandler(null);
  }, [refresh, setRefreshHandler]);

  // default to first group once data loads
  useEffect(() => {
    if (groups.length > 0 && activeGroupId === null) {
      setActiveGroupId(groups[0].group_id);
    }
  }, [groups, activeGroupId]);

  if (status === 'loading') return <StandingsSkeleton />;

  if (status === 'empty' || status === 'error') {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>Standings not available yet</p>
        <p className={styles.emptyCopy}>
          Group stage data will appear once the tournament begins.
        </p>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void requestRefresh()}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing…' : '🔄 Refresh'}
        </button>
      </div>
    );
  }

  const activeGroup = groups.find((g) => g.group_id === activeGroupId) ?? groups[0];

  return (
    <section className={styles.widget}>
      {/* Group A–L tab bar */}
      <div className={styles.groupTabs} role="tablist" aria-label="Select group">
        {groups.map((g) => (
          <button
            key={g.group_id}
            type="button"
            role="tab"
            aria-selected={g.group_id === activeGroup.group_id}
            className={`${styles.groupTab} ${
              g.group_id === activeGroup.group_id ? styles.groupTabActive : ''
            }`}
            onClick={() => setActiveGroupId(g.group_id)}
          >
            {g.group_abbreviation}
          </button>
        ))}
      </div>

      {/* Active group table */}
      <GroupTable group={activeGroup} followedTeamIds={followedTeamIds} />
    </section>
  );
}
