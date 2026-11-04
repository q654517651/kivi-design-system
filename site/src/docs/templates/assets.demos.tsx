import { useState } from 'react';
import {
  Button,
  Divider,
  EmptyState,
  FolderCard,
  Input,
  ProjectCard,
  ResultTile,
  Select,
  TabItem,
  Tabs,
  Toaster,
  placeholderImageSrc,
  type PlaceholderImageName,
  type SelectOption,
} from '@kivi';
import { VIDEO } from '../components/media.demos';
import { TemplateFrame } from './frame';
import { Sidebar } from './main-site.demos';

/*
  资产管理（我的资产）：照 11-04 交互原型（kivi-prototype 的 assets-home）。
  三块从上到下：我的素材（文件夹，就是原来的文件夹）、我的画布、生成历史（全部历史，按今天 / 昨天 / 更早分组）。
  只能看：不生成、不调接口；筛选、收藏、文件夹菜单能点。
*/

const PICS: PlaceholderImageName[] = ['kivi-future', 'ip-gouache', 'kiwi-light', 'bunny-gouache', 'monstera-dots', 'ip-peek', 'ip-kiwi-pile', 'ip-future'];
const pic = (i: number) => placeholderImageSrc(PICS[i % PICS.length], '1:1');
const pics = (from: number, n: number) => Array.from({ length: n }, (_, i) => pic(from + i));

const FOLDERS = [
  { id: 'f1', name: '活动文件夹1', covers: pics(0, 4), count: 6, pinned: true },
  { id: 'f2', name: '创作参考', covers: pics(2, 3), count: 6 },
  { id: 'f3', name: '灵感收藏', covers: pics(5, 2), count: 6 },
  { id: 'f4', name: '品牌物料', covers: pics(7, 4), count: 18 },
  { id: 'f5', name: '短剧分镜', covers: pics(1, 4), count: 32 },
  { id: 'f6', name: '我的上传', covers: [], count: 0 },
  // 宽屏一排放得下更多，多备几个
  ...['产品白底图', '角色设定', '场景概念', '直播间背景', '节日海报', '短视频素材', '图标草稿', '配色参考', '运营活动', '旧版存档'].map((name, i) => ({
    id: `f${i + 7}`,
    name,
    covers: pics(i, (i % 4) + 1),
    count: 4 + i * 3,
  })),
];

const HOUR = 3_600_000;
const CANVASES = [
  { id: 'c1', name: '深林', covers: pics(4, 4), updatedAt: Date.now() - 5 * 60_000 },
  { id: 'c2', name: '笑脸', covers: pics(1, 3), updatedAt: Date.now() - 2 * HOUR },
  { id: 'c3', name: '短剧制作流程图', covers: pics(6, 4), updatedAt: Date.now() - 20 * HOUR },
  { id: 'c4', name: '短剧制作流程图', covers: pics(3, 1), updatedAt: Date.now() - 6 * 24 * HOUR },
  { id: 'c5', name: '新春海报', covers: pics(2, 2), updatedAt: Date.now() - 8 * 24 * HOUR },
  { id: 'c6', name: '未命名画布', covers: [], updatedAt: Date.now() - 12 * 24 * HOUR },
  ...['角色三视图', '产品主图', '分镜脚本', '直播间布置', '节日活动', '品牌延展', '图标探索', '概念设定', '电商详情页', '旧版画布'].map((name, i) => ({
    id: `c${i + 7}`,
    name,
    covers: pics(i + 3, (i % 4) + 1),
    updatedAt: Date.now() - (14 + i * 3) * 24 * HOUR,
  })),
];

type Source = '会话' | '工具' | '画布';
type History = { id: string; name: string; video: boolean; source: Source; group: string; time: string; src: string };

const SOURCES: Source[] = ['会话', '工具', '画布'];
const GROUPS = ['今天', '昨天', '更早'];
const HISTORY: History[] = Array.from({ length: 72 }, (_, i) => {
  const video = i % 4 === 1;
  return {
    id: `h${i}`,
    name: `${video ? '视频' : '图片'}生成 ${String(i + 1).padStart(2, '0')}`,
    video,
    source: SOURCES[i % 3],
    group: GROUPS[i < 28 ? 0 : i < 46 ? 1 : 2],
    time: ['14:32', '13:18', '11:46', '10:05'][i % 4],
    src: pic(i),
  };
});

const SOURCE_OPTIONS: SelectOption[] = [{ value: 'all', label: '全部' }, ...SOURCES.map((s) => ({ value: s, label: s }))];

/** 一块的标题行：左标题，右边「新建」「查看全部」 */
function SectionHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="tpl-as__head">
      <h2>{title}</h2>
      <div className="tpl-as__head-actions">
        {children}
        <Button size={28} variant="text" rightIcon="RightArrowSmall">
          查看全部
        </Button>
      </div>
    </header>
  );
}

