import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type MutableRefObject, type ReactNode } from 'react';
import {
  AttachmentStrip,
  Avatar,
  Button,
  Dialog,
  Divider,
  Dropdown,
  EmptyState,
  ExploreCard,
  ExploreCover,
  GenPrompt,
  IconButton,
  Input,
  Masonry,
  Menu,
  MenuItem,
  MenuLabel,
  Prose,
  ScrollArea,
  Select,
  Skeleton,
  TabItem,
  Tabs,
  Tag,
  WorkCard,
  placeholderImageSrc,
  toast,
  type AttachmentItem,
  type MasonryColumns,
  type PlaceholderImageName,
  type PlaceholderImageRatio,
  type SkillItem,
} from '@kivi';
import { MiniCanvas } from '../business/canvas.demos';
import { VIDEO } from '../components/media.demos';
import { MediaViewer, ViewerAuthor, ViewerSection, useLastShown } from './media-viewer';

/*
  UI 页面预览 · 探索页，照飞书需求「主帧-探索」和下面四篇子需求（发现页、创作精选、公共技能、公共工作流，3.14）。
  四个选项卡：发现、创作精选、技能、工作流，都是公开内容。只能看：不调接口，数据是假的。
  每个选项卡第一行是「分类 + 搜索」（发现多一个小类筛选和「我收藏的」），搜索停 0.5 秒再搜，和分类一起生效；
  滚到底先出骨架，再加载下一屏，切分类、搜索从第一屏开始。
  发现：瀑布流，点作品铺满窗口看详情（照线上 CardDetailModal），右键出菜单。
  创作精选、技能、工作流：同一张卡（ExploreCard）。创作精选、工作流点卡片出画布预览，「克隆」进画布页。
  技能：卡片点开是详情，「使用」新建画布、Agent 输入框带上技能引用。
*/

export type ExploreTab = 'discover' | 'featured' | 'skill' | 'workflow';

export const RATIO: Record<PlaceholderImageRatio, number> = { '1:1': 1, '3:4': 3 / 4, '16:9': 16 / 9, '9:16': 9 / 16 };
const PICS: PlaceholderImageName[] = ['kivi-future', 'ip-gouache', 'kiwi-light', 'bunny-gouache', 'monstera-dots', 'ip-peek', 'ip-kiwi-pile', 'ip-future'];
const pic = (i: number, ratio: PlaceholderImageRatio = '1:1') => placeholderImageSrc(PICS[i % PICS.length], ratio);

const AUTHORS = [
  { name: '阿远', avatar: pic(5) },
  { name: '小橙子' },
  { name: 'Momo', avatar: pic(1) },
  { name: '设计部-林' },
  { name: '市场创意-周', avatar: pic(3) },
  { name: '一只猕猴桃' },
  { name: 'Kiko', avatar: pic(6) },
  { name: '阿杰' },
];

/** 封面视频：几秒到十几秒的真实拍摄短片（占位，网上 CC0 / 免费可用的样片，出处在视频文件夹的 CREDITS.md） */
const CLIPS = ['jellyfish', 'road', 'flower', 'stars'].map((n) => ({
  video: `./placeholders/video/clip-${n}.mp4`,
  /** 封面图用视频第一帧，悬停开播时画面接得上 */
  poster: `./placeholders/video/clip-${n}.jpg`,
}));

// ---------- 公用：搜索停 0.5 秒、滚到底加载、分类条 ----------

/** 停下来 delay 毫秒后才变的值：搜索框打完字停 0.5 秒再搜（需求） */
function useDebounced<T>(value: T, delay = 500) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return v;
}

/**
 * 一屏一屏往下加载：先显示 size 条，滚到底（ExplorePage 调 moreRef）出骨架，0.8 秒后多显示一屏。
 * resetKey 变了（切分类、搜索）回到第一屏
 */
