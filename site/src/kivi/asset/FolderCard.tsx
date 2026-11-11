import { forwardRef, type HTMLAttributes } from 'react';
import { IconButton } from '../button';
import { Divider } from '../divider';
import { Icon } from '../Icon';
import { Dropdown, Menu, MenuItem } from '../menu';
import { Tag } from '../tags-avatar';
import { cx } from '../utils';
import { CoverGrid } from './CoverGrid';
import './asset.css';

export interface FolderCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** 文件夹名，最多 20 字，一行省略 */
  name: string;
  /** 里面有几个素材，跟在名字后面「(12)」（照线上） */
  count?: number;
  /** 封面：里面最近的几张图，最多用 4 张（CoverGrid）。没有就是空文件夹：浅底 + 文件夹图标 */
  covers?: string[];
  /** 置顶：封面右上挂「置顶」标签，菜单里那一项变「取消置顶」 */
  pinned?: boolean;
  /** 点封面：进文件夹 */
  onOpen?: () => void;
  /** 菜单「重命名」 */
  onRename?: () => void;
  /** 菜单「置顶 / 取消置顶」，参数是点完以后置没置顶 */
  onPinnedChange?: (pinned: boolean) => void;
  /** 菜单「删除」 */
  onDelete?: () => void;
}

/**
 * 文件夹卡：资产页「我的素材」一排文件夹。和 ProjectCard 一个样子（11-11 用户定）：整张卡 16:9 都是封面，
 * 底部（渐进模糊 + 渐变）上压「名字 (数量)」，名字一行省略、数量不省略（照线上）。置顶的右上挂「置顶」标签。
 * 悬停封面放大一点、右下出「⋯」（IconButton 浮层无底 28），菜单：重命名、置顶、删除。照线上 FolderItem
 */
export const FolderCard = forwardRef<HTMLDivElement, FolderCardProps>(function FolderCard(
  { name, count, covers = [], pinned, onOpen, onRename, onPinnedChange, onDelete, className, ...rest },
  ref,
) {
  const empty = covers.length === 0;
  return (
    <div ref={ref} className={cx('kv-folder-card', className)} {...rest}>
      {/* 整张卡是一个按钮：点了进文件夹。「⋯」和标签盖在它上面 */}
      <button type="button" className="kv-folder-card__open" aria-label={`打开文件夹 ${name}`} onClick={onOpen} />
      <div className="kv-folder-card__cover" data-empty={empty ? '' : undefined}>
        {empty ? <Icon name="Folder" className="kv-folder-card__empty" /> : <CoverGrid images={covers} />}
      </div>
      {pinned && (
        <Tag variant="on-media" className="kv-folder-card__pin">
          置顶
        </Tag>
      )}
      <div className="kv-folder-card__meta">
        <div className="kv-folder-card__text">
          <span className="kv-folder-card__title" title={name}>
            <span className="kv-folder-card__name">{name}</span>
            {count != null && <span className="kv-folder-card__count">({count})</span>}
          </span>
        </div>
      </div>
      <Dropdown
        className="kv-folder-card__more"
        placement="bottom-end"
        trigger={<IconButton tooltip={false} icon="More" label="更多" variant="on-media-ghost" size={28} />}
      >
        <Menu>
          <MenuItem icon="Rename" onClick={onRename}>
            重命名
          </MenuItem>
          <MenuItem icon="StickyOnTop" onClick={() => onPinnedChange?.(!pinned)}>
            {pinned ? '取消置顶' : '置顶'}
          </MenuItem>
          <Divider />
          <MenuItem variant="danger" icon="Delete" onClick={onDelete}>
            删除
          </MenuItem>
        </Menu>
      </Dropdown>
    </div>
  );
});
FolderCard.displayName = 'FolderCard';
