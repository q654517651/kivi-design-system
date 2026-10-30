import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './tabs-tags-avatar.css';

export type AvatarSize = 16 | 24 | 32;
export type AvatarType = 'image' | 'text';

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** 用户名：图片的 alt、文字的 aria-label，必填 */
  name: string;
  /** 尺寸：16 卡片作者 / 24 列表、对话 / 32 详情作者、导航，默认 16 */
  size?: AvatarSize;
  /** 头像图的地址。没有就显示文字 */
  src?: string;
  /** 类型：图片 / 文字。不写时有 src 是图片，没有是文字 */
  type?: AvatarType;
  /** 首字：文字类型显示的字，不写取 name 的第一个字 */
  initial?: string;
}

/** 圆形的用户头像，没有头像图时显示用户名首字。Figma「选项卡、标签和头像」页 Avatar */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { name, size = 16, src, type, initial, className, ...rest },
  ref,
) {
  const image = (type ?? (src ? 'image' : 'text')) === 'image' && Boolean(src);
  const cls = cx('kv-avatar', `kv-avatar--${size}`, `kv-avatar--${image ? 'image' : 'text'}`, className);
  if (image) {
    return (
      <span ref={ref} className={cls} {...rest}>
        <img src={src} alt={name} />
      </span>
    );
  }
  return (
    <span ref={ref} className={cls} role="img" aria-label={name} {...rest}>
      {initial ?? Array.from(name)[0] ?? ''}
    </span>
  );
});
Avatar.displayName = 'Avatar';
