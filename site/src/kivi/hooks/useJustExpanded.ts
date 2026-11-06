import { useLayoutEffect, useRef, useState } from 'react';

/**
 * 侧栏从收起变回展开后的这一段时间（默认 300ms，和侧栏变宽 --motion-duration-300 一样）返回 true。
 * 贴着右边的按钮（新建、「⋯」）这段时间先藏起来，等侧栏宽度定了再在原位出现，不跟着右边滑（11-05 用户定）
 */
export function useJustExpanded(collapsed: boolean | undefined, ms = 300) {
  const [on, setOn] = useState(false);
  const prev = useRef(collapsed);
  useLayoutEffect(() => {
    const was = prev.current;
    prev.current = collapsed;
    if (!was || collapsed) {
      setOn(false);
      return;
    }
    setOn(true);
    const t = setTimeout(() => setOn(false), ms);
    return () => clearTimeout(t);
  }, [collapsed, ms]);
  return on;
}
