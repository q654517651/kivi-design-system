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
 * `<Tooltip content="重新生成"><Button>…</Button></Tooltip>`。IconButton 自带提示（内容是它的 label），不用再包。
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

export interface UseTooltipOptions {
  content: ReactNode;
  shortcut?: string;
  placement?: TooltipPlacement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delay?: number;
  disabled?: boolean;
}

/**
 * Tooltip 的行为：悬停 / 键盘聚焦出现，移开、按下、Esc 收起，气泡挂在 body 上、离目标 8。
 * Tooltip 用它包住触发元素；IconButton 直接用在自己的按钮上（自带提示，不多包一层）。
 * 返回：anchorRef 给目标元素，handlers 合到目标的事件上，describedBy 合到目标的 aria-describedby，bubble 渲染在目标旁边
 */
export function useTooltip({
  content,
  shortcut,
  placement = 'bottom',
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  delay = 500,
  disabled,
}: UseTooltipOptions) {
  const [openState, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const open = openState && !disabled;
  const { mounted, state } = usePresence(open, EXIT_MS);
  const anchorRef = useRef<HTMLElement>(null);
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

  // 按 Esc 收起。提示开着时在捕获阶段拦一下（preventDefault），弹窗靠它判断「Esc 已经有人处理了」，
  // 这样在弹窗里按 Esc 先关提示，不连弹窗一起关
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setOpen(false);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, setOpen]);

  // 离目标 8px（--spacing-8），默认在下方、水平居中
  useFloating(mounted, bubbleRef, () => (anchorRef.current ? rectOf(anchorRef.current) : null), placement, 8);

  return {
    anchorRef,
    handlers: {
      onMouseEnter: show,
      onMouseLeave: hide,
      // 键盘 Tab 到的才出现，鼠标点进去的不用
      onFocus: (e: FocusEvent<HTMLElement>) => {
        if ((e.target as HTMLElement).matches(':focus-visible')) show();
      },
      onBlur: hide,
      onPointerDown: hide,
    },
    describedBy: open ? id : undefined,
    bubble: mounted
      ? createPortal(
          <Bubble content={content} shortcut={shortcut} id={id} domRef={bubbleRef} data-state={state} className="kv-tooltip--floating" />,
          document.body,
        )
      : null,
  };
}

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
  { bubble, placement, open, defaultOpen, onOpenChange, delay, disabled, children, className, onMouseEnter, onMouseLeave, onFocus, onBlur, onPointerDown, ...rest },
  ref,
) {
  const tip = useTooltip({ ...bubble, placement, open, defaultOpen, onOpenChange, delay, disabled });
  const setAnchor = useMergedRef(tip.anchorRef as Ref<HTMLSpanElement>, ref);
  return (
    <span
      ref={setAnchor}
      className={cx('kv-tooltip__anchor', className)}
      onMouseEnter={composeHandlers(onMouseEnter, tip.handlers.onMouseEnter)}
      onMouseLeave={composeHandlers(onMouseLeave, tip.handlers.onMouseLeave)}
      onFocus={composeHandlers(onFocus, tip.handlers.onFocus)}
      onBlur={composeHandlers(onBlur, tip.handlers.onBlur)}
      onPointerDown={composeHandlers(onPointerDown, tip.handlers.onPointerDown)}
      {...rest}
    >
      {cloneElement(
        children,
        tip.describedBy
          ? { 'aria-describedby': [(children.props as { 'aria-describedby'?: string })['aria-describedby'], tip.describedBy].filter(Boolean).join(' ') }
          : {},
      )}
      {tip.bubble}
    </span>
  );
});
