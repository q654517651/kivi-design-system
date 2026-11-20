import { GEN_PARAM_DEFAULTS, DEFAULT_MODEL, genCost, placeholderImageSrc, type PlaceholderImageName } from '@kivi';
import { DEMO_AUDIO, DEMO_VIDEO } from '../mock';
import type { AgentTurn, Asset, Chat, DB, Media, Ratio, Task } from '../types';

/*
  创作页（主站）的种子数据：对话、对话里的生成任务和它们的结果素材。
  - 第一个对话 chat-1 装原来演示页里的五条记录（r1–r5）和一轮已经回复完的 Agent（a1，结果是任务 r-a1 的 4 张竖图）。
  - 其余对话各放一条简单任务，按标题配了提示词。
  - 结果素材（Asset）和任务一一对应：每一格结果一个素材，收藏照原来。
  - 生成中的两条（r4、r5）是 hold：一直停着摆样子，角标固定显示 holdLeft 秒（照原来的「59s 生成中」「32s 生成中」）。
*/

const MIN = 60_000;
const NOW = Date.now();

type Tile = { img: PlaceholderImageName; collected?: boolean } | 'failed' | 'running';

interface Rec {
  id: string;
  /** 生成中摆样子时角标固定的秒数 */
  holdLeft?: number;
  prompt: string;
  media: Media;
  model: string;
  params: Record<string, string>;
  ratio: Ratio;
  refs?: Task['refs'];
  refLabel?: string;
  tiles: Tile[];
  /** 几分钟前生成的 */
  ago: number;
}

const still = (name: PlaceholderImageName, ratio: Ratio) => placeholderImageSrc(name, ratio);

function build(chatId: string, r: Rec): { task: Task; assets: Asset[] } {
  const createdAt = NOW - r.ago * MIN;
  const running = r.tiles.some((t) => t === 'running');
  const assets: Asset[] = [];
  const outputs: Task['outputs'] = r.tiles.map((t, i) => {
    if (t === 'running') return { status: 'running' as const };
    if (t === 'failed') return { status: 'failed' as const };
    const id = `s-${r.id}-${i}`;
    assets.push({
      id,
      media: r.media,
      ratio: r.ratio,
      ...(r.media === 'video'
        ? { src: DEMO_VIDEO.wide, poster: still(t.img, r.ratio), duration: '0:05' }
        : r.media === 'audio'
          ? { src: DEMO_AUDIO, duration: '0:12' }
          : { src: still(t.img, r.ratio) }),
      name: `${r.media === 'video' ? '视频生成' : r.media === 'audio' ? '音频生成' : '图片生成'} ${i + 1}`,
      createdAt,
      source: 'create',
      taskId: r.id,
      collected: t.collected ?? false,
      folderIds: [],
    });
    return { status: 'done' as const, assetId: id };
  });
  const task: Task = {
    id: r.id,
    kind: 'gen',
    media: r.media,
    where: { page: 'create', chatId },
    prompt: r.prompt,
    model: r.model,
    params: r.params,
    refs: r.refs ?? [],
    refLabel: r.refLabel,
    ratio: r.ratio,
    outputs,
    cost: genCost(r.media, r.model) * r.tiles.length,
    createdAt,
    dueAt: createdAt + 60_000,
    status: running ? 'running' : 'done',
    hold: running || undefined,
    holdLeft: r.holdLeft,
  };
  return { task, assets };
}

// ---------- 第一个对话：原来演示页里的记录 ----------

const kiwiGlass = still('kiwi-glass', '1:1');
const kiwiLight = still('kiwi-light', '1:1');

