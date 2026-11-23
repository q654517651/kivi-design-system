import { useState } from 'react';
import { Divider, Dropdown, EmptyState, ExploreCard, Input, Menu, MenuItem, Select, placeholderImageSrc } from '@kivi';
import { SKILLS, SKILL_CATS, type ExploreSkill } from '../../data/catalog';
import { useDebounced } from '../../hooks/useDebounced';
import { usePaged, type MoreRef } from '../../hooks/usePaged';
import { CardSkeleton, CategoryTabs, FilterBar } from './shared';
import { SkillDetail } from './SkillDetail';

/*
  探索 · 技能：公共技能，卡片点开是详情（名称、作者、封面、描述、技能内容），底部「使用」。
  技能内容默认看 SKILL.md，有别的文件用文件树切过去（需求「公共技能 · 技能详情」）。只匹配名称或描述。
*/

const SKILL_PAGE = 12;

/** 排序：按时间（新发布的在前）、按用量（用得多的在前），默认按时间（11-20 用户定） */
type SkillSort = 'time' | 'uses';
const SORTS: { value: SkillSort; label: string }[] = [
  { value: 'time', label: '按时间排序' },
  { value: 'uses', label: '按用量排序' },
];

export function Skills({ onUse, moreRef, initialKeyword = '' }: { onUse: (s: ExploreSkill) => void; moreRef: MoreRef; initialKeyword?: string }) {
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SkillSort>('time');
  const [keyword, setKeyword] = useState(initialKeyword);
  const k = useDebounced(keyword.trim());
  const [detail, setDetail] = useState<ExploreSkill | null>(null);
  // 只匹配名称或描述（需求）
  const list = SKILLS.filter((s) => (category === 'all' || s.category === category) && (!k || s.title.includes(k) || s.description?.includes(k))).sort((a, b) =>
    sort === 'uses' ? b.uses - a.uses : b.publishedAt - a.publishedAt,
  );
  const { count, loading } = usePaged(list.length, SKILL_PAGE, `${category}|${k}|${sort}`, moreRef);
  // 公开的技能一定有封面（11-10 用户定）
  const cover = (s: ExploreSkill) => s.poster ?? placeholderImageSrc(s.cover, '16:9');

  return (
    <>
      <FilterBar>
        <CategoryTabs label="技能分类" value={category} options={SKILL_CATS} onChange={setCategory} />
        <Divider orientation="vertical" />
        <Dropdown
          haspopup="listbox"
          trigger={
            <Select variant="plain" aria-label="技能排序">
              {SORTS.find((o) => o.value === sort)?.label}
            </Select>
          }
        >
          <Menu role="listbox" aria-label="技能排序">
            {SORTS.map((o) => (
              <MenuItem key={o.value} selected={o.value === sort} onClick={() => setSort(o.value)}>
                {o.label}
              </MenuItem>
            ))}
          </Menu>
        </Dropdown>
        <Input leftIcon="Search" clearable placeholder="搜索技能" aria-label="搜索技能" className="tpl-as__search tpl-ex__search" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </FilterBar>
      {list.length === 0 ? (
        <EmptyState size={160} title="没有找到相关技能" className="tpl-as__empty" />
      ) : (
        <div className="tpl-ex__grid">
          {list.slice(0, count).map((s) => (
            <ExploreCard
              key={s.id}
              name={s.title}
              description={s.description ?? ''}
              cover={cover(s)}
              video={s.video}
              author={s.author ?? { name: 'KIVI' }}
              onOpen={() => setDetail(s)}
            />
          ))}
          {loading && Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
        </div>
      )}
      {/* 详情：SkillDetail（创作首页也用它） */}
      <SkillDetail skill={detail} onClose={() => setDetail(null)} onUse={onUse} />
    </>
  );
}
