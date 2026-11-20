import { useMemo, useState, type MouseEvent } from 'react';
import {
  Divider,
  Dropdown,
  EmptyState,
  Input,
  Masonry,
  Menu,
  MenuItem,
  MenuLabel,
  Select,
  Skeleton,
  TabItem,
  WorkCard,
} from '@kivi';
import { CATS, DISCOVER_CATEGORIES, RATIO, WORKS, type Work } from '../../data/catalog';
import { setLiked, toggleFavorite, useFavorites, useLikes } from '../../data/favorites';
import { attempt } from '../../flows/errors';
import { copyImage } from '../../flows/files';
import { FolderSubMenu } from '../../parts/folder-menu';
import { addWorkToReference, downloadWork, saveWorkToFolder } from './work-actions';
import { useDebounced } from '../../hooks/useDebounced';
import { usePaged, type MoreRef } from '../../hooks/usePaged';
import { CategoryTabs, WORK_COLUMNS } from './shared';
import { WorkViewer } from './WorkViewer';

/*
  探索 · 发现：瀑布流，点作品铺满窗口看详情（WorkViewer，照线上 CardDetailModal），右键出菜单。
  第一行是大类、小类筛选、我收藏的、搜索（需求「发现页」）；搜索停 0.5 秒再搜，滚到底出骨架再加载下一屏。
  收藏存在 db.favorites；点赞在 data/favorites.ts（不存本机，和创作首页同步）。
*/

const WORK_PAGE = 20;

