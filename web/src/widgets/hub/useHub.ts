import { useCallback, useEffect, useRef, useState } from 'react';
import { readCache, RETRY_DELAYS_MS, sleep, writeCache } from '../../lib/localCache';
import { fetchHub } from './api';
import type { HubData } from './types';

export type HubStatus = 'loading' | 'stale' | 'ready' | 'error';

interface UseHubResult {
  hub: HubData | null;
  status: HubStatus;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'hub';

const emptyHub = (): HubData => ({
  top_scorers: { available: false, entries: [] },
  teams_quick_links: [],
});

function hasHubContent(data: HubData): boolean {
  return data.top_scorers.available || data.teams_quick_links.length > 0;
}

export function useHub(): UseHubResult {
  const [hub, setHub] = useState<HubData | null>(
    () => readCache<HubData>(CACHE_KEY) ?? null,
  );
  const [status, setStatus] = useState<HubStatus>(() => {
    const cached = readCache<HubData>(CACHE_KEY);
    return cached && hasHubContent(cached) ? 'stale' : 'loading';
  });

  const abortRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(hub !== null && hasHubContent(hub));

  const load = useCallback(async (refresh = false) => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

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
        const data = await fetchHub(refresh);
        if (abort.signal.aborted) return;
        writeCache(CACHE_KEY, data);
        hasDataRef.current = hasHubContent(data);
        setHub(data);
        setStatus('ready');
        return;
      } catch (error) {
        lastError = error;
      }
    }

    if (!abort.signal.aborted) {
      console.error('[useHub] all retries failed', lastError);
      if (!hasDataRef.current) {
        setHub(emptyHub());
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

  return { hub, status, refresh };
}
