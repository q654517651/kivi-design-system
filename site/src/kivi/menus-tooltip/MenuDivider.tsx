import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './menus-tooltip.css';

export type MenuDividerProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/** 菜单里的分割线，把不同性质的几项隔开。没有属性。Figma「菜单和提示」页 MenuDivider */
export const MenuDivider = forwardRef<HTMLDivElement, MenuDividerProps>(function MenuDivider({ className, ...rest }, ref) {
  return <div ref={ref} className={cx('kv-menu-divider', className)} role="separator" {...rest} />;
});
MenuDivider.displayName = 'MenuDivider';
