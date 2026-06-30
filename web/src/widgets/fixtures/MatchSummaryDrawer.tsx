import { useCallback, useEffect, useMemo, useState } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { groupMatchEventsForDisplay } from './matchEventTimeline';
import {
  eventIcon,
  eventLabel,
  formatMinute,
  statBarWidths,
} from './matchSummaryHelpers';
import { formatFixtureScoreDisplay } from './formatFixtureScore';
import { ShootoutPanel } from './ShootoutPanel';
import { TeamWithFlag } from './TeamWithFlag';
import styles from './fixtures.module.css';
import type { DecidedBy, Fixture, MatchEvent, MatchStat, MatchSummaryResult } from './types';
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

const TEASER_STAT_KEYS: (keyof MatchStat)[] = [
  'possession_pct',
  'shots',
  'shots_on_target',
];

function EventRow({
  event,
  awayTeamId,
}: {
  event: MatchEvent;
  awayTeamId: number;
}) {
  const isAway = event.team_id === awayTeamId;
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
      className={`${styles.eventRow} ${isAway ? styles.eventRowAway : ''}`}
    >
      <span className={styles.eventMinute}>
        {formatMinute(event.minute, event.is_extra_time)}
      </span>
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

function StatRows({
  rows,
  homeStat,
  awayStat,
}: {
  rows: StatRowDef[];
  homeStat: MatchStat | null;
  awayStat: MatchStat | null;
}) {
  return (
    <div className={styles.statList}>
      {rows.map(({ key, label }) => {
        const homeVal = homeStat ? (homeStat[key] as number | null) : null;
        const awayVal = awayStat ? (awayStat[key] as number | null) : null;
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
  );
}

function statsDefaultCollapsed(decidedBy: DecidedBy): boolean {
  return decidedBy !== 'regulation';
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

  const scoreDisplay = formatFixtureScoreDisplay(fixture);

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
  const statsCollapsed = statsDefaultCollapsed(fixture.decided_by);

  const teaserStatRows = STAT_ROWS.filter((r) =>
    TEASER_STAT_KEYS.includes(r.key),
  );

  return (
    <>
      <div
        className={`${styles.drawerBackdrop} ${closing ? styles.drawerBackdropClosing : ''}`}
        onClick={beginClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Match summary: ${fixture.home_team.name} vs ${fixture.away_team.name}`}
        className={`${styles.drawerPanel} ${closing ? styles.drawerPanelClosing : ''}`}
        onAnimationEnd={closing ? onClose : undefined}
      >
        <div className={styles.drawerHandle} aria-hidden="true">
          <div className={styles.drawerHandleBar} />
        </div>

        <div className={styles.drawerHeader}>
          <div className={styles.drawerTeamRow}>
            <TeamWithFlag name={fixture.home_team.name} align="left" />
            <div className={styles.drawerScoreStack}>
              <span className={styles.drawerScore}>
                {scoreDisplay.regulation ?? '— —'}
              </span>
              {scoreDisplay.pensLine && (
                <span className={styles.drawerScorePens}>{scoreDisplay.pensLine}</span>
              )}
            </div>
            <TeamWithFlag name={fixture.away_team.name} align="right" />
          </div>
          {scoreDisplay.outcome && (
            <p className={styles.drawerOutcome}>{scoreDisplay.outcome}</p>
          )}
        </div>

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

        {status === 'error' && (
          <div className={styles.drawerErrorWrap}>
            ⚠️ Could not load match summary. Please try again.
          </div>
        )}

        {status === 'ready' && summary && !summary.available && (
          <div className={styles.drawerUnavailableWrap}>
            <div className={styles.drawerUnavailableIcon}>📋</div>
            <p className={styles.drawerUnavailableText}>
              Detailed stats aren't available for this match yet.
            </p>
          </div>
        )}

        {status === 'ready' && hasEvents && summary?.available && (
          <>
            {eventSections.map((section) => {
              if (section.id === 'shootout') {
                return (
                  <div
                    key={section.id}
                    className={`${styles.drawerSection} ${styles.drawerSectionShootout}`}
                  >
                    <p className={styles.drawerSectionTitle}>{section.title}</p>
                    <ShootoutPanel
                      events={section.events}
                      homeTeamId={fixture.home_team.id}
                      awayTeamId={fixture.away_team.id}
                      homeTeamName={fixture.home_team.name}
                      awayTeamName={fixture.away_team.name}
                      homePensTotal={fixture.home_penalty_score}
                      awayPensTotal={fixture.away_penalty_score}
                    />
                  </div>
                );
              }

              const body = (
                <div className={styles.eventList}>
                  {section.events.map((event, i) => (
                    <EventRow
                      key={`${section.id}-${event.type}-${event.minute ?? 'null'}-${i}`}
                      event={event}
                      awayTeamId={fixture.away_team.id}
                    />
                  ))}
                </div>
              );

              if (section.defaultCollapsed) {
                return (
                  <CollapsibleSection
                    key={section.id}
                    title={section.title}
                    defaultCollapsed
                    variant="muted"
                  >
                    {body}
                  </CollapsibleSection>
                );
              }

              return (
                <div key={section.id} className={styles.drawerSection}>
                  <p className={styles.drawerSectionTitle}>{section.title}</p>
                  {body}
                </div>
              );
            })}
          </>
        )}

        {status === 'ready' && hasStats && (
          <CollapsibleSection
            title="Team Stats"
            defaultCollapsed={statsCollapsed}
            variant="muted"
            preview={
              statsCollapsed ? (
                <>
                  <StatRows
                    rows={teaserStatRows}
                    homeStat={homeStat}
                    awayStat={awayStat}
                  />
                  <p className={styles.statsExpandHint}>
                    Expand for corners, cards, and more
                  </p>
                </>
              ) : undefined
            }
          >
            <StatRows rows={STAT_ROWS} homeStat={homeStat} awayStat={awayStat} />
          </CollapsibleSection>
        )}

        <div className={styles.drawerSafeArea} />
      </div>
    </>
  );
}
