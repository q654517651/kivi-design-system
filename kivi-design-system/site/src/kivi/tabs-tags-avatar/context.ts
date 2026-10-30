import { createContext, useContext } from 'react';

export type TabVariant = 'tab' | 'segment';
export type TabLayout = 'horizontal' | 'vertical';
export type TabSize = 'md' | 'lg';

export interface TabsContextValue {
  variant: TabVariant;
  layout: TabLayout;
  size: TabSize;
  value: string | undefined;
  select: (value: string) => void;
  /** 没有可用的选中项时，Tab 能进的那一项（第一个可用项） */
  entry: HTMLElement | null;
}

/** Tabs 把样式、选中值传给里面的 TabItem */
export const TabsContext = createContext<TabsContextValue | null>(null);
export const useTabs = () => useContext(TabsContext);
