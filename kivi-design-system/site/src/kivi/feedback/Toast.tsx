import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { cx } from '../utils';
import './feedback.css';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  /** 类型：信息 / 成功 / 警告 / 错误 / 加载中，默认信息。加载中不画圆，用转圈的 Loading 图标 */
  type?: ToastType;
  /** 操作文字，比如「撤销」「取消」「查看原因」。不传就没有操作 */
  action?: ReactNode;
  /** 点操作文字 */
  onAction?: () => void;
  /** 提示文字，一行说完，不加标题 */
  children?: ReactNode;
}

/**
 * 轻提示的样子：状态图标 + 文字 + 操作文字（可选）。Figma「反馈」页 Toast。
 * 这个组件只管样子；要在页面顶部弹出来，用 toast.show()，见 Toaster.tsx。
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { type = 'info', action, onAction, className, children, ...rest },
  ref,
) {
  const hasAction = action !== undefined && action !== null && action !== false && action !== '';
  return (
    <div ref={ref} className={cx('kv-toast', `kv-toast--${type}`, className)} {...rest}>
      {type === 'loading' ? <Icon name="Loading" spin /> : <span className="kv-toast__icon" />}
      <span className="kv-toast__message">{children}</span>
      {hasAction && (
        <button type="button" className="kv-toast__action" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
});
Toast.displayName = 'Toast';
