import { forwardRef, type HTMLAttributes } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import './tabs-tags-avatar.css';

export type AssetThumbSize = 16 | 24 | 56 | 72;
export type AssetThumbType = 'image' | 'audio' | 'icon';

export interface AssetThumbProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** 尺寸：16 / 24 / 56 / 72，默认 16 */
  size?: AssetThumbSize;
  /** 类型：图片（图片、视频首帧）/ 音频 / 图标（没封面时占位），默认图片 */
  type?: AssetThumbType;
  /** 图片类型的图片地址 */
  src?: string;
  /** 图标类型的图标，默认 Message；对话用 Message，画布用 Canvas。音频固定是 Music */
  icon?: IconName;
}

/** 素材的小预览。序号、时长这类角标由外层叠加，不放进来。Figma「选项卡、标签和头像」页 AssetThumb */
export const AssetThumb = forwardRef<HTMLSpanElement, AssetThumbProps>(function AssetThumb(
  { size = 16, type = 'image', src, icon = 'Message', className, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx('kv-asset-thumb', `kv-asset-thumb--${size}`, `kv-asset-thumb--${type}`, className)} {...rest}>
      {type === 'image' && src && <img src={src} alt="" />}
      {type === 'audio' && <Icon name="Music" />}
      {type === 'icon' && <Icon name={icon} />}
    </span>
  );
});
AssetThumb.displayName = 'AssetThumb';
