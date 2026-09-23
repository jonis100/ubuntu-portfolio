import { useEffect, useRef, useState } from 'react';
import {
  SENSOR_ID,
  SENSOR_URL,
  loadWidgetScript,
  mountWidget,
} from './purpleair';

type Status = 'loading' | 'ready' | 'error';

export default function AirQuality() {
  const slot = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!slot.current) return;

    // Borrow the shared widget node for as long as this window is open. See
    // purpleair.ts for why it outlives the window.
    const release = mountWidget(slot.current);

    let cancelled = false;
    loadWidgetScript().then(
      () => !cancelled && setStatus('ready'),
      () => !cancelled && setStatus('error'),
    );

    return () => {
      cancelled = true;
      release();
    };
  }, []);

  return (
    <div className="scroll-thin h-full overflow-y-auto bg-bg px-6 py-6 text-ink">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <h2 className="text-lg font-medium">Air Quality</h2>
        <p className="mt-1 text-xs leading-relaxed text-faint">
          Live from my own PurpleAir sensor (#{SENSOR_ID}). The number is the US
          EPA Air Quality Index over the last 10 minutes — lower is cleaner, and
          the colour is the EPA's own scale.
        </p>

        {/*
          The widget paints the EPA colour scale, which is the whole point of
          it, so it needs a light ground of its own — on the dark Yaru
          background it would otherwise read as a pasted-on blob. The slot stays
          mounted in every state: the widget node is attached to it before the
          script has finished loading.
        */}
        <div
          className={`mt-5 w-full rounded-lg border border-edge bg-white p-3 ${
            status === 'ready' ? '' : 'hidden'
          }`}
        >
          <div ref={slot} className="flex justify-center" />
        </div>

        {status === 'loading' && (
          <p className="mt-5 text-sm text-dim">Contacting sensor…</p>
        )}

        {status === 'error' && (
          <p className="mt-5 text-sm leading-relaxed text-dim">
            Couldn't reach PurpleAir — the widget is blocked or the network is
            offline. The sensor itself is still reporting.
          </p>
        )}

        <a
          href={SENSOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 rounded-md border border-edge px-4 py-2 text-sm text-dim transition-colors hover:bg-surface-2 hover:text-ink"
        >
          View on the PurpleAir map ↗
        </a>
      </div>
    </div>
  );
}