function usePaged(total: number, size: number, resetKey: string, moreRef: MutableRefObject<(() => void) | undefined>) {
  const [count, setCount] = useState(size);
  const [loading, setLoading] = useState(false);
  // 切分类、搜索：渲染时就回到第一屏（不放进 effect：effect 比 ScrollArea 的「到底了」晚跑，会把刚开始的加载清掉）
  const [key, setKey] = useState(resetKey);
  if (key !== resetKey) {
    setKey(resetKey);
    setCount(size);
    setLoading(false);
  }
  // 加载中：0.8 秒后多显示一屏。计时跟着 loading 走，切走、卸载时自己清掉
  useEffect(() => {
    if (!loading) return;
    const t = window.setTimeout(() => {
      setCount((n) => Math.min(n + size, total));
      setLoading(false);
    }, 800);
    return () => window.clearTimeout(t);
  }, [loading, size, total]);
  // 用 layout effect：外面 ScrollArea 挂上、内容变了就量一次「到底了没有」（也是 layout effect，比这里晚跑）。
  // 不满一屏时它马上调「加载下一屏」，这时这里得已经接好，不然第一次落空、高屏幕上一直不满
  useLayoutEffect(() => {
    moreRef.current = () => {
      if (loading || count >= total) return;
      setLoading(true);
    };
  });
  return { count, loading, done: count >= total };
}

