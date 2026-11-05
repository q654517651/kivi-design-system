import {
  cloneElement,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils';
import { composeHandlers, pointRect, rectOf, useControllable, useFloating, useMergedRef, usePresence, type Placement } from '../hooks';
import './menu.css';

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
  /** 位置：相对触发器的方向和对齐，默认 bottom-start（下方、左对齐）。放不下会翻到另一边，左右不超出屏幕 */
  placement?: Placement;
  /** 离触发器的距离，默认 4（点开的浮层都是 4，见「设计规则 · 浮层」） */
  offset?: number;
  /** 菜单和触发器一样宽：下拉选择展开的列表用 */
  matchTriggerWidth?: boolean;
  /** 右键菜单：不用触发器，菜单出现在这个屏幕坐标（clientX、clientY）。要自己控制 open */
  anchorPoint?: { x: number; y: number };
  /** 点了菜单项就关闭，默认开。多选菜单要保持展开时关掉 */
  closeOnSelect?: boolean;
  /** 弹出的是菜单还是单选列表，写在触发器的 aria-haspopup 上，默认 menu。下拉选择用 listbox，弹出的是一块带输入的面板（时间筛选、参数）用 dialog：Tab 在面板里正常走，走出面板才关闭 */
  haspopup?: 'menu' | 'listbox' | 'dialog';
}

/**
 * 套着的弹出层：菜单项里「⋯」再弹出的菜单也挂在 body 上，不在外层弹出层的 DOM 里。
 * 里层打开时往外层登记，外层点外面、按 Esc 时认得它：点里层不关外层，Esc 先关里层
 */
type Register = (popup: RefObject<HTMLDivElement>) => () => void;
const NestContext = createContext<Register | null>(null);

const ITEMS = '.kv-menu-item:not(:disabled):not([aria-disabled="true"])';
const SELECTABLE = `${ITEMS}:not([aria-haspopup])`;
const EXIT_MS = 150;
/** 面板（haspopup="dialog"）里能用 Tab 走到的控件 */
const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const register = useContext(NestContext);
  const nested = useRef(new Set<RefObject<HTMLDivElement>>());
  // 里层登记到自己这里，也往上传给更外层
  const registerNested = useCallback<Register>(
    (popup) => {
      nested.current.add(popup);
      const off = register?.(popup);
      return () => {
        nested.current.delete(popup);
        off?.();
      };
    },
    [register],
  );
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

  // 自己是里层：弹出层挂着时登记到外层
  useEffect(() => {
    if (!mounted || !register) return;
    return register(popupRef);
  }, [mounted, register]);

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
      for (const r of nested.current) if (r.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // 里层还开着，让里层先关
      for (const r of nested.current) if (r.current) return;
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
      if (haspopup !== 'dialog') {
        // 菜单、单选列表：Tab 关闭并回到触发器
        e.preventDefault();
        close(true);
        return;
      }
      // 面板：Tab 在里面的控件之间正常走；走到头（往后到最后一个、往前到第一个）关闭并回到触发器
      const tabbable = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => el.getClientRects().length > 0);
      const active = document.activeElement;
      const atEnd = e.shiftKey
        ? !tabbable.length || active === tabbable[0] || active === e.currentTarget
        : !tabbable.length || active === tabbable[tabbable.length - 1];
      if (atEnd) {
        e.preventDefault();
        close(true);
      }
      return;
    }
    // 在输入框里（原地重命名）打字，方向键、Home、End 留给输入框
    if ((e.target as HTMLElement).closest('input, textarea')) return;
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

  // 面板：焦点移到面板和触发器之外（包括里层弹出层）就关闭，焦点留在它去的地方
  const onPopupBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (haspopup !== 'dialog') return;
    const to = e.relatedTarget as Node | null;
    if (!to || e.currentTarget.contains(to) || anchorRef.current?.contains(to)) return;
    for (const r of nested.current) if (r.current?.contains(to)) return;
    setOpen(false);
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
        onBlur={onPopupBlur}
        onClick={onPopupClick}
        onContextMenu={(e) => {
          // 菜单上点右键：不出浏览器的菜单，也不传给外层的右键处理
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <NestContext.Provider value={registerNested}>{children}</NestContext.Provider>
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
