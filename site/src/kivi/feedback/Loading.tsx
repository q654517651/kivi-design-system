import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { cx } from '../utils';
import './feedback.css';

export type LoadingSize = 'sm' | 'md' | 'lg';

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  /** 尺寸：小 / 中 / 大，默认小。小是横排（一行里的小块），中、大是竖排（卡片里、整块区域） */
  size?: LoadingSize;
  /** 文字，比如「加载中…」。不传就只有转圈 */
  children?: ReactNode;
}

/** 转圈 + 可选文字，告诉用户正在等。Figma「反馈」页 Loading。按钮里的加载用 Button 的 loading，不用它 */
export const Loading = forwardRef<HTMLDivElement, LoadingProps>(function Loading(
  { size = 'sm', className, children, ...rest },
  ref,
) {
  const hasText = children !== undefined && children !== null && children !== false && children !== '';
  return (
    <div ref={ref} className={cx('kv-loading', `kv-loading--${size}`, className)} role="status" {...rest}>
      <Icon name="Loading" spin />
      {hasText && <span>{children}</span>}
    </div>
  );
});
Loading.displayName = 'Loading';
