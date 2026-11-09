import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import {
  Button,
  DEFAULT_MODEL,
  GenerateButton,
  PromptBox,
  ReferenceStack,
  Switch,
  referenceName,
  type ButtonSize,
  type ReferenceType,
  type ReferenceStackItem,
  MentionChip,
  PromptInput,
  AgentControls,
  AudioCharCount,
  AudioModelControls,
  CountSelect,
  ImageModelControls,
  TaskSelect,
  VideoModelControls,
} from '@kivi';
import { Playground } from '@shell';
import { SKILL_CATEGORIES, SKILL_ITEMS } from './skill-data';
import { demoCost } from './gen-demo-cost';
import './canvas.demos.css';
import './generation.demos.css';

// 创作输入框页的属性面板和可操作演示：主站输入框、生成按钮、提示词输入。参数表在 prompt-box.mdx
// 提示词输入的零件摆放用画布演示的样式（canvas.demos.css）。参考区、附件条、参考格在 reference.demos.tsx。

const IMG = './placeholders/';
// 演示音频：assets 里没有纯音频，用 mp4 的音轨（audio 元素能播 mp4）
const AUDIO = './placeholders/video/kivi-demo-9x16.mp4';

// ---------- 素材 ----------

const PICS = ['kivi-future', 'monstera-dots', 'kiwi-light', 'ip-gouache', 'bunny-gouache', 'ip-kiwi-pile', 'kiwi-glass', 'ip-future', 'ip-peek'];
const pic = (i: number) => `./placeholders/${PICS[i % PICS.length]}-1x1.webp`;

/** Figma「悬停展开」那张图里的 8 个素材，按添加顺序：图片1、图片2、视频1、视频2、视频3、音频1、图片3、视频4 */
const SAMPLE: ReferenceStackItem[] = [
  { id: 's1', type: 'image', name: '图片1', src: pic(0) },
  { id: 's2', type: 'image', name: '图片2', src: pic(1) },
  { id: 's3', type: 'video', name: '视频1', src: pic(2), duration: '5s', video: './placeholders/video/kivi-demo-16x9.mp4' },
  { id: 's4', type: 'video', name: '视频2', src: pic(3), duration: '8s', video: './placeholders/video/kivi-demo-16x9.mp4' },
  { id: 's5', type: 'video', name: '视频3', src: pic(4), duration: '12s', video: './placeholders/video/kivi-demo-16x9.mp4' },
  { id: 's6', type: 'audio', name: '音频1', duration: '15s', src: AUDIO },
  { id: 's7', type: 'image', name: '图片3', src: pic(5) },
  { id: 's8', type: 'video', name: '视频4', src: pic(6), duration: '5s', video: './placeholders/video/kivi-demo-16x9.mp4' },
];

const SHORT = '生成一张赛博朋克风格的猕猴桃海报';
const LONG =
  '明亮的商业广告风格，饼干是主角。草莓口味参考 @图片1，开场用 @视频1 的构图，音乐在重拍处切入；饼干排成整齐的阵列，镜头参考 @视频2 的运动方式，高潮时饼干掰开进入慢动作，夹心爆开、碎屑飞散，最后定格在 @图片2 的画面，配乐用 @音频1。';
const HUGE = [LONG, LONG, LONG].join('\n');

const noop = () => {};

// 主站输入框贴在页面底部：工具条里的下拉、面板都往上弹（Dropdown 默认往下，用的地方改方向；放不下自己翻）
const UP = 'top-start' as const;

// ---------- 工具条 ----------
// 下拉、参数面板都用 generation.tsx 里共用的那一份，和画布生成面板一样：选项、顺序、图标、展开方向都一致

// model 和 onModelChange：输入框演示按模型算生成按钮的消耗，别处不传就是各自管各自的
const TOOLBARS: Record<string, (model?: string, onModelChange?: (m: string) => void) => JSX.Element> = {
  agent: () => (
    <>
      <TaskSelect placement={UP} defaultValue="agent" />
      <AgentControls placement={UP} skills={SKILL_ITEMS} skillCategories={SKILL_CATEGORIES} />
    </>
  ),
  image: (model, onModelChange) => (
    <>
      <TaskSelect placement={UP} defaultValue="image" />
      <ImageModelControls placement={UP} model={model} onModelChange={onModelChange} />
    </>
  ),
  video: (model, onModelChange) => (
    <>
      <TaskSelect placement={UP} defaultValue="video" />
      <VideoModelControls placement={UP} model={model} onModelChange={onModelChange} />
    </>
  ),
  audio: (model, onModelChange) => (
    <>
      <TaskSelect placement={UP} defaultValue="audio" />
      <AudioModelControls placement={UP} model={model} onModelChange={onModelChange} />
    </>
  ),
};

const videoToolbar = TOOLBARS.video;
const countSelect = <CountSelect placement={UP} />;

// ---------- 属性面板：整个输入框 ----------

type BoxState = { refs: boolean; text: string; mode: string };

