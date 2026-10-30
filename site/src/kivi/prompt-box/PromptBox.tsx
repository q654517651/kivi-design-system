import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../utils';
import { composeHandlers, useControllable, useMergedRef } from '../hooks';
import { PromptBoxContext } from './context';
import './prompt-box.css';

export interface PromptBoxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children'> {
  /** 提示词。传了就是受控，要自己在 onChange 里更新 */
  value?: string;
  /** 非受控时的初始提示词 */
  defaultValue?: string;
  /** 提示词变了触发，参数是新的文字 */
  onChange?: (value: string) => void;
  /** 没输入时的占位文字，随模式变，比如「描述你想生成的视频，@ 引用参考素材」 */
  placeholder?: string;
  /** 参考区，放在提示词左边：ReferenceStack，或首尾帧这样固定的两格（ReferenceItem、ReferenceAddSlot）。不传就没有参考区 */
  references?: ReactNode;
  /** 工具条左边，从左到右：任务类型、参考方式、模型、参数、其他开关。一般是无底的 Select */
  toolbar?: ReactNode;
  /** 工具条右边：张数、生成按钮 */
  actions?: ReactNode;
  /** 提示词最高多高，超过就在里面滚动，数字按 px。默认 240。Figma 没定，待定 */
  maxHeight?: number;
  /** 把文件拖进输入框时触发，参数是文件列表。不传就不接收拖拽。拖进来的样子 Figma 没定，待定 */
  onDropFiles?: (files: File[]) => void;
  /** 提示词输入框的 ref，聚焦、选中用 */
  inputRef?: Ref<HTMLTextAreaElement>;
  /** 提示词输入框的说明，读屏用，默认「提示词」 */
  inputLabel?: string;
}

/** 参考区展开时，盖不住的字从盖住的边往右渐隐出来，渐隐这么宽 */
const FADE = 40;

/**
 * 主站首页的创作输入框，主站 Agent 专用。上面是内容区（参考区 + 提示词），下面是工具条：左边先选任务类型，后面的控件跟着模式和模型变；右边是张数和生成。
 * 提示词是多行的，随内容长高，超过最高高度就在里面滚动；参考区展开时浮在提示词上面，被盖住的字藏起来。
 * 它只管外框、内容区和工具条的排版，工具条里放什么由 toolbar、actions 决定。Figma「模板 · 主站」页「输入框」分区。
 */
export const PromptBox = forwardRef<HTMLDivElement, PromptBoxProps>(function PromptBox(
  {
    value: valueProp,
    defaultValue = '',
    onChange,
    placeholder,
    references,
    toolbar,
    actions,
    maxHeight = 240,
    onDropFiles,
    inputRef,
    inputLabel = '提示词',
    className,
    onDragOver,
    onDragLeave,
    onDrop,
    ...rest
  },
  ref,
) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onChange);
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const setRefs = useMergedRef(textRef, inputRef);
  const [dragOver, setDragOver] = useState(false);

  // 随内容长高：先放开高度量一下内容多高，再夹在最低（CSS 里的 120）和最高之间
  const fit = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [maxHeight]);
  useLayoutEffect(fit, [fit, value]);
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // 宽度变了换行会变，重新量一次
    let width = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        fit();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  // 参考区展开了多宽，就把提示词左边这么宽、4 行高的一块藏起来（再多一段渐隐）
  const ctx = useMemo(
    () => ({
      setCoverWidth: (width: number, duration?: string) => {
        const el = textRef.current;
        if (!el) return;
        const over = width - el.offsetLeft;
        el.style.setProperty('--kv-prompt-cover', over > 0 ? `${over + FADE}px` : '0px');
        if (duration) el.style.setProperty('--kv-prompt-cover-duration', duration);
      },
    }),
    [],
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!onDropFiles || !Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    setDragOver(true);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!onDropFiles) return;
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onDropFiles(files);
  };

  return (
    <PromptBoxContext.Provider value={ctx}>
      <div
        ref={ref}
        className={cx('kv-prompt-box', className)}
        data-dragover={dragOver ? '' : undefined}
        onDragOver={composeHandlers(onDragOver, handleDragOver)}
        onDragLeave={composeHandlers(onDragLeave, () => setDragOver(false))}
        onDrop={composeHandlers(onDrop, handleDrop)}
        {...rest}
      >
        <div className="kv-prompt-box__content">
          {references != null && references !== false && <div className="kv-prompt-box__refs">{references}</div>}
          <textarea
            ref={setRefs}
            className="kv-prompt-box__input"
            aria-label={inputLabel}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        {(toolbar != null || actions != null) && (
          <div className="kv-prompt-box__toolbar">
            <div className="kv-prompt-box__toolbar-start">{toolbar}</div>
            <div className="kv-prompt-box__toolbar-end">{actions}</div>
          </div>
        )}
      </div>
    </PromptBoxContext.Provider>
  );
});
PromptBox.displayName = 'PromptBox';
