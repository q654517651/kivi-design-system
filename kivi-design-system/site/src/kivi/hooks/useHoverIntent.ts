import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 悬停意图：进来马上算进来，离开后等 delay 才算离开。
 * 鼠标从按钮挪到它弹出的浮层，路上短暂离开不会断。leave 可以临时传一个更长的等待。
 */
export function useHoverIntent(delay: number) {
  const [inside, setInside] = useState(false);
  const timer = useRef(0);
  const enter = useCallback(() => {
    window.clearTimeout(timer.current);
    setInside(true);
  }, []);
  const leave = useCallback(
    (after = delay) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setInside(false), after);
    },
    [delay],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { inside, enter, leave };
}
