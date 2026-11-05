import type { IconName } from '../icons';
import type { SelectOption, SliderMark } from '../selection';

/*
  生成用的产品选项：任务、模型、比例、尺寸、背景、音色、张数、Agent 模式。
  画布生成面板、主站输入框、Agent 输入框只用这一份，选项、顺序、图标都在这里定，两边不再各写各的（2026-10-29 用户定）。
  线上的清单是后端按策略下发的；这里照线上写显示名，顺序是示例，接入时可以整体换掉。
*/

/** 任务类型：照 Figma「模板 · 主站」输入框的顺序 */
export const TASKS: SelectOption[] = [
  { value: 'agent', label: 'Agent', icon: 'Agent' },
  { value: 'image', label: '图片生成', icon: 'ImageGeneration' },
  { value: 'video', label: '视频生成', icon: 'VideoGeneration' },
  { value: 'audio', label: '音频生成', icon: 'Audio' },
];

/** 参考方式：主站的下拉和画布视频面板顶上那排选项卡都用这个顺序 */
export const REF_MODES: SelectOption[] = [
  { value: 'omni', label: '全能参考', icon: 'OmniReference' },
  { value: 'frames', label: '首尾帧', icon: 'FirstLastFrame' },
  { value: 'edit', label: '视频编辑', icon: 'VideoEditing' },
  { value: 'extend', label: '视频延长', icon: 'VideoExtend' },
];

/** 模型的类型：文字（对话）/ 图片 / 视频 / 音频 */
export type ModelType = 'text' | 'image' | 'video' | 'audio';

/**
 * 模型，左边是模型 logo。照线上（ai-design-web 的 generation-policy 模型簇、canvas-action-registry 默认模型）：
 * 线上的清单和显示名是后端按策略下发的，这里照模型 id 写显示名，顺序是示例。文字照线上的对话模型列表
 */
