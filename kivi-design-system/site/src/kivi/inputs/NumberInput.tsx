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
  /** 输入时触发，参数是只剩数字的新值（非负整数，小数点、负号会被去掉）；失焦时按 min / max 夹住也会触发 */
  onChange?: (value: string) => void;
  /** 单位，12 号 tertiary，比如「秒」 */
  unit?: ReactNode;
  /** 最小值：失焦时小于它就改成它。输入过程中不夹，免得没法打出「1」再打成「12」 */
  min?: number | string;
  /** 最大值：失焦时大于它就改成它 */
  max?: number | string;
  /** 类名、style 加在最外层的框上；其余属性（disabled、aria-label、onBlur……）都给里面的 input */
  className?: string;
}

/**
 * 输入一个数值，可以带单位，比如时长「12 秒」。Figma「输入控件」页 NumberInput。
 * 用文字输入框加 inputmode="numeric"，不用 type="number"，免得出现上下小箭头；输入时自动去掉非数字。
 * 只支持非负整数：小数、负数、科学计数法都不支持（待定）。失焦时按 min / max 夹住；空着不夹。
 * 宽度跟着内容走，最小 64。没有可见标签时必须写 aria-label。
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { value, defaultValue, onChange, unit, min, max, className, style, onBlur, ...rest },
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
        inputMode="numeric"
        value={current}
        min={min}
        max={max}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value.replace(/\D/g, ''))}
        onBlur={composeHandlers(onBlur, () => {
          if (current === '') return;
          let n = Number(current);
          if (min !== undefined && n < Number(min)) n = Number(min);
          if (max !== undefined && n > Number(max)) n = Number(max);
          if (String(n) !== current) setValue(String(n));
        })}
        {...rest}
      />
      {unit != null && unit !== false && <span className="kv-number-input__unit">{unit}</span>}
    </label>
  );
});
NumberInput.displayName = 'NumberInput';