const CHAT1: Rec[] = [
  {
    id: 'r1',
    prompt:
      '生成一张赛博朋克风格的猕猴桃海报：雨夜的未来都市街头，巨大的全息广告牌上漂浮着一颗被剖开的发光猕猴桃，果肉是荧光绿、籽像电路板上的光点。前景是撑着透明雨伞的行人剪影，地面积水倒映出紫色和青色的霓虹。画面上方用粗壮的未来感字体写「KIVI」，下方一行小字「TASTE THE FUTURE」。整体高对比、强烈的色彩撞击，电影级光影，竖版构图，细节丰富，适合做活动主视觉。',
    media: 'image',
    model: 'seedream-4.5',
    params: { resolution: '2K', ratio: '1:1' },
    ratio: '1:1',
    tiles: [{ img: 'kivi-future' }, { img: 'monstera-dots', collected: true }, { img: 'kiwi-light' }, { img: 'ip-gouache' }],
    ago: 50,
  },
  {
    id: 'r2',
    prompt: '猕猴桃从空中落进果汁杯，溅起水花，镜头慢慢推近，夏日清爽的广告质感',
    media: 'video',
    model: 'seedance-2.0-fast',
    params: { resolution: '720P', ratio: '16:9', duration: '8' },
    ratio: '16:9',
    refs: [
      { type: 'image', src: kiwiGlass, label: '图片1' },
      { type: 'image', src: kiwiLight, label: '图片2' },
      { type: 'video', src: still('kivi-future', '16:9'), label: '视频1' },
      { type: 'audio', src: DEMO_AUDIO, label: '音频1' },
    ],
    refLabel: '全能参考',
    tiles: [{ img: 'kivi-future' }],
    ago: 40,
  },
  {
    id: 'r3',
    prompt: '水粉画风格的兔子抱着猕猴桃，暖色调，纸张纹理，儿童绘本插画',
    media: 'image',
    model: 'nano-banana-2',
    params: { resolution: '2K', ratio: '3:4' },
    ratio: '3:4',
    refs: [
      { type: 'image', src: still('ip-gouache', '1:1'), label: '图片1' },
      { type: 'image', src: kiwiLight, label: '图片2' },
    ],
    refLabel: '参考图',
    tiles: [{ img: 'bunny-gouache' }, { img: 'ip-gouache' }, 'failed', { img: 'ip-peek' }],
    ago: 30,
  },
  {
    id: 'r4',
    holdLeft: 59,
    prompt: 'KIVI 吉祥物从屏幕边缘探出头，眨眼打招呼，竖版短视频',
    media: 'video',
    model: 'kling-v3-omni',
    params: { resolution: '1080P', ratio: '9:16', duration: '5' },
    ratio: '9:16',
    tiles: ['running'],
    ago: 2,
  },
  {
    id: 'r5',
    holdLeft: 32,
    prompt: '极繁主义的未来城市，霓虹灯牌写着 KIVI，宽银幕电影构图',
    media: 'image',
    model: 'seedream-4.5',
    params: { resolution: '4K', ratio: '16:9' },
    ratio: '16:9',
    tiles: ['running', 'running', 'running', 'running'],
    ago: 1,
  },
];

// ---------- 其余对话：标题 + 一条简单任务 ----------

/** 标题、类型（i 图片 / v 视频 / a 音频）、提示词 */
const SIMPLE: [string, 'i' | 'v' | 'a', string][] = [
  ['吉祥物探头短视频', 'v', 'KIVI 吉祥物从画面边缘探出头打招呼，轻快的节奏，竖版短视频'],
  ['赛博朋克城市概念图', 'i', '赛博朋克风格的未来城市夜景，霓虹灯牌，雨后的街道，电影感构图'],
  ['水粉兔绘本插画', 'i', '水粉画风格的兔子抱着猕猴桃，暖色调，儿童绘本插画'],
  ['新品开箱口播脚本', 'a', '大家好，今天给大家开箱一款新品，先来看看包装，质感真的很不错'],
  ['中秋礼盒包装', 'i', '中秋节礼盒包装设计，金色和深绿配色，月亮与桂花元素，高级质感'],
  ['小红书封面三连', 'i', '小红书风格的封面图，柔和的马卡龙配色，大标题留白，生活方式主题'],
  ['咖啡店菜单排版', 'i', '精品咖啡店菜单，手绘插画风格，米色纸张纹理，排版清爽'],
  ['游戏角色立绘', 'i', '二次元游戏角色立绘，猕猴桃主题的少女，绿色渐变长发，全身，干净背景'],
  ['国潮风格插画', 'i', '国潮风格插画，祥云与仙鹤，红金配色，传统纹样与现代构图结合'],
  ['产品白底图精修', 'i', '玻璃杯装的猕猴桃汁产品图，纯白背景，柔和投影，电商主图'],
  ['短剧分镜第一集', 'i', '短剧分镜草图，咖啡馆里两个人对视的特写，电影感打光，黑白线稿'],
  ['节日红包封面', 'i', '新年红包封面，红色底，金色猕猴桃与祥云，喜庆又有设计感'],
  ['露营装备种草图', 'i', '森林边的露营地，帐篷、折叠椅和暖光灯串，清晨薄雾，种草图风格'],
  ['宠物写真', 'i', '一只金毛犬坐在草地上，逆光，毛发发光，温暖的日落，写真风格'],
  ['电商详情页长图', 'i', '猕猴桃礼盒电商详情页首屏，大图加卖点文案，清新绿色调'],
  ['品牌 Slogan 想法', 'i', '品牌视觉海报，大字 Slogan「鲜活每一天」，猕猴桃切面为主视觉'],
  ['复古胶片人像', 'i', '复古胶片风格人像，颗粒感，暖黄色调，街头抓拍，浅景深'],
  ['城市夜景延时', 'v', '城市夜景延时摄影，车流拉出光轨，云层快速流动，航拍视角'],
  ['赛车海报', 'i', '赛车主题海报，红色跑车在赛道上漂移，速度线，粗体字标题'],
  ['儿童绘本第二章', 'i', '儿童绘本插画，小熊在森林里发现一颗发光的猕猴桃，柔和水彩'],
  ['健身课程封面', 'i', '健身课程封面，教练在明亮的工作室里做拉伸，活力橙绿配色'],
  ['口红试色图', 'i', '口红试色图，六支不同色号并排，手臂试色，柔光，美妆博主风格'],
  ['书店活动海报', 'i', '独立书店阅读活动海报，手绘书架与咖啡，温暖的黄色灯光'],
  ['手机壁纸一组', 'i', '手机壁纸，极简渐变背景，一颗悬浮的猕猴桃，竖版，柔和光晕'],
  ['早餐广告短片', 'v', '早餐广告短片，牛奶倒进麦片碗，阳光洒进厨房，慢动作，食欲感'],
  ['毕业季合照修图', 'i', '毕业季合照，学士服抛帽瞬间，蓝天草地，明亮清透的日系色调'],
  ['旅行 Vlog 片头', 'v', '旅行 Vlog 片头，镜头从地图推向海边小镇，手写字体标题弹出'],
  ['音乐节主视觉', 'i', '夏日音乐节主视觉，舞台灯光与人群剪影，高饱和的渐变色，动感'],
  ['护肤品氛围图', 'i', '护肤品氛围图，水珠与绿叶，通透的浅绿背景，产品居中，柔和高光'],
];

