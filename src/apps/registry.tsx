import { lazy } from 'react';
import type { AppDefinition, AppId, DockLink } from '@/os/types';
import {
  AboutIcon,
  AirQualityIcon,
  FilesIcon,
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
  PrivaseeIcon,
  ReaderIcon,
  SettingsIcon,
  TerminalIcon,
} from '@/components/icons';
import { profile } from '@/data/profile';

/**
 * Every app is code-split, so opening the Terminal never downloads the Files
 * bundle. Order here is the order they appear in the dock.
 */
export const APPS: AppDefinition[] = [
  {
    id: 'files',
    title: 'Files',
    icon: FilesIcon,
    component: lazy(() => import('./files/Files')),
    defaultSize: { w: 940, h: 620 },
    minSize: { w: 420, h: 320 },
  },
  {
    id: 'terminal',
    title: 'Terminal',
    icon: TerminalIcon,
    component: lazy(() => import('./terminal/Terminal')),
    defaultSize: { w: 780, h: 480 },
    minSize: { w: 360, h: 240 },
  },
  {
    id: 'about',
    title: 'About',
    icon: AboutIcon,
    component: lazy(() => import('./about/About')),
    defaultSize: { w: 720, h: 600 },
    minSize: { w: 380, h: 340 },
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: SettingsIcon,
    component: lazy(() => import('./settings/Settings')),
    defaultSize: { w: 720, h: 520 },
    minSize: { w: 380, h: 320 },
  },
  {
    id: 'airquality',
    title: 'Air Quality',
    icon: AirQualityIcon,
    component: lazy(() => import('./airquality/AirQuality')),
    defaultSize: { w: 420, h: 420 },
    minSize: { w: 320, h: 300 },
  },
  {
    id: 'reader',
    title: 'Text Editor',
    icon: ReaderIcon,
    component: lazy(() => import('./reader/Reader')),
    defaultSize: { w: 800, h: 580 },
    minSize: { w: 360, h: 300 },
    // Several documents can be open side by side.
    allowMultiple: true,
  },
];

/** Apps shown in the dock. Reader only appears once something opens it. */
export const DOCK_APPS: AppId[] = [
  'files',
  'terminal',
  'about',
  'settings',
  'airquality',
];

/** Dock entries that open a real browser tab instead of a window. */
export const DOCK_LINKS: DockLink[] = [
  {
    id: 'privasee',
    title: 'Privasee',
    icon: PrivaseeIcon,
    href: profile.links.privasee,
  },
  { id: 'github', title: 'GitHub', icon: GitHubIcon, href: profile.links.github },
  { id: 'linkedin', title: 'LinkedIn', icon: LinkedInIcon, href: profile.links.linkedin },
  { id: 'email', title: 'Email', icon: MailIcon, href: `mailto:${profile.links.email}` },
];

const byId = new Map(APPS.map((a) => [a.id, a]));

export function getApp(id: AppId): AppDefinition | undefined {
  return byId.get(id);
}
