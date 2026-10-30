import { forwardRef, useSyncExternalStore, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import { Toast } from './Toast';
import { getToast, subscribeToast, toast } from './toast-store';
import './feedback.css';

export type ToasterProps = HTMLAttributes<HTMLDivElement>;

/**
 * Toast 弹出来的地方：页面顶部居中，距顶 24，同一时间只有一条。
 * 整个应用根上放一个就行，然后在哪里都能调 toast.show()，调用方式见 toast-store.ts。
 * className、ref 和其余属性落在外层 .kv-toaster 上。
 */
export const Toaster = forwardRef<HTMLDivElement, ToasterProps>(function Toaster({ className, ...rest }, ref) {
  const item = useSyncExternalStore(subscribeToast, getToast, getToast);
  return (
    <div ref={ref} className={cx('kv-toaster', className)} role="status" {...rest}>
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
