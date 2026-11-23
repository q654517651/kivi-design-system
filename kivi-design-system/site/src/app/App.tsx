import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Notifier, Toaster, toast } from '@kivi';
import { PreviewHost } from '../docs/components/media.demos';
import { TemplateFrame } from '../docs/templates/frame';
import '../docs/templates/templates.css';
import { db, useDB } from './data/db';
import { useBalanceTip } from './flows/balance-tip';
import { FlowHost } from './flows/dialogs';
import { AssetsPage } from './pages/assets';
import { CanvasPage } from './pages/canvas';
import { CreateHome, CreatePage, type HomeMode } from './pages/create';
import { ExplorePage, type ExploreTab } from './pages/explore';
import { ToolsPage } from './pages/tools';
import { Sidebar, Wallet, type AppPage, type HistoryKind } from './parts/shell';
import { DemoPanel } from './parts/DemoPanel';
import type { AgentComposerMessage } from './parts/agent-composer';
import { ensureCanvas } from './data/canvases';
import { sendToReference } from './data/ref-inbox';
import { AssetLibrary } from './parts/asset-library';
import './app.css';

/*
  演示站（app/）的外壳。结构和规矩见 kivi-design-system-workspace/page-notes/app-architecture.md。
  UI 页面预览：主站整套页面，像线上一样能互相切。
  侧栏只有一个：切页时不重新挂载，收起 / 展开、对话和画布历史都跟着用户走；只换右边主区。
  点侧栏的画布历史进画布页（没有主站侧栏，和线上一样），点画布左上角 Logo 回创作页。
  创作页分两种：没选对话时是创作首页（CreateHome：标题、生成 / 画布、输入框、最近更新或最近项目、广场）；
  首页「生成」提交、点侧栏的对话历史，进对话页（CreatePage：生成记录 + 底部输入框）。
  网站里放在外框里（框里切）；单独开在 #/app/<页>，地址跟着切，浏览器前进后退能用。
*/

const PAGES: AppPage[] = ['create', 'explore', 'tools', 'assets', 'canvas'];
const NONE = { kind: 'chat' as HistoryKind, id: '' };

