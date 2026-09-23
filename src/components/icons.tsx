/**
 * App icons.
 *
 * The desktop-app icons are the *real* Yaru icons, copied from the
 * `yaru-theme-icon` package installed on Ubuntu 24.04 (see public/icons/).
 * They are CC-BY-SA-4.0, © Sam Hewitt — attribution is in the About app and
 * the README. Hand-drawing approximations looked wrong next to the real thing.
 * Privasee uses its own company mark.
 *
 * Brand marks (GitHub, LinkedIn) stay as inline SVG because they are not part
 * of the icon theme and must match their own brand guidelines.
 */
import type { IconComponent } from '@/os/types';

/**
 * Wraps a Yaru PNG as an icon component. The icons are decorative: every
 * button that uses one carries its own accessible name and tooltip.
 */
function yaru(file: string): IconComponent {
  const Icon: IconComponent = ({ className }) => (
    // BASE_URL, not a leading slash: the site is served from a subpath
    // (shieber.net/yoni/portfolio/), so absolute asset URLs would 404.
    <img
      src={`${import.meta.env.BASE_URL}icons/${file}`}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
    />
  );
  Icon.displayName = `Yaru(${file})`;
  return Icon;
}

export const FilesIcon = yaru('files.png');
export const TerminalIcon = yaru('terminal.png');
export const SettingsIcon = yaru('settings.png');
export const ReaderIcon = yaru('reader.png');
export const FolderIcon = yaru('folder.png');
export const HomeFolderIcon = yaru('home.png');
export const FileIcon = yaru('file.png');
export const TrashIcon = yaru('trash.png');
export const UbuntuLogoIcon = yaru('ubuntu-logo.png');
export const AboutIcon = yaru('avatar.png');
export const AirQualityIcon = yaru('weather.png');

/**
 * Privasee — Yoni's venture. The real company mark, taken from the Privasee
 * LinkedIn page (linkedin.com/company/yourprivasee). The wordmark is dropped
 * because it is illegible at dock size; the arcs-and-dot mark alone is used.
 */
export const PrivaseeIcon = yaru('privasee.png');

export const GitHubIcon: IconComponent = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <rect width="48" height="48" rx="10" fill="#1c1c1c" />
    <path
      fill="#ffffff"
      d="M24 8c-8.8 0-16 7.2-16 16 0 7.1 4.6 13.1 10.9 15.2.8.15 1.1-.35 1.1-.77v-2.7c-4.5.97-5.4-2.15-5.4-2.15-.73-1.86-1.79-2.36-1.79-2.36-1.46-1 .11-.98.11-.98 1.62.11 2.47 1.66 2.47 1.66 1.44 2.46 3.77 1.75 4.69 1.34.15-1.04.56-1.75 1.02-2.15-3.6-.41-7.38-1.8-7.38-8 0-1.77.63-3.21 1.66-4.35-.17-.41-.72-2.06.16-4.28 0 0 1.36-.44 4.45 1.66a15.4 15.4 0 0 1 8.1 0c3.09-2.1 4.45-1.66 4.45-1.66.88 2.22.33 3.87.16 4.28 1.03 1.14 1.66 2.58 1.66 4.35 0 6.22-3.79 7.58-7.4 7.98.58.5 1.1 1.49 1.1 3v4.44c0 .43.29.93 1.11.77C35.4 37.1 40 31.1 40 24c0-8.8-7.2-16-16-16z"
    />
  </svg>
);

export const LinkedInIcon: IconComponent = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <rect width="48" height="48" rx="10" fill="#0a66c2" />
    <path
      fill="#ffffff"
      d="M17.6 37h-5.2V20.3h5.2zM15 18a3 3 0 1 1 0-6.1 3 3 0 0 1 0 6.1zM37 37h-5.2v-8.1c0-1.9 0-4.4-2.7-4.4s-3.1 2.1-3.1 4.3V37h-5.2V20.3h5v2.3h.1a5.5 5.5 0 0 1 4.9-2.7c5.3 0 6.2 3.5 6.2 8z"
    />
  </svg>
);

export const MailIcon: IconComponent = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <rect width="48" height="48" rx="10" fill="#3c3b37" />
    <rect x="9" y="14" width="30" height="20" rx="3" fill="#f6f5f4" />
    <path d="M9.8 16.4L24 26l14.2-9.6" stroke="#e95420" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
