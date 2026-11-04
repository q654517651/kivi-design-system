import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './canvas.css';

export type ConnectorDotStatus = 'default' | 'connected' | 'highlight';

export interface ConnectorDotProps extends HTMLAttributes<HTMLSpanElement> {
  /** 状态：默认 / 已连接 / 高亮，默认是默认。已连接、高亮中间多一个 6 的实心点 */
  status?: ConnectorDotStatus;
}

/** 节点左右两边的连接点，连线从这里出、从这里进。Figma「画布」页 ConnectorDot */
export const ConnectorDot = forwardRef<HTMLSpanElement, ConnectorDotProps>(function ConnectorDot(
  { status = 'default', className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx('kv-connector-dot', status !== 'default' && `kv-connector-dot--${status}`, className)}
      {...rest}
    />
  );
});
ConnectorDot.displayName = 'ConnectorDot';
