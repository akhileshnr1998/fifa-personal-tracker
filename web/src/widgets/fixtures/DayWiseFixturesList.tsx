import { useEffect, useRef, useState } from 'react';
import { getFollowedTeamIds } from '../../features/settings/preferences';
import {
  findNearestUpcomingFixture,
  fixtureElementId,
} from './findNearestUpcomingFixture';
import { MatchCard } from './MatchCard';
import { MatchSummaryDrawer } from './MatchSummaryDrawer';
import { groupFixturesByDay } from './groupByDay';
import { useMatchSummary } from './useMatchSummary';
import styles from './fixtures.module.css';
import type { Fixture } from './types';

interface DayWiseFixturesListProps {
  fixtures: Fixture[];
}

export function DayWiseFixturesList({ fixtures }: DayWiseFixturesListProps) {
  const groups = groupFixturesByDay(fixtures);
  const followedTeams = getFollowedTeamIds();
  const hasAutoScrolledRef = useRef(false);
  const scrollTarget = findNearestUpcomingFixture(fixtures);

  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const { summary, status, load, reset } = useMatchSummary();

  useEffect(() => {
    if (hasAutoScrolledRef.current || !scrollTarget) return;

    const element = document.getElementById(fixtureElementId(scrollTarget.id));
    if (!element) return;

    hasAutoScrolledRef.current = true;
    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [scrollTarget]);

  function openDrawer(fixture: Fixture) {
    setSelectedFixture(fixture);
    void load(fixture.id);
  }

  function closeDrawer() {
    setSelectedFixture(null);
    reset();
  }

  return (
    <>
      <div className={styles.dayList}>
        {groups.map((group) => (
          <section key={group.dateKey} className={styles.daySection}>
            <div className={styles.dayHeadingRow}>
              <span className={styles.dayDot} aria-hidden="true" />
              <h2 className={styles.dayHeading}>{group.heading}</h2>
            </div>
            <div className={styles.matchList}>
              {group.fixtures.map((fixture) => (
                <MatchCard
                  key={fixture.id}
                  id={fixtureElementId(fixture.id)}
                  fixture={fixture}
                  followedTeams={followedTeams}
                  onSelect={
                    fixture.status === 'finished'
                      ? () => openDrawer(fixture)
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {selectedFixture && (
        <MatchSummaryDrawer
          fixture={selectedFixture}
          summary={summary}
          status={status}
          onClose={closeDrawer}
        />
      )}
    </>
  );
}
