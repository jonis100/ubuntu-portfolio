import { Suspense, useRef, useState } from 'react';
import {
  TOP_BAR_H,
  effectiveRect,
  snapRect,
  useOS,
  workArea,
} from '@/os/store';
import type { Rect, WindowState } from '@/os/types';
import { getApp } from '@/apps/registry';
import { useIsMobile } from '@/hooks/useIsMobile';

/** How close to an edge the pointer must get before a snap zone arms. */
const SNAP_EDGE = 12;

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const RESIZE_HANDLES: { dir: ResizeDir; className: string; cursor: string }[] = [
  { dir: 'n', className: 'top-0 left-3 right-3 h-1.5', cursor: 'ns-resize' },
  { dir: 's', className: 'bottom-0 left-3 right-3 h-1.5', cursor: 'ns-resize' },
  { dir: 'w', className: 'left-0 top-3 bottom-3 w-1.5', cursor: 'ew-resize' },
  { dir: 'e', className: 'right-0 top-3 bottom-3 w-1.5', cursor: 'ew-resize' },
  { dir: 'nw', className: 'top-0 left-0 w-3 h-3', cursor: 'nwse-resize' },
  { dir: 'ne', className: 'top-0 right-0 w-3 h-3', cursor: 'nesw-resize' },
  { dir: 'sw', className: 'bottom-0 left-0 w-3 h-3', cursor: 'nesw-resize' },
  { dir: 'se', className: 'bottom-0 right-0 w-3 h-3', cursor: 'nwse-resize' },
];

