import { createContext, useContext } from 'react';

/** 选项卡 / 分段 / 分段 · 品牌（分段的样子，选中那项白底 + 品牌绿和黄绿两团光、黑字；只给创作首页「生成 / 画布」这种页面级主切换，11-23 用户定） */
export type TabVariant = 'tab' | 'segment' | 'segment-brand';
export type TabLayout = 'horizontal' | 'vertical';
export type TabSize = 32 | 36;

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
