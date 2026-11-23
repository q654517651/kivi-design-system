import { useMemo, useState, type MouseEvent } from 'react';
import {
  Button,
  Divider,
  Dropdown,
  EmptyState,
  FolderCard,
  IconButton,
  Loading,
  Menu,
  MenuItem,
  ResultTile,
  ScrollArea,
  Skeleton,
  TabItem,
  Tabs,
  placeholderImageSrc,
  type IconName,
} from '@kivi';
import { removeAssets } from '../../data/assets';
import { byId, useDB } from '../../data/db';
import type { Asset, Media } from '../../data/types';
import { confirmDelete } from '../../flows/delete';
import { useBriefLoading } from '../../hooks/useBriefLoading';
import { usePaged } from '../../hooks/usePaged';
import { MediaViewer, ViewerAuthor, useLastShown, type ViewerMedia } from '../media-viewer';
import { AssetInfo } from '../asset-info';
import { AudioCell, activateProps } from '../asset-cell';
import { GROUPS, groupOf, timeOf } from '../../pages/assets/assetCells';
import { collectAssets } from '../../pages/assets/ops';
import './asset-library.css';

/*
  素材库（11-23 原型，照即梦「全部资产」侧栏）：一个入口看所有生成历史和我的文件夹，挑一个直接用。
  ⚠️ 3.14 版本不做：这是原型，先看效果，线上 3.14 不排这个功能。
  - 主站：右上角余额左边「素材库」图标，点了对话页右侧推出一栏（App 里的 tpl-ms__library）；用 = 加入参考。
  - 画布：左边画布工具栏最后一个，点了在工具栏右边浮一张大卡（上下让出左上角画布切换和左下角视图工具栏）；用 = 应用到画布。
  内容两边一样：生成历史（全部 / 图片 / 视频 / 音频，按今天 / 昨天 / 更早分组，滚到底加载下一屏）、我的文件夹（点进去看里面的素材）。
  格子：点了看大图，悬停右上角「用」的按钮和收藏，右键同样几项 + 删除。
*/

type Kind = 'all' | Media;
const KINDS: { value: Kind; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'audio', label: '音频' },
];
/** 一屏 6 行 × 3 */
const PAGE = 18;
const COVER_MAX = 4;

export interface AssetLibraryProps {
  /** 格子上「用」的那个动作：主站加入参考、画布应用到画布 */
  use: { icon: IconName; label: string; onUse: (asset: Asset) => void };
  onClose: () => void;
  className?: string;
}

