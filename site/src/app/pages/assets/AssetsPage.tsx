import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, ProjectCard, ScrollArea } from '@kivi';
import { useDB } from '../../data/db';
import { createCanvas, renameCanvas } from '../../data/canvases';
import { createFolder, deleteFolder, renameFolder } from '../../data/assets';
import { confirmDelete, confirmDeleteCanvases } from '../../flows/delete';
import { shareCanvas } from '../../flows/share';
import { HistorySection } from './HistorySection';
import { NameDialog } from './NameDialog';
import { CanvasesPage, FolderPage, FoldersPage, renderFolderCard, type FolderCardData, type FolderHandlers } from './SubPages';
import { run } from './ops';

/*
  资产管理（我的资产）：照 11-04 交互原型（kivi-prototype 的 assets-home）。
  首页三块从上到下：我的素材（文件夹）、我的画布、生成历史（全部历史，按今天 / 昨天 / 更早分组）。
  「查看全部」进二级页：文件夹列表 → 文件夹内页、画布列表（页面里切，返回回首页）。
  数据读 useDB（素材、文件夹、画布）；文件夹里的数量、封面由素材的 folderIds 算。
  筛选、搜索、时间筛选在生成历史里，是页面状态；收藏、删文件夹、改名走 data/。
*/

/** 文件夹内页记着是从哪进来的（资产首页 / 文件夹列表页），返回回到那里 */
type View = { kind: 'home' } | { kind: 'folders' } | { kind: 'folder'; id: string; from: 'home' | 'folders' } | { kind: 'canvases' };
const HOME: View = { kind: 'home' };

/** 一块的标题行：左标题，右边「新建」「查看全部」。右边按钮一律无底灰（设计规则 · 布局 · 标题行，11-14） */
function SectionHead({ title, onAll, children }: { title: string; onAll: () => void; children?: ReactNode }) {
  return (
    <header className="tpl-as__head">
      <h2>{title}</h2>
      <div className="tpl-as__head-actions">
        {children}
        <Button size={32} variant="ghost-muted" rightIcon="RightArrowSmall" onClick={onAll}>
          查看全部
        </Button>
      </div>
    </header>
  );
}

/** 文件夹封面最多几张 */
const COVER_MAX = 4;
/** 新建画布的默认名字 */
const NEW_CANVAS_NAME = '未命名画布';
const DELETE_FOLDER_DESCRIPTION = "删除后，文件夹内容在'我的资产'页面仍可找到";

type NameTarget = { kind: 'new-folder' } | { kind: 'rename-folder'; id: string } | { kind: 'rename-canvas'; id: string } | null;

