import { useEffect, useRef } from 'react';
import { getFollowedTeamIds } from '../../features/settings/preferences';
import {
  findNearestUpcomingFixture,
  fixtureElementId,
} from './findNearestUpcomingFixture';
import { MatchCard } from './MatchCard';
import { groupFixturesByDay } from './groupByDay';
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

  useEffect(() => {
    if (hasAutoScrolledRef.current || !scrollTarget) {
      return;
    }

    const element = document.getElementById(fixtureElementId(scrollTarget.id));
    if (!element) {
      return;
    }

    hasAutoScrolledRef.current = true;

    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [scrollTarget]);

  return (
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
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
