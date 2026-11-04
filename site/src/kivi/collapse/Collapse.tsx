import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './collapse.css';

export interface CollapseProps extends HTMLAttributes<HTMLDivElement> {
  /** 展开（受控，由外面的触发行管） */
  open: boolean;
  /** 展开后大约多高，按距离取时长：100 以内 200ms，再长 300ms，默认按 200ms */
  distance?: number;
  /** 展开后离上面那一行的间距，取 `--spacing-N` 的 N（2、4、6、8…），默认 0。放在会被收起的这块里，收起后不留空 */
  gap?: number;
}

/**
 * 展开收起：触发行下面能收起的那一块，工具调用组的列表、询问的问答、侧栏的分组、思考块都放在里面。
 * 展开时高度从 0 推到内容高、把下面的内容往下推，同时淡入；收起倒着走，ease-in-out。收起后藏起来，Tab 不进去。
 * 只管这一块，触发行（按钮、箭头）、展开状态由外面写。组件库内部通用，不单独出现在 Figma
 */
export const Collapse = forwardRef<HTMLDivElement, CollapseProps>(function Collapse(
  { open, distance = 0, gap = 0, className, style, children, ...rest },
  ref,
) {
  const duration = `var(--motion-duration-${distance > 100 ? 300 : 200})`;
  return (
    <div
      ref={ref}
      className={cx('kv-collapse', className)}
      data-open={open ? '' : undefined}
      aria-hidden={!open || undefined}
      style={{ '--kv-collapse-duration': duration, '--kv-collapse-gap': `var(--spacing-${gap})`, ...style } as CSSProperties}
      {...rest}
    >
      <div className="kv-collapse__inner">
        <div className="kv-collapse__body">{children}</div>
      </div>
    </div>
  );
});
Collapse.displayName = 'Collapse';
