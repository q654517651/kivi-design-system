import { useState } from 'react';
import {
  ActionCard,
  AskRecord,
  Button,
  FileCard,
  MentionChip,
  MessageFeedback,
  SkillCard,
  QuestionOption,
  QuestionPanel,
  ReferenceItem,
  SendButton,
  UserMessage,
  type FileCardType,
  type AskRecordStatus,
} from '@kivi';
import { Playground, type PlaygroundState } from '@shell';

// Agent 对话页的属性面板：所有类型、状态都在面板里切。参数表在 agent.mdx

const IMG = './placeholders/';

type Update = (patch: Partial<PlaygroundState>) => void;

// ---------- AskRecord ----------

type AskRecordState = { status: AskRecordStatus; kind: string; skipped: string; expand: string };

function renderAskRecord(s: AskRecordState, update: Update) {
  const items =
    s.kind === 'confirm'
      ? [{ question: '是否生成新节点「可爱修狗 11-边牧 v2」？', answer: '批准生成' }]
      : [
          { question: '1. 想要什么风格？', answer: '水彩' },
          { question: '2. 画面里放几只小狗？', answer: '3 只' },
        ];
  return (
    <AskRecord
      status={s.status === 'answered' ? undefined : s.status}
      items={s.status === 'answered' ? items : items.map(({ question }) => ({ question }))}
      skippedText={s.status === 'skipped' && s.skipped === 'ai' ? '交给 AI 决策' : undefined}
      expanded={s.expand === 'yes'}
      onExpandedChange={(v) => update({ expand: v ? 'yes' : 'no' })}
    />
  );
}

export function AskRecordPlayground() {
  return (
    <Playground<AskRecordState>
      controls={[
        { key: 'status', label: '状态', type: 'segment', value: 'answered', options: [['asking', '询问中'], ['answered', '已询问'], ['skipped', '询问（跳过）']] },
        { key: 'kind', label: '内容', type: 'segment', value: 'question', options: [['question', '问题卡'], ['confirm', '生成确认']] },
        { key: 'skipped', label: '怎么跳过的', type: 'segment', value: 'skip', options: [['skip', '直接发了新消息'], ['ai', '交给 AI 决策']] },
        { key: 'expand', label: '展开', type: 'segment', value: 'yes', options: [['no', '否'], ['yes', '是']] },
      ]}
      rules={(s) => (s.status === 'skipped' ? {} : { skipped: true })}
      render={renderAskRecord}
    />
  );
}

// ---------- SkillCard ----------

type SkillCardState = { cover: string; desc: boolean; title: string; descText: string };

export function SkillCardPlayground() {
  return (
    <Playground<SkillCardState>
      controls={[
        { key: 'cover', label: '封面', type: 'segment', value: 'default', options: [['default', '默认'], ['image', '图片']] },
        { key: 'desc', label: '显示说明', type: 'toggle', value: true },
        { key: 'title', label: '技能名', type: 'text', value: '运营活动主视觉生成' },
        { key: 'descText', label: '说明', type: 'text', value: '根据主题、风格、主色调和氛围关键词，生成活动主视觉' },
      ]}
      rules={(s) => (s.desc ? {} : { descText: true })}
      render={(s) => (
        <SkillCard
          title={s.title}
          description={s.desc ? s.descText : undefined}
          cover={s.cover === 'image' ? `${IMG}kivi-future-1x1.webp` : undefined}
        />
      )}
    />
  );
}

// ---------- UserMessage ----------

type UserMessageState = { assets: string; kind: string; text: string; expand: string };

const LONG_TEXT = Array.from({ length: 8 }, (_, i) => `第 ${i + 1} 段：画面是一只在宇宙里漂浮的猕猴桃，冷色背景，边缘有柔和的光，细节要丰富，质感像水彩。`).join('\n');