/** 生成历史的一格：结果格（悬停出收藏，收藏了留一颗星；视频悬停就播，左下是播放器自己的时长）。不挂类型、来源标签，下面不带名字和时间 */
function HistoryCard({ item, collected, onCollect }: { item: History; collected: boolean; onCollect: (v: boolean) => void }) {
  return (
    <ResultTile
      title={item.name}
      type={item.video ? 'video' : undefined}
      src={item.video ? VIDEO.wide : item.src}
      poster={item.video ? item.src : undefined}
      collect
      collected={collected}
      onCollectedChange={onCollect}
    />
  );
}

function AssetsPage() {
  const [folders, setFolders] = useState(FOLDERS);
  const [source, setSource] = useState<string | null>('all');
  const [type, setType] = useState('all');
  const [onlyCollected, setOnlyCollected] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [collected, setCollected] = useState<string[]>(['h2', 'h7']);

  const k = keyword.trim();
  const list = HISTORY.filter(
    (h) =>
      (source === 'all' || h.source === source) &&
      (type === 'all' || (type === 'video') === h.video) &&
      (!onlyCollected || collected.includes(h.id)) &&
      (!k || h.name.includes(k)),
  );
  const reset = () => {
    setSource('all');
    setType('all');
    setOnlyCollected(false);
    setKeyword('');
  };
  // 置顶的排最前面
  const pin = (id: string, pinned: boolean) =>
    setFolders((all) => {
      const next = all.map((f) => (f.id === id ? { ...f, pinned } : f));
      return [...next.filter((f) => f.pinned), ...next.filter((f) => !f.pinned)];
    });

  return (
    <main className="tpl-as">
      <section className="tpl-as__section">
        <SectionHead title="我的素材" />
        <div className="tpl-as__row">
          {folders.map((f) => (
            <FolderCard
              key={f.id}
              name={f.name}
              count={f.count}
              covers={f.covers}
              pinned={f.pinned}
              onPinnedChange={(v) => pin(f.id, v)}
              onDelete={() => setFolders((all) => all.filter((x) => x.id !== f.id))}
            />
          ))}
        </div>
      </section>

      <section className="tpl-as__section">
        <SectionHead title="我的画布">
          <Button size={28} variant="text" leftIcon="AddSmall">
            新建画布
          </Button>
        </SectionHead>
        <div className="tpl-as__row">
          {CANVASES.map((c) => (
            <ProjectCard key={c.id} name={c.name} covers={c.covers} updatedAt={c.updatedAt} />
          ))}
        </div>
      </section>

      <section className="tpl-as__section">
        <header className="tpl-as__head">
          <h2>生成历史</h2>
        </header>
        {/* 筛选条：滚动时吸顶 */}
        <div className="tpl-as__filters">
          <span className="tpl-as__label">来源</span>
          <Select variant="plain" options={SOURCE_OPTIONS} value={source} onChange={setSource} aria-label="生成历史来源" />
          <span className="tpl-as__label">类型</span>
          <Tabs value={type} onChange={setType} aria-label="生成历史类型">
            <TabItem value="all">全部</TabItem>
            <TabItem value="image">图片</TabItem>
            <TabItem value="video">视频</TabItem>
          </Tabs>
          <Divider orientation="vertical" />
          <TabItem
            icon={onlyCollected ? 'CollectSolid' : 'Collect'}
            selected={onlyCollected}
            role="checkbox"
            aria-selected={undefined}
            aria-checked={onlyCollected}
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

        {list.length === 0 ? (
          <EmptyState
            scene={onlyCollected ? 'favorite' : 'empty'}
            size={160}
            title={onlyCollected ? '暂无符合条件的收藏' : '没有找到相关生成记录'}
            action={
              <Button variant="secondary" onClick={reset}>
                重置筛选
              </Button>
            }
            className="tpl-as__empty"
          />
        ) : (
          GROUPS.map((g) => {
            const items = list.filter((h) => h.group === g);
            if (!items.length) return null;
            return (
              <section key={g} className="tpl-as__day" aria-label={`${g}的生成记录`}>
                <header>
                  <h3>{g}</h3>
                </header>
                <div className="tpl-as__grid">
                  {items.map((h) => (
                    <HistoryCard
                      key={h.id}
                      item={h}
                      collected={collected.includes(h.id)}
                      onCollect={(v) => setCollected((all) => (v ? [...all, h.id] : all.filter((x) => x !== h.id)))}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </section>
    </main>
  );
}

/** 侧栏（选中「我的资产」）+ 资产页 */
export function AssetsTemplate() {
  return (
    <TemplateFrame>
      <Toaster />
      <div className="tpl-ms">
        <Sidebar page="assets" defaultSelected="" />
        <AssetsPage />
      </div>
    </TemplateFrame>
  );
}
