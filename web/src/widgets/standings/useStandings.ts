import { useCallback, useEffect, useRef, useState } from 'react';
import { readCache, RETRY_DELAYS_MS, sleep, writeCache } from '../../lib/localCache';
import { fetchStandings } from './api';
import type { GroupStandings } from './types';

export type StandingsStatus = 'loading' | 'stale' | 'ready' | 'empty' | 'error';

interface UseStandingsResult {
  groups: GroupStandings[];
  status: StandingsStatus;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'standings';

export function useStandings(): UseStandingsResult {
  // Lazy initializer — readCache runs once on mount, not on every render.
  const [groups, setGroups] = useState<GroupStandings[]>(
    () => readCache<GroupStandings[]>(CACHE_KEY) ?? [],
  );
  const [status, setStatus] = useState<StandingsStatus>(() => {
    const cached = readCache<GroupStandings[]>(CACHE_KEY);
    return cached && cached.length > 0 ? 'stale' : 'loading';
  });

  const abortRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(groups.length > 0);

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
        const data = await fetchStandings(isRefresh);
        if (abort.signal.aborted) return;
        // Empty arrays are intentionally cached: on the next visit the
        // skeleton (not the stale banner) shows until data is available.
        writeCache(CACHE_KEY, data);
        hasDataRef.current = data.length > 0;
        setGroups(data);
        setStatus(data.length === 0 ? 'empty' : 'ready');
        return;
      } catch (error) {
        lastError = error;
      }
    }

    if (!abort.signal.aborted) {
      console.error('[useStandings] all retries failed', lastError);
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

  return { groups, status, refresh };
}