const POOL: PlaceholderImageName[] = ['kivi-future', 'ip-gouache', 'kiwi-light', 'bunny-gouache', 'monstera-dots', 'ip-peek', 'ip-kiwi-pile', 'ip-future'];

// ---------- 拼起来 ----------

const tasks: Task[] = [];
const assets: Asset[] = [];
const chats: Chat[] = [];

// chat-1 里那一轮 Agent：用户带一张参考图要 4 张竖版海报，已经回复完
const agentTurns: AgentTurn[] = [];
{
  const prompt = '参考这张图，做 4 张科幻风格的猕猴桃竖版海报';
  const built = build('chat-1', {
    id: 'r-a1',
    prompt,
    media: 'image',
    model: 'seedream-4.5',
    params: { resolution: '2K', ratio: '9:16' },
    ratio: '9:16',
    tiles: [{ img: 'kiwi-glass' }, { img: 'kivi-future' }, { img: 'kiwi-light' }, { img: 'monstera-dots' }],
    ago: 35,
  });
  tasks.push(built.task);
  assets.push(...built.assets);
  const say = (text: string) => ({ kind: 'text' as const, text, shown: text.length });
  agentTurns.push({
    id: 'a1',
    chatId: 'chat-1',
    user: { text: prompt, refs: [{ type: 'image', src: still('kiwi-light', '1:1') }] },
    script: 'image-poster',
    step: 99,
    beatAt: NOW - 35 * MIN,
    status: 'done',
    createdAt: NOW - 36 * MIN,
    blocks: [
      say('好的，我先看看参考图的风格。'),
      {
        kind: 'tools',
        steps: [
          { icon: 'Skill', action: '加载技能', object: '海报设计' },
          { icon: 'ScanEye', action: '查看链接内容', object: '参考图' },
        ],
        shown: 2,
        done: true,
      },
      say('参考图是冷色宇宙背景加漂浮的猕猴桃切片，下面按这个风格生成 4 张竖版海报。'),
      { kind: 'task', taskId: 'r-a1' },
    ],
  });
}

// chat-1：原来的记录，Agent 那一轮夹在 r2 和 r3 之间
{
  const items: Chat['items'] = [];
  for (const r of CHAT1) {
    const built = build('chat-1', r);
    tasks.push(built.task);
    assets.push(...built.assets);
    items.push({ kind: 'task', taskId: r.id });
    if (r.id === 'r2') items.push({ kind: 'agent', id: 'a1' });
  }
  chats.push({ id: 'chat-1', title: '猕猴桃饮料夏日海报', updatedAt: NOW - 3 * MIN, items });
}

SIMPLE.forEach(([title, kind, prompt], i) => {
  const media: Media = kind === 'v' ? 'video' : kind === 'a' ? 'audio' : 'image';
  const chatId = `chat-${i + 2}`;
  const defaults = GEN_PARAM_DEFAULTS[media];
  const built = build(chatId, {
    id: `t-${chatId}`,
    prompt,
    media,
    model: DEFAULT_MODEL[media],
    params: { ...defaults },
    ratio: media === 'video' ? '16:9' : '1:1',
    tiles: [{ img: POOL[i % POOL.length] }],
    ago: 120 + i * 90,
  });
  tasks.push(built.task);
  assets.push(...built.assets);
  chats.push({ id: chatId, title, updatedAt: built.task.createdAt, items: [{ kind: 'task', taskId: built.task.id }] });
});

export const CREATE_SEED: Pick<DB, 'chats' | 'tasks' | 'assets' | 'agentTurns'> = { chats, tasks, assets, agentTurns };
