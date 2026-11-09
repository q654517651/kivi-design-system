import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { AssetThumb } from '../tags-avatar';
import { cx } from '../utils';
import { fileIcon } from './fileIcon';
import './reference.css';

export interface ReferenceItemProps extends HTMLAttributes<HTMLDivElement> {
  /** 尺寸：56 用在节点面板的参考图区；72 用在主站输入框参考区（展开时）和生成记录参考区的悬停浮层。默认 56 */
  size?: 56 | 72;
  /** 类型：图片 / 视频 / 音频 / 文件，默认图片。视频用封面当缩略图；文件按扩展名换图标（PDF、Word、PPT、TXT、表格、CSV、压缩包、JSON，认不出的是通用 File），扩展名写在左下角 */
  type?: 'image' | 'video' | 'audio' | 'file';
  /** 缩略图地址：图片、视频封面用 */
  src?: string;
  /** 文件扩展名，比如「PDF」，文件类型写在左下角（和视频时长一个位置） */
  ext?: string;
  /** 右上角标：序号，或「首帧」「尾帧」。不传就没有。Figma 里默认开，写「1」 */
  badge?: ReactNode;
  /** 左下的视频时长，比如「12s」。不传就没有 */
  duration?: ReactNode;
  /** 底部通栏：Lora 权重。不传就没有（名字不写在卡片上，序号在右上角） */
  weight?: ReactNode;
}

/** 参考图里的一格：缩略图加几个角标。Figma「画布」页 ReferenceItem */
export const ReferenceItem = forwardRef<HTMLDivElement, ReferenceItemProps>(function ReferenceItem(
  { size = 56, type = 'image', src, ext, badge, duration, weight, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-reference-item', size === 72 && 'kv-reference-item--72', className)} {...rest}>
      {/* 音频和文件一个样子：图标占位底 + 图标（11-04 用户定，音频不再用渐变底），左下写时长或扩展名 */}
      {type === 'audio' && <AssetThumb size={size} type="icon" icon="Music" bordered={false} />}
      {type === 'file' && <AssetThumb size={size} type="icon" icon={fileIcon(ext)} bordered={false} />}
      {(type === 'image' || type === 'video') && <AssetThumb size={size} type="image" src={src} bordered={false} />}
      {badge && <span className="kv-reference-item__badge">{badge}</span>}
      {(duration || (type === 'file' && ext)) && <span className="kv-reference-item__duration">{duration ?? ext}</span>}
      {weight && <span className="kv-reference-item__weight">{weight}</span>}
    </div>
  );
});
ReferenceItem.displayName = 'ReferenceItem';
