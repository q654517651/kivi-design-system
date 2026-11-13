import { createContext, useCallback, useContext, useEffect, useRef, type RefObject } from 'react';

type Register = (popup: RefObject<HTMLDivElement>) => () => void;

// Dropdown、Popover 都挂在 body 上，通过上下文认出自己的里层浮层。
export const FloatingLayerContext = createContext<Register | null>(null);

export function useLayerNesting(popup: RefObject<HTMLDivElement>, mounted: boolean) {
  const register = useContext(FloatingLayerContext);
  const nested = useRef(new Set<RefObject<HTMLDivElement>>());
  const registerNested = useCallback<Register>(
    (child) => {
      nested.current.add(child);
      const off = register?.(child);
      return () => {
        nested.current.delete(child);
        off?.();
      };
    },
    [register],
  );

  // 退出动画期间也算在里面，点里层不会误关外层。
  useEffect(() => {
    if (!mounted || !register) return;
    return register(popup);
  }, [mounted, popup, register]);

  return { nested, registerNested };
}
