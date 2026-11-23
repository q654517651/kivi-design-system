import {
  forwardRef,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
import { Button, IconButton } from '../button';
import { Dialog } from '../dialog';
import { Icon } from '../Icon';
import { TabItem, Tabs } from '../navigation';
import { Tooltip } from '../tooltip';
import { UploadRing } from '../upload/UploadRing';
import { cx } from '../utils';
import { useControllable, useMergedRef, useSortable } from '../hooks';
import { PreviewPopover } from './PreviewCard';
import { ReferenceItem } from './ReferenceItem';
import { PromptBoxContext } from '../generation/context';
import './reference.css';

export type ReferenceType = 'image' | 'video' | 'audio';

export interface ReferenceStackItem {
  /** 唯一标识，增删时用它认哪一张 */
  id: string;
  /** 类型：图片 / 视频 / 音频。视频用封面图当缩略图，音频是渐变底加音符 */
  type: ReferenceType;
  /** 名字，比如「图片1」：提示词里 @ 引用和读屏用。按排列顺序、每种类型各自编号（relabelReferences），换了顺序跟着变；卡片右上角写的也是它 */
  name: string;
  /** 缩略图地址：图片、视频封面用；音频传音频地址，悬停预览里能播 */
  src?: string;
  /** 视频文件地址，视频用：悬停预览里自动静音循环播放 */
  video?: string;
  /** 时长文字，视频、音频用，比如「8s」「0:15」。展开时显示在卡片左下角 */
  duration?: string;
  /** 上传进度 0–100。不传就是已经上传完；传了卡片盖一层暗色加进度环 */
  progress?: number;
}

/** 鼠标移开参考区后等多久才收起（毫秒） */
const LEAVE_GRACE = 150;

/** 角标、@ 引用里的类型名。英文界面写缩写 Img / Vid / Aud / File（「Image 1」在 56 的格子上放不下） */
const TYPE_NAME: Record<string, string> = { image: '图片', video: '视频', audio: '音频', file: '文件' };

/** 按排列顺序给一串素材起名：每种类型各自从 1 编号，比如 图片 视频 图片 → 图片1 视频1 图片2（11-18 用户定：不分组，角标写「图片1」） */
export function referenceLabels(types: string[]): string[] {
  const count: Record<string, number> = {};
  return types.map((t) => `${TYPE_NAME[t] ?? ''}${(count[t] = (count[t] ?? 0) + 1)}`);
}

/** 按现在的顺序重新起名（换了顺序、删了一个以后用），名字没变的原样返回 */
export function relabelReferences<T extends { type: string; name: string }>(items: T[]): T[] {
  const labels = referenceLabels(items.map((i) => i.type));
  return items.map((item, i) => (item.name === labels[i] ? item : { ...item, name: labels[i] }));
}

/** 给加在最后的新素材起名：同类型已经有几个就是下一个，已有「图片1、图片2」的话是「图片3」 */
export function referenceName(items: { type: string }[], type: ReferenceType): string {
  return `${TYPE_NAME[type]}${items.filter((i) => i.type === type).length + 1}`;
}

// ---------- 尺寸和位置（Figma「模板 · 主站」页「输入框」分区） ----------

const CELL = 72; // 卡片、添加格
const STACK_SCALE = 56 / 72; // 叠放时卡片缩到 56
const STEP = 78; // 展开后每格占的宽：72 + 间距 6
const GHOST_EXTRA = 50; // 删掉的卡片等消失动画（150ms）播完，再多留这么久才卸掉
const GAP = STEP - CELL; // 格子间距 6
/** 超过几张悬停只展开三格：第一张、展开全部、添加（照即梦，11-23 用户定） */
const CONDENSE_FROM = 3;
/** 展开全部时顶上一行（类型选项卡、清空、收起）32 高，下面空 12 再排格子 */
const HEAD = 32 + 12;

/** 展开全部时按类型看：全部 / 图片 / 视频 / 音频，只是切着看，不改顺序 */
type Filter = 'all' | ReferenceType;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'audio', label: '音频' },
];

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
  /** 右上角序号显示不显示 */
  label: boolean;
  /** 在叠放里是不是看不见的（第 4 张起） */
  hidden: boolean;
}

/** 展开全部时第 p 格在哪：一排 cols 格，从顶上一行下面开始排 */
const gridAt = (p: number, cols: number) => ({ tx: STEP * (p % cols), ty: HEAD + STEP * Math.floor(p / cols) });

