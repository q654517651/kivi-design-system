import { forwardRef, type HTMLAttributes } from 'react';
import { ICONS, ICON_VIEWBOX, type IconName } from './icons';
import { cx } from './utils';

export type IconSize = 16 | 20 | 24 | 40 | 64;

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  /** 图标名，和 Figma「图标」页一样，区分大小写 */
  name: IconName;
  /** 尺寸，照 Figma Icon 组件，默认 16。放进按钮这类组件里时由组件定，不用传 */
  size?: IconSize;
  /** 转圈：Loading 图标 1 秒一圈，匀速 */
  spin?: boolean;
}

/** 图标，图形和名字都来自 Figma「图标」页 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon({ name, size, spin, className, ...rest }, ref) {
  return (
    <span
      ref={ref}
      className={cx('kv-icon', size && size !== 16 && `kv-icon--${size}`, spin && 'kv-icon--spin', className)}
      data-icon={name}
      aria-hidden="true"
      {...rest}
    >
      <svg
        viewBox={ICON_VIEWBOX[name] ?? '0 0 24 24'}
        fill="currentColor"
        dangerouslySetInnerHTML={{ __html: ICONS[name] }}
      />
    </span>
  );
});
Icon.displayName = 'Icon';
