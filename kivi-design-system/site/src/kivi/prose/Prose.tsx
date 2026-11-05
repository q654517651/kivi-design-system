import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './prose.css';

export type ProseProps = HTMLAttributes<HTMLDivElement>;

/**
 * 正文排版：把 Markdown 渲染出来的 h1–h4、p、ul / ol、blockquote、code、table、a、hr 套上统一的样子。
 * 样子照线上现在用的 Ant Design X Markdown 暗色主题（用户 11-03 选的），颜色、圆角、间距换成 KIVI 变量。
 * 只管样式：Markdown 怎么渲染成 HTML 是前端的事。代码块要有复制按钮的话，渲染时把 `pre` 换成 CodeBlock。
 */
export const Prose = forwardRef<HTMLDivElement, ProseProps>(function Prose({ className, ...rest }, ref) {
  return <div ref={ref} className={cx('kv-prose', className)} {...rest} />;
});
Prose.displayName = 'Prose';