export function KiviApp({
  page,
  onNavigate,
  routeId,
  onSelectedChange,
}: {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  /** 地址里带的对话 / 画布 id（单独 Tab 才有） */
  routeId?: string;
  /** 选中的对话 / 画布变了：单独 Tab 写回地址，刷新、新标签页打开都停在它 */
  onSelectedChange?: (id: string) => void;
}) {
  useBalanceTip();
  const [collapsed, setCollapsed] = useState(false);
  // 侧栏选中哪条对话 / 画布：进来是创作首页，什么都不选
  const [selected, setSelected] = useState<{ kind: HistoryKind; id: string }>(() => {
    if (routeId && page === 'canvas' && db.get().canvases.some((c) => c.id === routeId)) return { kind: 'canvas', id: routeId };
    if (routeId && page === 'create' && db.get().chats.some((c) => c.id === routeId)) return { kind: 'chat', id: routeId };
    return NONE;
  });
  // 进探索页停在哪个选项卡：创作首页「查看全部」带过来
  const [exploreTab, setExploreTab] = useState<ExploreTab>('discover');
  // 创作首页广场的搜索框里填的字，进探索页时带过去
  const [exploreKeyword, setExploreKeyword] = useState('');
  // 进画布页时带着的技能：探索页技能点「使用」新建画布，Agent 输入框带上技能引用
  const [skill, setSkill] = useState<string | undefined>();
  // 创作首页停在「生成」还是「画布」：从全部画布页返回时回到「画布」
  const [homeMode, setHomeMode] = useState<HomeMode>('generate');
  // 资产页从哪进来：创作首页最近项目「查看全部」直接进全部画布页，返回回创作首页（11-20 用户定）；key 换了资产页重新挂载
  const [assetsEntry, setAssetsEntry] = useState<{ key: number; from?: 'create' }>({ key: 0 });
  // 素材库（11-23 原型，3.14 不做）：创作页右上角点开，右侧推出一栏；挑的素材加进输入框的参考区
  const [libraryOpen, setLibraryOpen] = useState(false);

  // 选中的对话被删掉了，回到创作首页
  const chats = useDB((s) => s.chats);
  // 地址带 id 进来（新标签页打开、刷新）：选中那条对话 / 那块画布（11-20 修 S-1）
  useEffect(() => {
    if (!routeId) return;
    if (page === 'canvas' && db.get().canvases.some((c) => c.id === routeId)) setSelected({ kind: 'canvas', id: routeId });
    if (page === 'create' && db.get().chats.some((c) => c.id === routeId)) setSelected({ kind: 'chat', id: routeId });
  }, [page, routeId]);
  useEffect(() => {
    onSelectedChange?.((page === 'canvas' && selected.kind === 'canvas') || (page === 'create' && selected.kind === 'chat') ? selected.id : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selected]);
  useEffect(() => {
    if (selected.kind === 'chat' && selected.id && !chats.some((c) => c.id === selected.id)) setSelected(NONE);
  }, [chats, selected]);

  // 去了探索、AI 工具、资产，侧栏不再选中对话；从画布回到创作页，也不再选中那块画布
  useEffect(() => {
    if (page === 'explore' || page === 'tools' || page === 'assets' || (page === 'create' && selected.kind === 'canvas')) {
      setSelected(NONE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const navigate = (next: AppPage) => {
    setSelected(NONE);
    setSkill(undefined);
    setHomeMode('generate');
    if (next === 'assets') setAssetsEntry((e) => ({ key: e.key + 1 }));
    if (next === 'explore') {
      setExploreTab('discover');
      setExploreKeyword('');
    }
    onNavigate(next);
  };
  // 新建画布进画布页（创作首页「画布」提交、探索页应用画布、技能「使用」）：在点的时候就建好，带着 id 进去。
  // 创作首页「画布」输入框里发的那句话，进去后 Agent 接着发
  const [canvasIntro, setCanvasIntro] = useState<AgentComposerMessage | undefined>();
  const openCanvas = (message?: AgentComposerMessage, withSkill?: string) => {
    setSelected({ kind: 'canvas', id: ensureCanvas() });
    setSkill(withSkill);
    setCanvasIntro(message && typeof message === 'object' && 'text' in message ? message : undefined);
    onNavigate('canvas');
  };
  // 打开已有的那块画布（创作首页最近项目、资产页画布卡）
  const openCanvasById = (id: string) => {
    setSelected({ kind: 'canvas', id });
    setSkill(undefined);
    setCanvasIntro(undefined);
    onNavigate('canvas');
  };
  // 直接进画布页没带画布（比如新 Tab 打开）：打开最近改过的那块
  const canvases = useDB((s) => s.canvases);
  const recentCanvas = canvases.reduce<string | undefined>((best, c) => (!best || c.updatedAt > (canvases.find((x) => x.id === best)?.updatedAt ?? 0) ? c.id : best), undefined);
  const canvasId = selected.kind === 'canvas' && selected.id ? selected.id : recentCanvas;
  // 画布全删了还进画布页：建一块，不留空白页（11-20 修 S-10）
  useEffect(() => {
    if (page === 'canvas' && !canvasId) setSelected({ kind: 'canvas', id: ensureCanvas() });
  }, [page, canvasId]);

  return (
    <>
      <Toaster />
      <Notifier />
      <PreviewHost />
      <FlowHost />
      {/* 画布页没有主站侧栏；侧栏藏起来不卸载，回来时收起状态、历史都还在 */}
      <div
        className="tpl-ms"
        // 右上角余额、头像按这一页内容的最大宽度对齐：对话页跟记录流，其他跟各页
        data-page={page === 'create' && selected.kind === 'chat' && selected.id ? 'chat' : page}
        style={page === 'canvas' ? { display: 'none' } : undefined}
      >
        <Sidebar
          page={page}
          onNavigate={navigate}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          selected={selected.id}
          onOpen={(kind, id) => {
            setSelected({ kind, id });
            setSkill(undefined);
            onNavigate(kind === 'canvas' ? 'canvas' : 'create');
          }}
        />
        {page === 'create' &&
          (selected.kind === 'chat' && selected.id ? (
            <CreatePage key={selected.id} chatId={selected.id} />
          ) : (
            <CreateHome
              initialMode={homeMode}
              // 提交后进新建的那个对话（侧栏里它排在最前）
              onSubmit={(chatId) => setSelected({ kind: 'chat', id: chatId })}
              onOpenCanvas={openCanvas}
              onOpenProject={openCanvasById}
              onUseSkill={(name) => openCanvas(undefined, name)}
              onExplore={(tab, keyword = '') => {
                setExploreTab(tab);
                setExploreKeyword(keyword);
                onNavigate('explore');
              }}
              onAllCanvases={() => {
                setAssetsEntry((e) => ({ key: e.key + 1, from: 'create' }));
                onNavigate('assets');
              }}
            />
          ))}
        {page === 'explore' && (
          <ExplorePage
            key={`${exploreTab}:${exploreKeyword}`}
            initialTab={exploreTab}
            initialKeyword={exploreKeyword}
            onUseSkill={(name) => openCanvas(undefined, name)}
            onOpenCanvas={openCanvasById}
          />
        )}
        {page === 'tools' && <ToolsPage account={<Wallet className="tpl-at__wallet" />} />}
        {page === 'assets' && (
          <AssetsPage
            key={assetsEntry.key}
            initialView={assetsEntry.from === 'create' ? 'canvases' : undefined}
            onBackOut={
              assetsEntry.from === 'create'
                ? () => {
                    setHomeMode('canvas');
                    onNavigate('create');
                  }
                : undefined
            }
            onOpenCanvas={openCanvasById}
          />
        )}
        {/* 公共的头：右上角余额和头像，每一页一样的位置（中线离顶 32，和侧栏 Logo 对齐），换页不动。AI 工具页的放进右栏顶上。
            创作页多一个素材库入口（11-23 原型，3.14 不做） */}
        {page !== 'tools' && <Wallet library={page === 'create' ? { open: libraryOpen, onToggle: () => setLibraryOpen((v) => !v) } : undefined} />}
        {page === 'create' && (
          <aside
            className="tpl-ms__library"
            data-open={libraryOpen || undefined}
            aria-label="素材库"
            aria-hidden={!libraryOpen || undefined}
            {...(libraryOpen ? {} : { inert: '' })}
          >
            <AssetLibrary
              className="tpl-ms__library-panel"
              onClose={() => setLibraryOpen(false)}
              use={{
                icon: 'ImagePlus',
                label: '加入参考',
                onUse: (a) => {
                  sendToReference({ type: a.media, src: a.media === 'video' ? (a.poster ?? a.src) : a.src, duration: a.duration });
                  toast.success('已加入参考');
                },
              }}
            />
          </aside>
        )}
      </div>
      {page === 'canvas' && canvasId && (
        <CanvasPage
          // 换画布整页重新挂载（视角、选中、Agent 对话都是那块画布自己的）
          key={canvasId}
          canvasId={canvasId}
          onCanvasChange={(id) => {
            setCanvasIntro(undefined);
            setSelected({ kind: 'canvas', id });
          }}
          skill={skill}
          intro={canvasIntro}
          onHome={() => navigate('create')}
        />
      )}
      <DemoPanel />
    </>
  );
}

/** 网站里的「UI 页面预览」：外框里切页，右上「新 Tab 打开」开当前这一页 */
export function UiPreview() {
  const [page, setPage] = useState<AppPage>('create');
  return (
    <TemplateFrame href={`/app/${page}`}>
      <KiviApp page={page} onNavigate={setPage} />
    </TemplateFrame>
  );
}

/** 单独一个 Tab：#/app/<页>，铺满窗口，没有网站的目录和顶栏 */
export default function KiviAppRoute() {
  const { page, id } = useParams();
  const go = useNavigate();
  useEffect(() => {
    const prev = document.title;
    document.title = 'KIVI';
    return () => {
      document.title = prev;
    };
  }, []);
  if (!PAGES.includes(page as AppPage)) return <Navigate to="/app/create" replace />;
  return (
    <div className="tpl-app">
      <KiviApp
        page={page as AppPage}
        onNavigate={(next) => go(`/app/${next}`)}
        routeId={id}
        onSelectedChange={(sel) => {
          const want = sel ? `/app/${page}/${sel}` : `/app/${page}`;
          if (location.hash.slice(1) !== want) go(want, { replace: true });
        }}
      />
    </div>
  );
}
