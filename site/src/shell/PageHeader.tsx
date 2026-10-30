import type { ReactNode } from 'react';

const FIGMA = 'https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2';

export interface PageHeaderProps {
  /** 分组：基础 / 通用组件 / 业务组件 */
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  /** Figma 页面：[页名, 节点 id]，比如 ['按钮', '135:605'] */
  figma?: [string, string];
  /** 状态，照 Figma 页头写，比如「草稿 0.1.0」 */
  status?: string;
  /** 代码在哪，比如 kivi/button */
  code?: string;
}

/** 页头：分组、标题、一句话说明，以及 Figma、状态、代码位置 */
export function PageHeader({ eyebrow, title, lead, figma, status, code }: PageHeaderProps) {
  return (
    <header className="doc-header">
      <p className="doc-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {lead && <p className="doc-lead">{lead}</p>}
      <dl className="doc-meta">
        {figma && (
          <div>
            <dt>Figma</dt>
            <dd>
              <a href={`${FIGMA}?node-id=${figma[1].replace(':', '-')}`} target="_blank" rel="noopener">
                「{figma[0]}」页
              </a>
            </dd>
          </div>
        )}
        {status && (
          <div>
            <dt>状态</dt>
            <dd>
              <span className="shell-tag shell-tag--draft">{status}</span>
            </dd>
          </div>
        )}
        {code && (
          <div>
            <dt>代码</dt>
            <dd>
              <code>{code}</code>
            </dd>
          </div>
        )}
      </dl>
    </header>
  );
}

/** 文档里的小标签：新 / 待确认 / 待定 / 废弃 */
export function Tag({ kind = 'new', children }: { kind?: 'new' | 'draft' | 'off' | 'danger'; children: ReactNode }) {
  return <span className={kind === 'new' ? 'shell-tag' : `shell-tag shell-tag--${kind}`}>{children}</span>;
}
