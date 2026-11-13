import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactElement, type ReactNode } from 'react';
import {
  AttachmentStrip,
  AudioWave,
  Button,
  ButtonGroup,
  CanvasHeader,
  Connector,
  CropHandles,
  Divider,
  GenerateButton,
  IconButton,
  Toaster,
  MentionChip,
  Minimap,
  NodeCard,
  NodeMedia,
  NodePanel,
  NodePanelBar,
  NodeStack,
  NodeStackToggle,
  NodeWrapper,
  PromptInput,
  ReferenceFramePair,
  AudioCharCount,
  AudioModelControls,
  CountSelect,
  ImageModelControls,
  ModelSelect,
  RefModeSelect,
  VideoModelControls,
  type AttachmentItem,
  type ConnectorDotStatus,
  type ConnectorStatus,
  type IconButtonProps,
  type MinimapRect,
  type NodeCardStatus,
  type NodeMediaType,
  type NodeWrapperRatio,
  ScrollArea,
} from '@kivi';
import { CodeBlock, Playground, toJsx } from '@shell';
import { openPreview, VIDEO } from '../components/media.demos';
import './canvas.demos.css';

// 画布页的演示：上面的小画布看整体（点、悬停、生成都是真的，生成是假的演示），下面每个拆解一个属性面板。参数表在 canvas.mdx

const IMG = './placeholders/';
// 演示音频：assets 里没有纯音频，用 mp4 的音轨（audio 元素能播 mp4）
const AUDIO = './placeholders/video/kivi-demo-9x16.mp4';

/** 只有图标的按钮：IconButton 自带提示，文字用 label */
function TipButton(props: IconButtonProps) {
  return (
    <IconButton {...props} />
  );
}
const LONG_TEXT =
  '生成一首约 1 分钟的中速流行颂歌（约 105 BPM），带有强劲节拍和 80 年代合成器音色。歌手声线应为清晰而高亢。歌曲在主歌阶段应立即开始旋律铺垫，专注且具感染力，在副歌处达到高潮，并以混响渐出。';

// ---------- 节点和连线 ----------

type Key = 'text' | 'upload' | 'image' | 'audio' | 'video';
/** 生成节点用 NodeCard 的 5 个状态；素材节点只有上传中、完成 */
type Phase = NodeCardStatus | 'uploading';

interface NodeDef {
  key: Key;
  name: string;
  type: NodeMediaType;
  ratio: NodeWrapperRatio;
  x: number;
  y: number;
  /** 上传的素材节点 */
  upload?: boolean;
  /** 完成后的画面；视频节点拿它当封面 */
  src?: string;
  /** 视频节点的视频文件 */
  video?: string;
}

const NODES: NodeDef[] = [
  { key: 'text', name: '文字节点', type: 'text', ratio: '1:1', x: 0, y: 0 },
  { key: 'upload', name: '素材 · 图片', type: 'image', ratio: '1:1', x: 0, y: 340, upload: true, src: `${IMG}ip-gouache-1x1.webp` },
  { key: 'image', name: '图片节点', type: 'image', ratio: '1:1', x: 336, y: 0, src: `${IMG}kiwi-light-1x1.webp` },
  { key: 'audio', name: '音频节点', type: 'audio', ratio: '4:3', x: 336, y: 340 },
  { key: 'video', name: '视频节点', type: 'video', ratio: '16:9', x: 780, y: 170, src: `${IMG}kivi-future-16x9.webp`, video: VIDEO.wide },
];

const SIZE: Record<NodeWrapperRatio, [number, number]> = {
  '1:1': [256, 256],
  '3:4': [256, 341],
  '16:9': [455, 256],
  '4:3': [341, 256],
  '9:16': [256, 455],
};

type Edge = [Key, Key];
const EDGES: Edge[] = [
  ['text', 'image'],
  ['upload', 'image'],
  ['image', 'video'],
  ['audio', 'video'],
];

interface Run {
  phase: Phase;
  /** 生成中：底图（重新生成时放旧图） */
  cover: boolean;
  /** 生成中：倒计时 */
  countdown: boolean;
  /** 假生成还剩几秒，算不出时不写 */
  left?: number;
  /** 失败文案 */
  message: string;
}

const RUN: Run = { phase: 'done', cover: false, countdown: true, message: '生成失败，消耗猕猴桃已退回' };
const START: Record<Key, Run> = {
  text: RUN,
  upload: RUN,
  image: RUN,
  audio: RUN,
  video: { ...RUN, phase: 'pending' },
};

const PHASES: Record<'gen' | 'upload', [Phase, string][]> = {
  gen: [
    ['guide', '引导'],
    ['pending', '待生成'],
    ['generating', '生成中'],
    ['done', '完成'],
    ['failed', '失败'],
  ],
  upload: [
    ['uploading', '上传中'],
    ['done', '完成'],
  ],
};

/** 假生成几秒，假上传几秒 */
const FAKE_GENERATE = 6;
const FAKE_UPLOAD = 2;

const nodeOf = (key: Key) => NODES.find((n) => n.key === key)!;

function mediaOf(def: NodeDef) {
  switch (def.type) {
    case 'text':
      return <NodeMedia type="text">{LONG_TEXT}</NodeMedia>;
    case 'audio':
      return <NodeMedia type="audio" src={AUDIO} />;
    case 'video':
      return <NodeMedia type="video" src={def.video} onPreview={(t) => openPreview(def.video!, t)} />;
    default:
      return <NodeMedia type="image" src={def.src} />;
  }
}