/** 分类：「全部」+ 后台配置的分类，一组选项卡 */
function CategoryTabs({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
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

// ---------- 发现 ----------

/** 素材大类和小类：随知识库分类配置，这里是演示 */
const DISCOVER_CATEGORIES: Record<string, string[]> = {
  视觉: ['海报', '插画', 'KV'],
  礼物: ['礼物', '座驾', '头像框', '麦圈', '勋章'],
  游戏: ['角色', '图标', '场景'],
  品牌: ['Logo', 'IP 形象', '物料'],
};
const CATS = Object.keys(DISCOVER_CATEGORIES);

const PROMPTS = [
  '赛博朋克城市夜景里漂浮的猕猴桃切片，霓虹灯反射，电影感光影',
  '水粉风格的小兔子在花园里看书，暖色调，绘本插画',
  '极简海报：一颗猕猴桃，大面积留白，品牌绿点缀',
  'KIVI 吉祥物在未来城市里奔跑，速度线，动漫风格',
  '龟背竹叶子和波点背景，复古印刷质感',
  '猕猴桃堆成小山，微距摄影，清晨柔光',
  '新春海报：红色灯笼和猕猴桃，喜庆',
  '产品主图：玻璃质感饮料瓶，白底，柔和投影',
];
const RATIOS: PlaceholderImageRatio[] = ['3:4', '1:1', '9:16', '3:4', '16:9', '1:1', '3:4', '9:16', '1:1', '16:9'];

export interface Work {
  id: string;
  video: boolean;
  ratio: PlaceholderImageRatio;
  src: string;
  poster?: string;
  prompt: string;
  author: (typeof AUTHORS)[number];
  likes: number;
  category: string;
  sub: string;
  model: string;
  date: string;
  /** 参考图：0–4 张，没有就不显示「参考图」这一节 */
  refs: AttachmentItem[];
}

/** 120 条，一屏 20 条 */
export const WORKS: Work[] = Array.from({ length: 120 }, (_, i) => {
  const ratio = RATIOS[i % RATIOS.length];
  const video = i % 7 === 3 && (ratio === '9:16' || ratio === '16:9');
  const clip = video && ratio === '16:9' ? CLIPS[i % CLIPS.length] : undefined;
  const cover = clip ? clip.poster : pic(i * 3, ratio);
  const category = CATS[i % CATS.length];
  const subs = DISCOVER_CATEGORIES[category];
  return {
    id: `w${i}`,
    video,
    ratio,
    src: video ? (clip ? clip.video : VIDEO.tall) : cover,
    poster: video ? cover : undefined,
    prompt: PROMPTS[i % PROMPTS.length],
    author: AUTHORS[(i * 5) % AUTHORS.length],
    likes: (i * 37) % 260,
    category,
    sub: subs[Math.floor(i / CATS.length) % subs.length],
    model: video ? 'Seedance 2.0' : ['Nano Banana 2.1', 'Seedream 4.0', 'GPT Image 1'][i % 3],
    date: `2026-11-${String(9 - (i % 9)).padStart(2, '0')}`,
    refs: Array.from({ length: i % 5 }, (_, j) => ({ id: `w${i}-r${j}`, type: 'image' as const, name: `图片${j + 1}`, src: pic(i + j + 2) })),
  };
});
const WORK_PAGE = 20;
// 最多 4 列（11-10 用户定：前期作品不多，列少一屏要的作品少、卡也大；1600 宽一张约 400，和即梦 1920 屏、LibTV 一样）
const COLUMNS: MasonryColumns = { default: 4, 1100: 3, 700: 2, 500: 1 };

function Discover({ moreRef }: { moreRef: MutableRefObject<(() => void) | undefined> }) {
  const [category, setCategory] = useState('all');
  const [subs, setSubs] = useState<string[]>([]);
  const [onlyCollected, setOnlyCollected] = useState(false);
  const [keyword, setKeyword] = useState('');
  const k = useDebounced(keyword.trim());
  const [collected, setCollected] = useState<string[]>(['w2', 'w9', 'w15']);
  const [liked, setLiked] = useState<string[]>(['w4']);
  const [detail, setDetail] = useState<Work | null>(null);
  const shownDetail = useLastShown(detail);
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
  const skeletons = loading ? 8 : 0;

  const toggle = (set: typeof setLiked, id: string, on: boolean) => set((all) => (on ? [...all, id] : all.filter((x) => x !== id)));
  const likesOf = (w: Work) => w.likes + (liked.includes(w.id) ? 1 : 0);
  const clearFilters = () => {
    setCategory('all');
    setSubs([]);
    setOnlyCollected(false);
  };
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
          <EmptyState
            size={160}
            title="没有搜索到符合条件的内容"
            action={
              <Button variant="light" onClick={clearFilters}>
                清空筛选
              </Button>
            }
            className="tpl-as__empty"
          />
        )
      ) : (
        <Masonry columns={COLUMNS} gap={2} ratios={[...shown.map((w) => RATIO[w.ratio]), ...Array.from({ length: skeletons }, (_, i) => (i % 2 ? 1 : 3 / 4))]}>
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
              onLikedChange={(v) => toggle(setLiked, w.id, v)}
              collected={collected.includes(w.id)}
              onCollectedChange={(v) => toggle(setCollected, w.id, v)}
              onDownload={() => toast.info('已开始下载')}
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

      {/* 右键菜单：复制、下载、收藏、添加到参考图、添加到文件夹（需求「发现页」）。只能看，点了出一条提示 */}
      <Dropdown anchorPoint={menu ?? undefined} open={menu !== null} onOpenChange={(v) => !v && setMenu(null)}>
        <Menu aria-label="作品操作">
          <MenuItem icon="Copy" onClick={() => toast.success('已复制')}>
            复制
          </MenuItem>
          <MenuItem icon="Download" onClick={() => toast.info('已开始下载')}>
            下载
          </MenuItem>
          {menu && (
            <MenuItem
              icon={collected.includes(menu.work.id) ? 'CollectSolid' : 'Collect'}
              data-collected={collected.includes(menu.work.id) || undefined}
              onClick={() => toggle(setCollected, menu.work.id, !collected.includes(menu.work.id))}
            >
              {collected.includes(menu.work.id) ? '取消收藏' : '收藏'}
            </MenuItem>
          )}
          <Divider />
          <MenuItem icon="ImagePlus" onClick={() => toast.success('已添加到参考图')}>
            添加到参考图
          </MenuItem>
          <MenuItem icon="AddFolder" onClick={() => toast.success('已添加到文件夹')}>
            添加到文件夹
          </MenuItem>
        </Menu>
      </Dropdown>

      {/* 详情：全站共用的查看大图（media-viewer.tsx）。头是作者和下载、收藏，内容是提示词和参数、参考图，最下面点赞。没有一键同款（11-09 用户定） */}
      <MediaViewer
        media={detail && { type: detail.video ? 'video' : 'image', src: detail.src, poster: detail.poster, alt: detail.prompt }}
        onClose={() => setDetail(null)}
        head={shownDetail && <ViewerAuthor name={shownDetail.author.name} avatar={shownDetail.author.avatar} date={shownDetail.date} />}
        actions={
          shownDetail && (
            <>
              <IconButton icon="Download" label="下载" variant="secondary" size={36} onClick={() => toast.info('已开始下载')} />
              <IconButton
                icon={collected.includes(shownDetail.id) ? 'CollectSolid' : 'Collect'}
                label={collected.includes(shownDetail.id) ? '取消收藏' : '收藏'}
                variant="secondary"
                size={36}
                data-collected={collected.includes(shownDetail.id) || undefined}
                onClick={() => toggle(setCollected, shownDetail.id, !collected.includes(shownDetail.id))}
              />
            </>
          )
        }
        footer={
          shownDetail && (
            <Button
              size={36}
              variant="secondary"
              leftIcon={liked.includes(shownDetail.id) ? 'ThumbsUpFill' : 'ThumbsUp'}
              onClick={() => toggle(setLiked, shownDetail.id, !liked.includes(shownDetail.id))}
            >
              {likesOf(shownDetail)}
            </Button>
          )
        }
      >
        {shownDetail && (
          <>
            <ViewerSection title="提示词">
              <GenPrompt prompt={shownDetail.prompt}>
                <Tag>{shownDetail.video ? '视频生成' : '图片生成'}</Tag>
                <Tag>{shownDetail.model}</Tag>
                <Tag>{shownDetail.ratio}</Tag>
              </GenPrompt>
            </ViewerSection>
            {/* 参考图：只放参考图（线上还有图生图、控制图、Lora 等，这里不做），多张放在一个容器里，悬停看大图 */}
            {shownDetail.refs.length > 0 && (
              <ViewerSection title="参考图">
                <div className="tpl-viewer__refs">
                  <AttachmentStrip items={shownDetail.refs} />
                </div>
              </ViewerSection>
            )}
          </>
        )}
      </MediaViewer>
    </>
  );
}

