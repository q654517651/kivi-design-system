import { ActionCard, Button, Dialog, FileCard, IconButton, MediaStack, ProcessGroup, ProcessRow, QuestionOption, QuestionPanel, ReferenceItem, ResultTile, SendButton, UserMessage, type FileCardType, type IconName, type ProcessRowLevel, type ProcessRowStatus, type ProcessStep, type ResultTileAction } from '@kivi';
import { useEffect, useState, type CSSProperties } from 'react';
import { Playground } from '@shell';

// Agent 页的属性面板：所有层级、类型、状态都在面板里切。参数表在 agent.mdx

const IMG = './placeholders/';

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

function renderProcessRow(s: ProcessRowState) {
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

// 演示用的一串工具：有快有慢，停留超过 0.5 秒的才扫光
const TOOLS: Omit<ProcessStep, 'status'>[] = [
  { icon: 'Skill', action: '读取画布操作规范' },
  { icon: 'UseCanvas', action: '创建节点', object: '「分镜脚本」' },
  { icon: 'UseCanvas', action: '更新节点', object: '「分镜脚本」' },
  { icon: 'Skill', action: '读取礼物等级细则' },
  { icon: 'UseCanvas', action: '创建节点', object: '「视频生成」' },
  { icon: 'UseCanvas', action: '连接节点', object: '「分镜脚本」→「视频生成」' },
  { icon: 'UseCanvas', action: '更新参数', object: '「视频生成」' },
  { icon: 'Skill', action: '检查提示词' },
];
// 每个工具调了多久（毫秒）
const TOOL_MS = [200, 1300, 150, 120, 900, 250, 1600, 400];

/** 模拟 Agent 一个接一个调工具，调完收成汇总行。切换面板设置会整个重新挂上 */
export function ProcessGroupSim({ count = 8, failed = false, live = true }: { count?: number; failed?: boolean; live?: boolean }) {
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
      }, TOOL_MS[i - 1]);
    };
    next();
    return () => window.clearTimeout(t);
  }, [live, count, run]);

  const replay = () => {
    setStarted(1);
    setDone(false);
    setRun((r) => r + 1);
  };

  const failIndex = count === 1 ? 0 : 2;
  const steps: ProcessStep[] = TOOLS.slice(0, started).map((tool, i) => ({
    ...tool,
    id: String(i),
    status: !done && i === started - 1 ? 'running' : failed && i === failIndex ? 'failed' : 'done',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16, width: 420, maxWidth: '100%' }}>
      <ProcessGroup key={run} steps={steps} />
      {live && (
        <Button size="sm" variant="light" leftIcon="Reset" onClick={replay}>
          重放
        </Button>
      )}
    </div>
  );
}

type ProcessGroupState = { status: string; count: string; failed: boolean; expand: string };

