import { useLayoutEffect, useState, type DependencyList, type RefObject } from 'react';

/**
 * 文字是否被截断了（单行、末尾省略号）。元素尺寸变了、内容变了都重新量。
 * 截断了的地方悬停要能看全文（设计规则 · 状态），按钮、选项卡用它决定出不出 Tooltip
 */
export function useTruncated(ref: RefObject<HTMLElement>, deps: DependencyList = []) {
  const [truncated, setTruncated] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setTruncated(el.scrollWidth > el.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return truncated;
}