// ---------- 创作精选、工作流：同一套 ----------

export interface Flow {
  id: string;
  name: string;
  category: string;
  /** 后台单独配置的横屏封面（图、动图都放这里） */
  cover: string;
  /** 封面视频：有就悬停播 */
  video?: string;
  author: (typeof AUTHORS)[number];
  description: string;
}

/** 分类：初期参考线上工作流，以后台配置为准 */
const FLOW_CATEGORIES = ['品牌', 'UI', '游戏', '视觉', '礼物'];
const FLOW_NAMES: Record<'featured' | 'workflow', string[]> = {
  featured: [
    '电商主图全套', '短剧分镜到成片', '新春海报一条龙', '产品宣传短视频', 'IP 形象延展', '直播间物料', '小红书封面组', '品牌 KV 延展',
    '节日营销套图', '角色三视图到动画', '详情页长图', '口播视频', '游戏开服宣传', '礼物特效全套', '周年庆主视觉', '新品首发倒计时',
    '虚拟主播形象', '国风插画系列', '音乐 MV 分镜', '活动 H5 素材', '品牌吉祥物', '盲盒手办设定', '赛事战报海报', '会员权益卡面',
  ],
  workflow: [
    '白底图换场景', '分镜批量出图', '海报多尺寸延展', '图生视频 5s', '抠图 + 高清', '角色表情包', '商品多角度', '文案配图',
    '首尾帧转场', '风格迁移', '视频高清 + 补帧', '背景音乐配乐', '线稿上色', '老照片修复', '多语言海报', '头像框批量出图',
    '座驾 3D 转视频', '图标风格统一', '人物换装', '场景扩图', '口型同步', '动态壁纸', '字幕配音', '商品视频混剪',
  ],
};
const clipOf = (i: number, kind: 'featured' | 'workflow') => CLIPS[(Math.floor(i / 3) + (kind === 'workflow' ? 2 : 0)) % CLIPS.length];
/** 一屏 12 条（4 列 3 行） */
const FLOW_PAGE = 12;
/** 同名的再出一轮时加的后缀 */
const VARIANTS = ['', ' · 进阶', ' · 竖版', ' · 夏日版'];
/** 96 条：24 个名字 × 4 个版本，八屏 */
export const flowsOf = (kind: 'featured' | 'workflow'): Flow[] =>
  Array.from({ length: 96 }, (_, i) => {
    const base = FLOW_NAMES[kind][i % 24];
    const name = base + VARIANTS[Math.floor(i / 24)];
    return {
      id: `${kind}-${i}`,
      name,
      category: FLOW_CATEGORIES[i % FLOW_CATEGORIES.length],
      // 每三个里有一个是视频封面
      cover: i % 3 === 1 ? clipOf(i, kind).poster : pic(i + (kind === 'workflow' ? 3 : 0), '16:9'),
      video: i % 3 === 1 ? clipOf(i, kind).video : undefined,
      author: AUTHORS[(i * 3 + (kind === 'workflow' ? 1 : 0)) % AUTHORS.length],
      description: `${kind === 'featured' ? '一整个画布工程' : '一段节点'}：从参考图和文案开始，按「${name}」的步骤串好节点。`,
    };
  });

