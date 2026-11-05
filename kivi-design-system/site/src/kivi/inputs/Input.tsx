import { forwardRef, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import { composeHandlers, useMergedRef } from '../hooks';
import './inputs.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 左图标，固定 16，比如搜索框用 Search */
  leftIcon?: IconName;
  /** 字数，放在框内右侧，比如「0/50」。传什么显示什么，超没超限自己算 */
  counter?: ReactNode;
  /** 错误：加 1px danger 描边。等于在 input 上写 aria-invalid */
  invalid?: boolean;
  /** 可清空：有字时右边出清空按钮（CloseSmall 16），点了清空并回到输入框，会照常触发 onChange（值是空）。搜索框用 */
  clearable?: boolean;
  /** 点了清空按钮 */
  onClear?: () => void;
  /** 类名、style 加在最外层的框上；其余属性（value、placeholder、disabled、onChange……）都给里面的 input */
  className?: string;
}

/** 用原生的 setter 改值再派发 input 事件，受控、非受控都能收到 onChange */
function setNativeValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * 单行输入：搜索、改名、表单。Figma「输入控件」页 Input。
 * 宽度默认填满，要固定宽度在 className 或 style 里设。没有可见标签时必须写 aria-label。
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leftIcon, counter, invalid, clearable, onClear, className, style, onChange, ...rest },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setRef = useMergedRef(inputRef, ref);
  // 非受控时自己记有没有字；受控时看 value
  const [typed, setTyped] = useState(() => String(rest.defaultValue ?? '') !== '');
  const filled = rest.value !== undefined ? String(rest.value) !== '' : typed;
  const showClear = clearable && filled && !rest.disabled && !rest.readOnly;

  return (
    <label className={cx('kv-input', className)} style={style}>
      {leftIcon && <Icon name={leftIcon} />}
      <input
        ref={setRef}
        className="kv-input__field"
        aria-invalid={invalid || undefined}
        onChange={composeHandlers(onChange, (e: ChangeEvent<HTMLInputElement>) => setTyped(e.target.value !== ''))}
        {...rest}
      />
      {showClear && (
        <button
          type="button"
          className="kv-input__clear"
          aria-label="清空"
          onClick={(e) => {
            e.preventDefault();
            const el = inputRef.current;
            if (!el) return;
            setNativeValue(el, '');
            onClear?.();
            el.focus();
          }}
        >
          <Icon name="CloseSmall" />
        </button>
      )}
      {counter != null && counter !== false && <span className="kv-input__counter">{counter}</span>}
    </label>
  );
});
Input.displayName = 'Input';
