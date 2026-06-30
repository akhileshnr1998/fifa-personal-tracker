import { useCallback, useEffect, useRef, useState } from 'react';
import { RETRY_DELAYS_MS, sleep } from '../../lib/localCache';
import { fetchTeamSquad } from './api';
import type { TeamSquad } from './types';

export type SquadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseSquadResult {
  squad: TeamSquad | null;
  status: SquadStatus;
  refresh: () => Promise<void>;
}

export function useSquad(teamId: number | null): UseSquadResult {
  const [squad, setSquad] = useState<TeamSquad | null>(null);
  const [status, setStatus] = useState<SquadStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (teamId === null) {
        setSquad(null);
        setStatus('idle');
        return;
      }

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
          const data = await fetchTeamSquad(teamId, isRefresh);
          if (abort.signal.aborted) return;
          setSquad(data);
          setStatus('ready');
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (!abort.signal.aborted) {
        console.error('[useSquad] all retries failed', lastError);
        setStatus('error');
      }
    },
    [teamId],
  );

  useEffect(() => {
    void load();
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { squad, status, refresh };
}
