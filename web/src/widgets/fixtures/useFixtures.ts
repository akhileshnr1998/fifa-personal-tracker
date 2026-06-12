import { useCallback, useEffect, useRef, useState } from 'react';
import { readCache, RETRY_DELAYS_MS, sleep, writeCache } from '../../lib/localCache';
import { fetchFixtures } from './api';
import type { Fixture } from './types';

export type FixturesStatus = 'loading' | 'stale' | 'ready' | 'empty' | 'error';

interface UseFixturesResult {
  fixtures: Fixture[];
  status: FixturesStatus;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'fixtures';

export function useFixtures(): UseFixturesResult {
  // Lazy initializer — readCache runs once on mount, not on every render.
  const [fixtures, setFixtures] = useState<Fixture[]>(
    () => readCache<Fixture[]>(CACHE_KEY) ?? [],
  );
  const [status, setStatus] = useState<FixturesStatus>(() => {
    const cached = readCache<Fixture[]>(CACHE_KEY);
    return cached && cached.length > 0 ? 'stale' : 'loading';
  });

  const abortRef = useRef<AbortController | null>(null);
  // Tracks whether any data is currently visible so the exhausted-retry handler
  // knows whether to flip to 'error' or keep showing stale content.
  const hasDataRef = useRef(fixtures.length > 0);

  const load = useCallback(async (refresh = false) => {
    // Cancel any in-flight retry loop when a manual refresh is triggered.
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    // On a manual refresh, dismiss the stale banner immediately — the header
    // spinner handles UX. On an automatic background load, keep stale data
    // visible. Only show the blocking skeleton when there is nothing to show.
    if (refresh && hasDataRef.current) {
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
        const data = await fetchFixtures(refresh);
        if (abort.signal.aborted) return;
        // Empty arrays are intentionally cached: on the next visit the
        // skeleton (not the stale banner) shows until data is available.
        writeCache(CACHE_KEY, data);
        hasDataRef.current = data.length > 0;
        setFixtures(data);
        setStatus(data.length === 0 ? 'empty' : 'ready');
        return;
      } catch (error) {
        lastError = error;
      }
    }

    if (!abort.signal.aborted) {
      console.error('[useFixtures] all retries failed', lastError);
      // Keep showing stale content rather than blanking the screen.
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

  return { fixtures, status, refresh };
}
