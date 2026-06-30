import { useCallback, useEffect, useState } from 'react';
import type { SquadPlayer } from './types';
import styles from './teams.module.css';

interface PlayerStatsModalProps {
  player: SquadPlayer;
  onClose: () => void;
}

interface StatRow {
  label: string;
  value: number;
}

function formatPlayerMeta(player: SquadPlayer): string {
  const position = player.position ?? player.position_abbr ?? 'Squad member';
  const parts = [position];
  if (player.age != null) {
    parts.push(`Age ${player.age}`);
  }
  return parts.join(' · ');
}

function getTournamentStatRows(player: SquadPlayer): StatRow[] {
  return [
    { label: 'Goals', value: player.goals },
    { label: 'Assists', value: player.assists },
    { label: 'Matches played', value: player.appearances },
    { label: 'Yellow cards', value: player.yellow_cards },
    { label: 'Red cards', value: player.red_cards },
  ];
}

function hasTournamentStats(player: SquadPlayer): boolean {
  return getTournamentStatRows(player).some((row) => row.value > 0);
}

export function PlayerStatsModal({ player, onClose }: PlayerStatsModalProps) {
  const [closing, setClosing] = useState(false);

  const beginClose = useCallback(() => {
    setClosing(true);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') beginClose();
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [beginClose]);

  const statRows = getTournamentStatRows(player);
  const profileRows = [
    player.height_display ? { label: 'Height', value: player.height_display } : null,
    player.weight_display ? { label: 'Weight', value: player.weight_display } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  return (
    <>
      <div
        className={`${styles.statsModalBackdrop} ${closing ? styles.statsModalBackdropClosing : ''}`}
        onClick={beginClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-stats-title"
        className={`${styles.statsModalPanel} ${closing ? styles.statsModalPanelClosing : ''}`}
        onAnimationEnd={closing ? onClose : undefined}
      >
        <div className={styles.statsModalHandle} aria-hidden="true">
          <div className={styles.statsModalHandleBar} />
        </div>

        <div className={styles.statsModalHeader}>
          <span
            className={styles.jersey}
            aria-label={player.jersey ? `Jersey number ${player.jersey}` : 'Jersey number not listed'}
          >
            {player.jersey ?? '—'}
          </span>
          <div className={styles.statsModalTitleBlock}>
            <h3 id="player-stats-title" className={styles.statsModalTitle}>
              {player.display_name}
            </h3>
            <p className={styles.statsModalMeta}>{formatPlayerMeta(player)}</p>
          </div>
        </div>

        <div className={styles.statsModalBody}>
          <section className={styles.statsModalSection} aria-labelledby="player-tournament-stats">
            <h4 id="player-tournament-stats" className={styles.statsModalSectionTitle}>
              Tournament stats
            </h4>
            {hasTournamentStats(player) ? (
              <dl className={styles.statsModalList}>
                {statRows.map((row) => (
                  <div key={row.label} className={styles.statsModalRow}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className={styles.statsModalEmpty}>No tournament stats yet</p>
            )}
          </section>

          {profileRows.length > 0 && (
            <section className={styles.statsModalSection} aria-labelledby="player-profile">
              <h4 id="player-profile" className={styles.statsModalSectionTitle}>
                Profile
              </h4>
              <dl className={styles.statsModalList}>
                {profileRows.map((row) => (
                  <div key={row.label} className={styles.statsModalRow}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <div className={styles.statsModalSafeArea} />
      </div>
    </>
  );
}
