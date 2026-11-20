import { GEN_PARAM_DEFAULTS, type GenParamLimits, type GenParamValues } from './GenParams';
import { DEFAULT_MODEL, MODELS } from './options';

/*
  模型能力表（11-18 用户定）：每个模型能接几个参考、哪些互斥、文字上限、支持哪些参数值。
  主站参考上下限、切模型参数回落、画布超上限换模型都读这一份。
  线上每个模型的上限是后端下发的（GET /api/model/generation_policy），仓库里没有真值：
  只有音频三个模型照线上测试样例，其余是示例值（按同类模型的公开规格估的），接入时整体换成后端下发的。
*/

/** 参考素材的三种类型 */
export type InputKind = 'image' | 'video' | 'audio';
/** 某种参考的数量范围 */
export interface InputRange {
  min: number;
  max: number;
}
/** 各类参考的数量范围。模型不收的类型是 0–0 */
export type InputLimits = Record<InputKind, InputRange>;
/** 各类参考现在有几个 */
export type InputCounts = Record<InputKind, number>;

type Range = [number, number];

interface ModelCaps {
  /** 参考的 min–max。图片、音频模型用 `default`；视频按参考方式分（omni / frames / edit / extend） */
  inputs: Record<string, Partial<Record<InputKind, Range>>>;
  /** 不能同时用的两类参考 */
  exclusive?: [InputKind, InputKind];
  /** 提示词最多多少个字符 */
  maxChars?: number;
  /** 支持哪些参数值，没写的参数全部支持 */
  params?: GenParamLimits;
  /** 能挂 Lora（照线上 SelectLora 组件），最多 4 个 */
  lora?: boolean;
}

const IMAGE = (max: number, params?: GenParamLimits): ModelCaps => ({ inputs: { default: { image: [0, max] } }, params });
const FRAMES_ONLY = (params?: GenParamLimits): ModelCaps => ({ inputs: { frames: { image: [1, 2] } }, params });
const FRAMES: Partial<Record<InputKind, Range>> = { image: [1, 2] };
const TEXT: ModelCaps = { inputs: { default: { image: [0, 4], video: [0, 1] } } };

const CAPS: Record<string, ModelCaps> = {
  // 文本模型（画布文本节点）：照线上 text_generation，图 0–4、视频 0–1，图片反推提示词、视频反推脚本用
  'gemini-3.5-flash': TEXT,
  'gemini-3.1-pro': TEXT,
  'gpt-5.5': TEXT,
  'gpt-5.4': TEXT,
  'qwen-3.7-max': TEXT,
  // 比例照线上规格（openspec preserve-dynamic-ratio-options：auto、1:1、3:4、4:3、16:9、9:16）；分辨率 1K / 2K / 4K 都给（11-20 用户要 4K）
  'gpt-image-2': IMAGE(10, { ratio: ['智能', '1:1', '3:4', '4:3', '16:9', '9:16'] }),
  'nano-banana-2': IMAGE(14),
  'nano-banana-pro': IMAGE(14),
  'seedream-5-lite': IMAGE(10),
  'seedream-4.5': IMAGE(10),
  'qwen-image-3.0': IMAGE(3, { resolution: ['1K', '2K'] }),
  // 带 Lora 的生图模型（照线上 image_lora 模板 qwen-image-2512），参考图只收 1 张（11-19 用户定）
  'qwen-image-2512': { ...IMAGE(1), lora: true },
  'seedance-2.0': { inputs: { omni: { image: [0, 9], video: [0, 3], audio: [0, 3] }, frames: FRAMES } },
  'seedance-2.0-fast': { inputs: { omni: { image: [0, 9], video: [0, 3], audio: [0, 3] }, frames: FRAMES } },
  'seedance-2.5': {
    inputs: {
      omni: { image: [0, 30], video: [0, 10], audio: [0, 10] },
      frames: FRAMES,
      edit: { video: [1, 1], image: [0, 4] },
      extend: { video: [1, 1], image: [0, 4] },
    },
  },
  'kling-v3-omni': { inputs: { omni: { image: [0, 7], video: [0, 1] }, frames: FRAMES } },
  'gemini-omni-flash': { inputs: { omni: { image: [0, 4] }, frames: FRAMES }, params: { resolution: ['720P', '1080P'] } },
  happyhorse: { inputs: { omni: { image: [0, 4] }, frames: FRAMES }, params: { resolution: ['720P', '1080P'] } },
  'wan-3.0': { inputs: { omni: { image: [0, 4] }, frames: FRAMES }, params: { resolution: ['720P', '1080P'] } },
  'veo-3.1-fast': FRAMES_ONLY({ duration: ['4', '6', '8'] }),
  'sora-2': FRAMES_ONLY({ duration: ['4', '8', '12'] }),
  'grok-imagine-video-1.5': FRAMES_ONLY(),
  'vidu-q3-pro': FRAMES_ONLY(),
  'seedance-1.5-pro': FRAMES_ONLY(),
  // 音频三个照线上测试样例
  'seed-audio-1.0': { inputs: { default: { image: [0, 1], audio: [0, 3] } }, exclusive: ['image', 'audio'], maxChars: 3000 },
  'minimax-speech-2.8-hd': { inputs: { default: {} }, maxChars: 10000 },
  'eleven-v4': { inputs: { default: {} }, maxChars: 5000 },
};

