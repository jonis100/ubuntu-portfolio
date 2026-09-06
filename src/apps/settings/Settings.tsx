import { useOS } from '@/os/store';
import { WALLPAPERS, wallpaperStyle } from '@/components/Wallpaper';

export default function Settings() {
  const theme = useOS((s) => s.theme);
  const setTheme = useOS((s) => s.setTheme);
  const wallpaper = useOS((s) => s.wallpaper);
  const setWallpaper = useOS((s) => s.setWallpaper);
  const resetDesktop = useOS((s) => s.resetDesktop);

  return (
    <div className="scroll-thin h-full overflow-y-auto bg-bg px-6 py-6 text-ink">
      <div className="mx-auto max-w-lg space-y-8">
        <Group title="Appearance" hint="Switches the Yaru theme, as GNOME's Appearance panel does.">
          <div className="grid grid-cols-2 gap-3">
            {(['dark', 'light'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                className={`rounded-lg border-2 p-3 text-left transition-colors ${
                  theme === option ? 'border-accent' : 'border-edge hover:border-faint'
                }`}
              >
                <div
                  className={`mb-2 h-16 rounded ${
                    option === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#fafafa]'
                  } border border-edge`}
                >
                  <div
                    className={`h-3 rounded-t ${
                      option === 'dark' ? 'bg-[#303030]' : 'bg-[#f6f5f4]'
                    }`}
                  />
                </div>
                <span className="text-sm capitalize">{option}</span>
              </button>
            ))}
          </div>
        </Group>

        <Group title="Background">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {WALLPAPERS.map((paper) => (
              <button
                key={paper.id}
                onClick={() => setWallpaper(paper.id)}
                className={`overflow-hidden rounded-lg border-2 transition-colors ${
                  wallpaper === paper.id ? 'border-accent' : 'border-edge hover:border-faint'
                }`}
              >
                <div className="h-20" style={wallpaperStyle(paper.id)} />
                <span className="block px-2 py-1.5 text-left text-xs text-dim">{paper.label}</span>
              </button>
            ))}
          </div>
        </Group>

        <Group title="Session">
          <button
            onClick={resetDesktop}
            className="rounded-md border border-edge px-4 py-2 text-sm text-dim transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Reset desktop
          </button>
          <p className="mt-2 text-xs text-faint">
            Closes every window and restores the default theme and background.
          </p>
        </Group>
      </div>
    </div>
  );
}

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-faint">{title}</h2>
      {hint && <p className="mb-3 text-xs text-faint">{hint}</p>}
      <div className={hint ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}
