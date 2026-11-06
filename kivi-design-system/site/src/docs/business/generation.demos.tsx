import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  Button,
  AgentControls,
  AgentModeSelect,
  AudioCharCount,
  AudioModelControls,
  AudioParams,
  BackgroundSelect,
  CountSelect,
  ImageModelControls,
  ModelSelect,
  ParamField,
  ParamPicker,
  RatioSelect,
  RefModeSelect,
  SizeSelect,
  SkillPicker,
  TabItem,
  Tabs,
  TaskSelect,
  VideoModelControls,
  VideoParams,
  VoiceSelect,
  type ModelType,
  LoraCard,
  LoraField,
  LoraPicker,
  LoraSettings,
  placeholderImageSrc,
  type LoraFieldItem,
  type LoraPickerItem,
  type PlaceholderImageName,
  GenModelPicker,
  GEN_MODEL_GROUPS,
  SkillPanel,
} from '@kivi';
import { Playground, type PlaygroundState } from '@shell';
import { SKILL_CATEGORIES, SKILL_ITEMS } from './skill-data';
import './canvas.demos.css';
import './generation.demos.css';

// 参数和模型页的属性面板：参数选择、生成下拉、模型和参数控件、Lora 一套、模型偏好、技能。参数表在 generation.mdx
// 创作输入框、生成按钮、提示词输入挪到了 prompt-box.demos.tsx，参考区、附件条、参考格在 reference.demos.tsx。

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
      checked={s.selected}
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

// ---------- GenModelPicker ----------

type GenModelPickerState = { open: boolean; picked: string };

const pickedModels = (mode: string): string[] => {
  const image = GEN_MODEL_GROUPS.find((g) => g.type === 'image')!.options.map((o) => o.value);
  const video = GEN_MODEL_GROUPS.find((g) => g.type === 'video')!.options.map((o) => o.value);
  if (mode === 'image') return image.slice(0, 4);
  if (mode === 'some') return [image[0], video[0]];
  return [];
};

export function GenModelPickerPlayground() {
  return (
    <Playground<GenModelPickerState>
      controls={[
        { key: 'open', label: '展开', type: 'toggle', value: true },
        { key: 'picked', label: '已选', type: 'segment', value: 'none', options: [['none', '没选'], ['some', '各选一个'], ['image', '图片选满 4 个']] },
      ]}
      render={(s, update) => (
        <div style={tall(520)}>
          <GenModelPicker open={s.open} onOpenChange={(open) => update({ open })} placement={UP} picked={pickedModels(s.picked)} />
        </div>
      )}
    />
  );
}

// ---------- SkillPanel ----------

type SkillPanelState = { status: 'ready' | 'loading' | 'failed'; tab: string; empty: boolean; search: string };

export function SkillPanelPlayground() {
  return (
    <Playground<SkillPanelState>
      controls={[
        { key: 'status', label: '列表', type: 'segment', value: 'ready', options: [['ready', '正常'], ['loading', '加载中'], ['failed', '加载失败']] },
        { key: 'tab', label: '页签', type: 'segment', value: 'recommend', options: [['recommend', '推荐'], ...SKILL_CATEGORIES.map((c) => [c, c] as [string, string]), ['mine', '我的']] },
        { key: 'empty', label: '没有技能', type: 'toggle', value: false },
        { key: 'search', label: '搜索的字', type: 'text', value: '' },
      ]}
      render={(s) => (
        // 页签和搜索只是初始状态：换了就重新挂载
        <SkillPanel
          key={`${s.tab}|${s.search}`}
          status={s.status}
          items={s.empty ? [] : SKILL_ITEMS}
          categories={SKILL_CATEGORIES}
          defaultTab={s.tab}
          defaultSearch={s.search || undefined}
        />
      )}
    />
  );
}

// ---------- 参数选择、生成下拉、模型和参数控件 ----------

type Update = (patch: Partial<PlaygroundState>) => void;

/** 弹出类的演示：触发器放在台子下面、浮层往上弹，默认展开；台子留够浮层的高度。一串控件横排，间距同工具条左边 6 */
const ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)' };
const tall = (minHeight: number): CSSProperties => ({ minHeight, display: 'flex', alignItems: 'flex-end' });
const UP = 'top-start' as const;

