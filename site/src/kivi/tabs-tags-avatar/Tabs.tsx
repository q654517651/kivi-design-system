import { forwardRef, useLayoutEffect, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { cx } from '../utils';
import { TabsContext, type TabLayout, type TabSize, type TabVariant } from './context';
import { composeHandlers, useControllable, useMergedRef } from '../hooks';
import './tabs-tags-avatar.css';

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** 样式：选项卡 / 分段，默认选项卡。里面的 TabItem 都跟着它 */
  variant?: TabVariant;
  /** 布局：横排 / 竖排，默认横排 */
  layout?: TabLayout;
  /** 尺寸：中 / 大，默认中 */
  size?: TabSize;
  /** 选中的值（受控） */
  value?: string;
  /** 默认选中的值（非受控）。没有选中项、或选中的那项禁用了 / 不在了，第一个可用项能 Tab 进来 */
  defaultValue?: string;
  /** 选中变化 */
  onChange?: (value: string) => void;
}

const ITEMS = '[role="tab"]:not(:disabled), [role="radio"]:not(:disabled)';
const isOn = (el: HTMLElement) => el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-checked') === 'true';

/**
 * 一组选项：同一时间只有一个选中，方向键移动选中（横排左右、竖排上下，Home / End 到头尾，跳过禁用项）。
 * 选项卡是 tablist，分段是 radiogroup，分段带底槽。Figma「模板 · 通用」页的「选项卡组」「分段选择」。
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    variant = 'tab',
    layout = 'horizontal',
    size = 'md',
    value,
    defaultValue,
    onChange,
    className,
    children,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(rootRef, ref);
  // 没有可用的选中项时，第一个可用项当 Tab 的入口（roving tabindex 总得有一项能进）
  const [entry, setEntry] = useState<HTMLElement | null>(null);
  const [current, select] = useControllable<string | undefined>(value, defaultValue, onChange as (v: string | undefined) => void);
  const ctx = useMemo(
    () => ({ variant, layout, size, value: current, select: select as (v: string) => void, entry }),
    [variant, layout, size, current, select, entry],
  );

  // 每次渲染后看一眼：可用项里没有选中的，入口就是第一个可用项
  useLayoutEffect(() => {
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(ITEMS) ?? []);
    const next = items.length && !items.some(isOn) ? items[0] : null;
    setEntry((prev) => (prev === next ? prev : next));
  });

  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(ITEMS));
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    let next = -1;
    const [prevKey, nextKey] = layout === 'vertical' ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
    if (e.key === nextKey) next = (i + 1) % items.length;
    else if (e.key === prevKey) next = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    items[next].focus();
    items[next].click();
  };

  return (
    <TabsContext.Provider value={ctx}>
      <div
        ref={mergedRef}
        className={cx('kv-tab-group', variant === 'segment' && 'kv-tab-group--segment', className)}
        role={variant === 'segment' ? 'radiogroup' : 'tablist'}
        aria-orientation={layout}
        onKeyDown={composeHandlers(onKeyDown, keys)}
        {...rest}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});
Tabs.displayName = 'Tabs';
