import * as React from 'react';
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live';
import * as Kivi from '@kivi';
import { Button } from '@kivi';
import { codeTheme, CopyButton } from './CodeBlock';
import { dedent } from './copy';

export interface DemoProps {
  /** 演示代码（JSX）。多个元素包一层 <>…</>；要状态就写成 () => { … return … } */
  code: string;
  /** 底色：media 放在图片上；base 用页面底色 */
  stage?: 'media' | 'base';
  /** 排法：matrix 状态矩阵；column 竖着排 */
  layout?: 'matrix' | 'column';
  /** 只演示不给代码 */
  noCode?: boolean;
  /** 代码里还要用到的东西（组件库和 React 的钩子已经带上了） */
  scope?: Record<string, unknown>;
}

const BASE_SCOPE = {
  React,
  useState: React.useState,
  useEffect: React.useEffect,
  useRef: React.useRef,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
  ...Kivi,
};

/** 演示：上面是活的预览，下面的代码能改、能复制 */
export function Demo({ code, stage, layout, noCode, scope }: DemoProps) {
  const initial = React.useMemo(() => dedent(code), [code]);
  const [current, setCurrent] = React.useState(initial);
  const [open, setOpen] = React.useState(false);

  return (
    <figure className="shell-demo">
      <LiveProvider code={initial} scope={{ ...BASE_SCOPE, ...scope }} theme={codeTheme}>
        <div className="shell-demo-preview" data-stage={stage} data-layout={layout}>
          <LivePreview Component={React.Fragment} />
        </div>
        <LiveError className="shell-demo-error" />
        {!noCode && (
          <>
            <div className="shell-demo-bar">
              <Button size="sm" variant="light" onClick={() => setOpen(!open)}>
                {open ? '收起代码' : '显示代码'}
              </Button>
              <CopyButton text={() => current} label="复制代码" />
            </div>
            {open && (
              <div className="shell-code shell-code--live">
                <LiveEditor
                  onChange={setCurrent}
                  style={{ padding: '16px 20px', fontFamily: 'var(--shell-mono)', fontSize: 12, lineHeight: '20px' }}
                />
              </div>
            )}
          </>
        )}
      </LiveProvider>
    </figure>
  );
}
