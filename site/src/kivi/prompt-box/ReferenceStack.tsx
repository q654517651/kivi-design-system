import {
  forwardRef,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
import { Icon } from '../Icon';
import { cx } from '../utils';
import { useControllable, useMergedRef } from '../hooks';
import { ReferenceItem } from '../canvas/ReferenceItem';
import { PromptBoxContext } from './context';
import './prompt-box.css';

export type ReferenceKind = 'image' | 'video' | 'audio';

export interface ReferenceStackItem {
  /** 唯一标识，增删时用它认哪一张 */
  id: string;
  /** 类型：图片 / 视频 / 音频。视频用封面图当缩略图，音频是渐变底加音符 */
  kind: ReferenceKind;
  /** 名字，写在卡片底部，比如「图片1」。要和提示词里 @ 引用的名字一致，用 referenceName() 按类型编号 */
  name: string;
  /** 缩略图地址：图片、视频封面用。音频不用 */
  src?: string;
  /** 时长文字，视频、音频用，比如「8s」「0:15」。展开时显示在卡片左上角 */
  duration?: string;
  /** 上传进度 0–100。不传就是已经上传完；传了卡片盖一层暗色加进度环 */
  progress?: number;
}

const KIND_NAME: Record<ReferenceKind, string> = { image: '图片', video: '视频', audio: '音频' };

/** 给新素材起名：按类型分别编号，已有「图片1、图片2」的话下一个是「图片3」 */
export function referenceName(items: ReferenceStackItem[], kind: ReferenceKind): string {
  const used = items
    .filter((i) => i.kind === kind)
    .map((i) => Number(i.name.replace(KIND_NAME[kind], '')))
    .filter((n) => Number.isFinite(n));
  return `${KIND_NAME[kind]}${(used.length ? Math.max(...used) : 0) + 1}`;
}

// ---------- 尺寸和位置（Figma「模板 · 主站」页「输入框」分区） ----------

const CELL = 72; // 卡片、添加格
const STACK_SCALE = 56 / 72; // 叠放时卡片缩到 56
const STEP = 78; // 展开后每格占的宽：72 + 间距 6
const GHOST_EXTRA = 50; // 删掉的卡片等消失动画（150ms）播完，再多留这么久才卸掉

/** 展开、收起的时长是 --motion-duration-400 的几倍：400ms 起，每多一张加 10ms，最多 700ms（照 BytePlus 参考区）。
 *  乘在变量上，系统开了减少动态效果、文档里慢放时跟着变 */
const durationFactor = (count: number) => Math.min(1 + count / 40, 1.75);

/** 读 CSS 变量里的时长，比如 --motion-duration-150 是 150ms；系统开了减少动态效果时是 0 */
function cssMs(el: HTMLElement | null, name: string, fallback: number): number {
  if (!el) return fallback;
  const v = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}

// 叠放：最上面、第二张、第三张。卡片中心相对 72 格中心的偏移，和转角（顺时针为正）
const STACK = [
  { dx: 7, dy: 6, r: 3 },
  { dx: -1, dy: -7, r: -12 },
  { dx: 17, dy: -5, r: 8 },
];

// 卡片一直是 72 见方，只用 transform 移动、缩放、旋转，展开收起时图和名字不会重新排版
interface CardLayout {
  tx: number;
  ty: number;
  rot: number;
  scale: number;
  opacity: number;
  z: number;
  /** 底部名字显示不显示 */
  label: boolean;
  /** 在叠放里是不是看不见的（第 4 张起） */
  hidden: boolean;
}

function cardLayout(index: number, count: number, open: boolean): CardLayout {
  if (open) return { tx: STEP * (index + 1), ty: 0, rot: 0, scale: 1, opacity: 1, z: index + 1, label: true, hidden: false };
  if (count === 1) return { tx: 0, ty: 0, rot: 0, scale: 1, opacity: 1, z: 5, label: true, hidden: false };
  const k = count - 1 - index; // 0 是最上面那张，也就是最后加的
  const p = STACK[Math.min(k, 2)];
  return {
    tx: p.dx,
    ty: p.dy,
    rot: p.r,
    scale: STACK_SCALE,
    // 第 4 张起压在第 3 张下面，40% 透明，展开时从这里飞出来
    opacity: k <= 2 ? 1 : 0.4,
    z: Math.max(1, 100 - k),
    label: k === 0,
    hidden: k > 2,
  };
}

// 新卡片从最上面那张的位置、小一点、透明地出现
const ENTER: CardLayout = {
  tx: STACK[0].dx,
  ty: STACK[0].dy,
  rot: STACK[0].r,
  scale: STACK_SCALE * 0.8,
  opacity: 0,
  z: 100,
  label: false,
  hidden: false,
};

// 上传进度环：直径 28，线宽 3，白 30% 的底圈加白色的弧
const RING_R = 12.5;
const RING_LEN = 2 * Math.PI * RING_R;

// ---------- 添加格 ----------

export type ReferenceAddSlotProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** 添加格：72 见方，白 4% 底，中间 AddSmall。点一下上传。Figma「模板 · 主站」页「参考素材 · 添加」 */
export const ReferenceAddSlot = forwardRef<HTMLButtonElement, ReferenceAddSlotProps>(function ReferenceAddSlot(
  { type = 'button', className, 'aria-label': ariaLabel = '添加参考素材', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx('kv-reference-add-slot', className)} aria-label={ariaLabel} {...rest}>
      <Icon name="AddSmall" size={20} />
    </button>
  );
});
ReferenceAddSlot.displayName = 'ReferenceAddSlot';

