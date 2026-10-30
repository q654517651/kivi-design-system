import { Highlight, type PrismTheme } from 'prism-react-renderer';
import { useState, type CSSProperties } from 'react';
import { Button } from '@kivi';
import { copyText, dedent } from './copy';

// 代码高亮用 KIVI 自己的颜色
export const codeTheme: PrismTheme = {
  plain: { color: 'var(--color-text-fill-secondary)', backgroundColor: 'transparent' },
  styles: [
    { types: ['tag', 'class-name', 'selector'], style: { color: 'var(--color-text-fill-primary)' } },
    { types: ['attr-name', 'property'], style: { color: 'var(--color-brand-gradient-1)' } },
    { types: ['string', 'attr-value', 'number', 'boolean'], style: { color: 'var(--color-brand-solid)' } },
    { types: ['punctuation', 'comment', 'operator'], style: { color: 'var(--color-text-fill-tertiary)' } },
    { types: ['keyword'], style: { color: 'var(--color-text-fill-primary)' } },
  ],
};

/** 复制按钮，复制完 1.2 秒内显示「已复制」 */
export function CopyButton({ text, label = '复制' }: { text: string | (() => string); label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="light"
      leftIcon={done ? 'CheckSmall' : 'Copy'}
      className="shell-copy"
      onClick={() => {
        copyText(typeof text === 'function' ? text() : text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        });
      }}
    >
      {done ? '已复制' : label}
    </Button>
  );
}

/** 只读代码块，带复制。MDX 里的 ```css 代码块也用它。传 collapse：超过这么多行先收起，只露前几行，点「展开代码」看全部 */
export function CodeBlock({ code, lang = 'tsx', bare, collapse }: { code: string; lang?: string; bare?: boolean; collapse?: number }) {
  const src = dedent(code);
  const [open, setOpen] = useState(false);
  const long = collapse !== undefined && src.split('\n').length > collapse + 2;
  const folded = long && !open;
  return (
    <div
      className={['shell-code', bare && 'shell-code--bare', folded && 'is-folded'].filter(Boolean).join(' ')}
      style={folded ? ({ '--shell-code-lines': collapse } as CSSProperties) : undefined}
    >
      <Highlight theme={codeTheme} code={src} language={lang}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre>
            <code>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, j) => (
                    <span key={j} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
      <CopyButton text={src} />
      {long && (
        <div className="shell-code-more">
          <Button size="sm" variant="light" rightIcon={open ? 'UpArrowSmall' : 'DownArrowSmall'} onClick={() => setOpen(!open)}>
            {open ? '收起代码' : '展开代码'}
          </Button>
        </div>
      )}
    </div>
  );
}
