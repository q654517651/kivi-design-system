import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from '../button';
import { Divider } from '../divider';
import { Dropdown, Menu, MenuItem } from '../menu';
import { cx } from '../utils';
import { CoverGrid } from './CoverGrid';
import './asset.css';

/** 修改时间的说法，照线上：不到 1 分钟「刚刚修改」，不到 1 小时「n分钟前修改」，不到 1 天「n小时前修改」，再早「2026年11月4日修改」 */
export function formatUpdatedAt(time: Date | number, now: Date | number = Date.now()): string {
  const t = typeof time === 'number' ? time : time.getTime();
  const diff = (typeof now === 'number' ? now : now.getTime()) - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚修改';
  if (min < 60) return `${min}分钟前修改`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}小时前修改`;
  const d = new Date(t);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日修改`;
}

export interface ProjectCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** 画布名，最多 20 字，一行省略 */
  name: string;
  /** 封面：画布里的几张图，最多用 4 张（CoverGrid）。没有就是空底 */
  covers?: string[];
  /** 最后修改时间，自动写成「n分钟前修改」这种（formatUpdatedAt）。要自己写字就用 meta */
  updatedAt?: Date | number;
  /** 名字下面那行字，传了就不用 updatedAt 算 */
  meta?: ReactNode;
  /** 点卡片：打开画布（线上是新标签页） */
  onOpen?: () => void;
  /** 菜单「分享」：复制分享链接 */
  onShare?: () => void;
  /** 菜单「重命名」 */
  onRename?: () => void;
  /** 菜单「删除」 */
  onDelete?: () => void;
}

/**
 * 画布项目卡：画布管理页的一格。圆角 12，上面封面（257:157），下面名字和修改时间。
 * 悬停卡片底色变亮、右下出「⋯」（IconButton 32 · 文字），菜单：分享、重命名、删除。照线上 ProjectCard
 */
export const ProjectCard = forwardRef<HTMLDivElement, ProjectCardProps>(function ProjectCard(
  { name, covers = [], updatedAt, meta, onOpen, onShare, onRename, onDelete, className, ...rest },
  ref,
) {
  const sub = meta ?? (updatedAt != null ? formatUpdatedAt(updatedAt) : undefined);
  return (
    <div ref={ref} className={cx('kv-project-card', className)} {...rest}>
      {/* 整张卡是一个按钮：点了打开画布。「⋯」盖在它上面 */}
      <button type="button" className="kv-project-card__open" aria-label={`打开画布 ${name}`} onClick={onOpen} />
      <CoverGrid className="kv-project-card__cover" images={covers} />
      <div className="kv-project-card__meta">
        <div className="kv-project-card__text">
          <span className="kv-project-card__name" title={name}>
            {name}
          </span>
          {sub != null && <span className="kv-project-card__time">{sub}</span>}
        </div>
        <Dropdown
          className="kv-project-card__more"
          placement="bottom-end"
          trigger={<IconButton icon="More" label="更多" variant="text" size={32} />}
        >
          <Menu>
            <MenuItem icon="Share" onClick={onShare}>
              分享
            </MenuItem>
            <MenuItem icon="Rename" onClick={onRename}>
              重命名
            </MenuItem>
            <Divider />
            <MenuItem variant="danger" icon="Delete" onClick={onDelete}>
              删除
            </MenuItem>
          </Menu>
        </Dropdown>
      </div>
    </div>
  );
});
ProjectCard.displayName = 'ProjectCard';
