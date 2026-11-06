import type { CSSProperties } from 'react';
import { GenPrompt, GenPromptRefs, MediaGroup, ResultTile, Tag, type GenPromptRefItem, type IconName, type MediaGroupItem, type MediaGroupType, type ResultTileAction, type ResultTileType } from '@kivi';
import { Playground, type PlaygroundState } from '@shell';
import { openPreview, VIDEO } from '../components/media.demos';

// 生成记录页的属性面板：任务、长度、类型、状态都在面板里切。参数表在 records.mdx

const IMG = './placeholders/';

// ---------- GenPrompt ----------

const SHORT = '生成一张赛博朋克风格的猕猴桃海报';
const LONG =
  '生成一张赛博朋克风格的猕猴桃海报：霓虹灯下的未来都市街道，雨夜反光的路面，巨大的全息广告牌上写着 KIVI，画面中央是一颗发光的猕猴桃切面，周围漂浮着数据流和粒子，电影级光影，广角镜头，高对比度，细节丰富，8K 质感，整体色调以青色和品红色为主。';

const REFS: GenPromptRefItem[] = [
  { type: 'image', src: `${IMG}kivi-future-1x1.webp` },
  { type: 'image', src: `${IMG}monstera-dots-1x1.webp` },
  { type: 'video', src: `${IMG}kiwi-light-1x1.webp`, duration: '5s' },
  { type: 'audio', duration: '8s' },
  { type: 'image', src: `${IMG}ip-gouache-1x1.webp` },
  { type: 'video', src: `${IMG}bunny-gouache-1x1.webp`, duration: '12s' },
];

/** 工具类任务：标签左边是工具的图标，照 Figma「模板 · 主站」「示例 · 工具 · 扩图」；参考区写「原图」或「原视频」 */
const TOOLS: Record<string, { label: string; icon: IconName; source: string; refs: number }> = {
  rmbg: { label: '抠图', icon: 'Rmbg', source: '原图', refs: 1 },
  expand: { label: '扩图', icon: 'Expand', source: '原图', refs: 1 },
  redraw: { label: '重绘', icon: 'SmartEditing', source: '原图', refs: 1 },
  hd: { label: '高清', icon: 'HD', source: '原图', refs: 1 },
  remove: { label: '元素去除', icon: 'RemoveEle', source: '原图', refs: 1 },
  loop: { label: '视频循环', icon: 'VideoLoop', source: '原视频', refs: 1 },
  stitch: { label: '视频拼接', icon: 'Connecting', source: '原视频', refs: 3 },
};

type GenPromptState = {
  task: 'gen' | 'tool';
  tool: string;
  length: 'short' | 'long';
  refs: boolean;
  overflow: boolean;
  refText: string;
};

function renderGenPrompt(s: GenPromptState) {
  // 工具类任务（抠图、高清…）没有提示词，只显示一排参数
  if (s.task === 'tool') {
    const tool = TOOLS[s.tool];
    return (
      <GenPrompt>
        <Tag icon={tool.icon}>{tool.label}</Tag>
        {s.refs && <GenPromptRefs label={tool.source} items={REFS.slice(0, tool.refs)} />}
      </GenPrompt>
    );
  }
  return (
    <GenPrompt prompt={s.length === 'long' ? LONG : SHORT}>
      <Tag icon="VideoGeneration">视频生成</Tag>
      <Tag icon="Bytedance">Seedance 2.0 Fast</Tag>
      {s.refs && <GenPromptRefs label={s.refText} items={s.overflow ? REFS : REFS.slice(0, 4)} />}
      <Tag>2K</Tag>
      <Tag>智能比例</Tag>
      <Tag>8s</Tag>
    </GenPrompt>
  );
}

type RefsState = { count: string; type: string; label: string };

