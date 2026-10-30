import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import './inputs.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 左图标，固定 16，比如搜索框用 Search */
  leftIcon?: IconName;
  /** 字数，放在框内右侧，比如「0/50」。传什么显示什么，超没超限自己算 */
  counter?: ReactNode;
  /** 错误：加 1px danger 描边。等于在 input 上写 aria-invalid */
  invalid?: boolean;
  /** 类名、style 加在最外层的框上；其余属性（value、placeholder、disabled、onChange……）都给里面的 input */
  className?: string;
}

/**
 * 单行输入：搜索、改名、表单。Figma「输入控件」页 Input。
 * 宽度默认填满，要固定宽度在 className 或 style 里设。没有可见标签时必须写 aria-label。
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leftIcon, counter, invalid, className, style, ...rest },
  ref,
) {
  return (
    <label className={cx('kv-input', className)} style={style}>
      {leftIcon && <Icon name={leftIcon} />}
      <input ref={ref} className="kv-input__field" aria-invalid={invalid || undefined} {...rest} />
      {counter != null && counter !== false && <span className="kv-input__counter">{counter}</span>}
    </label>
  );
});
Input.displayName = 'Input';
