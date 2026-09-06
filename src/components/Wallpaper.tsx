/**
 * Wallpapers.
 *
 * "Noble Numbat" reproduces the colour and light of the Ubuntu 24.04 desktop —
 * aubergine field, a soft diagonal band, and a warm glow in the bottom-right —
 * as an original gradient generated at build time. The Ubuntu crown emblem is
 * deliberately left out: the palette is what makes it read as Ubuntu, and
 * omitting the artwork keeps the asset entirely our own. The others are CSS
 * gradients.
 */
export type WallpaperDef = {
  id: string;
  label: string;
  /** Either a bitmap in public/wallpapers, or a CSS background-image value. */
  image?: string;
  css?: string;
  /** Painted behind the image so there is never a white flash while it loads. */
  base: string;
};

export const WALLPAPERS: WallpaperDef[] = [
  {
    id: 'noble',
    label: 'Noble Numbat',
    image: 'wallpapers/noble.webp',
    base: '#4a1036',
  },
  {
    id: 'aubergine',
    label: 'Aubergine',
    css: `radial-gradient(100% 80% at 50% 0%, #5e2750 0%, rgba(94,39,80,0) 60%),
          linear-gradient(160deg, #2c001e 0%, #4a1338 55%, #12060f 100%)`,
    base: '#2c001e',
  },
  {
    id: 'slate',
    label: 'Slate',
    css: `radial-gradient(120% 90% at 20% 15%, #2f4858 0%, rgba(47,72,88,0) 55%),
          linear-gradient(150deg, #10161c 0%, #1d2a33 50%, #0a0e12 100%)`,
    base: '#10161c',
  },
];

export function getWallpaper(id: string): WallpaperDef {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
}

/** Inline style for a wallpaper, usable for both the desktop and previews. */
export function wallpaperStyle(id: string): React.CSSProperties {
  const w = getWallpaper(id);
  return {
    backgroundColor: w.base,
    // Image paths are relative to BASE_URL: the site is served from a subpath
    // (shieber.net/yoni/portfolio/), where a leading slash would 404.
    backgroundImage: w.image ? `url(${import.meta.env.BASE_URL}${w.image})` : w.css,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

export default function Wallpaper({ id }: { id: string }) {
  return <div className="fixed inset-0 -z-10" style={wallpaperStyle(id)} aria-hidden="true" />;
}
