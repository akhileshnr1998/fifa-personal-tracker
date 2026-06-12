import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFixtures } from './api';
import type { Fixture } from './types';

export type FixturesStatus = 'loading' | 'ready' | 'empty' | 'error';

interface UseFixturesResult {
  fixtures: Fixture[];
  status: FixturesStatus;
  refresh: () => Promise<void>;
}

const RETRY_DELAYS_MS = [5_000, 15_000, 30_000];

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useFixtures(): UseFixturesResult {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [status, setStatus] = useState<FixturesStatus>('loading');
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (refresh = false) => {
    // Cancel any in-flight retry loop when a manual refresh is triggered.
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setStatus('loading');

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
        setFixtures(data);
        setStatus(data.length === 0 ? 'empty' : 'ready');
        return;
      } catch (error) {
        lastError = error;
      }
    }

    if (!abort.signal.aborted) {
      // All retries exhausted — surface the error to the caller.
      // Log the last error so developers can diagnose cold-start issues.
      console.error('[useFixtures] all retries failed', lastError);
      setFixtures([]);
      setStatus('error');
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
