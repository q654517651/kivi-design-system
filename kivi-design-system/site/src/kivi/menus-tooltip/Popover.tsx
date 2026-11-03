import {
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useRef,
  type FocusEvent,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils';
import {
  composeHandlers,
  rectOf,
  useControllable,
  useFloating,
  useHoverIntent,
  useMergedRef,
  usePresence,
  type FloatingPlacement,
} from '../hooks';
import './menus-tooltip.css';

export type PopoverTrigger = 'hover' | 'click';
export type PopoverPlacement = FloatingPlacement;

export interface PopoverProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'content' | 'title' | 'children'> {
  /** 气泡里的内容，比一句话长的说明。13 / 20，secondary */
  content: ReactNode;
  /** 标题。不写就只有内容 */
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
  /** 离触发元素的距离，默认 10（箭头 6 + 空 4） */
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
 * 带箭头的说明气泡：和 Tooltip 一样是实色 popup 底，但能放更多字（一个标题 + 一段话，最宽 320），
 * 箭头指着触发元素，用来和 Tooltip 区分。包住触发元素用：
 * `<Popover title="比例" content="决定画面宽高比。"><Button variant="secondary">比例</Button></Popover>`。
 * ref 给包住触发元素的外壳 span。这是代码层面的组件，Figma 里还没有，待确认
 */
export const Popover = forwardRef<HTMLSpanElement, PopoverProps>(function Popover(
  {
    content,
    title,
    trigger = 'hover',
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    placement = 'bottom',
    offset = 10,
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
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const skipFocus = useRef(false);

  useFloating(mounted, bubbleRef, () => (anchorRef.current ? rectOf(anchorRef.current) : null), placement, offset);

  // 悬停型：触发元素和气泡合起来算「里面」，离开后等 LEAVE_MS 才关；进来等 delay 才开
  const hover = useHoverIntent(LEAVE_MS);
  const wasInside = useRef(false);
  useEffect(() => {
    if (click || wasInside.current === hover.inside) return;
    wasInside.current = hover.inside;
    setOpen(hover.inside);
  }, [click, hover.inside, setOpen]);
  useEffect(() => () => clearTimeout(timer.current), []);

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

  const aria = click
    ? { 'aria-haspopup': 'dialog' as const, 'aria-expanded': open, 'aria-controls': open ? id : undefined }
    : { 'aria-describedby': open ? id : undefined };

  return (
    <>
      <span
        ref={setAnchor}
        className={cx('kv-popover__anchor', className)}
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
            className="kv-popover"
            role={click ? 'dialog' : 'tooltip'}
            aria-labelledby={click && title !== undefined ? titleId : undefined}
            tabIndex={click ? -1 : undefined}
            data-state={state}
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
            <span className="kv-popover__arrow" aria-hidden="true" />
            {title !== undefined && (
              <b id={titleId} className="kv-popover__title">
                {title}
              </b>
            )}
            <div className="kv-popover__text">{content}</div>
          </div>,
          document.body,
        )}
    </>
  );
});
Popover.displayName = 'Popover';
