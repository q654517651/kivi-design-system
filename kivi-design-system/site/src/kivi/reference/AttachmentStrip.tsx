import { forwardRef, useCallback, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { ButtonGroup, IconButton } from '../button';
import { Icon } from '../Icon';
import { AddTile } from '../upload/AddTile';
import { UploadRing } from '../upload/UploadRing';
import { PreviewPopover } from './PreviewCard';
import { ReferenceItem } from './ReferenceItem';
import { cx } from '../utils';
import { useSortable } from '../hooks';
import { referenceLabels } from './ReferenceStack';
import './reference.css';

export type AttachmentType = 'image' | 'video' | 'audio' | 'file';

export interface AttachmentItem {
  /** 唯一标识，增删时用它认哪一个 */
  id: string;
  /** 类型：图片 / 视频 / 音频 / 文件 */
  type: AttachmentType;
  /** 名字，比如「图片1」「产品演示.mp4」：悬停预览里显示，读屏用 */
  name: string;
  /** 缩略图地址：图片、视频封面用；音频传音频地址，悬停预览里能播。图片、视频没有地址就没有悬停预览 */
  src?: string;
  /** 视频文件地址，视频用：悬停预览里自动静音循环播放 */
  video?: string;
  /** 时长，视频、音频用，比如「0:12」 */
  duration?: string;
  /** 文件扩展名，文件用，比如「PDF」 */
  ext?: string;
  /** 右上角角标。不传就没有；附件条传了 `labels` 时不用传，自动写「图片1」。悬停出删除时角标被盖住（没传 `onRemove` 没有删除，角标不隐藏） */
  badge?: ReactNode;
  /** 上传进度 0–100。不传是已经上传完；传了盖一层暗色加进度环，没有悬停预览 */
  progress?: number;
}

export interface AttachmentStripProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 附件，按添加顺序排 */
  items: AttachmentItem[];
  /** 点右上角的删除时触发，参数是附件的 id。不传就没有删除（参考图是连线连进来的，只能断线，不能在这里删） */
  onRemove?: (id: string) => void;
  /** 点缩略图时触发，预览大图用。传了缩略图能键盘聚焦 */
  onItemClick?: (item: AttachmentItem) => void;
  /** 拖着排序：按住一格左右拖，别的格子滑开让位，松手触发，参数是从第几格挪到第几格（从 0 起），在这里重排 items。
   *  上下拖出去超过 32 或按 Esc 回原位；键盘聚焦一格按 Alt + ← / → 换位置。不传就不能拖 */
  onReorder?: (from: number, to: number) => void;
  /** 右上角自动写名字：每种类型按排列顺序各自编号（图片1、视频1、图片2…），拖的时候跟着变，和 @ 出来的一致。画布生成面板用。默认 false，用每一项自己的 `badge` */
  labels?: boolean;
  /** 快捷引用（照线上）：鼠标移到缩略图上右下角出「@」，点缩略图触发，把它以 @ 引用插进提示词。传了它点缩略图就是引用，不再触发 `onItemClick` */
  onQuote?: (item: AttachmentItem) => void;
  /** 最后一格的添加格（AddTile 56 · 描边），点了触发。画布生成面板用：点了选本地文件，传完新素材排在最后，添加格跟着往右挪（照线上）。不传就没有 */
  onAdd?: () => void;
  /** 添加格的说明，读屏和悬停用，默认「上传」 */
  addLabel?: string;
}

/**
 * 附件条：输入框上方一排平铺的附件缩略图，画布 Agent 输入框用；主站输入框的参考区（ReferenceStack）是同一套图标、颜色、悬停预览。
 * 缩略图固定用 56 的 ReferenceItem（图片、视频封面、音频、文件四种），间距 4（11-04 用户定：72、间距 8 都没地方用，删了）；视频、音频左下角写时长，文件写扩展名；
 * 鼠标移上去：右上角出删除（传了 `onRemove` 才有），同时出预览卡（PreviewCard）：图片、视频看大图，音频、文件看名字和类型。超出一排时横向滚动，不显示滚动条（用两头的翻页箭头）。
 * 传了 `onReorder` 能拖着排序（11-18 用户要的）：被拖的那格跟手，别的格子滑开让位，拖到两头自动滚。
 * 传了 `onAdd` 最后跟一个添加格（11-19，照线上画布生成面板的快捷上传），不参与拖动。
 * 放不下时两头渐隐（宽 56），渐隐上放箭头（玻璃按钮条 ButtonGroup glass · 32，里面 IconButton 28），点一下翻一页，翻到头那边的箭头就没了（11-19，照线上）。
 */
