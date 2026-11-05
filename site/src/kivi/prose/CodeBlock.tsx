import { forwardRef, type HTMLAttributes } from 'react';
import { IconButton } from '../button';
import { cx } from '../utils';
import { useCopy } from '../hooks';
import './prose.css';

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 块里的文字，比如一段提示词。要复制的就是它 */
  children: string;
  /** 点复制之后调用，参数是复制的文字。复制失败（没有权限）不调用 */
  onCopied?: (text: string) => void;
}

/**
 * 代码块：用来放提示词这类要整段复制的文字，没有语法高亮。右上角一个复制按钮，点了图标换成对勾，1.5 秒后换回来。
 * 文字自动换行，不出横向滚动条。在 Prose 里用它代替 Markdown 渲染出来的 `pre`。
 */
export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  { children, onCopied, className, ...rest },
  ref,
) {
  const { copied, copy } = useCopy();
  const onCopy = async () => {
    if (await copy(children)) onCopied?.(children);
  };

  return (
    <div ref={ref} className={cx('kv-code-block', className)} {...rest}>
      <pre>
        <code>{children}</code>
      </pre>
      <IconButton className="kv-code-block__copy" icon={copied ? 'CheckSmall' : 'Copy'} label={copied ? '已复制' : '复制'} size={28} variant="text" onClick={onCopy} />
    </div>
  );
});
CodeBlock.displayName = 'CodeBlock';
