import { treeAncestors, type AttachmentItem, type TreeNode } from '@kivi';
import { DEMO_VIDEO, PICS, pic } from './mock';
import type { Ratio } from './types';

/*
  探索页的只读目录：作品（发现）、创作精选 / 工作流、公开技能，都是演示数据，不存本机。
  收藏不在这里，在 db.favorites（data/favorites.ts）。占位图从 mock.ts 拿。
  页面只读这里，不自己造数据。
*/

export const RATIO: Record<Ratio, number> = { '1:1': 1, '3:4': 3 / 4, '16:9': 16 / 9, '9:16': 9 / 16 };

export const AUTHORS = [
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
export const CLIPS = ['jellyfish', 'road', 'flower', 'stars'].map((n) => ({
  video: `./placeholders/video/clip-${n}.mp4`,
  /** 封面图用视频第一帧，悬停开播时画面接得上 */
  poster: `./placeholders/video/clip-${n}.jpg`,
}));

/** 素材大类和小类：随知识库分类配置，这里是演示 */
export const DISCOVER_CATEGORIES: Record<string, string[]> = {
  视觉: ['海报', '插画', 'KV'],
  礼物: ['礼物', '座驾', '头像框', '麦圈', '勋章'],
  游戏: ['角色', '图标', '场景'],
  品牌: ['Logo', 'IP 形象', '物料'],
  // 没归进上面几类的放「其他」，没有小类（11-20 用户定：探索页所有分类最后都有「其他」）
  其他: [],
};
export const CATS = Object.keys(DISCOVER_CATEGORIES);

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
const RATIOS: Ratio[] = ['3:4', '1:1', '9:16', '3:4', '16:9', '1:1', '3:4', '9:16', '1:1', '16:9'];

export interface Work {
  id: string;
  video: boolean;
  ratio: Ratio;
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
    src: video ? (clip ? clip.video : DEMO_VIDEO.tall) : cover,
    poster: video ? cover : undefined,
    prompt: PROMPTS[i % PROMPTS.length],
    author: AUTHORS[(i * 5) % AUTHORS.length],
    likes: (i * 37) % 260,
    category,
    sub: subs.length ? subs[Math.floor(i / CATS.length) % subs.length] : '',
    model: video ? 'Seedance 2.0' : ['Nano Banana 2.1', 'Seedream 4.0', 'GPT Image 1'][i % 3],
    date: `2026-11-${String(9 - (i % 9)).padStart(2, '0')}`,
    refs: Array.from({ length: i % 5 }, (_, j) => ({ id: `w${i}-r${j}`, type: 'image' as const, name: `图片${j + 1}`, src: pic(i + j + 2) })),
  };
});

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
export const FLOW_CATEGORIES = ['品牌', 'UI', '游戏', '视觉', '礼物', '其他'];
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

/** 分类：从现有技能分类数据读，这里是演示 */
export const SKILL_CATS = ['礼物', '游戏', '品牌', '活动', '其他'];
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
    /** 发布时间（按时间排序用）：越往后越早 */
    publishedAt: Date.UTC(2026, 10, 20) - i * 9 * 3600_000,
    /** 用了多少次（按用量排序用） */
    uses: (i * 7919) % 5000,
  };
});
export type ExploreSkill = (typeof SKILLS)[number];


/** 技能包里的文件：默认看 SKILL.md，有别的文件可以切过去看（需求「公共技能 · 技能详情」）。切文件是一棵文件树（照线上） */
export const SKILL_FILES = ['SKILL.md', 'references/风格指南.md', 'examples/示例.md'];
export const SKILL_TREE: TreeNode[] = [
  { id: 'SKILL.md', name: 'SKILL.md' },
  { id: 'references', name: 'references', children: [{ id: 'references/风格指南.md', name: '风格指南.md' }] },
  { id: 'examples', name: 'examples', children: [{ id: 'examples/示例.md', name: '示例.md' }] },
];
/** 打开时展开哪些文件夹：照线上，第一个文件夹 + 当前文件的上层 */
export const skillTreeExpanded = (file: string) => {
  const first = SKILL_TREE.find((n) => n.children)?.id;
  return Array.from(new Set([...(first ? [first] : []), ...treeAncestors(SKILL_TREE, file)]));
};