function FlowGallery({ kind, onClone, moreRef }: { kind: 'featured' | 'workflow'; onClone: () => void; moreRef: MutableRefObject<(() => void) | undefined> }) {
  const noun = kind === 'featured' ? '案例' : '工作流';
  const items = useMemo(() => flowsOf(kind), [kind]);
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const k = useDebounced(keyword.trim());
  const [view, setView] = useState<Flow | null>(null);
  const shownView = useLastShown(view);
  // 只匹配标题或描述（需求）
  const list = items.filter((f) => (category === 'all' || f.category === category) && (!k || f.name.includes(k) || f.description.includes(k)));
  const { count, loading } = usePaged(list.length, FLOW_PAGE, `${category}|${k}`, moreRef);

  return (
    <>
      <div className="tpl-as__filters">
        <CategoryTabs label={`${noun}分类`} value={category} options={FLOW_CATEGORIES} onChange={setCategory} />
        <Input leftIcon="Search" clearable placeholder={`搜索${noun}`} aria-label={`搜索${noun}`} className="tpl-as__search" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>
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
      {/* 画布预览：标题、作者、画布快照（只读小画布：能看节点、缩放、适配画布），关闭和「克隆」。克隆进画布页（需求「创作精选」「公共工作流」） */}
      <Dialog
        size={1200}
        title={shownView?.name}
        description={
          shownView && (
            <span className="tpl-ex__detail-author">
              <Avatar name={shownView.author.name} src={shownView.author.avatar} size={24} />
              {shownView.author.name}
            </span>
          )
        }
        open={view !== null}
        onOpenChange={(v) => !v && setView(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setView(null)}>
              关闭
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setView(null);
                onClone();
              }}
            >
              克隆
            </Button>
          </>
        }
      >
        {shownView && <MiniCanvas chrome={false} fake={false} viewBar phases={{ video: 'done' }} className="tpl-ex__canvas-preview" />}
      </Dialog>
    </>
  );
}

/** 工作流卡的骨架：16:9 封面 + 标题、作者两行 */
function CardSkeleton() {
  return (
    <div className="tpl-ex__card-skeleton" aria-hidden>
      <Skeleton style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 0 }} />
      <div className="tpl-ex__card-skeleton-body">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="30%" />
      </div>
    </div>
  );
}

// ---------- 技能：公共技能 ----------