/** 一个节点的 NodeCard：素材节点是完成 + 右上全屏、下载、「上传」，上传中左上转圈；生成节点按状态来 */
function cardOf(def: NodeDef, run: Run, onUpload?: () => void): ReactElement {
  if (def.upload) {
    const uploading = run.phase === 'uploading';
    return (
      <NodeCard
        status="done"
        type={def.type}
        uploading={uploading || undefined}
        iconButton={
          <>
            <TipButton icon="FullScreen" label="全屏" />
            <TipButton icon="Download" label="下载" />
          </>
        }
        textButton={
          <Button leftIcon="Upload" disabled={uploading} onClick={onUpload}>
            上传
          </Button>
        }
      >
        {mediaOf(def)}
      </NodeCard>
    );
  }
  switch (run.phase) {
    case 'guide':
      return <NodeCard status="guide" type={def.type} />;
    case 'pending':
      return <NodeCard status="pending" type={def.type} />;
    case 'generating':
      return (
        <NodeCard
          status="generating"
          type={def.type}
          cover={run.cover && def.src ? def.src : undefined}
          countdown={run.countdown ? (run.left === undefined ? '59s 生成中' : `${run.left}s 生成中`) : undefined}
        />
      );
    case 'failed':
      return <NodeCard status="failed" type={def.type} failedTitle={run.message} />;
    default: {
      // 图片、视频悬停时右上出按钮条：收藏、全屏、下载
      const media = def.type === 'image' || def.type === 'video';
      return (
        <NodeCard
          status="done"
          type={def.type}
          hoverActions={media || undefined}
          collect={media || undefined}
          iconButton={
            media ? (
              <>
                <TipButton icon="FullScreen" label="全屏" />
                <TipButton icon="Download" label="下载" />
              </>
            ) : undefined
          }
        >
          {mediaOf(def)}
        </NodeCard>
      );
    }
  }
}

/** 连线：从起点右边的连接点水平出去，到终点左边的连接点水平进来。连接点在节点外 8，直径 16 */
function edgeBox(from: NodeDef, to: NodeDef) {
  const [fw, fh] = SIZE[from.ratio];
  const [, th] = SIZE[to.ratio];
  const x1 = from.x + fw + 16;
  const y1 = from.y + fh / 2;
  const x2 = to.x - 16;
  const y2 = to.y + th / 2;
  if (y1 === y2) return { left: x1, top: y1 - 1, width: x2 - x1, height: 2, direction: 'flat' as const };
  return { left: x1, top: Math.min(y1, y2), width: x2 - x1, height: Math.abs(y2 - y1), direction: y2 < y1 ? ('up' as const) : ('down' as const) };
}

// ---------- 选中后：节点工具栏、生成面板 ----------

/** 节点工具栏：「模板 · 画布」页 4 条里按节点类型取。音频没有画 */
function toolbarOf(type: NodeMediaType | 'group') {
  switch (type) {
    case 'group':
      return (
        <ButtonGroup variant="glass" size={44} aria-label="节点工具栏">
          <Button variant="ghost" leftIcon="PlayLine">整组执行</Button>
          <Button variant="ghost" leftIcon="Template">创建工作流</Button>
          <Button variant="ghost" leftIcon="UnGroup">解组</Button>
        </ButtonGroup>
      );
    case 'text':
      return (
        <ButtonGroup variant="glass" size={44} aria-label="节点工具栏">
          <TipButton icon="H1" label="一级标题" />
          <TipButton icon="H2" label="二级标题" />
          <TipButton icon="H3" label="三级标题" />
          <TipButton icon="FontSize" label="正文" />
          <Divider orientation="vertical" />
          <TipButton icon="TextBold" label="加粗" />
          <TipButton icon="TextItalic" label="斜体" />
          <TipButton icon="UnOrderedList" label="无序列表" />
          <TipButton icon="OrderedList" label="有序列表" />
          <TipButton icon="DividingLine" label="分隔线" />
          <Divider orientation="vertical" />
          <TipButton icon="Copy" label="复制" />
          <TipButton icon="FullScreen" label="全屏" />
        </ButtonGroup>
      );
    case 'image':
      return (
        <ButtonGroup variant="glass" size={44} aria-label="节点工具栏">
          <Button variant="ghost" leftIcon="Rmbg">抠图</Button>
          <Button variant="ghost" leftIcon="Crop">裁剪</Button>
          <Button variant="ghost" leftIcon="Expand">扩图</Button>
          <Button variant="ghost" leftIcon="HD">高清</Button>
          <Button variant="ghost" leftIcon="SmartEditing">重绘</Button>
          <Button variant="ghost" leftIcon="RemoveEle">元素去除</Button>
          <Button variant="ghost" leftIcon="DragSelect">框选</Button>
          <Button variant="ghost" leftIcon="TextEditing">编辑文字</Button>
          <Divider orientation="vertical" />
          <TipButton icon="ImageToText" label="图推词" />
          <TipButton icon="Download" label="下载" />
          <TipButton icon="FullScreen" label="全屏" />
        </ButtonGroup>
      );
    case 'video':
      return (
        <ButtonGroup variant="glass" size={44} aria-label="节点工具栏">
          <Button variant="ghost" leftIcon="VideoLoop">循环</Button>
          <Button variant="ghost" leftIcon="HD">高清</Button>
          <Button variant="ghost" leftIcon="Connecting">拼接</Button>
          <Button variant="ghost" leftIcon="Rmbg">抠图</Button>
          <Button variant="ghost" leftIcon="Pack">封装</Button>
          <Button variant="ghost" leftIcon="Cutting">剪辑</Button>
          <Divider orientation="vertical" />
          <TipButton icon="ImageToText" label="视频推词" />
          <TipButton icon="Download" label="下载" />
          <TipButton icon="FullScreen" label="全屏" />
        </ButtonGroup>
      );
    default:
      return null;
  }
}

