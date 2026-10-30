import type { ComponentType } from 'react';
import {
  AppWindow,
  ArrowRightLeft,
  Bell,
  Bot,
  Braces,
  Globe,
  House,
  Image,
  MousePointerClick,
  Palette,
  Shapes,
  Sparkles,
  SquareCheck,
  SquareMenu,
  Tags,
  TextCursorInput,
  Workflow,
  SquarePlay,
  type LucideIcon,
} from 'lucide-react';

// 左侧目录，和 Figma 的页一一对应。没有 load 的是还没迁过来的页。
// 目录图标用 Lucide（网站外壳自己用，不属于组件库；组件库的图标还是 KIVI 自己的）

type Loader = () => Promise<{ default: ComponentType<Record<string, unknown>> }>;

export interface NavItem {
  id: string;
  title: string;
  icon: LucideIcon;
  path?: string;
  load?: Loader;
}

export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: '开始',
    items: [
      { id: 'home', icon: House, title: '总览', path: '/', load: () => import('../docs/index.mdx') },
      { id: 'legacy-names', icon: ArrowRightLeft, title: '旧名对照', path: '/legacy-names', load: () => import('../docs/legacy-names.mdx') },
      { id: 'component-api', icon: Braces, title: '组件写法', path: '/component-api', load: () => import('../docs/component-api.mdx') },
    ],
  },
  {
    group: '基础',
    items: [
      { id: 'tokens', icon: Palette, title: '变量', path: '/foundations/tokens', load: () => import('../docs/foundations/tokens.mdx') },
      { id: 'motion', icon: Sparkles, title: '动效', path: '/foundations/motion', load: () => import('../docs/foundations/motion.mdx') },
      { id: 'icons', icon: Shapes, title: '图标', path: '/foundations/icons', load: () => import('../docs/foundations/icons.mdx') },
      { id: 'placeholder-images', icon: Image, title: '占位图', path: '/foundations/placeholder-images', load: () => import('../docs/foundations/placeholder-images.mdx') },
    ],
  },
  {
    group: '通用组件',
    items: [
      { id: 'button', icon: MousePointerClick, title: '按钮', path: '/components/button', load: () => import('../docs/components/button.mdx') },
      { id: 'menus-tooltip', icon: SquareMenu, title: '菜单和提示', path: '/components/menus-tooltip', load: () => import('../docs/components/menus-tooltip.mdx') },
      { id: 'selection', icon: SquareCheck, title: '选择控件', path: '/components/selection', load: () => import('../docs/components/selection.mdx') },
      { id: 'inputs', icon: TextCursorInput, title: '输入控件', path: '/components/inputs', load: () => import('../docs/components/inputs.mdx') },
      { id: 'dialog', icon: AppWindow, title: '弹窗', path: '/components/dialog', load: () => import('../docs/components/dialog.mdx') },
      { id: 'feedback', icon: Bell, title: '反馈', path: '/components/feedback', load: () => import('../docs/components/feedback.mdx') },
      { id: 'tabs-tags-avatar', icon: Tags, title: '选项卡、标签和头像', path: '/components/tabs-tags-avatar', load: () => import('../docs/components/tabs-tags-avatar.mdx') },
      { id: 'video-player', icon: SquarePlay, title: '播放器', path: '/components/video-player', load: () => import('../docs/components/video-player.mdx') },
    ],
  },
  {
    group: '业务组件',
    items: [
      { id: 'canvas', icon: Workflow, title: '画布', path: '/business/canvas', load: () => import('../docs/business/canvas.mdx') },
      { id: 'agent', icon: Bot, title: 'Agent', path: '/business/agent', load: () => import('../docs/business/agent.mdx') },
      { id: 'main-site', icon: Globe, title: '主站', path: '/business/main-site', load: () => import('../docs/business/main-site.mdx') },
    ],
  },
];

export const PAGES = NAV.flatMap((g) => g.items).filter(
  (i): i is NavItem & { path: string; load: Loader } => Boolean(i.path && i.load),
);
