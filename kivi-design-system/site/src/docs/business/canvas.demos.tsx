import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactElement } from 'react';
import {
  AudioWave,
  Button,
  CanvasToolbar,
  Connector,
  CropHandles,
  GenerateButton,
  IconButton,
  Tooltip,
  MentionChip,
  NodeCard,
  NodeMedia,
  NodePanel,
  NodePanelBar,
  NodePanelRefs,
  NodeToolbar,
  NodeStack,
  NodeStackToggle,
  NodeToolbarDivider,
  NodeWrapper,
  PromptInput,
  ReferenceFramePair,
  ReferenceItem,
  type ConnectorState,
  type IconButtonProps,
  type IconName,
  type NodeCardState,
  type NodeMediaType,
  type NodeWrapperRatio,
} from '@kivi';
import { CodeBlock, Playground, toJsx } from '@shell';
import { openPreview, VIDEO } from '../components/video-player.demos';
import { AudioModelControls, CountSelect, ImageModelControls, ModelSelect, RefModeSelect, VideoModelControls } from './generation';
import './canvas.demos.css';

// 画布页的演示：上面的小画布看整体（点、悬停、生成都是真的，生成是假的演示），下面每个拆解一个属性面板。参数表在 canvas.mdx

const IMG = './placeholders/';
// 演示音频：assets 里没有纯音频，用 mp4 的音轨（audio 元素能播 mp4）
const AUDIO = './placeholders/video/kivi-demo-9x16.mp4';

/** 只有图标的按钮：悬停出 Tooltip，文字用 label */
function TipButton(props: IconButtonProps) {
  return (
    <Tooltip content={props.label}>
      <IconButton {...props} />
    </Tooltip>
  );
}
const LONG_TEXT =
  '生成一首约 1 分钟的中速流行颂歌（约 105 BPM），带有强劲节拍和 80 年代合成器音色。歌手声线应为清晰而高亢。歌曲在主歌阶段应立即开始旋律铺垫，专注且具感染力，在副歌处达到高潮，并以混响渐出。';

// ---------- 节点和连线 ----------

