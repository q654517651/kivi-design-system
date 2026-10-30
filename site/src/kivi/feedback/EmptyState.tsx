import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils';
import './feedback.css';

export type EmptyStateScene = 'empty' | 'favorite' | 'offline' | 'failed';
export type EmptyStateSize = 'lg' | 'sm';

/**
 * 4 个场景各一张 IP 图（从 Figma 反馈页导出，320×320）：暂无内容 / 暂无收藏 / 无网络 / 生成失败。
 * 路径是文档网站里的；项目里把图放到自己的静态目录，改这里的路径，或者给 EmptyState 传 image。
 */
export const EMPTY_STATE_IMAGES: Record<EmptyStateScene, string> = {
  empty: './empty-state/empty.png',
  favorite: './empty-state/no-favorites.png',
  offline: './empty-state/offline.png',
  failed: './empty-state/failed.png',
};

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 场景：暂无内容 / 暂无收藏 / 无网络 / 生成失败，决定用哪张 IP 图，默认暂无内容。样式一样 */
  scene?: EmptyStateScene;
  /** 尺寸：大（页面、大面板，插图 160）/ 小（下拉、侧栏，插图 96），默认大 */
  size?: EmptyStateSize;
  /** 标题：一句话说清楚现在是什么情况 */
  title: ReactNode;
  /** 说明：写清楚下一步做什么。下拉里不要说明 */
  description?: ReactNode;
  /** 引导操作：放一个中号次要 Button，离文字 24 */
  action?: ReactNode;
  /** 换一张插图的地址（比如项目里图放在别处）；不传就按 scene 用 EMPTY_STATE_IMAGES */
  image?: string;
}

const has = (node: ReactNode) => node !== undefined && node !== null && node !== false && node !== '';

/** 页面、面板、下拉里没有东西可看时，用 IP 插图告诉用户为什么是空的、下一步做什么。Figma「反馈」页 EmptyState */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { scene = 'empty', size = 'lg', title, description, action, image, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-empty-state', `kv-empty-state--${size}`, className)} {...rest}>
      <div className="kv-empty-state__illustration">
        <img className="kv-empty-state__ip" src={image ?? EMPTY_STATE_IMAGES[scene]} alt="" />
      </div>
      <div className="kv-empty-state__text">
        <div className="kv-empty-state__title">{title}</div>
        {has(description) && <div className="kv-empty-state__desc">{description}</div>}
      </div>
      {has(action) && <div className="kv-empty-state__action">{action}</div>}
    </div>
  );
});
EmptyState.displayName = 'EmptyState';