export function AssetLibrary({ use, onClose, className }: AssetLibraryProps) {
  const assets = useDB((s) => s.assets);
  const folders = useDB((s) => s.folders);
  const [tab, setTab] = useState<'history' | 'folders'>('history');
  const [kind, setKind] = useState<Kind>('all');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; item: Asset } | null>(null);

  const folder = folderId ? folders.find((f) => f.id === folderId) : undefined;
  const sorted = useMemo(() => [...assets].sort((a, b) => b.createdAt - a.createdAt), [assets]);
  // 生成历史：所有生成的（不含上传）；文件夹里：那个文件夹的全部
  const base = useMemo(
    () => (folder ? sorted.filter((a) => a.folderIds.includes(folder.id)) : sorted.filter((a) => a.source !== 'upload')),
    [sorted, folder],
  );
  const list = useMemo(() => base.filter((a) => kind === 'all' || a.media === kind), [base, kind]);
  const showGrid = tab === 'history' || !!folder;

  const key = `${tab}|${folderId}|${kind}`;
  const loading = useBriefLoading(key);
  const more = useMemo(() => ({ current: undefined as (() => void) | undefined }), []);
  const { count, loading: paging } = usePaged(list.length, PAGE, key, more);
  const shown = list.slice(0, count);

  // 文件夹卡：数量、封面由素材算（音频没有封面图）
  const folderCards = useMemo(
    () =>
      folders.map((f) => {
        const inside = sorted.filter((a) => a.folderIds.includes(f.id));
        return { id: f.id, name: f.name, count: inside.length, covers: inside.filter((a) => a.media !== 'audio').slice(0, COVER_MAX).map((a) => a.poster ?? a.src) };
      }),
    [folders, sorted],
  );

  // 大图：上下切的是当前列表
  const viewIndex = list.findIndex((a) => a.id === viewId);
  const view = viewIndex >= 0 ? list[viewIndex] : null;
  const shownView = useLastShown(view);
  const viewCollected = shownView ? (byId(assets, shownView.id)?.collected ?? false) : false;
  const toMedia = (a: Asset): ViewerMedia => ({ type: a.media, src: a.src, poster: a.media === 'video' ? a.poster : undefined, alt: a.name ?? '', name: a.name });

  const apply = (a: Asset) => {
    setViewId(null);
    use.onUse(a);
  };
  const remove = (a: Asset) => {
    const next = list[viewIndex + 1] ?? list[viewIndex - 1];
    void confirmDelete(async () => {
      if (viewId === a.id) setViewId(next?.id ?? null);
      await removeAssets([a.id]);
    });
  };
  const openMenu = (e: MouseEvent, item: Asset) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, item });
  };
  const actions = (a: Asset) => [{ icon: use.icon, label: use.label, onClick: () => apply(a) }];

  const cell = (a: Asset) =>
    a.media === 'audio' ? (
      <AudioCell
        key={a.id}
        name={a.name}
        duration={a.duration}
        onOpen={() => setViewId(a.id)}
        onContextMenu={(e) => openMenu(e, a)}
        topActions={actions(a)}
        collect
        collected={a.collected}
        onCollectedChange={(v) => void collectAssets([a.id], v)}
      />
    ) : (
      <ResultTile
        key={a.id}
        style={{ cursor: 'zoom-in' }}
        onClick={(e) => !(e.target as HTMLElement).closest('button') && setViewId(a.id)}
        {...activateProps(() => setViewId(a.id))}
        onPreview={a.media === 'video' ? () => setViewId(a.id) : undefined}
        onContextMenu={(e: MouseEvent) => openMenu(e, a)}
        title={a.name}
        type={a.media === 'video' ? 'video' : undefined}
        src={a.src}
        poster={a.media === 'video' ? a.poster : undefined}
        topActions={actions(a)}
        collect
        collected={a.collected}
        onCollectedChange={(v) => void collectAssets([a.id], v)}
      />
    );

  const grid = (
    <>
      {!loading && list.length === 0 ? (
        <EmptyState type="empty" size={96} title={folder ? '文件夹里还没有素材' : '暂无生成历史'} className="tpl-lib__empty" />
      ) : (
        <ScrollArea className="tpl-lib__list" onReachEnd={() => more.current?.()}>
          {loading ? (
            <div className="tpl-lib__grid" aria-busy>
              {Array.from({ length: 9 }, (_, i) => (
                <Skeleton key={i} style={{ width: '100%', aspectRatio: '1 / 1' }} />
              ))}
            </div>
          ) : folder ? (
            <div className="tpl-lib__grid">{shown.map(cell)}</div>
          ) : (
            <>
              {GROUPS.map((g) => {
                const items = shown.filter((a) => groupOf(a.createdAt) === g);
                if (!items.length) return null;
                return (
                  <section key={g} className="tpl-lib__day" aria-label={`${g}的历史`}>
                    <h3>{g}</h3>
                    <div className="tpl-lib__grid">{items.map(cell)}</div>
                  </section>
                );
              })}
              {paging && <Loading className="tpl-as__more">加载中</Loading>}
            </>
          )}
        </ScrollArea>
      )}
    </>
  );

  return (
    <div
      className={className}
      // 焦点在素材库里按 Esc 关掉（菜单、大图自己先吃掉 Esc）
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !e.defaultPrevented) onClose();
      }}
    >
      <div className="tpl-lib">
        <header className="tpl-lib__head">
          <Tabs
            value={tab}
            onChange={(v) => {
              setTab(v as 'history' | 'folders');
              setFolderId(null);
              setKind('all');
            }}
            aria-label="素材库"
          >
            <TabItem value="history">生成历史</TabItem>
            <TabItem value="folders">我的文件夹</TabItem>
          </Tabs>
          <IconButton icon="Close" label="关闭素材库" variant="ghost-muted" size={32} onClick={onClose} />
        </header>

        {folder && (
          <div className="tpl-lib__crumb">
            <Button variant="ghost" size={32} leftIcon="LeftArrow" aria-label={`${folder.name}，返回`} onClick={() => setFolderId(null)}>
              {folder.name}
            </Button>
          </div>
        )}

        {showGrid && (
          <Tabs size={32} value={kind} onChange={(v) => setKind(v as Kind)} aria-label="素材类型" className="tpl-lib__kinds">
            {KINDS.map((k) => (
              <TabItem key={k.value} value={k.value}>
                {k.label}
              </TabItem>
            ))}
          </Tabs>
        )}

        {showGrid ? (
          grid
        ) : folderCards.length === 0 ? (
          <EmptyState type="empty" size={96} title="还没有文件夹" className="tpl-lib__empty" />
        ) : (
          <ScrollArea className="tpl-lib__list">
            <div className="tpl-lib__folders">
              {folderCards.map((f) => (
                <FolderCard key={f.id} name={f.name} count={f.count} covers={f.covers} onOpen={() => setFolderId(f.id)} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <Dropdown anchorPoint={menu ?? undefined} open={menu !== null} onOpenChange={(v) => !v && setMenu(null)}>
        <Menu aria-label="素材操作">
          <MenuItem icon={use.icon} onClick={() => menu && apply(menu.item)}>
            {use.label}
          </MenuItem>
          <MenuItem icon={menu?.item.collected ? 'CollectSolid' : 'Collect'} onClick={() => menu && void collectAssets([menu.item.id], !menu.item.collected)}>
            {menu?.item.collected ? '取消收藏' : '收藏'}
          </MenuItem>
          <Divider />
          <MenuItem variant="danger" icon="Delete" onClick={() => menu && remove(menu.item)}>
            删除
          </MenuItem>
        </Menu>
      </Dropdown>

      <MediaViewer
        media={view && toMedia(view)}
        onClose={() => setViewId(null)}
        group={list.map(toMedia)}
        index={Math.max(viewIndex, 0)}
        onIndexChange={(i) => setViewId(list[i]?.id ?? null)}
        head={shownView && <ViewerAuthor name="KIVI" avatar={placeholderImageSrc('ip-peek', '1:1')} date={`${groupOf(shownView.createdAt)} ${timeOf(shownView.createdAt)}`} />}
        actions={
          shownView && (
            <>
              <IconButton icon={use.icon} label={use.label} variant="secondary" size={36} onClick={() => apply(shownView)} />
              <IconButton icon="Delete" label="删除" variant="secondary" size={36} onClick={() => remove(shownView)} />
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
        {shownView && <AssetInfo asset={shownView} onPick={setViewId} pickable={(id) => list.some((a) => a.id === id)} />}
      </MediaViewer>
    </div>
  );
}