// ---------- 参考区 ----------

export interface ReferenceStackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  /** 参考素材，按添加顺序排，最后一个是叠放时最上面那张 */
  items: ReferenceStackItem[];
  /** 点添加格、或右下角圆形上传按钮时触发：弹出选文件，选完把素材加进 items */
  onAdd?: () => void;
  /** 点卡片右上角的删除时触发，参数是素材的 id：从 items 里去掉它 */
  onRemove?: (id: string) => void;
  /** 点卡片、卡片聚焦后按 Enter / Space 时触发，预览大图用。传了，展开后的卡片能键盘聚焦。Figma 没定，待确认 */
  onItemClick?: (item: ReferenceStackItem) => void;
  /** 展开（受控）：传 true 就一直展开，不等鼠标移上去。不传是鼠标移上去展开、移开收起，键盘聚焦也展开 */
  expanded?: boolean;
  /** 非受控时的初始状态，默认收起 */
  defaultExpanded?: boolean;
  /** 展开、收起时触发，参数是展开了没有。鼠标移上去、移开、聚焦、按 Esc 都会触发 */
  onExpandedChange?: (expanded: boolean) => void;
  /** 展开后最宽多宽，超过就横向滚动。不传取所在输入框内容区的宽度 */
  maxWidth?: number;
}

interface Ghost {
  item: ReferenceStackItem;
  layout: CardLayout;
  index: number;
}

/**
 * 主站输入框左上角的参考区：72 见方，里面放参考素材。
 * 空：只有添加格；一个：卡片正放，右下角圆形上传按钮继续添加；多个：按添加顺序叠放，最后加的在最上面，露 3 张，底部写最上面那张的名字；
 * 鼠标移上去向右展开，浮在提示词上面，不把文字往下推，每张 72、间距 6，底部写名字；上传按钮同时变成最前面的添加格。移开马上收回叠放。
 * 动画照 BytePlus 参考区：卡片只用 transform 移动、缩放、旋转；400ms 起每多一张加 10ms，最多 700ms，缓动 --motion-ease-expand。
 * 放进 PromptBox 的 references 里用，被盖住的那几行字由输入框藏起来。Figma「模板 · 主站」页「输入框」分区。
 */