/** 生成面板：「模板 · 画布」页「生成面板」里按节点类型取。参考图是连进来的上游节点。音频面板 Figma 没画，先放参考图、提示词、模型、生成 */
function panelOf(def: NodeDef, inputs: NodeDef[], onGenerate: () => void, busy: boolean) {
  const refs = inputs.filter((n) => n.type === 'image' || n.type === 'video' || n.type === 'audio');
  const generate = <GenerateButton cost={def.type === 'video' ? 20 : 1} onClick={onGenerate} disabled={busy} />;
  // 参考图是连进来的上游节点：右上角写序号，悬停出预览；不能删（连线才是来源），所以不传 onRemove
  const refItems: AttachmentItem[] = refs.map((n, i) => ({
    id: n.key,
    type: n.type as AttachmentItem['type'],
    name: n.name,
    src: n.src,
    badge: String(i + 1),
  }));
  const refRow = refItems.length > 0 && <AttachmentStrip items={refItems} aria-label="参考图" />;

  // 下拉、参数面板都用 generation.tsx 里共用的那一份，和主站输入框一样
  // 右边：文字只有生成按钮；音频是字数 / 上限（没有张数，照线上）；图片、视频是张数
  const bar = (left: ReactElement) => (
    <NodePanelBar left={left} right={<>{def.type === 'audio' ? <AudioCharCount /> : def.type !== 'text' && <CountSelect />}{generate}</>} />
  );
  switch (def.type) {
    case 'text':
      return (
        <NodePanel expand>
          <PromptInput placeholder="描述任何你想要生成的内容" />
          {bar(<ModelSelect type="text" />)}
        </NodePanel>
      );
    case 'video':
      return <VideoPanel refRow={refRow} bar={bar} />;
    case 'audio':
      return (
        <NodePanel expand>
          {refRow}
          <PromptInput placeholder="描述任何你想要生成的内容" />
          {bar(<AudioModelControls />)}
        </NodePanel>
      );
    default:
      return (
        <NodePanel expand>
          {refRow}
          <PromptInput placeholder="描述任何你想要生成的内容" />
          {bar(<ImageModelControls />)}
        </NodePanel>
      );
  }
}

/** 视频生成面板：参考方式在底栏模型后面，和主站输入框是同一个下拉；切到「首尾帧」时参考区换成首尾帧（两格 + 中间互换） */
function VideoPanel({ refRow, bar }: { refRow: ReactElement | false; bar: (left: ReactElement) => ReactElement }) {
  const [mode, setMode] = useState('omni');
  return (
    <NodePanel expand>
      {mode === 'frames' ? (
        <ReferenceFramePair first={{ src: `${IMG}kivi-future-1x1.webp` }} last={{ src: `${IMG}kiwi-light-1x1.webp` }} />
      ) : (
        refRow
      )}
      <PromptInput placeholder="描述任何你想要生成的内容" />
      {bar(<VideoModelControls refMode={<RefModeSelect value={mode} onChange={setMode} />} />)}
    </NodePanel>
  );
}

/** 照线上：工具栏底边离节点 40（节点名在 28 处，空出 12），面板离节点底 12，都和节点水平居中 */
const TOOLBAR_GAP = 40;
const PANEL_GAP = 12;

// ---------- 小画布 ----------

/** 画布里所有东西的范围（含连接点、节点名），开场按它缩放到放得下 */
const BOUNDS = { left: -24, top: -40, right: 780 + 455 + 24, bottom: 340 + 256 + 24 };

/** 画布里的节点：页面模板的 Agent 侧栏点缩略图时用它定位 */
export type CanvasNodeKey = Key;
export type CanvasNodePhase = Phase;

export interface MiniCanvasHandle {
  /** 选中这个节点，画布平移到让它在中间（缩放不变） */
  focus: (key: Key) => void;
}

export interface MiniCanvasProps {
  /** 下面的状态条和代码，默认有；页面模板里不要 */
  chrome?: boolean;
  /** 假生成、假上传，默认有；页面模板里只能看，点了不动 */
  fake?: boolean;
  /** 左下角的视图工具栏（整理画布、小地图、适配画布、吸附、连线、缩放），照线上；默认没有，页面模板里开 */
  viewBar?: boolean;
  /** 一开始各节点的状态，不写的照默认（视频节点待生成，其余完成） */
  phases?: Partial<Record<Key, Phase>>;
  className?: string;
  style?: CSSProperties;
}

/** 业务组件页的小画布：能点、能拖、能假生成。页面模板也用它（chrome、fake 关掉） */
export function CanvasPlayground() {
  return <MiniCanvas />;
}

