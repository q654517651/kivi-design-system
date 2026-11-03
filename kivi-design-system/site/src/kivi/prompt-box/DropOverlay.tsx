import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { cx } from '../utils';
import './prompt-box.css';

export interface DropOverlayProps extends HTMLAttributes<HTMLDivElement> {
  /** 显示：文件拖到输入框上时为 true。默认 true；不显示时淡出，不挡鼠标 */
  active?: boolean;
  /** 拖来的类型不收：换成 danger 色和「不支持这种文件」，不接收这次放下。默认 false */
  rejected?: boolean;
  /** 收的时候写什么，默认「松手上传」 */
  text?: ReactNode;
  /** 不收的时候写什么，默认「不支持这种文件」 */
  rejectedText?: ReactNode;
}

/**
 * 拖文件到输入框上时盖住整个输入框的提示：品牌色描边 + 品牌色淡底 + Upload 图标和「松手上传」；类型不收时换成 danger 色。
 * 圆角跟着所在的框走（继承），所以放它的框要 `position: relative`。PromptBox 自己带了它；画布 Agent 输入框这类自己拼的框也这么放。
 * 配合 `useFileDrop`（hooks/）用：它给 `dragging`、`rejected`。Figma 没有，待确认。
 */
export const DropOverlay = forwardRef<HTMLDivElement, DropOverlayProps>(function DropOverlay(
  { active = true, rejected = false, text = '松手上传', rejectedText = '不支持这种文件', className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('kv-drop-overlay', className)}
      data-active={active ? '' : undefined}
      data-rejected={active && rejected ? '' : undefined}
      aria-hidden={active ? undefined : true}
      role="status"
      {...rest}
    >
      <Icon name={rejected ? 'Close' : 'Upload'} size={24} />
      <span className="kv-drop-overlay__text">{rejected ? rejectedText : text}</span>
    </div>
  );
});
DropOverlay.displayName = 'DropOverlay';
