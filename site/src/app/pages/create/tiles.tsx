import type { Task } from '../../data/types';
import type { MouseEvent, ReactNode } from 'react';
import { ResultTile, type PlaceholderImageRatio, type ResultTileAction, type ResultTileStatus } from '@kivi';
import { TOOLS, toolOf, type ToolId } from '../../data/tools';
import { downloadMedia } from '../../flows/files';

/*
  记录里的一格结果（ResultTile）和它用到的类型。
  生成记录、Agent 一轮里的格子都用它；点什么做什么（看大图、加入参考、开工具、收藏、删除）由页面通过 TileContext 传进来，这里只管画。
*/

// 结果格悬停出的右上操作：删除、下载（11-20 下载做成真的，下这一格的素材）
const TOP_ICONS: { icon: 'Delete' | 'Download'; label: string }[] = [
  { icon: 'Delete', label: '删除' },
  { icon: 'Download', label: '下载' },
];
// 右下快捷操作（11-11 用户定）：加入参考 + 两个常用工具 + 更多（其余工具）。点工具开那个工具的弹窗
const QUICK_TOOLS: Record<'image' | 'video', ToolId[]> = { image: ['cutout', 'hd'], video: ['video-cutout', 'video-hd'] };
export const moreTools = (media: 'image' | 'video') => TOOLS.filter((t) => t.media === media && !QUICK_TOOLS[media].includes(t.id));

/** 看大图时信息栏里放的：提示词和参数标签 */
export interface ViewerInfo {
  prompt?: string;
  tags?: ReactNode;
}

/** 一格结果：工具弹窗、加入参考、右键菜单、看大图都用它 */
export interface TileRef {
  key: string;
  media: 'image' | 'video' | 'audio';
  /** 图片、视频或音频地址，生成中没有素材的是空 */
  src: string;
  /** 视频封面 */
  poster?: string;
  ratio: PlaceholderImageRatio;
  info: ViewerInfo;
  /** 对应的素材（收藏、删除用）；Agent 那一轮写死的格子没有 */
  assetId?: string;
  /** 来自哪个任务、第几格（失败的格子没有素材，删除靠它） */
  taskId?: string;
  index?: number;
}

/** 页面传给每一格的操作 */
export interface TileContext {
  /** 页面里临时删掉的格子（Agent 那一轮写死的格子用） */
  removed: string[];
  view: (t: TileRef) => void;
  addRef: (t: TileRef) => void;
  openTool: (id: ToolId, t: TileRef) => void;
  openMore: (t: TileRef, at: { x: number; y: number }) => void;
  openMenu: (t: TileRef, at: { x: number; y: number }) => void;
  remove: (t: TileRef) => void;
  collect: (t: TileRef, collected: boolean) => void;
  /** 记录下面那排按钮：重新编辑（参数填回输入框）、再次生成（原参数直接提交）、删除整组 */
  record: {
    edit: (task: Task) => void;
    rerun: (task: Task) => Promise<unknown>;
    remove: (task: Task) => void;
  };
}

export interface RecordTileProps {
  tile: TileRef;
  ctx: TileContext;
  status?: ResultTileStatus;
  badge?: string;
  /** 网格里占几列 */
  span: number;
  collected?: boolean;
  defaultCollected?: boolean;
}

export function RecordTile({ tile, ctx, status, badge, span, collected, defaultCollected }: RecordTileProps) {
  if (ctx.removed.includes(tile.key)) return null;
  const done = !status || status === 'done';
  const video = tile.media === 'video';
  const audio = tile.media === 'audio';
  const hasMedia = tile.src !== '';
  // 音频没有工具、没有大图，快捷操作不放（加入参考在右键菜单里）
  const quick: ResultTileAction[] = audio ? [] : [
    { icon: 'ImagePlus', label: '加入参考', onClick: () => ctx.addRef(tile) },
    ...QUICK_TOOLS[tile.media as 'image' | 'video'].map((id) => ({ icon: toolOf(id).icon, label: toolOf(id).name, onClick: () => ctx.openTool(id, tile) })),
    {
      icon: 'More',
      label: '更多',
      onClick: (e: MouseEvent<HTMLButtonElement>) => {
        const b = e.currentTarget.getBoundingClientRect();
        ctx.openMore(tile, { x: b.right, y: b.top - 4 });
      },
    },
  ];
  const topActions: ResultTileAction[] = TOP_ICONS.map((a) =>
    a.icon === 'Delete' ? { ...a, onClick: () => ctx.remove(tile) } : { ...a, onClick: () => hasMedia && void downloadMedia([{ src: tile.src }]) },
  );
  return (
    <ResultTile
      type={video ? 'video' : audio ? 'audio' : undefined}
      status={status}
      src={hasMedia ? tile.src : undefined}
      poster={video && hasMedia ? tile.poster : undefined}
      badge={badge}
      topActions={topActions}
      collect={done || undefined}
      collected={collected}
      defaultCollected={defaultCollected}
      onCollectedChange={done ? (v) => ctx.collect(tile, v) : undefined}
      quickActions={done && quick.length ? quick : undefined}
      data-span={span > 1 ? String(span) : undefined}
      // 音频一律 4:3（同画布音频节点，11-19 用户定）
      style={{ aspectRatio: audio ? '4 / 3' : tile.ratio.replace(':', ' / '), cursor: done && !video && !audio ? 'zoom-in' : undefined }}
      // 点格子空白处看大图（视频点右下「预览」）；点的是格子里的按钮就不打开
      onClick={done && !video && !audio ? (e: MouseEvent) => !(e.target as HTMLElement).closest('button, video') && ctx.view(tile) : undefined}
      onPreview={done && video ? () => ctx.view(tile) : undefined}
      onContextMenu={
        done
          ? (e: MouseEvent) => {
              e.preventDefault();
              ctx.openMenu(tile, { x: e.clientX, y: e.clientY });
            }
          : undefined
      }
    />
  );
}
