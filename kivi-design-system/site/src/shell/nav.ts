import type { ComponentType } from 'react';
import {
  AppWindow,
  ArrowRightLeft,
  Bell,
  Bot,
  BookOpen,
  BoxSelect,
  CalendarDays,
  Braces,
  Compass,
  FolderOpen,
  Globe,
  House,
  Image,
  LayoutTemplate,
  ListChecks,
  MessageSquareText,
  MousePointerClick,
  PanelLeft,
  Palette,
  Paperclip,
  ScrollText,
  TextQuote,
  Shapes,
  Sparkles,
  SquareCheck,
  SquareMenu,
  Tags,
  TextCursorInput,
  Upload,
  WandSparkles,
  Workflow,
  Wrench,
  SquarePlay,
  type LucideIcon,
  LayoutPanelTop,
  Ruler,
} from 'lucide-react';

// 左侧目录，和 Figma 的页一一对应（页面模板放最上面，和 Figma 一样）。没有 load 的是还没迁过来的页。
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
    group: '页面模板',
    items: [
      { id: 'tpl-main-site', icon: LayoutTemplate, title: '主站', path: '/templates/main-site', load: () => import('../docs/templates/main-site.mdx') },
      { id: 'tpl-canvas', icon: Workflow, title: '画布', path: '/templates/canvas', load: () => import('../docs/templates/canvas.mdx') },
      { id: 'tpl-canvas-tools', icon: Wrench, title: '画布工具', path: '/templates/canvas-tools', load: () => import('../docs/templates/canvas-tools.mdx') },
      { id: 'tpl-skills', icon: Sparkles, title: '技能面板', path: '/templates/skills', load: () => import('../docs/templates/skills.mdx') },
      { id: 'tpl-assets', icon: FolderOpen, title: '资产管理', path: '/templates/assets', load: () => import('../docs/templates/assets.mdx') },
    ],
  },
  {
    group: '开始',
    items: [
      { id: 'home', icon: House, title: '总览', path: '/', load: () => import('../docs/index.mdx') },
      { id: 'intro', icon: BookOpen, title: '说明', path: '/intro', load: () => import('../docs/intro.mdx') },
      { id: 'legacy-names', icon: ArrowRightLeft, title: '旧名对照', path: '/legacy-names', load: () => import('../docs/legacy-names.mdx') },
      { id: 'component-api', icon: Braces, title: '组件写法', path: '/component-api', load: () => import('../docs/component-api.mdx') },
    ],
  },
  {
    group: '基础',
    items: [
      { id: 'guidelines', icon: Compass, title: '设计指南', path: '/foundations/guidelines', load: () => import('../docs/foundations/guidelines.mdx') },
      { id: 'rules', icon: Ruler, title: '设计规则', path: '/foundations/rules', load: () => import('../docs/foundations/rules.mdx') },
      { id: 'tokens', icon: Palette, title: '变量', path: '/foundations/tokens', load: () => import('../docs/foundations/tokens.mdx') },
      { id: 'motion', icon: Sparkles, title: '动效', path: '/foundations/motion', load: () => import('../docs/foundations/motion.mdx') },
      { id: 'icons', icon: Shapes, title: '图标', path: '/foundations/icons', load: () => import('../docs/foundations/icons.mdx') },
      { id: 'placeholder-images', icon: Image, title: '占位图', path: '/foundations/placeholder-images', load: () => import('../docs/foundations/placeholder-images.mdx') },
    ],
  },
  {
    group: '操作',
    items: [
      { id: 'button', icon: MousePointerClick, title: '按钮', path: '/components/button', load: () => import('../docs/components/button.mdx') },
    ],
  },
  {
    group: '导航',
    items: [
      { id: 'menu', icon: SquareMenu, title: '菜单', path: '/components/menu', load: () => import('../docs/components/menu.mdx') },
      { id: 'navigation', icon: PanelLeft, title: '导航', path: '/components/navigation', load: () => import('../docs/components/navigation.mdx') },
    ],
  },
  {
    group: '录入',
    items: [
      { id: 'inputs', icon: TextCursorInput, title: '输入框', path: '/components/inputs', load: () => import('../docs/components/inputs.mdx') },
      { id: 'selection', icon: SquareCheck, title: '选择', path: '/components/selection', load: () => import('../docs/components/selection.mdx') },
      { id: 'date', icon: CalendarDays, title: '日期', path: '/components/date', load: () => import('../docs/components/date.mdx') },
      { id: 'upload', icon: Upload, title: '上传', path: '/components/upload', load: () => import('../docs/components/upload.mdx') },
    ],
  },
  {
    group: '展示',
    items: [
      { id: 'tags-avatar', icon: Tags, title: '标签和头像', path: '/components/tags-avatar', load: () => import('../docs/components/tags-avatar.mdx') },
      { id: 'media', icon: SquarePlay, title: '图片和视频', path: '/components/media', load: () => import('../docs/components/media.mdx') },
      { id: 'prose', icon: TextQuote, title: '正文排版', path: '/components/prose', load: () => import('../docs/components/prose.mdx') },
      { id: 'scroll-area', icon: ScrollText, title: '滚动条', path: '/components/scroll-area', load: () => import('../docs/components/scroll-area.mdx') },
      { id: 'layout', icon: LayoutPanelTop, title: '布局', path: '/components/layout', load: () => import('../docs/components/layout.mdx') },
    ],
  },
  {
    group: '浮层',
    items: [
      { id: 'tooltip', icon: MessageSquareText, title: '提示', path: '/components/tooltip', load: () => import('../docs/components/tooltip.mdx') },
      { id: 'dialog', icon: AppWindow, title: '弹窗', path: '/components/dialog', load: () => import('../docs/components/dialog.mdx') },
    ],
  },
  {
    group: '反馈',
    items: [
      { id: 'feedback', icon: Bell, title: '反馈', path: '/components/feedback', load: () => import('../docs/components/feedback.mdx') },
    ],
  },
  {
    group: '业务组件',
    items: [
      { id: 'generation', icon: WandSparkles, title: '生成', path: '/business/generation', load: () => import('../docs/business/generation.mdx') },
      { id: 'reference', icon: Paperclip, title: '参考和引用', path: '/business/reference', load: () => import('../docs/business/reference.mdx') },
      { id: 'canvas', icon: Workflow, title: '画布', path: '/business/canvas', load: () => import('../docs/business/canvas.mdx') },
      { id: 'annotation', icon: BoxSelect, title: '标注', path: '/business/annotation', load: () => import('../docs/business/annotation.mdx') },
      { id: 'agent', icon: Bot, title: 'Agent 对话', path: '/business/agent', load: () => import('../docs/business/agent.mdx') },
      { id: 'agent-process', icon: ListChecks, title: 'Agent 过程', path: '/business/agent-process', load: () => import('../docs/business/agent-process.mdx') },
      { id: 'main-site', icon: Globe, title: '主站', path: '/business/main-site', load: () => import('../docs/business/main-site.mdx') },
      { id: 'asset', icon: FolderOpen, title: '资产', path: '/business/asset', load: () => import('../docs/business/asset.mdx') },
    ],
  },
];

export const PAGES = NAV.flatMap((g) => g.items).filter(
  (i): i is NavItem & { path: string; load: Loader } => Boolean(i.path && i.load),
);
