import type { Media, Ratio } from './types';

/*
  Agent 的假回复剧本，一步步播出来：思考、说话、工具调用、生成（不出确认卡）、等结果（创作页没有推荐问题，11-18 用户定）。
  挑哪组看用户这条消息带了什么素材（11-20 用户定，创作页和画布一样）：
  - 带了图片 → 生成图片；带了视频 → 生成视频；带了音频 → 生成音频；几种都带了从里面随机挑一种
  - 什么都没带 → 闲聊，不生成
  每组几个剧本随机抽，话术和生成的内容（张数、比例、模型）都不一样。
  文字里的 {prompt} 换成用户发的话（截短），{refs} 换成附件的说法。加剧本只改这里。
*/

export interface ScriptGenerate {
  media: Media;
  count: number;
  ratio: Ratio;
  /** 模型 id（generation/options.ts） */
  model: string;
  params: Record<string, string>;
  /** 每张多少猕猴桃 */
  unitCost: number;
}

export type Beat =
  | { think: string }
  | { say: string }
  | { tools: { icon: string; action: string; object?: string }[] }
  /** 直接提交生成（扣费），等结果出来再往下走 */
  | { generate: ScriptGenerate };

/** 剧本分组：闲聊不生成，其余按产出分 */
export type ScriptKind = 'chat' | Media;

export interface AgentScript {
  id: string;
  kind: ScriptKind;
  beats: Beat[];
}

const image = (count: number, ratio: Ratio, model: string, unitCost: number): Beat => ({
  generate: { media: 'image', count, ratio, model, params: { resolution: '2K', ratio }, unitCost },
});
const video = (ratio: Ratio, model: string, duration: string, unitCost: number): Beat => ({
  generate: { media: 'video', count: 1, ratio, model, params: { resolution: '720P', ratio, duration }, unitCost },
});
const audio = (model: string, unitCost: number): Beat => ({
  generate: { media: 'audio', count: 1, ratio: '1:1', model, params: {}, unitCost },
});

