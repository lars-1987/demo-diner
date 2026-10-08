import { useEffect, useState } from 'react';

/** Milliseconds left until `target` (ISO date), ticking every second. 0 once passed. */
export function useCountdown(target: string | undefined): number {
  const [now, setNow] = useState(Date.now);
  const remaining = target ? Math.max(0, Date.parse(target) - now) : 0;
  const running = remaining > 0;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  return remaining;
}

/** 892_000 → "14:52" */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
