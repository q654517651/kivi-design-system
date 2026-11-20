import { useRef, useState, type ReactNode } from 'react';
import { ScrollArea, TabItem, Tabs } from '@kivi';
import { Discover } from './Discover';
import { FlowGallery } from './FlowGallery';
import { Skills } from './Skills';

/*
  探索页，照飞书需求「主帧-探索」和四篇子需求（发现页、创作精选、公共技能、公共工作流，3.14）。
  四个选项卡：发现、创作精选、技能、工作流，都是公开内容；每个选项卡第一行是「分类 + 搜索」。
  数据是假的（data/catalog.ts），收藏在 db.favorites；滚到底加载下一屏由 ScrollArea 通知当前选项卡。
  技能「使用」新建画布、Agent 输入框带上技能引用；创作精选、工作流「克隆」进画布页。
*/

export type ExploreTab = 'discover' | 'featured' | 'skill' | 'workflow';

const TABS: { value: ExploreTab; label: string }[] = [
  { value: 'discover', label: '发现' },
  { value: 'featured', label: '创作精选' },
  { value: 'skill', label: '技能' },
  { value: 'workflow', label: '工作流' },
];

/** 探索页主区（侧栏在 UI 页面预览的外壳里）。技能「使用」新建画布并带上技能引用；创作精选、工作流「克隆」进画布 */
export function ExplorePage({
  initialTab = 'discover',
  initialKeyword,
  onUseSkill,
  onOpenCanvas,
}: {
  /** 进来停在哪个选项卡：创作首页「查看全部」带过来 */
  initialTab?: ExploreTab;
  /** 进来时搜索框里已经填好的字：创作首页广场的搜索框带过来，只对 initialTab 那个选项卡生效 */
  initialKeyword?: string;
  onUseSkill?: (name: string) => void;
  /** 克隆好了：打开这块新画布 */
  onOpenCanvas?: (canvasId: string) => void;
}) {
  const [tab, setTab] = useState<ExploreTab>(initialTab);
  const viewport = useRef<HTMLDivElement>(null);
  // 当前选项卡的「加载下一屏」，由选项卡自己挂上来
  const moreRef = useRef<() => void>();

  const body: Record<ExploreTab, ReactNode> = {
    discover: <Discover moreRef={moreRef} initialKeyword={initialTab === 'discover' ? initialKeyword : undefined} />,
    featured: <FlowGallery key="featured" kind="featured" onClone={(id) => onOpenCanvas?.(id)} moreRef={moreRef} initialKeyword={initialTab === 'featured' ? initialKeyword : undefined} />,
    skill: <Skills onUse={(s) => onUseSkill?.(s.title)} moreRef={moreRef} initialKeyword={initialTab === 'skill' ? initialKeyword : undefined} />,
    workflow: <FlowGallery key="workflow" kind="workflow" onClone={(id) => onOpenCanvas?.(id)} moreRef={moreRef} initialKeyword={initialTab === 'workflow' ? initialKeyword : undefined} />,
  };

  return (
    <main className="tpl-ex">
      <ScrollArea className="tpl-ex__scroll" viewportRef={viewport} onReachEnd={() => moreRef.current?.()} reachEndOffset={300}>
        <div className="tpl-ex__inner">
          <header className="tpl-ex__head">
            <Tabs
              size={36}
              value={tab}
              onChange={(v) => {
                setTab(v as ExploreTab);
                viewport.current?.scrollTo({ top: 0 });
              }}
              aria-label="探索"
            >
              {TABS.map((t) => (
                <TabItem key={t.value} value={t.value}>
                  {t.label}
                </TabItem>
              ))}
            </Tabs>
          </header>
          {body[tab]}
        </div>
      </ScrollArea>
    </main>
  );
}