/** 分类：从现有技能分类数据读，这里是演示 */
const SKILL_CATS = ['礼物', '游戏', '品牌', '活动'];
/** 探索页的公开技能：演示数据，24 个名字 × 3 个版本 = 72 个，一屏 12 个、六屏 */
const SKILL_SEED: [string, string][] = [
  ['海报设计', '按主题、尺寸和文案出一组海报，自动排版标题和信息层级'],
  ['电商主图', '商品白底图换场景，出 1:1 和 3:4 两套主图'],
  ['分镜脚本', '把一段故事拆成镜头，给每个镜头写画面、运镜和台词'],
  ['短视频脚本', '15–60 秒口播和剧情脚本，带开头钩子和结尾引导'],
  ['Logo 设计', '从品牌名和行业出 6 个方向的标志草图'],
  ['社媒配图', '小红书、抖音封面，一次出多个比例'],
  ['IP 形象延展', '上传一张角色图，延展表情包、三视图和动作'],
  ['品牌规范检查', '按我们的品牌色和字体检查设计稿'],
  ['礼物特效设计', '按礼物价位出静帧和动效方向，带光效和粒子参考'],
  ['头像框批量出图', '一套主题出 8 个等级的头像框，边框粗细逐级加'],
  ['座驾设定', '从文字描述出座驾三视图和入场动画分镜'],
  ['游戏角色立绘', '按职业和阵营出角色立绘，统一画风和光源'],
  ['游戏图标', '道具、技能图标一次出一套，尺寸和描边统一'],
  ['场景概念图', '给一句世界观描述，出远中近三景的场景草图'],
  ['活动主视觉', '节日、周年庆主 KV，带标题字和氛围元素'],
  ['Banner 延展', '一张主视觉延展成 Banner、开屏、弹窗多个尺寸'],
  ['勋章设计', '按成就名出勋章，金银铜三档材质'],
  ['麦圈设计', '语音房麦圈，静态加呼吸动效两版'],
  ['表情包', '一个角色出 16 个常用表情，带文字'],
  ['产品渲染', '产品图换材质、换背景，出电商级渲染图'],
  ['节日文案配图', '节日祝福文案配插画，适合朋友圈和社群'],
  ['品牌物料', '名片、工牌、手提袋一套物料按品牌规范出'],
  ['剧情漫画', '一段剧情拆成四格或条漫，角色保持一致'],
  ['MV 分镜', '按歌词段落出分镜和画面风格参考'],
];
const SKILL_VARIANTS = ['', ' · 进阶', ' · 简版'];
export const SKILLS = Array.from({ length: SKILL_SEED.length * SKILL_VARIANTS.length }, (_, i) => {
  const [title, description] = SKILL_SEED[i % SKILL_SEED.length];
  const official = i % 3 === 0;
  return {
    id: `skill-${i}`,
    title: title + SKILL_VARIANTS[Math.floor(i / SKILL_SEED.length)],
    description,
    category: SKILL_CATS[i % SKILL_CATS.length],
    // 封面都配上：对话里技能卡那张占位封面（SKILL_DEFAULT_COVER）是小图、自带圆角，不能铺在这里（11-10 用户定）
    cover: PICS[(i * 3) % PICS.length],
    recommended: official,
    author: official ? undefined : AUTHORS[i % AUTHORS.length],
    // 每 4 个里有一个配了封面视频，封面图是视频第一帧
    video: i % 4 === 1 ? CLIPS[Math.floor(i / 4) % CLIPS.length].video : undefined,
    poster: i % 4 === 1 ? CLIPS[Math.floor(i / 4) % CLIPS.length].poster : undefined,
  };
});
type ExploreSkill = (typeof SKILLS)[number];
const SKILL_PAGE = 12;

/** 技能包里的文件：默认看 SKILL.md，有别的文件可以切过去看（需求「公共技能 · 技能详情」） */
const SKILL_FILES = ['SKILL.md', 'references/风格指南.md', 'examples/示例.md'];

function skillFile(s: SkillItem, file: string): ReactNode {
  if (file === 'SKILL.md')
    return (
      <>
        <h4>{s.title}</h4>
        <p>{s.description}</p>
        <ol>
          <li>先问清楚用途、尺寸和要放的文字。</li>
          <li>按主题出 4 个方向，每个方向一张草图。</li>
          <li>用户挑一个方向后，出完整版本并给出可以调整的地方。</li>
        </ol>
      </>
    );
  if (file.startsWith('references'))
    return (
      <>
        <h4>风格指南</h4>
        <ul>
          <li>主色用品牌绿，大面积留白。</li>
          <li>标题字号不小于画面高度的 8%。</li>
        </ul>
      </>
    );
  return (
    <>
      <h4>示例</h4>
      <p>「帮我做 4 张新春活动海报，竖版，标题写猕猴桃新年礼盒」</p>
    </>
  );
}

