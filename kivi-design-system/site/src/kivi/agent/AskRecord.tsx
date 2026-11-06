import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils';
import { useControllable } from '../hooks';
import { Collapse } from '../collapse';
import { ProcessRow } from '../agent-process/ProcessRow';
import './agent.css';

export type AskRecordStatus = 'asking' | 'answered' | 'skipped';

export interface AskRecordItem {
  /** 问题，比如「是否生成新节点「分镜脚本」？」 */
  question: ReactNode;
  /** 回答，比如「批准生成」。不传就不显示（询问中、跳过时没有） */
  answer?: ReactNode;
}

export interface AskRecordProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 状态：询问中（等用户回答，扫光）/ 已询问（回答了）/ 询问（跳过了：用户直接发了新消息），默认已询问 */
  status?: AskRecordStatus;
  /** 问了什么、怎么答的，一题一项 */
  items: AskRecordItem[];
  /** 跳过时写在最后的说明，默认「已跳过」 */
  skippedText?: ReactNode;
  /** 这一行的字，默认按状态：询问中 / 已询问 / 询问 */
  label?: ReactNode;
  /** 展开：受控 */
  expanded?: boolean;
  /** 展开：非受控的初始值，默认收起 */
  defaultExpanded?: boolean;
  /** 展开 / 收起时触发 */
  onExpandedChange?: (expanded: boolean) => void;
}

const LABEL: Record<AskRecordStatus, string> = { asking: '询问中', answered: '已询问', skipped: '询问' };

/**
 * 询问记录：Agent 问用户（问题卡）或生成前确认，在对话里留的一行。默认收起，悬停出箭头，点开往下推，看问了什么、怎么答的。
 * 不进工具调用组，自己单独一行。交互照 Codex、Claude。
 */
export const AskRecord = forwardRef<HTMLDivElement, AskRecordProps>(function AskRecord(
  { status = 'answered', items, skippedText = '已跳过', label, expanded: expandedProp, defaultExpanded = false, onExpandedChange, className, ...rest },
  ref,
) {
  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const bodyId = useId();
  const skipped = status === 'skipped';
  // 展开要走的距离：一题大约 40（问题 20 + 间距 4 + 回答 16），题和题之间 8
  const distance = 6 + items.length * 40 + (items.length - 1) * 8 + (skipped ? 24 : 0);

  return (
    <div ref={ref} className={cx('kv-ask-record', className)} {...rest}>
      <ProcessRow
        icon="Message"
        action={label ?? LABEL[status]}
        status={status === 'asking' ? 'running' : 'done'}
        expanded={expanded}
        onExpandedChange={setExpanded}
        aria-controls={bodyId}
      />
      <Collapse id={bodyId} expanded={expanded} distance={distance} gap={6}>
        <div className="kv-ask-record__list">
          {items.map((item, i) => (
            <div key={i} className="kv-ask-record__item">
              <div className="kv-ask-record__question">{item.question}</div>
              {!skipped && item.answer != null && item.answer !== false && <div className="kv-ask-record__answer">{item.answer}</div>}
            </div>
          ))}
          {skipped && <div className="kv-ask-record__note">{skippedText}</div>}
        </div>
      </Collapse>
    </div>
  );
});
AskRecord.displayName = 'AskRecord';
