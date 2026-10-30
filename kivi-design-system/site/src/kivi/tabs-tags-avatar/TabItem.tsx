import { forwardRef, useRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import { composeHandlers, useMergedRef } from '../hooks';
import { useTabs, type TabLayout, type TabSize, type TabVariant } from './context';
import './tabs-tags-avatar.css';

export type { TabLayout, TabSize, TabVariant };

export interface TabItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  /** 这一项的值。放在 Tabs 里时用它判断选中，必填；单独摆放时不用 */
  value?: string;
  /** 样式：选项卡切换下面整块内容 / 分段在底槽里选一个参数值，默认选项卡。放在 Tabs 里时跟着 Tabs */
  variant?: TabVariant;
  /** 布局：横排 / 竖排，默认横排。竖排只有分段、中号用；竖排自带图标，必须传 icon */
  layout?: TabLayout;
  /** 尺寸：中 32 / 大 36，默认中。竖排不分尺寸（56 × 56） */
  size?: TabSize;
  /** 左图标。只有选项卡横排有，分段横排没有；竖排的图标放在文字上面 */
  icon?: IconName;
  /** 选中。放在 Tabs 里时由 Tabs 管，不用传；单独摆放（比如文档里的状态矩阵）才传 */
  selected?: boolean;
}

/** 一个选项。「样式」切换选项卡和分段两种用法。Figma「选项卡、标签和头像」页 TabItem */
export const TabItem = forwardRef<HTMLButtonElement, TabItemProps>(function TabItem(
  { value, variant, layout, size, icon, selected, type = 'button', className, children, onClick, ...rest },
  ref,
) {
  const tabs = useTabs();
  const ownRef = useRef<HTMLButtonElement>(null);
  const mergedRef = useMergedRef(ownRef, ref);
  const v = variant ?? tabs?.variant ?? 'tab';
  const l = layout ?? tabs?.layout ?? 'horizontal';
  const s = size ?? tabs?.size ?? 'md';
  const on = selected ?? (tabs ? value !== undefined && tabs.value === value : false);
  const segment = v === 'segment';

  return (
    <button
      ref={mergedRef}
      type={type}
      className={cx(
        'kv-tab-item',
        `kv-tab-item--${v}`,
        l === 'vertical' ? 'kv-tab-item--vertical' : `kv-tab-item--${s}`,
        className,
      )}
      role={segment ? 'radio' : 'tab'}
      {...(segment ? { 'aria-checked': on } : { 'aria-selected': on })}
      tabIndex={tabs ? (on || tabs.entry === ownRef.current ? 0 : -1) : undefined}
      onClick={composeHandlers(onClick, () => {
        if (tabs && value !== undefined) tabs.select(value);
      })}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
});
TabItem.displayName = 'TabItem';
