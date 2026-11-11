import { forwardRef, useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import { Notification } from './Notification';
import { getNotifications, notify, subscribeNotify } from './notify-store';
import './feedback.css';

export type NotifierProps = HTMLAttributes<HTMLDivElement>;

/** 收起时，后面几张探出多少、一共探出几张；展开时卡片间距 */
const PEEK = 8;
const PEEK_COUNT = 2;
const GAP = 8;
/** 还没量到高度时先按这个算 */
const FALLBACK_HEIGHT = 64;

/**
 * 通知弹出来的地方：页面右上角，距顶、距右 24，宽 400。条数不限，新的在最上面。
 * 平时收起成一叠：最前面一张完整，后面的从下边探出一点；鼠标停上去（或键盘聚焦进去）展开成一列，挪开又收起。
 * 整个应用根上放一个就行，然后在哪里都能调 notify.show()，调用方式见 notify-store.ts。
 * className、ref 和其余属性落在外层 .kv-notifier 上。
 */
export const Notifier = forwardRef<HTMLDivElement, NotifierProps>(function Notifier(
  { className, onMouseEnter, onMouseLeave, onFocus, onBlur, ...rest },
  ref,
) {
  const items = useSyncExternalStore(subscribeNotify, getNotifications, getNotifications);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = hovered || focused;

  // 每张卡片自己的高度（文字多少决定，量出来才能排）
  const [heights, setHeights] = useState<Record<number, number>>({});
  const observers = useRef(new Map<number, ResizeObserver>());
  // 每张卡片的 ref 回调只建一次：每次渲染都换新回调的话，React 每次都会先摘再挂、挂上就同步量一次再 setState，
  // 鼠标在一叠通知上进出几次就会套成死循环（React #185）
  const refs = useRef(new Map<number, (el: HTMLDivElement | null) => void>());
  const measure = useCallback((id: number) => {
    let fn = refs.current.get(id);
    if (!fn) {
      fn = (el: HTMLDivElement | null) => {
        observers.current.get(id)?.disconnect();
        observers.current.delete(id);
        if (!el) {
          refs.current.delete(id);
          return;
        }
        const read = () => {
          const v = el.offsetHeight;
          setHeights((h) => (h[id] === v ? h : { ...h, [id]: v }));
        };
        read(); // 挂上时量一次，第一帧就排对
        const ro = new ResizeObserver(read);
        ro.observe(el);
        observers.current.set(id, ro);
      };
      refs.current.set(id, fn);
    }
    return fn;
  }, []);
  useEffect(() => {
    const map = observers.current;
    return () => map.forEach((o) => o.disconnect());
  }, []);

  // 自动消失的计时：鼠标停在上面时暂停，挪开继续
  const timers = useRef(new Map<number, { left: number; start: number; t?: number }>());
  useEffect(() => {
    const map = timers.current;
    for (const [id, rec] of [...map]) {
      if (!items.some((i) => i.id === id && !i.leaving)) {
        window.clearTimeout(rec.t);
        map.delete(id);
      }
    }
    for (const it of items) {
      if (it.leaving || it.duration <= 0) continue;
      let rec = map.get(it.id);
      if (!rec) {
        rec = { left: it.duration, start: 0 };
        map.set(it.id, rec);
      }
      if (!expanded && rec.t === undefined) {
        rec.start = Date.now();
        const r = rec;
        rec.t = window.setTimeout(() => notify.hide(it.id), r.left);
      } else if (expanded && rec.t !== undefined) {
        window.clearTimeout(rec.t);
        rec.t = undefined;
        rec.left = Math.max(0, rec.left - (Date.now() - rec.start));
      }
    }
  }, [items, expanded]);
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((r) => window.clearTimeout(r.t));
  }, []);

  const live = items.filter((i) => !i.leaving);
  const hOf = (id: number) => heights[id] ?? FALLBACK_HEIGHT;
  const frontH = items[0] ? hOf(items[0].id) : 0;
  let offset = 0;
  const layout = items.map((it, i) => {
    const h = hOf(it.id);
    const stacked = !expanded && i > 0;
    const y = expanded ? offset : i * PEEK;
    offset += h + GAP;
    return { it, i, y, stacked, h: stacked ? frontH : h };
  });
  const listHeight = expanded ? Math.max(0, offset - GAP) : items.length ? frontH + Math.min(items.length - 1, PEEK_COUNT) * PEEK : 0;

  return (
    <div
      ref={ref}
      className={cx('kv-notifier', className)}
      data-expanded={expanded && live.length > 1 ? '' : undefined}
      role="region"
      aria-label="通知"
      aria-live="polite"
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        setHovered(true);
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        setHovered(false);
      }}
      onFocus={(e) => {
        onFocus?.(e);
        setFocused(true);
      }}
      onBlur={(e) => {
        onBlur?.(e);
        setFocused(false);
      }}
      {...rest}
    >
      <div className="kv-notifier__list" style={{ height: listHeight }}>
        {layout.map(({ it, i, y, stacked, h }) => {
          // 收起时，后面的越靠后越小；第三张以后看不见
          const depth = Math.min(i, PEEK_COUNT + 1);
          const style: CSSProperties = {
            height: h,
            zIndex: items.length - i,
            transform: `translateY(${y}px) scale(${stacked ? 1 - depth * 0.05 : 1})`,
            opacity: stacked && i > PEEK_COUNT ? 0 : undefined,
          };
          return (
            <div key={it.id} className="kv-notifier__item" data-stacked={stacked ? '' : undefined} data-leaving={it.leaving ? '' : undefined} style={style}>
              <Notification
                ref={measure(it.id)}
                type={it.type}
                title={it.title}
                description={it.description}
                onClose={() => notify.hide(it.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
Notifier.displayName = 'Notifier';
