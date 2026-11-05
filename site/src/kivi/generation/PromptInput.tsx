import { forwardRef, useRef, type ClipboardEvent, type DragEvent, type HTMLAttributes, type ReactNode } from 'react';
import { composeHandlers } from '../hooks/composeHandlers';
import { cx } from '../utils';
import './generation.css';

export interface PromptInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'placeholder'> {
  /** 没输入时的占位文字，比如「描述任何你想要生成的内容」 */
  placeholder?: string;
  /** 开头的内容：文字，中间可以插 MentionChip。只在第一次渲染时用，之后由用户编辑 */
  children?: ReactNode;
}

/** 提示词输入：无底、无内边距，14 号字，可以插 @素材（MentionChip）。表单里的多行输入用 Textarea，不用它。Figma「画布」页 PromptInput */
export const PromptInput = forwardRef<HTMLDivElement, PromptInputProps>(function PromptInput(
  { placeholder, className, children, onPaste, onDragStart, onDragEnd, onDrop, ...rest },
  ref,
) {
  // 框里自己拖动文字（挪位置）照浏览器默认，带的就是框里的样子
  const draggingInside = useRef(false);

  // 粘贴、拖进来只要纯文字：从网页、文档复制来的会带字号、颜色、底色，contentEditable 会照原样贴进来
  const pastePlain = (e: ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return; // 没有文字（比如粘贴图片）就照浏览器默认，交给外面处理
    e.preventDefault();
    insertPlain(e.currentTarget, text);
  };
  const dropPlain = (e: DragEvent<HTMLDivElement>) => {
    if (draggingInside.current || e.dataTransfer.types.includes('Files')) return; // 拖文件交给外面的 DropOverlay
    const text = e.dataTransfer.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    // 光标放到松手的位置再插
    const range = caretRangeAt(e.clientX, e.clientY);
    const sel = window.getSelection();
    if (range && sel && e.currentTarget.contains(range.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    e.currentTarget.focus();
    insertPlain(e.currentTarget, text);
  };

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
      onPaste={composeHandlers(onPaste, pastePlain)}
      onDragStart={composeHandlers(onDragStart, () => {
        draggingInside.current = true;
      })}
      onDragEnd={composeHandlers(onDragEnd, () => {
        draggingInside.current = false;
      })}
      onDrop={composeHandlers(onDrop, dropPlain)}
      {...rest}
    >
      {children}
    </div>
  );
});
PromptInput.displayName = 'PromptInput';

/** 在光标处插纯文字。insertText 会触发 input 事件、能撤销；它不可用时退回手动插入 */
function insertPlain(el: HTMLElement, text: string) {
  if (document.execCommand('insertText', false, text)) return;
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/** 屏幕坐标处的光标位置：Chrome、Safari 用 caretRangeFromPoint，Firefox 用 caretPositionFromPoint */
function caretRangeAt(x: number, y: number): Range | null {
  const doc = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
  if (doc.caretPositionFromPoint) {
    const pos = doc.caretPositionFromPoint(x, y);
    if (!pos) return null;
    const range = document.createRange();
    range.setStart(pos.offsetNode, pos.offset);
    return range;
  }
  return document.caretRangeFromPoint?.(x, y) ?? null;
}
