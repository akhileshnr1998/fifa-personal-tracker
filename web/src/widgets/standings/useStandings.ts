import { useCallback, useEffect, useState } from 'react';
import { fetchStandings } from './api';
import type { GroupStandings } from './types';

export type StandingsStatus = 'loading' | 'ready' | 'empty' | 'error';

interface UseStandingsResult {
  groups: GroupStandings[];
  status: StandingsStatus;
  refresh: () => Promise<void>;
}

export function useStandings(): UseStandingsResult {
  const [groups, setGroups] = useState<GroupStandings[]>([]);
  const [status, setStatus] = useState<StandingsStatus>('loading');

  const load = useCallback(async (isRefresh = false) => {
    setStatus('loading');
    try {
      const data = await fetchStandings(isRefresh);
      setGroups(data);
      setStatus(data.length === 0 ? 'empty' : 'ready');
    } catch {
      setGroups([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { groups, status, refresh };
}