export const MiniCanvas = forwardRef<MiniCanvasHandle, MiniCanvasProps>(function MiniCanvas({ chrome = true, fake = true, viewBar = false, phases, className, style }, ref) {
  const [runs, setRuns] = useState<Record<Key, Run>>(() => {
    const r = { ...START };
    for (const [k, phase] of Object.entries(phases ?? {}) as [Key, Phase][]) r[k] = { ...r[k], phase };
    return r;
  });
  const [edges, setEdges] = useState<Edge[]>(EDGES);
  const [selected, setSelectedRaw] = useState<Key | null>(null);
  /** 文字节点双击进入编辑：出文字工具栏，收起生成面板 */
  const [editing, setEditing] = useState(false);
  const setSelected = (key: Key | null) => {
    if (key !== selected) setEditing(false);
    setSelectedRaw(key);
  };
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [gliding, setGliding] = useState(false);
  const [panning, setPanning] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const timers = useRef<Partial<Record<Key, number>>>({});
  const drag = useRef<{ id: number; x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);

  // 开场：缩放到整张图放得下，最大 1；画布尺寸变了（比如模板切全屏）重新放一次。工具栏「适配画布」也是它
  const fit = () => {
    const el = viewport.current;
    if (!el) return;
    const w = BOUNDS.right - BOUNDS.left;
    const h = BOUNDS.bottom - BOUNDS.top;
    const k = Math.min(1, (el.clientWidth - 96) / w, (el.clientHeight - 160) / h);
    setView({ k, x: (el.clientWidth - w * k) / 2 - BOUNDS.left * k, y: 72 - BOUNDS.top * k });
  };
  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    fit();
    let size = `${el.clientWidth}x${el.clientHeight}`;
    const ro = new ResizeObserver(() => {
      const next = `${el.clientWidth}x${el.clientHeight}`;
      if (next === size) return;
      size = next;
      fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 视图工具栏：小地图开关、吸附开关、连线显示隐藏、以画布中心缩放（30%–200%，每次 ×1.25）
  const [minimap, setMinimap] = useState(false);
  const [snap, setSnap] = useState(true);
  const [hideLines, setHideLines] = useState(false);
  const zoomTo = (next: (k: number) => number) => {
    const el = viewport.current;
    if (!el) return;
    const px = el.clientWidth / 2;
    const py = el.clientHeight / 2;
    setGliding(true);
    setView((v) => {
      const k = Math.min(2, Math.max(0.3, next(v.k)));
      return { k, x: px - ((px - v.x) * k) / v.k, y: py - ((py - v.y) * k) / v.k };
    });
    window.setTimeout(() => setGliding(false), 220);
  };

  // 按住 ⌘ / Ctrl 滚轮（触控板捏合）缩放，以鼠标为中心；不按就让页面正常滚动
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      setView((v) => {
        const k = Math.min(2, Math.max(0.3, v.k * Math.exp(-e.deltaY * 0.01)));
        return { k, x: px - ((px - v.x) * k) / v.k, y: py - ((py - v.y) * k) / v.k };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => () => Object.values(timers.current).forEach((t) => window.clearInterval(t)), []);

  // 定位到节点：选中它，画布平移到让它在中间，300ms ease-in-out（距离长）
  useImperativeHandle(ref, () => ({
    focus: (key: Key) => {
      const el = viewport.current;
      if (!el) return;
      const def = nodeOf(key);
      const [w, h] = SIZE[def.ratio];
      setSelected(key);
      setGliding(true);
      setView((v) => ({ ...v, x: el.clientWidth / 2 - (def.x + w / 2) * v.k, y: el.clientHeight / 2 - (def.y + h / 2) * v.k }));
      window.setTimeout(() => setGliding(false), 320);
    },
  }));

  const patch = (key: Key, p: Partial<Run>) => setRuns((r) => ({ ...r, [key]: { ...r[key], ...p } }));
  const stop = (key: Key) => {
    window.clearInterval(timers.current[key]);
    delete timers.current[key];
  };

  // 假生成：进生成中，倒计时走完变完成。原来有结果的，旧图当底图
  const generate = (key: Key) => {
    if (!fake) return;
    stop(key);
    patch(key, { phase: 'generating', cover: runs[key].phase === 'done', countdown: true, left: FAKE_GENERATE });
    timers.current[key] = window.setInterval(() => {
      setRuns((r) => {
        const left = (r[key].left ?? 1) - 1;
        if (left > 0) return { ...r, [key]: { ...r[key], left } };
        stop(key);
        return { ...r, [key]: { ...r[key], phase: 'done', left: undefined } };
      });
    }, 1000);
  };

  // 假上传：点上传后转两秒圈
  const upload = (key: Key) => {
    if (!fake) return;
    stop(key);
    patch(key, { phase: 'uploading' });
    timers.current[key] = window.setTimeout(() => {
      delete timers.current[key];
      patch(key, { phase: 'done' });
    }, FAKE_UPLOAD * 1000);
  };

  // 拖空白处移动画布；没拖动就是点空白，取消选中
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.cv-node, .cv-float, .cv-view, button')) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
    if (e.currentTarget.hasPointerCapture?.(e.pointerId) === false) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // 脚本模拟的点击没有真的指针，抓不住也没关系
      }
    }
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 3) return;
    if (!d.moved) setPanning(true);
    d.moved = true;
    setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) setSelected(null);
    drag.current = null;
    setPanning(false);
  };

  const sel = selected ? nodeOf(selected) : null;
  const selRun = selected ? runs[selected] : null;
  const busy = (key: Key) => runs[key].phase === 'generating' || runs[key].phase === 'uploading';

  const wrapperOf = (def: NodeDef, style?: CSSProperties) => (
    <NodeWrapper
      ratio={def.ratio}
      name={def.name}
      leftDot={edges.some(([, b]) => b === def.key) ? 'connected' : 'default'}
      rightDot={edges.some(([a]) => a === def.key) ? 'connected' : 'default'}
      selected={selected === def.key || undefined}
      style={style}
    >
      {cardOf(def, runs[def.key], () => upload(def.key))}
    </NodeWrapper>
  );

  const edgeState = ([a, b]: Edge): ConnectorStatus => {
    if (runs[b].phase === 'generating') return 'flowing';
    if (selected === a || selected === b) return 'active';
    return 'default';
  };

  // 选中节点（照线上）：
  // 工具栏只在有结果、不在生成或上传时出；文字节点要双击编辑才出；音频没有。
  // 生成面板只给生成节点，空的、生成中也出（生成中按钮不能点）；素材没有；文字编辑时收起。
  // 两个都和节点水平居中，大小不跟画布缩放（缩到 50% 以下才跟着小）
  let toolbar: ReactElement | null = null;
  let panel: ReactElement | null = null;
  if (sel && selRun) {
    const [w, h] = SIZE[sel.ratio];
    const center = sel.x + w / 2;
    const fixed = { '--cv-unzoom': 1 / Math.max(view.k, 0.5) } as CSSProperties;
    const showToolbar = selRun.phase === 'done' && (sel.type !== 'text' || editing);
    const tb = showToolbar ? toolbarOf(sel.type) : null;
    if (tb) {
      toolbar = (
        <div className="cv-float cv-float--toolbar" style={{ ...fixed, left: center, top: sel.y - TOOLBAR_GAP }} key={`t-${sel.key}`}>
          {tb}
        </div>
      );
    }
    if (!sel.upload && !(sel.type === 'text' && editing)) {
      const inputs = edges.filter(([, b]) => b === sel.key).map(([a]) => nodeOf(a));
      panel = (
        <div className="cv-float cv-float--panel" style={{ ...fixed, left: center, top: sel.y + h + PANEL_GAP }} key={`p-${sel.key}`}>
          {panelOf(sel, inputs, () => generate(sel.key), busy(sel.key))}
        </div>
      );
    }
  }

  // 左下角视图工具栏（照线上 bottom-toolbar）：整理画布、小地图、适配画布、吸附、连线，缩小 / 比例 / 放大；小地图开着就叠在上面。
  // 只有小地图有选中样子；吸附、连线照线上只换图标和提示
  const viewBarOf = () => {
    const el = viewport.current;
    const area: MinimapRect = el
      ? { x: -view.x / view.k, y: -view.y / view.k, width: el.clientWidth / view.k, height: el.clientHeight / view.k }
      : { x: 0, y: 0, width: 1, height: 1 };
    return (
      <div className="cv-view">
        {minimap && (
          <Minimap
            nodes={NODES.map((n) => ({ x: n.x, y: n.y, width: SIZE[n.ratio][0], height: SIZE[n.ratio][1] }))}
            viewport={area}
            onViewportChange={(c) => setView((v) => ({ ...v, x: area.width / 2 * v.k - c.x * v.k, y: area.height / 2 * v.k - c.y * v.k }))}
          />
        )}
        <ButtonGroup variant="glass" aria-label="视图">
          <IconButton icon="AutoLayout" label="整理画布" />
          <IconButton icon="Map" label="小地图" selected={minimap} onClick={() => setMinimap(!minimap)} />
          <IconButton icon="FitContent" label="适配画布" onClick={fit} />
          <IconButton icon={snap ? 'Snap' : 'DisableSnap'} label={snap ? '关闭网格吸附' : '开启网格吸附'} onClick={() => setSnap(!snap)} />
          <IconButton icon={hideLines ? 'HideConnections' : 'ShowConnections'} label={hideLines ? '显示节点连线' : '隐藏节点连线'} onClick={() => setHideLines(!hideLines)} />
          <IconButton icon="SubtractSmall" label="缩小" disabled={view.k <= 0.3} onClick={() => zoomTo((k) => k / 1.25)} />
          <Button style={{ minWidth: 48 }} onClick={() => zoomTo(() => 1)}>
            {Math.floor(view.k * 100)}%
          </Button>
          <IconButton icon="AddSmall" label="放大" disabled={view.k >= 2} onClick={() => zoomTo((k) => k * 1.25)} />
        </ButtonGroup>
      </div>
    );
  };

  const canvas = (
      <div
        ref={viewport}
        className={[panning ? 'cv-canvas is-panning' : 'cv-canvas', className].filter(Boolean).join(' ')}
        style={style}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="cv-world"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transition: gliding ? 'transform var(--motion-duration-300) var(--motion-ease-in-out)' : undefined,
          }}
        >
          {edges.map((edge) => {
            // 隐藏连线时，选中节点上下游的连线还显示（照线上）
            if (hideLines && selected !== edge[0] && selected !== edge[1]) return null;
            const box = edgeBox(nodeOf(edge[0]), nodeOf(edge[1]));
            return (
              <Connector
                key={edge.join('-')}
                status={edgeState(edge)}
                width={box.width}
                height={box.height}
                direction={box.direction}
                remove="hover"
                onRemove={() => setEdges((es) => es.filter((x) => x !== edge))}
                style={{ left: box.left, top: box.top }}
              />
            );
          })}
          {NODES.map((def) => (
            <div
              key={def.key}
              className="cv-node"
              style={{ left: def.x, top: def.y }}
              onPointerDown={() => setSelected(def.key)}
              onDoubleClick={() => def.type === 'text' && runs[def.key].phase === 'done' && setEditing(true)}
            >
              {wrapperOf(def)}
            </div>
          ))}
          {toolbar}
          {panel}
        </div>
        {viewBar && viewBarOf()}
      </div>
  );

  if (!chrome) return canvas;

  return (
    <div className="shell-pg cv-pg">
      {canvas}

      {/* 选中节点的状态：只放这个状态才有的开关 */}
      <div className="cv-bar">
        {sel && selRun ? (
          <>
            <span className="cv-bar-name">{sel.name}</span>
            <div className="shell-seg">
              {PHASES[sel.upload ? 'upload' : 'gen'].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={selRun.phase === v}
                  onClick={() => {
                    stop(sel.key);
                    patch(sel.key, { phase: v, left: undefined });
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {selRun.phase === 'generating' && sel.src && (
              <label className="cv-bar-item">
                有原素材
                <button
                  type="button"
                  role="switch"
                  className="shell-switch"
                  aria-checked={selRun.cover}
                  onClick={() => patch(sel.key, { cover: !selRun.cover })}
                />
              </label>
            )}
            {selRun.phase === 'generating' && (
              <label className="cv-bar-item">
                倒计时
                <button
                  type="button"
                  role="switch"
                  className="shell-switch"
                  aria-checked={selRun.countdown}
                  onClick={() => patch(sel.key, { countdown: !selRun.countdown })}
                />
              </label>
            )}
            {selRun.phase === 'failed' && (
              <label className="cv-bar-item">
                失败文案
                <input className="shell-input" value={selRun.message} onChange={(e) => patch(sel.key, { message: e.target.value })} />
              </label>
            )}
          </>
        ) : (
          <span className="cv-bar-name is-empty">点一个节点</span>
        )}
        <span className="cv-bar-tip">
          双击文字节点编辑 · 面板里点生成，假生成 {FAKE_GENERATE} 秒 · 素材点「上传」，假上传 {FAKE_UPLOAD} 秒 · 拖空白处移动，⌘ / Ctrl + 滚轮缩放
        </span>
      </div>

      <CodeBlock code={sel ? toJsx(wrapperOf(sel)) : '// 点一个节点，这里显示它的代码'} bare />
    </div>
  );
});

// ---------- 拆解：节点 ----------

/** 属性面板里摆的节点：生成节点 4 个、素材节点 3 个。视频在这里用 1:1，好两行两列摆下 */
const GEN_NODES: NodeDef[] = [
  { key: 'text', name: '文字节点', type: 'text', ratio: '1:1', x: 0, y: 0 },
  { key: 'image', name: '图片节点', type: 'image', ratio: '1:1', x: 0, y: 0, src: `${IMG}kiwi-light-1x1.webp` },
  { key: 'video', name: '视频节点', type: 'video', ratio: '1:1', x: 0, y: 0, src: `${IMG}kivi-future-1x1.webp`, video: VIDEO.wide },
  { key: 'audio', name: '音频节点', type: 'audio', ratio: '4:3', x: 0, y: 0 },
];
const UPLOAD_NODES: NodeDef[] = [
  { key: 'upload', name: '素材 · 图片', type: 'image', ratio: '1:1', x: 0, y: 0, upload: true, src: `${IMG}ip-gouache-1x1.webp` },
  { key: 'upload', name: '素材 · 视频', type: 'video', ratio: '1:1', x: 0, y: 0, upload: true, src: `${IMG}kivi-future-1x1.webp`, video: VIDEO.wide },
  { key: 'upload', name: '素材 · 音频', type: 'audio', ratio: '4:3', x: 0, y: 0, upload: true },
];

/** 属性面板台子：窄了左右滚（ScrollArea），inner 是原来台子上的布局 */
function PgScroll({ inner, children }: { inner: string; children: ReactNode }) {
  return (
    <ScrollArea orientation="horizontal" className="cv-pg-scroll">
      <div className={inner}>{children}</div>
    </ScrollArea>
  );
}

type NodePg = { kind: string; state: string; upState: string; cover: boolean; countdown: boolean; message: string };

export function NodePlayground() {
  return (
    <Playground<NodePg>
      stageClassName="cv-pg-canvas cv-pg-nodes"
      controls={[
        { key: 'kind', label: '节点', type: 'segment', value: 'gen', options: [['gen', '生成节点'], ['upload', '素材节点']] },
        { key: 'state', label: '状态', type: 'segment', value: 'done', options: PHASES.gen },
        { key: 'upState', label: '状态', type: 'segment', value: 'done', options: PHASES.upload },
        { key: 'cover', label: '有原素材（重新生成）', type: 'toggle', value: false },
        { key: 'countdown', label: '倒计时', type: 'toggle', value: true },
        { key: 'message', label: '失败文案', type: 'text', value: RUN.message },
      ]}
      rules={(s) => {
        const gen = s.kind === 'gen';
        return {
          state: !gen,
          upState: gen,
          cover: !(gen && s.state === 'generating'),
          countdown: !(gen && s.state === 'generating'),
          message: !(gen && s.state === 'failed'),
        };
      }}
      render={(s) => {
        const upload = s.kind === 'upload';
        const run: Run = { ...RUN, phase: (upload ? s.upState : s.state) as Phase, cover: s.cover, countdown: s.countdown, message: s.message };
        return (
          <PgScroll inner="cv-pg-nodes__inner">
            {(upload ? UPLOAD_NODES : GEN_NODES).map((def) => (
              <NodeWrapper key={def.name} ratio={def.ratio} name={def.name}>
                {cardOf(def, run)}
              </NodeWrapper>
            ))}
          </PgScroll>
        );
      }}
    />
  );
}

// ---------- 拆解：节点外框 ----------

type WrapperPg = { ratio: string; name: boolean; selected: boolean; left: string; right: string };

const DOT_OPTIONS: [string, string][] = [
  ['none', '无'],
  ['default', '默认'],
  ['connected', '已连接'],
  ['highlight', '高亮'],
];

/** 节点外框：比例、节点名、选中描边、左右连接点（连接点的三种状态也在这里切）。点一下节点切换选中 */
export function NodeWrapperPlayground() {
  return (
    <Playground<WrapperPg>
      stageClassName="cv-pg-canvas cv-pg-wrapper"
      controls={[
        {
          key: 'ratio',
          label: '比例',
          type: 'segment',
          value: '1:1',
          options: [
            ['1:1', '1:1'],
            ['3:4', '3:4'],
            ['16:9', '16:9'],
            ['4:3', '4:3'],
            ['9:16', '9:16'],
          ],
        },
        { key: 'name', label: '显示节点名', type: 'toggle', value: true },
        { key: 'selected', label: '选中', type: 'toggle', value: false },
        { key: 'left', label: '左连接点', type: 'segment', value: 'default', options: DOT_OPTIONS },
        { key: 'right', label: '右连接点', type: 'segment', value: 'connected', options: DOT_OPTIONS },
      ]}
      render={(s, update) => (
        <PgScroll inner="cv-pg-wrapper__inner">
        <NodeWrapper
          ratio={s.ratio as NodeWrapperRatio}
          name={s.name ? '图片节点' : undefined}
          selected={s.selected}
          leftDot={s.left === 'none' ? undefined : (s.left as ConnectorDotStatus)}
          rightDot={s.right === 'none' ? undefined : (s.right as ConnectorDotStatus)}
          onClick={() => update({ selected: !s.selected })}
        >
          {cardOf(nodeOf('image'), RUN)}
        </NodeWrapper>
        </PgScroll>
      )}
    />
  );
}

// ---------- 拆解：多图节点 ----------

const STACK_IMAGES = ['kiwi-light', 'ip-future', 'monstera-dots', 'bunny-gouache'].map((n) => `${IMG}${n}-1x1.webp`);

type StackPg = { count: string };

/**
 * 多图节点：一个节点生成了几张图。张数在面板里切；点主图右上的「张数」展开，
 * 点候选图（或它右上的「设为主图」）换成主图并收起；收藏了的不悬停也留一个星
 */
export function NodeStackPlayground() {
  const [count, setCount] = useState('4');
  const [order, setOrder] = useState(STACK_IMAGES);
  const [expanded, setExpanded] = useState(false);
  const [collected, setCollected] = useState<string[]>([]);
  const n = Number(count);

  const setMain = (src: string) => {
    setOrder((o) => [src, ...o.filter((x) => x !== src)]);
    setExpanded(false);
  };
  const view = (
    <>
      <TipButton icon="FullScreen" label="全屏" />
      <TipButton icon="Download" label="下载" />
    </>
  );

  const tree = (
    <NodeWrapper ratio="1:1" name="图片节点">
      <NodeStack expanded={expanded}>
        {order.slice(0, n).map((src, i) => (
          <NodeCard
            key={src}
            status="done"
            type="image"
            hoverActions
            collect
            collected={collected.includes(src)}
            onCollectedChange={(on) => setCollected((c) => (on ? [...c, src] : c.filter((x) => x !== src)))}
            iconButton={view}
            textButton={
              i === 0 ? (
                <NodeStackToggle count={n} expanded={expanded} onClick={() => setExpanded((e) => !e)} />
              ) : (
                <Button onClick={() => setMain(src)}>设为主图</Button>
              )
            }
            onClick={i === 0 ? undefined : (e) => !(e.target as HTMLElement).closest('button') && setMain(src)}
          >
            <NodeMedia type="image" src={src} />
          </NodeCard>
        ))}
      </NodeStack>
    </NodeWrapper>
  );

  return (
    <div className="shell-pg cv-pg">
      <div className="shell-pg-stage cv-pg-canvas cv-stack-stage">{tree}</div>
      <div className="shell-pg-panel">
        <div className="shell-pg-row">
          <div className="shell-pg-label">张数</div>
          <div className="shell-seg">
            {['2', '3', '4'].map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={count === v}
                onClick={() => {
                  setCount(v);
                  setExpanded(false);
                }}
              >
                {v} 张
              </button>
            ))}
          </div>
        </div>
      </div>
      <CodeBlock code={toJsx(tree)} bare collapse={6} />
    </div>
  );
}