const TEXT: Record<string, string> = { empty: '', short: SHORT, long: LONG, huge: HUGE };
const PLACEHOLDER: Record<string, string> = {
  agent: '输入想法、剧本或上传参考，支持「/」使用技能，@ 添加主体，和 Agent 一起创作',
  image: '描述你想生成的图片，可以上传参考图',
  video: '描述你想生成的视频，@ 引用参考素材',
  audio: '描述你想生成的声音，或者输入要念的文字',
};

// 每种任务各记一个模型（面板上没有，记在 update 里），没选过用默认
const modelOf = (s: BoxState): string => {
  const picked = (s as Record<string, unknown>)[`model-${s.mode}`];
  return typeof picked === 'string' ? picked : (DEFAULT_MODEL as Record<string, string>)[s.mode] ?? '';
};

export function PromptBoxPlayground() {
  return (
    <Playground<BoxState>
      stageClassName="shell-pg-stage--scroll"
      controls={[
        { key: 'refs', label: '参考区', type: 'toggle', value: true },
        { key: 'text', label: '提示词', type: 'segment', value: 'long', options: [['empty', '空'], ['short', '短'], ['long', '长'], ['huge', '超长']] },
        { key: 'mode', label: '模式', type: 'segment', value: 'video', options: [['agent', 'Agent'], ['image', '图片生成'], ['video', '视频生成'], ['audio', '音频生成']] },
      ]}
      // 打了字写回面板：删空了是「空」，别的字四个都不亮（记在面板上不显示的 custom 里）
      render={(s, update) => (
        <PromptBox
          key={s.mode}
          placeholder={PLACEHOLDER[s.mode]}
          value={s.text === 'custom' ? String((s as Record<string, unknown>).custom ?? '') : TEXT[s.text]}
          onChange={(v) => update(v ? { text: 'custom', custom: v } : { text: 'empty' })}
          references={s.refs ? <ReferenceStack items={SAMPLE.slice(0, 6)} onAdd={noop} onRemove={noop} /> : undefined}
          toolbar={TOOLBARS[s.mode](modelOf(s), (m) => update({ [`model-${s.mode}`]: m }))}
          actions={
            // 音频没有张数，换成字数 / 上限（照线上）
            <>
              {s.mode === 'audio' ? <AudioCharCount count={(s.text === 'custom' ? String((s as Record<string, unknown>).custom ?? '') : TEXT[s.text]).length} /> : countSelect}
              <GenerateButton cost={demoCost(s.mode, modelOf(s))} />
            </>
          }
        />
      )}
    />
  );
}

// ---------- 属性面板：生成按钮 ----------

type GenState = { size: string; cost: string; state: string };

const GEN_CLASS: Record<string, string | undefined> = { hover: 'is-hover', active: 'is-active' };

export function GenerateButtonPlayground() {
  return (
    <Playground<GenState>
      controls={[
        { key: 'size', label: '尺寸', type: 'segment', value: '32', options: [['28', '小'], ['32', '中'], ['36', '大']] },
        { key: 'cost', label: '消耗', type: 'text', value: '99' },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['active', '按下'], ['disabled', '禁用'], ['loading', '加载中']] },
      ]}
      render={(s) => (
        <GenerateButton
          size={Number(s.size) as ButtonSize}
          cost={s.cost}
          className={GEN_CLASS[s.state]}
          disabled={s.state === 'disabled' || undefined}
          loading={s.state === 'loading' || undefined}
        />
      )}
    />
  );
}

// ---------- 可操作演示 ----------

const DURATIONS = ['5s', '8s', '12s'];

/** 演示一开始放 6 个素材，和参考区演示一样 */
const LAB_START: ReferenceStackItem[] = [
  { id: 'l1', type: 'image', name: '图片1', src: pic(0) },
  { id: 'l2', type: 'video', name: '视频1', src: pic(1), duration: '5s', video: './placeholders/video/kivi-demo-16x9.mp4' },
  { id: 'l3', type: 'video', name: '视频2', src: pic(2), duration: '8s', video: './placeholders/video/kivi-demo-16x9.mp4' },
  { id: 'l4', type: 'video', name: '视频3', src: pic(3), duration: '12s', video: './placeholders/video/kivi-demo-16x9.mp4' },
  { id: 'l5', type: 'audio', name: '音频1', duration: '15s', src: AUDIO },
  { id: 'l6', type: 'video', name: '视频4', src: pic(4), duration: '5s', video: './placeholders/video/kivi-demo-16x9.mp4' },
];

