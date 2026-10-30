import { GenPrompt, GenPromptRefs, ResultTile, Tag, type GenPromptRefItem, type IconName, type ResultTileAction, type ResultTileType } from '@kivi';
import { Playground } from '@shell';
import { openPreview, VIDEO } from '../components/video-player.demos';

// 主站页的属性面板：任务、长度、类型、状态都在面板里切。参数表在 main-site.mdx

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
    <GenPrompt length={s.length === 'long' ? 'long' : undefined} prompt={s.length === 'long' ? LONG : SHORT}>
      <Tag icon="VideoGeneration">视频生成</Tag>
      <Tag icon="Bytedance">Seedance 2.0 Fast</Tag>
      {s.refs && <GenPromptRefs label={s.refText} items={s.overflow ? REFS : REFS.slice(0, 4)} />}
      <Tag>2K</Tag>
      <Tag>智能比例</Tag>
      <Tag>8s</Tag>
    </GenPrompt>
  );
}

export function GenPromptPlayground() {
  return (
    // 这个属性面板里浮层往下开，台子留够高度（样式在 main-site.mdx 顶上）
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

function renderResultTile(s: ResultTileState) {
  const video = s.type === 'video';
  const type = video ? 'video' : undefined;
  if (s.state === 'loading') {
    // 有原素材：重新生成，原来的图或视频垫在遮罩下面
    const src = s.source ? (video ? VIDEO.wide : `${IMG}${PIC[s.type].done}-1x1.webp`) : undefined;
    return <ResultTile type={type} status="loading" src={src} badge="59s 生成中" />;
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
        { key: 'state', label: '状态', type: 'segment', value: 'done', options: [['loading', '生成中'], ['done', '完成'], ['hover', '悬停'], ['failed', '失败']] },
        { key: 'source', label: '有原素材（重新生成）', type: 'toggle', value: false },
        { key: 'collected', label: '已收藏', type: 'toggle', value: false },
      ]}
      rules={(s) => ({ source: s.state !== 'loading', collected: s.state === 'loading' || s.state === 'failed' })}
      render={renderResultTile}
    />
  );
}