export function GenPromptRefsPlayground() {
  return (
    // 悬停浮层往下开，台子留够高度（样式在 records.mdx 顶上）
    <div className="ms-pg-gen-prompt">
      <Playground<RefsState>
        controls={[
          { key: 'count', label: '素材', type: 'segment', value: '4', options: [['1', '1 个'], ['4', '4 个'], ['5', '5 个'], ['6', '6 个（超出）']] },
          { key: 'type', label: '类型', type: 'segment', value: 'mixed', options: [['image', '图片'], ['mixed', '混排']] },
          { key: 'label', label: '参考方式', type: 'text', value: '全能参考' },
        ]}
        render={(s) => {
          // 只放图片：把视频首帧、音频都当图片用
          const items = (s.type === 'image' ? REFS.map((r): GenPromptRefItem => ({ type: 'image', src: r.src ?? `${IMG}kiwi-light-1x1.webp` })) : REFS).slice(0, Number(s.count));
          return <GenPromptRefs label={s.label || '参考图'} items={items} />;
        }}
      />
    </div>
  );
}

export function GenPromptPlayground() {
  return (
    // 这个属性面板里浮层往下开，台子留够高度（样式在 records.mdx 顶上）
    <div className="ms-pg-gen-prompt">
      <Playground<GenPromptState>
        controls={[
          { key: 'task', label: '任务', type: 'segment', value: 'gen', options: [['gen', '生成'], ['tool', '工具']] },
          { key: 'tool', label: '工具', type: 'segment', value: 'rmbg', options: Object.entries(TOOLS).map(([k, t]) => [k, t.label] as [string, string]) },
          { key: 'length', label: '长度', type: 'segment', value: 'short', options: [['short', '短'], ['long', '超出两行']] },
          { key: 'refs', label: '参考', type: 'toggle', value: true },
          { key: 'overflow', label: '参考超出', type: 'toggle', value: true },
          { key: 'refText', label: '参考文字', type: 'text', value: '全能参考' },
        ]}
        // 工具类任务没有提示词，参考区只放一张原图；没有参考区就没有超出和文字
        rules={(s) => ({
          ...(s.task === 'tool' ? { length: true, overflow: true, refText: true } : { tool: true }),
          ...(s.refs ? {} : { overflow: true, refText: true }),
        })}
        render={renderGenPrompt}
      />
    </div>
  );
}

// ---------- ResultTile ----------

const TOP: ResultTileAction[] = [
  { icon: 'Delete', label: '删除' },
  { icon: 'Download', label: '下载' },
];

const QUICK: Record<ResultTileType, ResultTileAction[]> = {
  image: [
    { icon: 'ImageEditing', label: '图片编辑' },
    { icon: 'VideoGeneration', label: '图生视频' },
    { icon: 'ImageToImage', label: '一键垫图' },
    { icon: 'More', label: '更多' },
  ],
  video: [
    { icon: 'VideoEditing', label: '视频编辑' },
    { icon: 'HD', label: '视频高清' },
    { icon: 'VideoLoop', label: '视频循环' },
    { icon: 'More', label: '更多' },
  ],
};

const PIC: Record<ResultTileType, { done: string; hover: string }> = {
  image: { done: 'kiwi-glass', hover: 'monstera-dots' },
  video: { done: 'bunny-gouache', hover: 'ip-kiwi-pile' },
};

type ResultTileState = { type: ResultTileType; state: string; source: boolean; collected: boolean };

function renderResultTile(s: ResultTileState, update: (patch: Partial<PlaygroundState>) => void) {
  const video = s.type === 'video';
  const type = video ? 'video' : undefined;
  if (s.state === 'generating') {
    // 有原素材：重新生成，原来的图或视频垫在遮罩下面
    const src = s.source ? (video ? VIDEO.wide : `${IMG}${PIC[s.type].done}-1x1.webp`) : undefined;
    return <ResultTile type={type} status="generating" src={src} badge="59s 生成中" />;
  }
  // 失败的格子还能删除：只有右上「删除」
  if (s.state === 'failed') return <ResultTile type={type} status="failed" topActions={TOP.slice(0, 1)} />;
  const hover = s.state === 'hover';
  return (
    <ResultTile
      type={type}
      src={video ? VIDEO.wide : `${IMG}${PIC[s.type][hover ? 'hover' : 'done']}-1x1.webp`}
      topActions={TOP}
      collect
      collected={s.collected}
      onCollectedChange={(v) => update({ collected: v })}
      quickActions={QUICK[s.type]}
      onPreview={video ? (t) => openPreview(VIDEO.wide, t) : undefined}
      className={hover ? 'is-hover' : undefined}
    />
  );
}

