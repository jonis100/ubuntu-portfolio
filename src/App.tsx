import { useEffect } from 'react';
import { applyTheme, useOS } from '@/os/store';
import Desktop from '@/components/Desktop';
import { BootScreen, LoginScreen } from '@/components/BootScreen';
import type { AppId } from '@/os/types';
import { APPS } from '@/apps/registry';

const SESSION_KEY = 'yoni-os:booted';

export default function App() {
  const session = useOS((s) => s.session);
  const setSession = useOS((s) => s.setSession);
  const theme = useOS((s) => s.theme);
  const openApp = useOS((s) => s.openApp);
  const setViewport = useOS((s) => s.setViewport);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Window geometry is derived from the work area, so the store needs to know
  // when the viewport changes.
  useEffect(() => {
    const onResize = () => setViewport(window.innerWidth, window.innerHeight);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setViewport]);

  // The boot sequence is charming once and tedious on every navigation, so it
  // only plays the first time in a browser session.
  useEffect(() => {
    let alreadyBooted = false;
    try {
      alreadyBooted = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* private mode — just show the boot sequence */
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (alreadyBooted || reduced) {
      setSession('desktop');
    }
  }, [setSession]);

  useEffect(() => {
    if (session !== 'desktop') return;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }

    // Deep link: ?app=terminal opens that app so a window can be shared.
    const requested = new URLSearchParams(window.location.search).get('app');
    if (requested && APPS.some((a) => a.id === requested)) {
      openApp(requested as AppId);
    }
  }, [session, openApp]);

  return (
    <>
      <Desktop />
      {session === 'booting' && <BootScreen />}
      {session === 'login' && <LoginScreen />}
    </>
  );
}
