import { useRef, useState, type ReactNode } from 'react';
import { Dropdown, EmptyState, IconButton, Menu, MenuItem, ResultTile, ScrollArea } from '@kivi';
import { countdownLabel, useNow } from '../../data/tasks';
import { TOOLS, toolOf, type Media, type ToolId } from '../../data/tools';
import { activateProps } from '../../parts/asset-cell';
import { downloadMedia } from '../../flows/files';
import { useFlip } from '../../hooks/useFlip';
import type { HistoryItem } from './history';

/*
  右栏通到顶：上面是余额和头像（11-17 用户定，从公共的头并进来），下面是历史（按工具筛选、右键菜单）。
  - 生成中、结果、失败都只在这里（舞台只用来提交任务，11-19 用户定）；结果不会自己回到舞台，右键「加入当前工具」换掉当前工具的原图。新任务加在最上面：它淡入，下面的往下顶（useFlip）。
  - 看大图：完成的图片点格子；图片、视频悬停右上角都有「查看大图」（视频的播放器全屏也是）。
*/

export interface ToolsHistoryProps {
  /** 右栏顶上的余额和头像（外壳传进来） */
  account?: ReactNode;
  items: HistoryItem[];
  /** 当前工具的类型：只有同类型的能「加入当前工具」 */
  media: Media;
  onPreview: (item: HistoryItem) => void;
  /** 右键「加入当前工具」：换掉当前工具的原图 */
  onUseInTool: (item: HistoryItem) => void;
  onRemove: (item: HistoryItem) => void;
}

export function ToolsHistory({ account, items, media, onPreview, onUseInTool, onRemove }: ToolsHistoryProps) {
  const [filter, setFilter] = useState<ToolId | 'all'>('all');
  const shown = filter === 'all' ? items : items.filter((r) => r.tool === filter);
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const menuOf = menu ? items.find((r) => r.id === menu.id) ?? null : null;
  const now = useNow(items.some((r) => r.status === 'generating'));
  const listRef = useRef<HTMLElement>(null);
  useFlip(listRef, shown.map((r) => r.id), filter);

  return (
    <div className="tpl-at__side">
      {account}
      <ScrollArea className="tpl-at__history">
        <aside ref={listRef} className="tpl-at__history-body" aria-label="历史记录">
          <div className="tpl-at__history-head">
            <span className="tpl-at__history-title">历史记录</span>
            <Dropdown
              haspopup="listbox"
              placement="bottom-end"
              // 筛选只放图标（11-11 用户定），无底灰（11-18 用户要灰的），筛了某个工具时按钮留选中底色
              trigger={<IconButton icon="Filter" label="按工具筛选" variant="ghost-muted" size={28} selected={filter !== 'all'} />}
            >
              <Menu role="listbox" aria-label="按工具筛选">
                <MenuItem selected={filter === 'all'} onClick={() => setFilter('all')}>
                  全部工具
                </MenuItem>
                {TOOLS.map((t) => (
                  <MenuItem key={t.id} icon={t.icon} selected={filter === t.id} onClick={() => setFilter(t.id)}>
                    {t.name}
                  </MenuItem>
                ))}
              </Menu>
            </Dropdown>
          </div>
          {shown.length === 0 && (
            // 空的时候右栏正中放一个历史图标（窄栏放 IP 不合适，11-18 用户定），不写说明
            <EmptyState className="tpl-at__history-empty" size={96} icon="History" title={filter === 'all' ? '暂无历史记录' : `暂无${toolOf(filter).name}记录`} />
          )}
          {shown.map((r) => {
            const done = r.status === 'done';
            return (
              <figure
                key={r.id}
                data-flip-key={r.id}
                className="tpl-at__record"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({ x: e.clientX, y: e.clientY, id: r.id });
                }}
              >
                <ResultTile
                  type={r.media}
                  status={r.status}
                  src={r.src}
                  poster={r.poster}
                  badge={r.status === 'generating' ? countdownLabel(r.task, now) : undefined}
                  topActions={
                    done
                      ? [
                          { icon: 'FullScreen', label: '查看大图', onClick: () => onPreview(r) },
                          { icon: 'Download', label: '下载', onClick: () => void downloadMedia([{ src: r.src }]) },
                        ]
                      : undefined
                  }
                  style={{ aspectRatio: '1 / 1', cursor: done && r.media === 'image' ? 'zoom-in' : undefined }}
                  onClick={done && r.media === 'image' ? (e) => !(e.target as HTMLElement).closest('button') && onPreview(r) : undefined}
                  onPreview={done ? () => onPreview(r) : undefined}
                  {...activateProps(done ? () => onPreview(r) : undefined)}
                />
              </figure>
            );
          })}
        </aside>
      </ScrollArea>

      {/* 历史的右键菜单 */}
      <Dropdown anchorPoint={menu ?? undefined} open={menu !== null} onOpenChange={(v) => !v && setMenu(null)}>
        <Menu aria-label="历史操作">
          <MenuItem icon="Add" disabled={!menuOf || menuOf.status !== 'done' || menuOf.media !== media} onClick={() => menuOf && onUseInTool(menuOf)}>
            加入当前工具
          </MenuItem>
          <MenuItem icon="Download" disabled={menuOf?.status !== 'done'} onClick={() => menuOf?.src && void downloadMedia([{ src: menuOf.src }])}>
            下载
          </MenuItem>
          <MenuItem variant="danger" icon="Delete" disabled={!menuOf || menuOf.status === 'generating'} onClick={() => menuOf && onRemove(menuOf)}>
            删除
          </MenuItem>
        </Menu>
      </Dropdown>
    </div>
  );
}