export const AttachmentStrip = forwardRef<HTMLDivElement, AttachmentStripProps>(function AttachmentStrip(
  { items, onRemove, onItemClick: onItemClickProp, onReorder, labels = false, onQuote, onAdd, addLabel = '上传', className, style, ...rest },
  ref,
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sortable = useSortable({
    count: items.length,
    getItems: () => Array.from(viewportRef.current?.querySelectorAll<HTMLElement>('.kv-attachment-strip__item') ?? []),
    scrollerRef: viewportRef,
    onMove: (from, to) => onReorder?.(from, to),
    disabled: !onReorder,
  });
  const onItemClick = onQuote ?? onItemClickProp;
  // 自动角标：拖的时候按排好以后的顺序先变
  const sortedTypes: string[] = [];
  items.forEach((item, i) => {
    sortedTypes[sortable.order(i)] = item.type;
  });
  const names = referenceLabels(sortedTypes);

  // 放不下时（照线上画布生成面板）：两头渐隐，渐隐上放箭头，点一下翻一页（视口宽）；翻到头这边的箭头就没了、另一边出现。
  // 竖着滚的滚轮也拿来横着滚
  const [edges, setEdges] = useState({ prev: false, next: false });
  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const prev = el.scrollLeft > 2;
    const next = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdges((e) => (e.prev === prev && e.next === next ? e : { prev, next }));
  }, []);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('scroll', measure);
      el.removeEventListener('wheel', onWheel);
      ro.disconnect();
    };
  }, [measure, items.length, onAdd]);
  const page = (dir: -1 | 1) => {
    const el = viewportRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  };
  const showArrows = !sortable.sorting;

  return (
    <div
      ref={ref}
      className={cx('kv-attachment-strip', className)}
      style={style}
      role="group"
      aria-label="附件"
      data-overflow-start={edges.prev ? '' : undefined}
      data-overflow-end={edges.next ? '' : undefined}
      {...rest}
    >
      {/* 横着滚，不要滚动条：有翻页箭头了（11-19 用户定） */}
      <div ref={viewportRef} className="kv-attachment-strip__scroll">
        <div className="kv-attachment-strip__items" data-sorting={sortable.sorting ? '' : undefined}>
          {items.map((item, index) => {
            const sortProps = onReorder ? sortable.itemProps(index) : undefined;
            const dx = sortable.offset(index);
            const uploading = item.progress != null && item.progress < 100;
            const previewable = !uploading && (item.type === 'audio' || item.type === 'file' || Boolean(item.src));
            return (
              <PreviewPopover
                key={item.id}
                disabled={!previewable || sortable.sorting}
                preview={{
                  type: item.type,
                  src: item.src,
                  video: item.video,
                  name: item.name,
                  duration: item.duration,
                  ext: item.ext,
                }}
              >
                <div
                  className="kv-attachment-strip__item"
                  data-uploading={uploading ? '' : undefined}
                  data-clickable={onItemClick ? '' : undefined}
                  data-removable={onRemove ? '' : undefined}
                  data-draggable={sortProps ? '' : undefined}
                  data-dragging={sortable.drag?.from === index ? '' : undefined}
                  data-instant={sortable.instant(index) ? '' : undefined}
                  style={dx ? ({ transform: `translateX(${dx}px)` } as CSSProperties) : undefined}
                  role="group"
                  aria-label={item.name}
                  tabIndex={onItemClick || sortProps ? 0 : undefined}
                  onClick={() => onItemClick?.(item)}
                  onPointerDown={sortProps?.onPointerDown}
                  onDragStart={sortProps?.onDragStart}
                  aria-keyshortcuts={sortProps?.['aria-keyshortcuts']}
                  onKeyDown={(e) => {
                    sortProps?.onKeyDown(e);
                    if (e.defaultPrevented || !onItemClick || e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
                    e.preventDefault();
                    onItemClick(item);
                  }}
                >
                  <ReferenceItem
                    size={56}
                    type={item.type}
                    src={item.src}
                    duration={item.duration}
                    ext={item.ext}
                    badge={labels ? names[sortable.order(index)] : item.badge}
                  />
                  {onQuote && !uploading && (
                    <span className="kv-attachment-strip__quote" aria-hidden="true">
                      @
                    </span>
                  )}
                  {uploading && (
                    <div className="kv-attachment-strip__upload">
                      <UploadRing progress={item.progress} aria-label={`${item.name}上传中`} />
                    </div>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      className="kv-attachment-strip__remove"
                      aria-label={`删除${item.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id);
                      }}
                    >
                      <Icon name="CloseSmall" />
                    </button>
                  )}
                </div>
              </PreviewPopover>
            );
          })}
          {onAdd && <AddTile variant="outline" aria-label={addLabel} onClick={onAdd} />}
        </div>
      </div>
      {showArrows && edges.prev && (
        <ButtonGroup variant="glass" size={32} aria-label="翻页" className="kv-attachment-strip__arrow kv-attachment-strip__arrow--prev">
        <IconButton icon="LeftArrow" label="上一页" onClick={() => page(-1)} />
      </ButtonGroup>
      )}
      {showArrows && edges.next && (
        <ButtonGroup variant="glass" size={32} aria-label="翻页" className="kv-attachment-strip__arrow kv-attachment-strip__arrow--next">
        <IconButton icon="RightArrow" label="下一页" onClick={() => page(1)} />
      </ButtonGroup>
      )}
    </div>
  );
});
AttachmentStrip.displayName = 'AttachmentStrip';
