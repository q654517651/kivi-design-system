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
 * 模型，左边是模型 logo。
 * 图片、视频照 Figma「模板 · 通用」的「图片模型选择」「视频模型选择」，主站示例里的 GPT Image 2、Seedance 2.5 也放进来；
 * 文字照线上的对话模型列表；音频照 Figma 主站示例（豆包语音合成），其余是示例
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
    { value: 'nano-banana-2', label: 'Nano Banana 2', icon: 'Gemini' },
    { value: 'nano-banana-pro', label: 'Nano Banana Pro', icon: 'Gemini' },
    { value: 'seedream-5-lite', label: 'Seedream 5 Lite', icon: 'Bytedance' },
    { value: 'seedream-4.5-lite', label: 'Seedream 4.5 Lite', icon: 'Bytedance' },
    { value: 'gpt-image-2', label: 'GPT Image 2', icon: 'Openai' },
  ],
  video: [
    { value: 'seedance-2.0-fast', label: 'Seedance 2.0 Fast', icon: 'Bytedance' },
    { value: 'seedance-2.0', label: 'Seedance 2.0', icon: 'Bytedance' },
    { value: 'seedance-2.5', label: 'Seedance 2.5', icon: 'Bytedance' },
    { value: 'veo-3.1-fast', label: 'Veo 3.1 Fast', icon: 'Gemini' },
    { value: 'hailuo-2.3', label: 'Hailuo 2.3', icon: 'Minimax' },
    { value: 'kling-2.5-turbo', label: 'Kling 2.5 Turbo', icon: 'Kling' },
    { value: 'vidu-q3-pro', label: 'Vidu Q3 Pro', icon: 'Vidu' },
  ],
  audio: [
    { value: 'doubao-tts', label: '豆包语音合成', icon: 'Bytedance' },
    { value: 'minimax-speech', label: 'MiniMax Speech', icon: 'Minimax' },
    { value: 'gemini-tts', label: 'Gemini TTS', icon: 'Gemini' },
  ],
};

/** 模型默认值：线上的默认模型 */
export const DEFAULT_MODEL: Record<ModelKind, string> = {
  text: 'gemini-3.5-flash',
  image: 'gpt-image-2',
  video: 'seedance-2.0-fast',
  audio: 'doubao-tts',
};

const list = (values: string[]): SelectOption[] => values.map((v) => ({ value: v, label: v }));

export const SIZES = list(['1K', '2K', '4K']);
export const RATIOS = list(['智能', '1:1', '3:4', '4:3', '16:9', '9:16']);
export const BACKGROUNDS: SelectOption[] = [
  { value: 'opaque', label: '不透明背景' },
  { value: 'transparent', label: '透明背景' },
];
export const VOICES = list(['温柔女声', '沉稳男声', '活力少女', '磁性男声']);
export const COUNTS: SelectOption[] = [1, 2, 3, 4].map((n) => ({ value: String(n), label: `x${n}` }));

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

export function VoiceSelect(props: PresetProps) {
  return <Select {...plain} options={VOICES} defaultValue="温柔女声" aria-label="音色" {...props} />;
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
  const [sec, setSec] = useState(8);
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
      <SliderField label="选择视频生成时长" min={0} max={30} value={sec} unit="S" marks={ticks(0, 30, 5, 10)} onChange={(v) => setSec(Math.max(1, v))} />
      <Segment label="选择分辨率" value={res} options={list(['720P', '1080P'])} onChange={setRes} />
      {audio && <Segment label="生成音频" value={sound} options={[{ value: 'on', label: '开' }, { value: 'off', label: '关' }]} onChange={setSound} />}
    </ParamPicker>
  );
}
VideoParams.displayName = 'VideoParams';

/** 音频参数：Figma「音频参数调整」（211:1528）。语速、音调 */
export function AudioParams() {
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  return (
    <ParamPicker summary={`${speed.toFixed(1)}x · 音调 ${pitch}`}>
      <SliderField label="语速" min={0.5} max={2} step={0.1} value={speed} unit="x" format={(v) => v.toFixed(1)} marks={ticks(0.5, 2, 0.25, 0.5, (v) => `${v.toFixed(1)}x`)} onChange={(v) => setSpeed(Math.round(v * 10) / 10)} />
      <SliderField label="音调" min={-12} max={12} value={pitch} marks={ticks(-12, 12, 4, 12)} onChange={setPitch} />
    </ParamPicker>
  );
}
AudioParams.displayName = 'AudioParams';

// ---------- 跟着模型变的一组 ----------

/**
 * 视频：模型 + 参考方式 + 参数，模型在前、参考方式在后（画布和主站一样）。模型决定参数里有什么、后面跟什么：
 * Seedance 系列参数里多「生成音频」；Seedance 2.5 后面多一个「样片模式」开关，用竖线隔开（Figma 主站「样片模式」示例）
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
  const seedance = model.startsWith('seedance');
  return (
    <>
      <ModelSelect kind="video" value={model} onChange={setModel} />
      {refMode}
      <VideoParams key={seedance ? 'seedance' : 'other'} audio={seedance} />
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

/** 音频：模型 + 音色 + 参数 */
export function AudioModelControls() {
  return (
    <>
      <ModelSelect kind="audio" />
      <VoiceSelect />
      <AudioParams />
    </>
  );
}
AudioModelControls.displayName = 'AudioModelControls';
