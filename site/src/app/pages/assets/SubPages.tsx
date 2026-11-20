import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Dropdown, EmptyState, FolderCard, IconButton, Menu, MenuItem, ProjectCard, ScrollArea } from '@kivi';
import { useDB } from '../../data/db';
import type { CanvasMeta } from '../../data/types';
import { confirmDelete, confirmDeleteCanvases } from '../../flows/delete';
import { shareCanvas } from '../../flows/share';
import { AssetBatchActions, BatchControls } from './BatchBar';
import { Pickable } from './Pickable';
import { useAssetCells } from './assetCells';

/*
  资产页的三个二级页：文件夹列表、文件夹内页、画布列表。
  头：返回 + 标题（+ 右边操作），内容和首页同一套格子；批量编辑沿用首页生成历史那条批量条。
*/

/** 二级页的头：返回 + 标题是一个无底按钮（左边返回箭头，点标题也能返回，11-20 用户定：大家第一反应会点标题返回），标题旁可放「⋯」，右边放操作 */
function SubHead({ title, onBack, aside, children }: { title: string; onBack: () => void; aside?: ReactNode; children?: ReactNode }) {
  return (
    <header className="tpl-as__head">
      <div className="tpl-as__head-title">
        <h2>
          <Button variant="ghost" size={32} leftIcon="LeftArrow" aria-label={`${title}，返回`} onClick={onBack}>
            {title}
          </Button>
        </h2>
        {aside}
      </div>
      <div className="tpl-as__head-actions">{children}</div>
    </header>
  );
}

export interface FolderCardData {
  id: string;
  name: string;
  count: number;
  covers: string[];
  pinned: boolean;
}

export interface FolderHandlers {
  onOpen: (id: string) => void;
  onPin: (id: string, on: boolean) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}

/** 文件夹卡（首页一排、列表页网格共用） */
export function renderFolderCard(f: FolderCardData, h: FolderHandlers) {
  return (
    <FolderCard
      key={f.id}
      name={f.name}
      count={f.count}
      covers={f.covers}
      pinned={f.pinned}
      onOpen={() => h.onOpen(f.id)}
      onRename={() => h.onRename(f.id)}
      onPinnedChange={(v) => h.onPin(f.id, v)}
      onDelete={() => h.onDelete(f.id)}
    />
  );
}

/** 文件夹列表页：网格列出所有文件夹，新建文件夹 */
export function FoldersPage({ folders, handlers, onBack, onCreate }: { folders: FolderCardData[]; handlers: FolderHandlers; onBack: () => void; onCreate: () => void }) {
  return (
    <ScrollArea className="tpl-as">
      <main className="tpl-as__body">
        <section className="tpl-as__section">
          <SubHead title="我的素材" onBack={onBack}>
            <Button size={32} variant="ghost-muted" leftIcon="AddSmall" onClick={onCreate}>
              新建文件夹
            </Button>
          </SubHead>
          {folders.length === 0 ? (
            <EmptyState type="empty" size={160} title="还没有文件夹" className="tpl-as__empty" />
          ) : (
            <div className="tpl-as__cards">{folders.map((f) => renderFolderCard(f, handlers))}</div>
          )}
        </section>
      </main>
    </ScrollArea>
  );
}

