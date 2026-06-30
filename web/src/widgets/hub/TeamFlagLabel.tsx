import {
  getFlagSrcSet,
  getFlagUrl,
  getTeamIsoCode,
} from '../fixtures/teamFlags';
import styles from './hub.module.css';

interface TeamFlagLabelProps {
  name: string;
  size?: 'sm' | 'md';
}

export function TeamFlagLabel({ name, size = 'md' }: TeamFlagLabelProps) {
  const isoCode = getTeamIsoCode(name);

  return (
    <span className={styles.teamWithFlag}>
      {isoCode ? (
        <img
          className={size === 'sm' ? styles.flagSm : styles.flagMd}
          src={getFlagUrl(isoCode)}
          srcSet={getFlagSrcSet(isoCode)}
          alt=""
          width={size === 'sm' ? 20 : 24}
          height={size === 'sm' ? 15 : 18}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className={styles.flagPlaceholder} aria-hidden="true">
          ?
        </span>
      )}
      <span className={styles.teamName}>{name}</span>
    </span>
  );
}
