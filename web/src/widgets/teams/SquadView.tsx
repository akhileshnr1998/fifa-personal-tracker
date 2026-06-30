import {
  getFlagSrcSet,
  getFlagUrl,
  getTeamIsoCode,
} from '../fixtures/teamFlags';
import type { SquadPlayer } from './types';
import styles from './teams.module.css';

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

function PlayerCard({ player }: { player: SquadPlayer }) {
  const statLine = [
    player.goals > 0 ? `${player.goals}G` : null,
    player.assists > 0 ? `${player.assists}A` : null,
    player.appearances > 0 ? `${player.appearances} apps` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className={styles.playerCard}>
      <span className={styles.jersey}>{player.jersey ?? '—'}</span>
      <div className={styles.playerMain}>
        <span className={styles.playerName}>{player.display_name}</span>
        <span className={styles.playerPosition}>
          {player.position_abbr ?? player.position ?? 'Squad'}
          {player.age ? ` · ${player.age}` : ''}
        </span>
      </div>
      <div className={styles.playerStats}>
        {statLine ? <span>{statLine}</span> : <span className={styles.playerStatMuted}>—</span>}
        {(player.yellow_cards > 0 || player.red_cards > 0) && (
          <span className={styles.playerStatMuted}>
            {player.yellow_cards > 0 ? `YC ${player.yellow_cards}` : ''}
            {player.yellow_cards > 0 && player.red_cards > 0 ? ' · ' : ''}
            {player.red_cards > 0 ? `RC ${player.red_cards}` : ''}
          </span>
        )}
      </div>
    </article>
  );
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

      <div className={styles.playerList}>
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </section>
  );
}
