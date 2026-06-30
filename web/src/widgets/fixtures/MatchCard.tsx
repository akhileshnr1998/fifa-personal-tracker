import { TeamWithFlag } from './TeamWithFlag';
import { formatFixturePensSubline, formatFixtureScoreMeta } from './formatFixtureScore';
import { formatKickoffTime } from './groupByDay';
import { formatStageLabel } from './stageLabels';
import styles from './fixtures.module.css';
import type { Fixture } from './types';

interface MatchCardProps {
  fixture: Fixture;
  followedTeams?: number[];
  id?: string;
  onSelect?: () => void;
}

function isFollowedMatch(fixture: Fixture, followedTeamIds: number[]): boolean {
  return (
    followedTeamIds.includes(fixture.home_team.id) ||
    followedTeamIds.includes(fixture.away_team.id)
  );
}

function formatScore(fixture: Fixture): string | null {
  if (fixture.status !== 'finished') return null;
  if (fixture.home_score === null || fixture.away_score === null) return null;
  return `${fixture.home_score} – ${fixture.away_score}`;
}

export function MatchCard({ fixture, followedTeams = [], id, onSelect }: MatchCardProps) {
  const isFollowed = isFollowedMatch(fixture, followedTeams);
  const scoreLine = formatScore(fixture);
  const pensSubline = formatFixturePensSubline(fixture);
  const scoreMeta = formatFixtureScoreMeta(fixture.decided_by);
  const showMetaBadge = scoreMeta === 'AET';
  const isClickable = onSelect !== undefined;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.();
    }
  }

  return (
    <article
      id={id}
      className={[
        styles.matchCard,
        isFollowed ? styles.matchCardFollowed : '',
        isClickable ? styles.matchCardClickable : '',
      ].join(' ')}
      onClick={isClickable ? onSelect : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={
        isClickable
          ? `View match summary for ${fixture.home_team.name} vs ${fixture.away_team.name}`
          : undefined
      }
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
          <span className={styles.scoreWrap}>
            <span
              className={styles.scoreBadge}
              aria-label={`Final score ${scoreLine}${pensSubline ? `, ${pensSubline}` : ''}`}
            >
              {scoreLine}
            </span>
            {pensSubline && (
              <span className={styles.scorePensSubline}>{pensSubline}</span>
            )}
            {showMetaBadge && (
              <span className={styles.scoreMetaBadge} aria-label={scoreMeta ?? undefined}>
                {scoreMeta}
              </span>
            )}
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
        {isClickable && (
          <span className={styles.summaryHint} aria-hidden="true">
            📊
          </span>
        )}
      </div>
    </article>
  );
}