const OPEN = { key: 'open', label: '展开', type: 'toggle', value: true } as const;

const AUDIO_MODELS: [string, string][] = [['seed-audio-1.0', 'Seed Audio'], ['minimax-speech-2.8-hd', 'MiniMax'], ['eleven-v4', 'Eleven']];

/** ParamPicker 面板里两块分段：值自己管 */
function DemoParamFields() {
  const [size, setSize] = useState('2K');
  const [ratio, setRatio] = useState('1:1');
  return (
    <>
      <ParamField label="分辨率">
        <Tabs variant="segment" value={size} onChange={setSize} aria-label="分辨率">
          {['1K', '2K', '4K'].map((v) => <TabItem key={v} value={v}>{v}</TabItem>)}
        </Tabs>
      </ParamField>
      <ParamField label="比例">
        <Tabs variant="segment" value={ratio} onChange={setRatio} aria-label="比例">
          {['1:1', '3:4', '16:9', '9:16'].map((v) => <TabItem key={v} value={v}>{v}</TabItem>)}
        </Tabs>
      </ParamField>
    </>
  );
}

type ParamPickerState = { open: boolean; summary: string };

export function ParamPickerPlayground() {
  return (
    <Playground<ParamPickerState>
      controls={[OPEN, { key: 'summary', label: '摘要', type: 'text', value: '2K · 1:1' }]}
      render={(s, update) => (
        <div style={tall(320)}>
          <ParamPicker placement={UP} summary={s.summary} open={s.open} onOpenChange={(open) => update({ open })}>
            <DemoParamFields />
          </ParamPicker>
        </div>
      )}
    />
  );
}

const GEN_SELECTS: Record<string, (p: { open: boolean; onOpenChange: (open: boolean) => void; placement: typeof UP }) => ReactNode> = {
  task: (p) => <TaskSelect {...p} />,
  ref: (p) => <RefModeSelect {...p} />,
  size: (p) => <SizeSelect {...p} />,
  ratio: (p) => <RatioSelect {...p} />,
  background: (p) => <BackgroundSelect {...p} />,
  count: (p) => <CountSelect {...p} />,
  agent: (p) => <AgentModeSelect {...p} />,
};

type GenSelectState = { which: string; open: boolean };

export function GenSelectPlayground() {
  return (
    <Playground<GenSelectState>
      controls={[
        { key: 'which', label: '下拉', type: 'segment', value: 'task', options: [['task', '任务类型'], ['ref', '参考方式'], ['size', '尺寸'], ['ratio', '比例'], ['background', '背景'], ['count', '张数'], ['agent', 'Agent 模式']] },
        OPEN,
      ]}
      render={(s, update) => (
        <div style={tall(420)} key={s.which}>
          {GEN_SELECTS[s.which]({ open: s.open, onOpenChange: (open) => update({ open }), placement: UP })}
        </div>
      )}
    />
  );
}

type ModelSelectState = { type: string; open: boolean };

export function ModelSelectPlayground() {
  return (
    <Playground<ModelSelectState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'image', options: [['text', '对话'], ['image', '图片'], ['video', '视频'], ['audio', '音频']] },
        OPEN,
      ]}
      render={(s, update) => (
        <div style={tall(420)} key={s.type}>
          <ModelSelect type={s.type as ModelType} placement={UP} open={s.open} onOpenChange={(open) => update({ open })} />
        </div>
      )}
    />
  );
}

type AudioModelState = { model: string; open: boolean };

export function VoiceSelectPlayground() {
  return (
    <Playground<AudioModelState>
      controls={[{ key: 'model', label: '音频模型', type: 'segment', value: 'seed-audio-1.0', options: AUDIO_MODELS }, OPEN]}
      render={(s, update) => (
        <div style={tall(320)} key={s.model}>
          <VoiceSelect model={s.model} placement={UP} open={s.open} onOpenChange={(open) => update({ open })} />
        </div>
      )}
    />
  );
}

type VideoParamsState = { audio: boolean; open: boolean };