/** 超过 CONDENSE_FROM 张、悬停展开时：第一张在第 1 格，第二张在第 2 格（盖着「展开全部」），后面的都藏在第 2 格下面 */
function condensedLayout(index: number): CardLayout {
  if (index === 0) return { tx: 0, ty: 0, rot: 0, scale: 1, opacity: 1, z: 2, label: true, hidden: false };
  return { tx: STEP, ty: 0, rot: 0, scale: 1, opacity: index === 1 ? 1 : 0, z: index === 1 ? 3 : 1, label: false, hidden: index > 1 };
}

/** lead：展开后卡片前面有几格添加格，满了（`max`）添加格隐藏就是 0，平时是 1 */
function cardLayout(index: number, count: number, open: boolean, lead = 1): CardLayout {
  if (open && count >= CONDENSE_FROM) return condensedLayout(index);
  if (open) return { tx: STEP * (index + lead), ty: 0, rot: 0, scale: 1, opacity: 1, z: index + 1, label: true, hidden: false };
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

// 叠着时新卡片从最上面那张的位置、小一点、透明地出现（展开着时原地出现，见 ReferenceStackCard）
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

// ---------- 参考区 ----------

export interface ReferenceStackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  /** 参考素材，按添加顺序排，最后一个是叠放时最上面那张 */
  items: ReferenceStackItem[];
  /** 点添加格、或右下角圆形上传按钮时触发：弹出选文件，选完把素材加进 items */
  onAdd?: () => void;
  /** 点卡片右上角的删除时触发，参数是素材的 id：从 items 里去掉它。不传就没有删除按钮，悬停时序号也不隐藏 */
  onRemove?: (id: string) => void;
  /** 点卡片、卡片聚焦后按 Enter / Space 时触发，预览大图用。传了，展开后的卡片能键盘聚焦。 */
  onItemClick?: (item: ReferenceStackItem) => void;
  /** 展开（受控）：传 true 就一直展开，不等鼠标移上去。不传是鼠标移上去展开、移开收起，键盘聚焦也展开 */
  expanded?: boolean;
  /** 非受控时的初始状态，默认收起 */
  defaultExpanded?: boolean;
  /** 展开、收起时触发，参数是展开了没有。鼠标移上去、移开、聚焦、按 Esc 都会触发 */
  onExpandedChange?: (expanded: boolean) => void;
  /** 展开后最宽多宽，超过就横向滚动。不传取所在输入框内容区的宽度 */
  maxWidth?: number;
  /** 最多放几个：放满了添加格（和右下角的小圆加号）隐藏，不能再添加。默认不限 */
  max?: number;
  /** 拖着排序：展开后按住一张左右拖，别的卡片滑开让位，松手触发，参数是从第几张挪到第几张（从 0 起），在这里重排 items。
   *  拖的时候参考区不收起；上下拖出去超过 32 或按 Esc 回原位。键盘聚焦一张按 Alt + ← / → 换位置。不传就不能拖 */
  onReorder?: (from: number, to: number) => void;
  /** 快捷引用（照线上）：展开后鼠标移到卡片上，右下角出「@」，点卡片触发，把这张素材以 @ 引用插进提示词。传了它点卡片就是引用，不再触发 `onItemClick` */
  onQuote?: (item: ReferenceStackItem) => void;
  /** 展开全部（受控）。超过 2 张时悬停只展开三格：第一张、「展开全部」（盖在第二张上）、添加；点「展开全部」参考区铺满输入框宽度，
   *  顶上一行类型选项卡（只是切着看）、「清空全部素材」、收起，下面所有素材换行排开，最后是添加格。点收起、按 Esc、素材删光了收回 */
  showAll?: boolean;
  /** 非受控时的初始状态，默认不展开 */
  defaultShowAll?: boolean;
  /** 展开全部、收回时触发 */
  onShowAllChange?: (showAll: boolean) => void;
  /** 展开全部时顶上的「清空全部素材」：先弹确认（Dialog 400），点「清空」才触发，在这里删掉全部素材。不传就没有这个按钮 */
  onClear?: () => void;
}

interface Ghost {
  item: ReferenceStackItem;
  layout: CardLayout;
  index: number;
}

