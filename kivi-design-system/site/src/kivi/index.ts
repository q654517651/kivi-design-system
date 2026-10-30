/*
  KIVI 组件库入口。引一次就带上变量和基础样式，组件自己带各自的 CSS。
  每个 Figma 页一个文件夹：组件 .tsx + 这一页的 .css + index.ts。
*/
import './tokens.css';
import './base.css';

export * from './icons';
export * from './Icon';
export * from './utils';

// 基础
export * from './placeholder-image';

// 通用组件
export * from './button';
export * from './menus-tooltip';
export * from './selection';
export * from './inputs';
export * from './dialog';
export * from './feedback';
export * from './tabs-tags-avatar';
export * from './video-player';

// 业务组件
export * from './generating';
export * from './canvas';
export * from './agent';
export * from './main-site';
export * from './prompt-box';
