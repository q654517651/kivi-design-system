import { forwardRef, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils';
import { composeHandlers, useControllable } from '../hooks';
import './inputs.css';

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'inputMode' | 'value' | 'defaultValue' | 'onChange'> {
  /** 数值。传了就是受控，要自己在 onChange 里更新。空是 ''，所以用字符串 */
  value?: string | number;
  /** 非受控时的初始值 */
  defaultValue?: string | number;
  /** 输入时触发，参数是只剩数字的新值（负号会被去掉，`min` 小于 0 时开头的一个负号保留；precision 为 0 时小数点也去掉）；失焦时按 min / max 夹住、按小数位取整也会触发 */
  onChange?: (value: string) => void;
  /** 单位，12 号 tertiary，比如「秒」 */
  unit?: ReactNode;
  /** 最小值：失焦时小于它就改成它。输入过程中不夹，免得没法打出「1」再打成「12」。小于 0 时允许开头打一个负号（比如音高 -12 到 12） */
  min?: number | string;
  /** 最大值：失焦时大于它就改成它 */
  max?: number | string;
  /** 小数位，默认 0（只能输整数）。比如 Lora 权重 0–2 写 1，输入时最多留这么多位，失焦时补齐成「1.0」 */
  precision?: number;
  /** 类名、style 加在最外层的框上；其余属性（disabled、aria-label、onBlur……）都给里面的 input */
  className?: string;
}

/** 只留数字和一个小数点，小数最多 precision 位；negative 时开头可以有一个负号 */
function clean(raw: string, precision: number, negative: boolean) {
  const sign = negative && raw.trimStart().startsWith('-') ? '-' : '';
  if (precision <= 0) return sign + raw.replace(/\D/g, '');
  const [int, ...dec] = raw.replace(/[^\d.]/g, '').split('.');
  return sign + (dec.length ? `${int}.${dec.join('').slice(0, precision)}` : int);
}

/**
 * 输入一个数值，可以带单位，比如时长「12 秒」。Figma「输入控件」页 NumberInput。
 * 用文字输入框加 inputmode="numeric"，不用 type="number"，免得出现上下小箭头；输入时自动去掉非数字。
 * 默认只支持非负数，`min` 小于 0 时才能打负号；科学计数法不支持；小数要写 precision。失焦时按 min / max 夹住、按小数位补齐；空着不夹。
 * 宽度跟着内容走，最小 64。没有可见标签时必须写 aria-label。
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { value, defaultValue, onChange, unit, min, max, precision = 0, className, style, onBlur, ...rest },
  ref,
) {
  const [current, setValue] = useControllable(
    value === undefined ? undefined : String(value),
    defaultValue === undefined ? '' : String(defaultValue),
    onChange,
  );

  return (
    <label className={cx('kv-number-input', className)} style={style}>
      <input
        ref={ref}
        className="kv-number-input__field"
        inputMode={precision > 0 ? 'decimal' : 'numeric'}
        value={current}
        min={min}
        max={max}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(clean(e.target.value, precision, Number(min) < 0))}
        onBlur={composeHandlers(onBlur, () => {
          let n = Number(current);
          if (current === '') return;
          // 只剩「-」「.」这种不是数字的，清空，不留着符号
          if (Number.isNaN(n)) return setValue('');
          if (min !== undefined && n < Number(min)) n = Number(min);
          if (max !== undefined && n > Number(max)) n = Number(max);
          const next = n.toFixed(precision);
          if (next !== current) setValue(next);
        })}
        {...rest}
      />
      {unit != null && unit !== false && <span className="kv-number-input__unit">{unit}</span>}
    </label>
  );
});
NumberInput.displayName = 'NumberInput';
