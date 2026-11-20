import type { ReactNode } from 'react';
import { Button, Checkbox, Dropdown, Menu, MenuItem, Popover } from '@kivi';
import { addToFolder, removeFromFolder } from '../../data/assets';
import { useDB } from '../../data/db';
import type { Asset } from '../../data/types';
import { collectAssets, deleteAssets, DOWNLOAD_LIMIT, downloadAssets, run } from './ops';

/*
  批量编辑的控件：和「批量编辑」按钮放在同一个位置（筛选行或标题行的最右边），点了原地换成
  「全选（已选 N 个）」+ 操作 +「取消编辑」，不另起一行，进出批量编辑时页面不跳（照线上，11-18 用户定）。
  素材和画布各一份操作。
*/

/** 「批量编辑」按钮和批量控件的切换：不在批量编辑时是按钮，在的时候原地换成批量控件 */
export function BatchControls({
  picking,
  onStart,
  canStart,
  total,
  picked,
  onSelectAll,
  onDone,
  label,
  children,
}: {
  picking: boolean;
  onStart: () => void;
  canStart: boolean;
  total: number;
  picked: number;
  onSelectAll: (all: boolean) => void;
  onDone: () => void;
  label: string;
  children: ReactNode;
}) {
  if (!picking)
    return (
      <Button size={32} variant="ghost-muted" disabled={!canStart} onClick={onStart}>
        批量编辑
      </Button>
    );
  return (
    <div className="tpl-as__batch" role="toolbar" aria-label={label}>
      <Checkbox checked={picked === 0 ? false : picked === total ? true : 'mixed'} onChange={onSelectAll}>
        全选（已选 {picked} 个）
      </Checkbox>
      {children}
      <Button size={32} variant="ghost-muted" leftIcon="Close" onClick={onDone}>
        取消编辑
      </Button>
    </div>
  );
}

/** 素材的批量操作（按钮用无底灰，和「取消编辑」一样）：收藏 / 取消收藏、添加至文件夹、移出文件夹（文件夹内页才有）、下载、删除。没选东西时都置灰 */
export function AssetBatchActions({ items, folderId, onChanged }: { items: Asset[]; folderId?: string; onChanged: () => void }) {
  const folders = useDB((s) => s.folders);
  const ids = items.map((a) => a.id);
  const none = items.length === 0;
  const allCollected = !none && items.every((a) => a.collected);
  const tooMany = items.length > DOWNLOAD_LIMIT;
  const download = (
    <Button
      size={32}
      variant="ghost-muted"
      leftIcon="Download"
      disabled={none}
      aria-disabled={tooMany || undefined}
      onClick={(e) => (tooMany ? e.preventDefault() : downloadAssets(items))}
    >
      下载
    </Button>
  );
  return (
    <>
      <Dropdown placement="bottom-start" trigger={<Button size={32} variant="ghost-muted" leftIcon="AddFolder" disabled={none}>添加至</Button>}>
        <Menu aria-label="添加至文件夹">
          {folders.length === 0 && <MenuItem disabled>暂无文件夹</MenuItem>}
          {folders.map((f) => (
            <MenuItem key={f.id} icon="Folder" onClick={() => void run(() => addToFolder(ids, f.id), '已添加至文件夹')}>
              {f.name}
            </MenuItem>
          ))}
        </Menu>
      </Dropdown>
      {folderId && (
        <Button size={32} variant="ghost-muted" leftIcon="Folder" disabled={none} onClick={() => void run(() => removeFromFolder(ids, folderId), '已移出文件夹').then(onChanged)}>
          移出文件夹
        </Button>
      )}
      {tooMany ? (
        <Popover content={`一次最多下载 ${DOWNLOAD_LIMIT} 个`} placement="bottom">
          {download}
        </Popover>
      ) : (
        download
      )}
      <Button size={32} variant="ghost-muted" leftIcon={allCollected ? 'CollectSolid' : 'Collect'} disabled={none} onClick={() => void collectAssets(ids, !allCollected)}>
        {allCollected ? '取消收藏' : '收藏'}
      </Button>
      <Button size={32} variant="ghost-muted" leftIcon="Delete" disabled={none} onClick={() => void deleteAssets(ids).then((ok) => ok && onChanged())}>
        删除
      </Button>
    </>
  );
}
