import { useEffect, useState } from 'react';
import {
  ActionCard,
  Avatar,
  Button,
  Checkbox,
  Divider,
  GenerateButton,
  Input,
  Menu,
  MenuItem,
  MessageFeedback,
  type MessageFeedbackValue,
  Notification,
  NumberInput,
  RATIOS,
  ProcessGroup,
  type ProcessStep,
  ReferenceStack,
  type ReferenceStackItem,
  ResultTile,
  Select,
  Slider,
  Switch,
  Tag,
  TabItem,
  Tabs,
  VideoPlayer,
  DateRangeFilter,
  ticks,
  type DateRange,
} from '@kivi';
import { TOOL_FLOW } from './business/agent-tools';
import './home.css';

// 首页：一行大标题、一行副标题，下面是一片真的、能点的组件。只用组件库已有的组件和演示数据

const IMG = './placeholders/';

// ---------- 左列 ----------

const PEOPLE = [
  { name: '小川', src: `${IMG}ip-peek-1x1.webp` },
  { name: 'Mia' },
  { name: '阿元', src: `${IMG}bunny-gouache-1x1.webp` },
  { name: 'Kai' },
  { name: '米粒', src: `${IMG}ip-gouache-1x1.webp` },
  { name: '设计' },
];

function Duration() {
  const [sec, setSec] = useState(8);
  const [draft, setDraft] = useState<string>();
  const clamp = (n: number) => Math.min(15, Math.max(4, Math.round(n)));
  const shown = draft !== undefined && clamp(Number(draft)) === sec ? draft : String(sec);
  return (
    <div className="home-card home-card--duration">
      <span className="home-card__label">视频时长</span>
      <div className="home-duration">
        <Slider aria-label="视频时长" min={4} max={15} value={sec} marks={ticks(5, 15, 5, 5)} onChange={setSec} />
        <NumberInput
          aria-label="视频时长（秒）"
          min={4}
          max={15}
          unit="S"
          value={shown}
          onChange={(v) => {
            setDraft(v);
            const n = Number(v);
            if (v !== '' && Number.isFinite(n)) setSec(clamp(n));
          }}
          onBlur={() => setDraft(undefined)}
        />
      </div>
    </div>
  );
}

function LeftColumn() {
  const [query, setQuery] = useState('');
  const [ratio, setRatio] = useState('16:9');
  const [kind, setKind] = useState('image');
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  return (
    <div className="home-col">
      <div className="home-avatars">
        {PEOPLE.map((p) => (
          <Avatar key={p.name} size={32} name={p.name} src={p.src} />
        ))}
      </div>
      <Input
        leftIcon="Search"
        clearable
        placeholder="搜索素材、项目"
        aria-label="搜索"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery('')}
      />
      <Select options={RATIOS} value={ratio} onChange={setRatio} aria-label="比例" />
      <Tabs variant="segment" value={kind} onChange={setKind} aria-label="类型">
        <TabItem value="image">图片</TabItem>
        <TabItem value="video">视频</TabItem>
        <TabItem value="audio">音频</TabItem>
      </Tabs>
      <Duration />
      <DateRangeFilter value={range} onChange={setRange} />
      <Menu width={240} aria-label="节点操作">
        <MenuItem icon="Rename" shortcut="F2">重命名</MenuItem>
        <MenuItem icon="Copy" shortcut="⌘C">复制</MenuItem>
        <MenuItem icon="Download" shortcut="⌘S">下载</MenuItem>
        <MenuItem icon="StickyOnTop">置顶</MenuItem>
        <Divider />
        <MenuItem icon="Delete" variant="danger" shortcut="⌫">删除</MenuItem>
      </Menu>
    </div>
  );
}

// ---------- 中列 ----------

const REFS: ReferenceStackItem[] = [
  { id: 'r1', type: 'image', name: '图片1', src: `${IMG}kivi-future-1x1.webp` },
  { id: 'r2', type: 'image', name: '图片2', src: `${IMG}monstera-dots-1x1.webp` },
  { id: 'r3', type: 'video', name: '视频1', src: `${IMG}kiwi-light-1x1.webp`, duration: '5s' },
  { id: 'r4', type: 'image', name: '图片3', src: `${IMG}ip-gouache-1x1.webp` },
];

