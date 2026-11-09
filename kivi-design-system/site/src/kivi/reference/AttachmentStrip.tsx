import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { UploadRing } from '../upload/UploadRing';
import { PreviewPopover } from './PreviewCard';
import { ReferenceItem } from './ReferenceItem';
import { cx } from '../utils';
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
  /** 右上角序号，比如「1」：画布生成面板里的参考图按连进来的顺序写。不传就没有；悬停出删除时序号被盖住（没传 `onRemove` 没有删除，序号不隐藏） */
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
}

/**
 * 附件条：输入框上方一排平铺的附件缩略图，画布 Agent 输入框用；主站输入框的参考区（ReferenceStack）是同一套图标、颜色、悬停预览。
 * 缩略图固定用 56 的 ReferenceItem（图片、视频封面、音频、文件四种），间距 4（11-04 用户定：72、间距 8 都没地方用，删了）；视频、音频左下角写时长，文件写扩展名；
 * 鼠标移上去：右上角出删除（传了 `onRemove` 才有），同时出预览卡（PreviewCard）：图片、视频看大图，音频、文件看名字和类型。超出一排时横向滚动，滚动条细。
 */
export const AttachmentStrip = forwardRef<HTMLDivElement, AttachmentStripProps>(function AttachmentStrip(
  { items, onRemove, onItemClick, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('kv-attachment-strip', className)}
      style={style}
      role="group"
      aria-label="附件"
      {...rest}
    >
      {items.map((item) => {
        const uploading = item.progress != null && item.progress < 100;
        const previewable = !uploading && (item.type === 'audio' || item.type === 'file' || Boolean(item.src));
        return (
          <PreviewPopover
            key={item.id}
            disabled={!previewable}
            preview={{ type: item.type, src: item.src, video: item.video, name: item.name, duration: item.duration, ext: item.ext }}
          >
            <div
              className="kv-attachment-strip__item"
              data-uploading={uploading ? '' : undefined}
              data-clickable={onItemClick ? '' : undefined}
              data-removable={onRemove ? '' : undefined}
              role="group"
              aria-label={item.name}
              tabIndex={onItemClick ? 0 : undefined}
              onClick={() => onItemClick?.(item)}
              onKeyDown={(e) => {
                if (!onItemClick || e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
                e.preventDefault();
                onItemClick(item);
              }}
            >
              <ReferenceItem size={56} type={item.type} src={item.src} duration={item.duration} ext={item.ext} badge={item.badge} />
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
    </div>
  );
});
AttachmentStrip.displayName = 'AttachmentStrip';