export const ReferenceStack = forwardRef<HTMLDivElement, ReferenceStackProps>(function ReferenceStack(
  {
    items,
    onAdd,
    onRemove,
    onItemClick,
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    maxWidth,
    className,
    style,
    ...rest
  },
  ref,
) {
  const n = items.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const setRoot = useMergedRef(rootRef, ref);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const box = useContext(PromptBoxContext);

  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const [avail, setAvail] = useState(Number.POSITIVE_INFINITY);
  const [atEnd, setAtEnd] = useState(true);
  const mounted = useRef(false);

  const open = n > 0 && expanded;
  const full = STEP * (n + 1);
  const over = open && full > avail;
  const trayWidth = open ? (over ? avail : full) : CELL;
  const factor = durationFactor(n);
  const duration = `calc(var(--motion-duration-400) * ${factor})`;

  // 展开动画播完才能横向滚动：播的时候卡片要飞出 72 的区域，不能被裁掉
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!open) {
      setSettled(false);
      return;
    }
    const t = setTimeout(() => setSettled(true), cssMs(rootRef.current, '--motion-duration-400', 400) * factor);
    return () => clearTimeout(t);
  }, [open, factor]);

  // 展开后能排多宽：所在输入框内容区的宽度，减去参考区自己的左边距
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const host = root.closest<HTMLElement>('.kv-prompt-box__content');
    const measure = () => {
      if (maxWidth != null) setAvail(maxWidth);
      else if (host) setAvail(Math.max(CELL, host.clientWidth - root.offsetLeft));
      else setAvail(Math.max(CELL, window.innerWidth - root.getBoundingClientRect().left - 24));
    };
    measure();
    const ro = host && maxWidth == null ? new ResizeObserver(measure) : null;
    if (ro && host) ro.observe(host);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [maxWidth]);

  // 告诉输入框：展开到多宽了，被盖住的字要藏起来，用多长时间
  useLayoutEffect(() => {
    box?.setCoverWidth(open ? trayWidth : 0, duration);
  }, [box, open, trayWidth, duration]);
  useLayoutEffect(() => () => box?.setCoverWidth(0), [box]);

  // 滚动提示：没滚到头，右边有渐隐
  const updateEnd = () => {
    const el = scrollerRef.current;
    if (el) setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  };
  useLayoutEffect(() => {
    if (!open && scrollerRef.current) scrollerRef.current.scrollLeft = 0;
    updateEnd();
  });

  // 鼠标滚轮上下滚也能横着滚
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!open || Math.abs(e.deltaX) >= Math.abs(e.deltaY) || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [open]);

  // 悬停、键盘聚焦展开，移开马上收起。手机没有悬停：点一下展开，再点一下收起
  const enter = () => setExpanded(true);
  const leave = () => setExpanded(false);

  // 删掉的卡片先留着，播完消失动画再卸掉
  const lastLayouts = useRef(new Map<string, CardLayout>());
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    const alive = new Set(items.map((i) => i.id));
    const gone = prevItems
      .map((item, index) => ({ item, index, layout: lastLayouts.current.get(item.id) }))
      .filter((g): g is Ghost => !alive.has(g.item.id) && g.layout !== undefined);
    if (gone.length || ghosts.some((g) => alive.has(g.item.id))) {
      setGhosts((old) => [...old.filter((g) => !alive.has(g.item.id)), ...gone]);
    }
  }
  useEffect(() => {
    if (!ghosts.length) return;
    const t = setTimeout(() => {
      setGhosts([]);
      // 顺手清掉已经不在 items 里的记录
      const alive = new Set(items.map((i) => i.id));
      lastLayouts.current.forEach((_, id) => {
        if (!alive.has(id)) lastLayouts.current.delete(id);
      });
    }, cssMs(rootRef.current, '--motion-duration-150', 150) + GHOST_EXTRA);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghosts]);

  // 每张卡片这一刻的位置；记下来，被删掉时从这个位置开始播消失动画
  const layouts = items.map((_, i) => cardLayout(i, n, open));
  items.forEach((item, i) => lastLayouts.current.set(item.id, layouts[i]));
  useEffect(() => {
    mounted.current = true;
  }, []);

  // 卡片按原来的顺序渲染，删掉的那张留在原位，DOM 不挪动，动画才不会断
  const entries: Array<{ item: ReferenceStackItem; layout: CardLayout; ghost: boolean; index: number }> = items.map((item, index) => ({
    item,
    layout: layouts[index],
    ghost: false,
    index,
  }));
  [...ghosts]
    .sort((a, b) => a.index - b.index)
    .forEach((g) => entries.splice(Math.min(g.index, entries.length), 0, { item: g.item, layout: g.layout, ghost: true, index: g.index }));

  // 有素材又没展开时，添加格缩成右下角的圆形上传按钮
  const compact = n > 0 && !open;

  return (
    <div
      ref={setRoot}
      className={cx('kv-reference-stack', className)}
      style={{ '--kv-reference-stack-duration': duration, '--kv-reference-stack-scale': STACK_SCALE, ...style } as CSSProperties}
      {...rest}
    >
      <div
        className="kv-reference-stack__tray"
        data-open={open ? '' : undefined}
        data-stacked={n > 1 && !open ? '' : undefined}
        data-settled={open && settled ? '' : undefined}
        data-full={over ? '' : undefined}
        data-at-end={over && atEnd ? '' : undefined}
        role="group"
        aria-label="参考素材"
        tabIndex={n > 0 ? 0 : undefined}
        style={{ width: trayWidth }}
        onMouseEnter={enter}
        onMouseLeave={leave}
        onFocus={enter}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) leave();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setExpanded(false);
        }}
        onTouchStart={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          setExpanded(!expanded);
        }}
      >
        {/* 悬停区往右下多出 10，盖住上传按钮探出去的那块：从按钮上展开后按钮变走了，鼠标还在这里，不会马上收起 */}
        <span className="kv-reference-stack__hit" aria-hidden="true" />
        <div ref={scrollerRef} className="kv-reference-stack__scroller" onScroll={updateEnd}>
          <div className="kv-reference-stack__track" style={{ width: open ? full : CELL }}>
            <button
              type="button"
              className="kv-reference-stack__trigger"
              data-compact={compact ? '' : undefined}
              aria-label="添加参考素材"
              onClick={(e) => {
                e.stopPropagation();
                onAdd?.();
              }}
            >
              <Icon name="AddSmall" className="kv-reference-stack__trigger-icon" />
            </button>
            {entries.map(({ item, layout, ghost }) => (
              <ReferenceStackCard
                key={item.id}
                item={item}
                layout={layout}
                ghost={ghost}
                enter={mounted.current}
                open={open}
                onRemove={onRemove}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
ReferenceStack.displayName = 'ReferenceStack';

// ---------- 一张卡片 ----------

interface CardProps {
  item: ReferenceStackItem;
  layout: CardLayout;
  /** 删掉了，正在播消失动画 */
  ghost: boolean;
  /** 刚加进来的：从最上面那张的位置出现 */
  enter: boolean;
  open: boolean;
  onRemove?: (id: string) => void;
  onItemClick?: (item: ReferenceStackItem) => void;
}

function ReferenceStackCard({ item, layout, ghost, enter, open, onRemove, onItemClick }: CardProps) {
  const [entered, setEntered] = useState(!enter);
  useEffect(() => {
    if (entered) return;
    // 等浏览器先画一帧出发位置，再切到目标位置，过渡才会播
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [entered]);

  const l = entered ? layout : ENTER;
  const uploading = item.progress != null && item.progress < 100;
  const progress = Math.max(0, Math.min(100, item.progress ?? 0));

  // 平移、旋转、缩放分开写，展开收起时三样各自补间
  const style: CSSProperties = {
    transform: `translate(${l.tx}px, ${l.ty}px) rotate(${l.rot}deg) scale(${ghost ? l.scale * 0.8 : l.scale})`,
    opacity: ghost ? 0 : l.opacity,
    zIndex: l.z,
  };

  return (
    <div
      className="kv-reference-stack__card"
      data-labeled={l.label ? '' : undefined}
      data-uploading={uploading ? '' : undefined}
      data-leaving={ghost ? '' : undefined}
      data-clickable={onItemClick ? '' : undefined}
      style={style}
      role="group"
      aria-label={item.name}
      aria-hidden={l.hidden || ghost || undefined}
      // 有预览回调的卡片能用键盘聚焦（展开后才聚焦得到，和删除按钮一样），Enter、Space 打开预览
      tabIndex={onItemClick && open && !ghost && !l.hidden ? 0 : undefined}
      onClick={() => onItemClick?.(item)}
      onKeyDown={(e) => {
        // 焦点在里面的删除按钮上时，按键留给按钮自己
        if (!onItemClick || e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        onItemClick(item);
      }}
    >
      <ReferenceItem size={72} type={item.kind === 'audio' ? 'audio' : 'image'} src={item.src} weight={item.name} />
      {item.duration && <span className="kv-reference-stack__duration">{item.duration}</span>}
      {uploading && (
        <div className="kv-reference-stack__upload" role="progressbar" aria-label={`${item.name}上传中`} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <svg viewBox="0 0 28 28" aria-hidden="true">
            <circle className="kv-reference-stack__ring" cx="14" cy="14" r={RING_R} />
            <circle
              className="kv-reference-stack__arc"
              cx="14"
              cy="14"
              r={RING_R}
              strokeDasharray={RING_LEN}
              strokeDashoffset={RING_LEN * (1 - progress / 100)}
              transform="rotate(-90 14 14)"
            />
          </svg>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <button
        type="button"
        className="kv-reference-stack__remove"
        aria-label={`删除${item.name}`}
        tabIndex={open && !ghost ? 0 : -1}
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.(item.id);
        }}
      >
        <Icon name="CloseSmall" />
      </button>
    </div>
  );
}
