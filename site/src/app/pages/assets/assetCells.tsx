import { useState, type MouseEvent, type ReactNode } from 'react';
import {
  Divider,
  Dropdown,
  GenPrompt,
  IconButton,
  Menu,
  MenuItem,
  ResultTile,
  Tag,
  placeholderImageSrc,
} from '@kivi';
import { addToFolder, removeAssets, removeFromFolder } from '../../data/assets';
import { byId, useDB } from '../../data/db';
import type { Asset } from '../../data/types';
import { confirmDelete } from '../../flows/delete';
import { AssetInfo } from '../../parts/asset-info';
import { AudioCell, activateProps } from '../../parts/asset-cell';
import { MediaViewer, ViewerAuthor, useLastShown, type ViewerMedia } from '../../parts/media-viewer';
import { FolderSubMenu } from '../../parts/folder-menu';
import { Pickable } from './Pickable';
import { collectAssets, deleteAssets, downloadAssets, run } from './ops';

/*
  资产页里素材格子的公共部分：生成历史、文件夹内页都用它。
  一格（结果格 + 悬停「⋯」+ 右键菜单）、看大图（删了看下一张）、批量编辑时的勾选，都在这一处。
  用法：const { cell, extra } = useAssetCells(list, {...})；格子用 cell(item) 放，extra 放在页面最后（菜单和大图）。
*/

export const SOURCE_LABEL: Record<string, string> = { create: '会话', tools: '工具', canvas: '画布', upload: '上传' };
export const GROUPS = ['今天', '昨天', '更早'];
const DAY = 24 * 3_600_000;
export const startOfDay = (t: number) => new Date(t).setHours(0, 0, 0, 0);
/** 属于哪一组：今天 / 昨天 / 更早 */
export const groupOf = (createdAt: number) => {
  const days = Math.round((startOfDay(Date.now()) - startOfDay(createdAt)) / DAY);
  return GROUPS[Math.min(Math.max(days, 0), 2)];
};
export const timeOf = (t: number) => new Date(t).toTimeString().slice(0, 5);

interface MenuState {
  x: number;
  y: number;
  item: Asset;
  placement?: 'top-end';
}

export interface AssetCellsOptions {
  /** 在文件夹内页：菜单多一项「移出文件夹」 */
  folderId?: string;
  /** 批量编辑中 */
  picking: boolean;
  picked: Set<string>;
  onToggle: (id: string) => void;
}

