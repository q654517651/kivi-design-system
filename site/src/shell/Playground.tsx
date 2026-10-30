import { useState, type ReactElement } from 'react';
import { CodeBlock } from './CodeBlock';
import { toJsx } from './toJsx';

// 属性面板：和 Figma 右侧的属性一样，选什么，预览和代码跟着变

export type Control =
  | { key: string; label: string; type: 'segment'; options: [string, string][]; value: string }
  | { key: string; label: string; type: 'toggle'; value: boolean }
  | { key: string; label: string; type: 'text'; value: string };

export type PlaygroundState = Record<string, string | boolean>;

export interface PlaygroundProps<S extends PlaygroundState> {
  controls: Control[];
  /** 当前组合下哪些选项不能选：{ size: ['lg'] }。传 true 表示这一项用不上，直接不显示（开关同时关掉） */
  rules?: (state: S) => Partial<Record<keyof S, string[] | boolean>>;
  /** 返回 true 时预览换成图片底，「浮层」类型用 */
  media?: (state: S) => boolean;
  /** 返回这一刻的组件，代码由它自动生成 */
  render: (state: S) => ReactElement;
  /** 给预览区加类名，文档里调整摆放用 */
  stageClassName?: string;
}

export function Playground<S extends PlaygroundState>({ controls, rules, media, render, stageClassName }: PlaygroundProps<S>) {
  const [raw, setRaw] = useState<PlaygroundState>(() => Object.fromEntries(controls.map((c) => [c.key, c.value])));

  // 按规则把不能选的值换掉
  const off = (rules?.(raw as S) ?? {}) as Record<string, string[] | boolean | undefined>;
  const state: PlaygroundState = { ...raw };
  controls.forEach((c) => {
    const o = off[c.key];
    if (c.type === 'segment' && Array.isArray(o) && o.includes(state[c.key] as string)) {
      const ok = c.options.find(([v]) => !o.includes(v));
      if (ok) state[c.key] = ok[0];
    }
    if (c.type === 'toggle' && o === true) state[c.key] = false;
  });

  const set = (key: string, value: string | boolean) => setRaw((s) => ({ ...s, [key]: value }));
  const element = render(state as S);

  return (
    <div className="shell-pg">
      <div className={['shell-pg-stage', media?.(state as S) && 'is-media', stageClassName].filter(Boolean).join(' ')}>{element}</div>
      <div className="shell-pg-panel">
        {controls.map((c) => {
          const o = off[c.key];
          if (o === true) return null;
          return (
            <div className="shell-pg-row" key={c.key}>
              <div className="shell-pg-label">{c.label}</div>
              {c.type === 'segment' && (
                <div className="shell-seg">
                  {c.options.map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={state[c.key] === v}
                      disabled={Array.isArray(o) && o.includes(v)}
                      onClick={() => set(c.key, v)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {c.type === 'toggle' && (
                <button
                  type="button"
                  role="switch"
                  className="shell-switch"
                  aria-checked={Boolean(state[c.key])}
                  onClick={() => set(c.key, !state[c.key])}
                />
              )}
              {c.type === 'text' && (
                <input className="shell-input" value={String(state[c.key])} onChange={(e) => set(c.key, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>
      <CodeBlock code={toJsx(element)} bare collapse={6} />
    </div>
  );
}
