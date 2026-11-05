import { forwardRef, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './collapse.css';

/** 间距变量 `--spacing-N` 现有的档 */
export type CollapseGap = 0 | 2 | 4 | 6 | 8 | 12 | 16 | 24 | 32;

export interface CollapseProps extends HTMLAttributes<HTMLDivElement> {
  /** 展开（受控，由外面的触发行管） */
  expanded: boolean;
  /** 展开后大约多高，按距离取时长：100 以内 200ms，再长 300ms，默认按 200ms */
  distance?: number;
  /** 展开后离上面那一行的间距，取 `--spacing-N` 的 N，只能是间距变量有的档，默认 0。放在会被收起的这块里，收起后不留空 */
  gap?: CollapseGap;
  /** 收起后还露出多高（px），默认 0 = 收起后整块藏起来。写了就是「长文只露前几行」：收起不淡出、不藏，只把高度压到这个值，超出的裁掉；展开长到内容高。内容不到这个高时按不收起处理 */
  collapsedSize?: number;
}

/**
 * 展开收起：触发行下面能收起的那一块，工具调用组的列表、询问的问答、侧栏的分组、思考块都放在里面。
 * 展开时高度从 0 推到内容高、把下面的内容往下推，同时淡入；收起倒着走，ease-in-out。收起后藏起来，Tab 不进去。
 * 写了 `collapsedSize` 是另一种：收起后露出一截（用户消息超过 12 行只露 12 行），高度在这一截和内容高之间走，不淡入淡出。
 * 只管这一块，触发行（按钮、箭头）、展开状态由外面写。组件库内部通用，不单独出现在 Figma
 */
export const Collapse = forwardRef<HTMLDivElement, CollapseProps>(function Collapse(
  { expanded, distance = 0, gap = 0, collapsedSize, className, style, children, ...rest },
  ref,
) {
  const partial = collapsedSize !== undefined;
  const bodyRef = useRef<HTMLDivElement>(null);
  // 露一截的收起要在两个高度之间走，得知道内容多高（宽度变了、字变了都重新量）
  const [full, setFull] = useState(0);
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!partial || !el) return;
    const measure = () => setFull(el.offsetHeight);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [partial]);
  const duration = `var(--motion-duration-${distance > 100 ? 300 : 200})`;
  return (
    <div
      ref={ref}
      className={cx('kv-collapse', className)}
      data-open={expanded ? '' : undefined}
      data-partial={partial ? '' : undefined}
      aria-hidden={(!partial && !expanded) || undefined}
      style={
        {
          '--kv-collapse-duration': duration,
          '--kv-collapse-gap': `var(--spacing-${gap})`,
          ...(partial ? { '--kv-collapse-size': `${collapsedSize}px`, '--kv-collapse-full': full ? `${full}px` : 'none' } : null),
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      <div className="kv-collapse__inner">
        <div ref={bodyRef} className="kv-collapse__body">{children}</div>
      </div>
    </div>
  );
});
Collapse.displayName = 'Collapse';