function renderProcessGroup(s: ProcessGroupState) {
  const n = Number(s.count);
  const running = s.status === 'running';
  const k = running ? Math.min(3, n) : n; // 进行中：调到第 3 个
  const failIndex = n === 1 ? 0 : 2;
  const steps: ProcessStep[] = TOOLS.slice(0, k).map((tool, i) => {
    const status = running && i === k - 1 ? 'running' : !running && s.failed && i === failIndex ? 'failed' : undefined;
    return status ? { ...tool, status } : { ...tool };
  });
  return <ProcessGroup steps={steps} expanded={!running && n > 1 ? s.expand === 'yes' : undefined} />;
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

// ---------- 示例：主站 Agent ----------

const TEXT: CSSProperties = { color: 'var(--color-text-fill-primary)', fontSize: 'var(--font-size-14)', lineHeight: 'var(--font-line-height-22)' };
const RESULTS = ['ip-gouache-1x1.webp', 'kivi-future-1x1.webp', 'bunny-gouache-1x1.webp', 'ip-kiwi-pile-1x1.webp'];
const TOP: ResultTileAction[] = [
  { icon: 'Delete', label: '删除' },
  { icon: 'Download', label: '下载' },
];
const QUICK: ResultTileAction[] = [
  { icon: 'ImageEditing', label: '图片编辑' },
  { icon: 'VideoGeneration', label: '图生视频' },
  { icon: 'ImageToImage', label: '一键垫图' },
  { icon: 'More', label: '更多' },
];

/** 主站 Agent：生成的结果直接跟在回复下面，4 张大图；点一张全屏看 */
export function MainSiteAgentDemo() {
  const [preview, setPreview] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <UserMessage assets={<ReferenceItem src={`${IMG}kiwi-light-1x1.webp`} />}>参考这张图，做 4 张科幻宇宙风格的猕猴桃海报</UserMessage>
      <div style={TEXT}>好的，我先看看参考图的风格。</div>
      <ProcessGroup
        steps={[
          { icon: 'Skill', action: '读取参考图' },
          { icon: 'Skill', action: '分析画面风格' },
          { icon: 'Text', action: '整理提示词' },
        ]}
      />
      <div style={TEXT}>参考图是冷色宇宙背景加漂浮的猕猴桃切片，下面按这个风格生成 4 张。</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {RESULTS.map((file, i) => (
          <ResultTile
            key={file}
            src={`${IMG}${file}`}
            topActions={TOP}
            collect
            quickActions={QUICK}
            style={{ cursor: 'zoom-in' }}
            onClick={(e) => {
              // 点的是格子里的按钮就不打开预览
              if ((e.target as HTMLElement).closest('button')) return;
              setPreview(i);
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        <IconButton icon="Copy" label="复制" variant="light" />
        <IconButton icon="CopyTraceID" label="复制 TraceID" variant="light" />
        <IconButton icon="ThumbsUp" label="赞" variant="light" />
        <IconButton icon="ThumbsDown" label="踩" variant="light" />
      </div>
      <Dialog size="full" title={preview === null ? undefined : `图片 ${preview + 1}`} open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        {preview !== null && (
          <img src={`${IMG}${RESULTS[preview]}`} alt={`图片 ${preview + 1}`} style={{ display: 'block', maxWidth: '100%', maxHeight: '75vh', margin: '0 auto', objectFit: 'contain' }} />
        )}
      </Dialog>
    </div>
  );
}

// ---------- UserMessage ----------

type UserMessageState = { assets: string; text: string };

function renderUserMessage(s: UserMessageState) {
  return (
    <UserMessage
      assets={
        s.assets === 'has' ? (
          <>
            <ReferenceItem src={`${IMG}kivi-future-1x1.webp`} />
            <ReferenceItem src={`${IMG}kiwi-light-1x1.webp`} duration="12s" />
          </>
        ) : undefined
      }
    >
      {s.text}
    </UserMessage>
  );
}

export function UserMessagePlayground() {
  return (
    <Playground<UserMessageState>
      controls={[
        { key: 'assets', label: '素材', type: 'segment', value: 'none', options: [['none', '无'], ['has', '有']] },
        { key: 'text', label: '文字', type: 'text', value: '帮我生成 10 个小狗的图片' },
      ]}
      render={renderUserMessage}
    />
  );
}

// ---------- MediaStack ----------

type MediaStackState = { badge: boolean; count: string };

export function MediaStackPlayground() {
  return (
    <Playground<MediaStackState>
      controls={[
        { key: 'badge', label: '显示数量', type: 'toggle', value: true },
        { key: 'count', label: '数量', type: 'text', value: '+4' },
      ]}
      rules={(s) => (s.badge ? {} : { count: true })}
      render={(s) => <MediaStack src={`${IMG}kivi-future-1x1.webp`} count={s.badge ? s.count : undefined} aria-label="展开 5 个结果" />}
    />
  );
}

// ---------- QuestionPanel ----------

type QuestionPanelState = {
  mode: string;
  pager: boolean;
  other: boolean;
  skip: boolean;
  disabled: boolean;
  title: string;
  pagerText: string;
  skipText: string;
  submitText: string;
};

export function QuestionPanelPlayground() {
  return (
    <Playground<QuestionPanelState>
      controls={[
        { key: 'mode', label: '选择', type: 'segment', value: 'single', options: [['single', '单选'], ['multi', '多选']] },
        { key: 'pager', label: '显示分页', type: 'toggle', value: true },
        { key: 'other', label: '显示其他输入', type: 'toggle', value: true },
        { key: 'skip', label: '显示忽略', type: 'toggle', value: true },
        { key: 'disabled', label: '提交中（禁用）', type: 'toggle', value: false },
        { key: 'title', label: '题目', type: 'text', value: '1. 你喜欢小猫吗？（2 个选项）' },
        { key: 'pagerText', label: '分页', type: 'text', value: '1/5' },
        { key: 'skipText', label: '忽略文字', type: 'text', value: '忽略' },
        { key: 'submitText', label: '提交文字', type: 'text', value: '确认提交' },
      ]}
      rules={(s) => ({ ...(s.pager ? {} : { pagerText: true }), ...(s.skip ? {} : { skipText: true }) })}
      render={(s) => (
        <QuestionPanel
          key={s.mode}
          title={s.title}
          pager={s.pager ? s.pagerText : undefined}
          multiple={s.mode === 'multi' || undefined}
          skip={s.skip ? undefined : false}
          skipText={s.skipText === '忽略' ? undefined : s.skipText}
          submitText={s.submitText === '确认提交' ? undefined : s.submitText}
          disabled={s.disabled || undefined}
          defaultValue={s.mode === 'multi' ? ['1', '2'] : ['1']}
        >
          <QuestionOption value="1">喜欢</QuestionOption>
          <QuestionOption value="2">不喜欢</QuestionOption>
          {s.other && <QuestionOption type="other" />}
        </QuestionPanel>
      )}
    />
  );
}

/** 追问的来回：问的时候面板停在输入框的位置，提交或忽略后面板消失，消息里留一行「已询问」 */
export function QuestionFlowDemo() {
  const [phase, setPhase] = useState<'asking' | 'sending' | 'done'>('asking');
  const text = { color: 'var(--color-text-fill-primary)', fontSize: 'var(--font-size-14)', lineHeight: 'var(--font-line-height-22)' };

  // 假提交：禁用 600ms 再收起
  const submit = () => {
    setPhase('sending');
    window.setTimeout(() => setPhase('done'), 600);
  };

  return (
    <figure className="shell-demo">
      <div className="shell-demo-preview">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 428, maxWidth: '100%' }}>
          <UserMessage>帮我生成 10 个小狗的图片</UserMessage>
          <div style={text}>好的，马上为你同时生成 10 张小狗图片！</div>
          {phase === 'done' ? (
            <>
              <ProcessRow icon="Message" action="已询问" arrow={false} />
              <Button onClick={() => setPhase('asking')}>重新演示</Button>
            </>
          ) : (
            <>
              <ProcessRow icon="Message" action="询问中" arrow={false} />
              <QuestionPanel
                title="1. 你喜欢小猫吗？（2 个选项）"
                pager="1/5"
                defaultValue={['1']}
                disabled={phase === 'sending'}
                onSubmit={submit}
                onSkip={submit}
              >
                <QuestionOption value="1">喜欢</QuestionOption>
                <QuestionOption value="2">不喜欢</QuestionOption>
                <QuestionOption type="other" />
              </QuestionPanel>
            </>
          )}
        </div>
      </div>
    </figure>
  );
}

// ---------- ActionCard ----------

type ActionCardState = { type: 'confirm' | 'auth' | 'error'; secondary: boolean };

function renderActionCard(s: ActionCardState) {
  if (s.type === 'error') {
    return <ActionCard type="error" description="服务发生异常——本次操作不消耗积分，请稍后再试。" />;
  }
  if (s.type === 'auth') {
    return (
      <ActionCard
        type="auth"
        title="飞书文档授权"
        description="读取该飞书文档需要授权，请点击下方按钮完成授权。"
        actions={<Button variant="primary">去授权</Button>}
      />
    );
  }
  return (
    <ActionCard
      title="是否确认 5 个节点生成？"
      description={
        <>
          预计消耗 40 猕猴桃，<button type="button" className="kv-action-card__link">点击查看节点参数</button>
        </>
      }
      actions={
        <>
          {s.secondary && <Button>取消</Button>}
          <Button variant="primary">确认生成</Button>
        </>
      }
    />
  );
}

export function ActionCardPlayground() {
  return (
    <Playground<ActionCardState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'confirm', options: [['confirm', '生成确认'], ['auth', '授权'], ['error', '出错']] },
        { key: 'secondary', label: '显示次按钮', type: 'toggle', value: true },
      ]}
      rules={(s) => (s.type === 'confirm' ? {} : { secondary: true })}
      render={renderActionCard}
    />
  );
}

