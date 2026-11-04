import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type ReactElement } from 'react';
import {
  Button,
  GenerateButton,
  PromptBox,
  ReferenceStack,
  Toaster,
  Switch,
  referenceName,
  type ButtonSize,
  type ReferenceType,
  type ReferenceStackItem,
  LoraCard,
  LoraField,
  LoraPicker,
  LoraSettings,
  placeholderImageSrc,
  type LoraFieldItem,
  type LoraPickerItem,
  type PlaceholderImageName,
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
import { Playground, type PlaygroundState } from '@shell';
import { SKILL_CATEGORIES, SKILL_ITEMS } from './skill-data';
import './canvas.demos.css';
import './generation.demos.css';

// 生成页的属性面板和可操作演示：主站输入框、生成按钮，Lora 一套，提示词输入。参数表在 generation.mdx
// 提示词输入的零件摆放用画布演示的样式（canvas.demos.css）。参考区、附件条、参考格挪到了 reference.demos.tsx。

interface DemoLora extends LoraPickerItem {
  triggerWords: string;
  template: string;
}

const cover = (image: PlaceholderImageName) => placeholderImageSrc(image, '3:4');

/** 演示数据：8 个 Lora，只写这一份 */
const LORAS: DemoLora[] = [
  {
    id: 'realistic-v2',
    name: '写实人像 V2',
    description: '真实肤质与自然光影，适合半身和特写人像。',
    cover: cover('kiwi-glass'),
    base: 'SDXL',
    isNew: true,
    collected: true,
    triggerWords: 'realistic portrait, soft light',
    template: 'a realistic portrait of {subject}, natural skin texture, soft window light, 85mm lens, shallow depth of field, highly detailed',
  },
  {
    id: 'guochao',
    name: '国潮插画',
    description: '红金配色与传统纹样，带一点现代海报感。',
    cover: cover('kivi-future'),
    base: 'FLUX',
    collected: true,
    triggerWords: 'guochao style, red and gold',
    template: 'guochao illustration of {subject}, traditional patterns, red and gold palette, flat shading, poster layout',
  },
  {
    id: 'cyber-neon',
    name: '赛博霓虹',
    description: '雨夜街头的霓虹反光，冷暖对撞。',
    cover: cover('kiwi-light'),
    base: 'SDXL',
    triggerWords: 'cyberpunk neon, rainy street',
    template: 'cyberpunk neon scene of {subject}, wet asphalt reflections, magenta and cyan lights, cinematic',
  },
  {
    id: 'film-jp',
    name: '日系胶片',
    description: '低饱和、轻微颗粒，像随手拍下的一个下午。',
    cover: cover('bunny-gouache'),
    base: 'SD1.5',
    triggerWords: 'film photo, japanese snapshot',
    template: 'japanese film snapshot of {subject}, low saturation, light grain, overexposed highlights, casual framing',
  },
  {
    id: 'blind-box-3d',
    name: '3D 盲盒',
    description: '圆润的玩具质感，柔和的棚拍光。',
    cover: cover('monstera-dots'),
    base: 'FLUX',
    isNew: true,
    collected: true,
    triggerWords: '3d blind box, toy figure',
    template: '3d blind box figure of {subject}, glossy vinyl, rounded shapes, soft studio light, pastel background',
  },
  {
    id: 'watercolor',
    name: '水彩手绘',
    description: '纸面晕染与留白，边缘自然渗开。',
    cover: cover('ip-peek'),
    base: 'SD1.5',
    triggerWords: 'watercolor, hand painted',
    template: 'watercolor painting of {subject}, wet-on-wet blooms, visible paper texture, generous white space',
  },
  {
    id: 'product-white',
    name: '商品白底',
    description: '干净白底与柔和投影，电商主图直接可用。',
    cover: cover('ip-gouache'),
    base: 'SDXL',
    triggerWords: 'product shot, white background',
    template: 'product photo of {subject}, pure white background, soft contact shadow, even lighting, e-commerce',
  },
  {
    id: 'arch-sketch',
    name: '建筑速写',
    description: '钢笔线条加淡彩，几笔勾出空间结构。',
    cover: cover('ip-kiwi-pile'),
    base: 'FLUX',
    triggerWords: 'architectural sketch, pen and wash',
    template: 'architectural sketch of {subject}, loose pen lines, light color wash, perspective view',
  },
];

const byId = (id: string) => LORAS.find((l) => l.id === id)!;

/** 面板里的状态存成字符串：id 用逗号连起来 */
const toIds = (s: string | boolean | undefined) => (typeof s === 'string' && s ? s.split(',') : []);
const parseWeights = (s: string | boolean | undefined): Record<string, number> => {
  try {
    return typeof s === 'string' && s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
};

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
  { id: 's3', type: 'video', name: '视频1', src: pic(2), duration: '5s' },
  { id: 's4', type: 'video', name: '视频2', src: pic(3), duration: '8s' },
  { id: 's5', type: 'video', name: '视频3', src: pic(4), duration: '12s' },
  { id: 's6', type: 'audio', name: '音频1', duration: '15s' },
  { id: 's7', type: 'image', name: '图片3', src: pic(5) },
  { id: 's8', type: 'video', name: '视频4', src: pic(6), duration: '5s' },
];

const SHORT = '生成一张赛博朋克风格的猕猴桃海报';
const LONG =
  '明亮的商业广告风格，饼干是主角。草莓口味参考 @图片1，开场用 @视频1 的构图，音乐在重拍处切入；饼干排成整齐的阵列，镜头参考 @视频2 的运动方式，高潮时饼干掰开进入慢动作，夹心爆开、碎屑飞散，最后定格在 @图片2 的画面，配乐用 @音频1。';
const HUGE = [LONG, LONG, LONG].join('\n');

const noop = () => {};

// ---------- 工具条 ----------
// 下拉、参数面板都用 generation.tsx 里共用的那一份，和画布生成面板一样：选项、顺序、图标、展开方向都一致

const TOOLBARS: Record<string, () => JSX.Element> = {
  agent: () => (
    <>
      <TaskSelect defaultValue="agent" />
      <AgentControls skills={SKILL_ITEMS} skillCategories={SKILL_CATEGORIES} />
    </>
  ),
  image: () => (
    <>
      <TaskSelect defaultValue="image" />
      <ImageModelControls />
    </>
  ),
  video: () => (
    <>
      <TaskSelect defaultValue="video" />
      <VideoModelControls />
    </>
  ),
  audio: () => (
    <>
      <TaskSelect defaultValue="audio" />
      <AudioModelControls />
    </>
  ),
};

const videoToolbar = TOOLBARS.video;
const countSelect = <CountSelect />;

// ---------- 属性面板：整个输入框 ----------

type BoxState = { refs: boolean; text: string; mode: string };

const TEXT: Record<string, string> = { empty: '', short: SHORT, long: LONG, huge: HUGE };
const PLACEHOLDER: Record<string, string> = {
  agent: '输入想法、剧本或上传参考，支持「/」使用技能，@ 添加主体，和 Agent 一起创作',
  image: '描述你想生成的图片，可以上传参考图',
  video: '描述你想生成的视频，@ 引用参考素材',
  audio: '描述你想生成的声音，或者输入要念的文字',
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
          toolbar={TOOLBARS[s.mode]()}
          actions={
            // 音频没有张数，换成字数 / 上限（照线上）
            <>
              {s.mode === 'audio' ? <AudioCharCount count={(s.text === 'custom' ? String((s as Record<string, unknown>).custom ?? '') : TEXT[s.text]).length} /> : countSelect}
              <GenerateButton cost={s.mode === 'image' ? 4 : s.mode === 'audio' ? 2 : 99} />
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
  { id: 'l2', type: 'video', name: '视频1', src: pic(1), duration: '5s' },
  { id: 'l3', type: 'video', name: '视频2', src: pic(2), duration: '8s' },
  { id: 'l4', type: 'video', name: '视频3', src: pic(3), duration: '12s' },
  { id: 'l5', type: 'audio', name: '音频1', duration: '15s' },
  { id: 'l6', type: 'video', name: '视频4', src: pic(4), duration: '5s' },
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
      {/* 拖来的文件类型不收时弹 toast，这一页放一个 Toaster */}
      <Toaster />
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

// ---------- LoraField ----------

type FieldState = { max: string; picker: boolean; ids: string; weights: string };

function renderField(s: FieldState, update: (patch: Partial<PlaygroundState>) => void) {
  const ids = toIds(s.ids);
  const weights = parseWeights(s.weights);
  const items: LoraFieldItem[] = ids.map((id) => ({ ...byId(id), weight: weights[id] ?? 1 }));
  return (
    <>
      <LoraField
        max={Number(s.max)}
        value={items}
        onChange={(next) =>
          update({ ids: next.map((i) => i.id).join(','), weights: JSON.stringify(Object.fromEntries(next.map((i) => [i.id, i.weight]))) })
        }
        onAdd={() => update({ picker: true })}
      />
      <LoraPicker
        open={s.picker}
        onOpenChange={(open) => update({ picker: open })}
        items={LORAS}
        max={Number(s.max)}
        value={ids}
        onChange={(next) => update({ ids: next.join(',') })}
      />
    </>
  );
}

export function LoraFieldPlayground() {
  return (
    <Playground<FieldState>
      stageClassName="lora-pg-field"
      controls={[
        { key: 'max', label: '最多', type: 'segment', value: '4', options: [['2', '2 个'], ['4', '4 个']] },
        { key: 'picker', label: '选择弹窗', type: 'toggle', value: false },
        { key: 'ids', label: '已选', type: 'text', value: 'realistic-v2,guochao' },
        { key: 'weights', label: '权重', type: 'text', value: '' },
      ]}
      rules={() => ({ ids: true, weights: true })}
      render={renderField}
    />
  );
}

// ---------- LoraSettings ----------

type SettingsState = { name: string; showTrigger: boolean; triggerWords: string; showTemplate: boolean; template: string; weight: string };

/** 文档外框：摆成设置面板弹出后的样子（玻璃底、圆角 16、内边距 12）。不用真的 Popover：它开着时按 Esc 会拦住页面上别的弹窗。代码里只写它里面的东西 */
function PanelFrame({ children }: { children: ReactNode }) {
  return <div className="kv-popover kv-popover--panel lora-pg-frame">{children}</div>;
}
PanelFrame.docFrame = true;

function renderSettings(s: SettingsState, update: (patch: Partial<PlaygroundState>) => void) {
  const weight = Math.min(2, Math.max(0, Number(s.weight) || 0));
  return (
    <PanelFrame>
      <LoraSettings
        name={s.name}
        triggerWords={s.showTrigger ? s.triggerWords : undefined}
        template={s.showTemplate ? s.template : undefined}
        weight={weight}
        onWeightChange={(w) => update({ weight: w.toFixed(1) })}
      />
    </PanelFrame>
  );
}

export function LoraSettingsPlayground() {
  return (
    <Playground<SettingsState>
      controls={[
        { key: 'name', label: '名字', type: 'text', value: byId('realistic-v2').name },
        { key: 'showTrigger', label: '触发词', type: 'toggle', value: true },
        { key: 'triggerWords', label: '触发词内容', type: 'text', value: byId('realistic-v2').triggerWords },
        { key: 'showTemplate', label: '提示词模版', type: 'toggle', value: true },
        { key: 'template', label: '模版内容', type: 'text', value: byId('realistic-v2').template },
        { key: 'weight', label: '权重', type: 'text', value: '1.0' },
      ]}
      rules={(s) => ({ ...(s.showTrigger ? {} : { triggerWords: true }), ...(s.showTemplate ? {} : { template: true }) })}
      render={renderSettings}
    />
  );
}

// ---------- LoraCard ----------

type CardState = { base: string; isNew: boolean; hover: boolean; selected: boolean; collected: boolean; name: string; description: string };

function renderCard(s: CardState, update: (patch: Partial<PlaygroundState>) => void) {
  return (
    <LoraCard
      style={{ width: 200 }}
      className={s.hover ? 'is-hover' : undefined}
      name={s.name}
      description={s.description}
      cover={cover('kiwi-glass')}
      base={s.base}
      isNew={s.isNew}
      selected={s.selected}
      collected={s.collected}
      onClick={() => update({ selected: !s.selected })}
      onCollectedChange={(collected) => update({ collected })}
    />
  );
}

export function LoraCardPlayground() {
  return (
    <Playground<CardState>
      stageClassName="lora-pg-card"
      controls={[
        { key: 'name', label: '名字', type: 'text', value: '写实人像 V2' },
        { key: 'description', label: '描述', type: 'text', value: byId('realistic-v2').description ?? '' },
        { key: 'base', label: '底模', type: 'segment', value: 'SDXL', options: [['SDXL', 'SDXL'], ['FLUX', 'FLUX'], ['SD1.5', 'SD1.5']] },
        { key: 'isNew', label: 'New', type: 'toggle', value: false },
        { key: 'hover', label: '悬停', type: 'toggle', value: false },
        { key: 'selected', label: '选中', type: 'toggle', value: false },
        { key: 'collected', label: '收藏', type: 'toggle', value: false },
      ]}
      render={renderCard}
    />
  );
}

// ---------- LoraPicker ----------

type PickerState = { open: boolean; max: string; data: string; selected: string; collected: string };

function renderPicker(s: PickerState, update: (patch: Partial<PlaygroundState>) => void) {
  return (
    <>
      <Button variant="secondary" onClick={() => update({ open: true })}>
        选择 Lora
      </Button>
      <LoraPicker
        open={s.open}
        onOpenChange={(open) => update({ open })}
        items={s.data === 'none' ? [] : LORAS}
        max={Number(s.max)}
        value={toIds(s.selected)}
        onChange={(next) => update({ selected: next.join(',') })}
        collectedIds={toIds(s.collected)}
        onCollectedIdsChange={(next) => update({ collected: next.join(',') })}
      />
    </>
  );
}

export function LoraPickerPlayground() {
  return (
    <Playground<PickerState>
      controls={[
        { key: 'open', label: '展开', type: 'toggle', value: false },
        { key: 'max', label: '最多选', type: 'segment', value: '4', options: [['2', '2 个'], ['4', '4 个']] },
        { key: 'data', label: '数据', type: 'segment', value: 'all', options: [['all', '8 个'], ['none', '没有']] },
        { key: 'selected', label: '选中', type: 'text', value: '' },
        { key: 'collected', label: '收藏', type: 'text', value: LORAS.filter((l) => l.collected).map((l) => l.id).join(',') },
      ]}
      rules={() => ({ selected: true, collected: true })}
      render={renderPicker}
    />
  );
}

/** 提示词输入和 @ 引用摆一个，下面写名字（从画布页的「其他零件」里拆出来，样式用画布演示的 cv-part） */
export function PromptInputDemo() {
  const parts: [string, ReactElement][] = [
    [
      'PromptInput + MentionChip',
      <div className="cv-part-panel">
        <PromptInput>
          参考 <MentionChip src={`${IMG}kivi-future-1x1.webp`}>图片1</MentionChip> 里的元素，配上 <MentionChip type="music">音乐1</MentionChip> 的节奏，用 <MentionChip type="video" src={`${IMG}kiwi-light-1x1.webp`}>视频1</MentionChip>、<MentionChip type="skill">分镜脚本</MentionChip> 和 <MentionChip type="node">文本节点</MentionChip> 补充
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
