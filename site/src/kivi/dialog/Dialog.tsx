import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../button';
import { cx } from '../utils';
import { useControllable, useMergedRef, usePresence, useScrollLock } from '../hooks';
import './dialog.css';

export type DialogSize = 's' | 'm' | 'l' | 'xl' | 'full';

const has = (node: ReactNode) => node !== undefined && node !== null && node !== false && node !== '';

/** 读 tokens.css 里的时长变量（系统开了「减少动态效果」时是 0） */
function cssMs(name: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  if (Number.isNaN(n)) return fallback;
  return v.endsWith('ms') ? n : v.endsWith('s') ? n * 1000 : n;
}

export interface DialogPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 宽度：S 400 / M 720 / L 1024 / XL 1200 / 全屏 100vw（待定），默认 S。结构、内边距、间距都一样 */
  size?: DialogSize;
  /** 标题。不传就没有标题栏（关闭按钮也跟着没有） */
  title?: ReactNode;
  /** 描述：一句话说明要做什么，或者操作的后果。和标题栏间距 8 */
  description?: ReactNode;
  /** 底栏：按钮靠右，间距 8。放大号 Button：取消用次要，确认用主要；删除确认把主要换成危险 */
  footer?: ReactNode;
  /** 标题栏里的关闭按钮，默认显示。只有传了 title 才有标题栏 */
  showClose?: boolean;
  /** 点关闭按钮 */
  onClose?: () => void;
  /** 标题的 id，给 aria-labelledby 用 */
  titleId?: string;
  /** 描述的 id，给 aria-describedby 用 */
  descriptionId?: string;
}

/**
 * 弹窗本体：只有那个盒子，没有遮罩、没有开关。Figma「弹窗」页的 Dialog 画的就是它。
 * 文档里摆静态示意用；项目里用 Dialog。children 是内容区。
 */
export const DialogPanel = forwardRef<HTMLDivElement, DialogPanelProps>(function DialogPanel(
  {
    size = 's',
    title,
    description,
    footer,
    showClose = true,
    onClose,
    titleId,
    descriptionId,
    className,
    children,
    ...rest
  },
  ref,
) {
  const hasTitle = has(title);
  const hasDesc = has(description);
  return (
    <div ref={ref} className={cx('kv-dialog', `kv-dialog--${size}`, className)} {...rest}>
      {(hasTitle || hasDesc) && (
        <div className="kv-dialog__top">
          {hasTitle && (
            <div className="kv-dialog__header">
              <div className="kv-dialog__title" id={titleId}>
                {title}
              </div>
              {showClose && <IconButton icon="Close" label="关闭" size={32} variant="text" onClick={onClose} />}
            </div>
          )}
          {hasDesc && (
            <div className="kv-dialog__desc" id={descriptionId}>
              {description}
            </div>
          )}
        </div>
      )}
      {has(children) && <div className="kv-dialog__body">{children}</div>}
      {has(footer) && <div className="kv-dialog__footer">{footer}</div>}
    </div>
  );
});
DialogPanel.displayName = 'DialogPanel';

export interface DialogProps extends Omit<DialogPanelProps, 'onClose' | 'titleId' | 'descriptionId'> {
  /** 打开。传了就是受控，要自己在 onOpenChange 里改 */
  open?: boolean;
  /** 非受控时一开始是不是打开的 */
  defaultOpen?: boolean;
  /** 想打开或关闭时调用：按 Esc、点遮罩、点关闭按钮都会传 false */
  onOpenChange?: (open: boolean) => void;
  /** 点遮罩关闭，默认可以。有表单或没保存内容的弹窗设成 false，只能点关闭或取消 */
  closeOnMaskClick?: boolean;
  /** 按 Esc 关闭，默认可以。二级弹窗开着时，Esc 先关最上面的那个 */
  closeOnEsc?: boolean;
}

