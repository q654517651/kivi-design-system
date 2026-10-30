import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils';
import { ConnectorDot, type ConnectorDotState } from './ConnectorDot';
import './canvas.css';

export type NodeWrapperRatio = '1:1' | '3:4' | '16:9' | '4:3' | '9:16';

export interface NodeWrapperProps extends HTMLAttributes<HTMLDivElement> {
  /** 比例：1:1 256×256 / 3:4 256×341 / 16:9 455×256 / 4:3 341×256 / 9:16 256×455，默认 1:1。短边固定 256 */
  ratio?: NodeWrapperRatio;
  /** 节点名，在节点上方。不传就没有 */
  name?: ReactNode;
  /** 左侧连接点的状态。Figma 里默认开，代码里传了才显示 */
  leftDot?: ConnectorDotState;
  /** 右侧连接点的状态。Figma 里默认开，代码里传了才显示 */
  rightDot?: ConnectorDotState;
  /** 选中：节点外面盖一圈描边。悬停时也有这圈描边，由 CSS 管 */
  selected?: boolean;
  /** 里面固定放一个 NodeCard */
  children?: ReactNode;
}

/** 节点外框：节点名、左右连接点、选中描边、比例。每个画布上的节点都包一层。Figma「画布」页 NodeWrapper */
export const NodeWrapper = forwardRef<HTMLDivElement, NodeWrapperProps>(function NodeWrapper(
  { ratio = '1:1', name, leftDot, rightDot, selected, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('kv-node-wrapper', `kv-node-wrapper--${ratio.replace(':', '-')}`, className)}
      aria-selected={selected || undefined}
      {...rest}
    >
      {name && <span className="kv-node-wrapper__name">{name}</span>}
      {children}
      {leftDot && <ConnectorDot state={leftDot} className="kv-node-wrapper__dot kv-node-wrapper__dot--left" />}
      {rightDot && <ConnectorDot state={rightDot} className="kv-node-wrapper__dot kv-node-wrapper__dot--right" />}
    </div>
  );
});
NodeWrapper.displayName = 'NodeWrapper';
