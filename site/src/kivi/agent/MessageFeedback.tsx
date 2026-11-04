import { forwardRef, useEffect, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { Button, IconButton } from '../button';
import { Input } from '../inputs';
import { Tooltip } from '../tooltip';
import { cx } from '../utils';
import { useControllable, useCopy } from '../hooks';
import { Collapse } from '../collapse';
import './agent.css';

export type MessageFeedbackValue = 'like' | 'dislike' | null;

export interface MessageFeedbackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children' | 'defaultValue'> {
  /** 复制按钮要复制的回复内容。不传就没有复制按钮 */
  text?: string;
  /** 复制 TraceID 按钮要复制的 ID。不传就没有这个按钮 */
  traceId?: string;
  /** 赞 / 踩：受控，null 是都没选。赞和踩互斥，再点一次取消 */
  value?: MessageFeedbackValue;
  /** 赞 / 踩：非受控的初始值，默认都没选 */
  defaultValue?: MessageFeedbackValue;
  /** 点了赞 / 踩 / 取消时触发 */
  onValueChange?: (value: MessageFeedbackValue) => void;
  /** 点了踩之后下面出原因输入框，默认出。不要原因就传 false */
  reason?: boolean;
  /** 提交了踩的原因（回车或点提交；没写字时提交按钮不可点） */
  onSubmitReason?: (reason: string) => void;
  /** 复制成功后触发，参数是复制的文字 */
  onCopied?: (text: string) => void;
}

/**
 * 助手消息底部的反馈条：复制、复制 TraceID、赞、踩，四个都是 IconButton「轻」。
 * 复制成功图标换对勾 1.5 秒；赞、踩选中换实心图标，互斥。点踩后下面往下推出一行原因输入：输入框 + 提交 + 关闭，回车提交、Esc 关闭；
 * 点赞、再点踩、提交、关闭都会收起。生成中不显示这一条（调用方控制）。交互照线上，Figma 还没有。
 */
export const MessageFeedback = forwardRef<HTMLDivElement, MessageFeedbackProps>(function MessageFeedback(
  { text, traceId, value: valueProp, defaultValue = null, onValueChange, reason = true, onSubmitReason, onCopied, className, ...rest },
  ref,
) {
  const [value, setValue] = useControllable<MessageFeedbackValue>(valueProp, defaultValue, onValueChange);
  const [asking, setAsking] = useState(false);
  const [draft, setDraft] = useState('');
  // 变成踩就出原因输入，变成别的就收起（关闭、提交只收起，不改踩）
  useEffect(() => {
    setAsking(reason && value === 'dislike');
  }, [value, reason]);
  const textCopy = useCopy();
  const idCopy = useCopy();

  const choose = (next: 'like' | 'dislike') => {
    const result = value === next ? null : next;
    setValue(result);
  };
  const close = () => {
    setAsking(false);
    setDraft('');
  };
  const submit = () => {
    const v = draft.trim();
    if (!v) return;
    onSubmitReason?.(v);
    close();
  };

  return (
    <div ref={ref} className={cx('kv-message-feedback', className)} {...rest}>
      <div className="kv-message-feedback__bar">
        {text != null && (
          <Tooltip content={textCopy.copied ? '已复制' : '复制'}>
            <IconButton
              icon={textCopy.copied ? 'CheckSmall' : 'Copy'}
              label={textCopy.copied ? '已复制' : '复制'}
              variant="light"
              onClick={async () => {
                if (await textCopy.copy(text)) onCopied?.(text);
              }}
            />
          </Tooltip>
        )}
        {traceId != null && (
          <Tooltip content={idCopy.copied ? '已复制' : '复制 TraceID'}>
            <IconButton
              icon={idCopy.copied ? 'CheckSmall' : 'CopyTraceID'}
              label={idCopy.copied ? '已复制' : '复制 TraceID'}
              variant="light"
              onClick={async () => {
                if (await idCopy.copy(traceId)) onCopied?.(traceId);
              }}
            />
          </Tooltip>
        )}
        <Tooltip content="赞">
          <IconButton icon={value === 'like' ? 'ThumbsUpFill' : 'ThumbsUp'} label="赞" variant="light" selected={value === 'like'} onClick={() => choose('like')} />
        </Tooltip>
        <Tooltip content="踩">
          <IconButton icon={value === 'dislike' ? 'ThumbsDownFill' : 'ThumbsDown'} label="踩" variant="light" selected={value === 'dislike'} onClick={() => choose('dislike')} />
        </Tooltip>
      </div>
      {reason && (
        <Collapse open={asking} distance={60} gap={6}>
          <div className="kv-message-feedback__reason">
            <Input
              className="kv-message-feedback__input"
              aria-label="踩的原因"
              placeholder="哪里不好？告诉我们"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit();
                if (e.key === 'Escape') close();
              }}
              tabIndex={asking ? 0 : -1}
            />
            <Button size={28} variant="primary" disabled={!draft.trim()} onClick={submit} tabIndex={asking ? 0 : -1}>
              提交
            </Button>
            <IconButton icon="CloseSmall" label="关闭" size={28} onClick={close} tabIndex={asking ? 0 : -1} />
          </div>
        </Collapse>
      )}
    </div>
  );
});
MessageFeedback.displayName = 'MessageFeedback';
