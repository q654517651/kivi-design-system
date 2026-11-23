import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Button,
  DateRangeFilter,
  Dropdown,
  EmptyState,
  Input,
  Loading,
  Menu,
  MenuItem,
  Select,
  Skeleton,
  TabItem,
  Tabs,
  type DateRange,
  type SelectOption,
} from '@kivi';
import { useDB } from '../../data/db';
import { useBriefLoading } from '../../hooks/useBriefLoading';
import { useDebounced } from '../../hooks/useDebounced';
import { usePaged, type MoreRef } from '../../hooks/usePaged';
import { useStuck } from '../../hooks/useStuck';
import { GROUPS, SOURCE_LABEL, groupOf, startOfDay, useAssetCells } from './assetCells';
import { AssetBatchActions, BatchControls } from './BatchBar';

/*
  资产页 · 生成历史：全部生成结果（会话、工具、画布来的，上传的不算），按今天 / 昨天 / 更早分组。
  筛选条（来源、类型、时间、收藏、搜索）滚动时吸顶；结果格悬停出收藏；点图用全站查看大图。
*/

const SOURCE_OPTIONS: SelectOption[] = [{ value: 'all', label: '全部' }, ...Object.entries(SOURCE_LABEL).filter(([v]) => v !== 'upload').map(([value, label]) => ({ value, label }))];
/** 一页几条（线上 100，演示数据少，改小） */
const PAGE_SIZE = 20;
/** 首次进入、换筛选先出几个骨架 */
const SKELETON_COUNT = 10;

