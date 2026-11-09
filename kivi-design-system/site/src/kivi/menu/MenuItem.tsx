import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { IconButton } from '../button';
import { Icon } from '../Icon';
import { Input } from '../inputs/Input';
import type { IconName } from '../icons';
import { Tooltip } from '../tooltip/Tooltip';
import { cx } from '../utils';
import { composeHandlers, useControllable, useJustExpanded } from '../hooks';
import { useMenuContext } from './context';
import { Dropdown } from './Dropdown';
import './menu.css';

export type MenuItemVariant = 'default' | 'danger';

export interface MenuItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 文字 */
  children?: ReactNode;
  /** 说明：写了就是两行，第二行 12 号 secondary，一行省略。两行时左图标 20；选中（selected）不加底、在右边打勾，因为两行的行大，悬停和选中都是底色分不清（11-03 定） */
  description?: ReactNode;
  /** 类型：普通 / 危险，默认普通。危险只有默认、悬停、禁用，没有选中；放在菜单最后，用 Divider 和上面隔开 */
  variant?: MenuItemVariant;
  /** 左图标：16，两行时 20；平铺（侧栏）里 20。和 thumb 二选一 */
  icon?: IconName;
  /** 缩略图：放一个 AssetThumb 24，比如 `<AssetThumb size={24} src="…" />`，可以是图片、音频、图标（对话、画布的封面）。和 icon 二选一 */
  thumb?: ReactNode;
  /** 快捷键文字，比如 ⌘C。和 submenu、checked 三选一 */
  shortcut?: string;
  /** 子菜单箭头：点了会再弹一个菜单的项。和 shortcut、checked 三选一 */
  submenu?: boolean;
  /** 选中：白 10% 底，不打勾，给单选菜单标当前项（比例、数量）。写了就是 role="option"，外层 Menu 要用 role="listbox"；非当前项传 false。平铺（侧栏）里是当前打开的那一项，底白 10%（常驻底色），写 aria-current="page" */
  selected?: boolean;
  /** 勾选：在右边打勾，只给多选菜单（两行单选的打勾用 selected）。写了就是 role="menuitemcheckbox"，没勾的传 false。和 shortcut、submenu 三选一 */
  checked?: boolean;
  /** 收起：侧栏收成图标栏时用。只留图标 / 缩略图，文字淡出，悬停在右边出 Tooltip 写文字；「⋯」不显示。宽度跟着侧栏，图标栏里是 36。不带图标的条目（「更多」）收起时文字换成向下的箭头。不传就不包 Tooltip，要在收起、展开之间切换的写 true / false */
  collapsed?: boolean;
  /** 右边悬停和选中时才出现的「⋯」：写了就出一个 IconButton 28 轻，点开弹出这里的菜单（一般是一个 Menu，由 Dropdown 管开关）。写了之后外层改用 div（里面有按钮） */
  more?: ReactNode;
  /** 「⋯」的说明，读屏用，默认「更多」 */
  moreLabel?: string;
  /** 重命名中（受控）：文字换成输入框（Input，右边「字数/上限」），自动聚焦、全选；「⋯」不显示。照线上：回车提交，点外面取消，Esc 也取消。children 要是字符串 */
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

/** 重命名的输入框：挂上就聚焦、全选。放在 effect 里聚焦，菜单关掉还焦点给「⋯」之后才轮到它 */
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
      className="kv-menu-item__input"
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

/** 菜单里的一条，可以点，点了执行一个操作或选定一个值；放进平铺的 Menu（侧栏）里还能收起、重命名、出「⋯」。Figma「菜单」页 MenuItem */
export const MenuItem = forwardRef<HTMLElement, MenuItemProps>(function MenuItem(
  {
    children,
    description,
    variant = 'default',
    icon,
    thumb,
    shortcut,
    submenu,
    selected,
    checked,
    collapsed,
    more,
    moreLabel = '更多',
    editing: editingProp,
    defaultEditing = false,
    onEditingChange,
    onRename,
    maxNameLength = 20,
    type = 'button',
    role,
    disabled,
    className,
    onClick,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const { plain } = useMenuContext();
  const [editing, setEditing] = useControllable(editingProp, defaultEditing, onEditingChange);
  // 侧栏刚展开那 300ms「⋯」先藏着，不跟着右边滑
  const justExpanded = useJustExpanded(collapsed);
  const twoLine = description != null && description !== false;
  const lead = icon ? 'icon' : thumb ? 'thumb' : undefined;
  // 里面要放按钮（「⋯」、输入框）时外层不能是 button，改用 div，键盘上补回车、空格
  const row = more != null || editing;
  const Root = (row ? 'div' : 'button') as unknown as ComponentType<Record<string, unknown>>;
  const r = role ?? (plain ? undefined : checked !== undefined ? 'menuitemcheckbox' : selected !== undefined ? 'option' : 'menuitem');

  const keys = (e: KeyboardEvent<HTMLElement>) => {
    if (!row || e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.currentTarget.click();
    }
  };
  const click = (e: MouseEvent<HTMLElement>) => {
    if (row && disabled) {
      e.preventDefault();
      return;
    }
    (onClick as ((e: MouseEvent<HTMLElement>) => void) | undefined)?.(e);
  };

  const item = (
    <Root
      ref={ref}
      {...(row ? { tabIndex: disabled ? -1 : 0, 'aria-disabled': disabled || undefined } : { type, disabled })}
      role={r}
      className={cx('kv-menu-item', variant === 'danger' && 'kv-menu-item--danger', className)}
      aria-selected={plain ? undefined : selected}
      aria-current={plain && selected ? 'page' : undefined}
      aria-checked={checked}
      aria-haspopup={submenu ? 'menu' : undefined}
      data-two-line={twoLine ? '' : undefined}
      data-lead={lead}
      data-collapsed={collapsed ? '' : undefined}
      data-expanding={justExpanded ? '' : undefined}
      data-editing={editing ? '' : undefined}
      onClick={click}
      onKeyDown={composeHandlers(onKeyDown, keys)}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {thumb}
      {/* 「更多」（不带图标、缩略图）收起后文字换成一个向下的箭头（照即梦） */}
      {collapsed !== undefined && !lead && <Icon name="DownArrow" className="kv-menu-item__fold" />}
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
      ) : twoLine ? (
        <span className="kv-menu-item__text">
          <span className="kv-menu-item__label">{children}</span>
          <span className="kv-menu-item__description">{description}</span>
        </span>
      ) : (
        <span>{children}</span>
      )}
      {shortcut && <span className="kv-menu-item__shortcut">{shortcut}</span>}
      {submenu && <Icon name="RightArrowSmall" className="kv-menu-item__arrow" />}
      {(checked || (twoLine && selected)) && <Icon name="CheckSmall" className="kv-menu-item__check" />}
      {more != null && !editing && (
        <Dropdown
          className="kv-menu-item__more"
          trigger={<IconButton tooltip={false} icon="More" label={moreLabel} size={28} variant="light" disabled={disabled} />}
          onClick={(e) => e.stopPropagation()}
        >
          {more}
        </Dropdown>
      )}
    </Root>
  );

  // 传了 collapsed 就一直包着 Tooltip（展开时禁用）：收起、展开时结构不变，不重新挂载。「更多」收起后是箭头，也出 Tooltip
  if (collapsed === undefined) return item;
  return (
    <Tooltip content={children} placement="right" disabled={!collapsed} className="kv-menu-item__tip">
      {item}
    </Tooltip>
  );
});
MenuItem.displayName = 'MenuItem';
