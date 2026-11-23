import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';

export interface SortableOptions {
  /** 一共几项 */
  count: number;
  /** 按顺序取每一项的元素（只算能排序的，删除中的不算），量位置、键盘排完重新聚焦用 */
  getItems: () => HTMLElement[];
  /** 会横向滚动的容器：拖到两头自动滚，量位置时算上滚动 */
  scrollerRef?: RefObject<HTMLElement | null>;
  /** 松手、或者按 Alt + ← / → 时触发：把第 from 项挪到第 to 项的位置 */
  onMove: (from: number, to: number) => void;
  /** 开始、结束拖动。结束时带上松手那一下的事件（键盘、Esc 取消没有） */
  onDragChange?: (dragging: boolean, e?: globalThis.PointerEvent) => void;
  /** 不能排序 */
  disabled?: boolean;
}

interface DragState {
  from: number;
  to: number;
  /** 被拖的那项跟着鼠标走了多远（算上容器滚了多少） */
  dx: number;
  /** 竖着走了多远：换行排的时候用，一排的时候不用 */
  dy: number;
}

/** 按下后挪多远才算开始拖，不到这个距离还是点击 */
const THRESHOLD = 4;
/** 离滚动容器两头多近开始自动滚，每帧最多滚多少 */
const EDGE = 40;
const EDGE_SPEED = 12;
/** 鼠标上下离开容器超过这么远松手，算拖出去了：不排，回原位 */
const CANCEL_OUT = 32;
/** 滑进新位置用多久：和组件里排序的过渡一样（--motion-duration-200），多留一点 */
const SETTLE_MS = 260;

/**
 * 横向拖拽排序：按住一项拖，它跟着鼠标走，别的项实时滑开让位，松手落到新位置；拖出去（上下离开超过 32）或按 Esc 回原位。
 * 键盘：聚焦一项按 Alt + ← / → 和左右邻居换位置。
 * 不管布局，只给出每一项该偏移多少（`offset`），组件自己写进 transform：
 * 拖动中被拖的那项不加过渡（`instant`），别的项 200ms ease-in-out 滑开；
 * 松手那一帧顺序已经换好，被拖的那项从鼠标位置起、全部不加过渡，下一帧再滑进新位置。
 */
