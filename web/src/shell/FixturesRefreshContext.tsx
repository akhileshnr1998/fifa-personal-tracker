import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface FixturesRefreshContextValue {
  requestRefresh: () => Promise<void>;
  isRefreshing: boolean;
  setRefreshHandler: (handler: (() => Promise<void>) | null) => void;
}

const FixturesRefreshContext = createContext<FixturesRefreshContextValue | null>(
  null,
);

export function FixturesRefreshProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<(() => Promise<void>) | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setRefreshHandler = useCallback(
    (handler: (() => Promise<void>) | null) => {
      handlerRef.current = handler;
    },
    [],
  );

  const requestRefresh = useCallback(async () => {
    if (!handlerRef.current || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await handlerRef.current();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const value = useMemo(
    () => ({ requestRefresh, isRefreshing, setRefreshHandler }),
    [requestRefresh, isRefreshing, setRefreshHandler],
  );

  return (
    <FixturesRefreshContext.Provider value={value}>
      {children}
    </FixturesRefreshContext.Provider>
  );
}

export function useFixturesRefresh(): FixturesRefreshContextValue {
  const context = useContext(FixturesRefreshContext);
  if (!context) {
    throw new Error('useFixturesRefresh must be used within FixturesRefreshProvider');
  }
  return context;
}