export function useAssetCells(list: Asset[], { folderId, picking, picked, onToggle }: AssetCellsOptions) {
  const assets = useDB((s) => s.assets);
  const [viewId, setViewId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);

  // 看大图：图片、视频、音频都能看，上下切的是当前列表里的全部（照即梦）
  const viewable = list;
  const viewIndex = viewable.findIndex((a) => a.id === viewId);
  const view = viewIndex >= 0 ? viewable[viewIndex] : null;
  const shownView = useLastShown(view);
  const toMedia = (a: Asset): ViewerMedia => ({ type: a.media, src: a.src, poster: a.media === 'video' ? a.poster : undefined, alt: a.name ?? '', name: a.name });
  const viewCollected = shownView ? (byId(assets, shownView.id)?.collected ?? shownView.collected) : false;

  // 大图里删除：确认后先切到下一张（没有下一张看上一张），再删，免得大图闪一下关掉
  const deleteViewing = () => {
    if (!shownView) return;
    const next = viewable[viewIndex + 1] ?? viewable[viewIndex - 1];
    void confirmDelete(async () => {
      setViewId(next?.id ?? null);
      await removeAssets([shownView.id]);
    });
  };

  const card = (item: Asset): ReactNode => {
    if (item.media === 'audio') {
      return (
        <AudioCell
          name={item.name}
          duration={item.duration}
          onOpen={picking ? undefined : () => setViewId(item.id)}
          onContextMenu={picking ? undefined : (e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, item }); }}
          collect={!picking}
          collected={item.collected}
          onCollectedChange={(v) => void collectAssets([item.id], v)}
          quickActions={
            picking
              ? undefined
              : [
                  {
                    icon: 'More',
                    label: '更多',
                    onClick: (e: MouseEvent<HTMLButtonElement>) => {
                      const b = e.currentTarget.getBoundingClientRect();
                      setMenu({ x: b.right, y: b.top - 4, item, placement: 'top-end' });
                    },
                  },
                ]
          }
        />
      );
    }
    const video = item.media === 'video';
    return (
      <ResultTile
        // 点格子看大图（图片、视频都是），点的是格子里的按钮就不打开
        style={{ cursor: picking ? undefined : 'zoom-in' }}
        onClick={picking ? undefined : (e) => !(e.target as HTMLElement).closest('button') && setViewId(item.id)}
        onPreview={video ? () => setViewId(item.id) : undefined}
        {...activateProps(picking ? undefined : () => setViewId(item.id))}
        onContextMenu={
          picking
            ? undefined
            : (e: MouseEvent) => {
                e.preventDefault();
                setMenu({ x: e.clientX, y: e.clientY, item });
              }
        }
        title={item.name}
        type={video ? 'video' : undefined}
        src={item.src}
        poster={video ? item.poster : undefined}
        collect
        collected={item.collected}
        onCollectedChange={(v) => void collectAssets([item.id], v)}
        quickActions={[
          {
            icon: 'More',
            label: '更多',
            onClick: (e: MouseEvent<HTMLButtonElement>) => {
              const b = e.currentTarget.getBoundingClientRect();
              setMenu({ x: b.right, y: b.top - 4, item, placement: 'top-end' });
            },
          },
        ]}
      />
    );
  };

  const cell = (item: Asset) => (
    <Pickable key={item.id} picking={picking} checked={picked.has(item.id)} onToggle={() => onToggle(item.id)} label={item.name ?? '素材'}>
      {card(item)}
    </Pickable>
  );

  const extra = (
    <>
      <Dropdown anchorPoint={menu ?? undefined} placement={menu?.placement} open={menu !== null} onOpenChange={(v) => !v && setMenu(null)}>
        <Menu aria-label="素材操作">
          <FolderSubMenu onPick={(f) => menu && void run(() => addToFolder([menu.item.id], f), '已添加至文件夹')} />
          {folderId && (
            <MenuItem icon="Folder" onClick={() => menu && void run(() => removeFromFolder([menu.item.id], folderId), '已移出文件夹')}>
              移出文件夹
            </MenuItem>
          )}
          <MenuItem icon="Download" onClick={() => menu && downloadAssets([menu.item])}>
            下载
          </MenuItem>
          <Divider />
          <MenuItem variant="danger" icon="Delete" onClick={() => menu && void deleteAssets([menu.item.id])}>
            删除
          </MenuItem>
        </Menu>
      </Dropdown>

      <MediaViewer
        media={view && toMedia(view)}
        onClose={() => setViewId(null)}
        group={viewable.map(toMedia)}
        index={Math.max(viewIndex, 0)}
        onIndexChange={(i) => setViewId(viewable[i]?.id ?? null)}
        head={shownView && <ViewerAuthor name="KIVI" avatar={placeholderImageSrc('ip-peek', '1:1')} date={`${groupOf(shownView.createdAt)} ${timeOf(shownView.createdAt)}`} />}
        actions={
          shownView && (
            <>
              <IconButton icon="Download" label="下载" variant="secondary" size={36} onClick={() => downloadAssets([shownView])} />
              <IconButton icon="Delete" label="删除" variant="secondary" size={36} onClick={deleteViewing} />
              <IconButton
                icon={viewCollected ? 'CollectSolid' : 'Collect'}
                label={viewCollected ? '取消收藏' : '收藏'}
                variant="secondary"
                size={36}
                data-collected={viewCollected || undefined}
                onClick={() => void collectAssets([shownView.id], !viewCollected)}
              />
            </>
          )
        }
      >
        {shownView && <AssetInfo asset={shownView} onPick={setViewId} pickable={(id) => viewable.some((a) => a.id === id)} />}
      </MediaViewer>
    </>
  );

  return { cell, extra };
}
