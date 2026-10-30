import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import { useButtonGroup } from './ButtonGroup';
import './button.css';

export type IconButtonSize = 28 | 32 | 36;
export type IconButtonVariant = 'primary' | 'secondary' | 'text' | 'on-media' | 'on-media-ghost' | 'light';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 图标 */
  icon: IconName;
  /** 说明它是做什么的，读屏和 Tooltip 用，必填 */
  label: string;
  /** 尺寸：28 / 32 / 36，默认 32，放进 ButtonGroup 默认 28。「轻」没有 36 */
  size?: IconButtonSize;
  /** 类型：主要 / 次要 / 文字 / 浮层 / 浮层无底 / 轻，默认文字。浮层无底：平时没有底，悬停、按下的底同浮层，盖在图上的控制条用 */
  variant?: IconButtonVariant;
  /** 选中：只给有开关状态的工具用，比如加粗。主要和轻没有选中 */
  selected?: boolean;
}

/** 只有图标的按钮。Figma「按钮」页 IconButton */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, size: sizeProp, variant: variantProp, selected, type = 'button', className, ...rest },
  ref,
) {
  const group = useButtonGroup()?.iconButton;
  const size = sizeProp ?? group?.size ?? 32;
  const variant = variantProp ?? group?.variant ?? 'text';
  return (
    <button
      ref={ref}
      type={type}
      className={cx('kv-icon-button', `kv-icon-button--${size}`, `kv-icon-button--${variant}`, className)}
      aria-label={label}
      aria-pressed={selected}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
});
IconButton.displayName = 'IconButton';