// 现在打开着的弹窗，最后一个在最上面；Esc 和 Tab 只给它
interface StackEntry {
  mask: () => HTMLElement | null;
}
const stack: StackEntry[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Tab 不跑出弹窗：到头了绕回去；焦点跑到外面了拉回来 */
function trapTab(e: KeyboardEvent, panel: HTMLElement | null | undefined) {
  if (!panel) return;
  const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
  const active = document.activeElement;
  if (!items.length) {
    e.preventDefault();
    panel.focus({ preventScroll: true });
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (!panel.contains(active)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus({ preventScroll: true });
  } else if (e.shiftKey && (active === first || active === panel)) {
    e.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus({ preventScroll: true });
  }
}

/**
 * 模态弹窗：盖住页面，让用户先处理这一件事。Figma「弹窗」页 Dialog。
 * 用 createPortal 挂到 body；关闭的动画放完才拿掉。className、ref 和其余属性落在弹窗本体 .kv-dialog 上。
 */
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { open: openProp, defaultOpen = false, onOpenChange, closeOnMaskClick = true, closeOnEsc = true, ...panelProps },
  ref,
) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);

  // 在不在 body 里（关闭时多留一个退出动画的时长）；entered：遮罩放开了没（aria-hidden 的反面，动画靠它切）
  const exitMs = useMemo(() => cssMs('--motion-duration-200', 200), [open]);
  const { mounted } = usePresence(open, exitMs);
  // 在 body 里期间锁背景滚动（退出动画放完才放开）；多层弹窗最后一个关掉才恢复
  useScrollLock(mounted);
  const [entered, setEntered] = useState(false);
  const maskRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(panelRef, ref);
  const downOnMask = useRef(false);

  const reactId = useId();
  const titleId = `${reactId}-title`;
  const descId = `${reactId}-desc`;

  const requestClose = () => setOpen(false);
  // 键盘监听只在打开时绑一次，用 ref 拿最新的回调
  const latest = useRef({ requestClose, closeOnEsc });
  latest.current = { requestClose, closeOnEsc };

  // 打开：先挂上（还是隐藏的），把样式算一遍，再放开，过渡才会播
  useLayoutEffect(() => {
    if (!open) return;
    maskRef.current?.getBoundingClientRect();
    setEntered(true);
  }, [open]);

  // 关闭：先收起来播退出动画，放完再从 body 里拿掉（usePresence）
  useEffect(() => {
    if (!open) setEntered(false);
  }, [open]);

  // 放开之后把焦点给弹窗
  useEffect(() => {
    if (!open || !entered) return;
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
  }, [open, entered]);

  // 一进一出都在这里：Esc 关最上面那个、Tab 不跑出去，关闭时把焦点还给原来的地方。
  // 还焦点要赶在遮罩加上 aria-hidden 之前（焦点还在里面时加 aria-hidden，浏览器会警告）：
  // 这里的清理函数比上面 setEntered(false) 先跑，所以放在 useEffect 里；放 layout effect 会被 React 提交后自己恢复的焦点盖掉。
  // 里面的组件自己处理了 Esc（preventDefault）就不再关
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const entry: StackEntry = { mask: () => maskRef.current };
    stack.push(entry);
    const onKeyDown = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== entry || e.defaultPrevented || e.isComposing) return;
      if (e.key === 'Escape') {
        if (!latest.current.closeOnEsc) return;
        e.preventDefault();
        latest.current.requestClose();
      } else if (e.key === 'Tab') {
        trapTab(e, panelRef.current);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      stack.splice(stack.indexOf(entry), 1);
      // 原来那个按钮在另一个也在关的弹窗里（两层一起关）就不还了，让最下面那层还
      const owner = previous?.closest('.kv-dialog__mask');
      const ownerOpen = !owner || stack.some((s) => s.mask() === owner);
      if (previous?.isConnected && ownerOpen) previous.focus({ preventScroll: true });
      // 没地方可还（原来的焦点在 body 上）：也要把焦点从弹窗里拿出来
      const active = document.activeElement as HTMLElement | null;
      if (active && maskRef.current?.contains(active)) active.blur();
    };
  }, [open]);

  if (!mounted || typeof document === 'undefined') return null;

  const hasTitle = has(panelProps.title);
  const hasDesc = has(panelProps.description);

  return createPortal(
    <div
      ref={maskRef}
      className="kv-dialog__mask"
      aria-hidden={!entered}
      // 按下和松开都在遮罩上才算点遮罩，在弹窗里选文字拖到外面松手不关
      onMouseDown={(e) => {
        downOnMask.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (closeOnMaskClick && downOnMask.current && e.target === e.currentTarget) requestClose();
        downOnMask.current = false;
      }}
    >
      <DialogPanel
        ref={mergedRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-describedby={hasDesc ? descId : undefined}
        tabIndex={-1}
        {...panelProps}
        titleId={titleId}
        descriptionId={descId}
        onClose={requestClose}
      />
    </div>,
    document.body,
  );
});
Dialog.displayName = 'Dialog';
