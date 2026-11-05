import { forwardRef } from 'react';
import { Select, type SelectProps } from '../selection';
import { AGENT_MODES, BACKGROUNDS, COUNTS, DEFAULT_MODEL, MODELS, RATIOS, REF_MODES, SIZES, TASKS, VOICES, type ModelType } from './options';

/*
  生成用的下拉：都是填好选项的无底 Select，画布生成面板、主站输入框、Agent 输入框只用这一份。
  展开位置不写，默认往下、放不下自己翻上去，两边一致。选项在 options.ts。
  其余属性（value、onChange、defaultValue、placement 等）都透传给 Select，传了就盖过默认。
*/

/** 生成用下拉的属性：Select 的属性去掉选项和样式（选项、样式是固定的） */
export type GenSelectProps = Omit<SelectProps, 'options' | 'variant'>;

const plain = { variant: 'plain' } as const;

/** 任务类型：Agent / 图片生成 / 视频生成 / 音频生成，默认图片生成 */
export const TaskSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function TaskSelect(props, ref) {
  return <Select ref={ref} {...plain} options={TASKS} defaultValue="image" aria-label="任务类型" {...props} />;
});
TaskSelect.displayName = 'TaskSelect';

/** 参考方式：全能参考 / 首尾帧 / 视频编辑 / 视频延长，默认全能参考 */
export const RefModeSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function RefModeSelect(props, ref) {
  return <Select ref={ref} {...plain} options={REF_MODES} defaultValue="omni" aria-label="参考方式" {...props} />;
});
RefModeSelect.displayName = 'RefModeSelect';

export interface ModelSelectProps extends GenSelectProps {
  /** 模型的类型：文字 / 图片 / 视频 / 音频，决定选项和默认模型 */
  type: ModelType;
}

/** 模型：左边是模型 Logo，选项和默认值跟着 `type` 走 */
export const ModelSelect = forwardRef<HTMLSpanElement, ModelSelectProps>(function ModelSelect({ type, ...props }, ref) {
  return <Select ref={ref} {...plain} options={MODELS[type]} defaultValue={DEFAULT_MODEL[type]} aria-label="模型" {...props} />;
});
ModelSelect.displayName = 'ModelSelect';

/** 分辨率：1K / 2K / 4K，默认 2K */
export const SizeSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function SizeSelect(props, ref) {
  return <Select ref={ref} {...plain} options={SIZES} defaultValue="2K" aria-label="分辨率" {...props} />;
});
SizeSelect.displayName = 'SizeSelect';

/** 图片比例：带比例图标，默认 1:1 */
export const RatioSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function RatioSelect(props, ref) {
  return <Select ref={ref} {...plain} options={RATIOS} defaultValue="1:1" aria-label="比例" {...props} />;
});
RatioSelect.displayName = 'RatioSelect';

/** 背景：不透明 / 透明，GPT Image 才有，默认不透明 */
export const BackgroundSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function BackgroundSelect(props, ref) {
  return <Select ref={ref} {...plain} options={BACKGROUNDS} defaultValue="opaque" aria-label="背景" {...props} />;
});
BackgroundSelect.displayName = 'BackgroundSelect';

export interface VoiceSelectProps extends GenSelectProps {
  /** 音频模型的值，音色列表跟着它变，默认 Seed Audio */
  model?: string;
}

/** 音色：左边带试听，列表跟着音频模型变，默认选第一个 */
export const VoiceSelect = forwardRef<HTMLSpanElement, VoiceSelectProps>(function VoiceSelect({ model = DEFAULT_MODEL.audio, ...props }, ref) {
  const options = VOICES[model] ?? VOICES[DEFAULT_MODEL.audio];
  return <Select ref={ref} {...plain} options={options} defaultValue={options[0].value} aria-label="音色" {...props} />;
});
VoiceSelect.displayName = 'VoiceSelect';

/** 张数：x1 / x2 / x4，默认 x1 */
export const CountSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function CountSelect(props, ref) {
  return <Select ref={ref} {...plain} options={COUNTS} defaultValue="1" aria-label="张数" {...props} />;
});
CountSelect.displayName = 'CountSelect';

/** Agent 模式：手动模式（每次生成前询问）/ 自动生成，默认手动 */
export const AgentModeSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function AgentModeSelect(props, ref) {
  return <Select ref={ref} {...plain} options={AGENT_MODES} defaultValue="manual" aria-label="Agent 模式" {...props} />;
});
AgentModeSelect.displayName = 'AgentModeSelect';
