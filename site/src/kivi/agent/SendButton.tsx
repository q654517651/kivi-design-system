import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import { cx } from '../utils';
import './agent.css';

export interface SendButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 生成中：图标换成停止方块，点了停止生成。默认否 */
  generating?: boolean;
}

/** Agent 输入框的发送按钮，36 的圆形。禁用写 disabled（还没输入内容）。Figma「Agent」页 SendButton */
export const SendButton = forwardRef<HTMLButtonElement, SendButtonProps>(function SendButton(
  { generating, type = 'button', className, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('kv-send-button', className)}
      aria-busy={generating || undefined}
      aria-label={ariaLabel ?? (generating ? '停止生成' : '发送')}
      {...rest}
    >
      {generating ? <span className="kv-send-button__stop" /> : <Icon name="Send" />}
    </button>
  );
});
SendButton.displayName = 'SendButton';