type Key = 'text' | 'upload' | 'image' | 'audio' | 'video';
/** 生成节点用 NodeCard 的 5 个状态；素材节点只有上传中、完成 */
type Phase = NodeCardState | 'uploading';

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
        state="done"
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
      return <NodeCard state="guide" type={def.type} />;
    case 'pending':
      return <NodeCard state="pending" type={def.type} />;
    case 'generating':
      return (
        <NodeCard
          state="generating"
          type={def.type}
          cover={run.cover && def.src ? def.src : undefined}
          countdown={run.countdown ? (run.left === undefined ? '59s 生成中' : `${run.left}s 生成中`) : undefined}
        />
      );
    case 'failed':
      return <NodeCard state="failed" type={def.type} message={run.message} />;
    default: {
      // 图片、视频悬停时右上出按钮条：收藏、全屏、下载
      const media = def.type === 'image' || def.type === 'video';
      return (
        <NodeCard
          state="done"
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

const HISTORY = 'History' as IconName; // History 图标新图标库里还没有，先留空位

/** 节点工具栏：「模板 · 画布」页 4 条里按节点类型取。音频没有画 */
function toolbarOf(type: NodeMediaType | 'group') {
  switch (type) {
    case 'group':
      return (
        <NodeToolbar>
          <Button variant="text" leftIcon="PlayLine">整组执行</Button>
          <Button variant="text" leftIcon="Template">创建工作流</Button>
          <Button variant="text" leftIcon="UnGroup">解组</Button>
        </NodeToolbar>
      );
    case 'text':
      return (
        <NodeToolbar>
          <TipButton icon="H1" label="一级标题" />
          <TipButton icon="H2" label="二级标题" />
          <TipButton icon="H3" label="三级标题" />
          <TipButton icon="FontSize" label="正文" />
          <NodeToolbarDivider />
          <TipButton icon="TextBold" label="加粗" />
          <TipButton icon="TextItalic" label="斜体" />
          <TipButton icon="UnOrderedList" label="无序列表" />
          <TipButton icon="OrderedList" label="有序列表" />
          <TipButton icon="DividingLine" label="分隔线" />
          <NodeToolbarDivider />
          <TipButton icon="Copy" label="复制" />
          <TipButton icon="FullScreen" label="全屏" />
        </NodeToolbar>
      );
    case 'image':
      return (
        <NodeToolbar>
          <Button variant="text" leftIcon="Rmbg">抠图</Button>
          <Button variant="text" leftIcon="Crop">裁剪</Button>
          <Button variant="text" leftIcon="Expand">扩图</Button>
          <Button variant="text" leftIcon="HD">高清</Button>
          <Button variant="text" leftIcon="SmartEditing">重绘</Button>
          <Button variant="text" leftIcon="RemoveEle">元素去除</Button>
          <NodeToolbarDivider />
          <TipButton icon="ImageToText" label="反推提示词" />
          <TipButton icon="Download" label="下载" />
          <TipButton icon="FullScreen" label="全屏" />
        </NodeToolbar>
      );
    case 'video':
      return (
        <NodeToolbar>
          <Button variant="text" leftIcon="VideoLoop">循环</Button>
          <Button variant="text" leftIcon="HD">高清</Button>
          <Button variant="text" leftIcon="Connecting">拼接</Button>
          <Button variant="text" leftIcon="Rmbg">抠图</Button>
          <Button variant="text" leftIcon="Cutting">剪辑</Button>
          <Button variant="text" leftIcon="Pack">封装</Button>
          <NodeToolbarDivider />
          <TipButton icon="ImageToText" label="反推提示词" />
          <TipButton icon="Download" label="下载" />
          <TipButton icon="FullScreen" label="全屏" />
        </NodeToolbar>
      );
    default:
      return null;
  }
}

/** 生成面板：「模板 · 画布」页「生成面板」里按节点类型取。参考图是连进来的上游节点。音频面板 Figma 没画，先放参考图、提示词、模型、生成 */
function panelOf(def: NodeDef, inputs: NodeDef[], onGenerate: () => void, busy: boolean) {
  const refs = inputs.filter((n) => n.type === 'image' || n.type === 'video' || n.type === 'audio');
  const generate = <GenerateButton cost={def.type === 'video' ? 20 : 1} onClick={onGenerate} disabled={busy} />;
  const refRow = refs.length > 0 && (
    <NodePanelRefs>
      {refs.map((n, i) =>
        n.type === 'audio' ? (
          <ReferenceItem key={n.key} type="audio" badge={String(i + 1)} />
        ) : (
          <ReferenceItem key={n.key} src={n.src} badge={String(i + 1)} />
        ),
      )}
    </NodePanelRefs>
  );

  // 下拉、参数面板都用 generation.tsx 里共用的那一份，和主站输入框一样
  const bar = (left: ReactElement) => <NodePanelBar left={left} right={<>{def.type !== 'text' && <CountSelect />}{generate}</>} />;
  switch (def.type) {
    case 'text':
      return (
        <NodePanel expand>
          <PromptInput placeholder="描述任何你想要生成的内容" />
          {bar(<ModelSelect kind="text" />)}
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
        <NodePanelRefs>
          <ReferenceFramePair first={{ src: `${IMG}kivi-future-1x1.webp` }} last={{ src: `${IMG}kiwi-light-1x1.webp` }} />
        </NodePanelRefs>
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

export function CanvasPlayground() {
  const [runs, setRuns] = useState<Record<Key, Run>>(START);
  const [edges, setEdges] = useState<Edge[]>(EDGES);
  const [selected, setSelectedRaw] = useState<Key | null>(null);
  /** 文字节点双击进入编辑：出文字工具栏，收起生成面板 */
  const [editing, setEditing] = useState(false);
  const setSelected = (key: Key | null) => {
    if (key !== selected) setEditing(false);
    setSelectedRaw(key);
  };
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [panning, setPanning] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const timers = useRef<Partial<Record<Key, number>>>({});
  const drag = useRef<{ id: number; x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);

  // 开场：缩放到整张图放得下，最大 1
  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const w = BOUNDS.right - BOUNDS.left;
    const h = BOUNDS.bottom - BOUNDS.top;
    const k = Math.min(1, (el.clientWidth - 96) / w, (el.clientHeight - 160) / h);
    setView({ k, x: (el.clientWidth - w * k) / 2 - BOUNDS.left * k, y: 72 - BOUNDS.top * k });
  }, []);

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

  const patch = (key: Key, p: Partial<Run>) => setRuns((r) => ({ ...r, [key]: { ...r[key], ...p } }));
  const stop = (key: Key) => {
    window.clearInterval(timers.current[key]);
    delete timers.current[key];
  };

  // 假生成：进生成中，倒计时走完变完成。原来有结果的，旧图当底图
  const generate = (key: Key) => {
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
    if ((e.target as HTMLElement).closest('.cv-node, .cv-float, button')) return;
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

  const edgeState = ([a, b]: Edge): ConnectorState => {
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

  return (
    <div className="shell-pg cv-pg">
      <div
        ref={viewport}
        className={panning ? 'cv-canvas is-panning' : 'cv-canvas'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="cv-world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
          {edges.map((edge) => {
            const box = edgeBox(nodeOf(edge[0]), nodeOf(edge[1]));
            return (
              <Connector
                key={edge.join('-')}
                state={edgeState(edge)}
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
      </div>

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
}

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
          <>
            {(upload ? UPLOAD_NODES : GEN_NODES).map((def) => (
              <NodeWrapper key={def.name} ratio={def.ratio} name={def.name}>
                {cardOf(def, run)}
              </NodeWrapper>
            ))}
          </>
        );
      }}
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
            state="done"
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
      render={(s) => toolbarOf(s.type as NodeMediaType | 'group')!}
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
        return panelOf(nodeOf(type), PANEL_INPUTS[type].map(nodeOf), () => {}, false);
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
      render={(s) => <Connector state={s.state as ConnectorState} remove={s.remove ? 'hover' : undefined} />}
    />
  );
}

// ---------- 拆解：其他零件 ----------

/** 其他零件各摆一个，下面写名字 */
export function PartsDemo() {
  const parts: [string, ReactElement][] = [
    ['AudioWave', <div style={{ width: 284 }}><AudioWave /></div>],
    [
      'ReferenceItem',
      <div className="cv-part-row">
        <ReferenceItem src={`${IMG}kivi-future-1x1.webp`} badge="1" />
        <ReferenceItem src={`${IMG}kiwi-light-1x1.webp`} badge="首帧" duration="12s" weight="0.8" size={72} />
      </div>,
    ],
    [
      'PromptInput + MentionChip',
      <div className="cv-part-panel">
        <PromptInput>
          参考 <MentionChip src={`${IMG}kivi-future-1x1.webp`}>图片1</MentionChip> 里的元素，配上 <MentionChip type="music">音乐1</MentionChip> 的节奏
        </PromptInput>
      </div>,
    ],
    [
      'CropHandles',
      <div className="cv-part-crop">
        <img src={`${IMG}kiwi-light-1x1.webp`} alt="" />
        <CropHandles />
      </div>,
    ],
    [
      'CanvasToolbar',
      <CanvasToolbar>
        <TipButton icon="Add" label="添加" className="kv-canvas-toolbar__add" />
        <TipButton icon={HISTORY} label="历史" />
        <TipButton icon="Upload" label="上传" />
      </CanvasToolbar>,
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
