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
import './tooltip.css';

export type TooltipPlacement = 'bottom' | 'top' | 'right' | 'left';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLElement>, 'content' | 'children'> {
  /** 工具名，一行。不写解释；要说明的话用 Popover */
  content: ReactNode;
  /** 快捷键，比如 ⌘Z，放在工具名后面 */
  shortcut?: string;
  /** 出在目标哪边，离目标 8，默认下方；放不下自动翻到对面。竖排的目标（收起的侧栏）用右边 */
  placement?: TooltipPlacement;
  /** 显示（受控）。不传就按悬停、聚焦自己出现和消失 */
  open?: boolean;
  /** 默认是否显示（非受控） */
  defaultOpen?: boolean;
  /** 显示状态变化 */
  onOpenChange?: (open: boolean) => void;
  /** 悬停多久后出现，毫秒，默认 500 */
  delay?: number;
  /** 禁用：不出现，触发元素照常 */
  disabled?: boolean;
  /** 触发元素，比如 IconButton。必须是能接 aria-describedby 的元素。不写就只渲染气泡本身（静态的，文档摆样子用） */
  children?: ReactElement;
}

const EXIT_MS = 100;

interface BubbleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  content: ReactNode;
  shortcut?: string;
  domRef?: Ref<HTMLDivElement>;
}

/** 气泡本身：工具名一行，可以带快捷键 */
function Bubble({ content, shortcut, domRef, className, ...rest }: BubbleProps) {
  return (
    <div ref={domRef} className={cx('kv-tooltip', className)} role="tooltip" {...rest}>
      {content}
      {shortcut && <span className="kv-tooltip__shortcut">{shortcut}</span>}
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
    shortcut,
    placement = 'bottom',
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    delay = 500,
    disabled,
    children,
    className,
    ...rest
  },
  ref,
) {
  // 不包任何东西：静态的气泡
  if (!children) {
    return (
      <Bubble
        domRef={ref as Ref<HTMLDivElement>}
        content={content}
        shortcut={shortcut}
        className={className}
        {...rest}
      />
    );
  }
  return (
    <Anchored
      ref={ref as Ref<HTMLSpanElement>}
      bubble={{ content, shortcut }}
      placement={placement}
      open={openProp}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      delay={delay}
      disabled={disabled}
      className={className}
      {...rest}
    >
      {children}
    </Anchored>
  );
});
Tooltip.displayName = 'Tooltip';

interface AnchoredProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  bubble: Pick<BubbleProps, 'content' | 'shortcut'>;
  placement: TooltipPlacement;
  open?: boolean;
  defaultOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  delay: number;
  disabled?: boolean;
  children: ReactElement;
}

const Anchored = forwardRef<HTMLSpanElement, AnchoredProps>(function Anchored(
  {
    bubble,
    placement,
    open: openProp,
    defaultOpen,
    onOpenChange,
    delay,
    disabled,
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
  const [openState, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const open = openState && !disabled;
  const { mounted, state } = usePresence(open, EXIT_MS);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const setAnchor = useMergedRef(anchorRef, ref);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const id = useId();

  const stop = () => clearTimeout(timer.current);
  const show = () => {
    stop();
    if (disabled) return;
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

  // 离目标 8px（--spacing-8），默认在下方、水平居中
  useFloating(mounted, bubbleRef, () => (anchorRef.current ? rectOf(anchorRef.current) : null), placement, 8);

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
