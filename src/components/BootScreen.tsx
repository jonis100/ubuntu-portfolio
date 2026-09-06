import { useEffect } from 'react';
import { useOS } from '@/os/store';
import { profile } from '@/data/profile';

const BOOT_MS = 1600;

/** Ubuntu's boot splash: the logo over four pulsing dots. */
export function BootScreen() {
  const setSession = useOS((s) => s.setSession);

  useEffect(() => {
    const t = window.setTimeout(() => setSession('login'), BOOT_MS);
    return () => window.clearTimeout(t);
  }, [setSession]);

  return (
    <button
      onClick={() => setSession('login')}
      aria-label="Skip boot animation"
      className="fixed inset-0 z-[20000] flex flex-col items-center justify-center gap-12 bg-[#2c001e] text-white"
    >
      <UbuntuLogo className="h-24 w-24 animate-pulse" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-accent"
            style={{ animation: `bootdot 1.2s ${i * 0.15}s infinite ease-in-out` }}
          />
        ))}
      </div>
      <style>{`@keyframes bootdot{0%,80%,100%{opacity:.25}40%{opacity:1}}`}</style>
    </button>
  );
}

/** GDM login: click the avatar or press Enter to enter the session. */
export function LoginScreen() {
  const setSession = useOS((s) => s.setSession);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') setSession('desktop');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSession]);

  return (
    <div className="fixed inset-0 z-[20000] flex flex-col items-center justify-center gap-6 bg-[#2c001e]/95 backdrop-blur-sm text-white">
      <div className="grid h-28 w-28 place-items-center rounded-full bg-accent text-4xl font-medium shadow-lg">
        {profile.initials}
      </div>
      <div className="text-center">
        <p className="text-2xl font-medium">{profile.name}</p>
        <p className="text-sm text-white/60">{profile.headline}</p>
      </div>
      <button
        onClick={() => setSession('desktop')}
        className="rounded-lg bg-accent px-8 py-2.5 font-medium transition-colors hover:bg-[#c7431a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Sign In
      </button>
      <p className="text-xs text-white/40">Press Enter — no password on this machine</p>
    </div>
  );
}

export function UbuntuLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#e95420" strokeWidth="8" />
      {[0, 120, 240].map((deg) => (
        <circle
          key={deg}
          cx={50 + 34 * Math.cos((deg - 90) * (Math.PI / 180))}
          cy={50 + 34 * Math.sin((deg - 90) * (Math.PI / 180))}
          r="12"
          fill="#e95420"
          stroke="#2c001e"
          strokeWidth="6"
        />
      ))}
      <circle cx="50" cy="50" r="11" fill="#e95420" />
    </svg>
  );
}
