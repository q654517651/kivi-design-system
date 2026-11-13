import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import { composeHandlers, useMergedRef } from '../hooks';
import { useTooltip, type TooltipPlacement } from '../tooltip/Tooltip';
import { useButtonGroup } from './ButtonGroup';
import './button.css';

export type IconButtonSize = 28 | 32 | 36;
export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ghost-muted' | 'on-media' | 'on-media-ghost';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 图标。换成另一个图标时有 150ms 的淡入加放大（点赞变实心、复制变对勾） */
  icon: IconName;
  /** 说明它是做什么的，读屏和 Tooltip 用，必填 */
  label: string;
  /** 尺寸：28 / 32 / 36，默认 32，放进 ButtonGroup 默认 28。无底灰没有 36 */
  size?: IconButtonSize;
  /** 类型（11-13 改名，和 Button 同一套）：主要 / 次要 / 无底 / 无底灰 / 浮层 / 浮层无底，默认无底。无底灰：图标 50%，悬停出底、回到 100%。浮层无底：平时没有底，悬停、按下的底同浮层，盖在图上的控制条用 */
  variant?: IconButtonVariant;
  /** 选中：只给有开关状态的工具用，比如加粗。主要没有选中；无底灰选中不换色，靠换实心图标 */
  selected?: boolean;
  /**
   * 自带的提示（11-05）：默认开，内容就是 label。看一眼就懂的通用符号（关闭、更多、播放器、翻页箭头、搜索、清除）写 false；
   * 要改内容、带快捷键、换方向的传对象。名单见「设计规则 · 提示」
   */
  tooltip?: boolean | { content?: ReactNode; shortcut?: string; placement?: TooltipPlacement };
  /** 圆形：只在特殊情况用，只给「设计规则 · 按钮」名单里的专用按钮（比如 SendButton）。别的按钮一律方的，不许随手加 */
  round?: boolean;
  /** 加载中：图标换成转圈，不响应悬停；鼠标和键盘（Enter、Space）都不再触发 onClick，也不提交表单。外观不变灰，和 Button 一样。无底灰没有加载中 */
  loading?: boolean;
}

/** 只有图标的按钮。Figma「按钮」页 IconButton */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon,
    label,
    size: sizeProp,
    variant: variantProp,
    selected,
    loading,
    round,
    tooltip = true,
    type = 'button',
    className,
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
  const group = useButtonGroup()?.iconButton;
  const size = sizeProp ?? group?.size ?? 32;
  const variant = variantProp ?? group?.variant ?? 'ghost';
  // 图标换了（点赞变实心、复制变对勾）：新图标淡入 + 从 60% 放大，只在变的那一下播
  const shown = loading ? 'Loading' : icon;
  const prevShown = useRef(shown);
  const swapped = prevShown.current !== shown && !loading;
  useEffect(() => {
    prevShown.current = shown;
  }, [shown]);
  const tipOptions = typeof tooltip === 'object' ? tooltip : {};
  const tip = useTooltip({ content: tipOptions.content ?? label, shortcut: tipOptions.shortcut, placement: tipOptions.placement, disabled: tooltip === false });
  const setRef = useMergedRef(tip.anchorRef as Ref<HTMLButtonElement>, ref);
  return (
    <>
    <button
      ref={setRef}
      type={type}
      className={cx('kv-icon-button', `kv-icon-button--${size}`, `kv-icon-button--${variant}`, round && 'kv-icon-button--round', className)}
      aria-label={label}
      aria-pressed={selected}
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
      {loading ? <Icon key="Loading" name="Loading" spin /> : <Icon key={icon} name={icon} data-swapped={swapped ? '' : undefined} />}
    </button>
    {tip.bubble}
    </>
  );
});
IconButton.displayName = 'IconButton';
