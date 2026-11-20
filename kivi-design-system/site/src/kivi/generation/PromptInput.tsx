import { forwardRef, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type CSSProperties, type DragEvent, type HTMLAttributes, type ReactNode } from 'react';
import { composeHandlers } from '../hooks/composeHandlers';
import { useMergedRef } from '../hooks/useMergedRef';
import { insertMention, promptText, trackCaret, type MentionSource } from './mentions';
import { Dropdown, Menu, MenuItem } from '../menu';
import { AssetThumb } from '../tags-avatar';
import { cx } from '../utils';
import './generation.css';

export interface PromptInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'placeholder'> {
  /** 回车时触发（Shift + 回车换行；打 @ 弹出的素材菜单开着时回车先给菜单选；输入法选字时不算）。不传就是回车换行。主站 Agent 模式用来发送 */
  onEnter?: () => void;
  /** 没输入时的占位文字，比如「描述任何你想要生成的内容」 */
  placeholder?: string;
  /** 开头的内容：文字，中间可以插 MentionChip。只在第一次渲染时用，之后由用户编辑 */
  children?: ReactNode;
  /** 最少几行高，默认 4（照线上）。工具弹窗里一横条的输入框用 1 */
  minRows?: number;
  /** 最多长到几行，再多滚动，默认 6 */
  maxRows?: number;
  /** 打 @ 能引用的素材（照线上）：打「@」弹出菜单列出这些素材（缩略图 + 名字），接着打字按名字筛，↑ ↓ 挑、回车或点一下插进 @ 标签，Esc 关。不传或空的就不弹 */
  mentions?: MentionSource[];
  /** 最多多少个字符（一个表情算一个，@ 标签按「@图片1」算），照线上 MentionInput：超了输入前拦住、粘贴超了截掉，不弹提示。不传不限 */
  maxLength?: number;
}

/** 打 @ 时的状态：@ 在哪个文字节点的第几个字，后面打了什么，@ 这个字在屏幕上的位置 */
interface AtState {
  node: Text;
  at: number;
  query: string;
  x: number;
  y: number;
  top: number;
}

/** @ 后面打了超过这么多字还没有匹配的，就不再弹「暂无结果」（照线上） */
const NO_RESULT_MAX = 7;

