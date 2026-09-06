import { useOS } from '@/os/store';
import { DOCK_APPS, DOCK_LINKS, getApp } from '@/apps/registry';
import { TrashIcon, UbuntuLogoIcon } from '@/components/icons';
import type { AppId, IconComponent } from '@/os/types';

/**
 * Ubuntu's dash-to-dock. Matching the real thing: a translucent panel, ~44px
 * icons, a small orange run-indicator dot on the left edge of each running app,
 * a separator above Trash, and the Ubuntu logo (not a 3x3 grid) at the bottom
 * for Show Applications. Collapses to a bottom bar on phones.
 */
export default function Dock() {
  const windows = useOS((s) => s.windows);
  const focusedId = useOS((s) => s.focusedId);
  const toggleFromDock = useOS((s) => s.toggleFromDock);
  const overviewOpen = useOS((s) => s.overviewOpen);
  const setOverview = useOS((s) => s.setOverview);

  const runState = (appId: AppId) => {
    const wins = windows.filter((w) => w.appId === appId);
    if (wins.length === 0) return 'closed' as const;
    return wins.some((w) => w.id === focusedId) ? ('focused' as const) : ('open' as const);
  };

  return (
    <nav
      aria-label="Dock"
      className="no-select fixed z-[9000] flex bg-black/25 backdrop-blur-sm
                 max-md:inset-x-0 max-md:bottom-0 max-md:h-16 max-md:flex-row max-md:items-center max-md:justify-around max-md:px-2
                 md:left-0 md:top-8 md:bottom-0 md:w-[68px] md:flex-col md:items-center md:gap-2 md:py-2"
    >
      {DOCK_APPS.map((id) => {
        const def = getApp(id);
        if (!def) return null;
        return (
          <DockButton
            key={id}
            icon={def.icon}
            label={def.title}
            state={runState(id)}
            onClick={() => toggleFromDock(id)}
          />
        );
      })}

      <Separator />

      {DOCK_LINKS.map((link) => (
        <DockButton
          key={link.id}
          icon={link.icon}
          label={link.title}
          state="closed"
          external
          onClick={() => window.open(link.href, '_blank', 'noopener,noreferrer')}
        />
      ))}

      <Separator />

      {/* Decorative: the real dock has a Trash entry, and there is nothing
          here to delete. */}
      <DockButton
        icon={TrashIcon}
        label="Trash"
        state="closed"
        onClick={() => {}}
        className="max-md:hidden"
      />

      <div className="flex-1 max-md:hidden" />

      {/* Show Applications — the Ubuntu logo, as on the real dock. */}
      <button
        aria-label="Show Applications"
        title="Show Applications"
        onClick={() => setOverview(!overviewOpen)}
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg transition-colors hover:bg-white/15 max-md:hidden ${
          overviewOpen ? 'bg-white/20' : ''
        }`}
      >
        <UbuntuLogoIcon className="h-8 w-8" />
      </button>
    </nav>
  );
}

function Separator() {
  return <div className="my-0.5 h-px w-10 bg-white/20 max-md:hidden" />;
}

function DockButton({
  icon: Icon,
  label,
  state,
  onClick,
  external,
  className = '',
}: {
  icon: IconComponent;
  label: string;
  state: 'closed' | 'open' | 'focused';
  onClick: () => void;
  external?: boolean;
  className?: string;
}) {
  return (
    <div className={`group relative shrink-0 ${className}`}>
      <button
        aria-label={external ? `${label} (opens in a new tab)` : label}
        onClick={onClick}
        className="grid h-11 w-11 place-items-center rounded-lg transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95"
      >
        <Icon className="h-11 w-11 drop-shadow-md" />
      </button>

      {/* Run indicator: a small dot at the left edge, a taller bar when focused. */}
      {state !== 'closed' && (
        <span
          className={`pointer-events-none absolute rounded-full bg-accent transition-all
            max-md:bottom-0 max-md:left-1/2 max-md:h-1 max-md:-translate-x-1/2
            md:-left-1 md:top-1/2 md:w-[3px] md:-translate-y-1/2
            ${state === 'focused' ? 'max-md:w-5 md:h-5' : 'max-md:w-1.5 md:h-1.5'}`}
        />
      )}

      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 max-md:hidden">
        {label}
      </span>
    </div>
  );
}