// ---------- SendButton ----------

type SendButtonState = { state: string };

function sendButton(state: string) {
  return <SendButton disabled={state === 'disabled' || undefined} generating={state === 'busy' || undefined} />;
}

export function SendButtonPlayground() {
  return (
    <Playground<SendButtonState>
      controls={[{ key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['disabled', '禁用'], ['busy', '生成中']] }]}
      render={(s) => sendButton(s.state)}
    />
  );
}

// ---------- FileCard ----------

const FILE: Record<FileCardType, { name: string; meta: string }> = {
  doc: { name: '基洛夫炫酷动画_剧本.md', meta: '创建于 10-28 15:58' },
  subtitle: { name: '基洛夫炫酷动画_字幕.srt', meta: 'srt · 32 条' },
  audio: { name: '旁白_第一段.mp3', meta: '00:45' },
};

type FileCardState = { type: FileCardType; state: string };

function fileCard(type: FileCardType, state: string) {
  const f = FILE[type];
  return (
    <FileCard
      type={type === 'doc' ? undefined : type}
      name={f.name}
      meta={f.meta}
      generating={state === 'busy' || undefined}
      className={state === 'hover' ? 'is-hover' : undefined}
    />
  );
}

export function FileCardPlayground() {
  return (
    <Playground<FileCardState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'doc', options: [['doc', '文档'], ['subtitle', '字幕'], ['audio', '音频']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['busy', '生成中']] },
      ]}
      render={(s) => fileCard(s.type, s.state)}
    />
  );
}
