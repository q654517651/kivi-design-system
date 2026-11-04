import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import { useButtonGroup } from './ButtonGroup';
import './button.css';

export type IconButtonSize = 28 | 32 | 36;
export type IconButtonVariant = 'primary' | 'secondary' | 'text' | 'on-media' | 'on-media-ghost' | 'light';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 图标。换成另一个图标时有 150ms 的淡入加放大（点赞变实心、复制变对勾） */
  icon: IconName;
  /** 说明它是做什么的，读屏和 Tooltip 用，必填 */
  label: string;
  /** 尺寸：28 / 32 / 36，默认 32，放进 ButtonGroup 默认 28。「轻」没有 36 */
  size?: IconButtonSize;
  /** 类型：主要 / 次要 / 文字 / 浮层 / 浮层无底 / 轻，默认文字。浮层无底：平时没有底，悬停、按下的底同浮层，盖在图上的控制条用 */
  variant?: IconButtonVariant;
  /** 选中：只给有开关状态的工具用，比如加粗。主要和轻没有选中 */
  selected?: boolean;
  /** 加载中：图标换成转圈，不响应悬停；鼠标和键盘（Enter、Space）都不再触发 onClick，也不提交表单。外观不变灰，和 Button 一样。「轻」没有加载中 */
  loading?: boolean;
}

/** 只有图标的按钮。Figma「按钮」页 IconButton */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, size: sizeProp, variant: variantProp, selected, loading, type = 'button', className, onClick, ...rest },
  ref,
) {
  const group = useButtonGroup()?.iconButton;
  const size = sizeProp ?? group?.size ?? 32;
  const variant = variantProp ?? group?.variant ?? 'text';
  // 图标换了（点赞变实心、复制变对勾）：新图标淡入 + 从 60% 放大，只在变的那一下播
  const shown = loading ? 'Loading' : icon;
  const prevShown = useRef(shown);
  const swapped = prevShown.current !== shown && !loading;
  useEffect(() => {
    prevShown.current = shown;
  }, [shown]);
  return (
    <button
      ref={ref}
      type={type}
      className={cx('kv-icon-button', `kv-icon-button--${size}`, `kv-icon-button--${variant}`, className)}
      aria-label={label}
      aria-pressed={selected}
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
      {loading ? <Icon key="Loading" name="Loading" spin /> : <Icon key={icon} name={icon} data-swapped={swapped ? '' : undefined} />}
    </button>
  );
});
IconButton.displayName = 'IconButton';