/** 提示词输入：无底、无内边距，14 号字，可以插 @素材（MentionChip）。表单里的多行输入用 Textarea，不用它。Figma「画布」页 PromptInput */
export const PromptInput = forwardRef<HTMLDivElement, PromptInputProps>(function PromptInput(
  { placeholder, minRows = 4, maxRows = 6, mentions, maxLength, onEnter, className, style, children, onPaste, onDragStart, onDragEnd, onDrop, onInput, onCompositionEnd, onKeyDown, onKeyUp, onClick, ...rest },
  ref,
) {
  // 开头的内容只用第一次的：之后框里由用户编辑，外面再传新的（比如画布节点存的提示词每打一个字都变）不重画，不然会把 @ 标签冲成纯文字、光标跳回开头
  const [initial] = useState(children);
  // 框里自己拖动文字（挪位置）照浏览器默认，带的就是框里的样子
  const draggingInside = useRef(false);
  // 记住光标位置：点参考缩略图快捷 @ 时焦点已经离开，插在离开前的光标处
  const elRef = useRef<HTMLDivElement>(null);
  const setRef = useMergedRef(elRef, ref);
  useEffect(() => (elRef.current ? trackCaret(elRef.current) : undefined), []);

  // ---------- 字数上限 ----------
  // 输入前拦住：算上选中会被替换掉的字，超了就不让输入。输入法拼写中拦不住，等拼完（compositionend）再删掉超出的
  const maxRef = useRef(maxLength);
  maxRef.current = maxLength;
  const room = (el: HTMLElement) => {
    const max = maxRef.current;
    if (max == null) return Infinity;
    return max - (count(promptText(el)) - count(window.getSelection()?.toString() ?? ''));
  };
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const block = (e: InputEvent) => {
      if (maxRef.current == null || e.isComposing || !e.inputType.startsWith('insert')) return;
      const incoming = e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak' ? 1 : count(e.data ?? e.dataTransfer?.getData('text/plain') ?? '');
      if (incoming > room(el)) e.preventDefault();
    };
    el.addEventListener('beforeinput', block as EventListener);
    return () => el.removeEventListener('beforeinput', block as EventListener);
  }, []);
  const trimOver = () => {
    const el = elRef.current;
    if (!el || maxRef.current == null) return;
    for (let over = -room(el); over > 0; over -= 1) document.execCommand('delete');
  };

  // ---------- 打 @ 弹出素材菜单 ----------
  const [at, setAt] = useState<AtState | null>(null);
  const [hi, setHi] = useState(0);
  // 按 Esc、点外面关掉的那个 @：光标还停在它后面时不再弹
  const dismissed = useRef<{ node: Text; at: number } | null>(null);
  const readAt = () => {
    const el = elRef.current;
    const sel = window.getSelection();
    if (!mentions?.length || !el || !sel?.rangeCount || !sel.isCollapsed) return setAt(null);
    const r = sel.getRangeAt(0);
    const node = r.endContainer;
    if (node.nodeType !== Node.TEXT_NODE || !el.contains(node)) return setAt(null);
    const m = (node as Text).data.slice(0, r.endOffset).match(/@([^\s@]*)$/);
    if (!m) return setAt(null);
    const index = r.endOffset - m[0].length;
    if (dismissed.current?.node === node && dismissed.current.at === index) return setAt(null);
    const mark = document.createRange();
    mark.setStart(node, index);
    mark.setEnd(node, index + 1);
    const rect = mark.getBoundingClientRect();
    setAt((prev) => {
      if (prev?.query !== m[1]) setHi(0);
      return { node: node as Text, at: index, query: m[1], x: rect.left, y: rect.bottom, top: rect.top };
    });
  };
  const query = at?.query.toLowerCase() ?? '';
  const matches = at ? (mentions ?? []).filter((m) => m.name.toLowerCase().includes(query)) : [];
  const menuOpen = !!at && (matches.length > 0 || (query.length > 0 && query.length <= NO_RESULT_MAX));
  const pick = (m: MentionSource) => {
    if (!at) return;
    // 把打的「@名字」换成 @ 标签
    const range = document.createRange();
    range.setStart(at.node, at.at);
    range.setEnd(at.node, Math.min(at.node.length, at.at + 1 + at.query.length));
    setAt(null);
    insertMention(elRef.current, m, range);
  };
  const atKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!menuOpen || e.nativeEvent.isComposing || !matches.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((i) => (i + (e.key === 'ArrowDown' ? 1 : matches.length - 1)) % matches.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      pick(matches[Math.min(hi, matches.length - 1)]);
    }
  };

  // 粘贴、拖进来只要纯文字：从网页、文档复制来的会带字号、颜色、底色，contentEditable 会照原样贴进来
  const pastePlain = (e: ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return; // 没有文字（比如粘贴图片）就照浏览器默认，交给外面处理
    e.preventDefault();
    // 超过上限的部分截掉
    const fit = [...text].slice(0, Math.max(0, room(e.currentTarget))).join('');
    if (fit) insertPlain(e.currentTarget, fit);
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
    const fit = [...text].slice(0, Math.max(0, room(e.currentTarget))).join('');
    if (fit) insertPlain(e.currentTarget, fit);
  };

  return (
    <>
    <div
      ref={setRef}
      className={cx('kv-prompt-input', className)}
      style={{ '--kv-prompt-min-rows': minRows, '--kv-prompt-max-rows': maxRows, ...style } as CSSProperties}
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
      onInput={composeHandlers(onInput, readAt)}
      onCompositionEnd={composeHandlers(onCompositionEnd, trimOver)}
      onKeyDown={composeHandlers(onKeyDown, (e: KeyboardEvent<HTMLDivElement>) => {
        atKeys(e);
        if (e.defaultPrevented || !onEnter || e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
        e.preventDefault();
        onEnter();
      })}
      onKeyUp={composeHandlers(onKeyUp, (e: KeyboardEvent<HTMLDivElement>) => {
        // 方向键挑选项时不重读（重读会把高亮回到第一项）
        if (!(menuOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp'))) readAt();
      })}
      onClick={composeHandlers(onClick, readAt)}
      {...rest}
    >
      {initial}
    </div>
    {/* 菜单出在 @ 下面（放不下翻到上面，不盖住这一行），焦点留在输入框里，方向键由输入框管 */}
    <Dropdown
      open={menuOpen}
      onOpenChange={(open) => {
        if (open || !at) return;
        dismissed.current = { node: at.node, at: at.at };
        setAt(null);
      }}
      anchorPoint={at ? { x: at.x, y: at.y, top: at.top } : undefined}
      autoFocus={false}
      haspopup="listbox"
      closeOnSelect={false}
    >
      <Menu role="listbox" aria-label="引用素材" onMouseDown={(e) => e.preventDefault()}>
        {matches.length ? (
          matches.map((m, i) => (
            <MenuItem
              key={m.id}
              role="option"
              thumb={m.type === 'audio' ? undefined : <AssetThumb size={24} type="image" src={m.src} />}
              icon={m.type === 'audio' ? 'Music' : undefined}
              highlighted={i === hi}
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(m)}
            >
              {m.name}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>暂无结果</MenuItem>
        )}
      </Menu>
    </Dropdown>
    </>
  );
});
PromptInput.displayName = 'PromptInput';

/** 字符数：一个表情、生僻字算一个 */
const count = (s: string) => [...s].length;

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
