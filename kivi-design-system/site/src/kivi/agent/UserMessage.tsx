import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils';
import './agent.css';

export interface UserMessageProps extends HTMLAttributes<HTMLDivElement> {
  /** 素材：气泡上方一排 ReferenceItem 56，图片、带时长的视频、音频都放这里。不传就没有素材行 */
  assets?: ReactNode;
  /** 气泡里的字 */
  children?: ReactNode;
}

/** 用户消息：气泡靠右，宽度跟文字走，最宽 340，超出换行。Figma「Agent」页 UserMessage */
export const UserMessage = forwardRef<HTMLDivElement, UserMessageProps>(function UserMessage(
  { assets, children, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-user-message', className)} {...rest}>
      {assets && <div className="kv-user-message__assets">{assets}</div>}
      <div className="kv-user-message__bubble">{children}</div>
    </div>
  );
});
UserMessage.displayName = 'UserMessage';
