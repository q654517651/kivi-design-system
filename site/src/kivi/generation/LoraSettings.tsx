import { forwardRef, useState, type HTMLAttributes } from 'react';
import { IconButton } from '../button';
import { toast } from '../feedback';
import { NumberInput } from '../inputs';
import { Slider } from '../selection';
import { useControllable } from '../hooks';
import { cx } from '../utils';
import './generation.css';

export interface LoraSettingsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  /** Lora 名字，14 / 22，一行省略 */
  name: string;
  /** 触发词。不传就不显示这一块。右边有复制按钮，点了复制并弹 Toast「复制成功」 */
  triggerWords?: string;
  /** 提示词模版。不传就不显示这一块。最高 60，多了在里面滚动 */
  template?: string;
  /** 权重，0–2，一位小数。传了就是受控 */
  weight?: number;
  /** 非受控时的初始权重，默认 1 */
  defaultWeight?: number;
  /** 权重变了（拖滑块、输入、方向键），参数是新的权重 */
  onWeightChange?: (weight: number) => void;
}

const MIN = 0;
const MAX = 2;
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, Math.round(n * 10) / 10));

/** 复制到剪贴板，成功弹 Toast。剪贴板接口不可用时退回 execCommand */
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  toast.success('复制成功');
}

function CopyBox({ title, text, scroll }: { title: string; text: string; scroll?: boolean }) {
  return (
    <div className="kv-lora-settings__block">
      <div className="kv-lora-settings__label">{title}</div>
      <div className="kv-lora-settings__box" data-scroll={scroll ? '' : undefined}>
        <div className="kv-lora-settings__text" title={scroll ? undefined : text}>
          {text}
        </div>
        <IconButton icon="Copy" label={`复制${title}`} size={28} className="kv-lora-settings__copy" onClick={() => copy(text)} />
      </div>
    </div>
  );
}

/**
 * Lora 设置：悬停已选 Lora 弹出的面板内容，宽 234。名字、触发词、提示词模版、权重（滑块 + 数字）。
 * 放进 `Popover variant="panel"` 里用。Figma 还没有，待确认
 */
export const LoraSettings = forwardRef<HTMLDivElement, LoraSettingsProps>(function LoraSettings(
  { name, triggerWords, template, weight, defaultWeight = 1, onWeightChange, className, ...rest },
  ref,
) {
  const [current, setWeight] = useControllable(weight, defaultWeight, onWeightChange);
  // 输入框打字时先留着打的那串（比如「1.」），对不上当前权重（拖了滑块）就用权重
  const [draft, setDraft] = useState<string>();
  const shown = draft !== undefined && clamp(Number(draft)) === current ? draft : current.toFixed(1);

  return (
    <div ref={ref} className={cx('kv-lora-settings', className)} {...rest}>
      <div className="kv-lora-settings__name" title={name}>
        {name}
      </div>
      {triggerWords && <CopyBox title="触发词" text={triggerWords} />}
      {template && <CopyBox title="提示词模版" text={template} scroll />}
      <div className="kv-lora-settings__weight">
        <span className="kv-lora-settings__weight-label">权重</span>
        <Slider
          className="kv-lora-settings__slider"
          aria-label="Lora 权重"
          min={MIN}
          max={MAX}
          step={0.1}
          value={current}
          onChange={setWeight}
        />
        <NumberInput
          className="kv-lora-settings__weight-input"
          aria-label="Lora 权重数值"
          precision={1}
          min={MIN}
          max={MAX}
          value={shown}
          onChange={(v) => {
            setDraft(v);
            if (v !== '' && v !== '.') setWeight(clamp(Number(v)));
          }}
          onBlur={() => setDraft(undefined)}
        />
      </div>
    </div>
  );
});
LoraSettings.displayName = 'LoraSettings';
