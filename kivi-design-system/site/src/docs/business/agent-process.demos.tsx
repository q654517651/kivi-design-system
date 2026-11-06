import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  AskRecord,
  Button,
  SkillCard,
  ProcessGroup,
  ProcessRow,
  type IconName,
  type ProcessRowLevel,
  type ProcessRowStatus,
  type ProcessStep,
  Icon,
  ThinkingBlock,
} from '@kivi';
import { Playground, type PlaygroundState } from '@shell';
import { TOOL_FLOW, TOOL_FLOW_MS, GEN_TOOLS, HIDDEN_TOOLS, TOOL_GROUPS } from './agent-tools';

// Agent 过程页的属性面板和演示：过程行、工具调用组、思考块、结果叠放、工具分组。参数表在 agent-process.mdx；工具数据在 agent-tools.ts

const IMG = './placeholders/';

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

// ---------- ProcessRow ----------

type ProcessRowState = {
  level: ProcessRowLevel;
  status: ProcessRowStatus;
  expand: string;
  iconName: IconName;
  icon: boolean;
  avatar: boolean;
  object: boolean;
  arrow: boolean;
  action: string;
  objectText: string;
};

type Update = (patch: Partial<PlaygroundState>) => void;

function renderProcessRow(s: ProcessRowState, update: Update) {
  const sub = s.level === 'sub';
  return (
    <ProcessRow
      level={sub ? 'sub' : undefined}
      status={s.status === 'done' ? undefined : s.status}
      icon={s.icon ? s.iconName : undefined}
      avatar={!sub && s.avatar ? `${IMG}ip-peek-1x1.webp` : undefined}
      action={s.action}
      object={s.object ? s.objectText : undefined}
      arrow={sub || s.arrow ? undefined : false}
      expanded={!sub && s.arrow ? s.expand === 'yes' : undefined}
      onExpandedChange={!sub && s.arrow ? (v) => update({ expand: v ? 'yes' : 'no' }) : undefined}
    />
  );
}

export function ProcessRowPlayground() {
  return (
    <Playground<ProcessRowState>
      controls={[
        { key: 'level', label: '层级', type: 'segment', value: 'main', options: [['main', '一级'], ['sub', '子项']] },
        { key: 'status', label: '状态', type: 'segment', value: 'running', options: [['running', '进行中'], ['done', '完成'], ['failed', '失败']] },
        { key: 'expand', label: '展开', type: 'segment', value: 'no', options: [['no', '否'], ['yes', '是']] },
        { key: 'iconName', label: '图标', type: 'segment', value: 'UseCanvas', options: [['UseCanvas', '工具'], ['Skill', '技能'], ['Message', '询问'], ['ImageGeneration', '生成']] },
        { key: 'icon', label: '显示图标', type: 'toggle', value: true },
        { key: 'avatar', label: '显示头像', type: 'toggle', value: false },
        { key: 'object', label: '显示对象', type: 'toggle', value: true },
        { key: 'arrow', label: '显示箭头', type: 'toggle', value: true },
        { key: 'action', label: '动作', type: 'text', value: '创建节点' },
        { key: 'objectText', label: '对象', type: 'text', value: '活动标题' },
      ]}
      // 子项没有头像、箭头、展开；没有箭头就没有展开
      rules={(s) => ({
        ...(s.level === 'sub' ? { avatar: true, arrow: true, expand: true } : {}),
        ...(!s.arrow ? { expand: true } : {}),
        ...(!s.icon ? { iconName: true } : {}),
        ...(!s.object ? { objectText: true } : {}),
      })}
      render={renderProcessRow}
    />
  );
}

// ---------- ProcessGroup ----------

// 演示用的一串工具：照「Agent 工具」页的定稿，有快有慢，停留超过 0.5 秒的才扫光
const TOOLS = TOOL_FLOW;
const TOOL_MS = TOOL_FLOW_MS;

/** 模拟 Agent 一个接一个调工具，调完收成汇总行。切换面板设置会整个重新挂上。tools、ms 换成别的工具和耗时 */
export function ProcessGroupSim({
  count: countProp,
  failed = false,
  live = true,
  tools = TOOLS,
  ms = TOOL_MS,
}: {
  count?: number;
  failed?: boolean;
  live?: boolean;
  tools?: Omit<ProcessStep, 'status'>[];
  ms?: number[];
}) {
  const count = countProp ?? tools.length;
  const [started, setStarted] = useState(live ? 1 : count);
  const [done, setDone] = useState(!live);
  const [run, setRun] = useState(0);

  // 一个工具调完开始下一个，最后一个调完就做完了
  useEffect(() => {
    if (!live) return;
    let i = 1;
    let t = 0;
    const next = () => {
      t = window.setTimeout(() => {
        if (i < count) {
          i += 1;
          setStarted(i);
          next();
        } else setDone(true);
      }, ms[i - 1] ?? 300);
    };
    next();
    return () => window.clearTimeout(t);
  }, [live, count, run, ms]);

  const replay = () => {
    setStarted(1);
    setDone(false);
    setRun((r) => r + 1);
  };

  const failIndex = count === 1 ? 0 : 2;
  const steps: ProcessStep[] = tools.slice(0, started).map((tool, i) => ({
    ...tool,
    id: String(i),
    status: !done && i === started - 1 ? 'running' : failed && i === failIndex ? 'failed' : 'done',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16, width: 420, maxWidth: '100%' }}>
      <ProcessGroup key={run} steps={steps} />
      {live && (
        <Button size={28} variant="light" leftIcon="Reset" onClick={replay}>
          重放
        </Button>
      )}
    </div>
  );
}

