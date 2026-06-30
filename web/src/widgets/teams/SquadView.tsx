import { useCallback, useState, useSyncExternalStore } from 'react';
import {
  getFlagSrcSet,
  getFlagUrl,
  getTeamIsoCode,
} from '../fixtures/teamFlags';
import { PlayerStatsModal } from './PlayerStatsModal';
import type { SquadPlayer } from './types';
import styles from './teams.module.css';

function useCompactSquadLayout(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia('(max-width: 639px)');
      mediaQuery.addEventListener('change', onStoreChange);
      return () => mediaQuery.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(max-width: 639px)').matches,
    () => false,
  );
}

function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatPlayerMeta(player: SquadPlayer): string {
  const position = player.position ?? player.position_abbr ?? 'Squad member';
  const parts = [position];
  if (player.age != null) {
    parts.push(`Age ${player.age}`);
  }
  return parts.join(' · ');
}

function formatTournamentStats(player: SquadPlayer): string[] {
  const stats: string[] = [];
  if (player.goals > 0) stats.push(formatCount(player.goals, 'goal'));
  if (player.assists > 0) stats.push(formatCount(player.assists, 'assist'));
  if (player.appearances > 0) stats.push(formatCount(player.appearances, 'match', 'matches'));
  if (player.yellow_cards > 0) {
    stats.push(formatCount(player.yellow_cards, 'yellow card', 'yellow cards'));
  }
  if (player.red_cards > 0) {
    stats.push(formatCount(player.red_cards, 'red card', 'red cards'));
  }
  return stats;
}

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
      width={24}
      height={18}
      loading="lazy"
      decoding="async"
    />
  );
}

function PlayerCard({
  player,
  compact,
  onSelect,
}: {
  player: SquadPlayer;
  compact: boolean;
  onSelect: (player: SquadPlayer) => void;
}) {
  const stats = formatTournamentStats(player);
  const content = (
    <>
      <span
        className={styles.jersey}
        aria-label={player.jersey ? `Jersey number ${player.jersey}` : 'Jersey number not listed'}
      >
        {player.jersey ?? '—'}
      </span>
      <div className={styles.playerMain}>
        <span className={styles.playerName}>{player.display_name}</span>
        <span className={styles.playerPosition}>{formatPlayerMeta(player)}</span>
      </div>
      <div className={styles.playerStats}>
        {stats.length > 0 ? (
          <span>{stats.join(' · ')}</span>
        ) : (
          <span className={styles.playerStatMuted}>No tournament stats yet</span>
        )}
      </div>
      {compact ? (
        <span className={styles.playerStatsChevron} aria-hidden="true">
          ›
        </span>
      ) : null}
    </>
  );

  if (compact) {
    return (
      <button
        type="button"
        className={`${styles.playerCard} ${styles.playerCardInteractive}`}
        onClick={() => onSelect(player)}
        aria-label={`View tournament stats for ${player.display_name}`}
      >
        {content}
      </button>
    );
  }

  return <article className={styles.playerCard}>{content}</article>;
}

interface SquadViewProps {
  teamName: string;
  playerCount: number;
  players: SquadPlayer[];
  isFollowed: boolean;
  onBack: () => void;
}

export function SquadView({
  teamName,
  playerCount,
  players,
  isFollowed,
  onBack,
}: SquadViewProps) {
  const compactLayout = useCompactSquadLayout();
  const [selectedPlayer, setSelectedPlayer] = useState<SquadPlayer | null>(null);

  const handleSelectPlayer = useCallback((player: SquadPlayer) => {
    setSelectedPlayer(player);
  }, []);

  const handleCloseStats = useCallback(() => {
    setSelectedPlayer(null);
  }, []);

  return (
    <section className={styles.squadPanel} aria-labelledby="squad-heading">
      <div className={styles.squadHeader}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← Teams
        </button>
        <div className={styles.squadTitleBlock}>
          <div className={styles.squadTitleRow}>
            <TeamFlag name={teamName} />
            <h2 id="squad-heading" className={styles.squadTitle}>
              {teamName}
              {isFollowed ? ' ★' : ''}
            </h2>
          </div>
          <p className={styles.squadMeta}>
            {playerCount} player{playerCount === 1 ? '' : 's'} in squad
          </p>
        </div>
      </div>

      <div
        className={`${styles.playerList} ${compactLayout ? styles.playerListCompact : ''}`}
      >
        <div className={styles.playerListHeader} aria-hidden="true">
          <span>No.</span>
          <span>Player</span>
          <span className={styles.playerListHeaderStats}>Tournament stats</span>
        </div>
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            compact={compactLayout}
            onSelect={handleSelectPlayer}
          />
        ))}
      </div>

      {selectedPlayer ? (
        <PlayerStatsModal player={selectedPlayer} onClose={handleCloseStats} />
      ) : null}
    </section>
  );
}
