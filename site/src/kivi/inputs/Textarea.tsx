import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cx } from '../utils';
import './inputs.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 字数，放在右下角，比如「0/500」。传什么显示什么，超没超限自己算 */
  counter?: ReactNode;
  /** 错误：加 1px danger 描边，字数也变 danger。等于在 textarea 上写 aria-invalid */
  invalid?: boolean;
  /** 类名、style 加在最外层的框上；其余属性（value、placeholder、disabled、onChange……）都给里面的 textarea */
  className?: string;
}

/**
 * 输入一段话：描述、备注。14 号字，是需要阅读的内容。Figma「输入控件」页 Textarea。
 * 默认 320 × 104，右下角能拖着改高度；宽度默认填满。没有可见标签时必须写 aria-label。
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { counter, invalid, className, style, ...rest },
  ref,
) {
  return (
    <label className={cx('kv-textarea', className)} style={style}>
      <textarea ref={ref} className="kv-textarea__field" aria-invalid={invalid || undefined} {...rest} />
      {counter != null && counter !== false && <span className="kv-textarea__counter">{counter}</span>}
    </label>
  );
});
Textarea.displayName = 'Textarea';