export function ResultTilePlayground() {
  return (
    <Playground<ResultTileState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'image', options: [['image', '图片'], ['video', '视频']] },
        { key: 'state', label: '状态', type: 'segment', value: 'done', options: [['generating', '生成中'], ['done', '完成'], ['hover', '悬停'], ['failed', '失败']] },
        { key: 'source', label: '有原素材（重新生成）', type: 'toggle', value: false },
        { key: 'collected', label: '已收藏', type: 'toggle', value: false },
      ]}
      rules={(s) => ({ source: s.state !== 'generating', collected: s.state === 'generating' || s.state === 'failed' })}
      render={renderResultTile}
    />
  );
}

// ---------- 生成结果：叠放 ↔ 展开 ----------


/** 中间有失败：封面取第一张成功的，叠放比例跟它 */
const RESULT_MIXED: MediaGroupItem[] = [
  { id: 'a1', status: 'failed', ratio: '1:1', name: '卡通小猫1' },
  { id: 'a2', status: 'failed', ratio: '1:1', name: '卡通小猫2' },
  { id: 'a3', src: `${IMG}bunny-gouache-3x4.webp`, ratio: '3:4', name: '卡通小猫3·奶油色' },
  { id: 'a4', src: `${IMG}ip-gouache-1x1.webp`, ratio: '1:1', name: '卡通小猫4·白猫蝴蝶结' },
  { id: 'a5', status: 'failed', ratio: '1:1', name: '卡通小猫5' },
];

/** 比例不同：封面取第一张，叠放 16:9 */
const RESULT_RATIOS: MediaGroupItem[] = [
  { id: 'b1', src: `${IMG}kiwi-light-16x9.webp`, ratio: '16:9', name: '小狗横版 16:9' },
  { id: 'b2', src: `${IMG}ip-future-16x9.webp`, ratio: '16:9', name: '小狗横版 16:9 · 2' },
  { id: 'b3', src: `${IMG}monstera-dots-16x9.webp`, ratio: '16:9', name: '小狗横版 16:9 · 3' },
  { id: 'b4', src: `${IMG}ip-peek-16x9.webp`, ratio: '16:9', name: '小狗横版 16:9 · 4' },
  { id: 'b5', src: `${IMG}kiwi-light-9x16.webp`, ratio: '9:16', name: '小狗竖版 9:16' },
  { id: 'b6', src: `${IMG}kivi-future-9x16.webp`, ratio: '9:16', name: '小狗竖版 9:16 · 2' },
];

type Update = (patch: Partial<PlaygroundState>) => void;

// 画布 Agent 侧栏 500，减去左右内边距大约 420
const PANEL: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, minWidth: 0, width: 420, maxWidth: '100%' };

type MediaGroupState = { items: string; type: string; expand: string };

const RESULT_SETS: Record<string, MediaGroupItem[]> = { mixed: RESULT_MIXED, ratios: RESULT_RATIOS };

/** 点标题行或叠放展开，点标题行收起；展开写回面板 */
function renderMediaGroup(s: MediaGroupState, update: Update) {
  return (
    <div style={PANEL}>
      <MediaGroup
        items={RESULT_SETS[s.items]}
        type={s.type as MediaGroupType}
        expanded={s.expand === 'yes'}
        onExpandedChange={(v) => update({ expand: v ? 'yes' : 'no' })}
      />
    </div>
  );
}

export function MediaGroupPlayground() {
  return (
    <Playground<MediaGroupState>
      controls={[
        { key: 'items', label: '结果', type: 'segment', value: 'mixed', options: [['mixed', '中间有失败'], ['ratios', '比例不同']] },
        { key: 'type', label: '类型', type: 'segment', value: 'image', options: [['image', '图片'], ['video', '视频']] },
        { key: 'expand', label: '展开', type: 'segment', value: 'no', options: [['no', '否'], ['yes', '是']] },
      ]}
      render={renderMediaGroup}
    />
  );
}
