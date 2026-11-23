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

export type ButtonGroupSize = 32 | 44 | 56;

// 条越高，里面的按钮越大：32 的条放 28 的按钮，44、56 的条放 32 的按钮（Button 32、IconButton 32）
const GROUP_DEFAULTS: Record<ButtonGroupSize, ButtonGroupDefaults> = {
  32: { button: { size: 28, variant: 'ghost' }, iconButton: { size: 28, variant: 'ghost' } },
  44: { button: { size: 32, variant: 'ghost' }, iconButton: { size: 32, variant: 'ghost' } },
  56: { button: { size: 32, variant: 'ghost' }, iconButton: { size: 32, variant: 'ghost' } },
};

// 竖排的 44 条（画布左侧工具栏）放 36 的按钮、排得紧（11-23 用户定，照即梦：按钮大、间距小）
const VERTICAL_44: ButtonGroupDefaults = { button: { size: 36, variant: 'ghost' }, iconButton: { size: 36, variant: 'ghost' } };

const ButtonGroupContext = createContext<ButtonGroupDefaults | null>(null);

/** Button、IconButton 用：在按钮条里时拿默认的尺寸和类型 */
export const useButtonGroup = () => useContext(ButtonGroupContext);

export type ButtonGroupVariant = 'on-media' | 'glass' | 'surface';

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** 底：浮层 on-media（盖在图片、视频上）/ 玻璃（浮在画布这种深色底上，比如缩放条、节点工具栏）/ 实色 surface（画布底部工具栏），默认浮层 */
  variant?: ButtonGroupVariant;
  /** 条的高度：32 / 44 / 56，默认 32。32 是盖在媒体上的按钮条；44 是节点工具栏（内边距 6、圆角 12、间距 8）；56 是画布底部工具栏（内边距 12 / 16、圆角 `--border-radius-round`、间距 16）。里面的按钮默认尺寸跟着变，竖向 Divider 的高度也跟着变（16 / 20 / 20） */
  size?: ButtonGroupSize;
  /** 方向：横排（默认）/ 竖排。竖排给画布左侧工具栏（44，11-23 从底部挪到左边）：里面按钮默认 36，内边距 4、间距 4，按钮从上往下排，宽高互换 */
  orientation?: 'horizontal' | 'vertical';
  /** 读屏用，说明这一排是什么，比如「节点操作」 */
  'aria-label'?: string;
  /** 里面放 IconButton、Button，默认就是 IconButton 28 · 无底、Button 28 · 无底，不用自己写尺寸和类型。不同类的按钮之间放竖向的 `Divider` */
  children?: ReactNode;
}

/**
 * 按钮条：一排按钮合成一条。默认高 32，盖在图片、视频上：on-media 底、不加描边，圆角 8，四周 2，按钮间距 4；
 * 节点工具栏用 `variant="glass" size={44}`；画布左侧工具栏是实色竖排，用 `variant="surface" size={44} orientation="vertical"`。
 * Figma「按钮」页 ButtonGroup
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { variant = 'on-media', size = 32, orientation = 'horizontal', className, children, ...rest },
  ref,
) {
  return (
    <ButtonGroupContext.Provider value={orientation === 'vertical' && size === 44 ? VERTICAL_44 : GROUP_DEFAULTS[size]}>
      <div
        ref={ref}
        role="group"
        aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
        className={cx('kv-button-group', variant !== 'on-media' && `kv-button-group--${variant}`, size !== 32 && `kv-button-group--${size}`, orientation === 'vertical' && 'kv-button-group--vertical', className)}
        {...rest}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
});
ButtonGroup.displayName = 'ButtonGroup';
