import { useState } from 'react';
import {
  Button,
  Divider,
  EmptyState,
  FolderCard,
  GenPrompt,
  IconButton,
  Input,
  ProjectCard,
  ResultTile,
  Select,
  Dropdown,
  Menu,
  MenuItem,
  TabItem,
  Tabs,
  Tag,
  placeholderImageSrc,
  toast,
  type PlaceholderImageName,
  type SelectOption,
  ScrollArea,
} from '@kivi';
import { VIDEO } from '../components/media.demos';
import { MediaViewer, ViewerAuthor, ViewerSection, useLastShown } from './media-viewer';

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
        <Button size={32} variant="ghost" rightIcon="RightArrowSmall">
          查看全部
        </Button>
      </div>
    </header>
  );
}

/** 生成历史的一格：结果格（悬停出收藏，收藏了留一颗星；视频悬停就播，左下是播放器自己的时长）。不挂类型、来源标签，下面不带名字和时间 */
function HistoryCard({ item, collected, onCollect, onOpen }: { item: History; collected: boolean; onCollect: (v: boolean) => void; onOpen: () => void }) {
  return (
    <ResultTile
      // 点图看大图（视频点右下「预览」），点的是格子里的按钮就不打开
      style={{ cursor: item.video ? undefined : 'zoom-in' }}
      onClick={item.video ? undefined : (e) => !(e.target as HTMLElement).closest('button') && onOpen()}
      onPreview={item.video ? onOpen : undefined}
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

/** 资产页主区（侧栏在 UI 页面预览的外壳里） */
export function AssetsPage() {
  const [folders, setFolders] = useState(FOLDERS);
  const [source, setSource] = useState<string | null>('all');
  const [type, setType] = useState('all');
  const [onlyCollected, setOnlyCollected] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [collected, setCollected] = useState<string[]>(['h2', 'h7']);
  // 看大图：全站共用的查看大图（media-viewer.tsx），信息栏写名字、来源和时间
  const [view, setView] = useState<History | null>(null);
  const shownView = useLastShown(view);

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
    <ScrollArea className="tpl-as">
    <main className="tpl-as__body">
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
          <Button size={32} variant="ghost" leftIcon="AddSmall">
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
          <Divider orientation="vertical" />
          <TabItem
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

        {list.length === 0 ? (
          <EmptyState
            type={onlyCollected ? 'favorite' : 'empty'}
            size={160}
            title={onlyCollected ? '暂无符合条件的收藏' : '没有找到相关生成记录'}
            action={
              <Button variant="secondary-muted" onClick={reset}>
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
                      onOpen={() => setView(h)}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </section>

      <MediaViewer
        media={view && { type: view.video ? 'video' : 'image', src: view.video ? VIDEO.wide : view.src, poster: view.video ? view.src : undefined, alt: view.name }}
        onClose={() => setView(null)}
        head={shownView && <ViewerAuthor name="KIVI" avatar={placeholderImageSrc('ip-peek', '1:1')} date={`${shownView.group} ${shownView.time}`} />}
        actions={
          shownView && (
            <>
              <IconButton icon="Download" label="下载" variant="secondary" size={36} onClick={() => toast.info('已开始下载')} />
              <IconButton
                icon={collected.includes(shownView.id) ? 'CollectSolid' : 'Collect'}
                label={collected.includes(shownView.id) ? '取消收藏' : '收藏'}
                variant="secondary"
                size={36}
                data-collected={collected.includes(shownView.id) || undefined}
                onClick={() => setCollected((all) => (all.includes(shownView.id) ? all.filter((x) => x !== shownView.id) : [...all, shownView.id]))}
              />
            </>
          )
        }
      >
        {shownView && (
          <ViewerSection title="来源">
            <GenPrompt>
              <Tag icon={shownView.video ? 'VideoGeneration' : 'ImageGeneration'}>{shownView.name}</Tag>
              <Tag>{shownView.source}</Tag>
            </GenPrompt>
          </ViewerSection>
        )}
      </MediaViewer>
    </main>
    </ScrollArea>
  );
}