/** Follow the pointer until it is released, then run `onEnd` exactly once. */
function trackPointer(onMove: (e: PointerEvent) => void, onEnd: () => void) {
  const end = () => {
    window.removeEventListener('pointermove', onMove);
    onEnd();
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', end, { once: true });
}

export default function Window({ win }: { win: WindowState }) {
  const focus = useOS((s) => s.focus);
  const close = useOS((s) => s.close);
  const minimize = useOS((s) => s.minimize);
  const toggleMaximize = useOS((s) => s.toggleMaximize);
  const setRect = useOS((s) => s.setRect);
  const setSnap = useOS((s) => s.setSnap);
  const focused = useOS((s) => s.focusedId === win.id);
  const ref = useRef<HTMLDivElement>(null);
  const [snapPreview, setSnapPreview] = useState<WindowState['snap'] | null>(null);

  const def = getApp(win.appId);
  const isMobile = useIsMobile();
  // A snapped window's geometry comes from the live work area, so subscribing
  // to the viewport is what makes it follow a browser resize.
  useOS((s) => s.viewport);
  const rect = effectiveRect(win);

  /**
   * Gestures write straight to the DOM node and only commit to the store on
   * pointerup. Re-rendering React on every pointermove makes dragging feel
   * heavy once a couple of windows are open.
   */
  function applyLive(r: Rect) {
    const el = ref.current;
    if (!el) return;
    el.style.left = `${r.x}px`;
    el.style.top = `${r.y}px`;
    el.style.width = `${r.w}px`;
    el.style.height = `${r.h}px`;
  }

  function beginDrag(e: React.PointerEvent) {
    if (isMobile || e.button !== 0) return;
    focus(win.id);

    const area = workArea();
    let origin = effectiveRect(win);

    // Dragging a snapped window tears it loose and re-centres it on the cursor,
    // the way GNOME does.
    if (win.snap !== 'none') {
      const restore = win.restoreRect;
      origin = {
        x: e.clientX - restore.w / 2,
        y: e.clientY - 16,
        w: restore.w,
        h: restore.h,
      };
      setSnap(win.id, 'none');
      setRect(win.id, origin);
    }

    const startX = e.clientX;
    const startY = e.clientY;
    let live = origin;
    let pending: WindowState['snap'] = 'none';

    trackPointer(
      (ev) => {
        live = {
          ...origin,
          x: origin.x + (ev.clientX - startX),
          // Never let the headerbar go under the top bar and become ungrabbable.
          y: Math.max(TOP_BAR_H, origin.y + (ev.clientY - startY)),
        };
        applyLive(live);

        const next: WindowState['snap'] =
          ev.clientY <= TOP_BAR_H + SNAP_EDGE
            ? 'max'
            : ev.clientX <= area.x + SNAP_EDGE
              ? 'left'
              : ev.clientX >= window.innerWidth - SNAP_EDGE
                ? 'right'
                : 'none';
        if (next !== pending) {
          pending = next;
          setSnapPreview(next === 'none' ? null : next);
        }
      },
      () => {
        setSnapPreview(null);
        setRect(win.id, live);
        if (pending !== 'none') setSnap(win.id, pending);
      },
    );
  }

  function beginResize(e: React.PointerEvent, dir: ResizeDir) {
    if (isMobile || e.button !== 0) return;
    e.stopPropagation();
    focus(win.id);
    if (win.snap !== 'none') setSnap(win.id, 'none');

    const origin = effectiveRect(win);
    const min = def?.minSize ?? { w: 320, h: 240 };
    const startX = e.clientX;
    const startY = e.clientY;
    let live = origin;

    trackPointer(
      (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let { x, y, w, h } = origin;

        if (dir.includes('e')) w = Math.max(min.w, origin.w + dx);
        if (dir.includes('s')) h = Math.max(min.h, origin.h + dy);
        if (dir.includes('w')) {
          w = Math.max(min.w, origin.w - dx);
          x = origin.x + (origin.w - w);
        }
        if (dir.includes('n')) {
          h = Math.max(min.h, origin.h - dy);
          y = Math.max(TOP_BAR_H, origin.y + (origin.h - h));
        }

        live = { x, y, w, h };
        applyLive(live);
      },
      () => setRect(win.id, live),
    );
  }

  if (win.minimized) return null;

  const AppComponent = def?.component;
  const preview = snapPreview ? snapRect(snapPreview) : null;

  return (
    <>
      {/* Translucent hint showing where the window will land if dropped. */}
      {preview && (
        <div
          className="pointer-events-none fixed z-[9999] rounded-lg border-2 border-accent/70 bg-accent/20 transition-all duration-100"
          style={{ left: preview.x, top: preview.y, width: preview.w, height: preview.h }}
        />
      )}

      <div
        ref={ref}
        role="dialog"
        aria-label={win.title}
        aria-modal={false}
        onPointerDown={() => focus(win.id)}
        className={`fixed flex flex-col overflow-hidden bg-surface text-ink ${
          win.snap === 'none' ? 'rounded-xl' : 'rounded-none'
        } ${
          focused
            ? 'shadow-[0_18px_50px_var(--yaru-shadow)] ring-1 ring-black/40'
            : 'shadow-[0_8px_24px_var(--yaru-shadow)] ring-1 ring-black/25'
        }`}
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          zIndex: win.z,
        }}
      >
        {/* GNOME headerbar */}
        <div
          onPointerDown={beginDrag}
          onDoubleClick={() => !isMobile && toggleMaximize(win.id)}
          className={`no-select relative flex h-11 shrink-0 items-center justify-between gap-2 border-b border-edge px-2 ${
            focused ? 'bg-header' : 'bg-header-inactive'
          } ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`}
        >
          <div className="flex min-w-0 items-center gap-2 pl-1">
            {def && <def.icon className="h-5 w-5 shrink-0" />}
          </div>

          <div
            className={`pointer-events-none absolute inset-x-0 truncate px-24 text-center text-sm font-medium ${
              focused ? 'text-ink' : 'text-faint'
            }`}
          >
            {win.title}
          </div>

          <div className="z-10 flex items-center gap-1.5">
            {!isMobile && (
              <>
                <WindowButton label={`Minimise ${win.title}`} onClick={() => minimize(win.id)}>
                  <path d="M4 9.5h11" />
                </WindowButton>
                <WindowButton
                  label={`${win.snap === 'max' ? 'Restore' : 'Maximise'} ${win.title}`}
                  onClick={() => toggleMaximize(win.id)}
                >
                  <rect x="5" y="5" width="9" height="9" rx="1.5" />
                </WindowButton>
              </>
            )}
            <WindowButton label={`Close ${win.title}`} onClick={() => close(win.id)}>
              <path d="M5.5 5.5l8 8M13.5 5.5l-8 8" />
            </WindowButton>
          </div>
        </div>

        {/* App content */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <Suspense fallback={<WindowLoading />}>
            {AppComponent ? (
              <AppComponent winId={win.id} payload={win.payload} />
            ) : (
              <div className="p-6 text-dim">Application not found.</div>
            )}
          </Suspense>
        </div>

        {!isMobile &&
          win.snap === 'none' &&
          RESIZE_HANDLES.map((h) => (
            <div
              key={h.dir}
              onPointerDown={(e) => beginResize(e, h.dir)}
              className={`absolute ${h.className}`}
              style={{ cursor: h.cursor }}
            />
          ))}
      </div>
    </>
  );
}

function WindowButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      // Stop the pointerdown reaching the headerbar and starting a drag.
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-dim transition-colors hover:bg-edge hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <svg viewBox="0 0 19 19" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        {children}
      </svg>
    </button>
  );
}

function WindowLoading() {
  return (
    <div className="grid h-full place-items-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-edge border-t-accent" />
    </div>
  );
}
