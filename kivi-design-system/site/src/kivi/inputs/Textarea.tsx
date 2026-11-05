import { forwardRef, useRef, type MouseEvent, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cx } from '../utils';
import { useMergedRef } from '../hooks';
import './inputs.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 字数，放在右下角，比如「0/500」。传什么显示什么，超没超限自己算 */
  counter?: ReactNode;
  /** 框内按钮：放在框里右下角，字数在它左边。按钮用 28，比如取消 / 保存、提交 */
  actions?: ReactNode;
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
  { counter, actions, invalid, className, style, ...rest },
  ref,
) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const mergedRef = useMergedRef(ref, fieldRef);
  const hasCounter = counter != null && counter !== false;
  const hasActions = actions != null && actions !== false;
  const field = <textarea ref={mergedRef} className="kv-textarea__field" aria-invalid={invalid || undefined} {...rest} />;
  const footer = (hasCounter || hasActions) && (
    <span className="kv-textarea__footer">
      {hasCounter && <span className="kv-textarea__counter">{counter}</span>}
      {hasActions && <span className="kv-textarea__actions">{actions}</span>}
    </span>
  );

  // 没有按钮时整个框是 label，点空白处聚焦输入；label 里不能放按钮，有按钮时换成 div，点空白处自己聚焦
  if (!hasActions) {
    return (
      <label className={cx('kv-textarea', className)} style={style}>
        {field}
        {footer}
      </label>
    );
  }
  const focusField = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a, input, .kv-textarea__field')) return;
    e.preventDefault();
    fieldRef.current?.focus();
  };
  return (
    <div className={cx('kv-textarea', className)} style={style} onMouseDown={focusField}>
      {field}
      {footer}
    </div>
  );
});
Textarea.displayName = 'Textarea';
