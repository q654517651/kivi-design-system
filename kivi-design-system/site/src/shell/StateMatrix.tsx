import type { ReactNode } from 'react';

export interface StateMatrixProps {
  /** 行：[值, 名字]，一般是类型 */
  rows: [string, string][];
  /** 列：[值, 名字]，一般是状态 */
  cols: [string, string][];
  /** 返回这一格的组件；返回 null 显示「—」（这个组合不存在） */
  render: (row: string, col: string) => ReactNode;
  /** 图片底，「浮层」类型用 */
  stage?: 'media' | 'base';
}

/** 状态矩阵：悬停、按下摆成静态的，方便和 Figma 对照 */
export function StateMatrix({ rows, cols, render, stage }: StateMatrixProps) {
  return (
    <figure className="shell-demo">
      <div className="shell-demo-preview" data-layout="matrix" data-stage={stage}>
        <table className="shell-matrix">
          <thead>
            <tr>
              <th />
              {cols.map(([v, label]) => (
                <th key={v}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([r, rLabel]) => (
              <tr key={r}>
                <th scope="row">{rLabel}</th>
                {cols.map(([c]) => (
                  <td key={c}>{render(r, c) ?? <span className="shell-matrix-none">—</span>}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
