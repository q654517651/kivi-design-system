import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  type Ref,
  type UIEvent,
  type WheelEvent,
} from 'react';
import { cx } from '../utils';
import { composeHandlers, useMergedRef, useScrollFade } from '../hooks';
import './scroll-area.css';

export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** 哪个方向能滚：纵向 / 横向 / 两个方向，默认纵向 */
  orientation?: ScrollAreaOrientation;
  /** 滚到离末尾不到 `reachEndOffset` 时调用，每次「到了」只调一次：滚开后再靠近才会再调；内容变长了、还停在末尾（比如内容不满一屏）也会再调一次。做无限加载用 */
  onReachEnd?: () => void;
  /** 离末尾多少 px 算到了，默认 200 */
  reachEndOffset?: number;
  /** 超出的那边渐隐，跟着滑的方向走（`useScrollFade`）。只有纵向有 */
  fade?: boolean;
  /** 滚动视口（真正在滚的那个 div）的 ref，要读 `scrollTop` 或调 `scrollTo` 时用 */
  viewportRef?: Ref<HTMLDivElement>;
  /** 透传给滚动视口的属性，比如 `onScroll`、`aria-label`、`id` */
  viewportProps?: HTMLAttributes<HTMLDivElement>;
  /** 最大高度，超过就滚；数字按 px。外面直接定了高度（height）的不用写 */
  maxHeight?: number | string;
}

type Axis = 'x' | 'y';

/** 滑块最短 24；鼠标靠近边缘 12 以内算在滚动条上（和 CSS 里滚动条的宽一样） */
const MIN_THUMB = 24;
const HIT = 12;
/** 滚动停下后多久滑块淡出 */
const HIDE_MS = 600;
/** 点轨道翻一页：可视尺寸的 90% */
const PAGE = 0.9;

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 这个方向的滚动量：可视多少、总共多长、滚了多少、滑块能走的轨道多长、滑块多长 */
function measure(vp: HTMLElement, axis: Axis, track: HTMLElement | null) {
  const y = axis === 'y';
  const client = y ? vp.clientHeight : vp.clientWidth;
  const size = y ? vp.scrollHeight : vp.scrollWidth;
  const pos = y ? vp.scrollTop : vp.scrollLeft;
  const trackLen = track ? (y ? track.clientHeight : track.clientWidth) : client;
  const max = Math.max(0, size - client);
  const thumb = size ? Math.min(trackLen, Math.max(MIN_THUMB, (trackLen * client) / size)) : trackLen;
  const offset = max ? (Math.min(pos, max) / max) * (trackLen - thumb) : 0;
  return { client, size, pos, max, trackLen, thumb, offset };
}

