// Bump CACHE_VERSION whenever a cached DTO shape changes (e.g. a field is
// renamed or removed in Fixture / GroupStandings). Old keys are silently
// abandoned — localStorage quota is reclaimed on the next writeCache call.
const CACHE_VERSION = 1;
const CACHE_PREFIX = `fifa_cache_v${CACHE_VERSION}_`;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — stale after a full day

// Shared retry config for all data-fetching hooks.
export const RETRY_DELAYS_MS = [5_000, 15_000, 30_000] as const;

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.timestamp > TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage may be unavailable in private-browsing or when storage is full
  }
}