/**
 * 主站输入框左上角的参考区：72 见方，里面放参考素材。
 * 空：只有添加格；一个：卡片正放，右下角圆形上传按钮继续添加；多个：按添加顺序叠放，最后加的在最上面，露 3 张，右上角写最上面那张的序号；
 * 鼠标移上去向右展开，浮在提示词上面，不把文字往下推，每张 72、间距 6，右上角写序号（和画布一样），鼠标移到哪张，那张的序号换成删除；
 * 上传按钮同时变成最前面的添加格。移开马上收回叠放。
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
    max,
    onReorder,
    onQuote,
    showAll: showAllProp,
    defaultShowAll = false,
    onShowAllChange,
    onClear,
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

  const [showAllState, setShowAllState] = useControllable(showAllProp, defaultShowAll, onShowAllChange);
  const all = n > 0 && showAllState;
  const [filter, setFilter] = useState<Filter>('all');
  // 切类型选项卡：下面的格子硬切，不做移动、淡入淡出（11-23 用户定）。切的那一帧关掉过渡，画完再开回来
  const [filtering, setFiltering] = useState(false);
  useLayoutEffect(() => {
    if (!filtering) return;
    void rootRef.current?.offsetHeight;
    const id = requestAnimationFrame(() => setFiltering(false));
    return () => cancelAnimationFrame(id);
  }, [filtering, filter]);
  // 「清空全部素材」的二次确认（11-23 用户定）
  const [confirmClear, setConfirmClear] = useState(false);
  // 悬停展开；展开全部时一直算展开（序号、删除、@、预览都照展开时的样子）
  const open = n > 0 && (expanded || all);
  const condensed = !all && n >= CONDENSE_FROM;
  const atMax = max != null && n >= max; // 放满了：添加格隐藏
  const lead = atMax ? 0 : 1;
  const full = condensed ? STEP * (2 + lead) : STEP * (n + lead);
  const over = open && !all && full > avail;

  // 展开全部：一排能放几格，按类型筛完排第几格
  const cols = Math.max(1, Math.floor((avail + GAP) / STEP));
  const shownIds = items.filter((i) => filter === 'all' || i.type === filter).map((i) => i.id);
  const cells = Math.max(1, shownIds.length + lead);
  const allWidth = Number.isFinite(avail) ? avail : full;
  const allHeight = HEAD + STEP * Math.ceil(cells / cols) - GAP;
  const trayWidth = all ? allWidth : open ? (over ? avail : full) : CELL;
  const trayHeight = all ? allHeight : CELL;
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

  // 告诉输入框：展开到多宽了，被盖住的字要藏起来，用多长时间。展开全部时提示词排到下面，不用盖
  useLayoutEffect(() => {
    box?.setCoverWidth(open && !all ? trayWidth : 0, duration);
  }, [box, open, all, trayWidth, duration]);

  // 展开全部、收回：先让输入框量好变之前的样子（它要把高度撑开、提示词移下来的动画接上），再切。收回时顺手收起悬停展开，卡片飞回叠放
  const toggleAll = (next: boolean) => {
    if (next === all) return;
    box?.setShowAll(next, duration);
    setShowAllState(next);
    setFilter('all');
    if (!next) setExpanded(false);
  };
  // 素材删光了：收回（删最后一张、清空的时候在点击里已经收了，这里兜底外面直接改 items 的情况）
  useEffect(() => {
    if (showAllState && n === 0) {
      box?.setShowAll(false, duration);
      setShowAllState(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n === 0]);
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
  // 鼠标移开后等一小会儿才收：从卡片挪到上面的预览卡，中间隔着 8 的缝，路上离开参考区就收的话，预览卡跟着关、永远挪不进去。
  // 预览卡是 React 子节点（Portal），鼠标进了它算还在参考区里，会取消这次收起；等的时间和预览卡自己的离开等待一样（Popover 的 LEAVE_MS）
  const leaveTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);
  const enter = () => {
    window.clearTimeout(leaveTimer.current);
    if (!all) setExpanded(true);
  };
  const leave = () => {
    window.clearTimeout(leaveTimer.current);
    if (!all) setExpanded(false);
  };
  // 鼠标移开时，键盘焦点（:focus-visible）还在参考区里就不收，免得删除按钮藏起来、焦点却还在上面
  const mouseLeave = () => {
    if (all) return;
    if (dragging.current || rootRef.current?.querySelector(':focus-visible')) return;
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setExpanded(false), LEAVE_GRACE);
  };

  // 拖着排序：展开动画播完才能拖；拖的时候不收起，松手时鼠标已经在参考区外面就照常收起
  const dragging = useRef(false);
  const sortable = useSortable({
    count: n,
    getItems: () => Array.from(rootRef.current?.querySelectorAll<HTMLElement>('.kv-reference-stack__card[data-sortable]') ?? []),
    scrollerRef,
    onMove: (from, to) => onReorder?.(from, to),
    onDragChange: (d, e) => {
      dragging.current = d;
      const tray = rootRef.current?.querySelector('.kv-reference-stack__tray');
      const r = tray?.getBoundingClientRect();
      if (!d && e && r && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) mouseLeave();
    },
    // 悬停只展开三格时不能拖；展开全部时只在「全部」里拖（按类型筛着看时顺序是断开的）
    disabled: !onReorder || !open || !settled || condensed || (all && filter !== 'all'),
  });

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
  // 展开全部：筛掉的那几张在第一格淡出
  const layouts = items.map((item, i): CardLayout => {
    if (!all) return cardLayout(i, n, open, lead);
    const p = shownIds.indexOf(item.id);
    if (p < 0) return { ...gridAt(0, cols), rot: 0, scale: 0.8, opacity: 0, z: 0, label: false, hidden: true };
    return { ...gridAt(p, cols), rot: 0, scale: 1, opacity: 1, z: i + 1, label: true, hidden: false };
  });
  items.forEach((item, i) => lastLayouts.current.set(item.id, layouts[i]));
  useEffect(() => {
    mounted.current = true;
  }, []);

  // 右上角的名字：每种类型按顺序编号（图片1、视频1…）；拖的时候按排好以后的顺序先变
  const sortedTypes: string[] = [];
  items.forEach((item, i) => {
    sortedTypes[sortable.order(i)] = item.type;
  });
  const labels = referenceLabels(sortedTypes);

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
  // 添加格的位置：平时排最前；只展开三格时在第 3 格；展开全部时跟在最后一张后面
  const addAt = all ? gridAt(shownIds.length, cols) : condensed && open ? { tx: STEP * 2, ty: 0 } : null;
  const remove = onRemove && ((id: string) => {
    if (all && n === 1) toggleAll(false);
    onRemove(id);
  });
  // 类型选项卡上的数：有才写
  const countOf = (f: Filter) => (f === 'all' ? n : items.filter((i) => i.type === f).length);

  return (
    <div
      ref={setRoot}
      className={cx('kv-reference-stack', className)}
      data-all={all ? '' : undefined}
      style={{ '--kv-reference-stack-duration': duration, '--kv-reference-stack-scale': STACK_SCALE, ...(all ? { width: allWidth, height: allHeight } : null), ...style } as CSSProperties}
      {...rest}
    >
      <div
        className="kv-reference-stack__tray"
        data-open={open ? '' : undefined}
        data-all={all ? '' : undefined}
        data-stacked={n > 1 && !open ? '' : undefined}
        data-settled={open && settled ? '' : undefined}
        data-full={over ? '' : undefined}
        data-at-end={over && atEnd ? '' : undefined}
        data-sorting={sortable.sorting ? '' : undefined}
        data-filtering={filtering ? '' : undefined}
        role="group"
        aria-label="参考素材"
        tabIndex={n > 0 ? 0 : undefined}
        style={{ width: trayWidth, height: trayHeight }}
        onMouseEnter={enter}
        onMouseLeave={mouseLeave}
        // 只有键盘聚焦才展开：点了添加格开文件窗口，窗口关掉后浏览器把焦点还给添加格，这时鼠标早不在这里了，不能再展开（展开了就收不回去，要鼠标再碰一下）
        onFocus={(e) => {
          if ((e.target as HTMLElement).matches(':focus-visible')) enter();
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) leave();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && open) {
            // 收起这一层自己吃掉 Esc，不连外层弹窗一起关
            e.preventDefault();
            if (all) toggleAll(false);
            else setExpanded(false);
          }
        }}
        onTouchStart={(e) => {
          if (all || (e.target as HTMLElement).closest('button')) return;
          setExpanded(!expanded);
        }}
      >
        {/* 悬停区往右下多出 10，盖住上传按钮探出去的那块：从按钮上展开后按钮变走了，鼠标还在这里，不会马上收起 */}
        <span className="kv-reference-stack__hit" aria-hidden="true" />
        {/* 展开全部时顶上一行：类型选项卡（只是切着看）｜清空全部素材、收起。平时藏着，展开全部时淡入。
            宽度直接给展开后的宽，不跟着悬停区变宽：只淡入淡出，右边的按钮不从左边滑过来（11-23 用户定） */}
        {n > 0 && (
          <div className="kv-reference-stack__head" style={{ width: allWidth }} aria-hidden={!all || undefined} {...(all ? null : { inert: '' })}>
            <Tabs size={32} value={filter} onChange={(v) => {
                setFiltering(true);
                setFilter(v as Filter);
              }} aria-label="按类型看参考素材">
              {FILTERS.map((f) => (
                <TabItem key={f.value} value={f.value}>
                  {countOf(f.value) ? `${f.label} (${countOf(f.value)})` : f.label}
                </TabItem>
              ))}
            </Tabs>
            <div className="kv-reference-stack__head-actions">
              {onClear && (
                <Button
                  size={32}
                  variant="ghost-muted"
                  onClick={() => setConfirmClear(true)}
                >
                  清空全部素材
                </Button>
              )}
              <IconButton icon="Fold" label="收起素材面板" size={32} variant="ghost-muted" onClick={() => toggleAll(false)} />
            </div>
          </div>
        )}
        <div ref={scrollerRef} className="kv-reference-stack__scroller" onScroll={updateEnd}>
          <div className="kv-reference-stack__track" style={{ width: all ? allWidth : open ? full : CELL, height: all ? allHeight : undefined }}>
            {!atMax && (
              <button
                type="button"
                className="kv-reference-stack__trigger"
                data-compact={compact ? '' : undefined}
                style={addAt ? { left: addAt.tx, top: addAt.ty } : undefined}
                aria-label="添加参考素材"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd?.();
                }}
              >
                <Icon name="AddSmall" className="kv-reference-stack__trigger-icon" />
              </button>
            )}
            {entries.map(({ item, layout, ghost, index }) => (
              <ReferenceStackCard
                key={item.id}
                item={item}
                label={ghost ? item.name : labels[sortable.order(index)]}
                layout={ghost || !open ? layout : { ...layout, tx: layout.tx + sortable.offset(index), ty: layout.ty + sortable.offsetY(index), z: sortable.drag?.from === index ? 200 : layout.z }}
                dragging={!ghost && sortable.drag?.from === index}
                instant={!ghost && open && sortable.instant(index)}
                sortProps={!ghost && onReorder && open ? sortable.itemProps(index) : undefined}
                sorting={sortable.sorting}
                ghost={ghost}
                enter={mounted.current}
                open={open}
                onRemove={remove}
                onItemClick={onQuote ?? onItemClick}
                quotable={!!onQuote}
                // 只展开三格时第二张盖着「展开全部」
                more={!ghost && condensed && index === 1 ? { shown: open, count: n, onClick: () => toggleAll(true) } : undefined}
              />
            ))}
          </div>
        </div>
      </div>
      {/* 放在参考区外层、不放进 tray：弹窗里按 Esc 冒泡上来不会顺手把面板也收起 */}
      {onClear && (
        <Dialog
          size={400}
          open={confirmClear}
          onOpenChange={setConfirmClear}
          title="确定清空全部素材吗？"
          description="清空后，提示词里引用这些素材的 @ 也会一起删掉。"
          footer={
            <>
              <Button size={36} variant="secondary" onClick={() => setConfirmClear(false)}>
                取消
              </Button>
              <Button
                size={36}
                variant="danger"
                onClick={() => {
                  setConfirmClear(false);
                  toggleAll(false);
                  onClear();
                }}
              >
                清空
              </Button>
            </>
          }
        />
      )}
    </div>
  );
});
ReferenceStack.displayName = 'ReferenceStack';

