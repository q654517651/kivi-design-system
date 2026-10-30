import { createContext, forwardRef, useContext, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils';
import type { ButtonSize, ButtonVariant } from './Button';
import type { IconButtonSize, IconButtonVariant } from './IconButton';
import './button.css';

/** 按钮条里的默认尺寸和类型：按钮自己没写 size、variant 时用它 */
interface ButtonGroupDefaults {
  button: { size: ButtonSize; variant: ButtonVariant };
  iconButton: { size: IconButtonSize; variant: IconButtonVariant };
}

const GROUP_DEFAULTS: ButtonGroupDefaults = {
  button: { size: 'sm', variant: 'text' },
  iconButton: { size: 28, variant: 'text' },
};

const ButtonGroupContext = createContext<ButtonGroupDefaults | null>(null);

/** Button、IconButton 用：在按钮条里时拿默认的尺寸和类型 */
export const useButtonGroup = () => useContext(ButtonGroupContext);

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** 读屏用，说明这一排是什么，比如「节点操作」 */
  'aria-label'?: string;
  /** 里面放 IconButton、Button，默认就是 IconButton 28 · 文字、Button 小 · 文字，不用自己写尺寸和类型。不同类的按钮之间放 ButtonGroupDivider */
  children?: ReactNode;
}

/**
 * 按钮条：盖在图片、视频上的一排按钮合成一条。高 32，玻璃底 + 描边，圆角 8，四周 2，按钮间距 4。
 * Figma「按钮」页 ButtonGroup
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { className, children, ...rest },
  ref,
) {
  return (
    <ButtonGroupContext.Provider value={GROUP_DEFAULTS}>
      <div ref={ref} role="group" className={cx('kv-button-group', className)} {...rest}>
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
});
ButtonGroup.displayName = 'ButtonGroup';

export type ButtonGroupDividerProps = HTMLAttributes<HTMLSpanElement>;

/** 按钮条里的分割线：竖线 1 × 16，只放在不同类的按钮之间，比如「全屏、下载 | 4 ⌄」 */
export const ButtonGroupDivider = forwardRef<HTMLSpanElement, ButtonGroupDividerProps>(function ButtonGroupDivider(
  { className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      className={cx('kv-button-group__divider', className)}
      {...rest}
    />
  );
});
ButtonGroupDivider.displayName = 'ButtonGroupDivider';
