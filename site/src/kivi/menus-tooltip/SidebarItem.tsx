import { forwardRef, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { IconButton } from '../button';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { AssetThumb } from '../tabs-tags-avatar';
import { cx } from '../utils';
import { composeHandlers } from '../hooks';
import { Dropdown } from './Dropdown';
import './menus-tooltip.css';

export type SidebarItemVariant = 'nav' | 'list';

export interface SidebarItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 文字 */
  children?: ReactNode;
  /** 类型：导航（新建、探索这类固定入口）/ 列表（对话、画布的历史记录），默认导航 */
  variant?: SidebarItemVariant;
  /** 导航的左图标：20 */
  icon?: IconName;
  /** 列表左边的缩略图类型：图片（有封面）/ 图标（没封面），默认图标。不要直接放裸图标 */
  thumb?: 'image' | 'icon';
  /** 缩略图的图片地址，thumb="image" 时用 */
  thumbSrc?: string;
  /** 缩略图的图标，thumb="icon" 时用，默认 Message；对话用 Message，画布用 Canvas */
  thumbIcon?: IconName;
  /** 选中：当前打开的那一项，同一时间只有一项 */
  selected?: boolean;
  /** 右边的「更多」：IconButton 28 轻，悬停和选中时才显示 */
  more?: boolean;
  /** 「更多」的说明，读屏用，默认「更多」 */
  moreLabel?: string;
  /** 点「更多」 */
  onMoreClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** 点「更多」弹出的菜单，一般是一个 Menu。写了就由 Dropdown 管开关，不用再写 onMoreClick */
  moreMenu?: ReactNode;
}

/** 主站侧栏的一项。整条侧栏是模板，在「模板 · 主站」页。Figma「菜单和提示」页 SidebarItem */
export const SidebarItem = forwardRef<HTMLDivElement, SidebarItemProps>(function SidebarItem(
  {
    children,
    variant = 'nav',
    icon,
    thumb = 'icon',
    thumbSrc,
    thumbIcon = 'Message',
    selected,
    more,
    moreLabel = '更多',
    onMoreClick,
    moreMenu,
    className,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const list = variant === 'list';

  // 外层是 div，不是按钮：里面还要放「更多」按钮。键盘上补上回车、空格
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  return (
    <div
      ref={ref}
      className={cx('kv-sidebar-item', `kv-sidebar-item--${variant}`, className)}
      tabIndex={0}
      aria-current={selected ? 'page' : undefined}
      onKeyDown={composeHandlers(onKeyDown, keys)}
      {...rest}
    >
      {!list && icon && <Icon name={icon} />}
      {list &&
        (thumb === 'image' ? (
          <AssetThumb size={24} type="image" src={thumbSrc} />
        ) : (
          <AssetThumb size={24} type="icon" icon={thumbIcon} />
        ))}
      <span>{children}</span>
      {more &&
        (moreMenu ? (
          <Dropdown
            className="kv-sidebar-item__more"
            trigger={<IconButton icon="More" label={moreLabel} size={28} variant="light" />}
            onClick={(e) => e.stopPropagation()}
          >
            {moreMenu}
          </Dropdown>
        ) : (
          <IconButton
            icon="More"
            label={moreLabel}
            size={28}
            variant="light"
            className="kv-sidebar-item__more"
            onClick={(e) => {
              e.stopPropagation();
              onMoreClick?.(e);
            }}
          />
        ))}
    </div>
  );
});
SidebarItem.displayName = 'SidebarItem';