type ProcessGroupState = { status: string; count: string; failed: boolean; expand: string };

function renderProcessGroup(s: ProcessGroupState, update: Update) {
  const n = Number(s.count);
  const running = s.status === 'running';
  const k = running ? Math.min(3, n) : n; // 进行中：调到第 3 个
  const failIndex = n === 1 ? 0 : 2;
  const steps: ProcessStep[] = TOOLS.slice(0, k).map((tool, i) => {
    const status = running && i === k - 1 ? 'running' : !running && s.failed && i === failIndex ? 'failed' : undefined;
    return status ? { ...tool, status } : { ...tool };
  });
  const canExpand = !running && n > 1;
  return (
    <ProcessGroup
      steps={steps}
      expanded={canExpand ? s.expand === 'yes' : undefined}
      onExpandedChange={canExpand ? (v) => update({ expand: v ? 'yes' : 'no' }) : undefined}
    />
  );
}

export function ProcessGroupPlayground() {
  return (
    <Playground<ProcessGroupState>
      controls={[
        { key: 'status', label: '状态', type: 'segment', value: 'done', options: [['running', '调用中'], ['done', '做完']] },
        { key: 'count', label: '工具个数', type: 'segment', value: '8', options: [['1', '1'], ['4', '4'], ['8', '8']] },
        { key: 'failed', label: '有失败', type: 'toggle', value: false },
        { key: 'expand', label: '展开', type: 'segment', value: 'no', options: [['no', '否'], ['yes', '是']] },
      ]}
      // 调用中只有一行、不能展开；只调了 1 个也不能展开
      rules={(s) => ({
        ...(s.status === 'running' ? { failed: true, expand: true } : {}),
        ...(s.count === '1' ? { expand: true } : {}),
      })}
      render={renderProcessGroup}
    />
  );
}

// ---------- 思考块 ----------

const THINK_TEXT = `用户想要 4 张科幻宇宙风格的猕猴桃海报，还给了一张参考图。
先看参考图：冷色宇宙背景，有漂浮的猕猴桃切片，边缘有柔和的光。
提示词要保留这几个特征，再加上「科幻」「宇宙」这两个关键词。
4 张图分别换构图：居中特写、斜角漂浮、俯视、带星轨的远景。
比例用 1:1，海报常用。
开始生成。`;

type ThinkingState = { status: string; expand: string };

function renderThinking(s: ThinkingState, update: PlaygroundStateUpdate) {
  return (
    <ThinkingBlock thinking={s.status === 'thinking'} expanded={s.expand === 'yes'} onExpandedChange={(v) => update({ expand: v ? 'yes' : 'no' })}>
      {THINK_TEXT}
    </ThinkingBlock>
  );
}

type PlaygroundStateUpdate = (patch: Partial<PlaygroundState>) => void;

export function ThinkingBlockPlayground() {
  return (
    <Playground<ThinkingState>
      controls={[
        { key: 'status', label: '状态', type: 'segment', value: 'done', options: [['thinking', '思考中'], ['done', '思考完成']] },
        { key: 'expand', label: '展开', type: 'segment', value: 'yes', options: [['no', '收起'], ['yes', '展开']] },
      ]}
      rules={(s) => (s.status === 'thinking' ? { expand: true } : {})}
      render={renderThinking}
    />
  );
}

/** 一个字一个字地往外冒，冒完自动收起；点重放再来一遍 */
export function ThinkingSim() {
  const [n, setN] = useState(0);
  const [run, setRun] = useState(0);
  const thinking = n < THINK_TEXT.length;

  useEffect(() => {
    setN(0);
    const t = window.setInterval(() => setN((v) => (v >= THINK_TEXT.length ? v : v + 2)), 40);
    return () => window.clearInterval(t);
  }, [run]);

  return (
    <div style={{ ...COLUMN, width: 420, maxWidth: '100%' }}>
      <ThinkingBlock thinking={thinking}>{THINK_TEXT.slice(0, n)}</ThinkingBlock>
      <Button size={28} variant="secondary" onClick={() => setRun((r) => r + 1)}>
        重放
      </Button>
    </div>
  );
}
