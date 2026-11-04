import {
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils';
import { composeHandlers, rectOf, useControllable, useFloating, useHoverIntent, useMergedRef, usePresence, type FloatingPlacement } from '../hooks';
import './tooltip.css';

export type PopoverTrigger = 'hover' | 'click';
export type PopoverPlacement = FloatingPlacement;
export type PopoverVariant = 'tip' | 'long' | 'panel';

export interface PopoverProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'content' | 'title' | 'children'> {
  /** 类型：提示（带箭头、实色底，标题加一段说明）/ 长文（没有箭头、实色底，给被截断的长文字看全文，和触发元素一样宽）/ 面板（没有箭头、玻璃底，放能操作的内容），默认提示 */
  variant?: PopoverVariant;
  /** 气泡里的内容。提示类：比一句话长的说明，13 / 20，secondary；长文类：被截断的那段文字的全文，14 / 22；面板类原样放进去，样式自己写 */
  content: ReactNode;
  /** 标题。不写就只有内容。长文类没有标题 */
  title?: ReactNode;
  /** 怎么出现：悬停（默认，鼠标能挪进气泡里，键盘聚焦也出）/ 点击（再点一下、点外面、按 Esc 关） */
  trigger?: PopoverTrigger;
  /** 显示（受控）。不传就按 trigger 自己出现和消失 */
  open?: boolean;
  /** 默认是否显示（非受控） */
  defaultOpen?: boolean;
  /** 显示状态变化 */
  onOpenChange?: (open: boolean) => void;
  /** 出在触发元素哪边，默认下方居中；放不下自动翻到对面。top / bottom / left / right，可以带 -start / -end 对齐 */
  placement?: PopoverPlacement;
  /** 离触发元素的距离。默认：提示、面板 10（箭头 6 + 空 4），长文 8（没有箭头） */
  offset?: number;
  /** 悬停多久后出现，毫秒，默认 200。只有悬停型用 */
  delay?: number;
  /** 禁用：不出现，触发元素照常 */
  disabled?: boolean;
  /** 点击型：点了气泡外面时调用，`event.preventDefault()` 可以拦住这次关闭（比如点的是别的浮层） */
  onInteractOutside?: (event: PointerEvent) => void;
  /** 触发元素，比如 Button、IconButton、一个图标。必须是能接 aria-* 属性的元素 */
  children: ReactElement;
}

const EXIT_MS = 100;
/** 鼠标从触发元素挪进气泡的路上不算离开 */
const LEAVE_MS = 150;

/**
 * 悬停型同时只留一个：新的出现时，正开着的那个立刻关掉（不等离开、不播消失），新的也不播出现，
 * 看上去是同一张换了位置和内容。不这样的话，从一行挪到下一行时两张会叠在一起淡入淡出，有重影
 */
let closeActiveHover: (() => void) | null = null;

/**
 * 说明性的话：Tooltip 只写工具名，要解释就用 Popover。实色 popup 底，一个标题 + 一段话，最宽 320，
 * 箭头指着触发元素。包住触发元素用：
 * `<Popover title="比例" content="决定画面宽高比。"><Button variant="secondary">比例</Button></Popover>`。
 * `variant="long"` 给被截断的长文字看全文（比如提示词）：没有箭头，和触发元素一样宽、至少 240，悬停出现。
 * `variant="panel"` 给能操作的悬停浮层：没有箭头，玻璃底，内容原样放进去（比如 Lora 设置）。
 * ref 给包住触发元素的外壳 span。这是代码层面的组件，Figma 里还没有，待确认
 */
export const Popover = forwardRef<HTMLSpanElement, PopoverProps>(function Popover(
  {
    variant = 'tip',
    content,
    title,
    trigger = 'hover',
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    placement = 'bottom',
    offset: offsetProp,
    delay = 200,
    disabled,
    onInteractOutside,
    children,
    className,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onClick,
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
  const id = useId();
  const titleId = useId();
  const click = trigger === 'click';
  const panel = variant === 'panel';
  const long = variant === 'long';
  const offset = offsetProp ?? (long ? 8 : 10);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const skipFocus = useRef(false);
  // 这次出现 / 消失是不是「换一个」：是就不播动画（见 closeActiveHover）
  const [swapIn, setSwapIn] = useState(false);
  const [swapOut, setSwapOut] = useState(false);

  // 长文和触发元素一样宽
  useFloating(mounted, bubbleRef, () => (anchorRef.current ? rectOf(anchorRef.current) : null), placement, offset, long);

  // 悬停型：触发元素和气泡合起来算「里面」，离开后等 LEAVE_MS 才关；进来等 delay 才开
  const hover = useHoverIntent(LEAVE_MS);
  const wasInside = useRef(false);
  useEffect(() => {
    if (click || wasInside.current === hover.inside) return;
    wasInside.current = hover.inside;
    setOpen(hover.inside);
  }, [click, hover.inside, setOpen]);
  useEffect(() => () => clearTimeout(timer.current), []);

  // 画之前就换掉，免得新的先闪一帧出现动画
  useLayoutEffect(() => {
    if (click || !open) return;
    const close = () => {
      clearTimeout(timer.current);
      hover.leave(0);
      setSwapOut(true);
      setOpen(false);
    };
    const prev = closeActiveHover;
    closeActiveHover = close;
    setSwapIn(prev !== null);
    setSwapOut(false);
    prev?.();
    return () => {
      if (closeActiveHover === close) closeActiveHover = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, click]);

  const enter = () => {
    clearTimeout(timer.current);
    if (disabled) return;
    timer.current = setTimeout(hover.enter, delay);
  };

  // 回到触发元素上：不让这次聚焦又把气泡打开
  const focusTrigger = () => {
    skipFocus.current = true;
    (anchorRef.current?.firstElementChild as HTMLElement | null)?.focus();
    skipFocus.current = false;
  };

  // 按 Esc 关闭并回到触发元素；点击型点外面也关。Esc 在捕获阶段拦下，免得连外层的弹窗一起关
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      clearTimeout(timer.current);
      hover.leave(0);
      setOpen(false);
      focusTrigger();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (bubbleRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onInteractOutside?.(e);
      if (!e.defaultPrevented) setOpen(false);
    };
    document.addEventListener('keydown', onKey, true);
    if (click) document.addEventListener('pointerdown', onDown, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onDown, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, click, onInteractOutside]);

  // 点击型打开后，把焦点放进气泡，读屏和键盘接着能用
  useEffect(() => {
    if (open && click) bubbleRef.current?.focus({ preventScroll: true });
  }, [open, click]);

  const inside = (el: EventTarget | null) =>
    el instanceof Node && (anchorRef.current?.contains(el) || bubbleRef.current?.contains(el));

  // 面板里有能操作的东西，不能当 tooltip 读：悬停型也按对话框的写法
  const aria = click || panel
    ? { 'aria-haspopup': 'dialog' as const, 'aria-expanded': open, 'aria-controls': open ? id : undefined }
    : { 'aria-describedby': open ? id : undefined };

  return (
    <>
      <span
        ref={setAnchor}
        className={cx('kv-popover__anchor', long && 'kv-popover__anchor--block', className)}
        onMouseEnter={composeHandlers(onMouseEnter, () => !click && enter())}
        onMouseLeave={composeHandlers(onMouseLeave, (e: MouseEvent<HTMLSpanElement>) => {
          if (click) return;
          clearTimeout(timer.current);
          // 挪进气泡里不算离开
          if (!inside(e.relatedTarget)) hover.leave();
        })}
        onFocus={composeHandlers(onFocus, (e: FocusEvent<HTMLSpanElement>) => {
          // 悬停型：键盘 Tab 到的才出现，鼠标点进去的不用
          if (click || disabled || skipFocus.current) return;
          if ((e.target as HTMLElement).matches(':focus-visible')) setOpen(true);
        })}
        onBlur={composeHandlers(onBlur, (e: FocusEvent<HTMLSpanElement>) => {
          if (click || inside(e.relatedTarget)) return;
          hover.leave(0);
          setOpen(false);
        })}
        onClick={composeHandlers(onClick, () => {
          if (click && !disabled) setOpen(!open);
        })}
        {...rest}
      >
        {cloneElement(children, aria)}
      </span>
      {mounted &&
        createPortal(
          <div
            ref={bubbleRef}
            id={id}
            className={cx('kv-popover', variant !== 'tip' && `kv-popover--${variant}`)}
            role={click || panel ? 'dialog' : 'tooltip'}
            aria-labelledby={(click || panel) && !long && title !== undefined ? titleId : undefined}
            tabIndex={click ? -1 : undefined}
            data-state={state}
            data-swap={(state === 'open' ? swapIn : swapOut) || undefined}
            onMouseEnter={() => {
              if (click) return;
              clearTimeout(timer.current);
              hover.enter();
            }}
            onMouseLeave={(e) => {
              // 挪回触发元素上不算离开
              if (click || anchorRef.current?.contains(e.relatedTarget as Node)) return;
              clearTimeout(timer.current);
              hover.leave();
            }}
            onBlur={(e) => {
              // 点击型：焦点移到气泡和触发元素之外就关
              if (click && e.relatedTarget && !inside(e.relatedTarget)) setOpen(false);
            }}
          >
            {!panel && !long && <span className="kv-popover__arrow" aria-hidden="true" />}
            {!long && title !== undefined && (
              <b id={titleId} className="kv-popover__title">
                {title}
              </b>
            )}
            {panel || long ? content : <div className="kv-popover__text">{content}</div>}
          </div>,
          document.body,
        )}
    </>
  );
});
Popover.displayName = 'Popover';
