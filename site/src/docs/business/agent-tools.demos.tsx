import { AskRecord, Icon, ProcessGroup, ProcessRow, SkillCard, type IconName } from '@kivi';
import type { CSSProperties, ReactNode } from 'react';
import { ProcessGroupSim } from './agent.demos';
import { GEN_TOOLS, HIDDEN_TOOLS, TOOL_FLOW, TOOL_FLOW_MS, TOOL_GROUPS } from './agent-tools';

// 「Agent 工具」页的演示。工具数据在 agent-tools.ts

const COLUMNS: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32, width: '100%', alignItems: 'start' };
// 卡片一行里等高
const CARDS: CSSProperties = { ...COLUMNS, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'stretch' };
const COLUMN: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, minWidth: 0 };
const CAPTION: CSSProperties = { fontSize: 'var(--font-size-12)', lineHeight: '16px', color: 'var(--color-text-fill-tertiary)' };
const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 16,
  borderRadius: 'var(--border-radius-12)',
  border: 'var(--border-width-1) solid var(--color-border-subtle)',
  background: 'var(--color-bg-fill-surface)',
  minWidth: 0,
};
const CARD_HEAD: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-14)', lineHeight: '20px', fontWeight: 500, color: 'var(--color-text-fill-primary)' };
const LIST: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const NOTE: CSSProperties = { fontSize: 'var(--font-size-12)', lineHeight: '18px', color: 'var(--color-text-fill-tertiary)' };

function Card({ title, icon, children }: { title: string; icon?: IconName; children: ReactNode }) {
  return (
    <section style={CARD}>
      <header style={CARD_HEAD}>
        {icon && <Icon name={icon} size={20} />}
        {title}
      </header>
      {children}
    </section>
  );
}

/** 进工具组的一种图标一组，加上不出工具行的几种 */
export function ToolGroups() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      <div style={CAPTION}>进工具调用组：一种图标一组，汇总行「调用了 N 个工具」用 Tool</div>
      <div style={CARDS}>
        {TOOL_GROUPS.map((g) => (
          <Card key={g.name} title={g.name} icon={g.icon}>
            <div style={LIST}>
              {g.tools.map((t, i) => (
                <ProcessRow key={i} level="sub" icon={g.icon} action={t.action} object={t.object} />
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div style={CAPTION}>不出工具行</div>
      <div style={{ ...CARDS, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Card title="询问" icon="Message">
          <AskRecord status="answered" items={[{ question: '是否生成新节点「活动主视觉」？', answer: '批准生成' }]} defaultExpanded />
        </Card>
        <Card title="生成：只出结果块，按产出用图标">
          <div style={LIST}>
            {GEN_TOOLS.map((g) => (
              <div key={g.icon} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Icon name={g.icon} size={20} style={{ flex: 'none', color: 'var(--color-text-fill-secondary)' }} />
                <span style={{ ...NOTE, paddingTop: 1 }}>{g.names}</span>
              </div>
            ))}
          </div>
          <span style={NOTE}>执行节点按它执行的节点算。</span>
        </Card>
        <Card title="保存技能：出技能卡">
          <SkillCard title="运营活动主视觉生成" description="按活动主题生成 4 张主视觉" />
        </Card>
      </div>
      <div style={NOTE}>不显示：{HIDDEN_TOOLS}</div>
    </div>
  );
}

/** 左边一行滚动地调，右边做完展开 */
export function ToolFlowDemo() {
  return (
    <div style={COLUMNS}>
      <div style={COLUMN}>
        <div style={CAPTION}>调用中</div>
        <ProcessGroupSim tools={TOOL_FLOW} ms={TOOL_FLOW_MS} />
      </div>
      <div style={COLUMN}>
        <div style={CAPTION}>做完，点开</div>
        <ProcessGroup steps={TOOL_FLOW} defaultExpanded />
      </div>
    </div>
  );
}
