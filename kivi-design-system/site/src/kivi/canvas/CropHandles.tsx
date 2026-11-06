import {
  forwardRef,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { composeHandlers, useControllable } from '../hooks';
import { cx } from '../utils';
import './canvas.css';

/** 框的位置和大小，单位 px，相对外层定位元素 */
export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DragDir = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se' | 'move';

export interface CropHandlesProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'defaultValue' | 'onChange'> {
  /** 框的位置和大小。传了 value 或 defaultValue 才能拖；都不传只摆样子，大小用 style 或外层定位给 */
  value?: CropRect;
  defaultValue?: CropRect;
  /** 拖动、键盘挪动时触发 */
  onValueChange?: (rect: CropRect) => void;
  /** 锁定的比例（宽 / 高）；null 自由，拖的时候按住 Shift 临时锁住当前比例 */
  ratio?: number | null;
  /** 框能去的范围，一般是图片（裁剪）或画布可见区（扩图） */
  bounds?: CropRect;
  /** 框必须包住的区域：扩图传原图。传了框里不能按住挪 */
  contain?: CropRect;
  /** 最小边，默认 16 */
  min?: number;
  /** Enter、双击框里 */
  onConfirm?: () => void;
  /** Esc */
  onCancel?: () => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 一条边的长度能取多少。'+' 钉住 a 往正向长，'-' 钉住 a 往负向长，'c' 以 a 为中心两边长 */
function lengthRange(mode: '+' | '-' | 'c', a: number, outLo: number, outHi: number, inLo: number, inHi: number, min: number) {
  if (mode === '+') return [Math.max(min, inHi - a), outHi - a];
  if (mode === '-') return [Math.max(min, a - inLo), a - outLo];
  return [Math.max(min, 2 * Math.max(a - inLo, inHi - a)), 2 * Math.min(a - outLo, outHi - a)];
}

/** 拖完的新框：角、边钉住对面拉伸，fromCenter 时两边一起；锁比例时没拖的那一边以中线为准跟着变 */
function resize(
  start: CropRect,
  dir: DragDir,
  dx: number,
  dy: number,
  ratio: number | null,
  fromCenter: boolean,
  outer: CropRect,
  inner: CropRect | undefined,
  min: number,
): CropRect {
  if (dir === 'move') {
    return {
      ...start,
      x: clamp(start.x + dx, outer.x, outer.x + outer.w - start.w),
      y: clamp(start.y + dy, outer.y, outer.y + outer.h - start.h),
    };
  }
  const sx = dir.includes('e') ? 1 : dir.includes('w') ? -1 : 0;
  const sy = dir.includes('s') ? 1 : dir.includes('n') ? -1 : 0;
  const axis = (s: number, pos: number, len: number) => {
    if (!s || fromCenter) return { mode: 'c' as const, a: pos + len / 2 };
    return s > 0 ? { mode: '+' as const, a: pos } : { mode: '-' as const, a: pos + len };
  };
  const ax = axis(sx, start.x, start.w);
  const ay = axis(sy, start.y, start.h);
  const [wLo, wHi] = lengthRange(ax.mode, ax.a, outer.x, outer.x + outer.w, inner?.x ?? Infinity, inner ? inner.x + inner.w : -Infinity, min);
  const [hLo, hHi] = lengthRange(ay.mode, ay.a, outer.y, outer.y + outer.h, inner?.y ?? Infinity, inner ? inner.y + inner.h : -Infinity, min);
  const k = fromCenter ? 2 : 1;
  const rawW = start.w + sx * dx * k;
  const rawH = start.h + sy * dy * k;
  let w: number;
  let h: number;
  if (ratio == null) {
    w = sx ? clamp(rawW, wLo, wHi) : start.w;
    h = sy ? clamp(rawH, hLo, hHi) : start.h;
  } else {
    const lo = Math.max(wLo, hLo * ratio);
    const hi = Math.min(wHi, hHi * ratio);
    if (lo > hi) return start;
    // 拖角时跟变化大的那一边走
    const want = !sy ? rawW : !sx ? rawH * ratio : Math.abs(rawW - start.w) >= Math.abs((rawH - start.h) * ratio) ? rawW : rawH * ratio;
    w = clamp(want, lo, hi);
    h = w / ratio;
  }
  const place = (m: '+' | '-' | 'c', a: number, len: number) => (m === '+' ? a : m === '-' ? a - len : a - len / 2);
  return { x: place(ax.mode, ax.a, w), y: place(ay.mode, ay.a, h), w, h };
}

const CURSOR: Record<DragDir, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  move: 'move',
};

/** 边上的热区：描边里外各 8（角上的圆点伸出去 7），比线上的 12 宽一点好抓 */
const ZONE = 8;
/** 边短于这个就不画边中间的条，只留四角 */
const EDGE_BAR_MIN = 64;
const NO_LIMIT: CropRect = { x: -Infinity, y: -Infinity, w: Infinity, h: Infinity };

/**
 * 裁剪框：裁剪、扩图时盖在图片上的框。拖四角、四边拉伸，按住 Shift 锁比例、Option 从中心拉；
 * 裁剪时框里按住能挪，方向键挪 1（Shift 10）。拖的时候出九宫格。Figma「画布」页 CropHandles
 */
export const CropHandles = forwardRef<HTMLDivElement, CropHandlesProps>(function CropHandles(
  {
    value,
    defaultValue,
    onValueChange,
    ratio = null,
    bounds,
    contain,
    min = 16,
    onConfirm,
    onCancel,
    className,
    style,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onKeyDown,
    onDoubleClick,
    ...rest
  },
  ref,
) {
  const [rect, setRect] = useControllable(value, defaultValue as CropRect, onValueChange);
  const interactive = rect !== undefined;
  const movable = interactive && !contain;
  const drag = useRef<{ dir: DragDir; x: number; y: number; start: CropRect } | null>(null);
  const [dragging, setDragging] = useState<DragDir | null>(null);
  const [cursor, setCursor] = useState<string>();

  const dirAt = (e: PointerEvent<HTMLDivElement>): DragDir | null => {
    const r = e.currentTarget.getBoundingClientRect();
    const v = Math.abs(e.clientY - r.top) <= ZONE ? 'n' : Math.abs(r.bottom - e.clientY) <= ZONE ? 's' : '';
    const h = Math.abs(e.clientX - r.left) <= ZONE ? 'w' : Math.abs(r.right - e.clientX) <= ZONE ? 'e' : '';
    if (v || h) return (v + h) as DragDir;
    const inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
    return movable && inside ? 'move' : null;
  };

  const end = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlers = interactive
    ? {
        tabIndex: 0,
        onPointerDown: composeHandlers(onPointerDown, (e: PointerEvent<HTMLDivElement>) => {
          const dir = e.button === 0 ? dirAt(e) : null;
          if (!dir) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.focus({ preventScroll: true });
          drag.current = { dir, x: e.clientX, y: e.clientY, start: rect };
          setDragging(dir);
        }),
        onPointerMove: composeHandlers(onPointerMove, (e: PointerEvent<HTMLDivElement>) => {
          const d = drag.current;
          if (!d) {
            const dir = dirAt(e);
            setCursor(dir ? CURSOR[dir] : undefined);
            return;
          }
          // Shift：自由比例时临时锁住拖之前的比例
          const r = ratio ?? (e.shiftKey ? d.start.w / d.start.h : null);
          setRect(resize(d.start, d.dir, e.clientX - d.x, e.clientY - d.y, r, e.altKey && d.dir !== 'move', bounds ?? NO_LIMIT, contain, min));
        }),
        onPointerUp: composeHandlers(onPointerUp, end),
        onPointerCancel: composeHandlers(onPointerCancel, end),
        onKeyDown: composeHandlers(onKeyDown, (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter') return onConfirm?.();
          if (e.key === 'Escape') return onCancel?.();
          const step = e.shiftKey ? 10 : 1;
          const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
          if (!move || !movable) return;
          e.preventDefault();
          setRect(resize(rect, 'move', move[0], move[1], null, false, bounds ?? NO_LIMIT, undefined, min));
        }),
        onDoubleClick: composeHandlers(onDoubleClick, () => movable && onConfirm?.()),
      }
    : { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onKeyDown, onDoubleClick };

  const placed: CSSProperties | undefined = interactive
    ? { left: rect.x, top: rect.y, width: rect.w, height: rect.h, cursor: dragging ? CURSOR[dragging] : cursor }
    : undefined;

  return (
    <div
      ref={ref}
      className={cx('kv-crop-handles', className)}
      style={{ ...placed, ...style }}
      data-interactive={interactive || undefined}
      data-dragging={dragging || undefined}
      data-narrow={interactive && rect.w < EDGE_BAR_MIN ? '' : undefined}
      data-short={interactive && rect.h < EDGE_BAR_MIN ? '' : undefined}
      {...handlers}
      {...rest}
    >
      {interactive && <i className="kv-crop-handles__grid" />}
      <i className="kv-crop-handles__handle kv-crop-handles__handle--nw" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--n" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--ne" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--w" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--e" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--sw" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--s" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--se" />
    </div>
  );
});
CropHandles.displayName = 'CropHandles';
