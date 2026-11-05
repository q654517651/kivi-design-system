import { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject, type UIEvent } from 'react';

// 滚动列表的渐隐：跟着用户滑的方向走。往下滑下面渐隐，往上滑上面渐隐；那一边已经到头就换到另一边。
// 一开始在最上面、下面还有内容时，下面渐隐。照线上 Agent 工具列表（ToolCallSkill）。

export type ScrollFade = 'top' | 'bottom' | undefined;

/**
 * 返回 fade（写到列表的 data-fade 上）和 onScroll（挂在列表上）。
 * 渐隐用 CSS mask 做，不盖底色，放在什么底上都行。
 */
export function useScrollFade<T extends HTMLElement>() {
  // 列表可能晚于组件才出现（比如展开后才渲染），所以 ref 一挂上（node 变了）就重新量、重新盯；
  // 对外仍是 ref 对象（`.current` 能读），给 ScrollArea 这类要读元素的地方用
  const [node, setNode] = useState<T | null>(null);
  const ref = useMemo<RefObject<T>>(() => {
    let el: T | null = null;
    return {
      get current() {
        return el;
      },
      set current(next: T | null) {
        el = next;
        setNode(next);
      },
    };
  }, []);
  const last = useRef(0);
  const [fade, setFade] = useState<ScrollFade>(undefined);

  const measure = useCallback((el: HTMLElement, dir: 'up' | 'down') => {
    const above = el.scrollTop > 1;
    const below = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    // 滑的那一边到头了，另一边还有内容就换到另一边
    setFade(dir === 'up' ? (above ? 'top' : below ? 'bottom' : undefined) : below ? 'bottom' : above ? 'top' : undefined);
  }, []);

  // 挂上和内容变化时按「往下」量一次：下面有内容就下面渐隐
  useLayoutEffect(() => {
    const el = node;
    if (!el) return;
    last.current = el.scrollTop;
    measure(el, 'down');
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure(el, el.scrollTop < last.current ? 'up' : 'down'));
    ro.observe(el);
    // 列表有最大高度时，内容变长不会改变列表自己的尺寸，所以连第一个子元素（内容外壳）也盯着
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [measure, node]);

  const onScroll = useCallback(
    (e: UIEvent<T>) => {
      const el = e.currentTarget;
      const dir = el.scrollTop < last.current ? 'up' : 'down';
      last.current = el.scrollTop;
      measure(el, dir);
    },
    [measure],
  );

  return { ref, fade, onScroll };
}