// ---------- 拆解：节点工具栏 ----------

type ToolbarPg = { type: string };

export function ToolbarPlayground() {
  return (
    <Playground<ToolbarPg>
      stageClassName="cv-pg-canvas cv-pg-wide"
      controls={[
        {
          key: 'type',
          label: '节点',
          type: 'segment',
          value: 'image',
          options: [
            ['image', '图片'],
            ['video', '视频'],
            ['text', '文字'],
            ['group', '打组'],
          ],
        },
      ]}
      render={(s) => <PgScroll inner="cv-pg-wide__inner">{toolbarOf(s.type as NodeMediaType | 'group')!}</PgScroll>}
    />
  );
}

// ---------- 拆解：生成面板 ----------

type PanelPg = { type: string };

/** 每种面板摆的参考图：图片面板连了一张素材图，视频面板连了图片和音频 */
const PANEL_INPUTS: Record<NodeMediaType, Key[]> = {
  text: [],
  image: ['upload'],
  video: ['image', 'audio'],
  audio: ['upload'],
};

export function PanelPlayground() {
  return (
    <Playground<PanelPg>
      stageClassName="cv-pg-canvas cv-pg-wide"
      controls={[
        {
          key: 'type',
          label: '节点',
          type: 'segment',
          value: 'image',
          options: [
            ['image', '图片'],
            ['video', '视频'],
            ['text', '文字'],
            ['audio', '音频'],
          ],
        },
      ]}
      render={(s) => {
        const type = s.type as NodeMediaType;
        return <PgScroll inner="cv-pg-wide__inner">{panelOf(nodeOf(type), PANEL_INPUTS[type].map(nodeOf), () => {}, false)}</PgScroll>;
      }}
    />
  );
}