/** 参考区的增删：加图片、视频、音频，模拟上传，删除，清空。上传中的进度自己走，2.4 秒走完 */
function useReferenceLab(initial: ReferenceStackItem[]) {
  const [items, setItems] = useState(initial);
  const timers = useRef(new Map<string, ReturnType<typeof setInterval>>());
  useEffect(() => {
    const all = timers.current;
    return () => all.forEach(clearInterval);
  }, []);

  const stop = (id: string) => {
    clearInterval(timers.current.get(id));
    timers.current.delete(id);
  };

  const add = (type: ReferenceType, upload = false, src?: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
    setItems((list) => {
      const n = list.length;
      return [
        ...list,
        {
          id,
          type,
          name: referenceName(list, type),
          src: type === 'audio' ? undefined : (src ?? pic(n)),
          duration: type === 'video' ? DURATIONS[n % 3] : type === 'audio' ? '15s' : undefined,
          progress: upload ? 0 : undefined,
        },
      ];
    });
    if (upload) {
      const t0 = performance.now();
      const timer = setInterval(() => {
        const p = Math.min(100, ((performance.now() - t0) / 2400) * 100);
        setItems((list) => list.map((i) => (i.id === id ? { ...i, progress: p >= 100 ? undefined : p } : i)));
        if (p >= 100) stop(id);
      }, 50);
      timers.current.set(id, timer);
    }
  };

  const remove = (id: string) => {
    stop(id);
    setItems((list) => list.filter((i) => i.id !== id));
  };

  const clear = () => {
    timers.current.forEach(clearInterval);
    timers.current.clear();
    setItems([]);
  };

  return { items, add, remove, clear, popLast: () => items.length && remove(items[items.length - 1].id) };
}

const SLOW = {
  '--motion-duration-100': '500ms',
  '--motion-duration-150': '750ms',
  '--motion-duration-200': '1000ms',
  '--motion-duration-300': '1500ms',
  '--motion-duration-400': '2000ms',
} as CSSProperties;

const caption: CSSProperties = {
  margin: 'var(--spacing-6) 0 0',
  color: 'var(--color-text-fill-tertiary)',
  fontSize: 'var(--font-size-12)',
  lineHeight: 'var(--font-line-height-20)',
};

const bar: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'var(--spacing-8)',
  padding: 'var(--spacing-12) var(--spacing-24)',
  borderTop: 'var(--border-width-1) solid var(--color-border-subtle)',
};

/**
 * 可操作的输入框：照参考区演示。加素材、鼠标移上去展开、模拟上传、删除、清空、固定展开、慢放。
 * 也能把图片文件拖进输入框。缩略图是占位图，不是真实素材。
 */
export function PromptBoxLab() {
  const { items, add, remove, clear, popLast } = useReferenceLab(LAB_START);
  const [pinned, setPinned] = useState(false);
  const [slow, setSlow] = useState(false);
  const [open, setOpen] = useState(false);

  const dropFiles = (files: File[]) =>
    files.forEach((f) => {
      const type: ReferenceType = f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'image';
      add(type, true, type === 'image' ? URL.createObjectURL(f) : undefined);
    });

  const status = items.length === 0 ? '空' : items.length === 1 ? '一个' : open || pinned ? '展开' : '收起（叠放）';

  return (
    <figure className="shell-demo" style={slow ? SLOW : undefined}>
      <div className="shell-demo-preview" data-stage="base">
        <PromptBox
          defaultValue={LONG}
          placeholder="描述你想生成的视频，@ 引用参考素材"
          onDropFiles={dropFiles}
          references={
            <ReferenceStack
              items={items}
              expanded={pinned || undefined}
              onAdd={() => add('image')}
              onRemove={remove}
              onExpandedChange={setOpen}
            />
          }
          toolbar={videoToolbar()}
          actions={
            <>
              {countSelect}
              <GenerateButton cost={99} />
            </>
          }
        />
      </div>
      <div style={bar}>
        <Button size={28} onClick={() => add('image')}>加图片</Button>
        <Button size={28} onClick={() => add('video')}>加视频</Button>
        <Button size={28} onClick={() => add('audio')}>加音频</Button>
        <Button size={28} onClick={() => add('image', true)}>模拟上传</Button>
        <Button size={28} onClick={popLast}>删掉最后一个</Button>
        <Button size={28} onClick={clear}>清空</Button>
        <Switch checked={pinned} onChange={setPinned}>固定展开</Switch>
        <Switch checked={slow} onChange={setSlow}>慢放 5 倍</Switch>
        <span style={{ ...caption, margin: 0, marginLeft: 'auto', fontFamily: 'var(--shell-mono)' }}>
          {status} · {items.length} 个素材
        </span>
      </div>
    </figure>
  );
}

/** 提示词输入和 @ 引用摆一个，下面写名字（从画布页的「其他零件」里拆出来，样式用画布演示的 cv-part） */
export function PromptInputDemo() {
  const parts: [string, ReactElement][] = [
    [
      'PromptInput + MentionChip',
      <div className="cv-part-panel">
        <PromptInput>
          参考 <MentionChip src={`${IMG}kivi-future-1x1.webp`}>图片1</MentionChip> 里的元素，配上 <MentionChip type="audio">音频1</MentionChip> 的节奏，用 <MentionChip type="video" src={`${IMG}kiwi-light-1x1.webp`}>视频1</MentionChip>、<MentionChip type="skill">分镜脚本</MentionChip> 和 <MentionChip type="node">文本节点</MentionChip> 补充
        </PromptInput>
      </div>,
    ],
  ];
  return (
    <figure className="shell-demo">
      <div className="shell-demo-preview cv-pg-canvas">
        <div className="cv-parts">
          {parts.map(([name, node]) => (
            <div className="cv-part" key={name}>
              <div className="cv-part-stage">{node}</div>
              <span className="cv-part-name">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
