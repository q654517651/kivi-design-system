import { forwardRef, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from '../button';
import { Tooltip } from '../menus-tooltip';
import { cx } from '../utils';
import './main-site.css';

export type GenPromptLength = 'short' | 'long';

export interface GenPromptProps extends HTMLAttributes<HTMLDivElement> {
  /** 长度：短 / 超出两行（long）。不传就自己量（照线上）：超过两行就收成两行，复制按钮挪到第二行行尾，左边渐变盖住截断的字，悬停用 Tooltip 长文看全文。传了就固定，文档摆静态用 */
  length?: GenPromptLength;
  /** 提示词。没有提示词就不显示这一行（照线上）；有的话复制按钮固定跟在最后一个字后面。工具类任务（抠图、高清…）不传，只显示参数 */
  prompt?: ReactNode;
  /** 点复制按钮 */
  onCopy?: () => void;
  /** 参数：一排 Tag（任务类型、模型、清晰度、比例、时长…），中间可以放参考区 GenPromptRefs。和提示词是固定组合 */
  children?: ReactNode;
}

/** 主站生成记录的头：一条记录最上面那块，提示词 + 参数。工具类任务只有参数。Figma「主站」页 GenPrompt */
export const GenPrompt = forwardRef<HTMLDivElement, GenPromptProps>(function GenPrompt(
  { length, prompt, onCopy, children, className, ...rest },
  ref,
) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [over, setOver] = useState(false);

  // 没传 length 就自己量：临时去掉两行截断，按每行的 top 去重数行数，超过两行就收起。宽度变了重新量
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || length) return;
    let frame = 0;
    const measure = () => {
      const prev = el.style.cssText;
      el.style.cssText = 'display: inline; overflow: visible; -webkit-line-clamp: unset';
      const tops = new Set(Array.from(el.getClientRects(), (r) => Math.round(r.top)));
      el.style.cssText = prev;
      setOver(tops.size > 2);
    };
    measure();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    ro.observe(el.parentElement ?? el);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [length, prompt]);

  const clamp = length ? length === 'long' : over;
  return (
    <div ref={ref} className={cx('kv-gen-prompt', clamp && 'kv-gen-prompt--clamp', className)} {...rest}>
      {prompt != null && (
        // 收成两行时，悬停看全文：Tooltip 长文；没截断就禁用
        <Tooltip variant="long" content={prompt} disabled={!clamp}>
          <div className="kv-gen-prompt__prompt">
            <span ref={textRef} className="kv-gen-prompt__text">
              {prompt}
            </span>
            <span className="kv-gen-prompt__copy">
              <IconButton icon="Copy" label="复制提示词" size={28} variant="light" onClick={onCopy} />
            </span>
          </div>
        </Tooltip>
      )}
      <div className="kv-gen-prompt__params">{children}</div>
    </div>
  );
});
GenPrompt.displayName = 'GenPrompt';
