import {
  getFlagSrcSet,
  getFlagUrl,
  getTeamIsoCode,
} from '../fixtures/teamFlags';
import type { GroupEntry, GroupStandings } from './types';
import styles from './standings.module.css';

// ── Flag ──────────────────────────────────────────────────────────────────

function TeamFlag({ name }: { name: string }) {
  const isoCode = getTeamIsoCode(name);
  if (!isoCode) {
    return (
      <span className={styles.flagPlaceholder} aria-hidden="true">
        ?
      </span>
    );
  }
  return (
    <img
      className={styles.flag}
      src={getFlagUrl(isoCode)}
      srcSet={getFlagSrcSet(isoCode)}
      alt=""
      width={20}
      height={15}
      loading="lazy"
      decoding="async"
    />
  );
}

// ── Row ───────────────────────────────────────────────────────────────────

function Row({
  entry,
  followedTeamIds,
}: {
  entry: GroupEntry;
  followedTeamIds: Set<number>;
}) {
  const isFollowed = followedTeamIds.has(entry.team.id);

  return (
    <tr>
      {/* Qualification colour band — use ESPN's colour directly */}
      <td className={styles.qualBand}>
        <span
          className={styles.qualBandInner}
          style={{ background: entry.qualification_color ?? 'transparent' }}
          title={entry.qualification_label ?? undefined}
        />
      </td>

      <td className={styles.rankCell}>{entry.rank}</td>

      <td className={`${styles.teamCell} ${isFollowed ? styles.teamCellFollowed : ''}`}>
        <span className={styles.teamCellInner}>
          <TeamFlag name={entry.team.name} />
          <span>{entry.team.name}</span>
          {isFollowed && (
            <span aria-label="followed" className={styles.followedStar}>
              ★
            </span>
          )}
        </span>
      </td>

      <td className={styles.statCell}>{entry.games_played}</td>
      <td className={styles.statCell}>{entry.wins}</td>
      <td className={styles.statCell}>{entry.draws}</td>
      <td className={styles.statCell}>{entry.losses}</td>
      <td className={styles.statCell}>
        {entry.goal_diff > 0 ? `+${entry.goal_diff}` : entry.goal_diff}
      </td>
      <td className={`${styles.statCell} ${styles.statCellBold}`}>{entry.points}</td>
    </tr>
  );
}

// ── Legend — built from actual entry data, not hardcoded hex ──────────────

function Legend({ entries }: { entries: GroupEntry[] }) {
  const seen = new Map<string, string>();
  for (const e of entries) {
    if (e.qualification_color && e.qualification_label && !seen.has(e.qualification_color)) {
      seen.set(e.qualification_color, e.qualification_label);
    }
  }
  if (seen.size === 0) return null;

  return (
    <div className={styles.legend} style={{ padding: '0.5rem 0.75rem 0.625rem' }}>
      {[...seen.entries()].map(([color, label]) => (
        <span key={color} className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── GroupTable ────────────────────────────────────────────────────────────

interface GroupTableProps {
  group: GroupStandings;
  followedTeamIds: Set<number>;
}

export function GroupTable({ group, followedTeamIds }: GroupTableProps) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableCardHeader}>
        <span className={styles.groupLabel}>{group.group_name}</span>
        <span className={styles.teamCount}>{group.entries.length} teams</span>
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th aria-label="Qualification" />
              <th>#</th>
              <th>Team</th>
              <th title="Games played">GP</th>
              <th title="Wins">W</th>
              <th title="Draws">D</th>
              <th title="Losses">L</th>
              <th title="Goal difference">GD</th>
              <th title="Points">Pts</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {group.entries.map((entry) => (
              <Row
                key={entry.team.id}
                entry={entry}
                followedTeamIds={followedTeamIds}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Legend entries={group.entries} />
    </div>
  );
}
