import { forwardRef, useRef, useSyncExternalStore, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import { Toast } from './Toast';
import { getToast, setToastPaused, subscribeToast, toast } from './toast-store';
import './feedback.css';

export type ToasterProps = HTMLAttributes<HTMLDivElement>;

/**
 * Toast 弹出来的地方：页面顶部居中，距顶 24，同一时间只有一条。
 * 整个应用根上放一个就行，然后在哪里都能调 toast.show()，调用方式见 toast-store.ts。
 * 鼠标停在上面或键盘聚焦进去时暂停自动消失的计时，离开后接着走剩下的时间（带「撤销」的来得及点）。
 * className、ref 和其余属性落在外层 .kv-toaster 上。
 */
export const Toaster = forwardRef<HTMLDivElement, ToasterProps>(function Toaster(
  { className, onMouseEnter, onMouseLeave, onFocus, onBlur, ...rest },
  ref,
) {
  const item = useSyncExternalStore(subscribeToast, getToast, getToast);
  // 悬停和聚焦分开记，两个都离开才继续计时
  const state = useRef({ hover: false, focus: false });
  const sync = () => setToastPaused(state.current.hover || state.current.focus);
  return (
    <div
      ref={ref}
      className={cx('kv-toaster', className)}
      role="status"
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        state.current.hover = true;
        sync();
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        state.current.hover = false;
        sync();
      }}
      onFocus={(e) => {
        onFocus?.(e);
        state.current.focus = true;
        sync();
      }}
      onBlur={(e) => {
        onBlur?.(e);
        state.current.focus = false;
        sync();
      }}
      {...rest}
    >
      {item && (
        <Toast
          key={item.id}
          type={item.type}
          action={item.action}
          onAction={() => {
            item.onAction?.();
            toast.hide(item.id);
          }}
          data-leaving={item.leaving ? '' : undefined}
        >
          {item.text}
        </Toast>
      )}
    </div>
  );
});
Toaster.displayName = 'Toaster';
