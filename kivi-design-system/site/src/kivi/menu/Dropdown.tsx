import {
  cloneElement,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils';
import { composeHandlers, FloatingLayerContext, pointRect, rectOf, useControllable, useFloating, useLayerNesting, useMergedRef, usePresence, type FloatingPlacement, type Placement } from '../hooks';
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
  /** 位置：相对触发器的方向和对齐，默认 bottom-start（下方、左对齐）。放不下会翻到另一边，左右不超出屏幕。往左右出（right-start / left-start）只给子菜单用 */
  placement?: FloatingPlacement;
  /** 离触发器的距离，默认 4（点开的浮层都是 4，见「设计规则 · 浮层」） */
  offset?: number;
  /** 菜单和触发器一样宽：下拉选择展开的列表用 */
  matchTriggerWidth?: boolean;
  /** 右键菜单：不用触发器，菜单出现在这个屏幕坐标（clientX、clientY）。要自己控制 open */
  anchorPoint?: { x: number; y: number };
  /** 点了菜单项就关闭，默认开。多选菜单要保持展开时关掉 */
  closeOnSelect?: boolean;
  /**
   * 弹出的是菜单还是单选列表，写在触发器的 aria-haspopup 上，默认 menu。
   * 下拉选择用 listbox：打开时滚到选中的那一项（键盘打开的焦点也落在它上面），不和触发器一样宽时列表不比触发器窄。
   * 弹出的是一块带输入的面板（时间筛选、参数）用 dialog：Tab 在面板里正常走，走出面板才关闭
   */
  haspopup?: 'menu' | 'listbox' | 'dialog';
  /**
   * 悬停打开：子菜单用，一般不直接写，用 MenuSub。鼠标移上触发器就打开，移出触发器和菜单 150ms 后关；
   * 键盘右方向键打开、左方向键关掉回到触发器；点了里面的项，连外层菜单一起关
   */
  openOnHover?: boolean;
}

/** 外层菜单的关闭：子菜单里点了项，外层也跟着关 */
const ParentCloseContext = createContext<(() => void) | null>(null);
/** 悬停打开的：移出后等多久关，给鼠标斜着穿过空隙留时间 */
const HOVER_CLOSE_MS = 150;
/** 子菜单对齐外层菜单：触发器（菜单项）四周往外扩一个菜单内边距，子菜单的第一项和触发器对齐、离外层菜单边 4 */
const SUB_INSET = 4;

