import { useCallback, useEffect, useState } from 'react';
import { fetchFixtures } from './api';
import type { Fixture } from './types';

export type FixturesStatus = 'loading' | 'ready' | 'empty' | 'error';

interface UseFixturesResult {
  fixtures: Fixture[];
  status: FixturesStatus;
  refresh: () => Promise<void>;
}

export function useFixtures(): UseFixturesResult {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [status, setStatus] = useState<FixturesStatus>('loading');

  const load = useCallback(async (refresh = false) => {
    setStatus('loading');
    try {
      const data = await fetchFixtures(refresh);
      setFixtures(data);
      setStatus(data.length === 0 ? 'empty' : 'ready');
    } catch {
      setFixtures([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { fixtures, status, refresh };
}
