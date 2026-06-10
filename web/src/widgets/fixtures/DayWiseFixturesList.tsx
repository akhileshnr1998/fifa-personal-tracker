import { getFollowedTeams } from '../../features/settings/preferences';
import { MatchCard } from './MatchCard';
import { groupFixturesByDay } from './groupByDay';
import styles from './fixtures.module.css';
import type { Fixture } from './types';

interface DayWiseFixturesListProps {
  fixtures: Fixture[];
}

export function DayWiseFixturesList({ fixtures }: DayWiseFixturesListProps) {
  const groups = groupFixturesByDay(fixtures);
  const followedTeams = getFollowedTeams();

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
