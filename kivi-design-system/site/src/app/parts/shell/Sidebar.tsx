import { useMemo, useState } from 'react';
import { Icon, IconButton, Menu, MenuItem, ScrollArea } from '@kivi';
import { useControllable } from '@kivi/hooks';
import { createCanvas, pinCanvas, renameCanvas } from '../../data/canvases';
import { createChat, deleteChat, pinChat, renameChat, sortRecent } from '../../data/chats';
import { useDB } from '../../data/db';
import { confirmDelete, confirmDeleteCanvases } from '../../flows/delete';
import { attempt } from '../../flows/errors';
import { HistoryGroup, type HistoryItem } from './HistoryGroup';

/*
  主站侧栏：Logo、导航、对话和画布的历史。点条目选中，「⋯」出菜单（重命名在原地改、回车生效；置顶挪到最前；删除真的删），标题右边新建一条，标题点了展开收起。
  对话读 db.chats、画布读 db.canvases（置顶在前，其余新到旧），重命名、置顶、删除、新建都调 data/ 里的动作。
  条目的缩略图：对话取第一张成功的图（视频取封面），画布取第一张封面，没有就是图标。
  收起：宽 240 → 60（12 + 条目 36 + 12），300ms ease-in-out，收成图标栏：Logo、导航图标、封面、新建、更多。
  收起后悬停 Logo 换成「展开侧栏」按钮，点了展开
*/

/** UI 页面预览里能切的页：侧栏四个导航 + 画布 */
export type AppPage = 'create' | 'explore' | 'tools' | 'assets' | 'canvas';
export type HistoryKind = 'chat' | 'canvas';

const NAV_ITEMS: { page: AppPage; icon: 'Create' | 'Explore' | 'AITools' | 'Pack'; label: string }[] = [
  { page: 'create', icon: 'Create', label: '创作' },
  { page: 'explore', icon: 'Explore', label: '探索' },
  { page: 'tools', icon: 'AITools', label: 'AI 工具' },
  { page: 'assets', icon: 'Pack', label: '我的资产' },
];

export interface SidebarProps {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 当前在哪个导航页，那一项用选中底色；创作页只在没选中对话时选中「创作」 */
  page?: AppPage;
  /** 点导航（创作、探索、AI 工具、我的资产） */
  onNavigate?: (page: AppPage) => void;
  /** 选中哪条对话 / 画布（受控），不选传空 */
  selected?: string;
  /** 一开始选中哪条对话 / 画布（非受控），不选传空 */
  defaultSelected?: string;
  /** 点开（或新建）一条对话 / 画布：对话回创作页，画布进画布页 */
  onOpen?: (kind: HistoryKind, id: string) => void;
}

