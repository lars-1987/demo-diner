import { useEffect, useState } from 'react';

/**
 * The current time as state, refreshed on an interval. Keeps render pure and
 * lets derived offer statuses (e.g. "expired") update while a screen is open.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
