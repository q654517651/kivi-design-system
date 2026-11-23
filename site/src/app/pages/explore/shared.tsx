import type { ReactNode } from 'react';
import { Skeleton, TabItem, Tabs, type MasonryColumns } from '@kivi';
import { useStuck } from '../../hooks/useStuck';

/** 发现作品瀑布流的列数：探索页「发现」和创作首页「发现」共用。一排 5 列（11-20 用户定，原来 11-10 定最多 4 列），按容器宽：≤ 1100 四列、≤ 800 三列、≤ 550 两列；创作首页「最近更新」用同一组断点 */
export const WORK_COLUMNS: MasonryColumns = { default: 5, 1100: 4, 800: 3, 550: 2, 400: 1 };

/*
  探索页几块共用的小零件：分类条、卡片骨架。
*/

/** 分类：「全部」+ 后台配置的分类，一组选项卡 */
export function CategoryTabs({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <Tabs value={value} onChange={onChange} aria-label={label}>
      <TabItem value="all">全部</TabItem>
      {options.map((c) => (
        <TabItem key={c} value={c}>
          {c}
        </TabItem>
      ))}
    </Tabs>
  );
}

/** 每个选项卡第一行的筛选条：滚动时吸在余额、头像那一排下面，吸住后上面那 64 铺页面底色（和资产页生成历史同一套） */
export function FilterBar({ children }: { children: ReactNode }) {
  const [sentinel, stuck] = useStuck();
  return (
    <>
      <div ref={sentinel} className="tpl-as__sentinel" aria-hidden />
      <div className="tpl-as__filters" data-stuck={stuck || undefined}>
        {children}
      </div>
    </>
  );
}

/** 工作流卡的骨架：16:9 封面 + 标题、作者两行；short 只有标题一行（卡上不写作者时，画布「工作流」面板） */
export function CardSkeleton({ short }: { short?: boolean }) {
  return (
    <div className="tpl-ex__card-skeleton" aria-hidden>
      <Skeleton style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 0 }} />
      <div className="tpl-ex__card-skeleton-body">
        <Skeleton variant="text" width="60%" />
        {!short && <Skeleton variant="text" width="30%" />}
      </div>
    </div>
  );
}
