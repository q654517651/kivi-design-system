import { useEffect } from 'react';

// 锁背景滚动：弹窗打开时用。多层弹窗共用一把锁，最后一个关掉才恢复。

let locks = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

/**
 * active 为 true 期间：body 不能滚，滚动条消失的那一条宽度用 padding-right 补上，页面不跳。
 * 关闭（或卸载）时恢复原来的样式；多个同时锁着，最后一个放开才恢复。
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    const body = document.body;
    if (locks++ === 0) {
      // 滚动条宽度要在 overflow: hidden 之前量
      const gap = window.innerWidth - document.documentElement.clientWidth;
      saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
      if (gap > 0) body.style.paddingRight = `${(parseFloat(getComputedStyle(body).paddingRight) || 0) + gap}px`;
      body.style.overflow = 'hidden';
    }
    return () => {
      if (--locks === 0 && saved) {
        body.style.overflow = saved.overflow;
        body.style.paddingRight = saved.paddingRight;
        saved = null;
      }
    };
  }, [active]);
}
