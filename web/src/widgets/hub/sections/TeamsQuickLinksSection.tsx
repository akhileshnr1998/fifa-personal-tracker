import { Link } from 'react-router-dom';
import type { TeamQuickLink } from '../types';
import styles from '../hub.module.css';

interface TeamsQuickLinksSectionProps {
  teams: TeamQuickLink[];
  followedTeamIds: number[];
}

export function TeamsQuickLinksSection({
  teams,
  followedTeamIds,
}: TeamsQuickLinksSectionProps) {
  const previewTeams = teams.slice(0, 12);

  return (
    <section className={styles.section} aria-labelledby="hub-teams-heading">
      <div className={styles.sectionHeader}>
        <h2 id="hub-teams-heading" className={styles.sectionTitle}>
          Teams
        </h2>
        <Link to="/teams" className={styles.viewAllLink}>
          View all →
        </Link>
      </div>

      {previewTeams.length === 0 ? (
        <p className={styles.sectionEmpty}>
          Team quick-links appear once tournament squads are loaded.
        </p>
      ) : (
        <div className={styles.teamsGrid}>
          {previewTeams.map((team) => (
            <span
              key={team.id}
              className={[
                styles.teamChip,
                followedTeamIds.includes(team.id) ? styles.teamChipFollowed : '',
              ].join(' ')}
            >
              {team.name}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
