import { abbreviateBracketName } from './abbreviateBracketName';
import { formatFixturePensSubline } from '../fixtures/formatFixtureScore';
import { getFlagSrcSet, getFlagUrl, getTeamIsoCode, isPlaceholderTeam } from '../fixtures/teamFlags';
import type { Fixture } from '../fixtures/types';
import styles from './bracket.module.css';
import type { BracketNode } from './types';

interface BracketMatchNodeProps {
  node: BracketNode;
  followedTeamIds: number[];
  isFinal?: boolean;
}

function isFollowedNode(node: BracketNode, followedTeamIds: number[]): boolean {
  const fixture = node.fixture;
  if (!fixture) return false;
  return (
    followedTeamIds.includes(fixture.home_team.id) ||
    followedTeamIds.includes(fixture.away_team.id)
  );
}

function resolveWinnerSide(fixture: Fixture): 'home' | 'away' | null {
  if (fixture.status !== 'finished') return null;
  if (fixture.home_score === null || fixture.away_score === null) return null;

  if (fixture.decided_by === 'penalties') {
    if (
      fixture.home_penalty_score == null ||
      fixture.away_penalty_score == null
    ) {
      return null;
    }
    if (fixture.home_penalty_score > fixture.away_penalty_score) return 'home';
    if (fixture.away_penalty_score > fixture.home_penalty_score) return 'away';
    return null;
  }

  if (fixture.home_score > fixture.away_score) return 'home';
  if (fixture.away_score > fixture.home_score) return 'away';
  return null;
}

function regulationScore(
  fixture: Fixture,
  side: 'home' | 'away',
): string | null {
  if (fixture.status !== 'finished') return null;
  if (fixture.home_score === null || fixture.away_score === null) return null;
  return side === 'home'
    ? String(fixture.home_score)
    : String(fixture.away_score);
}

export function BracketMatchNode({
  node,
  followedTeamIds,
  isFinal = false,
}: BracketMatchNodeProps) {
  const fixture = node.fixture;
  const followed = isFollowedNode(node, followedTeamIds);
  const winnerSide = fixture ? resolveWinnerSide(fixture) : null;
  const pensSubline = fixture ? formatFixturePensSubline(fixture) : null;

  return (
    <div
      className={[
        styles.matchNode,
        isFinal ? styles.matchNodeFinal : '',
        followed ? styles.matchNodeFollowed : '',
        !fixture ? styles.matchNodeEmpty : '',
        pensSubline ? styles.matchNodeWithPens : '',
      ].join(' ')}
      aria-label={
        fixture && pensSubline
          ? `${fixture.home_team.name} ${fixture.home_score}–${fixture.away_score} ${fixture.away_team.name}, ${pensSubline}`
          : undefined
      }
    >
      {fixture ? (
        <>
          <div className={styles.matchNodeBody}>
            <TeamLine
              name={fixture.home_team.name}
              score={regulationScore(fixture, 'home')}
              isWinner={winnerSide === 'home'}
            />
            <TeamLine
              name={fixture.away_team.name}
              score={regulationScore(fixture, 'away')}
              isWinner={winnerSide === 'away'}
            />
          </div>
          {pensSubline && (
            <span className={styles.pensFootnote}>{pensSubline}</span>
          )}
        </>
      ) : (
        <>
          <TeamLine name="TBD" score={null} isWinner={false} placeholder />
          <TeamLine name="TBD" score={null} isWinner={false} placeholder />
        </>
      )}
    </div>
  );
}

interface TeamLineProps {
  name: string;
  score: string | null;
  isWinner: boolean;
  placeholder?: boolean;
}

function TeamLine({
  name,
  score,
  isWinner,
  placeholder = false,
}: TeamLineProps) {
  const isPlaceholder = placeholder || isPlaceholderTeam(name);
  const isoCode = isPlaceholder ? null : getTeamIsoCode(name);
  const label = abbreviateBracketName(name);

  return (
    <div
      className={[
        styles.teamLine,
        isWinner ? styles.teamLineWinner : '',
        isPlaceholder ? styles.teamLinePlaceholder : '',
      ].join(' ')}
    >
      <div className={styles.teamIdentity}>
        <BracketFlag isoCode={isoCode} placeholder={isPlaceholder} />
        <span className={styles.teamName} title={name}>
          {label}
        </span>
      </div>
      {score != null && <span className={styles.teamScore}>{score}</span>}
    </div>
  );
}

function BracketFlag({
  isoCode,
  placeholder,
}: {
  isoCode: string | null;
  placeholder: boolean;
}) {
  if (placeholder || !isoCode) {
    return <span className={styles.flagDot} aria-hidden="true" />;
  }

  return (
    <img
      className={styles.flag}
      src={getFlagUrl(isoCode)}
      srcSet={getFlagSrcSet(isoCode)}
      alt=""
      width={16}
      height={12}
      loading="lazy"
      decoding="async"
    />
  );
}
