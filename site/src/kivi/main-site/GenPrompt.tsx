import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from '../button';
import { cx } from '../utils';
import './main-site.css';

export type GenPromptLength = 'short' | 'long';

export interface GenPromptProps extends HTMLAttributes<HTMLDivElement> {
  /** 长度：短 / 超出两行（long），默认短。超出两行最多 2 行，末尾省略，复制按钮放在第二行行尾 */
  length?: GenPromptLength;
  /** 提示词。没有提示词就不显示这一行（照线上）；有的话复制按钮固定跟在后面。工具类任务（抠图、高清…）不传，只显示参数 */
  prompt?: ReactNode;
  /** 点复制按钮 */
  onCopy?: () => void;
  /** 参数：一排 Tag（任务类型、模型、清晰度、比例、时长…），中间可以放参考区 GenPromptRefs。和提示词是固定组合 */
  children?: ReactNode;
}

/** 主站生成记录的头：一条记录最上面那块，提示词 + 参数。工具类任务只有参数。Figma「主站」页 GenPrompt */
export const GenPrompt = forwardRef<HTMLDivElement, GenPromptProps>(function GenPrompt(
  { length = 'short', prompt, onCopy, children, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-gen-prompt', length === 'long' && 'kv-gen-prompt--clamp', className)} {...rest}>
      {prompt != null && (
        <div className="kv-gen-prompt__prompt">
          <span className="kv-gen-prompt__text">{prompt}</span>
          <span className="kv-gen-prompt__copy">
            <IconButton icon="Copy" label="复制提示词" size={28} variant="light" onClick={onCopy} />
          </span>
        </div>
      )}
      <div className="kv-gen-prompt__params">{children}</div>
    </div>
  );
});
GenPrompt.displayName = 'GenPrompt';
