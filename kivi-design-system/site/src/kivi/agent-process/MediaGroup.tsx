import {
  forwardRef,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { Tag } from '../tags-avatar';
import { cx } from '../utils';
import { useControllable } from '../hooks';
import { ProcessRow } from './ProcessRow';
import './agent-process.css';

export type MediaGroupType = 'image' | 'video';

export interface MediaGroupItem {
  /** 唯一标识 */
  id: string;
  /** 图片地址（视频传封面）。失败的可以不传 */
  src?: string;
  /** 宽高比：数字（宽 / 高）或「16:9」这种写法，限制在 9:16 到 16:9 之间，默认 1:1 */
  ratio?: number | string;
  /** 结果：成功 / 失败，默认成功 */
  status?: 'done' | 'failed';
  /** 节点名，悬停时显示在左下 */
  name?: string;
}

export interface MediaGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  /** 这一组结果，按生成顺序 */
  items: MediaGroupItem[];
  /** 产出类型，决定标题行的图标和文字，默认图片 */
  type?: MediaGroupType;
  /** 标题行文字。不传按结果算，比如「图片已生成 ×2，图片生成失败 ×3」 */
  title?: ReactNode;
  /** 展开：受控 */
  expanded?: boolean;
  /** 展开：非受控的初始值，默认收起 */
  defaultExpanded?: boolean;
  /** 展开 / 收起时触发 */
  onExpandedChange?: (expanded: boolean) => void;
  /** 展开后点某一张：画布里定位到这个节点 */
  onItemClick?: (item: MediaGroupItem) => void;
}

/** 卡片最小宽 182、间距 12、至少两列：内容宽 396 是 2 列，570 是 3 列（照线上） */
const MIN_COLUMN = 182;
const GAP = 12;
/** 叠放后两层：往右错开 4、8，以中心旋转 2°、4°（照 LibTV） */
const LAYER_OFFSET = 4;
const LAYER_ROTATE = 2;
const MIN_RATIO = 9 / 16;
const MAX_RATIO = 16 / 9;

const TYPE_TEXT: Record<MediaGroupType, { label: string; icon: IconName }> = {
  image: { label: '图片', icon: 'ImageGeneration' },
  video: { label: '视频', icon: 'VideoGeneration' },
};

const toRatio = (ratio: MediaGroupItem['ratio']) => {
  let r = typeof ratio === 'number' ? ratio : NaN;
  if (typeof ratio === 'string') {
    const [w, h] = ratio.split(':').map(Number);
    r = w / h;
  }
  if (!Number.isFinite(r) || r <= 0) r = 1;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, r));
};

const columnCount = (width: number) => Math.max(2, Math.floor((width + GAP) / (MIN_COLUMN + GAP)));

/** 展开、收起的时长是 --motion-duration-400 的几倍：400ms 起，每多一张加 10ms，最多 700ms（同参考区） */
const durationFactor = (count: number) => Math.min(1 + (count - 1) / 40, 1.75);

type Rect = { x: number; y: number; w: number; h: number };

/**
 * 生成结果组：Agent 对话里同步的画布节点。标题行 + 结果，收起是叠放，展开是瀑布流。
 * 叠放的封面取第一张成功的（全失败取第一张），叠放比例跟封面走；只有一张时不能收起。
 * 动画只动 transform，缓动 --motion-ease-expand；展开 400ms 起，每多一张加 10ms，最多 700ms，收起固定 300ms。
 */
