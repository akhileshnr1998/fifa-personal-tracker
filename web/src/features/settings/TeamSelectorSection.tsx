import type { TeamPickerOption } from './api';
import styles from './settings.module.css';

interface Props {
  selectedTeamIds: number[];
  teamOptions: TeamPickerOption[];
  loadingTeams: boolean;
  onAdd: (teamId: number) => void;
  onRemove: (teamId: number) => void;
}

export function TeamSelectorSection({
  selectedTeamIds,
  teamOptions,
  loadingTeams,
  onAdd,
  onRemove,
}: Props) {
  const availableTeams = teamOptions.filter(
    (team) => !selectedTeamIds.includes(team.id),
  );

  const selectedTeamLabels = selectedTeamIds.map((teamId) => {
    const match = teamOptions.find((team) => team.id === teamId);
    return { id: teamId, name: match?.name ?? `Team ${teamId}` };
  });

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Teams You Follow</h3>
      <p className={styles.helperText}>
        You&apos;ll be notified before these teams kick off.
      </p>

      {selectedTeamLabels.length > 0 ? (
        <ul className={styles.selectedTeams} aria-label="Teams you follow">
          {selectedTeamLabels.map((team) => (
            <li key={team.id} className={styles.selectedTeamChip}>
              <span>{team.name}</span>
              <button
                type="button"
                className={styles.removeTeamButton}
                onClick={() => onRemove(team.id)}
                aria-label={`Remove ${team.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.mutedText}>No teams selected yet.</p>
      )}

      {loadingTeams ? (
        <p className={styles.mutedText}>Loading teams…</p>
      ) : (
        <select
          className={styles.selectInput}
          value=""
          onChange={(event) => {
            const teamId = Number(event.target.value);
            if (teamId) onAdd(teamId);
          }}
          aria-label="Add a team to follow"
        >
          <option value="" disabled>
            {availableTeams.length === 0
              ? selectedTeamIds.length === teamOptions.length
                ? 'All teams selected'
                : 'No teams available'
              : 'Select a team…'}
          </option>
          {availableTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      )}
    </section>
  );
}