// ---------- 拆解：连线 ----------

type ConnectorPg = { state: string; remove: boolean };

export function ConnectorPlayground() {
  return (
    <Playground<ConnectorPg>
      stageClassName="cv-pg-canvas cv-pg-connector"
      controls={[
        {
          key: 'state',
          label: '状态',
          type: 'segment',
          value: 'default',
          options: [
            ['default', '默认'],
            ['active', '激活'],
            ['drawing', '拖拽中'],
            ['flowing', '执行中'],
          ],
        },
        { key: 'remove', label: '删除按钮（悬停出现）', type: 'toggle', value: true },
      ]}
      render={(s) => <Connector status={s.state as ConnectorStatus} remove={s.remove ? 'hover' : undefined} />}
    />
  );
}

// ---------- 画布左上角：CanvasHeader ----------

type HeaderPg = { count: string; agent: boolean };

/** 一开始的画布：画布 1 … 画布 n */
const canvasList = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `c${i + 1}`, name: `画布 ${i + 1}` }));

export function CanvasHeaderPlayground() {
  return (
    <Playground<HeaderPg>
      stageClassName="cv-pg-canvas cv-pg-header"
      controls={[
        { key: 'count', label: '一开始几个画布', type: 'segment', value: '2', options: [['1', '1 个'], ['2', '2 个'], ['12', '12 个（滚动）'], ['30', '30 个（上限）']] },
        { key: 'agent', label: 'Agent 工作中（切换先确认）', type: 'toggle', value: false },
      ]}
      render={(s) => (
        <>
          {/* 换了个数就重新来一套 */}
          <CanvasHeader
            key={s.count}
            workspace="未命名工作区"
            defaultCanvases={canvasList(Number(s.count))}
            defaultValue={`c${s.count === '1' ? 1 : 2}`}
            agentWorking={s.agent}
          />
          <Toaster />
        </>
      )}
    />
  );
}