/** 资产页主区（侧栏在 UI 页面预览的外壳里） */
export function AssetsPage({ onOpenCanvas }: { onOpenCanvas: (canvasId: string) => void }) {
  const assets = useDB((s) => s.assets);
  const allFolders = useDB((s) => s.folders);
  const canvases = useDB((s) => s.canvases);
  const [view, setView] = useState<View>(HOME);
  const [nameTarget, setNameTarget] = useState<NameTarget>(null);
  // 置顶只是页面上的排序（原来就没存），置顶的排最前面
  const [pinned, setPinned] = useState<string[]>(['f1']);
  // 生成历史的「加载下一页」，由它自己挂上来；滚到底时调
  const moreRef = useRef<() => void>();

  // 每个文件夹的数量和封面：数素材（音频没有封面图）
  const folders = useMemo<FolderCardData[]>(() => {
    const items = allFolders.map((f) => {
      const inside = assets.filter((a) => a.folderIds.includes(f.id));
      return {
        id: f.id,
        name: f.name,
        count: inside.length,
        covers: inside
          .filter((a) => a.media !== 'audio')
          .slice(0, COVER_MAX)
          .map((a) => a.poster ?? a.src),
        pinned: pinned.includes(f.id),
      };
    });
    return [...items.filter((f) => f.pinned), ...items.filter((f) => !f.pinned)];
  }, [allFolders, assets, pinned]);

  const handlers: FolderHandlers = {
    onOpen: (id) => setView({ kind: 'folder', id, from: view.kind === 'folders' ? 'folders' : 'home' }),
    onPin: (id, on) => setPinned((all) => (on ? [...all, id] : all.filter((x) => x !== id))),
    onRename: (id) => setNameTarget({ kind: 'rename-folder', id }),
    onDelete: (id) => void deleteFolderConfirmed(id),
  };
  const deleteFolderConfirmed = (id: string) => confirmDelete(() => deleteFolder(id), { description: DELETE_FOLDER_DESCRIPTION });
  const home = useCallback(() => setView(HOME), []);

  // 起名弹窗：新建 / 改名文件夹、改名画布共用
  const nameState = (() => {
    if (!nameTarget) return null;
    if (nameTarget.kind === 'new-folder') return { title: '新建文件夹', initial: '' };
    if (nameTarget.kind === 'rename-folder') return { title: '重命名文件夹', initial: allFolders.find((f) => f.id === nameTarget.id)?.name ?? '' };
    return { title: '重命名画布', initial: canvases.find((c) => c.id === nameTarget.id)?.name ?? '' };
  })();
  const submitName = (name: string) => {
    if (!nameTarget) return Promise.resolve(false);
    if (nameTarget.kind === 'new-folder') return run(() => createFolder(name), '已新建文件夹');
    if (nameTarget.kind === 'rename-folder') return run(() => renameFolder(nameTarget.id, name));
    return run(() => renameCanvas(nameTarget.id, name));
  };
  const newCanvas = () => void run(() => createCanvas(NEW_CANVAS_NAME), '已新建画布');

  const dialog = <NameDialog state={nameState} onSubmit={submitName} onClose={() => setNameTarget(null)} />;
  // 删文件夹：在内页删了，数据没了会自己回上一级（FolderPage 监听）
  const folderPageProps = (id: string, from: 'home' | 'folders') => ({
    id,
    onBack: () => setView(from === 'folders' ? { kind: 'folders' } : HOME),
    onRename: () => setNameTarget({ kind: 'rename-folder', id }),
    onDelete: () => void deleteFolderConfirmed(id),
  });

  if (view.kind === 'folders') {
    return (
      <>
        <FoldersPage folders={folders} handlers={handlers} onBack={home} onCreate={() => setNameTarget({ kind: 'new-folder' })} />
        {dialog}
      </>
    );
  }
  if (view.kind === 'folder') {
    return (
      <>
        <FolderPage key={view.id} {...folderPageProps(view.id, view.from)} />
        {dialog}
      </>
    );
  }
  if (view.kind === 'canvases') {
    return (
      <>
        <CanvasesPage onBack={home} onCreate={newCanvas} onOpen={onOpenCanvas} onRename={(c) => setNameTarget({ kind: 'rename-canvas', id: c.id })} />
        {dialog}
      </>
    );
  }

  return (
    <ScrollArea className="tpl-as" onReachEnd={() => moreRef.current?.()} reachEndOffset={300}>
      <main className="tpl-as__body">
        <section className="tpl-as__section">
          <SectionHead title="我的素材" onAll={() => setView({ kind: 'folders' })}>
            <Button size={32} variant="ghost-muted" leftIcon="AddSmall" onClick={() => setNameTarget({ kind: 'new-folder' })}>
              新建文件夹
            </Button>
          </SectionHead>
          <div className="tpl-as__row">{folders.map((f) => renderFolderCard(f, handlers))}</div>
        </section>

        <section className="tpl-as__section">
          <SectionHead title="我的画布" onAll={() => setView({ kind: 'canvases' })}>
            <Button size={32} variant="ghost-muted" leftIcon="AddSmall" onClick={newCanvas}>
              新建画布
            </Button>
          </SectionHead>
          <div className="tpl-as__row">
            {canvases.map((c) => (
              <ProjectCard
                key={c.id}
                name={c.name}
                covers={c.covers}
                updatedAt={c.updatedAt}
                onOpen={() => onOpenCanvas(c.id)}
                onShare={() => void shareCanvas(c.id)}
                onRename={() => setNameTarget({ kind: 'rename-canvas', id: c.id })}
                onDelete={() => void confirmDeleteCanvases([c.id])}
              />
            ))}
          </div>
        </section>

        <HistorySection moreRef={moreRef} />
      </main>
      {dialog}
    </ScrollArea>
  );
}
