import { useState, type ReactNode } from 'react';
import {
  ParamField,
  ParamPicker,
  ParamValue,
  Icon,
  Select,
  Slider,
  TabItem,
  Tabs,
  ToolbarDivider,
  ToolbarSwitch,
  type IconName,
  type SelectOption,
  type SelectProps,
  type SliderMark,
} from '@kivi';

/*
  生成用的下拉和参数面板：画布生成面板、主站输入框都只用这一份。
  选项、顺序、图标、展开方式都在这里定，两边不再各写各的（2026-10-29 用户定）。
  组件是通用的 Select、ParamPicker、ParamField、Slider、Tabs，这里只往里面填内容。
*/

// ---------- 选项 ----------

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

export type ModelKind = 'text' | 'image' | 'video' | 'audio';

/**
 * 模型，左边是模型 logo。照线上（ai-design-web 的 generation-policy 模型簇、canvas-action-registry 默认模型）：
 * 线上的清单和显示名是后端按策略下发的，这里照模型 id 写显示名，顺序是示例。文字照线上的对话模型列表
 */
export const MODELS: Record<ModelKind, SelectOption[]> = {
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
    { value: 'wan-3.0', label: 'Wan 3.0', icon: 'Bytedance' },
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
export const DEFAULT_MODEL: Record<ModelKind, string> = {
  text: 'gemini-3.5-flash',
  image: 'gpt-image-2',
  video: 'seedance-2.0',
  audio: 'seed-audio-1.0',
};

const list = (values: string[]): SelectOption[] => values.map((v) => ({ value: v, label: v }));

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
/** 音色：跟着模型变，第一个是默认。线上 Seed 16 个、MiniMax 17 个、Eleven 21 个，这里各放几个 */
export const VOICES: Record<string, SelectOption[]> = {
  'seed-audio-1.0': list(['不使用音色', '温柔女声', '沉稳男声', '活力少女', '磁性男声']),
  'minimax-speech-2.8-hd': list(['知性姐姐', '温暖少女', '沉稳大叔', '播音男声']),
  'eleven-v4': list(['瑞秋', '亚当', '贝拉', '安东尼']),
};
/** 张数：线上是 x1 / x2 / x4 */
export const COUNTS: SelectOption[] = [1, 2, 4].map((n) => ({ value: String(n), label: `x${n}` }));
/** 音频字数上限，按模型 */
export const AUDIO_CHAR_LIMIT: Record<string, number> = { 'seed-audio-1.0': 3000, 'minimax-speech-2.8-hd': 10000, 'eleven-v4': 5000 };

/** 视频参数面板里的比例：竖排分段，带比例图标 */
const RATIO_ICONS: [string, IconName][] = [
  ['智能', 'AutoAspect'],
  ['1:1', 'Square11'],
  ['4:3', 'Square43'],
  ['3:4', 'Square34'],
  ['16:9', 'Square169'],
  ['9:16', 'Square916'],
];

/** 刻度：每 every 一条线，每 labelEvery 写一个数字 */
export function ticks(min: number, max: number, every: number, labelEvery: number, fmt: (v: number) => string = String): SliderMark[] {
  const out: SliderMark[] = [];
  for (let v = min; v <= max + 1e-9; v += every) {
    const r = Math.round(v * 100) / 100;
    out.push({ value: r, label: Math.abs(((r - min) / labelEvery) % 1) < 1e-9 ? fmt(r) : undefined });
  }
  return out;
}

// ---------- 下拉 ----------

/** 所有生成用的下拉都是无底 Select；展开位置不写，默认往下、放不下自己翻上去，两边一致 */
type PresetProps = Omit<SelectProps, 'options' | 'variant'>;
const plain = { variant: 'plain' } as const;

export function TaskSelect(props: PresetProps) {
  return <Select {...plain} options={TASKS} defaultValue="image" aria-label="任务类型" {...props} />;
}
TaskSelect.displayName = 'TaskSelect';

export function RefModeSelect(props: PresetProps) {
  return <Select {...plain} options={REF_MODES} defaultValue="omni" aria-label="参考方式" {...props} />;
}
RefModeSelect.displayName = 'RefModeSelect';

export function ModelSelect({ kind, ...props }: PresetProps & { kind: ModelKind }) {
  return <Select {...plain} options={MODELS[kind]} defaultValue={DEFAULT_MODEL[kind]} aria-label="模型" {...props} />;
}
ModelSelect.displayName = 'ModelSelect';

export function SizeSelect(props: PresetProps) {
  return <Select {...plain} options={SIZES} defaultValue="2K" aria-label="分辨率" {...props} />;
}
SizeSelect.displayName = 'SizeSelect';

export function RatioSelect(props: PresetProps) {
  return <Select {...plain} options={RATIOS} defaultValue="1:1" aria-label="比例" {...props} />;
}
RatioSelect.displayName = 'RatioSelect';

export function BackgroundSelect(props: PresetProps) {
  return <Select {...plain} options={BACKGROUNDS} defaultValue="opaque" aria-label="背景" {...props} />;
}
BackgroundSelect.displayName = 'BackgroundSelect';

export function VoiceSelect({ model = DEFAULT_MODEL.audio, ...props }: PresetProps & { model?: string }) {
  const options = VOICES[model] ?? VOICES[DEFAULT_MODEL.audio];
  return <Select {...plain} options={options} defaultValue={options[0].value} aria-label="音色" {...props} />;
}
VoiceSelect.displayName = 'VoiceSelect';

export function CountSelect(props: PresetProps) {
  return <Select {...plain} options={COUNTS} defaultValue="1" aria-label="张数" {...props} />;
}
CountSelect.displayName = 'CountSelect';

// ---------- 参数面板 ----------

/** 刻度滑块 + 右边的数值框，照 Figma「视频参数调整」里的时长（210:1560） */
function SliderField(p: { label: string; min: number; max: number; step?: number; value: number; unit?: string; marks: SliderMark[]; format?: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <ParamField label={p.label}>
      <Slider aria-label={p.label} min={p.min} max={p.max} step={p.step ?? 1} value={p.value} marks={p.marks} onChange={p.onChange} />
      <ParamValue value={(p.format ?? String)(p.value)} unit={p.unit} />
    </ParamField>
  );
}

function Segment({ label, value, options, onChange }: { label: string; value: string; options: SelectOption[]; onChange: (v: string) => void }) {
  return (
    <ParamField label={label}>
      <Tabs variant="segment" value={value} onChange={onChange} aria-label={label}>
        {options.map((o) => (
          <TabItem key={o.value} value={o.value}>
            {o.label}
          </TabItem>
        ))}
      </Tabs>
    </ParamField>
  );
}

/**
 * 视频参数：Figma「模板 · 画布」页「视频参数调整」（210:1514）。比例、时长、分辨率，Seedance 多一个生成音频。
 * 摘要照 Figma 主站输入框写成「分辨率 · 比例 · 时长」；生成音频开着时，后面跟一个音量图标（Figma 画布摘要「智能 · 8s · 2K ·」后面那个）
 */
export function VideoParams({ audio = false }: { audio?: boolean }) {
  const [ratio, setRatio] = useState('16:9');
  const [sec, setSec] = useState(5);
  const [res, setRes] = useState('720P');
  const [sound, setSound] = useState('on');
  return (
    <ParamPicker
      summary={
        <>
          {`${res} · ${ratio} · ${sec}s`}
          {audio && sound === 'on' && <> · <Icon name="VolumeHalf" /></>}
        </>
      }
    >
      <ParamField label="选择比例">
        <Tabs variant="segment" layout="vertical" value={ratio} onChange={setRatio} aria-label="比例">
          {RATIO_ICONS.map(([v, icon]) => (
            <TabItem key={v} value={v} icon={icon}>
              {v}
            </TabItem>
          ))}
        </Tabs>
      </ParamField>
      <SliderField label="选择视频生成时长" min={4} max={15} value={sec} unit="S" marks={ticks(5, 15, 5, 5)} onChange={setSec} />
      <Segment label="选择分辨率" value={res} options={list(['720P', '1080P'])} onChange={setRes} />
      {audio && <Segment label="生成音频" value={sound} options={[{ value: 'on', label: '开' }, { value: 'off', label: '关' }]} onChange={setSound} />}
    </ParamPicker>
  );
}
VideoParams.displayName = 'VideoParams';

/**
 * 音频高级设置：样子照 Figma「音频参数调整」（211:1528），内容照线上：语速、音高都有；
 * MiniMax 多情绪，Eleven 多稳定性，Seed 和 Eleven 有生成字幕。触发器写「高级设置」
 */
export function AudioParams({ model = DEFAULT_MODEL.audio }: { model?: string }) {
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [emotion, setEmotion] = useState('auto');
  const [stability, setStability] = useState('natural');
  const [subtitle, setSubtitle] = useState('on');
  return (
    <ParamPicker summary="高级设置">
      <SliderField label="语速" min={0.5} max={2} step={0.1} value={speed} unit="x" format={(v) => v.toFixed(1)} marks={ticks(0.5, 2, 0.25, 0.5, (v) => `${v.toFixed(1)}x`)} onChange={(v) => setSpeed(Math.round(v * 10) / 10)} />
      <SliderField label="音高" min={-12} max={12} value={pitch} marks={ticks(-12, 12, 4, 12)} onChange={setPitch} />
      {model === 'minimax-speech-2.8-hd' && (
        <Segment
          label="情绪"
          value={emotion}
          options={[
            { value: 'auto', label: '自动' },
            { value: 'happy', label: '开心' },
            { value: 'sad', label: '悲伤' },
            { value: 'angry', label: '愤怒' },
          ]}
          onChange={setEmotion}
        />
      )}
      {model === 'eleven-v4' && (
        <Segment
          label="稳定性"
          value={stability}
          options={[
            { value: 'lively', label: '活泼' },
            { value: 'natural', label: '自然' },
            { value: 'stable', label: '稳定' },
          ]}
          onChange={setStability}
        />
      )}
      {model !== 'minimax-speech-2.8-hd' && <Segment label="生成字幕" value={subtitle} options={[{ value: 'on', label: '开' }, { value: 'off', label: '关' }]} onChange={setSubtitle} />}
    </ParamPicker>
  );
}
AudioParams.displayName = 'AudioParams';

// ---------- 跟着模型变的一组 ----------

/**
 * 视频：模型 + 参考方式 + 参数，模型在前、参考方式在后（画布和主站一样）。模型决定参数里有什么、后面跟什么：
 * 照线上分三类：Seedance、Kling V3 Omni 参数里多「生成音频」；只有首尾帧的（Veo、Sora、Grok、Vidu、Seedance 1.5）不出参考方式。
 * Seedance 2.5 后面多一个「样片模式」开关，用竖线隔开（Figma 主站「样片模式」示例）
 * refMode 默认是不受控的 RefModeSelect，要跟着切参考区就自己传一个受控的
 */
export function VideoModelControls({
  defaultModel = DEFAULT_MODEL.video,
  refMode = <RefModeSelect />,
  sampleMode,
}: {
  defaultModel?: string;
  refMode?: ReactNode;
  sampleMode?: ReactNode;
}) {
  const [model, setModel] = useState(defaultModel);
  const audio = VIDEO_WITH_AUDIO.includes(model);
  return (
    <>
      <ModelSelect kind="video" value={model} onChange={setModel} />
      {!VIDEO_FIRST_LAST_ONLY.includes(model) && refMode}
      <VideoParams key={audio ? 'audio' : 'silent'} audio={audio} />
      {model === 'seedance-2.5' && (sampleMode ?? (
        <>
          <ToolbarDivider />
          <ToolbarSwitch label="样片模式" />
        </>
      ))}
    </>
  );
}
VideoModelControls.displayName = 'VideoModelControls';

/** 图片：模型 + 分辨率 + 比例；GPT Image 多一个背景（Figma 主站「图片生成 · GPT」示例） */
export function ImageModelControls({ defaultModel = DEFAULT_MODEL.image }: { defaultModel?: string }) {
  const [model, setModel] = useState(defaultModel);
  return (
    <>
      <ModelSelect kind="image" value={model} onChange={setModel} />
      <SizeSelect />
      <RatioSelect />
      {model.startsWith('gpt-image') && <BackgroundSelect />}
    </>
  );
}
ImageModelControls.displayName = 'ImageModelControls';

/** 音频：模型 + 音色 + 高级设置，跟着模型换（照线上）。没有张数和比例，右边是字数 / 上限 */
export function AudioModelControls({ model: modelProp, onModelChange }: { model?: string; onModelChange?: (model: string) => void }) {
  const [inner, setInner] = useState(DEFAULT_MODEL.audio);
  const model = modelProp ?? inner;
  const change = (m: string) => {
    setInner(m);
    onModelChange?.(m);
  };
  return (
    <>
      <ModelSelect kind="audio" value={model} onChange={change} />
      <VoiceSelect key={`v-${model}`} model={model} />
      <AudioParams key={`p-${model}`} model={model} />
    </>
  );
}
AudioModelControls.displayName = 'AudioModelControls';

// ---------- Agent ----------
// 照线上 Agent 输入框底栏（ai-chat SenderFooter）：选择模型、技能、模式（手动 / 自动）。主站输入框切到 Agent 时用这一组

/** Agent 模式：手动是每次生成前询问，自动是直接生成 */
export const AGENT_MODES: SelectOption[] = [
  { value: 'manual', label: '手动模式', icon: 'Hand' },
  { value: 'auto', label: '自动生成', icon: 'Auto' },
];

/** 技能：演示用，线上是技能市场里用户加过的技能 */
export const SKILLS: SelectOption[] = [
  { value: 'poster', label: '海报设计', icon: 'Skill' },
  { value: 'ecommerce', label: '电商主图', icon: 'Skill' },
  { value: 'storyboard', label: '分镜脚本', icon: 'Skill' },
  { value: 'short-video', label: '短视频脚本', icon: 'Skill' },
];

/** Agent 能用的生成模型：线上面板只有图片、视频两组 */
const GEN_MODELS: SelectOption[] = [...MODELS.image, ...MODELS.video];

export function AgentModeSelect(props: PresetProps) {
  return <Select {...plain} options={AGENT_MODES} defaultValue="manual" aria-label="Agent 模式" {...props} />;
}
AgentModeSelect.displayName = 'AgentModeSelect';

export function SkillSelect(props: PresetProps) {
  return <Select {...plain} options={SKILLS} placeholder="技能" leftIcon="Skill" aria-label="技能" {...props} />;
}
SkillSelect.displayName = 'SkillSelect';

export function GenModelSelect(props: PresetProps) {
  return <Select {...plain} options={GEN_MODELS} placeholder="模型" leftIcon="Mdoel" aria-label="选择模型" {...props} />;
}
GenModelSelect.displayName = 'GenModelSelect';

/** 切到 Agent 时任务类型后面的那一组：模型、技能、模式 */
export function AgentControls() {
  return (
    <>
      <GenModelSelect />
      <SkillSelect />
      <AgentModeSelect />
    </>
  );
}

/** 音频生成按钮左边的「字数 / 上限」（照线上音频面板），代替张数 */
export function AudioCharCount({ count = 0, model = DEFAULT_MODEL.audio }: { count?: number; model?: string }) {
  return (
    <span style={{ color: 'var(--color-text-fill-tertiary)', fontSize: 'var(--font-size-13)', lineHeight: 'var(--font-line-height-20)', fontVariantNumeric: 'tabular-nums' }}>
      {count}/{AUDIO_CHAR_LIMIT[model] ?? AUDIO_CHAR_LIMIT[DEFAULT_MODEL.audio]}
    </span>
  );
}
AudioCharCount.displayName = 'AudioCharCount';
