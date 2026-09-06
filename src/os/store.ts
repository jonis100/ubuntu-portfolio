import { create } from 'zustand';
import type { AppId, Rect, Session, Theme, WindowState } from './types';
import { getApp } from '@/apps/registry';

/** GNOME shell chrome dimensions. The work area is the screen minus these. */
export const TOP_BAR_H = 32;
export const DOCK_W = 72;
/** On phones the dock becomes a bottom bar of this height. */
export const DOCK_H_MOBILE = 64;
/** Below this width the window manager is bypassed for a single-app phone UI. */
export const MOBILE_BREAKPOINT = 768;

let seq = 0;
const nextId = () => `win-${++seq}`;

/** The rectangle windows may occupy: viewport minus the top bar and dock. */
export function workArea(): Rect {
  const mobile = window.innerWidth < MOBILE_BREAKPOINT;
  return {
    x: mobile ? 0 : DOCK_W,
    y: TOP_BAR_H,
    w: window.innerWidth - (mobile ? 0 : DOCK_W),
    h: window.innerHeight - TOP_BAR_H - (mobile ? DOCK_H_MOBILE : 0),
  };
}

/**
 * New windows cascade from the work-area origin so a second window never lands
 * exactly on the first, and are clamped so they always open fully on screen.
 */
function placeWindow(w: number, h: number, openCount: number): Rect {
  const area = workArea();
  const width = Math.min(w, area.w - 32);
  const height = Math.min(h, area.h - 32);
  const step = (openCount % 6) * 28;
  const x = area.x + Math.max(16, (area.w - width) / 2 - 60) + step;
  const y = area.y + Math.max(16, (area.h - height) / 2 - 40) + step;
  return {
    x: Math.min(x, area.x + area.w - width - 16),
    y: Math.min(y, area.y + area.h - height - 16),
    w: width,
    h: height,
  };
}

/** Geometry for each snap state, derived from the live work area. */
export function snapRect(snap: WindowState['snap']): Rect {
  const a = workArea();
  switch (snap) {
    case 'left':
      return { x: a.x, y: a.y, w: a.w / 2, h: a.h };
    case 'right':
      return { x: a.x + a.w / 2, y: a.y, w: a.w / 2, h: a.h };
    default:
      return a;
  }
}

/** The rect a window actually renders at, accounting for its snap state. */
export function effectiveRect(win: WindowState): Rect {
  return win.snap === 'none' ? win.rect : snapRect(win.snap);
}

/** The window that should take focus once `id` is closed or minimised. */
function nextFocused(windows: WindowState[], id: string): string | null {
  return (
    windows
      .filter((w) => w.id !== id && !w.minimized)
      .reduce<WindowState | null>((top, w) => (!top || w.z > top.z ? w : top), null)?.id ?? null
  );
}

type OSState = {
  session: Session;
  windows: WindowState[];
  focusedId: string | null;
  theme: Theme;
  wallpaper: string;
  overviewOpen: boolean;
  topZ: number;
  /** Bumped on every resize so geometry derived from workArea() re-renders. */
  viewport: { w: number; h: number };

  setSession: (s: Session) => void;
  openApp: (appId: AppId, payload?: unknown, title?: string) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  /** Dock click: raise, or restore if minimised, or minimise if already focused. */
  toggleFromDock: (appId: AppId) => void;
  setSnap: (id: string, snap: WindowState['snap']) => void;
  toggleMaximize: (id: string) => void;
  setRect: (id: string, rect: Rect) => void;
  setTheme: (t: Theme) => void;
  setWallpaper: (w: string) => void;
  setOverview: (open: boolean) => void;
  setViewport: (w: number, h: number) => void;
  resetDesktop: () => void;
};

const THEME_KEY = 'yoni-os:theme';
const WALL_KEY = 'yoni-os:wallpaper';

/** localStorage is unavailable in some embeds; never let that break boot. */
function readStored<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}
function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode — the setting just won't persist */
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export const useOS = create<OSState>((set, get) => ({
  session: 'booting',
  windows: [],
  focusedId: null,
  theme: readStored<Theme>(THEME_KEY, 'dark'),
  wallpaper: readStored(WALL_KEY, 'noble'),
  overviewOpen: false,
  topZ: 10,
  viewport: { w: window.innerWidth, h: window.innerHeight },

  setSession: (session) => set({ session }),

  openApp: (appId, payload, title) => {
    const def = getApp(appId);
    if (!def) return;

    set({ overviewOpen: false });

    // Single-instance apps re-focus rather than opening a duplicate. focus()
    // also raises the window and restores it if it was minimised.
    if (!def.allowMultiple) {
      const existing = get().windows.find((w) => w.appId === appId);
      if (existing) {
        get().focus(existing.id);
        return;
      }
    }

    const rect = placeWindow(
      def.defaultSize.w,
      def.defaultSize.h,
      get().windows.length,
    );
    const z = get().topZ + 1;
    const id = nextId();

    set((s) => ({
      topZ: z,
      focusedId: id,
      windows: [
        ...s.windows,
        {
          id,
          appId,
          title: title ?? def.title,
          payload,
          z,
          minimized: false,
          // Phones get one full-screen app at a time; no floating windows.
          snap: window.innerWidth < MOBILE_BREAKPOINT ? 'max' : 'none',
          rect,
          restoreRect: rect,
        },
      ],
    }));
  },

  close: (id) =>
    set((s) => {
      const windows = s.windows.filter((w) => w.id !== id);
      return {
        windows,
        focusedId: s.focusedId === id ? nextFocused(windows, id) : s.focusedId,
      };
    }),

  focus: (id) =>
    set((s) => {
      if (s.focusedId === id && !s.windows.find((w) => w.id === id)?.minimized) {
        return s;
      }
      const z = s.topZ + 1;
      return {
        topZ: z,
        focusedId: id,
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, z, minimized: false } : w,
        ),
      };
    }),

  minimize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w,
      ),
      focusedId:
        s.focusedId === id ? nextFocused(s.windows, id) : s.focusedId,
    })),

  toggleFromDock: (appId) => {
    const wins = get().windows.filter((w) => w.appId === appId);
    if (wins.length === 0) {
      get().openApp(appId);
      return;
    }
    const top = wins.reduce((a, b) => (b.z > a.z ? b : a));
    if (!top.minimized && get().focusedId === top.id) get().minimize(top.id);
    else get().focus(top.id);
  },

  setSnap: (id, snap) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        // Leaving the floating state: remember where to restore to.
        const restoreRect = w.snap === 'none' ? w.rect : w.restoreRect;
        return snap === 'none'
          ? { ...w, snap, rect: w.restoreRect }
          : { ...w, snap, restoreRect };
      }),
    })),

  toggleMaximize: (id) => {
    const w = get().windows.find((x) => x.id === id);
    if (!w) return;
    get().setSnap(id, w.snap === 'max' ? 'none' : 'max');
  },

  setRect: (id, rect) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, rect } : w)),
    })),

  setTheme: (theme) => {
    applyTheme(theme);
    writeStored(THEME_KEY, theme);
    set({ theme });
  },

  setWallpaper: (wallpaper) => {
    writeStored(WALL_KEY, wallpaper);
    set({ wallpaper });
  },

  setOverview: (overviewOpen) => set({ overviewOpen }),

  setViewport: (w, h) => set({ viewport: { w, h } }),

  resetDesktop: () => {
    get().setTheme('dark');
    get().setWallpaper('noble');
    set({ windows: [], focusedId: null, overviewOpen: false, topZ: 10 });
  },
}));
