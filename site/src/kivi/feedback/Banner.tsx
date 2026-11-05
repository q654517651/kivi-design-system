import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from '../button';
import { cx } from '../utils';
import './feedback.css';

export type BannerType = 'info' | 'success' | 'warning' | 'error';

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  /** 类型：信息 / 成功 / 警告 / 错误，默认信息 */
  type?: BannerType;
  /** 点右边的关闭。不传就没有关闭按钮，一直在 */
  onClose?: () => void;
  /** 文字，14 / 22，能换多行 */
  children?: ReactNode;
}

/**
 * 横幅：嵌在面板、弹窗里的一条常驻提示，比如「请上传符合规格的图片」。不浮在屏幕上，不自己消失。
 * 浮在屏幕角上、等用户看完再关的用 Notification；一行说完、几秒消失的用 Toast。
 */
export const Banner = forwardRef<HTMLDivElement, BannerProps>(function Banner(
  { type = 'info', onClose, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-banner', `kv-banner--${type}`, className)} role={type === 'error' ? 'alert' : 'status'} {...rest}>
      <span className="kv-banner__icon" />
      <div className="kv-banner__text">{children}</div>
      {onClose && <IconButton tooltip={false} className="kv-banner__close" icon="CloseSmall" label="关闭" size={28} variant="text" onClick={onClose} />}
    </div>
  );
});
Banner.displayName = 'Banner';
