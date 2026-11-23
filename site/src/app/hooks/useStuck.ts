import { useEffect, useState } from 'react';

/** 筛选条吸在离顶多少的地方（让开右上角余额、头像那一排） */
export const STICK_TOP = 64;

/**
 * 吸顶的筛选条吸住了没有：看它前面那条 0 高的哨兵（.tpl-as__sentinel）越过离顶 STICK_TOP 这条线没有。
 * 吸住了给筛选条挂 data-stuck，CSS 把它上面那 64 也铺上页面底色，滚上去的内容不从上面露出来。
 * 返回 [哨兵的 ref, 吸住了没有]。哨兵用回调 ref 记进 state：加载中、加载完它会重新挂上，要跟着换观察对象。
 * 资产页生成历史、探索页四个选项卡共用（11-20 探索页漏了，内容从筛选条上面露出来）。
 */
export function useStuck() {
  const [el, ref] = useState<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0)), {
      threshold: 0,
      rootMargin: `-${STICK_TOP}px 0px 0px 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  return [ref, stuck] as const;
}