/** 音频字数上限，按模型：从能力表算出来 */
export const AUDIO_CHAR_LIMIT: Record<string, number> = Object.fromEntries(
  MODELS.audio.flatMap((m) => (CAPS[m.value]?.maxChars ? [[m.value, CAPS[m.value].maxChars as number]] : [])),
);

/** 模型的能力。表里没有的（文字模型、Agent）返回 undefined，当作不设限 */
export function modelCaps(model: string): ModelCaps | undefined {
  return CAPS[model];
}

/** 这个模型能不能挂 Lora */
export function supportsLora(model: string): boolean {
  return Boolean(CAPS[model]?.lora);
}

/** 一个模型在某种参考方式下，各类参考的 min–max。表里没有的模型不设限；表里没写的类型是 0–0（不收） */
export function inputLimits(model: string, refMode = 'omni'): InputLimits {
  const caps = CAPS[model];
  if (!caps) return { image: { min: 0, max: Infinity }, video: { min: 0, max: Infinity }, audio: { min: 0, max: Infinity } };
  // 模型没有这种参考方式（比如 Seedance 2.0 没有视频编辑）就按全能参考；只有首尾帧的模型取首尾帧
  const row = caps.inputs[refMode] ?? caps.inputs.omni ?? caps.inputs.default ?? caps.inputs.frames ?? {};
  const range = (k: InputKind): InputRange => ({ min: row[k]?.[0] ?? 0, max: row[k]?.[1] ?? 0 });
  return { image: range('image'), video: range('video'), audio: range('audio') };
}

/** 一串参考素材的类型，数出各类有几个 */
export function countInputs(types: readonly string[]): InputCounts {
  const counts: InputCounts = { image: 0, video: 0, audio: 0 };
  for (const t of types) if (t === 'image' || t === 'video' || t === 'audio') counts[t] += 1;
  return counts;
}

const NOUN: Record<InputKind, (n: number) => string> = {
  image: (n) => `${n}张参考图`,
  video: (n) => ` ${n} 个视频`,
  audio: (n) => ` ${n} 段音频`,
};
const NAME: Record<InputKind, string> = { image: '图片', video: '视频', audio: '音频' };
const KINDS: InputKind[] = ['image', 'video', 'audio'];

/** 参考太多或互斥的原因（切了模型后会出现）。不检查「不够」 */
function overProblem(counts: InputCounts, model: string, refMode: string): string | undefined {
  const caps = CAPS[model];
  const limits = inputLimits(model, refMode);
  for (const k of KINDS) {
    if (counts[k] > limits[k].max) {
      if (limits[k].max === 0) return `当前模型不支持上传${NAME[k]}`;
      return `最多上传${NOUN[k](limits[k].max).trimStart()}`;
    }
  }
  if (caps?.exclusive && counts[caps.exclusive[0]] > 0 && counts[caps.exclusive[1]] > 0) {
    return `参考${NAME[caps.exclusive[0]]}和参考${NAME[caps.exclusive[1]]}不能同时使用`;
  }
  return undefined;
}

/**
 * 参考数量有什么问题：少了 → 多了 → 互斥，返回文案；没问题返回 undefined。
 * 文案照线上：`请至少上传{n}张参考图`、`请至少上传 1 个视频`、`最多上传{n}张参考图`；互斥那句线上没有，是我们定的
 */
export function inputProblem(counts: InputCounts, model: string, refMode = 'omni'): string | undefined {
  const limits = inputLimits(model, refMode);
  for (const k of KINDS) {
    if (counts[k] < limits[k].min) return `请至少上传${NOUN[k](limits[k].min)}`;
  }
  return overProblem(counts, model, refMode);
}

/** 这些参考这个模型装不装得下（只看太多和互斥，不看够不够） */
export function fitsInputs(counts: InputCounts, model: string, refMode = 'omni'): boolean {
  return overProblem(counts, model, refMode) === undefined;
}

/**
 * 换哪个模型才装得下现有的参考（画布超上限换模型用）：当前装得下返回当前；
 * 否则默认模型；再否则列表里第一个装得下的；都不行返回 undefined
 */
export function compatibleModel(kind: 'image' | 'video' | 'audio', counts: InputCounts, current: string, refMode = 'omni'): string | undefined {
  if (fitsInputs(counts, current, refMode)) return current;
  if (fitsInputs(counts, DEFAULT_MODEL[kind], refMode)) return DEFAULT_MODEL[kind];
  return MODELS[kind].find((m) => fitsInputs(counts, m.value, refMode))?.value;
}

/**
 * 切了模型，把新模型不支持的参数值改回默认（默认也不支持就取它支持的第一个）。
 * 返回新的整组值和有没有改过；没有改就是原对象
 */
export function fallbackParams(kind: string, model: string, values: GenParamValues): { values: GenParamValues; changed: boolean } {
  const limits = modelCaps(model)?.params;
  const defaults: GenParamValues = kind in GEN_PARAM_DEFAULTS ? GEN_PARAM_DEFAULTS[kind as keyof typeof GEN_PARAM_DEFAULTS] : {};
  if (!limits) return { values, changed: false };
  const next = { ...values };
  let changed = false;
  for (const [key, allowed] of Object.entries(limits)) {
    const cur = next[key] ?? defaults[key];
    if (cur === undefined || allowed.includes(cur)) continue;
    next[key] = defaults[key] !== undefined && allowed.includes(defaults[key]) ? defaults[key] : allowed[0];
    changed = true;
  }
  return changed ? { values: next, changed } : { values, changed: false };
}
