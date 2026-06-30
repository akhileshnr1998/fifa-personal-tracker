import { useCallback, useEffect, useRef, useState } from 'react';

const IDLE_MS = 700;

export function useAutoHideScrollbar() {
  const [scrollbarsVisible, setScrollbarsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onScroll = useCallback(() => {
    setScrollbarsVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setScrollbarsVisible(false), IDLE_MS);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { scrollbarsVisible, onScroll };
}
