import { useCallback, useEffect, useRef, useState } from 'react';
import { readCache, RETRY_DELAYS_MS, sleep, writeCache } from '../../lib/localCache';
import { fetchTeams } from './api';
import type { TeamProfile } from './types';

export type TeamsStatus = 'loading' | 'stale' | 'ready' | 'empty' | 'error';

interface UseTeamsResult {
  teams: TeamProfile[];
  status: TeamsStatus;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'teams';

export function useTeams(): UseTeamsResult {
  const [teams, setTeams] = useState<TeamProfile[]>(
    () => readCache<TeamProfile[]>(CACHE_KEY) ?? [],
  );
  const [status, setStatus] = useState<TeamsStatus>(() => {
    const cached = readCache<TeamProfile[]>(CACHE_KEY);
    return cached && cached.length > 0 ? 'stale' : 'loading';
  });

  const abortRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(teams.length > 0);

  const load = useCallback(async (isRefresh = false) => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    if (isRefresh && hasDataRef.current) {
      setStatus('ready');
    } else {
      setStatus((prev) => (prev === 'stale' || prev === 'ready' ? prev : 'loading'));
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      if (abort.signal.aborted) return;

      if (attempt > 0) {
        await sleep(RETRY_DELAYS_MS[attempt - 1]);
        if (abort.signal.aborted) return;
      }

      try {
        const data = await fetchTeams(isRefresh);
        if (abort.signal.aborted) return;
        writeCache(CACHE_KEY, data);
        hasDataRef.current = data.length > 0;
        setTeams(data);
        setStatus(data.length === 0 ? 'empty' : 'ready');
        return;
      } catch (error) {
        lastError = error;
      }
    }

    if (!abort.signal.aborted) {
      console.error('[useTeams] all retries failed', lastError);
      if (!hasDataRef.current) {
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { teams, status, refresh };
}