export const MODELS: Record<ModelType, SelectOption[]> = {
  text: [
    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', icon: 'Gemini' },
    { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro', icon: 'Gemini' },
    { value: 'gpt-5.5', label: 'GPT-5.5', icon: 'Openai' },
    { value: 'gpt-5.4', label: 'GPT-5.4', icon: 'Openai' },
    { value: 'qwen-3.7-max', label: 'Qwen 3.7 Max', icon: 'Qwen' },
  ],
  image: [
    { value: 'gpt-image-2', label: 'GPT Image 2', icon: 'Openai' },
    { value: 'nano-banana-2', label: 'Nano Banana 2', icon: 'Gemini' },
    { value: 'nano-banana-pro', label: 'Nano Banana Pro', icon: 'Gemini' },
    { value: 'seedream-5-lite', label: 'Seedream 5 Lite', icon: 'Bytedance' },
    { value: 'seedream-4.5', label: 'Seedream 4.5', icon: 'Bytedance' },
    { value: 'qwen-image-3.0', label: 'Qwen Image 3.0', icon: 'Qwen' },
  ],
  video: [
    // 全能参考 + 生成音频
    { value: 'seedance-2.0', label: 'Seedance 2.0', icon: 'Bytedance' },
    { value: 'seedance-2.0-fast', label: 'Seedance 2.0 Fast', icon: 'Bytedance' },
    { value: 'seedance-2.5', label: 'Seedance 2.5', icon: 'Bytedance' },
    { value: 'kling-v3-omni', label: 'Kling V3 Omni', icon: 'Kling' },
    // 全能参考
    { value: 'gemini-omni-flash', label: 'Gemini Omni Flash', icon: 'Gemini' },
    { value: 'happyhorse', label: 'HappyHorse', icon: 'HappyHorse' },
    { value: 'wan-3.0', label: 'Wan 3.0', icon: 'Qwen' },
    // 只有首尾帧
    { value: 'veo-3.1-fast', label: 'Veo 3.1 Fast', icon: 'Gemini' },
    { value: 'sora-2', label: 'Sora 2', icon: 'Sora' },
    { value: 'grok-imagine-video-1.5', label: 'Grok Imagine Video 1.5', icon: 'grok' },
    { value: 'vidu-q3-pro', label: 'Vidu Q3 Pro', icon: 'Vidu' },
    { value: 'seedance-1.5-pro', label: 'Seedance 1.5 Pro', icon: 'Bytedance' },
  ],
  // 音频生成线上还在分支上（feat/v3.13_gen_audio）。ElevenLabs 的 Logo 图标库还没有，先不放
  audio: [
    { value: 'seed-audio-1.0', label: 'Seed Audio 1.0', icon: 'Bytedance' },
    { value: 'minimax-speech-2.8-hd', label: 'MiniMax Speech 2.8 HD', icon: 'Minimax' },
    { value: 'eleven-v4', label: 'Eleven V4' },
  ],
};

/** 视频模型分三类，决定参考方式和参数：只有首尾帧的不出参考方式（线上只有一项就不显示）；Seedance、Kling Omni 多「生成音频」 */
export const VIDEO_FIRST_LAST_ONLY = ['veo-3.1-fast', 'sora-2', 'grok-imagine-video-1.5', 'vidu-q3-pro', 'seedance-1.5-pro'];
export const VIDEO_WITH_AUDIO = ['seedance-2.0', 'seedance-2.0-fast', 'seedance-2.5', 'kling-v3-omni'];

/** 模型默认值：线上的默认模型 */
export const DEFAULT_MODEL: Record<ModelType, string> = {
  text: 'gemini-3.5-flash',
  image: 'gpt-image-2',
  video: 'seedance-2.0',
  audio: 'seed-audio-1.0',
};

const list = (values: string[]): SelectOption[] => values.map((v) => ({ value: v, label: v }));

/** 把一串值变成只有文字的选项，参数面板里的分段用 */
export const plainOptions = list;

export const SIZES = list(['1K', '2K', '4K']);
/** 图片比例：照线上的固定顺序，带比例图标；模型不支持的线上不显示 */
export const RATIOS: SelectOption[] = [
  { value: '智能', label: '智能', icon: 'AutoAspect' },
  { value: '1:1', label: '1:1', icon: 'Square11' },
  { value: '1:4', label: '1:4', icon: 'Square14' },
  { value: '4:1', label: '4:1', icon: 'Square41' },
  { value: '2:3', label: '2:3', icon: 'Square23' },
  { value: '3:2', label: '3:2', icon: 'Square32' },
  { value: '16:9', label: '16:9', icon: 'Square169' },
  { value: '9:16', label: '9:16', icon: 'Square916' },
  { value: '3:4', label: '3:4', icon: 'Square34' },
  { value: '4:3', label: '4:3', icon: 'Square43' },
  { value: '9:21', label: '9:21', icon: 'Square921' },
];
export const BACKGROUNDS: SelectOption[] = [
  { value: 'opaque', label: '不透明背景' },
  { value: 'transparent', label: '透明背景' },
];

/** 视频参数面板里的比例：竖排分段，带比例图标 */
export const VIDEO_RATIOS: [string, IconName][] = [
  ['智能', 'AutoAspect'],
  ['1:1', 'Square11'],
  ['4:3', 'Square43'],
  ['3:4', 'Square34'],
  ['16:9', 'Square169'],
  ['9:16', 'Square916'],
];

/** 音色试听：演示没有真的音色文件，借演示视频的声音（同 canvas 的音频节点）。接入时换成各音色自己的试听地址 */
const VOICE_SAMPLE = './placeholders/video/kivi-demo-9x16.mp4';
/** 音色列表：左边带试听；「不使用音色」没有试听 */
const voices = (names: string[]): SelectOption[] =>
  names.map((n) => ({ value: n, label: n, preview: n === '不使用音色' ? undefined : VOICE_SAMPLE }));
/** 音色：跟着模型变，第一个是默认。线上 Seed 16 个、MiniMax 17 个、Eleven 21 个，这里各放几个 */
export const VOICES: Record<string, SelectOption[]> = {
  'seed-audio-1.0': voices(['不使用音色', '温柔女声', '沉稳男声', '活力少女', '磁性男声']),
  'minimax-speech-2.8-hd': voices(['知性姐姐', '温暖少女', '沉稳大叔', '播音男声']),
  'eleven-v4': voices(['瑞秋', '亚当', '贝拉', '安东尼']),
};
/** 张数：线上是 x1 / x2 / x4 */
export const COUNTS: SelectOption[] = [1, 2, 4].map((n) => ({ value: String(n), label: `x${n}` }));
/** 音频字数上限，按模型 */
export const AUDIO_CHAR_LIMIT: Record<string, number> = { 'seed-audio-1.0': 3000, 'minimax-speech-2.8-hd': 10000, 'eleven-v4': 5000 };

/** 刻度：每 every 一条线，每 labelEvery 写一个数字 */
export function ticks(min: number, max: number, every: number, labelEvery: number, fmt: (v: number) => string = String): SliderMark[] {
  const out: SliderMark[] = [];
  for (let v = min; v <= max + 1e-9; v += every) {
    const r = Math.round(v * 100) / 100;
    out.push({ value: r, label: Math.abs(((r - min) / labelEvery) % 1) < 1e-9 ? fmt(r) : undefined });
  }
  return out;
}

// ---------- Agent ----------
// 照线上 Agent 输入框底栏（ai-chat SenderFooter）：选择模型、技能、模式（手动 / 自动）。主站输入框切到 Agent 时用这一组

/** Agent 模式：手动是每次生成前询问，自动是直接生成 */
export const AGENT_MODES: SelectOption[] = [
  { value: 'manual', label: '手动模式', icon: 'Hand', description: 'Agent在每次生成前询问' },
  { value: 'auto', label: '自动生成', icon: 'Auto', description: 'Agent完全自动生成' },
];

/** Agent 能用的生成模型：线上面板只有图片、视频两组，每个带一行说明（线上是后端下发的，这里是示例） */
const GEN_MODEL_DESC: Record<string, string> = {
  'gpt-image-2': '理解复杂指令，排版能力强',
  'nano-banana-2': '多语言能力强，表现力好',
  'nano-banana-pro': '编辑能力最强，效果最好',
  'seedream-5-lite': '出图快，适合批量',
  'seedream-4.5': '支持多图参考和 4K',
  'qwen-image-3.0': '中文文字渲染好',
  'seedance-2.0': '多镜头叙事，音画同出',
  'seedance-2.0-fast': '更快的 Seedance 2.0',
  'seedance-2.5': '画面更稳，运动更自然',
  'kling-v3-omni': '人物运动自然',
};
/** Agent 能选的生成模型：图片、视频两组，每组最多同时选 4 个（照线上 MAX_GEN_MODEL_PER_CATEGORY） */
export const GEN_MODEL_GROUPS: { type: 'image' | 'video'; label: string; options: SelectOption[] }[] = [
  { type: 'image', label: '图片', options: MODELS.image.map((m) => ({ ...m, description: GEN_MODEL_DESC[m.value] })) },
  { type: 'video', label: '视频', options: MODELS.video.map((m) => ({ ...m, description: GEN_MODEL_DESC[m.value] })) },
];
export const GEN_MODEL_MAX = 4;
