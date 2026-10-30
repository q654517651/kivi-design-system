import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '../utils';
import './menus-tooltip.css';

export type SidebarMoreProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** 侧栏一组列表底部的「更多」，点了看这一组剩下的。Figma「菜单和提示」页 SidebarMore */
export const SidebarMore = forwardRef<HTMLButtonElement, SidebarMoreProps>(function SidebarMore(
  { type = 'button', className, children = '更多', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx('kv-sidebar-more', className)} {...rest}>
      {children}
    </button>
  );
});
SidebarMore.displayName = 'SidebarMore';