/** 工具一个接一个调，调到最后一个从头再来，让这一行一直在滚 */
function RunningTools() {
  const [k, setK] = useState(2);
  useEffect(() => {
    const t = window.setTimeout(() => setK((n) => (n >= TOOL_FLOW.length ? 2 : n + 1)), 1400);
    return () => window.clearTimeout(t);
  }, [k]);
  const steps: ProcessStep[] = TOOL_FLOW.slice(0, k).map((tool, i) => ({
    ...tool,
    id: String(i),
    status: i === k - 1 ? 'running' : 'done',
  }));
  return <ProcessGroup steps={steps} running />;
}

function MiddleColumn() {
  const [refs, setRefs] = useState(REFS);
  const [auto, setAuto] = useState(true);
  const [agree, setAgree] = useState(true);
  const add = () =>
    setRefs((list) => [...list, { id: `r${Date.now()}`, type: 'image', name: `图片${list.length + 1}`, src: `${IMG}kiwi-glass-1x1.webp` }]);
  return (
    <div className="home-col">
      <div className="home-stack">
        <ReferenceStack items={refs} onAdd={add} onRemove={(id) => setRefs((list) => list.filter((i) => i.id !== id))} />
      </div>
      <div className="home-buttons">
        <Button variant="primary">主要</Button>
        <Button variant="secondary">次要</Button>
        <Button variant="text">无底</Button>
        <Button variant="light">轻</Button>
        <Button variant="danger">危险</Button>
        <GenerateButton cost={40} />
      </div>
      <div className="home-tile">
        <ResultTile status="generating" badge="59s 生成中" />
      </div>
      <div className="home-card">
        <RunningTools />
      </div>
      <div className="home-switches">
        <Switch checked={auto} onChange={setAuto}>自动选模型</Switch>
        <Checkbox checked={agree} onChange={setAgree}>生成前再确认</Checkbox>
      </div>
    </div>
  );
}

// ---------- 右列 ----------

function RightColumn() {
  const [feedback, setFeedback] = useState<MessageFeedbackValue>(null);
  return (
    <div className="home-col">
      <ActionCard
        title="是否确认 5 个节点生成？"
        description="预计消耗 40 猕猴桃"
        actions={
          <>
            <Button>取消</Button>
            <Button variant="primary">确认生成</Button>
          </>
        }
      />
      <div className="home-video">
        <VideoPlayer variant="card" src="./placeholders/video/kivi-demo-16x9.mp4" />
      </div>
      <Notification type="success" title="视频生成完成" description="已存入资产库，可以在画布里继续编辑。" />
      <Notification type="error" title="1 个节点生成失败" description="消耗的猕猴桃已退回，可以改一下提示词再试。" />
      <MessageFeedback
        text="已按你的参考图生成 4 张主视觉。"
        value={feedback}
        onValueChange={setFeedback}
        reason={false}
      />
      <div className="home-tags">
        <Tag icon="ImageGeneration">图片</Tag>
        <Tag icon="VideoGeneration">视频</Tag>
        <Tag variant="brand">4K</Tag>
        <Tag>16:9</Tag>
        <Tag>Seedance 2.0</Tag>
        <Tag thumb={`${IMG}kivi-future-1x1.webp`}>参考图</Tag>
      </div>
    </div>
  );
}

// ---------- 首页 ----------

export function Home() {
  return (
    <div className="home">
      <header className="home-hero">
        <h1 className="home-title">
          好看是默认的。
          <br />
          改起来也简单。
        </h1>
        <div className="home-lead">设计、产品、研发共用的一套组件。能直接点着试，代码能直接复制。</div>
      </header>
      <div className="home-stage">
        <LeftColumn />
        <MiddleColumn />
        <RightColumn />
      </div>
    </div>
  );
}
