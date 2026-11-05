import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { Popover } from '../tooltip';
import { AssetThumb } from '../tags-avatar';
import { cx } from '../utils';
import { fileIcon } from './fileIcon';
import './reference.css';

export type PreviewCardType = 'image' | 'video' | 'audio' | 'file';

/** 标注框：相对 160 见方的预览图，四个值都是 0–1 的比例 */
export interface PreviewCardBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PreviewCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 类型：图片 / 视频 / 音频 / 文件，默认图片。图片、视频是 160 见方的大图；音频、文件是缩略图加两行字 */
  type?: PreviewCardType;
  /** 大图地址：图片、视频封面用 */
  src?: string;
  /** 名字，比如「图片1」「产品演示.mp4」，一行，超出省略 */
  name?: ReactNode;
  /** 说明：12 号 tertiary，最多 4 行。标注点的描述写这里 */
  description?: ReactNode;
  /** 时长，视频、音频用，比如「0:12」 */
  duration?: ReactNode;
  /** 文件扩展名，文件用，比如「PDF」 */
  ext?: ReactNode;
  /** 标注框：在大图上画 1.5px 品牌色的框，标注点的预览用 */
  box?: PreviewCardBox;
}

/**
 * 悬停预览卡的内容：附件条、参考图、输入框里的引用标签、标注点悬停时看大图、类型、详情用同一个。
 * 只是内容，不带底；悬停出预览一律用下面的 `PreviewPopover`，别自己再包 Popover。
 */
export const PreviewCard = forwardRef<HTMLDivElement, PreviewCardProps>(function PreviewCard(
  { type = 'image', src, name, description, duration, ext, box, className, ...rest },
  ref,
) {
  const big = type === 'image' || type === 'video';
  const boxStyle: CSSProperties | undefined = box
    ? { left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` }
    : undefined;
  return (
    <div ref={ref} className={cx('kv-preview-card', big ? 'kv-preview-card--big' : 'kv-preview-card--row', className)} {...rest}>
      {big ? (
        <div className="kv-preview-card__media">
          {src && <img src={src} alt="" />}
          {boxStyle && <span className="kv-preview-card__box" style={boxStyle} />}
          {type === 'video' && duration && <span className="kv-preview-card__duration">{duration}</span>}
        </div>
      ) : (
        <AssetThumb size={56} type="icon" icon={type === 'audio' ? 'Music' : fileIcon(ext)} />
      )}
      {(name != null || description != null || (!big && (duration || ext))) && (
        <div className="kv-preview-card__text">
          {name != null && <div className="kv-preview-card__name">{name}</div>}
          {!big && (duration || ext) && <div className="kv-preview-card__meta">{duration ?? ext}</div>}
          {description != null && <div className="kv-preview-card__description">{description}</div>}
        </div>
      )}
    </div>
  );
});
PreviewCard.displayName = 'PreviewCard';

export interface PreviewPopoverProps {
  /** 预览卡的内容：类型、大图、名字、时长、扩展名、说明、标注框，同 PreviewCard */
  preview: Omit<PreviewCardProps, keyof HTMLAttributes<HTMLDivElement>> & { description?: ReactNode };
  /** 不出预览：上传中、没有图的时候 */
  disabled?: boolean;
  /** 触发元素：缩略图、引用标签、标注点 */
  children: ReactElement;
}

/**
 * 悬停预览：所有素材的悬停预览都用它，样子和时机只写这一份（11-04 用户定统一）。
 * 玻璃底（Popover panel），在触发元素上方、左对齐，间距 8，悬停 200ms 出现，鼠标能挪进卡片里。
 * 用在参考区、附件条（含画布生成面板的参考图）、标注标签。
 * 不转发 ref：它只是把 Popover 和 PreviewCard 拼在一起，ref 由 children（触发元素）自己带。
 */
export function PreviewPopover({ preview, disabled, children }: PreviewPopoverProps) {
  return (
    <Popover variant="panel" placement="top-start" offset={8} disabled={disabled} content={<PreviewCard {...preview} />}>
      {children}
    </Popover>
  );
}
PreviewPopover.displayName = 'PreviewPopover';