export function useSortable({ count, getItems, scrollerRef, onMove, onDragChange, disabled }: SortableOptions) {
  const latest = useRef({ getItems, onMove, onDragChange });
  latest.current = { getItems, onMove, onDragChange };

  const [drag, setDrag] = useState<DragState | null>(null);
  // 松手那一帧：from 已经挪到 to，被拖的那项还停在鼠标位置
  const [drop, setDrop] = useState<DragState | null>(null);
  // 松手后滑进新位置的那段时间，组件还按「排序中」的过渡走，不换回自己平时的过渡
  const [settling, setSettling] = useState(false);
  useEffect(() => {
    if (!settling) return;
    const t = setTimeout(() => setSettling(false), SETTLE_MS);
    return () => clearTimeout(t);
  }, [settling]);
  // 每一项的中心（相对滚动容器）。都在一排时只按横向排；换行排（几排）时按离谁的中心最近排（11-23 参考区展开全部）
  const lefts = useRef<number[]>([]);
  const tops = useRef<number[]>([]);
  const isGrid = () => tops.current.some((y) => Math.abs(y - tops.current[0]) > 1);
  const focusAfter = useRef<number | null>(null);

  // 松手后下一帧放开过渡，被拖的那项滑进新位置
  useEffect(() => {
    if (!drop) return;
    const release = () => {
      setDrop(null);
      setSettling(true);
    };
    // 等浏览器画完松手那一帧再放开过渡；页面在后台时 requestAnimationFrame 不跑，用定时器兜底
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(release);
    });
    const fallback = setTimeout(release, 100);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      clearTimeout(fallback);
    };
  }, [drop]);

  // 键盘换完位置，焦点跟着那一项走（DOM 挪动时浏览器会丢焦点）
  useLayoutEffect(() => {
    if (focusAfter.current == null) return;
    latest.current.getItems()[focusAfter.current]?.focus({ preventScroll: false });
    focusAfter.current = null;
  });

  /** 被拖那项的中心越过了谁就排到谁的位置；换行排时落到离它中心最近的那一格 */
  const targetOf = (from: number, dx: number, dy: number) => {
    const xs = lefts.current;
    if (isGrid()) {
      const ys = tops.current;
      const cx = xs[from] + dx;
      const cy = ys[from] + dy;
      let best = from;
      let bestD = Infinity;
      xs.forEach((x, i) => {
        const d = Math.hypot(x - cx, ys[i] - cy);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    }
    const center = xs[from] + dx;
    let to = from;
    for (let i = from + 1; i < xs.length; i++) if (center > xs[i]) to = i;
    for (let i = from - 1; i >= 0; i--) if (center < xs[i]) to = i;
    return to;
  };

  /** 第 index 项现在离它本来的位置偏多少（px）：横向 */
  const shift = (xs: number[], index: number, d: 'dx' | 'dy') => {
    if (drop) return index === drop.to ? xs[drop.from] + drop[d] - xs[drop.to] : 0;
    if (!drag) return 0;
    const { from, to } = drag;
    if (index === from) return drag[d];
    if (from < to && index > from && index <= to) return xs[index - 1] - xs[index];
    if (to < from && index >= to && index < from) return xs[index + 1] - xs[index];
    return 0;
  };
  const offset = (index: number) => shift(lefts.current, index, 'dx');
  /** 竖向偏多少：只有换行排时不是 0 */
  const offsetY = (index: number) => (isGrid() ? shift(tops.current, index, 'dy') : 0);

  /** 第 index 项在排好以后是第几个：拖的过程中序号先跟着变 */
  const order = (index: number) => {
    if (!drag) return index;
    const { from, to } = drag;
    if (index === from) return to;
    if (from < to && index > from && index <= to) return index - 1;
    if (to < from && index >= to && index < from) return index + 1;
    return index;
  };

  const measure = () => {
    const scroller = scrollerRef?.current;
    const base = scroller ? scroller.getBoundingClientRect().left - scroller.scrollLeft : 0;
    const top = scroller ? scroller.getBoundingClientRect().top : 0;
    const rects = latest.current.getItems().map((el) => el.getBoundingClientRect());
    lefts.current = rects.map((r) => r.left + r.width / 2 - base);
    tops.current = rects.map((r) => r.top + r.height / 2 - top);
  };

  const itemProps = (index: number) => ({
    onPointerDown(e: PointerEvent<HTMLElement>) {
      // 上一次还在滑进新位置时不接：量出来的位置不准
      if (disabled || count < 2 || e.button !== 0 || drag || drop || settling) return;
      // 按在删除这类按钮上不拖
      if ((e.target as HTMLElement).closest('button')) return;
      const el = e.currentTarget;
      const scroller = scrollerRef?.current;
      const startX = e.clientX;
      const startY = e.clientY;
      const startScroll = scroller?.scrollLeft ?? 0;
      let lastX = startX;
      let lastY = startY;
      let started = false;
      let raf = 0;
      let state: DragState = { from: index, to: index, dx: 0, dy: 0 };

      const update = () => {
        const dx = lastX - startX + ((scroller?.scrollLeft ?? 0) - startScroll);
        // 一排的时候只横着跟手（照原来）；换行排时竖着也跟手
        const dy = isGrid() ? lastY - startY : 0;
        state = { from: index, to: targetOf(index, dx, dy), dx, dy };
        setDrag(state);
      };
      // 拖到滚动容器两头：每帧滚一点，越靠边越快
      const autoScroll = () => {
        raf = requestAnimationFrame(autoScroll);
        if (!scroller) return;
        const r = scroller.getBoundingClientRect();
        const speed =
          lastX < r.left + EDGE ? -EDGE_SPEED * Math.min(1, (r.left + EDGE - lastX) / EDGE) : lastX > r.right - EDGE ? EDGE_SPEED * Math.min(1, (lastX - r.right + EDGE) / EDGE) : 0;
        if (!speed) return;
        const before = scroller.scrollLeft;
        scroller.scrollLeft += speed;
        if (scroller.scrollLeft !== before) update();
      };
      const finish = (ev: globalThis.PointerEvent | null, cancel: boolean) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', cancelEv);
        window.removeEventListener('keydown', key, true);
        cancelAnimationFrame(raf);
        if (!started) return;
        if (el.hasPointerCapture?.(ev?.pointerId ?? -1)) el.releasePointerCapture(ev!.pointerId);
        // 拖完那一下的 click 不算点击（不打开预览）
        const eat = (c: MouseEvent) => {
          c.stopPropagation();
          c.preventDefault();
        };
        window.addEventListener('click', eat, { capture: true, once: true });
        setTimeout(() => window.removeEventListener('click', eat, true), 0);

        const box = (scroller ?? el.parentElement)?.getBoundingClientRect();
        const out = !!ev && !!box && (ev.clientY < box.top - CANCEL_OUT || ev.clientY > box.bottom + CANCEL_OUT);
        const to = cancel || out ? index : state.to;
        setDrag(null);
        setDrop({ from: index, to, dx: state.dx, dy: state.dy });
        if (to !== index) latest.current.onMove(index, to);
        latest.current.onDragChange?.(false, ev ?? undefined);
      };
      const move = (ev: globalThis.PointerEvent) => {
        lastX = ev.clientX;
        lastY = ev.clientY;
        if (!started) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < THRESHOLD) return;
          started = true;
          measure();
          el.setPointerCapture?.(ev.pointerId);
          latest.current.onDragChange?.(true);
          raf = requestAnimationFrame(autoScroll);
        }
        update();
      };
      const up = (ev: globalThis.PointerEvent) => finish(ev, false);
      const cancelEv = (ev: globalThis.PointerEvent) => finish(ev, true);
      const key = (ev: globalThis.KeyboardEvent) => {
        if (ev.key !== 'Escape' || !started) return;
        // Esc 只取消拖动，不连外层一起关
        ev.stopPropagation();
        ev.preventDefault();
        finish(null, true);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancelEv);
      window.addEventListener('keydown', key, true);
    },
    // 图片默认能被浏览器拖走，会打断这里的拖动
    onDragStart(e: { preventDefault: () => void }) {
      e.preventDefault();
    },
    onKeyDown(e: KeyboardEvent<HTMLElement>) {
      if (disabled || !e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.target !== e.currentTarget) return;
      e.preventDefault();
      const to = index + (e.key === 'ArrowLeft' ? -1 : 1);
      if (to < 0 || to >= count) return;
      focusAfter.current = to;
      latest.current.onMove(index, to);
    },
    'aria-keyshortcuts': disabled || count < 2 ? undefined : 'Alt+ArrowLeft Alt+ArrowRight',
  });

  return {
    /** 正在拖：哪一项、会落到哪、挪了多远 */
    drag,
    /** 正在拖、刚松手、还在滑进新位置：组件用它切换过渡、藏删除按钮、不出预览 */
    sorting: drag != null || drop != null || settling,
    offset,
    offsetY,
    order,
    /** 这一项这一刻不加过渡：拖动中被拖的那项，松手那一帧所有项 */
    instant: (index: number) => drop != null || drag?.from === index,
    itemProps,
  };
}
