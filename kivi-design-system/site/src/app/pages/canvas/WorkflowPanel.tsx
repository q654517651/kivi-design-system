import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Divider, Dropdown, EmptyState, ExploreCard, Menu, MenuItem, Popover, ScrollArea, TabItem, Tabs, placeholderImageSrc, toast } from '@kivi';
import { attempt } from '../../flows/errors';
import { confirmDelete } from '../../flows/delete';
import { useBriefLoading } from '../../hooks/useBriefLoading';
import { usePaged } from '../../hooks/usePaged';
import { cloneTemplate, deleteWorkflow, officialWorkflows, renameWorkflow, useMyWorkflows, WORKFLOW_CATEGORIES } from '../../data/workflows';
import type { Workflow } from '../../data/types';
import { NameDialog } from '../assets/NameDialog';
import { CardSkeleton, CategoryTabs } from '../explore/shared';
import { CanvasPreviewDialog } from '../../parts/canvas-preview';

/*
  画布底部「工作流」（照线上 left-toolbar/workflow-panel）：点按钮往上弹一块面板（玻璃），再点、点外面、Esc 关。
  - 选项卡：官方工作流（下面一排分类）/ 我的工作流。一行 3 张卡，滚到底加载下一屏。
  - 点卡片：预览（只读画布，看节点和连线），右上角「应用画布」（CanvasPreviewDialog，和探索页同一个）。右键：查看、应用；我的还能重命名、删除。
  - 应用：整段节点复制进画布、放在视口中心，选中并放进视野，Toast「工作流应用成功」，面板关上。
  预览、确认删除、重命名开着时点外面不关面板（照线上）。
*/

/** 一屏几张：3 列 × 3 行 */
const PAGE = 9;

export interface WorkflowPanelProps {
  /** 应用了：把这段节点放进画布，返回新节点 id */
  onApply: (wf: Workflow) => void;
  /** 触发按钮（IconButton） */
  children: ReactElement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkflowPanel({ onApply, children, open, onOpenChange }: WorkflowPanelProps) {
  const mine = useMyWorkflows();
  const [tab, setTab] = useState<'public' | 'private'>('public');
  const [category, setCategory] = useState('all');
  const [view, setView] = useState<Workflow | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; wf: Workflow } | null>(null);
  const [renaming, setRenaming] = useState<Workflow | null>(null);
  const [confirming, setConfirming] = useState(false);
  // 面板外面还开着别的（预览、确认、重命名、右键菜单）：点外面不关面板
  const busy = view !== null || renaming !== null || confirming || menu !== null;

  // 预览开着按 Esc：只关预览，面板留着（面板自己在 document 上拦 Esc，这里在 window 上先接住）
  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing) return;
      e.stopPropagation();
      setView(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [view]);

  const list = useMemo(() => (tab === 'private' ? mine : officialWorkflows().filter((w) => category === 'all' || w.category === category)), [tab, mine, category]);
  // 打开、切选项卡、切分类：先出骨架（照线上加载中）
  const key = `${open}|${tab}|${category}`;
  const loading = useBriefLoading(key);
  const more = useMemo(() => ({ current: undefined as (() => void) | undefined }), []);
  const { count, loading: paging } = usePaged(list.length, PAGE, key, more);

  const apply = (wf: Workflow) => {
    setView(null);
    onOpenChange(false);
    if (!wf.template.nodes.length) {
      toast.warning('该工作流暂无可用数据');
      return;
    }
    onApply({ ...wf, template: cloneTemplate(wf.template) });
    toast.success('工作流应用成功');
  };
  const remove = async (wf: Workflow) => {
    setConfirming(true);
    await confirmDelete(() => deleteWorkflow(wf.id));
    setConfirming(false);
    if (view?.id === wf.id) setView(null);
  };

  const panel = (
    <div className="tpl-cv-wf">
      <Tabs value={tab} onChange={(v) => setTab(v as 'public' | 'private')} aria-label="工作流">
        <TabItem value="public">官方工作流</TabItem>
        <TabItem value="private">我的工作流</TabItem>
      </Tabs>
      {tab === 'public' && <CategoryTabs label="工作流分类" value={category} options={WORKFLOW_CATEGORIES} onChange={setCategory} />}
      {!loading && list.length === 0 ? (
        <EmptyState size={96} title="暂无工作流" className="tpl-cv-wf__empty" />
      ) : (
        <ScrollArea className="tpl-cv-wf__list" onReachEnd={() => more.current?.()}>
          {loading ? (
            <div className="tpl-cv-wf__grid" aria-busy>
              {Array.from({ length: 6 }, (_, i) => (
                <CardSkeleton key={i} short />
              ))}
            </div>
          ) : (
            <div className="tpl-cv-wf__grid">
              {list.slice(0, count).map((wf) => (
                <ExploreCard
                  key={wf.id}
                  name={wf.name}
                  cover={wf.cover}
                  video={wf.video}
                  onOpen={() => setView(wf)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu({ x: e.clientX, y: e.clientY, wf });
                  }}
                />
              ))}
              {paging && Array.from({ length: 3 }, (_, i) => <CardSkeleton key={`more-${i}`} short />)}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );

  return (
    <>
      <Popover
        variant="panel"
        on="click"
        // 工具栏在左边：面板往右出，离条 4（按钮到条边 4 + 4，11-23）
        placement="right"
        offset={8}
        open={open}
        // 预览、确认、重命名、右键菜单开着：焦点移过去、点在它们上面都不关面板
        onOpenChange={(v) => (v || !busy) && onOpenChange(v)}
        onInteractOutside={(e) => busy && e.preventDefault()}
        content={panel}
      >
        {children}
      </Popover>

      <Dropdown anchorPoint={menu ?? undefined} open={menu !== null} onOpenChange={(v) => !v && setMenu(null)}>
        <Menu aria-label="工作流操作">
          <MenuItem onClick={() => menu && setView(menu.wf)}>
            查看
          </MenuItem>
          <MenuItem onClick={() => menu && apply(menu.wf)}>
            应用
          </MenuItem>
          {menu?.wf.scope === 'private' && (
            <>
              <MenuItem onClick={() => setRenaming(menu.wf)}>
                重命名
              </MenuItem>
              <Divider />
              <MenuItem variant="danger" onClick={() => void remove(menu.wf)}>
                删除
              </MenuItem>
            </>
          )}
        </Menu>
      </Dropdown>

      {/* 预览：只读画布，作者（官方是 KIVI，我的是自己），右上角「应用画布」（照线上 WorkflowPreview，和探索页预览同一个） */}
      <CanvasPreviewDialog
        item={view && { name: view.name, owner: view.scope === 'private' ? { name: '我', avatar: placeholderImageSrc('ip-peek', '1:1') } : undefined, template: view.template }}
        onClose={() => setView(null)}
        onAction={() => view && apply(view)}
      />

      <NameDialog
        state={renaming && { title: '重命名', initial: renaming.name }}
        onSubmit={async (name) => {
          const ok = await attempt(() => renameWorkflow(renaming!.id, name).then(() => true));
          if (ok) toast.success('工作流名称修改成功');
          return !!ok;
        }}
        onClose={() => setRenaming(null)}
      />
    </>
  );
}