function renderUserMessage(s: UserMessageState, update: Update) {
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
      expanded={s.expand === 'yes'}
      onExpandedChange={(v) => update({ expand: v ? 'yes' : 'no' })}
    >
      {s.kind === 'long' ? (
        LONG_TEXT
      ) : s.kind === 'chips' ? (
        <>
          用 <MentionChip type="skill">运营活动主视觉</MentionChip> 的风格，参考 <MentionChip type="image" src={`${IMG}kivi-future-1x1.webp`}>图片1</MentionChip> 做 4 张海报，节奏对齐 <MentionChip type="node">分镜脚本</MentionChip>
        </>
      ) : (
        s.text
      )}
    </UserMessage>
  );
}

export function UserMessagePlayground() {
  return (
    <Playground<UserMessageState>
      controls={[
        { key: 'assets', label: '素材', type: 'segment', value: 'none', options: [['none', '无'], ['has', '有']] },
        { key: 'kind', label: '内容', type: 'segment', value: 'short', options: [['short', '短文字'], ['chips', '带引用胶囊'], ['long', '超过 12 行']] },
        { key: 'text', label: '文字', type: 'text', value: '帮我生成 10 个小狗的图片' },
        { key: 'expand', label: '展开', type: 'segment', value: 'no', options: [['no', '折叠'], ['yes', '展开']] },
      ]}
      rules={(s) => ({ ...(s.kind === 'short' ? {} : { text: true }), ...(s.kind === 'long' ? {} : { expand: true }) })}
      render={renderUserMessage}
    />
  );
}

// ---------- MessageFeedback ----------

type MessageFeedbackState = { value: string; trace: boolean; reason: boolean };

function renderMessageFeedback(s: MessageFeedbackState, update: Update) {
  return (
    <MessageFeedback
      text="好的，已经按科幻宇宙风格生成了 4 张。"
      traceId={s.trace ? 'trace-8f3a21' : undefined}
      reason={s.reason}
      value={s.value === 'none' ? null : (s.value as 'like' | 'dislike')}
      onChange={(v) => update({ value: v ?? 'none' })}
    />
  );
}

export function MessageFeedbackPlayground() {
  return (
    <Playground<MessageFeedbackState>
      controls={[
        { key: 'value', label: '赞 / 踩', type: 'segment', value: 'none', options: [['none', '没选'], ['like', '赞'], ['dislike', '踩']] },
        { key: 'trace', label: '复制 TraceID', type: 'toggle', value: true },
        { key: 'reason', label: '踩了问原因', type: 'toggle', value: true },
      ]}
      render={renderMessageFeedback}
    />
  );
}

// ---------- QuestionPanel ----------

