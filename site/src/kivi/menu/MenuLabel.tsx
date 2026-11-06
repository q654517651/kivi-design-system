import { cloneElement, forwardRef, isValidElement, useId, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { Collapse } from '../collapse';
import { Icon } from '../Icon';
import { cx } from '../utils';
import { useControllable, useJustExpanded } from '../hooks';
import './menu.css';

export interface MenuLabelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 分组标题，不能点（写了 collapsible 才能点，用来展开收起） */
  children?: ReactNode;
  /** 能展开收起：标题变成按钮，右边带箭头（展开朝下，收起朝右），箭头悬停这一行才出现。下面的条目写进 `items`，由它跟着展开收起 */
  collapsible?: boolean;
  /** 展开（受控），写了 collapsible 才有。默认展开 */
  expanded?: boolean;
  /** 默认是否展开（非受控） */
  defaultExpanded?: boolean;
  /** 点标题展开或收起 */
  onExpandedChange?: (expanded: boolean) => void;
  /** 跟着标题展开收起的条目，一般是一组 MenuItem。写了就用 Collapse（高度从 0 推到内容高 + 淡入，300ms ease-in-out）把它们和标题包成一组；不写，条目自己写在 Menu 里，由使用方跟着显示或隐藏 */
  items?: ReactNode;
  /** 右边的按钮，比如新建（侧栏 plain 里悬停这一行才出现，弹出的菜单里一直显示）：传一个 IconButton 28 轻（`<IconButton icon="NewChat" label="新建对话" size={28} variant="light" />`），出现 150ms ease-out、消失 100ms ease-in。收起时一直显示 */
  action?: ReactElement;
  /** 收起：侧栏收成图标栏时用。标题、箭头淡出，只留 action（图标栏里宽 36，按钮居中），悬停在右边出 Tooltip 写 action 的 label */
  collapsed?: boolean;
}

/**
 * 菜单里的分组标题，给下面几项起个名字。侧栏里点标题展开收起这一组（collapsible + items），右边悬停出新建按钮（action）。
 * Figma「菜单」页 MenuLabel
 */
export const MenuLabel = forwardRef<HTMLDivElement, MenuLabelProps>(function MenuLabel(
  {
    children,
    collapsible,
    expanded: expandedProp,
    defaultExpanded = true,
    onExpandedChange,
    items,
    action,
    collapsed,
    className,
    ...rest
  },
  ref,
) {
  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const bodyId = useId();
  const grouped = items !== undefined;
  // 侧栏刚展开那 300ms 新建按钮先藏着，不跟着右边滑
  const justExpanded = useJustExpanded(collapsed);

  // 收起后只剩 action；action 的 label 就是提示文字
  const actionLabel = isValidElement(action) ? (action.props as { label?: string }).label : undefined;
  // action 一般是 IconButton，自带提示：收起时出在右边，展开时在下方
  const actionNode = action && (
    <span className="kv-menu-label__action">
      {actionLabel && isValidElement(action) ? cloneElement(action as ReactElement<{ tooltip?: unknown }>, { tooltip: { placement: collapsed ? 'right' : 'bottom' } }) : action}
    </span>
  );

  const label = (
    <div
      ref={ref}
      className={cx('kv-menu-label', className)}
      data-collapsible={collapsible ? '' : undefined}
      data-collapsed={collapsed ? '' : undefined}
      data-expanding={justExpanded ? '' : undefined}
      {...rest}
    >
      {collapsible ? (
        <button
          type="button"
          className="kv-menu-label__title"
          aria-expanded={expanded}
          aria-controls={grouped ? bodyId : undefined}
          tabIndex={collapsed ? -1 : undefined}
          onClick={() => setExpanded(!expanded)}
        >
          <span>{children}</span>
          <Icon name={expanded ? 'DownArrowSmall' : 'RightArrowSmall'} />
        </button>
      ) : (
        children
      )}
      {actionNode}
    </div>
  );

  if (!grouped) return label;
  // 标题和条目包成一组：组里的间距和 Menu 一样。条目放在 Collapse 里，300ms ease-in-out
  return (
    <div className="kv-menu__group">
      {label}
      {collapsible ? (
        <Collapse id={bodyId} expanded={expanded} distance={200}>
          <div className="kv-menu__group-items">{items}</div>
        </Collapse>
      ) : (
        <div className="kv-menu__group-items">{items}</div>
      )}
    </div>
  );
});
MenuLabel.displayName = 'MenuLabel';
