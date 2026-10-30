import {
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useRef,
  type FocusEvent,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils';
import { composeHandlers, rectOf, useControllable, useFloating, useMergedRef, usePresence } from '../hooks';
import './menus-tooltip.css';

export type TooltipVariant = 'simple' | 'desc';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLElement>, 'content' | 'title' | 'children'> {
  /** 提示的文字。简单：一行；说明：标题下面的那段说明 */
  content: ReactNode;
  /** 类型：简单 / 说明，默认简单。不写时有 title 就是说明 */
  variant?: TooltipVariant;
  /** 标题。只有说明型有 */
  title?: ReactNode;
  /** 快捷键，比如 ⌘Z。只有简单型有，放在文字后面 */
  shortcut?: string;
  /** 显示（受控）。不传就按悬停、聚焦自己出现和消失 */
  open?: boolean;
  /** 默认是否显示（非受控） */
  defaultOpen?: boolean;
  /** 显示状态变化 */
  onOpenChange?: (open: boolean) => void;
  /** 悬停多久后出现，毫秒，默认 500 */
  delay?: number;
  /** 触发元素，比如 IconButton。必须是能接 aria-describedby 的元素。不写就只渲染气泡本身（静态的，文档摆样子用） */
  children?: ReactElement;
}

const EXIT_MS = 100;

interface BubbleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'content'> {
  kind: TooltipVariant;
  content: ReactNode;
  title?: ReactNode;
  shortcut?: string;
  domRef?: Ref<HTMLDivElement>;
}

/** 气泡本身：简单一行，说明是标题 + 一段话 */
function Bubble({ kind, content, title, shortcut, domRef, className, ...rest }: BubbleProps) {
  return (
    <div ref={domRef} className={cx('kv-tooltip', kind === 'desc' && 'kv-tooltip--desc', className)} role="tooltip" {...rest}>
      {kind === 'desc' ? (
        <>
          <b className="kv-tooltip__title">{title}</b>
          <span className="kv-tooltip__text">{content}</span>
        </>
      ) : (
        <>
          {content}
          {shortcut && <span className="kv-tooltip__shortcut">{shortcut}</span>}
        </>
      )}
    </div>
  );
}

/**
 * 鼠标停留时出现的文字提示，移开就消失。包住触发元素用：
 * `<Tooltip content="下载"><IconButton icon="Download" label="下载" /></Tooltip>`。
 * ref 给包住触发元素的外壳 span；不包任何东西时给气泡本身。
 * Figma「菜单和提示」页 Tooltip
 */
export const Tooltip = forwardRef<HTMLElement, TooltipProps>(function Tooltip(
  {
    content,
    variant,
    title,
    shortcut,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    delay = 500,
    children,
    className,
    ...rest
  },
  ref,
) {
  const kind: TooltipVariant = variant ?? (title !== undefined ? 'desc' : 'simple');

  // 不包任何东西：静态的气泡
  if (!children) {
    return (
      <Bubble
        domRef={ref as Ref<HTMLDivElement>}
        kind={kind}
        content={content}
        title={title}
        shortcut={shortcut}
        className={className}
        {...rest}
      />
    );
  }
  return (
    <Anchored
      ref={ref as Ref<HTMLSpanElement>}
      bubble={{ kind, content, title, shortcut }}
      open={openProp}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      delay={delay}
      className={className}
      {...rest}
    >
      {children}
    </Anchored>
  );
});
Tooltip.displayName = 'Tooltip';

interface AnchoredProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  bubble: Pick<BubbleProps, 'kind' | 'content' | 'title' | 'shortcut'>;
  open?: boolean;
  defaultOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  delay: number;
  children: ReactElement;
}

const Anchored = forwardRef<HTMLSpanElement, AnchoredProps>(function Anchored(
  {
    bubble,
    open: openProp,
    defaultOpen,
    onOpenChange,
    delay,
    children,
    className,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onPointerDown,
    ...rest
  },
  ref,
) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const { mounted, state } = usePresence(open, EXIT_MS);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const setAnchor = useMergedRef(anchorRef, ref);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const id = useId();

  const stop = () => clearTimeout(timer.current);
  const show = () => {
    stop();
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    stop();
    setOpen(false);
  };
  useEffect(() => stop, []);

  // 按 Esc 收起
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  // 目标下方 8px（--spacing-8），水平居中
  useFloating(mounted, bubbleRef, () => (anchorRef.current ? rectOf(anchorRef.current) : null), 'bottom', 8);

  return (
    <span
      ref={setAnchor}
      className={cx('kv-tooltip__anchor', className)}
      onMouseEnter={composeHandlers(onMouseEnter, show)}
      onMouseLeave={composeHandlers(onMouseLeave, hide)}
      onFocus={composeHandlers(onFocus, (e: FocusEvent<HTMLSpanElement>) => {
        // 键盘 Tab 到的才出现，鼠标点进去的不用
        if ((e.target as HTMLElement).matches(':focus-visible')) show();
      })}
      onBlur={composeHandlers(onBlur, hide)}
      onPointerDown={composeHandlers(onPointerDown, hide)}
      {...rest}
    >
      {cloneElement(children, open ? { 'aria-describedby': id } : {})}
      {mounted &&
        createPortal(
          <Bubble {...bubble} id={id} domRef={bubbleRef} data-state={state} className="kv-tooltip--floating" />,
          document.body,
        )}
    </span>
  );
});
