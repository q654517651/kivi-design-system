import { forwardRef, type HTMLAttributes } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import './tabs-tags-avatar.css';

export type TagVariant = 'default' | 'on-media' | 'brand';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** 类型：默认 / 覆盖（盖在图片、视频上）/ 品牌，默认「默认」 */
  variant?: TagVariant;
  /** 缩略图：参考图的地址，16 × 16，圆角 2 */
  thumb?: string;
  /** 左图标：16 */
  icon?: IconName;
}

/** 展示参数、状态这类短信息，不能点。Figma「选项卡、标签和头像」页 Tag */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { variant = 'default', thumb, icon, className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx('kv-tag', `kv-tag--${variant}`, className)} {...rest}>
      {thumb && <img src={thumb} alt="" />}
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
});
Tag.displayName = 'Tag';
