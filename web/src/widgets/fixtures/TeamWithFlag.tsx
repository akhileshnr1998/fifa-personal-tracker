import styles from './fixtures.module.css';
import {
  getFlagSrcSet,
  getFlagUrl,
  getTeamIsoCode,
  isPlaceholderTeam,
} from './teamFlags';

interface TeamWithFlagProps {
  name: string;
  align: 'left' | 'right';
}

export function TeamWithFlag({ name, align }: TeamWithFlagProps) {
  const isoCode = getTeamIsoCode(name);
  const placeholder = isPlaceholderTeam(name);

  return (
    <div
      className={`${styles.team} ${align === 'right' ? styles.teamRight : styles.teamLeft}`}
    >
      {align === 'right' ? (
        <>
          <span className={styles.teamName}>{name}</span>
          <TeamFlag isoCode={isoCode} placeholder={placeholder} />
        </>
      ) : (
        <>
          <TeamFlag isoCode={isoCode} placeholder={placeholder} />
          <span className={styles.teamName}>{name}</span>
        </>
      )}
    </div>
  );
}

interface TeamFlagProps {
  isoCode: string | null;
  placeholder: boolean;
}

function TeamFlag({ isoCode, placeholder }: TeamFlagProps) {
  if (placeholder || !isoCode) {
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
