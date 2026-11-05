import type { MDXComponents } from 'mdx/types';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { CodeBlock } from './CodeBlock';

// MDX 里普通 Markdown 的渲染方式：表格包一层能横向滚动，代码块带高亮和复制，站内链接走路由
export const mdxComponents: MDXComponents = {
  table: (props) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),
  pre: ({ children }) => {
    const code = children as ReactElement<{ className?: string; children?: string }>;
    const lang = /language-(\w+)/.exec(code?.props?.className ?? '')?.[1];
    return <CodeBlock code={String(code?.props?.children ?? '')} lang={lang} />;
  },
  a: ({ href = '', ...rest }) =>
    href.startsWith('/') ? (
      <Link to={href} {...rest} />
    ) : (
      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener" {...rest} />
    ),
};
