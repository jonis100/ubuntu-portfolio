import { useEffect, useRef, useState } from 'react';
import { DOCK_W, TOP_BAR_H, useOS } from '@/os/store';
import { APPS, getApp } from '@/apps/registry';
import Window from './Window';
import Dock from './Dock';
import TopBar from './TopBar';
import Wallpaper from './Wallpaper';
import { HomeFolderIcon } from '@/components/icons';
import type { IconComponent } from '@/os/types';

export default function Desktop() {
  const windows = useOS((s) => s.windows);
  const wallpaper = useOS((s) => s.wallpaper);
  const overviewOpen = useOS((s) => s.overviewOpen);
  const setOverview = useOS((s) => s.setOverview);
  const focusedId = useOS((s) => s.focusedId);
  const close = useOS((s) => s.close);

  // Esc closes the overview, or the focused window when nothing is layered.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (overviewOpen) setOverview(false);
      else if (focusedId) close(focusedId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overviewOpen, focusedId, setOverview, close]);

  return (
    <>
      <Wallpaper id={wallpaper} />
      <TopBar />
      <Dock />
      <DesktopShortcuts />

      {windows.map((win) => (
        <Window key={win.id} win={win} />
      ))}

      {overviewOpen && <ActivitiesOverview />}
    </>
  );
}

type Marquee = { x: number; y: number; w: number; h: number };

/** Do two rectangles overlap at all? */
function intersects(a: Marquee, b: DOMRect): boolean {
  return !(
    a.x + a.w < b.left ||
    a.x > b.right ||
    a.y + a.h < b.top ||
    a.y > b.bottom
  );
}

const SHORTCUTS = ['home', 'terminal', 'about'] as const;

/**
 * Icons on the desktop itself, GNOME-style: double-click (or Enter) to open,
 * click to select, and drag on empty space to rubber-band select — the same
 * marquee you get on a real desktop.
 */
function DesktopShortcuts() {
  const openApp = useOS((s) => s.openApp);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef(new Map<string, HTMLElement>());

  function beginMarquee(e: React.PointerEvent) {
    // Only from empty desktop, and only with the primary button.
    if (e.button !== 0 || e.target !== surfaceRef.current) return;

    const originX = e.clientX;
    const originY = e.clientY;
    setSelected(new Set());

    const onMove = (ev: PointerEvent) => {
      const rect: Marquee = {
        x: Math.min(originX, ev.clientX),
        y: Math.min(originY, ev.clientY),
        w: Math.abs(ev.clientX - originX),
        h: Math.abs(ev.clientY - originY),
      };
      setMarquee(rect);

      const hit = new Set<string>();
      for (const [id, el] of iconRefs.current) {
        if (intersects(rect, el.getBoundingClientRect())) hit.add(id);
      }
      setSelected(hit);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      setMarquee(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  const registerIcon = (id: string) => (el: HTMLElement | null) => {
    if (el) iconRefs.current.set(id, el);
    else iconRefs.current.delete(id);
  };

  return (
    <div
      ref={surfaceRef}
      onPointerDown={beginMarquee}
      className="no-select fixed flex flex-col flex-wrap content-start gap-1 p-4 max-md:hidden"
      style={{ top: TOP_BAR_H, left: DOCK_W, right: 0, bottom: 0 }}
    >
      {SHORTCUTS.map((id) => {
        const def = id === 'home' ? null : getApp(id);
        const icon = id === 'home' ? HomeFolderIcon : def?.icon;
        const label = id === 'home' ? 'Home' : def?.title;
        if (!icon || !label) return null;

        return (
          <Shortcut
            key={id}
            innerRef={registerIcon(id)}
            icon={icon}
            label={label}
            selected={selected.has(id)}
            onSelect={() => setSelected(new Set([id]))}
            onOpen={() => openApp(id === 'home' ? 'files' : id)}
          />
        );
      })}

      {marquee && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[8000] rounded-[2px] border border-accent bg-accent/25"
          style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
        />
      )}
    </div>
  );
}

function Shortcut({
  // Named innerRef rather than ref: React 18 treats `ref` as reserved and will
  // not forward it to a function component without forwardRef.
  innerRef,
  icon: Icon,
  label,
  selected,
  onSelect,
  onOpen,
}: {
  innerRef: (el: HTMLElement | null) => void;
  icon: IconComponent;
  label: string;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  return (
    <button
      ref={innerRef}
      onClick={onSelect}
      onDoubleClick={onOpen}
      // Double-click is the desktop idiom; keyboard users get Enter and Space.
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`flex w-24 flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors focus:outline-none ${
        selected ? 'bg-accent/35 ring-1 ring-accent/70' : 'hover:bg-white/10 focus:bg-white/15'
      }`}
    >
      <Icon className="h-14 w-14 drop-shadow-lg" />
      <span className="text-xs text-white drop-shadow-md">{label}</span>
    </button>
  );
}

/** The Activities overview: an app grid over a dimmed desktop. */
function ActivitiesOverview() {
  const openApp = useOS((s) => s.openApp);
  const setOverview = useOS((s) => s.setOverview);

  return (
    <div
      className="fixed inset-0 z-[9500] flex items-center justify-center bg-black/65 backdrop-blur-md"
      onClick={() => setOverview(false)}
      style={{ paddingTop: TOP_BAR_H }}
    >
      <div
        className="grid max-w-3xl grid-cols-3 gap-6 p-8 sm:grid-cols-4"
        onClick={(e) => e.stopPropagation()}
      >
        {APPS.filter((a) => a.id !== 'reader').map((app) => (
          <button
            key={app.id}
            onClick={() => openApp(app.id)}
            className="flex flex-col items-center gap-2 rounded-xl p-4 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <app.icon className="h-16 w-16 drop-shadow-lg" />
            <span className="text-sm text-white">{app.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
