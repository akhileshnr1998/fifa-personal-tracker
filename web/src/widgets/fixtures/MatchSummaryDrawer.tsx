import { useCallback, useEffect, useState } from 'react';
import {
  eventIcon,
  eventLabel,
  formatMinute,
  statBarWidths,
} from './matchSummaryHelpers';
import styles from './fixtures.module.css';
import type { Fixture, MatchStat, MatchSummaryResult } from './types';
import type { SummaryStatus } from './useMatchSummary';

interface MatchSummaryDrawerProps {
  fixture: Fixture;
  summary: MatchSummaryResult | null;
  status: SummaryStatus;
  onClose: () => void;
}

interface StatRowDef {
  key: keyof MatchStat;
  label: string;
}

const STAT_ROWS: StatRowDef[] = [
  { key: 'possession_pct', label: 'Possession %' },
  { key: 'shots', label: 'Shots' },
  { key: 'shots_on_target', label: 'On Target' },
  { key: 'corners', label: 'Corners' },
  { key: 'fouls', label: 'Fouls' },
  { key: 'yellow_cards', label: 'Yellows' },
  { key: 'red_cards', label: 'Reds' },
  { key: 'offsides', label: 'Offsides' },
  { key: 'saves', label: 'Saves' },
];

export function MatchSummaryDrawer({
  fixture,
  summary,
  status,
  onClose,
}: MatchSummaryDrawerProps) {
  const [closing, setClosing] = useState(false);

  const beginClose = useCallback(() => {
    setClosing(true);
  }, []);

  // Close on Escape + lock body scroll while open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') beginClose();
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [beginClose]);

  const score =
    fixture.home_score !== null && fixture.away_score !== null
      ? `${fixture.home_score} – ${fixture.away_score}`
      : null;

  const homeStat =
    summary?.available
      ? (summary.stats.find((s) => s.team_id === fixture.home_team.id) ?? null)
      : null;
  const awayStat =
    summary?.available
      ? (summary.stats.find((s) => s.team_id === fixture.away_team.id) ?? null)
      : null;

  const hasStats = homeStat !== null || awayStat !== null;
  const hasEvents = summary?.available && summary.events.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.drawerBackdrop} ${closing ? styles.drawerBackdropClosing : ''}`}
        onClick={beginClose}
        aria-hidden="true"
      />

      {/* Slide-up panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Match summary: ${fixture.home_team.name} vs ${fixture.away_team.name}`}
        className={`${styles.drawerPanel} ${closing ? styles.drawerPanelClosing : ''}`}
        onAnimationEnd={closing ? onClose : undefined}
      >
        {/* Drag handle */}
        <div className={styles.drawerHandle} aria-hidden="true">
          <div className={styles.drawerHandleBar} />
        </div>

        {/* Header — teams + final score */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTeamRow}>
            <span className={styles.drawerTeamName}>
              {fixture.home_team.name}
            </span>
            <span className={styles.drawerScore}>
              {score ?? '— —'}
            </span>
            <span className={`${styles.drawerTeamName} ${styles.drawerTeamNameAway}`}>
              {fixture.away_team.name}
            </span>
          </div>
        </div>

        {/* Loading skeleton */}
        {status === 'loading' && (
          <div className={styles.drawerLoadingWrap}>
            {[80, 60, 90, 50, 75].map((w) => (
              <div
                key={w}
                className={styles.drawerSkeletonLine}
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className={styles.drawerErrorWrap}>
            ⚠️ Could not load match summary. Please try again.
          </div>
        )}

        {/* Summary not available (match not finished on ESPN side) */}
        {status === 'ready' && summary && !summary.available && (
          <div className={styles.drawerUnavailableWrap}>
            <div className={styles.drawerUnavailableIcon}>📋</div>
            <p className={styles.drawerUnavailableText}>
              Detailed stats aren't available for this match yet.
            </p>
          </div>
        )}

        {/* Events timeline */}
        {status === 'ready' && hasEvents && summary?.available && (
          <div className={styles.drawerSection}>
            <p className={styles.drawerSectionTitle}>Match Events</p>
            <div className={styles.eventList}>
              {summary.events.map((event, i) => {
                const isAway = event.team_id === fixture.away_team.id;
                const metaParts: string[] = [];
                if (event.type !== 'goal' && event.type !== 'penalty_goal') {
                  metaParts.push(eventLabel(event.type));
                }
                if (event.assist_name) {
                  metaParts.push(`assist: ${event.assist_name}`);
                }
                if (event.type === 'own_goal') {
                  metaParts.push('OG');
                }

                return (
                  <div
                    key={i}
                    className={`${styles.eventRow} ${isAway ? styles.eventRowAway : ''}`}
                  >
                    <span className={styles.eventMinute}>
                      {formatMinute(event.minute, event.is_extra_time)}
                    </span>
                    <span className={styles.eventIcon} aria-hidden="true">
                      {eventIcon(event.type)}
                    </span>
                    <div className={styles.eventDetail}>
                      <div className={styles.eventPlayer}>
                        {event.player_name ?? '—'}
                      </div>
                      {metaParts.length > 0 && (
                        <div className={styles.eventMeta}>
                          {metaParts.join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats comparison */}
        {status === 'ready' && hasStats && (
          <div className={styles.drawerSection}>
            <p className={styles.drawerSectionTitle}>Team Stats</p>
            <div className={styles.statList}>
              {STAT_ROWS.map(({ key, label }) => {
                const homeVal = homeStat ? (homeStat[key] as number | null) : null;
                const awayVal = awayStat ? (awayStat[key] as number | null) : null;

                // Skip row when both sides have no data
                if (homeVal === null && awayVal === null) return null;

                const { homePct, awayPct } = statBarWidths(homeVal, awayVal);

                return (
                  <div key={key} className={styles.statRow}>
                    <span className={styles.statLabel}>{label}</span>
                    <div className={styles.statBarWrap}>
                      <span className={`${styles.statValue} ${styles.statValueHome}`}>
                        {homeVal ?? '—'}
                      </span>
                      <div className={styles.statBarTrack}>
                        <div
                          className={styles.statBarHome}
                          style={{ width: `${homePct}%` }}
                        />
                        <div
                          className={styles.statBarAway}
                          style={{ width: `${awayPct}%` }}
                        />
                      </div>
                      <span className={`${styles.statValue} ${styles.statValueAway}`}>
                        {awayVal ?? '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom safe-area padding for notched phones */}
        <div style={{ height: 'env(safe-area-inset-bottom, 1.5rem)' }} />
      </div>
    </>
  );
}
