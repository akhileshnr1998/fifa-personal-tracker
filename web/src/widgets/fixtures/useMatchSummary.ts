import { useCallback, useRef, useState } from 'react';
import { fetchMatchSummary } from './api';
import type { MatchSummaryResult } from './types';

export type SummaryStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseMatchSummaryResult {
  summary: MatchSummaryResult | null;
  status: SummaryStatus;
  load: (fixtureId: number) => Promise<void>;
  reset: () => void;
}

export function useMatchSummary(): UseMatchSummaryResult {
  const [summary, setSummary] = useState<MatchSummaryResult | null>(null);
  const [status, setStatus] = useState<SummaryStatus>('idle');
  const requestIdRef = useRef(0);

  const load = useCallback(async (fixtureId: number) => {
    const requestId = ++requestIdRef.current;
    setStatus('loading');
    setSummary(null);
    try {
      const data = await fetchMatchSummary(fixtureId);
      if (requestId !== requestIdRef.current) return;
      setSummary(data);
      setStatus('ready');
    } catch {
      if (requestId !== requestIdRef.current) return;
      setSummary(null);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setSummary(null);
    setStatus('idle');
  }, []);

  return { summary, status, load, reset };
}
