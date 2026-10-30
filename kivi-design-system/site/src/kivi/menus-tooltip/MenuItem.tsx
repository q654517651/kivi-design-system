import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import './menus-tooltip.css';

export type MenuItemVariant = 'default' | 'danger';

export interface MenuItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 文字 */
  children?: ReactNode;
  /** 类型：普通 / 危险，默认普通。危险只有默认、悬停、禁用，没有选中；放在菜单最后，用 MenuDivider 和上面隔开 */
  variant?: MenuItemVariant;
  /** 左图标：16。和 thumb 二选一 */
  icon?: IconName;
  /** 缩略图：放一个 AssetThumb 24，比如 `<AssetThumb size={24} src="…" />`，可以是图片或音频。和 icon 二选一 */
  thumb?: ReactNode;
  /** 快捷键文字，比如 ⌘C。和 submenu、checked 三选一 */
  shortcut?: string;
  /** 子菜单箭头：点了会再弹一个菜单的项。和 shortcut、checked 三选一 */
  submenu?: boolean;
  /** 选中：白 8% 底，不打勾，给单选菜单标当前项（比例、数量）。写了就是 role="option"，外层 Menu 要用 role="listbox"；非当前项传 false */
  selected?: boolean;
  /** 勾选：在右边打勾，给需要打勾的单选 / 多选菜单。写了就是 role="menuitemradio"，非当前项传 false。和 shortcut、submenu 三选一 */
  checked?: boolean;
}

/** 菜单里的一条，可以点，点了执行一个操作或选定一个值。Figma「菜单和提示」页 MenuItem */
export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(function MenuItem(
  {
    children,
    variant = 'default',
    icon,
    thumb,
    shortcut,
    submenu,
    selected,
    checked,
    type = 'button',
    role,
    className,
    ...rest
  },
  ref,
) {
  const r = role ?? (checked !== undefined ? 'menuitemradio' : selected !== undefined ? 'option' : 'menuitem');
  return (
    <button
      ref={ref}
      type={type}
      role={r}
      className={cx('kv-menu-item', variant === 'danger' && 'kv-menu-item--danger', className)}
      aria-selected={selected}
      aria-checked={checked}
      aria-haspopup={submenu ? 'menu' : undefined}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {thumb}
      <span>{children}</span>
      {shortcut && <span className="kv-menu-item__shortcut">{shortcut}</span>}
      {submenu && <Icon name="RightArrowSmall" className="kv-menu-item__arrow" />}
      {checked && <Icon name="CheckSmall" className="kv-menu-item__check" />}
    </button>
  );
});
MenuItem.displayName = 'MenuItem';
