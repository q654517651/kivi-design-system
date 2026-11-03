import { forwardRef, useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { IconButton } from '../button';
import { Icon } from '../Icon';
import { Input } from '../inputs/Input';
import type { IconName } from '../icons';
import { AssetThumb } from '../tabs-tags-avatar';
import { cx } from '../utils';
import { composeHandlers, useControllable } from '../hooks';
import { Dropdown } from './Dropdown';
import { Tooltip } from './Tooltip';
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
  /** 收起：侧栏收成图标栏时用。只留图标 / 缩略图，文字淡出，悬停在右边出 Tooltip 写文字；「更多」不显示。宽度跟着侧栏，图标栏里是 36 */
  collapsed?: boolean;
  /** 右边的「更多」：IconButton 28 轻，悬停和选中时才显示 */
  more?: boolean;
  /** 「更多」的说明，读屏用，默认「更多」 */
  moreLabel?: string;
  /** 点「更多」 */
  onMoreClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** 点「更多」弹出的菜单，一般是一个 Menu。写了就由 Dropdown 管开关，不用再写 onMoreClick */
  moreMenu?: ReactNode;
  /** 重命名中（受控）：文字换成输入框（Input，右边「字数/上限」），自动聚焦、全选；「更多」不显示。照线上：回车提交，点外面取消，Esc 也取消 */
  editing?: boolean;
  /** 默认是否在重命名（非受控） */
  defaultEditing?: boolean;
  /** 进入、退出重命名 */
  onEditingChange?: (editing: boolean) => void;
  /** 回车提交的新名字，已去掉首尾空格；空的不提交，留在输入框里 */
  onRename?: (name: string) => void;
  /** 名字最多几个字，默认 20（照线上），超了打不进去 */
  maxNameLength?: number;
}

/** 重命名的输入框：挂上就聚焦、全选。放在 effect 里聚焦，菜单关掉还焦点给「更多」之后才轮到它 */
function RenameField({
  initial,
  max,
  onSubmit,
  onCancel,
}: {
  initial: string;
  max: number;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial.slice(0, max));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <Input
      ref={ref}
      className="kv-sidebar-item__input"
      aria-label="重命名"
      value={value}
      maxLength={max}
      counter={`${value.length}/${max}`}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={onCancel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
          e.preventDefault();
          const name = value.trim();
          if (name) onSubmit(name);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
    />
  );
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
    collapsed,
    more,
    moreLabel = '更多',
    onMoreClick,
    moreMenu,
    editing: editingProp,
    defaultEditing = false,
    onEditingChange,
    onRename,
    maxNameLength = 20,
    className,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const list = variant === 'list';
  const [editing, setEditing] = useControllable(editingProp, defaultEditing, onEditingChange);

  // 外层是 div，不是按钮：里面还要放「更多」按钮。键盘上补上回车、空格
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  // 一直包着 Tooltip，展开时禁用：收起、展开时结构不变，不重新挂载
  return (
    <Tooltip content={children} placement="right" disabled={!collapsed} className="kv-sidebar-item__tip">
      <div
        ref={ref}
        className={cx('kv-sidebar-item', `kv-sidebar-item--${variant}`, className)}
        tabIndex={0}
        aria-current={selected ? 'page' : undefined}
        data-collapsed={collapsed ? '' : undefined}
        data-editing={editing ? '' : undefined}
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
        {editing ? (
          <RenameField
            initial={typeof children === 'string' ? children : ''}
            max={maxNameLength}
            onSubmit={(name) => {
              onRename?.(name);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <span>{children}</span>
        )}
        {more &&
          !editing &&
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
    </Tooltip>
  );
});
SidebarItem.displayName = 'SidebarItem';