const ITEMS = '.kv-menu-item:not(:disabled):not([aria-disabled="true"])';
const SELECTABLE = `${ITEMS}:not([aria-haspopup])`;
/** 方向键能走到的：菜单项，加上分组标题右边的按钮（比如「新建画布」） */
const NAVIGABLE = `${ITEMS}, .kv-menu-label__action button:not(:disabled)`;
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
    openOnHover = false,
    className,
    onPointerEnter,
    onPointerLeave,
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
  const viaHover = useRef(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();
  const parentClose = useContext(ParentCloseContext);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const id = useId();
  const { nested, registerNested } = useLayerNesting(popupRef, mounted);
  const match = Boolean(matchTriggerWidth && !anchorPoint);

  // 单选列表不和触发器一样宽时（无底的 Select 很窄）：打开时量一下触发器，列表按内容撑宽，但不比它窄
  const [minWidth, setMinWidth] = useState<number>();
  useLayoutEffect(() => {
    if (open && haspopup === 'listbox' && !match) setMinWidth(anchorRef.current?.offsetWidth);
  }, [open, haspopup, match]);

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) (anchorRef.current?.firstElementChild as HTMLElement | null)?.focus();
  };

  useFloating(
    mounted,
    popupRef,
    () => {
      if (anchorPoint) return pointRect(anchorPoint.x, anchorPoint.y);
      if (!anchorRef.current) return null;
      const a = rectOf(anchorRef.current);
      if (!openOnHover) return a;
      return { ...a, left: a.left - SUB_INSET, right: a.right + SUB_INSET, top: a.top - SUB_INSET, bottom: a.bottom + SUB_INSET, width: a.width + SUB_INSET * 2 };
    },
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
    // 单选列表有选中的：落在选中的那一项，长列表先滚到它
    const current = haspopup === 'listbox' ? el.querySelector<HTMLElement>(`${ITEMS}[aria-selected="true"]`) : null;
    current?.scrollIntoView({ block: 'nearest' });
    const first = current ?? el.querySelector<HTMLElement>(ITEMS);
    // 悬停打开的子菜单不抢焦点，焦点留在外层菜单
    if (!viaHover.current) (viaKeyboard.current && first ? first : el).focus({ preventScroll: true });
    viaKeyboard.current = false;
    viaHover.current = false;
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
      if (e.key !== 'Escape' || e.isComposing) return;
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
    if (!item || !e.currentTarget.contains(item)) return;
    close(true);
    if (openOnHover) parentClose?.();
  };

  // 悬停打开：移上来就开，移出去等一会儿再关（移到子菜单上会取消）
  const hoverOpen = () => {
    if (!openOnHover) return;
    clearTimeout(hoverTimer.current);
    if (!open) {
      viaHover.current = true;
      setOpen(true);
    }
  };
  const hoverClose = () => {
    if (!openOnHover) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
  };

  const onPopupKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // 里层弹出层的按键会经 React 冒上来（门户），只管自己的
    if (!(e.target instanceof Node) || !e.currentTarget.contains(e.target)) return;
    if (openOnHover && e.key === 'ArrowLeft') {
      e.preventDefault();
      close(true);
      return;
    }
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
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(NAVIGABLE));
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
        style={minWidth ? ({ '--kv-menu-min': `${minWidth}px` } as CSSProperties) : undefined}
        data-state={state}
        tabIndex={-1}
        onKeyDown={onPopupKeyDown}
        onBlur={onPopupBlur}
        onClick={onPopupClick}
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
        onContextMenu={(e) => {
          // 菜单上点右键：不出浏览器的菜单，也不传给外层的右键处理
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <FloatingLayerContext.Provider value={registerNested}>
          <ParentCloseContext.Provider value={() => close(true)}>{children}</ParentCloseContext.Provider>
        </FloatingLayerContext.Provider>
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
      // 悬停已经打开的子菜单，点触发器不关
      setOpen(openOnHover ? true : !open);
    }),
    onKeyDown: composeHandlers(t.props.onKeyDown, (e: KeyboardEvent<HTMLElement>) => {
      const opens = openOnHover ? e.key === 'ArrowRight' : e.key === 'ArrowDown' || e.key === 'ArrowUp';
      if (open || !opens) return;
      e.preventDefault();
      viaKeyboard.current = true;
      setOpen(true);
    }),
  });

  return (
    <span
      ref={setAnchor}
      className={cx('kv-dropdown', openOnHover && 'kv-dropdown--sub', className)}
      onPointerEnter={composeHandlers(onPointerEnter, hoverOpen)}
      onPointerLeave={composeHandlers(onPointerLeave, hoverClose)}
      {...rest}
    >
      {triggerEl}
      {popup}
    </span>
  );
});
Dropdown.displayName = 'Dropdown';

export interface MenuSubProps extends Omit<DropdownProps, 'trigger' | 'openOnHover' | 'placement' | 'offset' | 'anchorPoint' | 'matchTriggerWidth'> {
  /** 触发器：一个 MenuItem（图标 + 名字），会自动加上右边的箭头 */
  trigger: ReactElement;
  /** 往哪边甩：默认右边，右边放不下自动翻到左边 */
  placement?: 'right-start' | 'left-start';
}

/**
 * 子菜单：菜单里「切换」类的项（语言、主题）。触发器右边带箭头，悬停往一边甩出第二层菜单，第一项和触发器对齐、离外层菜单 4。
 * 打开时触发器保持悬停底色；点了第二层的项，两层一起关。键盘：右方向键打开，左方向键收回。
 * ref 给包住触发器的外壳 span。这是代码层面的组件，Figma 里没有。
 */
export const MenuSub = forwardRef<HTMLSpanElement, MenuSubProps>(function MenuSub({ trigger, placement = 'right-start', children, ...rest }, ref) {
  return (
    <Dropdown
      ref={ref}
      openOnHover
      placement={placement}
      trigger={cloneElement(trigger as ReactElement<any>, { submenu: true })}
      {...rest}
    >
      {children}
    </Dropdown>
  );
});
MenuSub.displayName = 'MenuSub';
