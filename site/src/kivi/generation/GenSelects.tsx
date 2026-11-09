import { forwardRef, type HTMLAttributes } from 'react';
import { useControllable } from '../hooks';
import { Dropdown, Menu, MenuItem, type DropdownPlacement } from '../menu';
import { Select, SelectPreview, type SelectOption } from '../selection';
import { AGENT_MODES, BACKGROUNDS, COUNTS, DEFAULT_MODEL, MODELS, RATIOS, REF_MODES, SIZES, TASKS, VOICES, type ModelType } from './options';

/*
  生成用的下拉：都是填好选项的无底下拉，画布生成面板、主站输入框、Agent 输入框只用这一份。
  拼法就是下拉选择的标准写法：Dropdown（listbox）+ Select（无底触发器）+ Menu + MenuItem，写在下面的 OptionSelect 里。
  展开位置不写，默认往下、放不下自己翻上去，两边一致。选项在 options.ts。
  其余属性（value、onChange、defaultValue、placement 等）透传，传了就盖过默认。
*/

/** 生成用下拉的属性。ref 和其余属性给最外层的壳（Dropdown 的 span） */
export interface GenSelectProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onChange' | 'defaultValue'> {
  /** 选中的值。传了就是受控，要自己在 onChange 里更新 */
  value?: string | null;
  /** 非受控时的初始值，每个下拉有自己的默认 */
  defaultValue?: string | null;
  /** 选了一项时触发，参数是选项的值 */
  onChange?: (value: string) => void;
  /** 禁用：文字和箭头变灰，不能展开 */
  disabled?: boolean;
  /** 展开。传了就是受控 */
  open?: boolean;
  /** 非受控时一开始是不是展开的，默认收起 */
  defaultOpen?: boolean;
  /** 展开、收起时触发 */
  onOpenChange?: (open: boolean) => void;
  /** 列表出现的位置，默认 bottom-start，放不下自己翻到另一边 */
  placement?: DropdownPlacement;
  /** 触发器上的说明，读屏用 */
  'aria-label'?: string;
}

interface OptionSelectProps extends GenSelectProps {
  options: SelectOption[];
}

/** 一份选项拼成一个无底下拉：触发器显示选中项的文字和图标，列表当前项用「选中」底色 */
const OptionSelect = forwardRef<HTMLSpanElement, OptionSelectProps>(function OptionSelect(
  { options, value, defaultValue = null, onChange, disabled, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  const [current, setCurrent] = useControllable<string | null>(value, defaultValue, (next) => {
    if (next !== null) onChange?.(next);
  });
  const selected = options.find((o) => o.value === current);
  return (
    <Dropdown
      ref={ref}
      haspopup="listbox"
      trigger={
        <Select variant="plain" leftIcon={selected?.icon} disabled={disabled} aria-label={ariaLabel}>
          {selected?.label}
        </Select>
      }
      {...rest}
    >
      <Menu role="listbox" aria-label={ariaLabel}>
        {options.map((o) => (
          <MenuItem
            key={o.value}
            icon={o.preview === undefined ? o.icon : undefined}
            thumb={o.preview !== undefined ? <SelectPreview src={o.preview || undefined} label={o.label} /> : undefined}
            description={o.description}
            selected={o.value === current}
            disabled={o.disabled}
            onClick={() => setCurrent(o.value)}
          >
            {o.label}
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
});

/** 任务类型：Agent / 图片生成 / 视频生成 / 音频生成，默认图片生成 */
export const TaskSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function TaskSelect(props, ref) {
  return <OptionSelect ref={ref} options={TASKS} defaultValue="image" aria-label="任务类型" {...props} />;
});
TaskSelect.displayName = 'TaskSelect';

/** 参考方式：全能参考 / 首尾帧 / 视频编辑 / 视频延长，默认全能参考 */
export const RefModeSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function RefModeSelect(props, ref) {
  return <OptionSelect ref={ref} options={REF_MODES} defaultValue="omni" aria-label="参考方式" {...props} />;
});
RefModeSelect.displayName = 'RefModeSelect';

export interface ModelSelectProps extends GenSelectProps {
  /** 模型的类型：文字 / 图片 / 视频 / 音频，决定选项和默认模型 */
  type: ModelType;
}

/** 模型：左边是模型 Logo，选项和默认值跟着 `type` 走 */
export const ModelSelect = forwardRef<HTMLSpanElement, ModelSelectProps>(function ModelSelect({ type, ...props }, ref) {
  return <OptionSelect ref={ref} options={MODELS[type]} defaultValue={DEFAULT_MODEL[type]} aria-label="模型" {...props} />;
});
ModelSelect.displayName = 'ModelSelect';

/** 分辨率：1K / 2K / 4K，默认 2K */
export const SizeSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function SizeSelect(props, ref) {
  return <OptionSelect ref={ref} options={SIZES} defaultValue="2K" aria-label="分辨率" {...props} />;
});
SizeSelect.displayName = 'SizeSelect';

/** 图片比例：带比例图标，默认 1:1 */
export const RatioSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function RatioSelect(props, ref) {
  return <OptionSelect ref={ref} options={RATIOS} defaultValue="1:1" aria-label="比例" {...props} />;
});
RatioSelect.displayName = 'RatioSelect';

/** 背景：不透明 / 透明，GPT Image 才有，默认不透明 */
export const BackgroundSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function BackgroundSelect(props, ref) {
  return <OptionSelect ref={ref} options={BACKGROUNDS} defaultValue="opaque" aria-label="背景" {...props} />;
});
BackgroundSelect.displayName = 'BackgroundSelect';

export interface VoiceSelectProps extends GenSelectProps {
  /** 音频模型的值，音色列表跟着它变，默认 Seed Audio */
  model?: string;
}

/** 音色：左边带试听，列表跟着音频模型变，默认选第一个 */
export const VoiceSelect = forwardRef<HTMLSpanElement, VoiceSelectProps>(function VoiceSelect({ model = DEFAULT_MODEL.audio, ...props }, ref) {
  const options = VOICES[model] ?? VOICES[DEFAULT_MODEL.audio];
  return <OptionSelect ref={ref} options={options} defaultValue={options[0].value} aria-label="音色" {...props} />;
});
VoiceSelect.displayName = 'VoiceSelect';

/** 张数：x1 / x2 / x4，默认 x1 */
export const CountSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function CountSelect(props, ref) {
  return <OptionSelect ref={ref} options={COUNTS} defaultValue="1" aria-label="张数" {...props} />;
});
CountSelect.displayName = 'CountSelect';

/** Agent 模式：手动模式（每次生成前询问）/ 自动生成，默认手动 */
export const AgentModeSelect = forwardRef<HTMLSpanElement, GenSelectProps>(function AgentModeSelect(props, ref) {
  return <OptionSelect ref={ref} options={AGENT_MODES} defaultValue="manual" aria-label="Agent 模式" {...props} />;
});
AgentModeSelect.displayName = 'AgentModeSelect';
