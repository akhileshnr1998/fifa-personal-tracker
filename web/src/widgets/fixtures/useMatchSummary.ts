import { useCallback, useState } from 'react';
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

  const load = useCallback(async (fixtureId: number) => {
    setStatus('loading');
    setSummary(null);
    try {
      const data = await fetchMatchSummary(fixtureId);
      setSummary(data);
      setStatus('ready');
    } catch {
      setSummary(null);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setSummary(null);
    setStatus('idle');
  }, []);

  return { summary, status, load, reset };
}
