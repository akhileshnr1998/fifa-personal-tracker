import { useCallback, useEffect, useRef, useState } from 'react';
import { readCache, RETRY_DELAYS_MS, sleep, writeCache } from '../../lib/localCache';
import { fetchBracket } from './api';
import { hydrateBracketTree } from './hydrateBracketTree';
import type { BracketApiResponse } from './hydrateBracketTree';
import type { BracketTree } from './types';

export type BracketStatus = 'loading' | 'stale' | 'ready' | 'empty' | 'error';

interface UseBracketResult {
  tree: BracketTree | null;
  status: BracketStatus;
  refresh: () => Promise<void>;
  knockoutStarted: boolean;
}

const CACHE_KEY = 'bracket';

function readCachedResponse(): BracketApiResponse | null {
  return readCache<BracketApiResponse>(CACHE_KEY);
}

export function useBracket(): UseBracketResult {
  const cached = readCachedResponse();
  const [tree, setTree] = useState<BracketTree | null>(() =>
    cached ? hydrateBracketTree(cached) : null,
  );
  const [knockoutStarted, setKnockoutStarted] = useState(
    () => cached?.knockoutStarted ?? false,
  );
  const [status, setStatus] = useState<BracketStatus>(() => {
    return cached ? 'stale' : 'loading';
  });

  const abortRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(Boolean(cached?.knockoutStarted));

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
        const data = await fetchBracket(refresh);
        if (abort.signal.aborted) return;

        writeCache(CACHE_KEY, data);
        hasDataRef.current = data.knockoutStarted;
        setKnockoutStarted(data.knockoutStarted);
        setTree(hydrateBracketTree(data));
        setStatus(
          !data.knockoutStarted ? 'empty' : 'ready',
        );
        return;
      } catch (error) {
        lastError = error;
      }
    }

    if (!abort.signal.aborted) {
      console.error('[useBracket] all retries failed', lastError);
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

  return { tree, status, refresh, knockoutStarted };
}
