import { useEffect, useState } from 'react';

/**
 * 出现、消失：关的时候先播消失动画，exitMs 之后再卸掉。
 * 动画写在 CSS 里，用返回的 state 写到 data-state 上区分（open / closed）。
 */
export function usePresence(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(t);
  }, [open, exitMs]);
  return { mounted: open || mounted, state: open ? ('open' as const) : ('closed' as const) };
}
