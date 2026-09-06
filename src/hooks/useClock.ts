import { useEffect, useState } from 'react';

/** Ticks once a minute — the top-bar clock has no seconds, so neither do we. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Align the first tick to the top of the next minute, then tick steadily.
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      setNow(new Date());
      interval = window.setInterval(() => setNow(new Date()), 60_000);
    }, msToNextMinute);

    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return now;
}

export function formatTopBarClock(d: Date): string {
  // Matches the real GNOME 46 top bar: "Sep 4  11:23".
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}  ${time}`;
}
