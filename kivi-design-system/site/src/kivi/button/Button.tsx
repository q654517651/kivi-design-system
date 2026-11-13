import { forwardRef, useRef, type ButtonHTMLAttributes, type Ref } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import { composeHandlers, useMergedRef, useTruncated } from '../hooks';
import { useTooltip } from '../tooltip/Tooltip';
import { useButtonGroup } from './ButtonGroup';
import './button.css';

export type ButtonSize = 28 | 32 | 36;
export type ButtonVariant = 'primary' | 'secondary' | 'secondary-muted' | 'ghost' | 'ghost-muted' | 'danger' | 'on-media';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 尺寸（高度）：28 / 32 / 36，默认 32，放进 ButtonGroup 默认 28。次要灰、无底灰没有 36 */
  size?: ButtonSize;
  /**
   * 类型（11-13 改名：一个类型一个语义，不另加开关去拼）：主要 / 次要 / 次要灰 / 无底 / 无底灰 / 危险 / 浮层，默认次要，放进 ButtonGroup 默认无底。
   * 「灰」= 文字和图标 50%，悬停、按下回到 100%。次要灰：底和次要一样，用在占位处、生成记录底部这类内容区里的次级操作；
   * 无底灰：没有底，悬停出底，比如侧栏分组标题右边的「全部」，和 IconButton 的无底灰一样
   */
  variant?: ButtonVariant;
  /** 左图标 */
  leftIcon?: IconName;
  /** 右图标：只放下拉箭头 DownArrowSmall，减弱一档（tertiary），和 Select 的箭头一样 */
  rightIcon?: IconName;
  /** 加载中：左图标换成转圈，不响应悬停；鼠标和键盘（Enter、Space）都不再触发 onClick，也不提交表单。外观不变灰。次要灰、无底灰没有加载中 */
  loading?: boolean;
}

/**
 * 带文字的按钮，点了做一个动作。Figma「按钮」页 Button。
 * 放不下时文字末尾省略号、内边距不让，悬停出 Tooltip 看全文（设计规则 · 状态）
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    size: sizeProp,
    variant: variantProp,
    leftIcon,
    rightIcon,
    loading,
    type = 'button',
    className,
    children,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onPointerDown,
    'aria-describedby': describedBy,
    ...rest
  },
  ref,
) {
  const group = useButtonGroup()?.button;
  const size = sizeProp ?? group?.size ?? 32;
  const variant = variantProp ?? group?.variant ?? 'secondary';
  const labelRef = useRef<HTMLSpanElement>(null);
  const truncated = useTruncated(labelRef, [children]);
  const tip = useTooltip({ content: children, disabled: !truncated });
  const setRef = useMergedRef(tip.anchorRef as Ref<HTMLButtonElement>, ref);
  return (
    <>
    <button
      ref={setRef}
      type={type}
      className={cx('kv-button', `kv-button--${size}`, `kv-button--${variant}`, className)}
      aria-busy={loading || undefined}
      aria-describedby={[describedBy, tip.describedBy].filter(Boolean).join(' ') || undefined}
      onMouseEnter={composeHandlers(onMouseEnter, tip.handlers.onMouseEnter)}
      onMouseLeave={composeHandlers(onMouseLeave, tip.handlers.onMouseLeave)}
      onFocus={composeHandlers(onFocus, tip.handlers.onFocus)}
      onBlur={composeHandlers(onBlur, tip.handlers.onBlur)}
      onPointerDown={composeHandlers(onPointerDown, tip.handlers.onPointerDown)}
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
      <span ref={labelRef} className="kv-button__label">
        {children}
      </span>
      {rightIcon && <Icon name={rightIcon} className="kv-button__arrow" />}
    </button>
    {tip.bubble}
    </>
  );
});
Button.displayName = 'Button';