export function HistorySection({ moreRef }: { moreRef: MoreRef }) {
  const assets = useDB((s) => s.assets);
  const [source, setSource] = useState<string | null>('all');
  const [type, setType] = useState('all');
  const [onlyCollected, setOnlyCollected] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  // 批量编辑：按钮在筛选行最右边，进去后格子出勾选框，按钮原地换成批量控件
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  // 筛选条吸顶了没有（hooks/useStuck）
  const [sentinel, stuck] = useStuck();

  // 搜索框打完字停一会儿才搜（和探索页一样）
  const k = useDebounced(keyword).trim();
  // 历史：生成出来的，新的在前
  const history = useMemo(() => assets.filter((a) => a.source !== 'upload').sort((a, b) => b.createdAt - a.createdAt), [assets]);
  const list = useMemo(
    () =>
      history.filter((h) => {
        const day = startOfDay(h.createdAt);
        return (
          (source === 'all' || h.source === source) &&
          (type === 'all' || h.media === type) &&
          (!onlyCollected || h.collected) &&
          (!range.start || day >= range.start.getTime()) &&
          (!range.end || day <= range.end.getTime()) &&
          (!k || (h.name ?? '').includes(k))
        );
      }),
    [history, source, type, onlyCollected, range, k],
  );
  // 首次进入、换筛选、搜索：先出骨架；往下滚到底再加载下一页
  const filterKey = `${source}|${type}|${onlyCollected}|${k}|${range.start?.getTime()}|${range.end?.getTime()}`;
  const filtering = useBriefLoading(filterKey);
  const { count, loading: more } = usePaged(list.length, PAGE_SIZE, filterKey, moreRef);
  const shown = useMemo(() => list.slice(0, count), [list, count]);
  const reset = () => {
    setSource('all');
    setType('all');
    setOnlyCollected(false);
    setKeyword('');
    setRange({ start: null, end: null });
  };
  // 被删掉的素材从已选里去掉
  useEffect(() => {
    setPicked((p) => {
      const ids = new Set(history.map((h) => h.id));
      const next = new Set([...p].filter((id) => ids.has(id)));
      return next.size === p.size ? p : next;
    });
  }, [history]);
  const toggle = (id: string) =>
    setPicked((p) => {
      const next = new Set(p);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const done = () => {
    setPicking(false);
    setPicked(new Set());
  };
  const { cell, extra } = useAssetCells(shown, { picking, picked, onToggle: toggle });
  const pickedItems = shown.filter((h) => picked.has(h.id));

  return (
    <Fragment>
      <section className="tpl-as__section">
        <header className="tpl-as__head">
          <h2>生成历史</h2>
        </header>
        {/* 筛选条：滚动时吸在余额、头像那一排下面；最右边是批量编辑，点了原地换成批量控件，左边筛选和搜索照常；放不下时批量控件盖住左边，左边缘渐隐（11-19 用户定） */}
        <div ref={sentinel} className="tpl-as__sentinel" aria-hidden />
        <div className="tpl-as__filters tpl-as__filters--batch" data-stuck={stuck || undefined} data-picking={picking || undefined}>
          <div className="tpl-as__filters-main">
            <span className="tpl-as__label">来源</span>
            <Dropdown
              haspopup="listbox"
              trigger={
                <Select variant="plain" leftIcon={SOURCE_OPTIONS.find((o) => o.value === source)?.icon} aria-label="生成历史来源">
                  {SOURCE_OPTIONS.find((o) => o.value === source)?.label}
                </Select>
              }
            >
              <Menu role="listbox" aria-label="生成历史来源">
                {SOURCE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} icon={o.icon} selected={o.value === source} disabled={o.disabled} onClick={() => setSource(o.value)}>
                    {o.label}
                  </MenuItem>
                ))}
              </Menu>
            </Dropdown>
            <span className="tpl-as__label">类型</span>
            <Tabs value={type} onChange={setType} aria-label="生成历史类型">
              <TabItem value="all">全部</TabItem>
              <TabItem value="image">图片</TabItem>
              <TabItem value="video">视频</TabItem>
            </Tabs>
            <span className="tpl-as__label">时间</span>
            <DateRangeFilter value={range} onChange={setRange} placeholder="全部" aria-label="生成历史时间" />
            {/* 收藏是开关，不是「类型」那组选项卡里的一项：和前面的筛选隔 16，不用分割线（11-18 用户定） */}
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
            <Input
              leftIcon="Search"
              clearable
              placeholder="搜索生成记录"
              aria-label="搜索生成记录"
              className="tpl-as__search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="tpl-as__filters-end">
            <BatchControls
              label="批量操作"
              picking={picking}
              onStart={() => setPicking(true)}
              canStart={history.length > 0}
              total={shown.length}
              picked={pickedItems.length}
              onSelectAll={(all) => setPicked(all ? new Set(shown.map((h) => h.id)) : new Set())}
              onDone={done}
            >
              <AssetBatchActions items={pickedItems} onChanged={() => setPicked(new Set())} />
            </BatchControls>
          </div>
        </div>

        {filtering ? (
          <div className="tpl-as__grid" aria-busy>
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <Skeleton key={i} style={{ width: '100%', aspectRatio: '1 / 1' }} />
            ))}
          </div>
        ) : history.length === 0 ? (
          <EmptyState type="empty" size={160} title="没有任何资产" className="tpl-as__empty" />
        ) : list.length === 0 ? (
          <EmptyState
            type={onlyCollected ? 'favorite' : 'empty'}
            size={160}
            title={k ? '没有搜索到符合条件的内容' : onlyCollected ? '暂无符合条件的收藏' : '没有找到相关生成记录'}
            action={
              <Button variant="secondary-muted" onClick={reset}>
                重置筛选
              </Button>
            }
            className="tpl-as__empty"
          />
        ) : (
          GROUPS.map((g) => {
            const items = shown.filter((h) => groupOf(h.createdAt) === g);
            if (!items.length) return null;
            return (
              <section key={g} className="tpl-as__day" aria-label={`${g}的生成记录`}>
                <header>
                  <h3>{g}</h3>
                </header>
                <div className="tpl-as__grid">
                  {items.map(cell)}
                </div>
              </section>
            );
          })
        )}
        {!filtering && more && <Loading className="tpl-as__more">加载中</Loading>}
      </section>

      {extra}
    </Fragment>
  );
}
