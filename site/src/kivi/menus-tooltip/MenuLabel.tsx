import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './menus-tooltip.css';

export type MenuLabelProps = HTMLAttributes<HTMLDivElement>;

/** 菜单里的分组标题，给下面几项起个名字，不能点。Figma「菜单和提示」页 MenuLabel */
export const MenuLabel = forwardRef<HTMLDivElement, MenuLabelProps>(function MenuLabel({ className, ...rest }, ref) {
  return <div ref={ref} className={cx('kv-menu-label', className)} {...rest} />;
});
MenuLabel.displayName = 'MenuLabel';
