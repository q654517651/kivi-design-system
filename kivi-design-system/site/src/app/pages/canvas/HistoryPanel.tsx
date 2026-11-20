import { useMemo, useState, type MouseEvent } from 'react';
import {
  DateRangeFilter,
  Dialog,
  Divider,
  Dropdown,
  EmptyState,
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
  toast,
  type DateRange,
} from '@kivi';
import { removeAssets } from '../../data/assets';
import { byId, useDB } from '../../data/db';
import type { Asset, Media } from '../../data/types';
import { confirmDelete } from '../../flows/delete';
import { useBriefLoading } from '../../hooks/useBriefLoading';
import { usePaged } from '../../hooks/usePaged';
import { MediaViewer, ViewerAuthor, useLastShown, type ViewerMedia } from '../../parts/media-viewer';
import { AssetInfo } from '../../parts/asset-info';
import { AudioCell, activateProps } from '../../parts/asset-cell';
import { GROUPS, groupOf, startOfDay, timeOf } from '../assets/assetCells';
import { collectAssets } from '../assets/ops';

/*
  画布底部「历史」（照线上 left-toolbar/history-panel「历史资产」）：工作区里所有画布生成过的素材。
  - 图片 / 视频 / 音频（带数量）、收藏、时间筛选；按今天 / 昨天 / 更早分组，一行 7 格，滚到底加载下一屏。
  - 格子悬停：右上「应用到画布」「删除」和收藏；点格子看大图（大图里也能应用、删除、收藏）；右键同样几项。
  - 应用到画布：在视口中心建一个素材节点（上传语义，不带生成参数）并选中，Toast「已应用到画布」，弹窗关上。
*/

const TYPES: { value: Media; label: string; empty: string }[] = [
  { value: 'image', label: '图片', empty: '暂无图片历史，开始在画布上创作吧' },
  { value: 'video', label: '视频', empty: '暂无视频历史，开始在画布上创作吧' },
  { value: 'audio', label: '音频', empty: '暂无音频历史，开始在画布上创作吧' },
];
/** 一屏 4 行 × 7 */
const PAGE = 28;

export interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  /** 应用到画布 */
  onApply: (asset: Asset) => void;
}

