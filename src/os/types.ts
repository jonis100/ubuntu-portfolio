import type { ComponentType, FC, LazyExoticComponent } from 'react';

export type IconComponent = FC<{ className?: string }>;

/** Identifiers for everything that can live in the dock. */
export type AppId =
  | 'files'
  | 'terminal'
  | 'about'
  | 'settings'
  | 'reader'
  | 'airquality';

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Props every app component receives. `winId` lets an app talk to its own
 * window (the Terminal closes itself on Ctrl+D); `payload` carries
 * app-specific launch arguments — the Reader uses it to know which VFS path
 * to open.
 */
export type AppProps = {
  winId: string;
  payload?: unknown;
};

export type AppDefinition = {
  id: AppId;
  /** Shown in the headerbar, the dock tooltip and the Activities overview. */
  title: string;
  icon: IconComponent;
  component: LazyExoticComponent<ComponentType<AppProps>>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  /** Apps like Reader can have several windows open at once. */
  allowMultiple?: boolean;
};

/**
 * A dock entry that is not an app: clicking it opens an external URL in a new
 * tab rather than spawning a window.
 */
export type DockLink = {
  id: string;
  title: string;
  icon: IconComponent;
  href: string;
};

export type WindowState = {
  id: string;
  appId: AppId;
  title: string;
  payload?: unknown;
  z: number;
  minimized: boolean;
  /** 'none' while floating; the others are GNOME's snap states. */
  snap: 'none' | 'max' | 'left' | 'right';
  /** Live geometry when floating. */
  rect: Rect;
  /** Geometry to restore to when un-snapping. */
  restoreRect: Rect;
};

export type Theme = 'dark' | 'light';

export type Session = 'booting' | 'login' | 'desktop';