// ---------- 拆解：音频波形 ----------

type WavePg = { progress: string; drag: boolean; disabled: boolean };

/** 音频波形：播放位置、能不能拖（传不传 onProgressChange）、禁用。拖动、点击、方向键改了位置会写回面板 */
export function AudioWavePlayground() {
  return (
    <Playground<WavePg>
      stageClassName="cv-pg-canvas"
      controls={[
        { key: 'progress', label: '播放位置（0–100）', type: 'text', value: '49' },
        { key: 'drag', label: '能拖动', type: 'toggle', value: true },
        { key: 'disabled', label: '禁用', type: 'toggle', value: false },
      ]}
      rules={(s) => (s.drag ? {} : { disabled: true })}
      render={(s, update) => {
        const progress = Math.min(100, Math.max(0, Number(s.progress) || 0));
        return (
          <div style={{ width: 284 }}>
            <AudioWave
              progress={progress}
              disabled={s.drag && s.disabled ? true : undefined}
              onProgressChange={s.drag ? (v) => update({ progress: String(Math.round(v)) }) : undefined}
            />
          </div>
        );
      }}
    />
  );
}

// ---------- 拆解：其他零件 ----------

/** 其他零件各摆一个，下面写名字 */
export function PartsDemo() {
  const parts: [string, ReactElement][] = [
    [
      'CropHandles',
      <div className="cv-part-crop">
        <img src={`${IMG}kiwi-light-1x1.webp`} alt="" />
        <CropHandles />
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

// ---------- 小地图和缩放条 ----------

/** 画布上的 6 个节点，画布坐标 */
const WORLD: MinimapRect[] = [
  { x: 0, y: 80, width: 360, height: 220 },
  { x: 520, y: 0, width: 400, height: 300 },
  { x: 520, y: 420, width: 400, height: 260 },
  { x: 1100, y: 140, width: 480, height: 270 },
  { x: 1280, y: 560, width: 320, height: 320 },
  { x: 100, y: 520, width: 280, height: 280 },
];
const STAGE = { width: 520, height: 320 };
const ZOOMS = [0.25, 0.5, 0.75, 1, 1.5, 2];

/** 缩放条（ButtonGroup 玻璃 + IconButton）加小地图：点缩放条改视口大小，点小地图、拖小地图改视口位置 */
export function ViewControlsDemo() {
  const [k, setK] = useState(0.5);
  const [center, setCenter] = useState({ x: 800, y: 440 });
  const [map, setMap] = useState(true);
  const viewport: MinimapRect = { x: center.x - STAGE.width / k / 2, y: center.y - STAGE.height / k / 2, width: STAGE.width / k, height: STAGE.height / k };
  const zoom = (dir: 1 | -1) => setK((v) => ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, ZOOMS.indexOf(v) + dir))]);
  const fit = () => {
    setCenter({ x: 800, y: 440 });
    setK(0.5);
  };
  return (
    <div style={{ position: 'relative', width: STAGE.width, height: STAGE.height, maxWidth: '100%', overflow: 'hidden', borderRadius: 16, background: 'var(--color-bg-fill-base)', border: '1px solid var(--color-border-subtle)' }}>
      {/* 画布：按视口平移、缩放 */}
      <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `scale(${k}) translate(${-viewport.x}px, ${-viewport.y}px)` }}>
        {WORLD.map((n, i) => (
          <span key={i} style={{ position: 'absolute', left: n.x, top: n.y, width: n.width, height: n.height, borderRadius: 16, background: 'var(--color-bg-fill-surface)', border: '1px solid var(--color-border-subtle)' }} />
        ))}
      </div>
      <div style={{ position: 'absolute', left: 16, bottom: 16, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
        {map && <Minimap nodes={WORLD} viewport={viewport} onViewportChange={setCenter} />}
        <ButtonGroup variant="glass" aria-label="视图">
          <IconButton icon="Map" label="小地图" selected={map} onClick={() => setMap(!map)} />
          <Divider orientation="vertical" />
          <IconButton icon="SubtractSmall" label="缩小" disabled={k === ZOOMS[0]} onClick={() => zoom(-1)} />
          <Button style={{ minWidth: 48 }} onClick={() => setK(1)}>
            {Math.round(k * 100)}%
          </Button>
          <IconButton icon="AddSmall" label="放大" disabled={k === ZOOMS[ZOOMS.length - 1]} onClick={() => zoom(1)} />
          <Divider orientation="vertical" />
          <IconButton icon="FitContent" label="适应画布" onClick={fit} />
        </ButtonGroup>
      </div>
    </div>
  );
}