export function Discover({ moreRef, initialKeyword = '' }: { moreRef: MoreRef; initialKeyword?: string }) {
  const [category, setCategory] = useState('all');
  const [subs, setSubs] = useState<string[]>([]);
  const [onlyCollected, setOnlyCollected] = useState(false);
  const [keyword, setKeyword] = useState(initialKeyword);
  const k = useDebounced(keyword.trim());
  // 收藏在 db.favorites，先变后请求，失败退回
  const collected = useFavorites();
  // 点赞创作首页和探索页共用一份（data/favorites.ts）
  const liked = useLikes();
  const [detail, setDetail] = useState<Work | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; work: Work } | null>(null);

  const list = useMemo(
    () =>
      WORKS.filter(
        (w) =>
          (category === 'all' || w.category === category) &&
          (!subs.length || subs.includes(w.sub)) &&
          (!onlyCollected || collected.includes(w.id)) &&
          (!k || w.prompt.includes(k) || w.author.name.includes(k) || w.model.includes(k)),
      ),
    // 只看收藏时，取消收藏会立刻从列表里拿掉
    [category, subs, onlyCollected, collected, k],
  );
  const { count, loading, done } = usePaged(list.length, WORK_PAGE, `${category}|${subs.join()}|${onlyCollected}|${k}`, moreRef);
  const shown = list.slice(0, count);
  const skeletons = loading ? 10 : 0; // 加载下一屏的骨架：两排（一排 5 列）

  const collect = (id: string, on: boolean) => void attempt(() => toggleFavorite(id, on));
  const likesOf = (w: Work) => w.likes + (liked.includes(w.id) ? 1 : 0);
  // 小类：当前大类下的；「全部」时按大类分组列出
  const subGroups = category === 'all' ? CATS : [category];

  return (
    <>
      {/* 第一行：大类、小类筛选、我收藏的、搜索（需求「发现页」：去掉最新 / 热门，一套内容流） */}
      <div className="tpl-as__filters">
        <CategoryTabs
          label="素材分类"
          value={category}
          options={CATS}
          onChange={(v) => {
            setCategory(v);
            setSubs([]);
          }}
        />
        <Divider orientation="vertical" />
        <Dropdown
          haspopup="menu"
          closeOnSelect={false}
          trigger={
            <Select variant="plain" leftIcon="Configuration" aria-label="筛选小类">
              {subs.length ? `筛选 · ${subs.length}` : '筛选'}
            </Select>
          }
        >
          <Menu aria-label="筛选小类">
            {subGroups.map((c, gi) => (
              <div key={c} role="group" aria-label={c}>
                {gi > 0 && <Divider />}
                {category === 'all' && <MenuLabel>{c}</MenuLabel>}
                {DISCOVER_CATEGORIES[c].map((s) => (
                  <MenuItem key={s} checked={subs.includes(s)} onClick={() => setSubs((all) => (all.includes(s) ? all.filter((x) => x !== s) : [...all, s]))}>
                    {s}
                  </MenuItem>
                ))}
              </div>
            ))}
          </Menu>
        </Dropdown>
        <TabItem
          icon={onlyCollected ? 'CollectSolid' : 'Collect'}
          selected={onlyCollected}
          role="checkbox"
          aria-selected={undefined}
          aria-checked={onlyCollected}
          data-collected={onlyCollected || undefined}
          onClick={() => setOnlyCollected(!onlyCollected)}
        >
          我收藏的
        </TabItem>
        <Input leftIcon="Search" clearable placeholder="搜索提示词、模型、作者" aria-label="搜索作品" className="tpl-as__search" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      {list.length === 0 ? (
        onlyCollected && category === 'all' && !subs.length && !k ? (
          <EmptyState type="favorite" size={160} title="暂无收藏" description="在作品上点收藏，就会出现在这里" className="tpl-as__empty" />
        ) : (
          <EmptyState size={160} title="没有搜索到符合条件的内容" className="tpl-as__empty" />
        )
      ) : (
        <Masonry columns={WORK_COLUMNS} gap={2} ratios={[...shown.map((w) => RATIO[w.ratio]), ...Array.from({ length: skeletons }, (_, i) => (i % 2 ? 1 : 3 / 4))]}>
          {shown.map((w) => (
            <WorkCard
              key={w.id}
              type={w.video ? 'video' : 'image'}
              src={w.src}
              poster={w.poster}
              ratio={w.ratio}
              title={w.prompt}
              author={w.author}
              likes={likesOf(w)}
              liked={liked.includes(w.id)}
              onLikedChange={(v) => setLiked(w.id, v)}
              collected={collected.includes(w.id)}
              onCollectedChange={(v) => collect(w.id, v)}
              onDownload={() => downloadWork(w)}
              onOpen={() => setDetail(w)}
              onContextMenu={(e: MouseEvent) => {
                e.preventDefault();
                setMenu({ x: e.clientX, y: e.clientY, work: w });
              }}
            />
          ))}
          {Array.from({ length: skeletons }, (_, i) => (
            <Skeleton key={`s${i}`} style={{ width: '100%', aspectRatio: i % 2 ? '1 / 1' : '3 / 4' }} />
          ))}
        </Masonry>
      )}
      {!loading && done && shown.length > 0 && <p className="tpl-ex__end">没有更多内容了</p>}

      {/* 右键菜单：复制、下载、收藏、添加到参考图、添加到文件夹（需求「发现页」）。11-20 用户定都做成真的：复制只给图片 */}
      <Dropdown anchorPoint={menu ?? undefined} open={menu !== null} onOpenChange={(v) => !v && setMenu(null)}>
        <Menu aria-label="作品操作">
          {menu && !menu.work.video && (
            <MenuItem icon="Copy" onClick={() => void copyImage(menu.work.src)}>
              复制
            </MenuItem>
          )}
          <MenuItem icon="Download" onClick={() => menu && downloadWork(menu.work)}>
            下载
          </MenuItem>
          {menu && (
            <MenuItem
              icon={collected.includes(menu.work.id) ? 'CollectSolid' : 'Collect'}
              data-collected={collected.includes(menu.work.id) || undefined}
              onClick={() => collect(menu.work.id, !collected.includes(menu.work.id))}
            >
              {collected.includes(menu.work.id) ? '取消收藏' : '收藏'}
            </MenuItem>
          )}
          <Divider />
          <MenuItem icon="ImagePlus" onClick={() => menu && addWorkToReference(menu.work)}>
            添加到参考图
          </MenuItem>
          <FolderSubMenu label="添加到文件夹" onPick={(f) => menu && saveWorkToFolder(menu.work, f)} />
        </Menu>
      </Dropdown>

      {/* 详情：作品大图（WorkViewer，创作首页也用它） */}
      <WorkViewer work={detail} onClose={() => setDetail(null)} />
    </>
  );
}