// ---------- 一张卡片 ----------

interface CardProps {
  item: ReferenceStackItem;
  /** 右上角写的名字，比如「图片1」 */
  label: string;
  layout: CardLayout;
  /** 删掉了，正在播消失动画 */
  ghost: boolean;
  /** 刚加进来的：从最上面那张的位置出现 */
  enter: boolean;
  open: boolean;
  onRemove?: (id: string) => void;
  onItemClick?: (item: ReferenceStackItem) => void;
  /** 正被拖着 */
  dragging?: boolean;
  /** 这一刻不加过渡（拖着走、松手那一帧） */
  instant?: boolean;
  /** 有人在拖：预览卡不出 */
  sorting?: boolean;
  /** 点卡片是快捷引用：悬停出右下角的「@」 */
  quotable?: boolean;
  /** 能排序时的拖动、键盘事件 */
  sortProps?: ReturnType<ReturnType<typeof useSortable>['itemProps']>;
  /** 这张盖着「展开全部」：模糊 + Expand 图标，shown 时才显示；盖着时不出序号、删除、@、预览，点了展开全部 */
  more?: { shown: boolean; count: number; onClick: () => void };
}

function ReferenceStackCard({ item, label, layout, ghost, enter, open, onRemove, onItemClick, quotable, dragging, instant, sorting, sortProps, more }: CardProps) {
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

  // 新卡片从哪出来：叠着的时候从最上面那张的位置飞过来；已经展开了（悬停展开、展开全部）就在自己的格子里原地放大、淡入，
  // 别的格子不动，只有添加格往后挪一格（11-23 用户定）
  const l = entered ? layout : open ? { ...layout, scale: layout.scale * 0.8, opacity: 0 } : ENTER;
  const uploading = item.progress != null && item.progress < 100;
  const covered = !!more?.shown;
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
      data-clickable={onItemClick && !covered ? '' : undefined}
      data-removable={onRemove && !covered ? '' : undefined}
      data-more={covered ? '' : undefined}
      data-sortable={ghost ? undefined : ''}
      data-draggable={sortProps ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      data-instant={instant ? '' : undefined}
      style={style}
      role="group"
      aria-label={label}
      aria-hidden={l.hidden || ghost || undefined}
      // 能预览、能排序的卡片能用键盘聚焦（展开后才聚焦得到，和删除按钮一样），Enter、Space 打开预览，Alt + ← / → 换位置
      tabIndex={(onItemClick || sortProps) && open && !ghost && !l.hidden && !covered ? 0 : undefined}
      onClick={() => !covered && onItemClick?.(item)}
      onPointerDown={sortProps?.onPointerDown}
      onDragStart={sortProps?.onDragStart}
      aria-keyshortcuts={sortProps?.['aria-keyshortcuts']}
      onKeyDown={(e) => {
        sortProps?.onKeyDown(e);
        // 焦点在里面的删除按钮上时，按键留给按钮自己
        if (covered || e.defaultPrevented || !onItemClick || e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        onItemClick(item);
      }}
    >
      {/* 展开后悬停出预览卡（和附件条同一个）：图片、视频看大图，音频看名字和时长；上传中、没有图的不出 */}
      <PreviewPopover
        disabled={!open || ghost || sorting || uploading || covered || (item.type !== 'audio' && !item.src)}
        preview={{ type: item.type, src: item.src, video: item.video, name: item.name, duration: item.duration }}
      >
        <ReferenceItem size={72} type={item.type === 'audio' ? 'audio' : 'image'} src={item.src} badge={label} />
      </PreviewPopover>
      {item.duration && <span className="kv-reference-stack__duration">{item.duration}</span>}
      {quotable && !uploading && !covered && (
        <span className="kv-reference-stack__quote" aria-hidden="true">
          @
        </span>
      )}
      {uploading && (
        <div className="kv-reference-stack__upload">
          <UploadRing progress={progress} aria-label={`${item.name}上传中`} />
        </div>
      )}
      {more && (
        // 悬停出提示「查看全部」（照即梦）；外壳铺满卡片，提示对着整张卡居中
        <Tooltip content="查看全部" disabled={!more.shown} className="kv-reference-stack__more-anchor">
          <button
            type="button"
            className="kv-reference-stack__more"
            aria-label={`查看全部素材（共 ${more.count} 个）`}
            tabIndex={more.shown ? 0 : -1}
            aria-hidden={!more.shown || undefined}
            onClick={(e) => {
              e.stopPropagation();
              more.onClick();
            }}
          >
            <Icon name="Expand" />
          </button>
        </Tooltip>
      )}
      {onRemove && !covered && (
        <button
          type="button"
          className="kv-reference-stack__remove"
          aria-label={`删除${label}`}
          tabIndex={open && !ghost ? 0 : -1}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
        >
          <Icon name="CloseSmall" />
        </button>
      )}
    </div>
  );
}
