import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import { useButtonGroup } from './ButtonGroup';
import './button.css';

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger' | 'on-media' | 'light';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 尺寸：小 28 / 中 32 / 大 36，默认中，放进 ButtonGroup 默认小。「轻」没有大 */
  size?: ButtonSize;
  /** 类型：主要 / 次要 / 文字 / 危险 / 浮层 / 轻，默认次要，放进 ButtonGroup 默认文字。轻：底和次要一样，文字和图标 50%，用在生成记录底部这类内容区里的次级操作 */
  variant?: ButtonVariant;
  /** 左图标 */
  leftIcon?: IconName;
  /** 右图标：只放下拉箭头 DownArrowSmall */
  rightIcon?: IconName;
  /** 加载中：左图标换成转圈，不响应悬停；鼠标和键盘（Enter、Space）都不再触发 onClick，也不提交表单。外观不变灰。「轻」没有加载中 */
  loading?: boolean;
}

/** 带文字的按钮，点了做一个动作。Figma「按钮」页 Button */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { size: sizeProp, variant: variantProp, leftIcon, rightIcon, loading, type = 'button', className, children, onClick, ...rest },
  ref,
) {
  const group = useButtonGroup()?.button;
  const size = sizeProp ?? group?.size ?? 'md';
  const variant = variantProp ?? group?.variant ?? 'secondary';
  return (
    <button
      ref={ref}
      type={type}
      className={cx('kv-button', `kv-button--${size}`, `kv-button--${variant}`, className)}
      aria-busy={loading || undefined}
      // 加载中：拦掉点击（Enter、Space 也是点击），连表单提交一起挡住；不用 disabled，免得变灰、丢焦点
      onClick={(e) => {
        if (loading) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      {...rest}
    >
      {loading ? <Icon name="Loading" spin /> : leftIcon && <Icon name={leftIcon} />}
      <span>{children}</span>
      {rightIcon && <Icon name={rightIcon} />}
    </button>
  );
});
Button.displayName = 'Button';
