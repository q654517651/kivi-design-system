import { ActionCard, Button, FileCard, MediaStack, ProcessRow, QuestionOption, QuestionPanel, ReferenceItem, SendButton, UserMessage, type FileCardType, type IconName, type ProcessRowLevel, type ProcessRowStatus } from '@kivi';
import { useState } from 'react';
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