export function VideoParamsPlayground() {
  return (
    <Playground<VideoParamsState>
      controls={[{ key: 'audio', label: '生成音频', type: 'toggle', value: false }, OPEN]}
      render={(s, update) => (
        <div style={tall(480)} key={String(s.audio)}>
          <VideoParams audio={s.audio || undefined} placement={UP} open={s.open} onOpenChange={(open) => update({ open })} />
        </div>
      )}
    />
  );
}

export function AudioParamsPlayground() {
  return (
    <Playground<AudioModelState>
      controls={[{ key: 'model', label: '音频模型', type: 'segment', value: 'seed-audio-1.0', options: AUDIO_MODELS }, OPEN]}
      render={(s, update) => (
        <div style={tall(480)} key={s.model}>
          <AudioParams model={s.model} placement={UP} open={s.open} onOpenChange={(open) => update({ open })} />
        </div>
      )}
    />
  );
}

type ModelState = { model: string; open: boolean };

/** 模型和面板双向同步：在下拉里换了模型，写回面板。展开的是模型下拉 */
const modelPlayground = (options: [string, string][], render: (s: ModelState, update: Update) => ReactNode) => (
  <Playground<ModelState>
    controls={[{ key: 'model', label: '模型', type: 'segment', value: options[0][0], options }, OPEN]}
    render={(s, update) => <div style={{ ...ROW, ...tall(420) }}>{render(s, update)}</div>}
  />
);

/** 模型控件里模型下拉的展开、位置 */
const modelOpen = (s: ModelState, update: Update) => ({
  placement: UP,
  open: s.open,
  onOpenChange: (open: boolean) => update({ open }),
  onModelChange: (m: string) => update({ model: m }),
});

export function VideoModelControlsPlayground() {
  return modelPlayground(
    [['seedance-2.0', 'Seedance 2.0（带生成音频）'], ['happyhorse', 'HappyHorse'], ['veo-3.1-fast', 'Veo 3.1 Fast（只有首尾帧）']],
    (s, update) => <VideoModelControls model={s.model} {...modelOpen(s, update)} />,
  );
}

export function ImageModelControlsPlayground() {
  return modelPlayground(
    [['gpt-image-2', 'GPT Image 2（带背景）'], ['nano-banana-2', 'Nano Banana 2']],
    (s, update) => <ImageModelControls model={s.model} {...modelOpen(s, update)} />,
  );
}

export function AudioModelControlsPlayground() {
  return modelPlayground(AUDIO_MODELS, (s, update) => <AudioModelControls model={s.model} {...modelOpen(s, update)} />);
}

type CharCountState = { model: string; count: string };

export function AudioCharCountPlayground() {
  return (
    <Playground<CharCountState>
      controls={[
        { key: 'model', label: '音频模型', type: 'segment', value: 'seed-audio-1.0', options: AUDIO_MODELS },
        { key: 'count', label: '字数', type: 'segment', value: '128', options: [['0', '0'], ['128', '128'], ['3200', '3200'], ['12000', '12000']] },
      ]}
      render={(s) => <AudioCharCount model={s.model} count={Number(s.count)} />}
    />
  );
}

// ---------- 技能选择、Agent 控件 ----------

type SkillPickerState = { open: boolean };

export function SkillPickerPlayground() {
  return (
    <Playground<SkillPickerState>
      controls={[OPEN]}
      render={(s, update) => (
        <div style={tall(560)}>
          <SkillPicker open={s.open} onOpenChange={(open) => update({ open })} placement={UP} items={SKILL_ITEMS} categories={SKILL_CATEGORIES} />
        </div>
      )}
    />
  );
}

type AgentControlsState = { picked: string; open: boolean };

export function AgentControlsPlayground() {
  return (
    <Playground<AgentControlsState>
      controls={[{ key: 'picked', label: '已选模型', type: 'segment', value: 'none', options: [['none', '没选'], ['some', '各选一个'], ['image', '图片选满 4 个']] }, OPEN]}
      render={(s, update) => (
        // 展开的是选择模型
        <div style={{ ...ROW, ...tall(520) }}>
          <AgentControls open={s.open} onOpenChange={(open) => update({ open })} placement={UP} picked={pickedModels(s.picked)} skills={SKILL_ITEMS} skillCategories={SKILL_CATEGORIES} />
        </div>
      )}
    />
  );
}
