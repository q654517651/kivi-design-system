import { Children, forwardRef, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { useMergedRef } from '../hooks';
import { cx } from '../utils';
import './masonry.css';

/** 按自己的宽度分段定列数：键是宽度上限（px），宽度 ≤ 它时用这个列数；`default` 是比所有键都宽时的列数 */
export type MasonryColumns = { default: number } & Record<number, number>;

export interface MasonryProps extends HTMLAttributes<HTMLDivElement> {
  /** 列数：一个数字是固定列数；传分段（比如 `{ default: 6, 1440: 4, 1100: 3, 700: 2, 500: 1 }`）按瀑布流自己的宽度换列数。默认 4 */
  columns?: number | MasonryColumns;
  /** 列和列、上下两格之间的间距，px，默认 4（照线上发现页） */
  gap?: number;
  /** 每一格的宽高比（宽 / 高），和子元素一一对应。传了就往当前最矮的那列放，几列底部差不多齐；不传按顺序一列一个轮着放 */
  ratios?: number[];
  /** 格子，一个子元素一格 */
  children?: ReactNode;
}

/** 按宽度算列数：找宽度能落进的最小那一档 */
function columnsFor(columns: number | MasonryColumns, width: number) {
  if (typeof columns === 'number') return Math.max(1, columns);
  const stops = Object.keys(columns)
    .filter((k) => k !== 'default')
    .map(Number)
    .sort((a, b) => a - b);
  const hit = stops.find((w) => width <= w);
  return Math.max(1, hit === undefined ? columns.default : columns[hit]);
}

/**
 * 瀑布流：等宽的几列，每格高度跟着内容走，一列一列往下排。比如发现页的作品。
 * 列数可以固定，也可以按自己的宽度分段换（量的是瀑布流本身，不是窗口，放在侧栏旁边也对）。
 * 传了每格的宽高比就往最矮的列放（底部齐）；不传按顺序轮着放（照线上 react-masonry-css）。
 * 加载更多时往后追加子元素，前面已经排好的格子不会挪列。
 */
export const Masonry = forwardRef<HTMLDivElement, MasonryProps>(function Masonry(
  { columns = 4, gap = 4, ratios, className, style, children, ...rest },
  ref,
) {
  const own = useRef<HTMLDivElement>(null);
  const merged = useMergedRef(own, ref);
  const [count, setCount] = useState(() => (typeof columns === 'number' ? columns : columns.default));

  // 跟着自己的宽度换列数
  useLayoutEffect(() => {
    const el = own.current;
    if (!el) return;
    const measure = () => setCount(columnsFor(columns, el.clientWidth));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [columns]);

  const items = Children.toArray(children);
  const cols: ReactNode[][] = Array.from({ length: count }, () => []);
  // 每列已经摞了多高（按列宽 = 1 算，一格高 = 1 / 宽高比），加上间距的影响很小，不算
  const heights = new Array<number>(count).fill(0);
  items.forEach((child, i) => {
    const r = ratios?.[i];
    let col = i % count;
    if (r && r > 0) {
      col = heights.indexOf(Math.min(...heights));
      heights[col] += 1 / r;
    }
    cols[col].push(child);
  });

  return (
    <div ref={merged} className={cx('kv-masonry', className)} style={{ '--kv-masonry-gap': `${gap}px`, ...style } as CSSProperties} {...rest}>
      {cols.map((list, i) => (
        <div key={i} className="kv-masonry__column">
          {list}
        </div>
      ))}
    </div>
  );
});
Masonry.displayName = 'Masonry';
