import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils';
import './canvas.css';

export interface PromptInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'placeholder'> {
  /** 没输入时的占位文字，比如「描述任何你想要生成的内容」 */
  placeholder?: string;
  /** 开头的内容：文字，中间可以插 MentionChip。只在第一次渲染时用，之后由用户编辑 */
  children?: ReactNode;
}

/** 提示词输入：无底、无内边距，14 号字，可以插 @素材（MentionChip）。表单里的多行输入用 Textarea，不用它。Figma「画布」页 PromptInput */
export const PromptInput = forwardRef<HTMLDivElement, PromptInputProps>(function PromptInput(
  { placeholder, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('kv-prompt-input', className)}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={placeholder}
      data-placeholder={placeholder}
      {...rest}
    >
      {children}
    </div>
  );
});
PromptInput.displayName = 'PromptInput';