export const MediaGroup = forwardRef<HTMLDivElement, MediaGroupProps>(function MediaGroup(
  {
    items,
    type = 'image',
    title,
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    onItemClick,
    className,
    style,
    ...rest
  },
  ref,
) {
  const [expandedState, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const collapsible = items.length > 1;
  const expanded = !collapsible || expandedState;

  // 列宽跟着容器宽度走
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const coverIndex = Math.max(0, items.findIndex((it) => it.status !== 'failed'));

  const layout = useMemo(() => {
    const cols = columnCount(width);
    const colW = width > 0 ? (width - GAP * (cols - 1)) / cols : MIN_COLUMN;
    // 展开：按顺序放进最短的一列
    const heights = new Array<number>(cols).fill(0);
    const open: Rect[] = items.map((it) => {
      const c = heights.indexOf(Math.min(...heights));
      const h = colW / toRatio(it.ratio);
      const rect = { x: c * (colW + GAP), y: heights[c], w: colW, h };
      heights[c] += h + GAP;
      return rect;
    });
    const openHeight = Math.max(0, Math.max(...heights) - GAP);
    // 收起：封面在左上，宽一列，比例跟封面
    const coverH = colW / toRatio(items[coverIndex]?.ratio);
    return { colW, open, openHeight, coverH };
  }, [items, width, coverIndex]);

  const stackLayers = Math.min(items.length - 1, 2);
  // 旋转后的层会往下探出一点，高度要留出来
  const tilt = (stackLayers * LAYER_ROTATE * Math.PI) / 180;
  const overhang = (layout.colW / 2) * Math.sin(tilt) + (layout.coverH / 2) * (Math.cos(tilt) - 1);
  const stackHeight = layout.coverH + Math.max(0, Math.ceil(overhang));
  const duration = expanded
    ? `calc(var(--motion-duration-400) * ${durationFactor(items.length)})`
    : 'var(--motion-duration-300)';

  // 收起时每张在哪：封面原位；其余等比缩进封面里，往右错到后两层的位置，藏在封面后面
  let rank = 0;
  const placed = items.map((it, i) => {
    const open = layout.open[i];
    if (expanded) return { x: open.x, y: open.y, s: 1 };
    if (i === coverIndex) return { x: 0, y: 0, s: 1 };
    rank += 1;
    const s = Math.min(layout.colW / open.w, layout.coverH / open.h);
    const offset = Math.min(rank, 2) * LAYER_OFFSET;
    return {
      x: (layout.colW - open.w * s) / 2 + offset,
      y: (layout.coverH - open.h * s) / 2,
      s,
    };
  });

  const done = items.filter((it) => it.status !== 'failed').length;
  const failed = items.length - done;
  const { label, icon } = TYPE_TEXT[type];
  const heading =
    title ??
    [done > 0 && `${label}已生成 ×${done}`, failed > 0 && `${label}生成失败 ×${failed}`].filter(Boolean).join('，');

  return (
    <div
      ref={ref}
      className={cx('kv-media-group', className)}
      data-expanded={expanded ? '' : undefined}
      style={{ '--kv-media-group-duration': duration, ...style } as CSSProperties}
      {...rest}
    >
      <ProcessRow icon={icon} action={heading} arrow={collapsible} expanded={expanded} onExpandedChange={setExpanded} />
      <div
        ref={boxRef}
        className="kv-media-group__body"
        style={{ height: expanded ? layout.openHeight : stackHeight }}
      >
        {/* 叠放的后两层：和封面一样大，比例跟封面 */}
        {collapsible &&
          [2, 1].slice(2 - stackLayers).map((n) => (
            <span
              key={n}
              className="kv-media-group__layer"
              data-depth={n}
              aria-hidden
              style={{
                width: layout.colW,
                height: layout.coverH,
                transform: `translateX(${n * LAYER_OFFSET}px) rotate(${n * LAYER_ROTATE}deg)`,
              }}
            />
          ))}
        {items.map((it, i) => {
          const isCover = i === coverIndex;
          const hidden = !expanded && !isCover;
          const open = layout.open[i];
          const p = placed[i];
          const tileFailed = it.status === 'failed';
          return (
            <button
              key={it.id}
              type="button"
              className="kv-media-group__card"
              data-cover={isCover ? '' : undefined}
              data-hidden={hidden ? '' : undefined}
              data-failed={tileFailed ? '' : undefined}
              tabIndex={hidden ? -1 : undefined}
              aria-hidden={hidden || undefined}
              aria-label={expanded ? `在画布里定位：${it.name ?? `第 ${i + 1} 个结果`}` : `展开 ${items.length} 个结果`}
              style={{ width: open.w, height: open.h, transform: `translate(${p.x}px, ${p.y}px) scale(${p.s})` }}
              onClick={() => (expanded ? onItemClick?.(it) : setExpanded(true))}
            >
              {tileFailed ? (
                <span className="kv-media-group__failed">
                  <img src="./empty-state/failed.png" alt="" />
                  <span>生成失败，消耗猕猴桃已退回</span>
                </span>
              ) : (
                it.src && <img className="kv-media-group__media" src={it.src} alt="" draggable={false} />
              )}
              {it.name && !tileFailed && (
                <span className="kv-media-group__overlay" aria-hidden>
                  <span className="kv-media-group__name">{it.name}</span>
                </span>
              )}
              {!tileFailed && (
                <span className="kv-media-group__locate" aria-hidden>
                  <Icon name="Locate" />
                </span>
              )}
              {isCover && collapsible && (
                <span className="kv-media-group__count" aria-hidden>
                  <Tag variant="on-media">+{items.length - 1}</Tag>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
MediaGroup.displayName = 'MediaGroup';
