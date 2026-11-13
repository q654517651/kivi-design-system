import { forwardRef, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from '../button';
import { Collapse } from '../collapse';
import { cx } from '../utils';
import { useControllable } from '../hooks';
import './agent.css';

export interface UserMessageProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onToggle'> {
  /** 素材：气泡上方一排 ReferenceItem 56，图片、带时长的视频、音频都放这里。不传就没有素材行 */
  assets?: ReactNode;
  /** 气泡里的字。里面可以夹 MentionChip（技能、图片、节点引用），和输入框里是同一个 */
  children?: ReactNode;
  /** 最多显示几行，超过的折叠，出「显示更多 / 收起」。默认 12 */
  maxLines?: number;
  /** 展开：受控。字没超过 maxLines 时没有展开状态 */
  expanded?: boolean;
  /** 展开：非受控的初始值，默认折叠 */
  defaultExpanded?: boolean;
  /** 展开 / 收起时触发 */
  onExpandedChange?: (expanded: boolean) => void;
}

const LINE = 22; // 行高，和 --font-line-height-22 一致

/**
 * 用户消息：气泡靠右，宽度跟文字走，最宽 340，超出换行；超过 12 行折叠，气泡底部出「显示更多」，点开往下推。Figma「Agent」页 UserMessage
 */
export const UserMessage = forwardRef<HTMLDivElement, UserMessageProps>(function UserMessage(
  { assets, children, maxLines = 12, expanded: expandedProp, defaultExpanded = false, onExpandedChange, className, ...rest },
  ref,
) {
  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const text = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const limit = maxLines * LINE;
  const overflow = height > limit + 1;

  // 字多高（宽度变了、字变了都重新量），判断超没超过 maxLines 靠它
  useLayoutEffect(() => {
    const el = text.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={cx('kv-user-message', className)} {...rest}>
      {assets && <div className="kv-user-message__assets">{assets}</div>}
      <div className="kv-user-message__bubble">
        {/* 超过 maxLines 行只露 maxLines 行，展开 / 收起走 Collapse（300ms ease-in-out） */}
        <Collapse expanded={expanded || !overflow} collapsedSize={limit} distance={height}>
          <div ref={text} className="kv-user-message__text">
            {children}
          </div>
        </Collapse>
        {overflow && (
          <Button
            className="kv-user-message__toggle"
            size={28}
            variant="ghost"
            rightIcon="DownArrowSmall"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起' : '显示更多'}
          </Button>
        )}
      </div>
    </div>
  );
});
UserMessage.displayName = 'UserMessage';