export function HistoryPanel({ open, onClose, onApply }: HistoryPanelProps) {
  const assets = useDB((s) => s.assets);
  const [type, setType] = useState<Media>('image');
  const [onlyCollected, setOnlyCollected] = useState(false);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [viewId, setViewId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; item: Asset; placement?: 'top-end' } | null>(null);

  // 画布里生成的（线上按工作区聚合，所有画布的都在），新的在前
  const all = useMemo(() => assets.filter((a) => a.source === 'canvas').sort((a, b) => b.createdAt - a.createdAt), [assets]);
  const inRange = (a: Asset) => {
    const day = startOfDay(a.createdAt);
    return (!range.start || day >= range.start.getTime()) && (!range.end || day <= range.end.getTime()) && (!onlyCollected || a.collected);
  };
  const totals = Object.fromEntries(TYPES.map((t) => [t.value, all.filter((a) => a.media === t.value && inRange(a)).length])) as Record<Media, number>;
  const list = all.filter((a) => a.media === type && inRange(a));

  const key = `${open}|${type}|${onlyCollected}|${range.start?.getTime()}|${range.end?.getTime()}`;
  const loading = useBriefLoading(key);
  const more = useMemo(() => ({ current: undefined as (() => void) | undefined }), []);
  const { count, loading: paging } = usePaged(list.length, PAGE, key, more);
  const shown = list.slice(0, count);

  // 大图：上下切的是当前列表
  const viewIndex = list.findIndex((a) => a.id === viewId);
  const view = viewIndex >= 0 ? list[viewIndex] : null;
  const shownView = useLastShown(view);
  const viewCollected = shownView ? (byId(assets, shownView.id)?.collected ?? false) : false;
  const toMedia = (a: Asset): ViewerMedia => ({ type: a.media, src: a.src, poster: a.media === 'video' ? a.poster : undefined, alt: a.name ?? '', name: a.name });

  const apply = (a: Asset) => {
    setViewId(null);
    onApply(a);
    toast.success('已应用到画布');
    onClose();
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

  const cell = (a: Asset) =>
    a.media === 'audio' ? (
      <AudioCell
        key={a.id}
        name={a.name}
        duration={a.duration}
        onOpen={() => setViewId(a.id)}
        onContextMenu={(e) => openMenu(e, a)}
        topActions={[
          { icon: 'AddToCanvas', label: '应用到画布', onClick: () => apply(a) },
          { icon: 'Delete', label: '删除', onClick: () => remove(a) },
        ]}
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
        topActions={[
          { icon: 'AddToCanvas', label: '应用到画布', onClick: () => apply(a) },
          { icon: 'Delete', label: '删除', onClick: () => remove(a) },
        ]}
        collect
        collected={a.collected}
        onCollectedChange={(v) => void collectAssets([a.id], v)}
      />
    );

  return (
    <>
      <Dialog size={1200} title="历史资产" open={open} onOpenChange={(v) => !v && onClose()}>
        <div className="tpl-cv-history">
          <div className="tpl-cv-history__bar">
            <Tabs value={type} onChange={(v) => setType(v as Media)} aria-label="历史类型">
              {TYPES.map((t) => (
                <TabItem key={t.value} value={t.value}>
                  {`${t.label}(${totals[t.value]})`}
                </TabItem>
              ))}
            </Tabs>
            <TabItem
              className="tpl-as__collect"
              icon={onlyCollected ? 'CollectSolid' : 'Collect'}
              selected={onlyCollected}
              role="checkbox"
              aria-selected={undefined}
              aria-checked={onlyCollected}
              data-collected={onlyCollected || undefined}
              onClick={() => setOnlyCollected(!onlyCollected)}
            >
              收藏
            </TabItem>
            <DateRangeFilter className="tpl-cv-history__time" value={range} onChange={setRange} placeholder="全部" aria-label="历史时间" />
          </div>
          {!loading && list.length === 0 ? (
            <EmptyState
              type={onlyCollected ? 'favorite' : 'empty'}
              size={160}
              title={onlyCollected ? '暂无收藏，快去收藏喜欢的资产吧' : TYPES.find((t) => t.value === type)!.empty}
              className="tpl-cv-history__empty"
            />
          ) : (
            <ScrollArea className="tpl-cv-history__list" onReachEnd={() => more.current?.()}>
              {loading ? (
                <div className="tpl-cv-history__grid" aria-busy>
                  {Array.from({ length: 14 }, (_, i) => (
                    <Skeleton key={i} style={{ width: '100%', aspectRatio: '1 / 1' }} />
                  ))}
                </div>
              ) : (
                <>
                  {GROUPS.map((g) => {
                    const items = shown.filter((a) => groupOf(a.createdAt) === g);
                    if (!items.length) return null;
                    return (
                      <section key={g} className="tpl-cv-history__day" aria-label={`${g}的历史`}>
                        <h3>{g}</h3>
                        <div className="tpl-cv-history__grid">{items.map(cell)}</div>
                      </section>
                    );
                  })}
                  {paging && <Loading className="tpl-as__more">加载中</Loading>}
                </>
              )}
            </ScrollArea>
          )}
        </div>
      </Dialog>

      <Dropdown anchorPoint={menu ?? undefined} placement={menu?.placement} open={menu !== null} onOpenChange={(v) => !v && setMenu(null)}>
        <Menu aria-label="历史素材操作">
          <MenuItem onClick={() => menu && apply(menu.item)}>应用到画布</MenuItem>
          <MenuItem onClick={() => menu && void collectAssets([menu.item.id], !menu.item.collected)}>{menu?.item.collected ? '取消收藏' : '收藏'}</MenuItem>
          <Divider />
          <MenuItem variant="danger" onClick={() => menu && remove(menu.item)}>
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
              <IconButton icon="AddToCanvas" label="应用到画布" variant="secondary" size={36} onClick={() => apply(shownView)} />
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
    </>
  );
}
