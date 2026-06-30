import type { TopScorerEntry } from '../types';
import styles from '../hub.module.css';

interface TopScorersSectionProps {
  available: boolean;
  entries: TopScorerEntry[];
}

export function TopScorersSection({ available, entries }: TopScorersSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="hub-scorers-heading">
      <h2 id="hub-scorers-heading" className={styles.sectionTitle}>
        Top scorers
      </h2>

      {!available ? (
        <p className={styles.sectionEmpty}>
          Scorers update as matches finish and summaries are loaded.
        </p>
      ) : (
        <ol className={styles.scorersList}>
          {entries.map((entry) => (
            <li key={`${entry.player_name}-${entry.team.id}`} className={styles.scorerRow}>
              <span className={styles.scorerRank}>{entry.rank}</span>
              <span className={styles.scorerInfo}>
                <span className={styles.scorerName}>{entry.player_name}</span>
                <span className={styles.scorerTeam}>{entry.team.name}</span>
              </span>
              <span className={styles.scorerGoals}>
                {entry.goals} {entry.goals === 1 ? 'goal' : 'goals'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
