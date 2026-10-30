import { useMemo, useRef, type PointerEvent } from 'react';

export interface PointerDragOptions {
  /** 方向：横 x（从左到右）、竖 y（从下到上），默认横 */
  axis?: 'x' | 'y';
  /** 两头各让出多少像素不算在范围里，比如把手宽的一半，默认 0 */
  inset?: number;
  /** 禁用：按下不响应 */
  disabled?: boolean;
  /** 按下、拖动时给出位置，0–1 */
  onMove: (ratio: number) => void;
  /** 开始、结束拖动 */
  onDragChange?: (dragging: boolean) => void;
}

/**
 * 拖动条：按下就跳到那里，拖着走，松手结束。Slider、播放进度、音量条都用。
 * 返回的四个事件直接展开到轨道元素上；外面也要监听同名事件时，用 composeHandlers 合并。
 */
export function usePointerDrag({ axis = 'x', inset = 0, disabled, onMove, onDragChange }: PointerDragOptions) {
  const latest = useRef({ onMove, onDragChange });
  latest.current = { onMove, onDragChange };

  return useMemo(() => {
    const ratioOf = (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const v =
        axis === 'y'
          ? (r.bottom - inset - e.clientY) / (r.height - inset * 2)
          : (e.clientX - r.left - inset) / (r.width - inset * 2);
      return Math.min(1, Math.max(0, v));
    };
    const end = (e: PointerEvent<HTMLElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      latest.current.onDragChange?.(false);
    };
    return {
      onPointerDown(e: PointerEvent<HTMLElement>) {
        if (disabled || e.button !== 0 || e.defaultPrevented) return;
        // 拦掉默认行为（选中文字、拖图），焦点手动给到轨道，键盘接着能调
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.focus({ preventScroll: true });
        latest.current.onDragChange?.(true);
        latest.current.onMove(ratioOf(e));
      },
      onPointerMove(e: PointerEvent<HTMLElement>) {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) latest.current.onMove(ratioOf(e));
      },
      onPointerUp: end,
      onPointerCancel: end,
    };
  }, [axis, inset, disabled]);
}