export function Sidebar({ collapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange, page, onNavigate, selected: selectedProp, defaultSelected = 'chat-1', onOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useControllable(collapsedProp, defaultCollapsed, onCollapsedChange);
  // 点收起后，鼠标离开过 Logo 这行才认悬停：点的时候鼠标还在这行，鼠标不动浏览器不重新算悬停，不然「展开侧栏」会冒出来
  const [settling, setSettling] = useState(false);
  const [selected, setSelected] = useControllable(selectedProp, defaultSelected);
  const open = (kind: HistoryKind, id: string) => {
    setSelected(id);
    onOpen?.(kind, id);
  };

  const chats = useDB((s) => s.chats);
  const tasks = useDB((s) => s.tasks);
  const assets = useDB((s) => s.assets);
  const canvases = useDB((s) => s.canvases);

  const chatItems = useMemo<HistoryItem[]>(() => {
    const taskById = new Map(tasks.map((t) => [t.id, t]));
    const assetById = new Map(assets.map((a) => [a.id, a]));
    const thumbOf = (items: (typeof chats)[number]['items']) => {
      for (const it of items) {
        if (it.kind !== 'task') continue;
        for (const o of taskById.get(it.taskId)?.outputs ?? []) {
          const a = o.assetId ? assetById.get(o.assetId) : undefined;
          if (a && a.media !== 'audio') return a.media === 'video' ? a.poster : a.src;
        }
      }
      return undefined;
    };
    return sortRecent(chats).map((c) => ({ id: c.id, text: c.title, thumb: thumbOf(c.items), pinned: c.pinned }));
  }, [chats, tasks, assets]);
  const canvasItems = useMemo<HistoryItem[]>(() => sortRecent(canvases).map((c) => ({ id: c.id, text: c.name, thumb: c.covers[0], pinned: c.pinned })), [canvases]);

  const toggle = collapsed ? '展开侧栏' : '收起侧栏';
  return (
    <div className="tpl-ms__side-wrap" data-collapsed={collapsed ? '' : undefined} data-settling={settling ? '' : undefined}>
      <ScrollArea className="tpl-ms__side-scroll">
        <aside className="tpl-ms__side">
          <div className="tpl-ms__brand" onPointerLeave={() => setSettling(false)}>
            {/* Logo 是按钮：点了回创作首页（照 LibTV），收起时藏起来、换小 Logo */}
            <button type="button" className="tpl-ms__home" aria-label="回到创作首页" onClick={() => onNavigate?.('create')}>
              <Icon name="Logo" />
            </button>
            {/* 收起时的小 Logo：绿色渐变底 + 描边，Logo 缩小放正中（照原型） */}
            <span className="tpl-ms__mini-logo" aria-hidden>
              <Icon name="Logo" />
            </span>
            {/* 展开时在右边；收起时淡出，原地不动。收起后悬停小 Logo 才在它的位置出现。轻：平时 50%，悬停变亮 */}
            <span className="tpl-ms__toggle">
              <IconButton icon="Sidebar" label={toggle} variant="ghost-muted" size={28} tooltip={{ placement: collapsed ? 'right' : 'bottom' }} onClick={() => { setSettling(!collapsed); setCollapsed(!collapsed); }} />
            </span>
          </div>
          <Menu variant="plain" aria-label="主站导航">
            {NAV_ITEMS.map((n) => (
              <MenuItem
                key={n.page}
                icon={n.icon}
                collapsed={collapsed}
                selected={(page === n.page && (n.page !== 'create' || !selected)) || undefined}
                onClick={() => onNavigate?.(n.page)}
              >
                {n.label}
              </MenuItem>
            ))}
            <div className="tpl-ms__gap" />
            <HistoryGroup
              title="对话"
              icon="Message"
              items={chatItems}
              selected={selected}
              collapsed={collapsed}
              onSelect={(id) => open('chat', id)}
              onNew={() => void attempt(() => createChat('新对话')).then((c) => c && open('chat', c.id))}
              onRemove={(id) => void confirmDelete(() => deleteChat(id))}
              onRename={(id, name) => void attempt(() => renameChat(id, name))}
              onPin={(id) => void attempt(() => pinChat(id))}
            />
            <div className="tpl-ms__gap" />
            <HistoryGroup
              title="画布"
              icon="Canvas"
              items={canvasItems}
              selected={selected}
              collapsed={collapsed}
              onSelect={(id) => open('canvas', id)}
              onNew={() => void attempt(() => createCanvas('未命名画布')).then((c) => c && open('canvas', c.id))}
              onRemove={(id) => void confirmDeleteCanvases([id])}
              onRename={(id, name) => void attempt(() => renameCanvas(id, name))}
              onPin={(id) => void attempt(() => pinCanvas(id))}
              onAll={() => onNavigate?.('assets')}
              // 演示：新标签页打开画布模板（不套网站外壳）
              onOpenNewTab={(id) => window.open(`${location.pathname}#/app/canvas/${id}`, '_blank', 'noopener')}
            />
          </Menu>
        </aside>
      </ScrollArea>
    </div>
  );
}
