import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { AssetThumb } from '../tabs-tags-avatar';
import { cx } from '../utils';
import './canvas.css';

export interface ReferenceItemProps extends HTMLAttributes<HTMLDivElement> {
  /** 尺寸：56 用在节点面板的参考图区；72 用在主站输入框参考区（展开时）和生成记录参考区的悬停浮层。默认 56 */
  size?: 56 | 72;
  /** 缩略图类型：图片 / 音频，默认图片 */
  type?: 'image' | 'audio';
  /** 缩略图地址：图片用 */
  src?: string;
  /** 右上角标：序号，或「首帧」「尾帧」。不传就没有。Figma 里默认开，写「1」 */
  badge?: ReactNode;
  /** 左下的视频时长，比如「12s」。不传就没有 */
  duration?: ReactNode;
  /** 底部通栏：Lora 权重，或「图片1」这类名字。不传就没有 */
  weight?: ReactNode;
}

/** 参考图里的一格：缩略图加几个角标。Figma「画布」页 ReferenceItem */
export const ReferenceItem = forwardRef<HTMLDivElement, ReferenceItemProps>(function ReferenceItem(
  { size = 56, type = 'image', src, badge, duration, weight, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-reference-item', size === 72 && 'kv-reference-item--72', className)} {...rest}>
      <AssetThumb size={size} type={type} src={src} />
      {badge && <span className="kv-reference-item__badge">{badge}</span>}
      {duration && <span className="kv-reference-item__duration">{duration}</span>}
      {weight && <span className="kv-reference-item__weight">{weight}</span>}
    </div>
  );
});
ReferenceItem.displayName = 'ReferenceItem';
