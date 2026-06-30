import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFixturesRefresh } from '../../shell/FixturesRefreshContext';
import shared from '../../shared/emptyState.module.css';
import { SquadView } from './SquadView';
import { TeamsSkeleton } from './TeamsSkeleton';
import styles from './teams.module.css';
import { fetchTeamSquad } from './api';
import { useSquad } from './useSquad';
import { useTeams } from './useTeams';
import {
  getFlagSrcSet,
  getFlagUrl,
  getTeamIsoCode,
} from '../fixtures/teamFlags';

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

function TeamFlag({ name }: { name: string }) {
  const isoCode = getTeamIsoCode(name);
  if (!isoCode) {
    return (
      <span className={styles.flagPlaceholder} aria-hidden="true">
        ?
      </span>
    );
  }

  return (
    <img
      className={styles.flag}
      src={getFlagUrl(isoCode)}
      srcSet={getFlagSrcSet(isoCode)}
      alt=""
      width={24}
      height={18}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function TeamsWidget() {
  const { teams, status, refresh } = useTeams();
  const { setRefreshHandler, requestRefresh, isRefreshing } = useFixturesRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const followedTeamIds = useMemo(() => getFollowedTeamIds(), []);

  const selectedTeamId = useMemo(() => {
    const raw = searchParams.get('team');
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const { squad, status: squadStatus } = useSquad(selectedTeamId);

  useEffect(() => {
    setRefreshHandler(async () => {
      await refresh();
      if (selectedTeamId !== null) {
        await fetchTeamSquad(selectedTeamId, true);
      }
    });
    return () => setRefreshHandler(null);
  }, [refresh, selectedTeamId, setRefreshHandler]);

  const filteredTeams = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return teams;
    return teams.filter((team) => {
      const haystack = `${team.name} ${team.abbreviation ?? ''}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, teams]);

  const handleSelectTeam = (teamId: number) => {
    setSearchParams({ team: String(teamId) });
  };

  const handleBack = () => {
    setSearchParams({});
  };

  if (status === 'loading' && selectedTeamId === null) {
    return <TeamsSkeleton />;
  }

  if ((status === 'empty' || status === 'error') && selectedTeamId === null) {
    return (
      <section className={styles.widget}>
        <div className={shared.emptyState}>
          <p className={shared.emptyTitle}>Teams not available yet</p>
          <p className={shared.emptyCopy}>
            National team squads will appear once tournament rosters are published.
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

  if (selectedTeamId !== null) {
    if (squadStatus === 'loading' || squadStatus === 'idle') {
      return <TeamsSkeleton />;
    }

    if (squadStatus === 'error' || !squad) {
      return (
        <section className={styles.widget}>
          <div className={shared.emptyState}>
            <p className={shared.emptyTitle}>Squad not available</p>
            <p className={shared.emptyCopy}>
              We could not load this team&apos;s roster right now.
            </p>
            <button type="button" className={shared.refreshButton} onClick={handleBack}>
              ← Back to teams
            </button>
          </div>
        </section>
      );
    }

    return (
      <SquadView
        teamName={squad.team.name}
        playerCount={squad.players.length}
        players={squad.players}
        isFollowed={followedTeamIds.has(squad.team.id)}
        onBack={handleBack}
      />
    );
  }

  return (
    <section className={styles.widget}>
      {status === 'stale' && (
        <p className={styles.staleNotice} role="status" aria-live="polite">
          Syncing latest teams…
        </p>
      )}

      <div className={styles.searchBar}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search teams"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search teams"
        />
        <p className={styles.searchMeta}>
          {filteredTeams.length} of {teams.length} teams
        </p>
      </div>

      <div className={styles.teamGrid}>
        {filteredTeams.map((team) => {
          const isFollowed = followedTeamIds.has(team.id);
          return (
            <button
              key={team.id}
              type="button"
              className={`${styles.teamCard} ${isFollowed ? styles.teamCardFollowed : ''}`}
              onClick={() => handleSelectTeam(team.id)}
            >
              <div className={styles.teamCardHeader}>
                <TeamFlag name={team.name} />
                <span className={styles.teamName}>{team.name}</span>
                {isFollowed ? <span className={styles.followBadge}>★</span> : null}
              </div>
              {team.abbreviation ? (
                <span className={styles.teamAbbr}>{team.abbreviation}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
