import { useLayoutEffect, useRef, type RefObject } from 'react';

// 浮层定位：Tooltip、Dropdown、播放器音量条都用。浮层自己是 position: fixed，挂在 body 上。

export type Placement = 'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

/** 锚点：视口里的一个矩形；右键菜单用宽高为 0 的点 */
export interface AnchorRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  /** 锚点元素。给了就用 ResizeObserver 盯它的尺寸，变了重新定位；右键菜单这类点没有 */
  element?: Element;
}

/** 取一个元素当锚点：位置取它此刻的矩形，同时带上元素本身，尺寸变了会重新定位 */
export function rectOf(el: Element): AnchorRect {
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, element: el };
}

export const pointRect = (x: number, y: number): AnchorRect => ({ left: x, right: x, top: y, bottom: y, width: 0 });

const MARGIN = 8;

/**
 * 把弹出层放到锚点旁边：默认在下方，放不下就翻到上方，左右不超出屏幕。
 * 顺带写三个变量给 CSS 用：
 *   --kv-popup-room    这一边还剩多高，菜单最高不超过它
 *   --kv-popup-origin  展开动画从哪长出来：锚点那一边、锚点对着的位置（右键就是鼠标点）
 *   --kv-popup-shift   展开时往外移的方向：在下方从上往下，在上方从下往上
 */
export function place(el: HTMLElement, a: AnchorRect, placement: Placement, offset: number, matchWidth?: boolean) {
  if (matchWidth) el.style.width = `${a.width}px`;
  el.style.removeProperty('--kv-popup-room');
  const w = el.offsetWidth;
  const natural = el.offsetHeight;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;

  let side = placement.startsWith('top') ? 'top' : 'bottom';
  const roomBelow = vh - MARGIN - (a.bottom + offset);
  const roomAbove = a.top - offset - MARGIN;
  if (side === 'bottom' && roomBelow < natural && roomAbove > roomBelow) side = 'top';
  else if (side === 'top' && roomAbove < natural && roomBelow > roomAbove) side = 'bottom';
  const room = Math.max(0, Math.floor(side === 'bottom' ? roomBelow : roomAbove));
  const h = Math.min(natural, room);

  const align = placement.split('-')[1] ?? 'center';
  const anchorX = align === 'start' ? a.left : align === 'end' ? a.right : a.left + a.width / 2;
  let left = align === 'start' ? a.left : align === 'end' ? a.right - w : a.left + a.width / 2 - w / 2;
  left = Math.max(MARGIN, Math.min(left, vw - w - MARGIN));
  const top = side === 'bottom' ? a.bottom + offset : a.top - offset - h;

  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(Math.max(MARGIN, top))}px`;
  if (room < natural) el.style.setProperty('--kv-popup-room', `${room}px`);
  const originX = Math.max(0, Math.min(w, anchorX - left));
  el.style.setProperty('--kv-popup-origin', `${Math.round(originX)}px ${side === 'bottom' ? '0' : '100%'}`);
  el.style.setProperty('--kv-popup-shift', side === 'bottom' ? '-4px' : '4px');
  // 锚点整个滚出屏幕时先藏起来，免得弹出层卡在屏幕边上盖住内容
  const out = a.bottom < 0 || a.top > vh || a.right < 0 || a.left > vw;
  el.style.visibility = out ? 'hidden' : '';
}

/** 弹出层显示期间一直跟着锚点：页面滚动、窗口变化、锚点或弹出层自己尺寸变了（ResizeObserver）都重新算 */
export function useFloating(
  active: boolean,
  popup: RefObject<HTMLElement>,
  getAnchor: () => AnchorRect | null,
  placement: Placement,
  offset: number,
  matchWidth?: boolean,
  /** 锚点换了位置（比如右键点了另一个地方）时变一下，会重新算 */
  anchorKey?: unknown,
) {
  const anchor = useRef(getAnchor);
  anchor.current = getAnchor;
  useLayoutEffect(() => {
    if (!active) return;
    const update = () => {
      const el = popup.current;
      const a = anchor.current();
      if (el && a) place(el, a, placement, offset, matchWidth);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    // 锚点、弹出层尺寸变了（内容换了、字体加载完、折行）位置也要跟着变。开始观察时会回调一次，多算一次无妨
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      if (popup.current) ro.observe(popup.current);
      const anchorEl = anchor.current()?.element;
      if (anchorEl) ro.observe(anchorEl);
    }
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [active, popup, placement, offset, matchWidth, anchorKey]);
}
