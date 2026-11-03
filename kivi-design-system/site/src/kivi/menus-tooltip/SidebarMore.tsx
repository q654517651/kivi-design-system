import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '../utils';
import './menus-tooltip.css';

export interface SidebarMoreProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 收起：侧栏收成图标栏时用。左边 6，图标栏里（宽 36）字正好居中 */
  collapsed?: boolean;
}

/** 侧栏一组列表底部的「更多」，点了看这一组剩下的。Figma「菜单和提示」页 SidebarMore */
export const SidebarMore = forwardRef<HTMLButtonElement, SidebarMoreProps>(function SidebarMore(
  { type = 'button', collapsed, className, children = '更多', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx('kv-sidebar-more', className)} data-collapsed={collapsed ? '' : undefined} {...rest}>
      {children}
    </button>
  );
});
SidebarMore.displayName = 'SidebarMore';