export const AGENT_SCRIPTS: AgentScript[] = [
  // ---------- 闲聊：没带素材 ----------
  {
    id: 'chat-advice',
    kind: 'chat',
    beats: [
      { think: '用户在问思路，不需要马上生成。先给出可执行的方向，再问要不要直接出图。' },
      { tools: [{ icon: 'SquareLibrary', action: '查询知识库', object: '设计案例' }] },
      {
        say: '关于「{prompt}」，可以从三个方向入手：\n1. 主体突出：画面只留一个视觉重点，背景做减法。\n2. 情绪先行：先定颜色和光线，再放内容，整体更统一。\n3. 系列感：同一套版式换不同主体，适合连续发布。\n传一张参考图给我，我可以按其中一个方向直接出图。',
      },
    ],
  },
  {
    id: 'chat-brainstorm',
    kind: 'chat',
    beats: [
      { think: '先发散几个方向，用户挑了再落地，避免一次生成浪费猕猴桃。' },
      { say: '先给你几个方向，挑一个我再动手：\n· 清新：浅绿底、大量留白、手写字标题\n· 潮流：高饱和撞色、粗体字、贴纸元素\n· 质感：深色背景、产品打光、极简排版' },
    ],
  },
  {
    id: 'chat-hello',
    kind: 'chat',
    beats: [
      { say: '你好，我是 KIVI 的创作助手。我可以帮你：\n· 带上图片：出海报、换背景、改风格\n· 带上视频：续写镜头、换画风、剪出精彩片段\n· 带上音频：配旁白、做配乐、换音色\n把素材拖进输入框，再说说你想要什么就行。' },
    ],
  },
  {
    id: 'chat-memory',
    kind: 'chat',
    beats: [
      { tools: [{ icon: 'Brain', action: '读取记忆', object: '偏好：竖版、简洁风格' }] },
      { think: '记忆里用户偏好竖版和简洁风格，回答时按这个偏好给建议。' },
      { say: '记得你平时偏好竖版、简洁的风格。「{prompt}」这个想法可以先定一个主色，再配一句短标题，画面别超过三个元素。需要的话把参考图发我，我直接按这个思路出。' },
    ],
  },

  // ---------- 带了图片：生成图片 ----------
  {
    id: 'image-poster',
    kind: 'image',
    beats: [
      { think: '用户想要一组海报。{refs}主体放中间，留出标题位置，竖版更适合手机传播。一次出 4 张，风格略有差别方便挑。' },
      { say: '好的，我先看看需求和参考。' },
      {
        tools: [
          { icon: 'Skill', action: '加载技能', object: '海报设计' },
          { icon: 'ScanEye', action: '查看参考内容', object: '参考图' },
          { icon: 'SquareLibrary', action: '查询知识库', object: '品牌规范' },
        ],
      },
      { say: '风格定了：主体居中、冷暖对比、顶部留标题区。下面按这个方向生成 4 张竖版海报。' },
      image(4, '9:16', 'seedream-4.5', 4),
      { say: '4 张海报生成好了，第 2 张的构图最稳，第 4 张颜色更跳。需要的话可以选一张继续细化。' },
    ],
  },
  {
    id: 'image-edit',
    kind: 'image',
    beats: [
      { say: '收到，我先看一下要改的地方。' },
      {
        tools: [
          { icon: 'ScanEye', action: '查看参考内容', object: '原图' },
          { icon: 'Skill', action: '加载技能', object: '智能编辑' },
        ],
      },
      { think: '保持原图构图和主体不变，只调整背景和光线；出 2 张方便对比。' },
      { say: '我会保留主体和构图，只换背景、统一光线，出 2 张给你对比。' },
      image(2, '1:1', 'nano-banana-2', 5),
      { say: '改好了，左边偏自然光，右边偏棚拍质感。' },
    ],
  },
  {
    id: 'image-style',
    kind: 'image',
    beats: [
      { think: '{refs}用户想换风格。先分析参考图的主体和配色，再迁移成插画风，保留人物轮廓。' },
      { tools: [{ icon: 'ScanEye', action: '查看参考内容', object: '参考图' }] },
      { say: '参考图的主体很清楚，我把它转成扁平插画风，配色保留原图的暖色调，横版构图留出文案位置。' },
      image(3, '16:9', 'gpt-image-2', 6),
      { say: '3 张插画风出好了。觉得线条太重的话告诉我，我再出一组更柔和的。' },
    ],
  },
  {
    id: 'image-product',
    kind: 'image',
    beats: [
      { say: '这是一张产品图，我来做几张电商主图。' },
      {
        tools: [
          { icon: 'Skill', action: '加载技能', object: '电商主图' },
          { icon: 'Brain', action: '读取记忆', object: '偏好：浅色背景' },
        ],
      },
      { think: '产品居中、浅色背景、柔光打底，3:4 适合商品详情页。出 1 张先看效果。' },
      image(1, '3:4', 'seedream-4.5', 4),
      { say: '主图好了：浅色背景、柔光，产品边缘做了轻微投影。要换成场景图也可以跟我说。' },
    ],
  },

  // ---------- 带了视频：生成视频 ----------
  {
    id: 'video-extend',
    kind: 'video',
    beats: [
      { think: '{refs}用户想接着这段视频往下拍。先看最后几帧的动作和光线，续写 5 秒，镜头保持连贯。' },
      { tools: [{ icon: 'ScanEye', action: '查看参考内容', object: '参考视频' }] },
      { say: '我看了视频结尾：主体在往画面右边走。接下来续写 5 秒，镜头跟着平移，结尾停在主体正脸。' },
      video('16:9', 'seedance-2.0-fast', '5', 30),
      { say: '续写好了，衔接处的光线我做了过渡。节奏想再快一点的话，我可以把时长压到 4 秒。' },
    ],
  },
  {
    id: 'video-restyle',
    kind: 'video',
    beats: [
      { say: '好的，我先看看这段视频。' },
      {
        tools: [
          { icon: 'ScanEye', action: '查看参考内容', object: '参考视频' },
          { icon: 'Skill', action: '加载技能', object: '视频风格化' },
        ],
      },
      { think: '保留原视频的运镜和动作，只把画面换成动画风格；竖版 9:16 适合短视频平台。' },
      { say: '运镜和动作不变，画面转成动画风，按竖版出一条。' },
      video('9:16', 'kling-v3-omni', '5', 40),
      { say: '动画风版本好了。想要更写实一点，可以换成「电影感」风格再出一条。' },
    ],
  },
  {
    id: 'video-short',
    kind: 'video',
    beats: [
      { think: '这是一个短视频需求。镜头节奏要轻快，开头 1 秒内给出主体，结尾留品牌露出。{refs}' },
      {
        tools: [
          { icon: 'Skill', action: '加载技能', object: '短视频脚本' },
          { icon: 'Brain', action: '读取记忆', object: '偏好：横版 16:9' },
        ],
      },
      { say: '我把镜头拆成三段：推近主体、主体动作、品牌定格。按你之前偏好的横版，做 10 秒。' },
      video('16:9', 'seedance-2.0', '10', 30),
      { say: '视频好了。如果节奏偏慢，我可以把第一段缩短，或者再出一个竖版。' },
    ],
  },

  // ---------- 带了音频：生成音频 ----------
  {
    id: 'audio-narration',
    kind: 'audio',
    beats: [
      { think: '{refs}用户给了一段声音，想用相近的音色念一段旁白。先听音色和语速，再生成。' },
      { tools: [{ icon: 'ScanEye', action: '查看参考内容', object: '参考音频' }] },
      { say: '参考音频是偏温柔的女声、语速适中。我用相近的音色把「{prompt}」念成一段旁白。' },
      audio('minimax-speech-2.8-hd', 6),
      { say: '旁白好了，停顿放在了每句话后面。想要更有激情一点可以跟我说。' },
    ],
  },
  {
    id: 'audio-music',
    kind: 'audio',
    beats: [
      { say: '收到，我先听一下这段音频。' },
      {
        tools: [
          { icon: 'ScanEye', action: '查看参考内容', object: '参考音频' },
          { icon: 'Skill', action: '加载技能', object: '配乐' },
        ],
      },
      { think: '参考音频节奏明快，适合做一段同风格的背景音乐，12 秒左右，开头淡入。' },
      { say: '节奏和情绪我抓到了，下面做一段同风格的背景音乐，开头淡入、结尾干净收住。' },
      audio('seed-audio-1.0', 8),
      { say: '配乐好了，可以直接拖到视频节点下面用。' },
    ],
  },
  {
    id: 'audio-voice',
    kind: 'audio',
    beats: [
      { think: '用户想换一个音色重新念这段内容。{refs}保持原来的语速和断句，只换音色。' },
      { tools: [{ icon: 'Brain', action: '读取记忆', object: '偏好：沉稳男声' }] },
      { say: '按你之前常用的沉稳男声，把这段重新念一遍，语速和断句和原音频保持一致。' },
      audio('eleven-v4', 10),
      { say: '换好了。觉得太低沉的话，我可以换成播音男声再来一版。' },
    ],
  },
];

/** 11-20 前存在本机的旧剧本名，刷新后还在播的接着播 */
const LEGACY: Record<string, string> = { poster: 'image-poster', edit: 'image-edit', video: 'video-short', advice: 'chat-advice', brainstorm: 'chat-brainstorm' };

export const scriptOf = (id: string) => AGENT_SCRIPTS.find((s) => s.id === (LEGACY[id] ?? id)) ?? AGENT_SCRIPTS[0];

/** 这条消息该走哪组：带了哪几种素材就从里面随机挑一种，什么都没带是闲聊 */
export function kindOf(refs: { type: Media | 'file' }[]): ScriptKind {
  const kinds = (['image', 'video', 'audio'] as const).filter((k) => refs.some((r) => r.type === k));
  return kinds.length ? kinds[Math.floor(Math.random() * kinds.length)] : 'chat';
}

/** 随机挑一个剧本；传了 avoid 尽量不和它重复（重新生成时换一个，还在同一组） */
export function pickScript(kind: ScriptKind, avoid?: string) {
  const group = AGENT_SCRIPTS.filter((s) => s.kind === kind);
  const pool = group.length > 1 ? group.filter((s) => s.id !== avoid) : group;
  return pool[Math.floor(Math.random() * pool.length)].id;
}
