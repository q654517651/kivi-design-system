import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './agent.css';

export interface ProcessDrawerProps extends HTMLAttributes<HTMLDivElement> {
  /** 展开 */
  open: boolean;
  /** 展开后大约多高，按距离取时长：100 以内 200ms，再长 300ms */
  distance?: number;
}

/**
 * 过程行下面能收起的那一块：工具调用组的列表、询问的问答都放在里面。
 * 展开时高度从 0 推到内容高、把下面的内容往下推，同时淡入；收起倒着走，ease-in-out。收起后藏起来，Tab 不进去。
 * 和上面那行的间距 6 也在里面，收起后不留空。组件库内部用，不单独出现在 Figma。
 */
export const ProcessDrawer = forwardRef<HTMLDivElement, ProcessDrawerProps>(function ProcessDrawer(
  { open, distance = 0, className, style, children, ...rest },
  ref,
) {
  const duration = `var(--motion-duration-${distance > 100 ? 300 : 200})`;
  return (
    <div
      ref={ref}
      className={cx('kv-process-drawer', className)}
      data-open={open ? '' : undefined}
      aria-hidden={!open || undefined}
      style={{ '--kv-process-drawer-duration': duration, ...style } as CSSProperties}
      {...rest}
    >
      <div className="kv-process-drawer__inner">
        <div className="kv-process-drawer__body">{children}</div>
      </div>
    </div>
  );
});
ProcessDrawer.displayName = 'ProcessDrawer';
