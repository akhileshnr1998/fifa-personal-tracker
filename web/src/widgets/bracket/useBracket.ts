import { useMemo } from 'react';
import { useFixtures } from '../fixtures/useFixtures';
import { buildBracketTree, hasKnockoutFixtures } from './buildBracketTree';

export function useBracket() {
  const { fixtures, status, refresh } = useFixtures();
  const tree = useMemo(() => buildBracketTree(fixtures), [fixtures]);
  const knockoutStarted = useMemo(
    () => hasKnockoutFixtures(fixtures),
    [fixtures],
  );

  return { tree, status, refresh, knockoutStarted };
}