function Skills({ onUse, moreRef }: { onUse: (s: SkillItem) => void; moreRef: MutableRefObject<(() => void) | undefined> }) {
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const k = useDebounced(keyword.trim());
  const [detail, setDetail] = useState<ExploreSkill | null>(null);
  const shownSkill = useLastShown(detail);
  const [file, setFile] = useState(SKILL_FILES[0]);
  // 只匹配名称或描述（需求）
  const list = SKILLS.filter((s) => (category === 'all' || s.category === category) && (!k || s.title.includes(k) || s.description?.includes(k)));
  const { count, loading } = usePaged(list.length, SKILL_PAGE, `${category}|${k}`, moreRef);
  // 公开的技能一定有封面（11-10 用户定）
  const cover = (s: ExploreSkill) => s.poster ?? placeholderImageSrc(s.cover, '16:9');
  const who = (s: ExploreSkill) => s.author ?? { name: 'KIVI' };

  return (
    <>
      <div className="tpl-as__filters">
        <CategoryTabs label="技能分类" value={category} options={SKILL_CATS} onChange={setCategory} />
        <Input leftIcon="Search" clearable placeholder="搜索技能" aria-label="搜索技能" className="tpl-as__search" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>
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
              onOpen={() => {
                setFile(SKILL_FILES[0]);
                setDetail(s);
              }}
            />
          ))}
          {loading && Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
        </div>
      )}
      {/* 详情：沿用现有技能详情：名称、作者、封面、描述、技能内容（默认 SKILL.md，可切文件），底部「使用」 */}
      <Dialog
        size={800}
        title={shownSkill?.title}
        open={detail !== null}
        onOpenChange={(v) => !v && setDetail(null)}
        footer={
          shownSkill && (
            <Button
              variant="primary"
              onClick={() => {
                setDetail(null);
                onUse(shownSkill);
              }}
            >
              使用
            </Button>
          )
        }
      >
        {shownSkill && (
          <div className="tpl-ex__skill">
            <span className="tpl-ex__shownSkill-author">
              <Avatar name={who(shownSkill).name} src={who(shownSkill).avatar} size={24} />
              {who(shownSkill).name}
              {shownSkill.recommended && <Tag>官方</Tag>}
            </span>
            <ExploreCover className="tpl-ex__skill-cover" src={cover(shownSkill)} video={shownSkill.video} playing={!!shownSkill.video} />
            <section className="tpl-ex__viewer-section">
              <h4>技能描述</h4>
              <p className="tpl-ex__skill-desc">{shownSkill.description}</p>
            </section>
            <section className="tpl-ex__viewer-section">
              <div className="tpl-ex__skill-files">
                <h4>技能内容</h4>
                <Dropdown
                  haspopup="listbox"
                  placement="bottom-end"
                  trigger={
                    <Select variant="plain" leftIcon="File" aria-label="切换文件">
                      {file}
                    </Select>
                  }
                >
                  <Menu role="listbox" aria-label="技能文件">
                    {SKILL_FILES.map((f) => (
                      <MenuItem key={f} icon="File" selected={f === file} onClick={() => setFile(f)}>
                        {f}
                      </MenuItem>
                    ))}
                  </Menu>
                </Dropdown>
              </div>
              <Prose className="tpl-ex__skill-content">{skillFile(shownSkill, file)}</Prose>
            </section>
          </div>
        )}
      </Dialog>
    </>
  );
}

// ---------- 整页 ----------

const TABS: { value: ExploreTab; label: string }[] = [
  { value: 'discover', label: '发现' },
  { value: 'featured', label: '创作精选' },
  { value: 'skill', label: '技能' },
  { value: 'workflow', label: '工作流' },
];

/** 探索页主区（侧栏在 UI 页面预览的外壳里）。技能「使用」新建画布并带上技能引用；创作精选、工作流「克隆」进画布 */
export function ExplorePage({
  initialTab = 'discover',
  onUseSkill,
  onOpenCanvas,
}: {
  /** 进来停在哪个选项卡：创作首页「查看全部」带过来 */
  initialTab?: ExploreTab;
  onUseSkill?: (name: string) => void;
  onOpenCanvas?: () => void;
}) {
  const [tab, setTab] = useState<ExploreTab>(initialTab);
  const viewport = useRef<HTMLDivElement>(null);
  // 当前选项卡的「加载下一屏」，由选项卡自己挂上来
  const moreRef = useRef<() => void>();

  const body: Record<ExploreTab, ReactNode> = {
    discover: <Discover moreRef={moreRef} />,
    featured: <FlowGallery key="featured" kind="featured" onClone={() => onOpenCanvas?.()} moreRef={moreRef} />,
    skill: <Skills onUse={(s) => onUseSkill?.(s.title)} moreRef={moreRef} />,
    workflow: <FlowGallery key="workflow" kind="workflow" onClone={() => onOpenCanvas?.()} moreRef={moreRef} />,
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
