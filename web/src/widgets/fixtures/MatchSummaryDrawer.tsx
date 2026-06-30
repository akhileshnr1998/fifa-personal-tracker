import { useCallback, useEffect, useMemo, useState } from 'react';
import { groupMatchEventsForDisplay, splitShootoutByTeam } from './matchEventTimeline';
import {
  eventIcon,
  eventLabel,
  formatMinute,
  isShootoutEvent,
  statBarWidths,
} from './matchSummaryHelpers';
import { formatFixtureScore } from './formatFixtureScore';
import { TeamWithFlag } from './TeamWithFlag';
import styles from './fixtures.module.css';
import type { Fixture, MatchEvent, MatchStat, MatchSummaryResult } from './types';
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

function EventRow({
  event,
  awayTeamId,
  showMinute,
}: {
  event: MatchEvent;
  awayTeamId: number;
  showMinute: boolean;
}) {
  const isAway = event.team_id === awayTeamId;
  const metaParts: string[] = [];
  if (isShootoutEvent(event.type)) {
    metaParts.push(eventLabel(event.type));
  } else {
    if (event.type !== 'goal' && event.type !== 'penalty_goal') {
      metaParts.push(eventLabel(event.type));
    }
    if (event.assist_name) {
      metaParts.push(`assist: ${event.assist_name}`);
    }
    if (event.type === 'own_goal') {
      metaParts.push('OG');
    }
  }

  return (
    <div
      className={`${styles.eventRow} ${isAway ? styles.eventRowAway : ''}`}
    >
      {showMinute && (
        <span className={styles.eventMinute}>
          {formatMinute(event.minute, event.is_extra_time)}
        </span>
      )}
      <span className={styles.eventIcon} aria-hidden="true">
        {eventIcon(event.type)}
      </span>
      <div className={styles.eventDetail}>
        <div className={styles.eventPlayer}>{event.player_name ?? '—'}</div>
        {metaParts.length > 0 && (
          <div className={styles.eventMeta}>{metaParts.join(' · ')}</div>
        )}
      </div>
    </div>
  );
}

function ShootoutCell({
  event,
  align,
}: {
  event: MatchEvent;
  align: 'left' | 'right';
}) {
  return (
    <div
      className={
        align === 'right' ? styles.shootoutCellAway : styles.shootoutCell
      }
    >
      <span className={styles.eventIcon} aria-hidden="true">
        {eventIcon(event.type)}
      </span>
      <div className={styles.eventDetail}>
        <div className={styles.eventPlayer}>{event.player_name ?? '—'}</div>
        <div className={styles.eventMeta}>{eventLabel(event.type)}</div>
      </div>
    </div>
  );
}

function ShootoutGrid({
  events,
  homeTeamId,
  awayTeamId,
}: {
  events: MatchEvent[];
  homeTeamId: number;
  awayTeamId: number;
}) {
  const { home, away } = splitShootoutByTeam(events, homeTeamId, awayTeamId);

  return (
    <div className={styles.shootoutGrid}>
      <div className={styles.shootoutColumn}>
        {home.map((event, i) => (
          <ShootoutCell
            key={`home-${event.type}-${i}`}
            event={event}
            align="left"
          />
        ))}
      </div>
      <div className={styles.shootoutColumnAway}>
        {away.map((event, i) => (
          <ShootoutCell
            key={`away-${event.type}-${i}`}
            event={event}
            align="right"
          />
        ))}
      </div>
    </div>
  );
}

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

  const score = formatFixtureScore(fixture);

  const homeStat =
    summary?.available
      ? (summary.stats.find((s) => s.team_id === fixture.home_team.id) ?? null)
      : null;
  const awayStat =
    summary?.available
      ? (summary.stats.find((s) => s.team_id === fixture.away_team.id) ?? null)
      : null;

  const hasStats = homeStat !== null || awayStat !== null;
  const eventSections = useMemo(
    () =>
      summary?.available
        ? groupMatchEventsForDisplay(summary.events, fixture.decided_by)
        : [],
    [summary, fixture.decided_by],
  );
  const hasEvents = eventSections.length > 0;

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
            <TeamWithFlag name={fixture.home_team.name} align="left" />
            <span className={styles.drawerScore}>
              {score ?? '— —'}
            </span>
            <TeamWithFlag name={fixture.away_team.name} align="right" />
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

        {/* Events timeline — newest period first, latest event first within each */}
        {status === 'ready' && hasEvents && summary?.available && (
          <>
            {eventSections.map((section) => (
              <div key={section.id} className={styles.drawerSection}>
                <p className={styles.drawerSectionTitle}>{section.title}</p>
                {section.id === 'shootout' ? (
                  <ShootoutGrid
                    events={section.events}
                    homeTeamId={fixture.home_team.id}
                    awayTeamId={fixture.away_team.id}
                  />
                ) : (
                  <div className={styles.eventList}>
                    {section.events.map((event, i) => (
                      <EventRow
                        key={`${section.id}-${event.type}-${event.minute ?? 'null'}-${i}`}
                        event={event}
                        awayTeamId={fixture.away_team.id}
                        showMinute
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
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
        <div className={styles.drawerSafeArea} />
      </div>
    </>
  );
}