/**
 * 滚动区域：里面是浏览器原生滚动（滚轮、触摸、键盘、惯性都照旧），原生滚动条藏起来，换成自己画的细滑块。
 * 平时看不见；滚动时出现，停下 600ms 后淡出；鼠标靠近滚动条会出来，滑块从 6 变宽到 8；能拖，点轨道翻页。
 * 用法：`<ScrollArea maxHeight={320}>…</ScrollArea>`。ref 给最外层，滚动视口用 `viewportRef`。
 * 通用组件
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  {
    orientation = 'vertical',
    onReachEnd,
    reachEndOffset = 200,
    fade,
    viewportRef,
    viewportProps,
    maxHeight,
    className,
    style,
    children,
    onPointerMove,
    onPointerLeave,
    ...rest
  },
  ref,
) {
  const { className: viewportClass, style: viewportStyle, onScroll: viewportOnScroll, ...viewportRest } = viewportProps ?? {};
  const { ref: viewportEl, fade: fadeSide, onScroll: onFadeScroll } = useScrollFade<HTMLDivElement>();
  const setViewport = useMergedRef(viewportEl, viewportRef);
  const contentRef = useRef<HTMLDivElement>(null);
  const thumbs = { x: useRef<HTMLDivElement>(null), y: useRef<HTMLDivElement>(null) };

  const [scrollable, setScrollable] = useState({ x: false, y: false });
  const [scrolling, setScrolling] = useState(false);
  const [edge, setEdge] = useState<Axis | null>(null);
  const [dragging, setDragging] = useState<Axis | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const drag = useRef<{ axis: Axis; start: number; scroll: number } | null>(null);
  const armed = useRef(true);
  // 上一次触发时内容有多高：内容不满一屏或追加后仍在底部时，内容变长了要再触发一次
  const firedSize = useRef(0);
  const reachEnd = useRef(onReachEnd);
  reachEnd.current = onReachEnd;

  const wantX = orientation !== 'vertical';
  const wantY = orientation !== 'horizontal';
  const trackOf = (axis: Axis) => thumbs[axis].current?.parentElement ?? null;

  // 量一遍：哪个方向有得滚、滑块多长在哪，顺便看是不是快到末尾了
  const update = useCallback(() => {
    const vp = viewportEl.current;
    if (!vp) return;
    const next = {
      x: wantX && vp.scrollWidth - vp.clientWidth > 1,
      y: wantY && vp.scrollHeight - vp.clientHeight > 1,
    };
    setScrollable((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
    (['x', 'y'] as const).forEach((axis) => {
      const thumb = thumbs[axis].current;
      if (!thumb || !next[axis]) return;
      const m = measure(vp, axis, trackOf(axis));
      // 直接写样式，滚动时不用重新渲染
      thumb.style[axis === 'y' ? 'height' : 'width'] = `${m.thumb}px`;
      thumb.style.transform = axis === 'y' ? `translate3d(0, ${m.offset}px, 0)` : `translate3d(${m.offset}px, 0, 0)`;
    });

    // 到末尾：纵向（含两个方向）看下面，横向看右边。每次「到了」只调一次，滚开到 offset 以外或内容变长再靠近才会再调
    const main = wantY ? 'y' : 'x';
    const m = measure(vp, main, null);
    const remaining = m.size - m.pos - m.client;
    if (remaining > reachEndOffset) armed.current = true;
    else if (reachEnd.current && (armed.current || m.size > firedSize.current)) {
      armed.current = false;
      firedSize.current = m.size;
      reachEnd.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantX, wantY, reachEndOffset]);

  // 挂上、视口或内容尺寸变了（内容加载、折行、窗口缩放）都重新量
  useLayoutEffect(() => {
    update();
    const vp = viewportEl.current;
    if (!vp || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(vp);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update]);
  // 每次渲染后也量一次：内容是外面传进来的，变长（加载了新的一页）时第一时间知道，「到末尾」才能重新生效；
  // 滚动条从隐藏变成显示后，滑块才有尺寸可量，也靠这一次
  useLayoutEffect(() => update());
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    update();
    setScrolling(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setScrolling(false), HIDE_MS);
    onFadeScroll(e);
  };

  // 鼠标靠近右边 / 下边 12 以内：滚动条出来。触摸没有悬停
  const onRootMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    setEdge(scrollable.y && e.clientX > r.right - HIT ? 'y' : scrollable.x && e.clientY > r.bottom - HIT ? 'x' : null);
  };

  // 拖滑块：按下时记下鼠标和滚动位置，之后鼠标走多少，按轨道和内容的比例换算成滚动多少
  const onThumbDown = (axis: Axis) => (e: PointerEvent<HTMLDivElement>) => {
    const vp = viewportEl.current;
    if (!vp || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { axis, start: axis === 'y' ? e.clientY : e.clientX, scroll: axis === 'y' ? vp.scrollTop : vp.scrollLeft };
    setDragging(axis);
  };
  const onThumbMove = (e: PointerEvent<HTMLDivElement>) => {
    const vp = viewportEl.current;
    const d = drag.current;
    if (!vp || !d || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const m = measure(vp, d.axis, trackOf(d.axis));
    const free = m.trackLen - m.thumb;
    if (free <= 0) return;
    const delta = (d.axis === 'y' ? e.clientY : e.clientX) - d.start;
    const target = d.scroll + (delta * m.max) / free;
    if (d.axis === 'y') vp.scrollTop = target;
    else vp.scrollLeft = target;
  };
  const onThumbUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
    setDragging(null);
  };

  // 点轨道：朝点的那边翻一页
  const onTrackDown = (axis: Axis) => (e: PointerEvent<HTMLDivElement>) => {
    const vp = viewportEl.current;
    const thumb = thumbs[axis].current;
    if (!vp || !thumb || e.button !== 0 || e.target === thumb) return;
    e.preventDefault();
    const r = thumb.getBoundingClientRect();
    const before = axis === 'y' ? e.clientY < r.top : e.clientX < r.left;
    const step = (axis === 'y' ? vp.clientHeight : vp.clientWidth) * PAGE * (before ? -1 : 1);
    vp.scrollBy({ [axis === 'y' ? 'top' : 'left']: step, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  // 鼠标在滚动条上滚轮：滚动条盖在视口上面，滚轮要转给视口
  const onBarWheel = (axis: Axis) => (e: WheelEvent<HTMLDivElement>) => {
    const vp = viewportEl.current;
    if (!vp) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vp.clientHeight : 1;
    vp.scrollBy(axis === 'y' ? { top: e.deltaY * unit } : { left: (e.deltaX || e.deltaY) * unit });
  };

  const bar = (axis: Axis) => {
    const active = edge === axis || dragging === axis;
    return (
      <div
        className={cx('kv-scroll-area__bar', `kv-scroll-area__bar--${axis === 'y' ? 'vertical' : 'horizontal'}`)}
        hidden={!scrollable[axis]}
        data-state={scrollable[axis] && (scrolling || active) ? 'visible' : 'hidden'}
        data-active={active ? '' : undefined}
        onPointerDown={onTrackDown(axis)}
        onWheel={onBarWheel(axis)}
      >
        <div className="kv-scroll-area__track">
          <div
            ref={thumbs[axis]}
            className="kv-scroll-area__thumb"
            data-dragging={dragging === axis ? '' : undefined}
            onPointerDown={onThumbDown(axis)}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            onPointerCancel={onThumbUp}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className={cx('kv-scroll-area', className)}
      data-orientation={orientation}
      data-scrollable-x={scrollable.x ? '' : undefined}
      data-scrollable-y={scrollable.y ? '' : undefined}
      style={{ maxHeight, ...style } as CSSProperties}
      onPointerMove={composeHandlers(onPointerMove, onRootMove)}
      onPointerLeave={composeHandlers(onPointerLeave, () => setEdge(null))}
      {...rest}
    >
      <div
        ref={setViewport}
        className={cx('kv-scroll-area__viewport', viewportClass)}
        data-orientation={orientation}
        data-fade={fade && wantY ? fadeSide : undefined}
        style={viewportStyle}
        onScroll={composeHandlers(viewportOnScroll, onScroll)}
        {...viewportRest}
      >
        <div ref={contentRef} className="kv-scroll-area__content">
          {children}
        </div>
      </div>
      {wantY && bar('y')}
      {wantX && bar('x')}
    </div>
  );
});
ScrollArea.displayName = 'ScrollArea';
