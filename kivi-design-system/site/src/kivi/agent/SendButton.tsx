import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import { cx } from '../utils';
import '../button/button.css';
import './agent.css';

export interface SendButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 生成中：图标换成停止方块，点了停止生成。默认否 */
  generating?: boolean;
}

/**
 * Agent 输入框的发送按钮：就是 IconButton 主要 · 36 · 圆形（11-05 纳入按钮体系），悬停、按下、禁用都跟按钮走。
 * 禁用写 disabled（还没输入内容）。Figma「Agent」页 SendButton
 */
export const SendButton = forwardRef<HTMLButtonElement, SendButtonProps>(function SendButton(
  { generating, type = 'button', className, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('kv-icon-button', 'kv-icon-button--36', 'kv-icon-button--primary', 'kv-icon-button--round', 'kv-send-button', className)} // 借用类名：生成中要放 12 的停止方块，IconButton 只收图标；停止图标做好后改用 IconButton
      data-generating={generating ? '' : undefined}
      aria-label={ariaLabel ?? (generating ? '停止生成' : '发送')}
      {...rest}
    >
      {generating ? <span className="kv-send-button__stop" /> : <Icon name="Send" />}
    </button>
  );
});
SendButton.displayName = 'SendButton';
