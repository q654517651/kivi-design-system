import { Divider, Dropdown, Menu, MenuItem } from '@kivi';
import { addToFolder } from '../../data/assets';
import { run } from '../assets/ops';
import { copyImage, downloadMedia } from '../../flows/files';
import { FolderSubMenu } from '../../parts/folder-menu';
import { moreTools, type TileRef } from './tiles';
import type { ToolId } from '../../data/tools';

/*
  结果格的两个菜单，都锚在点的位置：
  - 「更多」：其余的工具，往上开、右边和按钮对齐（按钮条在右下）
  - 右键：加入参考图在第一个，别的照探索页的作品菜单
*/

export interface TileMenuState {
  x: number;
  y: number;
  tile: TileRef;
}

export interface TileMenusProps {
  more: TileMenuState | null;
  menu: TileMenuState | null;
  onCloseMore: () => void;
  onCloseMenu: () => void;
  onTool: (id: ToolId, t: TileRef) => void;
  onAddRef: (t: TileRef) => void;
  onRemove: (t: TileRef) => void;
}

export function TileMenus({ more, menu, onCloseMore, onCloseMenu, onTool, onAddRef, onRemove }: TileMenusProps) {
  return (
    <>
      <Dropdown anchorPoint={more ?? undefined} placement="top-end" open={more !== null} onOpenChange={(v) => !v && onCloseMore()}>
        <Menu aria-label="更多工具">
          {more &&
            more.tile.media !== 'audio' &&
            moreTools(more.tile.media).map((t) => (
              <MenuItem key={t.id} icon={t.icon} onClick={() => onTool(t.id, more.tile)}>
                {t.name}
              </MenuItem>
            ))}
        </Menu>
      </Dropdown>

      <Dropdown anchorPoint={menu ?? undefined} open={menu !== null} onOpenChange={(v) => !v && onCloseMenu()}>
        <Menu aria-label="结果操作">
          <MenuItem icon="ImagePlus" onClick={() => menu && onAddRef(menu.tile)}>
            {menu?.tile.media === 'audio' ? '加入参考' : '加入参考图'}
          </MenuItem>
          {/* 没有素材的格子（生成中、失败）不能加文件夹 */}
          <FolderSubMenu
            label="添加到文件夹"
            disabled={!menu?.tile.assetId}
            onPick={(f) => menu?.tile.assetId && void run(() => addToFolder([menu.tile.assetId!], f), '已添加到文件夹')}
          />
          <Divider />
          {menu?.tile.media === 'image' && (
            <MenuItem icon="Copy" disabled={!menu.tile.src} onClick={() => void copyImage(menu.tile.src)}>
              复制
            </MenuItem>
          )}
          <MenuItem icon="Download" disabled={!menu?.tile.src} onClick={() => menu && void downloadMedia([{ src: menu.tile.src }])}>
            下载
          </MenuItem>
          <Divider />
          <MenuItem variant="danger" icon="Delete" onClick={() => menu && onRemove(menu.tile)}>
            删除
          </MenuItem>
        </Menu>
      </Dropdown>
    </>
  );
}
