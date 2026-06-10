import { TeamWithFlag } from './TeamWithFlag';
import { formatKickoffTime } from './groupByDay';
import styles from './fixtures.module.css';
import type { Fixture } from './types';

interface MatchCardProps {
  fixture: Fixture;
  followedTeams?: string[];
}

function isFollowedMatch(
  fixture: Fixture,
  followedTeams: string[],
): boolean {
  return (
    followedTeams.includes(fixture.home_team) ||
    followedTeams.includes(fixture.away_team)
  );
}

export function MatchCard({ fixture, followedTeams = [] }: MatchCardProps) {
  const isFollowed = isFollowedMatch(fixture, followedTeams);

  return (
    <article
      className={`${styles.matchCard} ${isFollowed ? styles.matchCardFollowed : ''}`}
    >
      <div className={styles.matchMeta}>
        <span className={styles.matchNumber}>
          Match {fixture.match_number ?? '—'}
        </span>
        <span className={styles.kickoffPill}>
          <span className={styles.kickoffIcon} aria-hidden="true">
            ⏱
          </span>
          {formatKickoffTime(fixture.match_date_time)}
        </span>
      </div>
      <div className={styles.teams}>
        <TeamWithFlag name={fixture.home_team} align="left" />
        <span className={styles.vsBadge} aria-label="versus">
          ⚽
        </span>
        <TeamWithFlag name={fixture.away_team} align="right" />
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.stageBadge}>Stage {fixture.stage_id}</span>
        <span className={styles.venue}>
          <span className={styles.venueIcon} aria-hidden="true">
            📍
          </span>
          {fixture.venue}
        </span>
      </div>
    </article>
  );
}