type QuestionPanelState = {
  mode: string;
  pager: boolean;
  other: boolean;
  skip: boolean;
  aiDecide: boolean;
  disabled: boolean;
  title: string;
  pagerText: string;
  skipText: string;
  aiDecideText: string;
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
        { key: 'aiDecide', label: '显示全部由 AI 决策', type: 'toggle', value: true },
        { key: 'disabled', label: '提交中（禁用）', type: 'toggle', value: false },
        { key: 'title', label: '题目', type: 'text', value: '1. 你喜欢小猫吗？（2 个选项）' },
        { key: 'pagerText', label: '分页', type: 'text', value: '1/5' },
        { key: 'skipText', label: '忽略文字', type: 'text', value: '忽略' },
        { key: 'aiDecideText', label: '全部由 AI 决策文字', type: 'text', value: '全部由 AI 决策' },
        { key: 'submitText', label: '提交文字', type: 'text', value: '确认提交' },
      ]}
      rules={(s) => ({ ...(s.pager ? {} : { pagerText: true }), ...(s.skip ? {} : { skipText: true }), ...(s.aiDecide ? {} : { aiDecideText: true }) })}
      render={(s) => (
        <QuestionPanel
          key={s.mode}
          title={s.title}
          pager={s.pager ? s.pagerText : undefined}
          multiple={s.mode === 'multi' || undefined}
          skip={s.skip ? undefined : false}
          skipText={s.skipText === '忽略' ? undefined : s.skipText}
          aiDecide={s.aiDecide ? undefined : false}
          aiDecideText={s.aiDecideText === '全部由 AI 决策' ? undefined : s.aiDecideText}
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

/** 追问的来回：问的时候面板停在输入框的位置，消息里是「询问中」；提交后面板消失，留「已询问」，忽略了留「询问」 */
export function QuestionFlowDemo() {
  const [phase, setPhase] = useState<'asking' | 'sending' | 'answered' | 'skipped'>('asking');
  const [byAi, setByAi] = useState(false);
  const text = { color: 'var(--color-text-fill-primary)', fontSize: 'var(--font-size-14)', lineHeight: 'var(--font-line-height-22)' };
  const question = '1. 你喜欢小猫吗？（2 个选项）';

  // 假提交：禁用 600ms 再收起
  const finish = (result: 'answered' | 'skipped', ai = false) => {
    setByAi(ai);
    setPhase('sending');
    window.setTimeout(() => setPhase(result), 600);
  };

  return (
    <figure className="shell-demo">
      <div className="shell-demo-preview">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 428, maxWidth: '100%' }}>
          <UserMessage>帮我生成 10 个小狗的图片</UserMessage>
          <div style={text}>好的，马上为你同时生成 10 张小狗图片！</div>
          {phase === 'answered' || phase === 'skipped' ? (
            <>
              <AskRecord status={phase} items={[{ question, answer: '喜欢' }]} skippedText={byAi ? '交给 AI 决策' : undefined} />
              <Button onClick={() => setPhase('asking')}>重新演示</Button>
            </>
          ) : (
            <>
              <AskRecord status="asking" items={[{ question }]} />
              <QuestionPanel
                title={question}
                pager="1/5"
                prevDisabled
                defaultValue={['1']}
                disabled={phase === 'sending'}
                onSubmit={() => finish('answered')}
                onSkip={() => finish('skipped')}
                onAiDecide={() => finish('skipped', true)}
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

/** 多题翻页：上一题、下一题能翻，第一题上一题、最后一题下一题不可点，每题的选择各自记着 */
const PAGER_QUESTIONS = [
  { title: '1. 想要什么风格？', options: ['水彩', '插画', '写实'] },
  { title: '2. 画面里放几只小狗？', options: ['1 只', '3 只'] },
  { title: '3. 要不要加文字？', options: ['要', '不要'] },
];

export function QuestionPagerDemo() {
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<string[][]>(() => PAGER_QUESTIONS.map(() => []));
  const q = PAGER_QUESTIONS[page];
  const last = PAGER_QUESTIONS.length - 1;
  return (
    <QuestionPanel
      key={page}
      title={q.title}
      pager={`${page + 1}/${PAGER_QUESTIONS.length}`}
      prevDisabled={page === 0}
      nextDisabled={page === last}
      onPrev={() => setPage(page - 1)}
      onNext={() => setPage(page + 1)}
      value={answers[page]}
      onChange={(v) => setAnswers((a) => a.map((x, i) => (i === page ? v : x)))}
    >
      {q.options.map((o) => (
        <QuestionOption key={o} value={o}>
          {o}
        </QuestionOption>
      ))}
    </QuestionPanel>
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
  // 悬停、按下是摆静态样子用的（is-hover / is-active），项目里不用写
  const cls = state === 'hover' ? 'is-hover' : state === 'active' ? 'is-active' : undefined;
  return <SendButton className={cls} disabled={state === 'disabled' || undefined} generating={state === 'busy' || undefined} />;
}

export function SendButtonPlayground() {
  return (
    <Playground<SendButtonState>
      controls={[{ key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['active', '按下'], ['disabled', '禁用'], ['busy', '生成中']] }]}
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
