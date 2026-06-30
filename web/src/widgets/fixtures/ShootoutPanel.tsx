import { useState } from 'react';
import {
  buildShootoutRounds,
  shootoutDotSequence,
  splitShootoutByTeam,
} from './matchEventTimeline';
import { eventIcon } from './matchSummaryHelpers';
import { TeamWithFlag } from './TeamWithFlag';
import styles from './fixtures.module.css';
import type { MatchEvent } from './types';

const VISIBLE_ROUNDS = 3;

interface ShootoutPanelProps {
  events: MatchEvent[];
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homePensTotal: number | null;
  awayPensTotal: number | null;
}

function ShootoutDots({ dots }: { dots: ('scored' | 'missed')[] }) {
  return (
    <span className={styles.shootoutDots} aria-hidden="true">
      {dots.map((dot, i) => (
        <span
          key={i}
          className={
            dot === 'scored' ? styles.shootoutDotScored : styles.shootoutDotMissed
          }
        />
      ))}
    </span>
  );
}

function RoundKick({
  event,
  align,
}: {
  event: MatchEvent | null;
  align: 'left' | 'right';
}) {
  if (!event) {
    return (
      <span
        className={
          align === 'right' ? styles.shootoutRoundEmptyAway : styles.shootoutRoundEmpty
        }
      >
        —
      </span>
    );
  }

  return (
    <span
      className={
        align === 'right' ? styles.shootoutRoundKickAway : styles.shootoutRoundKick
      }
    >
      <span className={styles.shootoutKickIcon} aria-hidden="true">
        {eventIcon(event.type)}
      </span>
      <span className={styles.shootoutKickName}>{event.player_name ?? '—'}</span>
    </span>
  );
}

export function ShootoutPanel({
  events,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homePensTotal,
  awayPensTotal,
}: ShootoutPanelProps) {
  const [showAllRounds, setShowAllRounds] = useState(false);
  const { home, away } = splitShootoutByTeam(events, homeTeamId, awayTeamId);
  const rounds = buildShootoutRounds(events, homeTeamId, awayTeamId);
  const visibleRounds = showAllRounds ? rounds : rounds.slice(0, VISIBLE_ROUNDS);
  const hiddenCount = rounds.length - VISIBLE_ROUNDS;

  return (
    <div className={styles.shootoutPanel}>
      <div className={styles.shootoutSummaryRow}>
        <div className={styles.shootoutSummaryTeam}>
          <TeamWithFlag name={homeTeamName} align="left" />
          <ShootoutDots dots={shootoutDotSequence(home)} />
          {homePensTotal != null && (
            <span className={styles.shootoutTotal}>{homePensTotal}</span>
          )}
        </div>
        <div className={styles.shootoutSummaryTeamAway}>
          {awayPensTotal != null && (
            <span className={styles.shootoutTotal}>{awayPensTotal}</span>
          )}
          <ShootoutDots dots={shootoutDotSequence(away)} />
          <TeamWithFlag name={awayTeamName} align="right" />
        </div>
      </div>

      <div className={styles.shootoutRounds}>
        {visibleRounds.map(({ round, home: homeKick, away: awayKick }) => (
          <div key={round} className={styles.shootoutRoundRow}>
            <span className={styles.shootoutRoundLabel}>R{round}</span>
            <RoundKick event={homeKick} align="left" />
            <RoundKick event={awayKick} align="right" />
          </div>
        ))}
      </div>

      {!showAllRounds && hiddenCount > 0 && (
        <button
          type="button"
          className={styles.shootoutExpandBtn}
          onClick={() => setShowAllRounds(true)}
        >
          Show all {rounds.length} rounds
        </button>
      )}
    </div>
  );
}
