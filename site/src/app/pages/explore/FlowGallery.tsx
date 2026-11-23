import { useMemo, useState } from 'react';
import { EmptyState, ExploreCard, Input } from '@kivi';
import { flowsOf, FLOW_CATEGORIES, type Flow } from '../../data/catalog';
import { useDebounced } from '../../hooks/useDebounced';
import { usePaged, type MoreRef } from '../../hooks/usePaged';
import { FlowPreview } from './FlowPreview';
import { CardSkeleton, CategoryTabs, FilterBar } from './shared';

/*
  探索 · 创作精选、工作流：同一张卡（ExploreCard）。点卡片出画布预览（FlowPreview），「应用画布」新建一块带这段节点的画布、进画布页（照线上，11-20 用户定）。
  只匹配标题或描述；滚到底先出骨架再加载下一屏。
*/

/** 一屏 12 条（4 列 3 行） */
const FLOW_PAGE = 12;

export function FlowGallery({ kind, onClone, moreRef, initialKeyword = '' }: { kind: 'featured' | 'workflow'; onClone: (canvasId: string) => void; moreRef: MoreRef; initialKeyword?: string }) {
  const noun = kind === 'featured' ? '案例' : '工作流';
  const items = useMemo(() => flowsOf(kind), [kind]);
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState(initialKeyword);
  const k = useDebounced(keyword.trim());
  const [view, setView] = useState<Flow | null>(null);
  // 只匹配标题或描述（需求）
  const list = items.filter((f) => (category === 'all' || f.category === category) && (!k || f.name.includes(k) || f.description.includes(k)));
  const { count, loading } = usePaged(list.length, FLOW_PAGE, `${category}|${k}`, moreRef);

  return (
    <>
      <FilterBar>
        <CategoryTabs label={`${noun}分类`} value={category} options={FLOW_CATEGORIES} onChange={setCategory} />
        <Input leftIcon="Search" clearable placeholder={`搜索${noun}`} aria-label={`搜索${noun}`} className="tpl-as__search tpl-ex__search" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </FilterBar>
      {list.length === 0 ? (
        <EmptyState size={160} title={`没有找到相关${noun}`} className="tpl-as__empty" />
      ) : (
        <div className="tpl-ex__grid">
          {list.slice(0, count).map((f) => (
            <ExploreCard key={f.id} name={f.name} cover={f.cover} video={f.video} showTime author={f.author} onOpen={() => setView(f)} />
          ))}
          {loading && Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
        </div>
      )}
      {/* 画布预览：只读画布，顶上「应用画布」（照线上 workflow-preview） */}
      <FlowPreview flow={view} onClose={() => setView(null)} onCloned={onClone} />
    </>
  );
}

