import {
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils';
import { composeHandlers, pointRect, rectOf, useControllable, useFloating, useMergedRef, usePresence, type Placement } from '../hooks';
import './menus-tooltip.css';

export type { Placement as DropdownPlacement };

export interface DropdownProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** 触发器：点它开关菜单，比如 Button、IconButton。会自动加上 aria-haspopup、aria-expanded。右键菜单不用写，改用 anchorPoint */
  trigger?: ReactElement;
  /** 弹出来的内容，一般是一个 Menu */
  children: ReactNode;
  /** 展开（受控） */
  open?: boolean;
  /** 默认是否展开（非受控） */
  defaultOpen?: boolean;
  /** 展开状态变化。点外面、按 Esc、点菜单项关闭时都会以 false 调用 */
  onOpenChange?: (open: boolean) => void;
  /** 位置：相对触发器的方向和对齐，默认 bottom-start（下方、左对齐）。放不下会翻到另一边，左右不超出屏幕。Figma 没定，待定 */
  placement?: Placement;
  /** 离触发器的距离，默认 4。Figma 没定，待定 */
  offset?: number;
  /** 菜单和触发器一样宽：下拉选择展开的列表用 */
  matchTriggerWidth?: boolean;
  /** 右键菜单：不用触发器，菜单出现在这个屏幕坐标（clientX、clientY）。要自己控制 open */
  anchorPoint?: { x: number; y: number };
  /** 点了菜单项就关闭，默认开。多选菜单要保持展开时关掉 */
  closeOnSelect?: boolean;
  /** 弹出的是菜单还是单选列表，写在触发器的 aria-haspopup 上，默认 menu。下拉选择用 listbox */
  haspopup?: 'menu' | 'listbox';
}

const ITEMS = '.kv-menu-item:not(:disabled):not([aria-disabled="true"])';
const SELECTABLE = `${ITEMS}:not([aria-haspopup])`;
const EXIT_MS = 150;

/**
 * 把菜单弹出来：一个触发器 + 一个弹出的菜单。
 * 出现 200ms ease-out，消失 150ms ease-in；点菜单项、点外面、按 Esc 关闭；上下方向键在菜单项之间移动。
 * 弹出层挂在 body 上、position: fixed，不会被外层的 overflow 裁掉。
 * ref 给包住触发器的外壳 span；用 anchorPoint（没有触发器）时不渲染外壳，ref 是空的。
 * 这是代码层面的组件，Figma 里没有。
 */
export const Dropdown = forwardRef<HTMLSpanElement, DropdownProps>(function Dropdown(
  {
    trigger,
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    placement = 'bottom-start',
    offset = 4,
    matchTriggerWidth,
    anchorPoint,
    closeOnSelect = true,
    haspopup = 'menu',
    className,
    ...rest
  },
  ref,
) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const { mounted, state } = usePresence(open, EXIT_MS);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const setAnchor = useMergedRef(anchorRef, ref);
  const popupRef = useRef<HTMLDivElement>(null);
  const viaKeyboard = useRef(false);
  const id = useId();
  const match = Boolean(matchTriggerWidth && !anchorPoint);

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) (anchorRef.current?.firstElementChild as HTMLElement | null)?.focus();
  };

  useFloating(
    mounted,
    popupRef,
    () => (anchorPoint ? pointRect(anchorPoint.x, anchorPoint.y) : anchorRef.current ? rectOf(anchorRef.current) : null),
    placement,
    anchorPoint ? 0 : offset,
    match,
    anchorPoint && `${anchorPoint.x},${anchorPoint.y}`,
  );

  // 展开后把焦点放进菜单：键盘打开的落在第一项，鼠标打开的落在菜单上（再按方向键进入）
  useEffect(() => {
    if (!open) return;
    const el = popupRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>(ITEMS);
    (viaKeyboard.current && first ? first : el).focus({ preventScroll: true });
    viaKeyboard.current = false;
  }, [open, anchorPoint?.x, anchorPoint?.y]);

  // 点外面、按 Esc 关闭。Esc 在捕获阶段拦下，免得连外层的弹窗一起关
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popupRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close(true);
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const onPopupClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!closeOnSelect) return;
    const item = (e.target as HTMLElement).closest(SELECTABLE);
    if (item && e.currentTarget.contains(item)) close(true);
  };

  const onPopupKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      close(true);
      return;
    }
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(ITEMS));
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === 'ArrowDown') next = i < 0 ? 0 : (i + 1) % items.length;
    else if (e.key === 'ArrowUp') next = i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    items[next].focus();
  };

  const popup =
    mounted &&
    createPortal(
      <div
        ref={popupRef}
        id={id}
        className={cx('kv-popup', match && 'kv-popup--match')}
        data-state={state}
        tabIndex={-1}
        onKeyDown={onPopupKeyDown}
        onClick={onPopupClick}
        onContextMenu={(e) => {
          // 菜单上点右键：不出浏览器的菜单，也不传给外层的右键处理
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {children}
      </div>,
      document.body,
    );

  if (!trigger) return <>{popup}</>;

  const t = trigger as ReactElement<any>;
  const triggerEl = cloneElement(t, {
    'aria-haspopup': haspopup,
    'aria-expanded': open,
    'aria-controls': open ? id : undefined,
    onClick: composeHandlers(t.props.onClick, (e: MouseEvent<HTMLElement>) => {
      viaKeyboard.current = e.detail === 0;
      setOpen(!open);
    }),
    onKeyDown: composeHandlers(t.props.onKeyDown, (e: KeyboardEvent<HTMLElement>) => {
      if (open || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      e.preventDefault();
      viaKeyboard.current = true;
      setOpen(true);
    }),
  });

  return (
    <span ref={setAnchor} className={cx('kv-dropdown', className)} {...rest}>
      {triggerEl}
      {popup}
    </span>
  );
});
Dropdown.displayName = 'Dropdown';
