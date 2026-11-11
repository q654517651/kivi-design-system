import { useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import {
  AssetThumb,
  Avatar,
  Button,
  Dialog,
  GenPrompt,
  GenPromptRefs,
  GenerateButton,
  Icon,
  IconButton,
  Menu,
  MessageFeedback,
  Divider,
  MenuItem,
  MenuLabel,
  ProcessGroup,
  PromptBox,
  ReferenceItem,
  AgentControls,
  AudioCharCount,
  AudioModelControls,
  CountSelect,
  DEFAULT_MODEL,
  ImageModelControls,
  TaskSelect,
  VideoModelControls,
  ReferenceStack,
  ResultTile,
  Tag,
  UserMessage,
  placeholderImageSrc,
  referenceName,
  type PlaceholderImageName,
  type PlaceholderImageRatio,
  type ProcessStep,
  type ReferenceType,
  type ReferenceStackItem,
  type ResultTileAction,
  type ResultTileStatus,
} from '@kivi';
import { SKILL_CATEGORIES, SKILL_ITEMS } from '../business/skill-data';
import { demoCost } from '../business/gen-demo-cost';
import { useControllable } from '../../kivi/hooks';

// UI 页面预览 · 创作页：侧栏 + 记录流（用户自己生成的、主站 Agent 的混在一起）+ 底部输入框。
// 只能看：点生成没反应，生成中的一直停在生成中。图片都是占位图

const img = (name: PlaceholderImageName, ratio: PlaceholderImageRatio) => placeholderImageSrc(name, ratio);
const VIDEO = { wide: './placeholders/video/kivi-demo-16x9.mp4', tall: './placeholders/video/kivi-demo-9x16.mp4' };

// 结果格悬停出的操作，和主站页一样
const TOP: ResultTileAction[] = [
  { icon: 'Delete', label: '删除' },
  { icon: 'Download', label: '下载' },
];
const QUICK_IMAGE: ResultTileAction[] = [
  { icon: 'ImageEditing', label: '图片编辑' },
  { icon: 'VideoGeneration', label: '图生视频' },
  { icon: 'ImageToImage', label: '一键垫图' },
  { icon: 'More', label: '更多' },
];
const QUICK_VIDEO: ResultTileAction[] = [
  { icon: 'VideoExtend', label: '视频延长' },
  { icon: 'HD', label: '视频高清' },
  { icon: 'More', label: '更多' },
];

// ---------- 记录 ----------

interface Tile {
  src?: string;
  video?: string;
  status?: ResultTileStatus;
  badge?: string;
  collected?: boolean;
}

interface GenRecord {
  kind: 'gen';
  id: string;
  prompt?: string;
  tags: ReactNode;
  ratio: PlaceholderImageRatio;
  tiles: Tile[];
}

interface AgentTurn {
  kind: 'agent';
  id: string;
}

const RECORDS: (GenRecord | AgentTurn)[] = [
  {
    kind: 'gen',
    id: 'r1',
    prompt: '生成一张赛博朋克风格的猕猴桃海报',
    ratio: '1:1',
    tags: (
      <>
        <Tag icon="ImageGeneration">图片生成</Tag>
        <Tag icon="Bytedance">Seedream 4.0</Tag>
        <Tag>2K</Tag>
        <Tag>1:1</Tag>
      </>
    ),
    tiles: [
      { src: img('kivi-future', '1:1') },
      { src: img('monstera-dots', '1:1'), collected: true },
      { src: img('kiwi-light', '1:1') },
      { src: img('ip-gouache', '1:1') },
    ],
  },
  {
    kind: 'gen',
    id: 'r2',
    prompt: '猕猴桃从空中落进果汁杯，溅起水花，镜头慢慢推近，夏日清爽的广告质感',
    ratio: '16:9',
    tags: (
      <>
        <Tag icon="VideoGeneration">视频生成</Tag>
        <Tag icon="Bytedance">Seedance 2.0 Fast</Tag>
        <GenPromptRefs label="全能参考" items={[{ type: 'image', src: img('kiwi-glass', '1:1') }, { type: 'image', src: img('kiwi-light', '1:1') }]} />
        <Tag>720P</Tag>
        <Tag>16:9</Tag>
        <Tag>8s</Tag>
      </>
    ),
    tiles: [{ video: VIDEO.wide, src: img('kivi-future', '16:9') }],
  },
  { kind: 'agent', id: 'a1' },
  {
    kind: 'gen',
    id: 'r3',
    prompt: '水粉画风格的兔子抱着猕猴桃，暖色调，纸张纹理，儿童绘本插画',
    ratio: '3:4',
    tags: (
      <>
        <Tag icon="ImageGeneration">图片生成</Tag>
        <Tag icon="Gemini">Nano Banana 2</Tag>
        <Tag>2K</Tag>
        <Tag>3:4</Tag>
      </>
    ),
    tiles: [
      { src: img('bunny-gouache', '3:4') },
      { src: img('ip-gouache', '3:4') },
      { status: 'failed' },
      { src: img('ip-peek', '3:4') },
    ],
  },
  {
    kind: 'gen',
    id: 'r4',
    prompt: 'KIVI 吉祥物从屏幕边缘探出头，眨眼打招呼，竖版短视频',
    ratio: '9:16',
    tags: (
      <>
        <Tag icon="VideoGeneration">视频生成</Tag>
        <Tag icon="Kling">可灵 2.1</Tag>
        <Tag>1080P</Tag>
        <Tag>9:16</Tag>
        <Tag>5s</Tag>
      </>
    ),
    tiles: [{ status: 'generating', badge: '59s 生成中' }],
  },
  {
    kind: 'gen',
    id: 'r5',
    prompt: '极繁主义的未来城市，霓虹灯牌写着 KIVI，宽银幕电影构图',
    ratio: '16:9',
    tags: (
      <>
        <Tag icon="ImageGeneration">图片生成</Tag>
        <Tag icon="Bytedance">Seedream 4.0</Tag>
        <Tag>4K</Tag>
        <Tag>16:9</Tag>
      </>
    ),
    tiles: [
      { status: 'generating', badge: '32s 生成中' },
      { status: 'generating', badge: '生成中' },
      { status: 'generating', badge: '生成中' },
      { status: 'generating', badge: '生成中' },
    ],
  },
];

const AGENT_STEPS: ProcessStep[] = [
  { icon: 'Skill', action: '加载技能', object: '海报设计' },
  { icon: 'ScanEye', action: '查看链接内容', object: '参考图' },
];
const AGENT_RESULTS = (['kiwi-glass', 'kivi-future', 'kiwi-light', 'monstera-dots'] as PlaceholderImageName[]).map((n) => img(n, '9:16'));

/** 网格怎么排：多张 4 列；单张横图占 2 列，方图改 3 列占 1 列，竖图占 1 列 */
function gridOf(ratio: PlaceholderImageRatio, count: number) {
  const [w, h] = ratio.split(':').map(Number);
  if (count > 1) return { cols: 4, span: 1 };
  if (w > h) return { cols: 4, span: 2 };
  if (w === h) return { cols: 3, span: 1 };
  return { cols: 4, span: 1 };
}

// ---------- 侧栏 ----------

interface HistoryItem {
  id: string;
  text: string;
  thumb?: string;
  /** 置顶：排在这一组最前面 */
  pinned?: boolean;
}

const CHATS: HistoryItem[] = [
  { id: 'chat-1', text: '猕猴桃饮料夏日海报', thumb: img('kiwi-glass', '1:1') },
  { id: 'chat-2', text: '吉祥物探头短视频' },
  { id: 'chat-3', text: '赛博朋克城市概念图' },
  { id: 'chat-4', text: '水粉兔绘本插画', thumb: img('bunny-gouache', '1:1') },
  // 演示「更多」翻页：一共 30 条，默认 6 条，每点一次多 10 条
  ...[
    '新品开箱口播脚本', '中秋礼盒包装', '小红书封面三连', '咖啡店菜单排版', '游戏角色立绘', '国潮风格插画',
    '产品白底图精修', '短剧分镜第一集', '节日红包封面', '露营装备种草图', '宠物写真', '电商详情页长图',
    '品牌 Slogan 想法', '复古胶片人像', '城市夜景延时', '赛车海报', '儿童绘本第二章', '健身课程封面',
    '口红试色图', '书店活动海报', '手机壁纸一组', '早餐广告短片', '毕业季合照修图', '旅行 Vlog 片头',
    '音乐节主视觉', '护肤品氛围图',
  ].map((text, i) => ({ id: `chat-${i + 5}`, text, thumb: i % 5 === 2 ? img('monstera-dots', '1:1') : undefined })),
];
const CANVASES: HistoryItem[] = [
  { id: 'canvas-1', text: '新品发布会物料', thumb: img('kivi-future', '1:1') },
  { id: 'canvas-2', text: '618 活动主视觉' },
  { id: 'canvas-3', text: '品牌 IP 设定' },
  ...[
    '短剧制作流程图', '新春海报', '深林', '笑脸', '双十一会场', '吉祥物三视图', '产品 TVC 分镜',
    '门店物料', '直播间背景', '包装延展', '周年庆 KV', '社媒九宫格', '角色表情包', '展会展位',
    '秋冬新品', '小程序 Banner', '品牌手册', '主题乐园导视', '音乐专辑封面', '画册内页',
    '活动邀请函', '桌游卡牌', '城市海报', '未命名画布',
  ].map((text, i) => ({ id: `canvas-${i + 4}`, text, thumb: i % 6 === 1 ? img('ip-gouache', '1:1') : undefined })),
];

/** 侧栏历史默认显示几条、点「更多」每次多几条（照线上） */
const HISTORY_FIRST = 6;
const HISTORY_STEP = 10;

/** UI 页面预览里能切的页：侧栏四个导航 + 画布 */
export type AppPage = 'create' | 'explore' | 'tools' | 'assets' | 'canvas';
export type HistoryKind = 'chat' | 'canvas';

const NAV_ITEMS: { page: AppPage; icon: 'Create' | 'Explore' | 'AITools' | 'Pack'; label: string }[] = [
  { page: 'create', icon: 'Create', label: '创作' },
  { page: 'explore', icon: 'Explore', label: '探索' },
  { page: 'tools', icon: 'AITools', label: 'AI 工具' },
  { page: 'assets', icon: 'Pack', label: '我的资产' },
];

/**
 * 侧栏的一段（对话 / 画布）：MenuLabel 带 items，标题点了展开收起，列表往下推开、淡入，收起倒着走（Collapse，300ms ease-in-out）。
 * 默认显示 6 条，点「更多」每次多 10 条，全显示了「更多」就没了（照线上）。
 * 对话：标题右边新建（NewChat）；画布：标题右边「全部」+ 新建（Add），条目悬停「⋯」左边多一个「在新标签页打开」（11-11 用户定）
 */
function HistoryGroup({
  title,
  items,
  icon,
  selected,
  collapsed,
  onSelect,
  onNew,
  onRemove,
  onRename,
  onPin,
  onAll,
  onOpenNewTab,
}: {
  title: string;
  items: HistoryItem[];
  icon: 'Message' | 'Canvas';
  selected: string;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onPin: (id: string) => void;
  /** 画布：标题右边「全部」，去我的资产看全部画布。不传就没有，新建图标是 NewChat */
  onAll?: () => void;
  /** 画布：条目悬停「⋯」左边的「在新标签页打开」。不传就没有 */
  onOpenNewTab?: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [shown, setShown] = useState(HISTORY_FIRST);
  return (
    <MenuLabel
      collapsible
      collapsed={collapsed}
      expanded={open}
      onExpandedChange={setOpen}
      extra={
        onAll && (
          <Button size={28} variant="text" onClick={onAll}>
            全部
          </Button>
        )
      }
      action={
        <IconButton
          icon={onAll ? 'Add' : 'NewChat'}
          label={`新建${title}`}
          size={28}
          variant="light"
          onClick={() => {
            setOpen(true);
            onNew();
          }}
        />
      }
      items={
        <>
          {items.slice(0, shown).map((c) => (
            <MenuItem
              key={c.id}
              thumb={c.thumb ? <AssetThumb size={24} type="image" src={c.thumb} /> : <AssetThumb size={24} type="icon" icon={icon} />}
              collapsed={collapsed}
              selected={selected === c.id || undefined}
              onClick={() => onSelect(c.id)}
              editing={editing === c.id}
              onEditingChange={(v) => setEditing(v ? c.id : null)}
              onRename={(name) => onRename(c.id, name)}
              actions={onOpenNewTab && <IconButton icon="NewWindow" label="在新标签页打开" size={28} variant="light" onClick={() => onOpenNewTab(c.id)} />}
              more={
                // 重命名（在原地改名）、置顶（新版要加，置顶后变「取消置顶」，照线上资产文件夹）、删除
                <Menu>
                  <MenuItem icon="Rename" onClick={() => setEditing(c.id)}>
                    重命名
                  </MenuItem>
                  <MenuItem icon="StickyOnTop" onClick={() => onPin(c.id)}>
                    {c.pinned ? '取消置顶' : '置顶'}
                  </MenuItem>
                  <Divider />
                  <MenuItem variant="danger" icon="Delete" onClick={() => onRemove(c.id)}>
                    删除
                  </MenuItem>
                </Menu>
              }
            >
              {c.text}
            </MenuItem>
          ))}
          {shown < items.length && (
            <MenuItem collapsed={collapsed} onClick={() => setShown((n) => n + HISTORY_STEP)}>
              更多
            </MenuItem>
          )}
        </>
      }
    >
      {title}
    </MenuLabel>
  );
}

/**
 * 主站侧栏：Logo、导航、对话和画布的历史。点条目选中，「⋯」出菜单（重命名在原地改、回车生效；置顶挪到最前；删除真的删），标题右边新建一条，标题点了展开收起。
 * 收起：宽 240 → 60（12 + 条目 36 + 12），300ms ease-in-out，收成图标栏：Logo、导航图标、封面、新建、更多。
 * 收起后悬停 Logo 换成「展开侧栏」按钮，点了展开
 */
export function Sidebar({
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  page,
  onNavigate,
  selected: selectedProp,
  defaultSelected = 'chat-1',
  onOpen,
}: {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 当前在哪个导航页，那一项用选中底色；创作页只在没选中对话时选中「创作」 */
  page?: AppPage;
  /** 点导航（创作、探索、AI 工具、我的资产） */
  onNavigate?: (page: AppPage) => void;
  /** 选中哪条对话 / 画布（受控），不选传空 */
  selected?: string;
  /** 一开始选中哪条对话 / 画布（非受控），不选传空 */
  defaultSelected?: string;
  /** 点开（或新建）一条对话 / 画布：对话回创作页，画布进画布页 */
  onOpen?: (kind: HistoryKind, id: string) => void;
}) {
  const [collapsed, setCollapsed] = useControllable(collapsedProp, defaultCollapsed, onCollapsedChange);
  // 点收起后，鼠标离开过 Logo 这行才认悬停：点的时候鼠标还在这行，鼠标不动浏览器不重新算悬停，不然「展开侧栏」会冒出来
  const [settling, setSettling] = useState(false);
  const [chats, setChats] = useState(CHATS);
  const [canvases, setCanvases] = useState(CANVASES);
  const [selected, setSelected] = useControllable(selectedProp, defaultSelected);
  const open = (kind: HistoryKind, id: string) => {
    setSelected(id);
    onOpen?.(kind, id);
  };
  // 新建的排在置顶的后面
  const add = (kind: HistoryKind, set: typeof setChats, text: string) => {
    const id = `new-${Date.now()}`;
    set((list) => {
      const at = list.filter((c) => c.pinned).length;
      return [...list.slice(0, at), { id, text }, ...list.slice(at)];
    });
    open(kind, id);
  };
  // 置顶挪到最前面；取消置顶放回置顶的后面
  const pin = (set: typeof setChats, id: string) =>
    set((list) => {
      const item = list.find((c) => c.id === id);
      if (!item) return list;
      const rest = list.filter((c) => c.id !== id);
      const next = { ...item, pinned: !item.pinned };
      const at = next.pinned ? 0 : rest.filter((c) => c.pinned).length;
      return [...rest.slice(0, at), next, ...rest.slice(at)];
    });
  const toggle = collapsed ? '展开侧栏' : '收起侧栏';
  return (
    <div className="tpl-ms__side-wrap" data-collapsed={collapsed ? '' : undefined} data-settling={settling ? '' : undefined}>
      <aside className="tpl-ms__side">
        <div className="tpl-ms__brand" onPointerLeave={() => setSettling(false)}>
          {/* Logo 是按钮：点了回创作首页（照 LibTV），收起时藏起来、换小 Logo */}
          <button type="button" className="tpl-ms__home" aria-label="回到创作首页" onClick={() => onNavigate?.('create')}>
            <Icon name="Logo" />
          </button>
          {/* 收起时的小 Logo：绿色渐变底 + 描边，Logo 缩小放正中（照原型） */}
          <span className="tpl-ms__mini-logo" aria-hidden>
            <Icon name="Logo" />
          </span>
          {/* 展开时在右边；收起时淡出，原地不动。收起后悬停小 Logo 才在它的位置出现。轻：平时 50%，悬停变亮 */}
          <span className="tpl-ms__toggle">
            <IconButton icon="Sidebar" label={toggle} variant="light" size={28} tooltip={{ placement: collapsed ? 'right' : 'bottom' }} onClick={() => { setSettling(!collapsed); setCollapsed(!collapsed); }} />
          </span>
        </div>
        <Menu variant="plain" aria-label="主站导航">
          {NAV_ITEMS.map((n) => (
            <MenuItem
              key={n.page}
              icon={n.icon}
              collapsed={collapsed}
              selected={(page === n.page && (n.page !== 'create' || !selected)) || undefined}
              onClick={() => onNavigate?.(n.page)}
            >
              {n.label}
            </MenuItem>
          ))}
          <div className="tpl-ms__gap" />
          <HistoryGroup
            title="对话"
            icon="Message"
            items={chats}
            selected={selected}
            collapsed={collapsed}
            onSelect={(id) => open('chat', id)}
            onNew={() => add('chat', setChats, '新对话')}
            onRemove={(id) => setChats((list) => list.filter((c) => c.id !== id))}
            onRename={(id, name) => setChats((list) => list.map((c) => (c.id === id ? { ...c, text: name } : c)))}
            onPin={(id) => pin(setChats, id)}
          />
          <div className="tpl-ms__gap" />
          <HistoryGroup
            title="画布"
            icon="Canvas"
            items={canvases}
            selected={selected}
            collapsed={collapsed}
            onSelect={(id) => open('canvas', id)}
            onNew={() => add('canvas', setCanvases, '未命名画布')}
            onRemove={(id) => setCanvases((list) => list.filter((c) => c.id !== id))}
            onRename={(id, name) => setCanvases((list) => list.map((c) => (c.id === id ? { ...c, text: name } : c)))}
            onPin={(id) => pin(setCanvases, id)}
            onAll={() => onNavigate?.('assets')}
            // 演示：新标签页打开画布模板（不套网站外壳）
            onOpenNewTab={() => window.open(`${location.pathname}#/app/canvas`, '_blank', 'noopener')}
          />
        </Menu>
      </aside>
    </div>
  );
}

// ---------- 输入框：能打字、加参考、选参数，点生成没反应 ----------

const PLACEHOLDER: Record<string, string> = {
  agent: '输入想法、剧本或上传参考，支持「/」使用技能，@ 添加主体，和 Agent 一起创作',
  image: '描述你想生成的图片，可以上传参考图',
  video: '描述你想生成的视频，@ 引用参考素材',
  audio: '描述你想生成的声音，或者输入要念的文字',
};

// 主站输入框贴在页面底部：工具条里的下拉、面板都往上弹（Dropdown 默认往下，用的地方改方向；放不下自己翻）
const UP = 'top-start' as const;

/** 任务类型后面那一组：Agent 是模型、技能、模式；图片、视频、音频是各自的模型和参数（kivi/generation 那一份） */
type Placement = 'top-start' | 'bottom-start';
const TOOLBAR: Record<string, (model: string, setModel: (m: string) => void, placement: Placement) => JSX.Element> = {
  agent: (_m, _s, placement) => <AgentControls placement={placement} skills={SKILL_ITEMS} skillCategories={SKILL_CATEGORIES} />,
  image: (model, setModel, placement) => <ImageModelControls placement={placement} model={model} onModelChange={setModel} />,
  video: (model, setModel, placement) => <VideoModelControls placement={placement} model={model} onModelChange={setModel} />,
  audio: (model, setModel, placement) => <AudioModelControls placement={placement} model={model} onModelChange={setModel} />,
};

/**
 * 主站输入框（PromptBox）。对话页贴在底部（下拉往上弹）；创作首页在上面（下拉往下弹）。
 * 创作首页「生成」「画布」两种模式用同一个输入框、一样大（11-10 用户定，新版需求画布的输入框不变矮），只是提交去的地方不同
 */
export function Composer({ placement = UP, onSubmit }: { placement?: Placement; onSubmit?: () => void }) {
  const [task, setTask] = useState('agent');
  const [text, setText] = useState('');
  // 每种任务各记一个模型，生成按钮的消耗跟着它走
  const [models, setModels] = useState<Record<string, string>>({ image: DEFAULT_MODEL.image, video: DEFAULT_MODEL.video, audio: DEFAULT_MODEL.audio });
  const setModel = (m: string) => setModels((old) => ({ ...old, [task]: m }));
  const audioModel = models.audio;
  const [items, setItems] = useState<ReferenceStackItem[]>([
    { id: 'c1', type: 'image', name: '图片1', src: img('kiwi-glass', '1:1') },
    { id: 'c2', type: 'image', name: '图片2', src: img('kiwi-light', '1:1') },
  ]);
  const pool: PlaceholderImageName[] = ['ip-peek', 'bunny-gouache', 'monstera-dots', 'kivi-future', 'ip-gouache'];
  const add = () =>
    setItems((list) => [...list, { id: `c${Date.now()}`, type: 'image', name: referenceName(list, 'image'), src: img(pool[list.length % pool.length], '1:1') }]);
  // 把文件拖到输入框上：加进参考区（缩略图用占位图，图片用本地预览）
  const dropFiles = (files: File[]) =>
    setItems((list) => {
      let next = list;
      files.forEach((f, i) => {
        const type: ReferenceType = f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'image';
        const src = type === 'image' ? URL.createObjectURL(f) : type === 'video' ? img(pool[(next.length + i) % pool.length], '1:1') : undefined;
        next = [...next, { id: `c${Date.now()}-${i}`, type, name: referenceName(next, type), src, duration: type === 'video' ? '5s' : type === 'audio' ? '15s' : undefined }];
      });
      return next;
    });
  const submit = () => {
    if (!onSubmit) return;
    setText('');
    onSubmit();
  };
  return (
    <PromptBox
      value={text}
      onChange={setText}
      onDropFiles={dropFiles}
      placeholder={PLACEHOLDER[task]}
      references={<ReferenceStack items={items} onAdd={add} onRemove={(id) => setItems((list) => list.filter((i) => i.id !== id))} />}
      toolbar={
        <>
          <TaskSelect placement={placement} value={task} onChange={setTask} />
          {TOOLBAR[task](models[task], setModel, placement)}
        </>
      }
      actions={
        // 主站一律用猕猴桃生成按钮（圆形发送按钮只给画布 Agent）。音频没有张数，换成字数 / 上限。只能看，点了不生成
        <>
          {task === 'audio' ? <AudioCharCount count={text.length} model={audioModel} /> : <CountSelect placement={placement} />}
          <GenerateButton cost={demoCost(task, models[task])} onClick={submit} />
        </>
      }
    />
  );
}

// ---------- 整页 ----------

/** 创作页主区（生成记录 + 底部输入框，侧栏在 UI 页面预览的外壳里）：只能看。点完成的图全屏看大图 */
/** 右上角：余额（猕猴桃）和头像。主站每一页都有（画布页没有），挂在外壳 KiviApp 上，不跟着页面换 */
export function Wallet() {
  return (
    <div className="tpl-ms__wallet">
      <span className="tpl-ms__balance" aria-label="余额 200">
        <Icon name="Kiwi" />
        200
      </span>
      <Avatar name="KIVI" size={32} src={img('ip-peek', '1:1')} />
    </div>
  );
}

export function CreatePage() {
  const [preview, setPreview] = useState<string | null>(null);
  const feed = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLDivElement>(null);
  const [composerH, setComposerH] = useState(220);

  // 输入框浮在记录流上，记录流底部留出它的高度；输入框变高（加参考、打长字）跟着变
  useLayoutEffect(() => {
    const el = composer.current;
    if (!el) return;
    const measure = () => setComposerH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 和线上一样，进来停在最新一条（最下面）
  useLayoutEffect(() => {
    const el = feed.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // 点格子空白处看大图；点的是格子里的按钮就不打开
  const open = (src?: string) => (e: MouseEvent) => {
    if (!src || (e.target as HTMLElement).closest('button, video')) return;
    setPreview(src);
  };

  const tile = (t: Tile, key: number, ratio: PlaceholderImageRatio, span: number) => {
    const done = !t.status || t.status === 'done';
    return (
      <ResultTile
        key={key}
        type={t.video ? 'video' : undefined}
        status={t.status}
        src={t.video ?? t.src}
        poster={t.video ? t.src : undefined}
        badge={t.badge}
        topActions={TOP}
        collect={done || undefined}
        defaultCollected={t.collected}
        quickActions={done ? (t.video ? QUICK_VIDEO : QUICK_IMAGE) : undefined}
        data-span={span > 1 ? String(span) : undefined}
        style={{ aspectRatio: ratio.replace(':', ' / '), cursor: done && !t.video ? 'zoom-in' : undefined }}
        onClick={done && !t.video ? open(t.src) : undefined}
      />
    );
  };

  return (
    <>
      <main className="tpl-ms__main" style={{ '--tpl-composer-h': `${composerH}px` } as CSSProperties}>
        <div ref={feed} className="tpl-ms__feed">
          <div className="tpl-ms__column">
            {RECORDS.map((r) =>
              r.kind === 'agent' ? (
                <div key={r.id} className="tpl-turn">
                  <UserMessage assets={<ReferenceItem src={img('kiwi-light', '1:1')} />}>参考这张图，做 4 张科幻风格的猕猴桃竖版海报</UserMessage>
                  <div className="tpl-text">好的，我先看看参考图的风格。</div>
                  <ProcessGroup steps={AGENT_STEPS} />
                  <div className="tpl-text">参考图是冷色宇宙背景加漂浮的猕猴桃切片，下面按这个风格生成 4 张竖版海报。</div>
                  <div className="tpl-grid">{AGENT_RESULTS.map((src, i) => tile({ src }, i, '9:16', 1))}</div>
                  <MessageFeedback text="参考图是冷色宇宙背景加漂浮的猕猴桃切片，下面按这个风格生成 4 张竖版海报。" traceId="trace-4c9d07" />
                </div>
              ) : (
                <div key={r.id} className="tpl-record">
                  <GenPrompt prompt={r.prompt}>{r.tags}</GenPrompt>
                  <div className="tpl-grid" data-cols={gridOf(r.ratio, r.tiles.length).cols === 3 ? '3' : undefined}>
                    {r.tiles.map((t, i) => tile(t, i, r.ratio, gridOf(r.ratio, r.tiles.length).span))}
                  </div>
                  <div className="tpl-row">
                    <Button variant="light">重新编辑</Button>
                    <Button variant="light">再次生成</Button>
                    <Button variant="light">删除整组</Button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
        <div ref={composer} className="tpl-ms__composer">
          <Composer />
        </div>
      </main>
      <Dialog size="full" title="预览" open={preview !== null} onOpenChange={(v) => !v && setPreview(null)}>
        {preview && <img src={preview} alt="预览" style={{ display: 'block', maxWidth: '100%', maxHeight: '75vh', margin: '0 auto', objectFit: 'contain' }} />}
      </Dialog>
    </>
  );
}
