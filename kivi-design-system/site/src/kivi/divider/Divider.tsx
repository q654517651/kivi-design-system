import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './divider.css';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 方向：横向 / 竖向，默认横向。横向宽度撑满、高 1；竖向宽 1，高度跟着所在的条走（按钮条里 16，节点工具栏里 20，不在条里 16） */
  orientation?: DividerOrientation;
}

/**
 * 分割线：1 宽的细线，颜色 `--color-border`。竖向用在按钮条、工具条里把不同类的按钮隔开，横向用在内容之间。
 * 竖向的高度不用属性设：所在的条在 CSS 里写 `--kv-divider-size`，没写就是 16。
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = 'horizontal', className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cx('kv-divider', `kv-divider--${orientation}`, className)}
      {...rest}
    />
  );
});
Divider.displayName = 'Divider';
