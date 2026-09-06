import { MOBILE_BREAKPOINT, useOS } from '@/os/store';

/**
 * Reads the viewport width tracked in the store rather than window.innerWidth
 * directly, so components actually re-render when the window is resized across
 * the breakpoint.
 */
export function useIsMobile(): boolean {
  return useOS((s) => s.viewport.w < MOBILE_BREAKPOINT);
}