/** 文件夹内页：返回 + 文件夹名（标题旁「⋯」改名、删除），只列这个文件夹里的素材 */
export function FolderPage({ id, onBack, onRename, onDelete }: { id: string; onBack: () => void; onRename: () => void; onDelete: () => void }) {
  const folder = useDB((s) => s.folders.find((f) => f.id === id));
  const assets = useDB((s) => s.assets);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const items = useMemo(() => assets.filter((a) => a.folderIds.includes(id)).sort((a, b) => b.createdAt - a.createdAt), [assets, id]);

  // 文件夹被删了（本页删的、别处删的）回上一级；素材被删、被移出的从已选里去掉
  useEffect(() => {
    if (!folder) onBack();
  }, [folder, onBack]);
  useEffect(() => {
    setPicked((p) => {
      const ids = new Set(items.map((a) => a.id));
      const next = new Set([...p].filter((x) => ids.has(x)));
      return next.size === p.size ? p : next;
    });
  }, [items]);
  const toggle = (x: string) =>
    setPicked((p) => {
      const next = new Set(p);
      if (!next.delete(x)) next.add(x);
      return next;
    });
  const done = () => {
    setPicking(false);
    setPicked(new Set());
  };
  const { cell, extra } = useAssetCells(items, { folderId: id, picking, picked, onToggle: toggle });
  const pickedItems = items.filter((a) => picked.has(a.id));

  return (
    <ScrollArea className="tpl-as">
      <main className="tpl-as__body">
        <section className="tpl-as__section">
          <SubHead
            title={folder?.name ?? ''}
            onBack={onBack}
            aside={
              <Dropdown placement="bottom-start" trigger={<IconButton tooltip={false} icon="More" label="更多" variant="ghost-muted" size={28} />}>
                <Menu aria-label="文件夹操作">
                  <MenuItem icon="Rename" onClick={onRename}>
                    重命名
                  </MenuItem>
                  <MenuItem variant="danger" icon="Delete" onClick={onDelete}>
                    删除
                  </MenuItem>
                </Menu>
              </Dropdown>
            }
          >
            <BatchControls
              label="批量操作"
              picking={picking}
              onStart={() => setPicking(true)}
              canStart={items.length > 0}
              total={items.length}
              picked={pickedItems.length}
              onSelectAll={(all) => setPicked(all ? new Set(items.map((a) => a.id)) : new Set())}
              onDone={done}
            >
              <AssetBatchActions items={pickedItems} folderId={id} onChanged={() => setPicked(new Set())} />
            </BatchControls>
          </SubHead>
          {items.length === 0 ? (
            <EmptyState type="empty" size={160} title="文件夹里还没有素材" className="tpl-as__empty" />
          ) : (
            <div className="tpl-as__grid">{items.map(cell)}</div>
          )}
        </section>
      </main>
      {extra}
    </ScrollArea>
  );
}

/** 画布列表页：网格列出所有画布，新建画布，批量删除 */
export function CanvasesPage({
  onBack,
  onCreate,
  onOpen,
  onRename,
}: {
  /** 点卡打开那块画布 */
  onOpen: (canvasId: string) => void;
  onBack: () => void;
  onCreate: () => void;
  onRename: (c: CanvasMeta) => void;
}) {
  const canvases = useDB((s) => s.canvases);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  useEffect(() => {
    setPicked((p) => {
      const ids = new Set(canvases.map((c) => c.id));
      const next = new Set([...p].filter((x) => ids.has(x)));
      return next.size === p.size ? p : next;
    });
  }, [canvases]);
  const toggle = (x: string) =>
    setPicked((p) => {
      const next = new Set(p);
      if (!next.delete(x)) next.add(x);
      return next;
    });
  const done = () => {
    setPicking(false);
    setPicked(new Set());
  };
  const ids = canvases.filter((c) => picked.has(c.id)).map((c) => c.id);
  const removeMany = async () => {
    // 一个个删，出错就停（handleError 在 confirmDelete 里已提示）
    const ok = await confirmDeleteCanvases(ids);
    if (ok) setPicked(new Set());
  };

  return (
    <ScrollArea className="tpl-as">
      <main className="tpl-as__body">
        <section className="tpl-as__section">
          <SubHead title="我的画布" onBack={onBack}>
            {!picking && (
              <Button size={32} variant="ghost-muted" leftIcon="AddSmall" onClick={onCreate}>
                新建画布
              </Button>
            )}
            <BatchControls
              label="批量操作"
              picking={picking}
              onStart={() => setPicking(true)}
              canStart={canvases.length > 0}
              total={canvases.length}
              picked={ids.length}
              onSelectAll={(all) => setPicked(all ? new Set(canvases.map((c) => c.id)) : new Set())}
              onDone={done}
            >
              <Button size={32} variant="ghost-muted" leftIcon="Delete" disabled={ids.length === 0} onClick={() => void removeMany()}>
                删除
              </Button>
            </BatchControls>
          </SubHead>
          {canvases.length === 0 ? (
            <EmptyState type="empty" size={160} title="还没有画布" className="tpl-as__empty" />
          ) : (
            <div className="tpl-as__cards">
              {canvases.map((c) => (
                <Pickable key={c.id} picking={picking} checked={picked.has(c.id)} onToggle={() => toggle(c.id)} label={c.name}>
                  <ProjectCard
                    name={c.name}
                    covers={c.covers}
                    updatedAt={c.updatedAt}
                    onOpen={() => onOpen(c.id)}
                    onShare={() => void shareCanvas(c.id)}
                    onRename={() => onRename(c)}
                    onDelete={() => void confirmDeleteCanvases([c.id])}
                  />
                </Pickable>
              ))}
            </div>
          )}
        </section>
      </main>
    </ScrollArea>
  );
}
