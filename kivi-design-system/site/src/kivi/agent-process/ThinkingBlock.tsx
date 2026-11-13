import { forwardRef, useEffect, useId, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils';
import { useControllable } from '../hooks';
import { ScrollArea } from '../scroll-area';
import { Collapse } from '../collapse';
import { ProcessRow } from './ProcessRow';
import './agent-process.css';

export interface ThinkingBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  /** 思考中：自动展开、自动滚到底、标题扫光，不能点；变成 false（思考完成）时自动收起，之后点标题再展开 */
  thinking?: boolean;
  /** 思考的文字，流式输出时一直追加 */
  children?: ReactNode;
  /** 标题，默认思考中「思考中」、完成「思考完成」 */
  title?: ReactNode;
  /** 展开：受控。思考中一直是展开的，这个只管思考完成之后 */
  expanded?: boolean;
  /** 展开：非受控的初始值，默认收起 */
  defaultExpanded?: boolean;
  /** 展开 / 收起时触发 */
  onExpandedChange?: (expanded: boolean) => void;
}

/**
 * 思考块：Agent 的思考过程。一行「灯泡 + 思考中 / 思考完成」，下面是思考的原文，往下推着展开（Collapse）。
 * 思考中展开并跟着文字滚到底，原文最高 160、超出能滚，渐隐跟着滑的方向；思考完成自动收起，点标题再看。放在「Agent 过程」页。
 */
export const ThinkingBlock = forwardRef<HTMLDivElement, ThinkingBlockProps>(function ThinkingBlock(
  { thinking = false, children, title, expanded: expandedProp, defaultExpanded = false, onExpandedChange, className, ...rest },
  ref,
) {
  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const bodyId = useId();
  const body = useRef<HTMLDivElement>(null);
  const open = thinking || expanded;

  // 思考完成：自动收起
  const was = useRef(thinking);
  useEffect(() => {
    if (was.current && !thinking) setExpanded(false);
    was.current = thinking;
  }, [thinking, setExpanded]);

  // 思考中：跟着文字滚到底
  useEffect(() => {
    const el = body.current;
    if (thinking && el) el.scrollTop = el.scrollHeight;
  }, [thinking, children]);

  return (
    <div ref={ref} className={cx('kv-thinking-block', className)} {...rest}>
      <ProcessRow
        icon="Lightbulb"
        action={title ?? (thinking ? '思考中' : '思考完成')}
        status={thinking ? 'running' : 'done'}
        arrow={!thinking}
        expanded={open}
        onExpandedChange={setExpanded}
        aria-controls={bodyId}
      />
      <Collapse expanded={open} distance={200} gap={6}>
        <ScrollArea id={bodyId} className="kv-thinking-block__body" maxHeight={160} fade viewportRef={body}>
          <div className="kv-thinking-block__text">{children}</div>
        </ScrollArea>
      </Collapse>
    </div>
  );
});
ThinkingBlock.displayName = 'ThinkingBlock';
