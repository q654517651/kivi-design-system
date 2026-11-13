import { forwardRef, useState, type HTMLAttributes } from 'react';
import { IconButton } from '../button';
import { NumberInput } from '../inputs';
import { ScrollArea } from '../scroll-area';
import { Slider } from '../selection';
import { useControllable, useCopy } from '../hooks';
import { cx } from '../utils';
import './generation.css';

export interface LoraSettingsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  /** Lora 名字，14 / 22，一行省略 */
  name: string;
  /** 触发词。不传就不显示这一块。右边有复制按钮，点了复制，图标换成对勾，失败弹 Toast「复制失败」 */
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

function CopyBox({ title, text, scroll }: { title: string; text: string; scroll?: boolean }) {
  const { copied, copy } = useCopy();
  return (
    <div className="kv-lora-settings__block">
      <div className="kv-lora-settings__label">{title}</div>
      <div className="kv-lora-settings__box" data-scroll={scroll ? '' : undefined}>
        {scroll ? (
          <ScrollArea className="kv-lora-settings__text">{text}</ScrollArea>
        ) : (
          <div className="kv-lora-settings__text" title={text}>
            {text}
          </div>
        )}
        <IconButton
          icon={copied ? 'CheckSmall' : 'Copy'}
          label={copied ? '已复制' : `复制${title}`}
          size={28}
          className="kv-lora-settings__copy"
          onClick={() => copy(text)}
        />
      </div>
    </div>
  );
}

/**
 * Lora 设置：悬停已选 Lora 弹出的面板内容，宽 234。名字、触发词、提示词模版、权重（滑块 + 数字）。
 * 放进 `Popover variant="panel"` 里用。
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
        <Slider className="kv-lora-settings__slider" aria-label="Lora 权重" min={MIN} max={MAX} step={0.1} value={current} onChange={setWeight} />
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
