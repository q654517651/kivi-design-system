import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from '../button';
import { Icon } from '../Icon';
import { cx } from '../utils';
import { useControllable } from '../hooks';
import './menus-tooltip.css';

export interface SidebarLabelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 分组名，比如「对话」「画布」 */
  children?: ReactNode;
  /** 展开（受控）。展开时箭头朝下，收起时朝右；下面的列表由使用方跟着收起 */
  expanded?: boolean;
  /** 默认是否展开（非受控），默认展开 */
  defaultExpanded?: boolean;
  /** 点标题展开或收起 */
  onExpandedChange?: (expanded: boolean) => void;
  /** 右边的新建按钮：IconButton 28 轻，NewChat 图标，默认显示 */
  showNew?: boolean;
  /** 新建按钮的说明，读屏用，默认「新建」 */
  newLabel?: string;
  /** 点新建 */
  onNew?: () => void;
}

/** 侧栏的分组标题。点标题展开或收起这一组，右边的按钮新建一个。Figma「菜单和提示」页 SidebarLabel */
export const SidebarLabel = forwardRef<HTMLDivElement, SidebarLabelProps>(function SidebarLabel(
  {
    children,
    expanded: expandedProp,
    defaultExpanded = true,
    onExpandedChange,
    showNew = true,
    newLabel = '新建',
    onNew,
    className,
    ...rest
  },
  ref,
) {
  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  return (
    <div ref={ref} className={cx('kv-sidebar-label', className)} {...rest}>
      <button type="button" className="kv-sidebar-label__title" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        <span>{children}</span>
        <Icon name={expanded ? 'DownArrowSmall' : 'RightArrowSmall'} />
      </button>
      {showNew && (
        <IconButton
          icon="NewChat"
          label={newLabel}
          size={28}
          variant="light"
          className="kv-sidebar-label__new"
          onClick={onNew}
        />
      )}
    </div>
  );
});
SidebarLabel.displayName = 'SidebarLabel';
