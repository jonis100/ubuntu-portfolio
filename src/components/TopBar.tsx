import { useEffect, useRef, useState } from 'react';
import { TOP_BAR_H, useOS } from '@/os/store';
import { formatTopBarClock, useClock } from '@/hooks/useClock';
import { profile } from '@/data/profile';

/**
 * The GNOME top bar. It stays dark in both themes, as it does on real Ubuntu.
 */
export default function TopBar() {
  const now = useClock();
  const overviewOpen = useOS((s) => s.overviewOpen);
  const setOverview = useOS((s) => s.setOverview);
  const theme = useOS((s) => s.theme);
  const setTheme = useOS((s) => s.setTheme);
  const setSession = useOS((s) => s.setSession);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click-away and Escape both dismiss the quick-settings menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header
      className="no-select fixed inset-x-0 top-0 z-[10000] flex items-center justify-between bg-[#1e1e1e] px-2 text-[13px] text-white/90"
      style={{ height: TOP_BAR_H }}
    >
      <button
        aria-label="Activities"
        title="Activities"
        onClick={() => setOverview(!overviewOpen)}
        className={`flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors hover:bg-white/10 ${
          overviewOpen ? 'bg-white/15' : ''
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white/45" />
        <span className="h-1.5 w-6 rounded-full bg-white/90" />
      </button>

      {/* GNOME puts a calendar behind the clock; there is nothing to show in
          one here, so this is a label rather than a control. */}
      <span className="absolute left-1/2 -translate-x-1/2 px-3 py-1 font-medium tabular-nums">
        {formatTopBarClock(now)}
      </span>

      <div className="relative" ref={menuRef}>
        <button
          aria-label="System menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className={`flex items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-white/10 ${
            menuOpen ? 'bg-white/15' : ''
          }`}
        >
          <span className="text-[12px] text-white/80">en</span>
          <NetworkGlyph />
          <BluetoothGlyph />
          <VolumeGlyph />
          <BatteryGlyph />
          <span className="text-[12px] tabular-nums text-white/80">100%</span>
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
            <path d="M4 6l4 4 4-4z" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+6px)] w-72 overflow-hidden rounded-xl border border-edge bg-header p-2 text-ink shadow-[0_18px_50px_var(--yaru-shadow)]">
            <div className="flex gap-2 p-1">
              <QuickToggle
                active={theme === 'dark'}
                label={theme === 'dark' ? 'Dark Style' : 'Light Style'}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              />
              {/* Decorative, like the battery and volume readouts. */}
              <QuickToggle active label="Wi-Fi" onClick={() => {}} />
            </div>

            <div className="px-2 py-3">
              <label className="mb-1 block text-xs text-dim" htmlFor="volume">
                Volume
              </label>
              <input
                id="volume"
                type="range"
                defaultValue={72}
                className="w-full accent-[#e95420]"
              />
            </div>

            <div className="my-1 h-px bg-edge" />

            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-sm text-dim">{profile.username}@{profile.hostname}</span>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setSession('login');
                }}
                className="rounded-md px-3 py-1.5 text-sm text-dim transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function QuickToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
        active ? 'bg-accent text-white' : 'bg-surface-2 text-dim hover:bg-edge'
      }`}
    >
      {label}
    </button>
  );
}

const NetworkGlyph = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M8 13.5l-1.6-2A2.6 2.6 0 0 1 8 11c.6 0 1.2.2 1.6.5zM4.6 9.3l-1.3-1.6A7.5 7.5 0 0 1 8 6c1.8 0 3.4.6 4.7 1.7l-1.3 1.6A5.5 5.5 0 0 0 8 8c-1.3 0-2.5.5-3.4 1.3zM1.9 6l-1.3-1.6A11.4 11.4 0 0 1 8 2c2.9 0 5.5 1 7.4 2.4L14.1 6A9.4 9.4 0 0 0 8 4a9.4 9.4 0 0 0-6.1 2z" />
  </svg>
);

const BluetoothGlyph = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    <path d="M5 4.5L11 11l-3 2.5v-11L11 5 5 11.5" />
  </svg>
);

const VolumeGlyph = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M8 2.5v11l-3.5-3H2a.5.5 0 0 1-.5-.5v-4A.5.5 0 0 1 2 5.5h2.5z" />
    <path d="M10.5 5.6a3.2 3.2 0 0 1 0 4.8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
  </svg>
);

const BatteryGlyph = () => (
  <svg viewBox="0 0 22 16" className="h-4 w-5" fill="none" aria-hidden="true">
    <rect x="1" y="4" width="17" height="8" rx="2.2" stroke="currentColor" strokeWidth="1.3" />
    <rect x="2.8" y="5.8" width="11" height="4.4" rx="1" fill="currentColor" />
    <path d="M19.6 6.8v2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
