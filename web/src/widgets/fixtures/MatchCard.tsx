import { TeamWithFlag } from './TeamWithFlag';
import { formatKickoffTime } from './groupByDay';
import { formatStageLabel } from './stageLabels';
import styles from './fixtures.module.css';
import type { Fixture } from './types';

interface MatchCardProps {
  fixture: Fixture;
  followedTeams?: number[];
  id?: string;
}

function isFollowedMatch(
  fixture: Fixture,
  followedTeamIds: number[],
): boolean {
  return (
    followedTeamIds.includes(fixture.home_team.id) ||
    followedTeamIds.includes(fixture.away_team.id)
  );
}

function formatScore(fixture: Fixture): string | null {
  if (fixture.status !== 'finished') {
    return null;
  }

  if (fixture.home_score === null || fixture.away_score === null) {
    return null;
  }

  return `${fixture.home_score} – ${fixture.away_score}`;
}

export function MatchCard({ fixture, followedTeams = [], id }: MatchCardProps) {
  const isFollowed = isFollowedMatch(fixture, followedTeams);
  const scoreLine = formatScore(fixture);

  return (
    <article
      id={id}
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
        <TeamWithFlag name={fixture.home_team.name} align="left" />
        {scoreLine ? (
          <span className={styles.scoreBadge} aria-label={`Final score ${scoreLine}`}>
            {scoreLine}
          </span>
        ) : (
          <span className={styles.vsBadge} aria-label="versus">
            ⚽
          </span>
        )}
        <TeamWithFlag name={fixture.away_team.name} align="right" />
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.stageBadge}>
          {formatStageLabel(fixture.stage_id)}
        </span>
        <span className={styles.venue}>
          <span className={styles.venueIcon} aria-hidden="true">
            📍
          </span>
          {fixture.venue.name}
        </span>
      </div>
    </article>
  );
}
