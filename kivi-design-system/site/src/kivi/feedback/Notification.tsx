import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from '../button';
import { cx } from '../utils';
import './feedback.css';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 类型：信息 / 成功 / 警告 / 错误。不传就没有前面的图标 */
  type?: NotificationType;
  /** 标题，最多两行，超出省略 */
  title?: ReactNode;
  /** 说明，写失败原因、后果这类说不完的内容。能换行，最高 6 行，再多在里面滚 */
  description?: ReactNode;
  /** 点右上角的关闭。不传就没有关闭按钮 */
  onClose?: () => void;
}

const has = (n: ReactNode) => n !== undefined && n !== null && n !== false && n !== '';

/**
 * 通知卡片：停在屏幕上，等用户看完自己关。和 Toast 的区别：Toast 一行、3 秒自己消失；通知有标题和说明、不自己消失。
 * 这个组件只管卡片的样子；要弹出来、多条堆叠，用 Notifier 和 notify，见 Notifier.tsx。
 */
export const Notification = forwardRef<HTMLDivElement, NotificationProps>(function Notification(
  { type, title, description, onClose, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-notification', type && `kv-notification--${type}`, className)} {...rest}>
      {type && <span className="kv-notification__icon" />}
      <div className="kv-notification__body">
        {has(title) && <div className="kv-notification__title">{title}</div>}
        {has(description) && <div className="kv-notification__description">{description}</div>}
      </div>
      {onClose && (
        <IconButton tooltip={false} className="kv-notification__close" icon="CloseSmall" label="关闭" size={28} variant="ghost" onClick={onClose} />
      )}
    </div>
  );
});
Notification.displayName = 'Notification';
