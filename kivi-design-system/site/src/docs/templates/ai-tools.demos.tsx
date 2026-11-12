import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  AddTile,
  AttachmentStrip,
  Button,
  ButtonGroup,
  CropHandles,
  Divider,
  GenPrompt,
  GenPromptRefs,
  GenerateButton,
  Icon,
  IconButton,
  Menu,
  MenuLabel,
  MenuItem,
  NodePanel,
  NodePanelBar,
  NumberInput,
  ParamField,
  PromptInput,
  ResultTile,
  Select,
  Dropdown,
  Slider,
  Tag,
  TabItem,
  Tabs,
  DropOverlay,
  VideoPlayer,
  placeholderImageSrc,
  toast,
  type CropRect,
  type IconName,
  type PlaceholderImageName,
  type PlaceholderImageRatio,
  type SelectOption,
} from '@kivi';
import { rejectMessage, useFileDrop } from '../../kivi/hooks';
import { cx } from '../../kivi/utils';
import { MediaViewer, ViewerAuthor, ViewerSection, useLastShown } from './media-viewer';

/*
  页面模板 · AI 工具：左边切工具（图片、视频不分开），中间是舞台，右边是历史。
  每个工具各管各的：自己的原图、舞台（扩图框、涂抹）、提示词，切走再切回来还在；生成的结果不回舞台，只进右边的历史。
  历史放所有工具生成的结果（上传的原图不进），点了全屏看；右键可以「加入当前工具」，把它当成当前工具的原图接着改。
  参数面板和画布节点下面的工具面板是同一套。生成是假的：3 秒后出一张占位图。讨论和待定记在 page-notes/ai-tools.md。
*/

export type Media = 'image' | 'video';
export type ToolId = 'cutout' | 'expand' | 'hd' | 'edit' | 'video-hd' | 'loop' | 'stitch' | 'video-cutout';

export interface ToolDef {
  id: ToolId;
  name: string;
  icon: IconName;
  media: Media;
}

/** 工具顺序照线上：图片四个在前，视频在后，分「图片工具」「视频工具」两组（多模态编辑 11-06 用户定不要了）。视频抠图线上 ToolsBox 没有、画布有，11-11 用户定加上，顺序照画布 */
export const TOOLS: ToolDef[] = [
  { id: 'cutout', name: '抠图', icon: 'Rmbg', media: 'image' },
  { id: 'expand', name: '扩图', icon: 'Expand', media: 'image' },
  { id: 'hd', name: '高清修复', icon: 'HD', media: 'image' },
  { id: 'edit', name: '智能编辑', icon: 'SmartEditing', media: 'image' },
  { id: 'loop', name: '视频循环', icon: 'VideoLoop', media: 'video' },
  { id: 'video-hd', name: '视频高清', icon: 'HD', media: 'video' },
  { id: 'stitch', name: '视频拼接', icon: 'Connecting', media: 'video' },
  { id: 'video-cutout', name: '视频抠图', icon: 'Rmbg', media: 'video' },
];
export const toolOf = (id: ToolId) => TOOLS.find((t) => t.id === id)!;

/** 没放素材时舞台上的介绍：示意图 + 一句话说这个工具做什么。示意图先用占位图、演示视频，以后换真素材 */
const INTRO: Record<ToolId, { desc: string; demo: string }> = {
  cutout: { desc: '上传图片，自动识别主体，去掉周围的背景。', demo: 'ip-gouache' },
  expand: { desc: '上传图片，拉框选出要扩的范围，AI 补全画面外面的内容。', demo: 'monstera-dots' },
  hd: { desc: '上传图片，放大 2 倍或 4 倍，补回细节。', demo: 'kiwi-light' },
  edit: { desc: '上传图片，描述想怎么改，或者涂抹要改、要去掉的地方。', demo: 'bunny-gouache' },
  loop: { desc: '上传视频，首尾自然衔接，循环播放看不出断点。', demo: 'video' },
  'video-hd': { desc: '上传视频，提升分辨率和帧率。', demo: 'video' },
  stitch: { desc: '上传两段视频，按顺序拼成一段。', demo: 'video' },
  'video-cutout': { desc: '上传视频，自动识别主体，去掉每一帧的背景。', demo: 'video' },
};

/** 一个工具的原图 / 原视频：每个工具各放各的 */
export interface Source {
  id: string;
  media: Media;
  src: string;
  /** 宽 / 高 */
  ratio: number;
}

/** 历史里的一条：某个工具生成的结果 */
interface Result {
  id: string;
  tool: ToolId;
  media: Media;
  src: string;
  /** 视频的封面 */
  poster?: string;
  ratio: number;
  /** 卡片下面写的名字：扩图、局部重绘… */
  label: string;
  status: 'done' | 'generating';
  /** 用的原图 / 原视频，看大图的信息栏里显示 */
  origin: string;
}

const VIDEO = './placeholders/video/kivi-demo-16x9.mp4';
const POOL: PlaceholderImageName[] = ['kivi-future', 'ip-gouache', 'bunny-gouache', 'monstera-dots', 'kiwi-light', 'ip-future'];
const RATIOS: PlaceholderImageRatio[] = ['1:1', '3:4', '16:9', '9:16'];
export const ratioNum = (r: string) => {
  const [w, h] = r.split(':').map(Number);
  return w / h;
};
/** 占位图只有四种比例，取最接近的那张 */
export const nearestRatio = (r: number) => RATIOS.reduce((a, b) => (Math.abs(Math.log(ratioNum(b) / r)) < Math.abs(Math.log(ratioNum(a) / r)) ? b : a));

let seq = 0;
export const newId = () => `v${Date.now()}-${seq++}`;

/** 把宽高比为 ratio 的东西放进 w × h 里，居中 */
function fitRect(ratio: number, w: number, h: number, scale = 1): CropRect {
  const bw = w * scale;
  const bh = h * scale;
  const fw = Math.min(bw, bh * ratio);
  const fh = fw / ratio;
  return { x: (w - fw) / 2, y: (h - fh) / 2, w: fw, h: fh };
}

// ---------- 参数面板：每个工具一块，和画布节点下面的工具面板同一套 ----------

const EXPAND_RATIOS: SelectOption[] = [
  { value: 'free', label: '自由比例', icon: 'AutoAspect' },
  { value: '1:1', label: '1:1', icon: 'Square11' },
  { value: '4:3', label: '4:3', icon: 'Square43' },
  { value: '3:4', label: '3:4', icon: 'Square34' },
  { value: '16:9', label: '16:9', icon: 'Square169' },
  { value: '9:16', label: '9:16', icon: 'Square916' },
];
const EDIT_MODES: SelectOption[] = [
  { value: 'redraw', label: '智能重绘', icon: 'SmartEditing' },
  { value: 'inpaint', label: '局部重绘', icon: 'Brush' },
  { value: 'remove', label: '元素消除', icon: 'RemoveEle' },
];

/** 各工具的参数，整页记一份：切工具再切回来还在 */
interface ToolState {
  expandRatio: string;
  hdScale: string;
  editMode: string;
  videoRes: string;
  fps: number;
  loop: string;
  stitchExtra: boolean;
}
const INITIAL_STATE: ToolState = {
  expandRatio: 'free',
  hdScale: '2',
  editMode: 'inpaint',
  videoRes: '1080P',
  fps: 30,
  loop: 'auto',
  stitchExtra: false,
};

/** 提示词：PromptInput 是不受控的，这里记下打的字（切工具再切回来接着显示），也决定生成按钮能不能点 */
function Prompt({ placeholder, initial, onText }: { placeholder: string; initial: string; onText: (t: string) => void }) {
  const [init] = useState(initial); // 只在挂上时放进去，之后由用户编辑
  return (
    <PromptInput placeholder={placeholder} onInput={(e) => onText(e.currentTarget.textContent ?? '')}>
      {init || undefined}
    </PromptInput>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <span className="tpl-at__hint">{children}</span>;
}

// ---------- 涂抹层：局部重绘、元素消除在图上涂要改的地方 ----------

interface Stroke {
  erase: boolean;
  /** 笔刷直径，按图宽的比例记，舞台变大变小都对得上 */
  size: number;
  pts: [number, number][];
}

function drawStrokes(canvas: HTMLCanvasElement, strokes: Stroke[], color: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = s.size * w;
    if (s.pts.length === 1) {
      ctx.beginPath();
      ctx.arc(s.pts[0][0] * w, s.pts[0][1] * h, (s.size * w) / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function MaskLayer({ rect, strokes, onStroke, erase, size }: {
  rect: CropRect;
  strokes: Stroke[];
  onStroke: (s: Stroke) => void;
  erase: boolean;
  /** 笔刷直径，屏幕像素 */
  size: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef<Stroke | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;

  // 涂的颜色：品牌色，整层再降到一半透明度，笔画交叠处不叠深
  const color = useRef('#2BFF75');
  useLayoutEffect(() => {
    if (ref.current) color.current = getComputedStyle(ref.current).getPropertyValue('--color-brand-solid').trim() || color.current;
  }, []);

  const redraw = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    drawStrokes(c, live.current ? [...strokes, live.current] : strokes, color.current);
  }, [strokes]);
  useEffect(redraw, [redraw, rect.w, rect.h]);

  const point = (e: ReactPointerEvent): [number, number] => {
    const b = ref.current!.getBoundingClientRect();
    return [(e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height];
  };
  return (
    <div className="tpl-at__mask" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}>
      <canvas
        ref={ref}
        width={Math.round(rect.w * dpr)}
        height={Math.round(rect.h * dpr)}
        aria-label={erase ? '橡皮' : '涂抹要修改的地方'}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          live.current = { erase, size: size / rect.w, pts: [point(e)] };
          redraw();
        }}
        onPointerMove={(e) => {
          const b = e.currentTarget.getBoundingClientRect();
          setCursor({ x: e.clientX - b.left, y: e.clientY - b.top });
          if (!live.current) return;
          live.current.pts.push(point(e));
          redraw();
        }}
        onPointerUp={() => {
          if (live.current) onStroke(live.current);
          live.current = null;
        }}
        onPointerLeave={() => setCursor(null)}
      />
      {cursor && <span className="tpl-at__brush" style={{ left: cursor.x, top: cursor.y, width: size, height: size }} />}
    </div>
  );
}

// ---------- 整页 ----------

/** 视频结果的封面：演示视频配对应比例的占位图 */
export const videoPoster = (ratio: number) => placeholderImageSrc(ratio < 1 ? 'ip-gouache' : 'kivi-future', ratio < 1 ? '9:16' : '16:9');


/** 生成一次要交出去的东西：工具页放进历史，创作页弹窗放进对话 */
export interface ToolJob {
  tool: ToolId;
  /** 名字：工具名，智能编辑写编辑方式 */
  label: string;
  media: Media;
  /** 原图 / 原视频 */
  src: string;
  ratio: number;
  /** 出来的结果大概是什么比例（扩图按扩图框） */
  targetRatio: number;
}

let picks = 0;
/** 假生成：扩图、智能编辑换一张占位图（比例照扩图框），别的工具原样返回 */
export function finishJob(job: ToolJob): { src: string; ratio: number } {
  if (job.media === 'video' || (job.tool !== 'expand' && job.tool !== 'edit')) return { src: job.src, ratio: job.ratio };
  const r = nearestRatio(job.targetRatio);
  return { src: placeholderImageSrc(POOL[picks++ % POOL.length], r), ratio: ratioNum(r) };
}

export interface ToolWorkbenchProps {
  tool: ToolId;
  /** 原图 / 原视频，没有就是介绍和上传 */
  source: Source | null;
  /** 上传：传了才有「上传」按钮和舞台右上的下载 / 换一张（工具页用，创作页弹窗里不传） */
  onUpload?: () => void;
  /** 点生成 */
  onGenerate: (job: ToolJob) => void;
  /** 工具页里每个工具一块，不是当前的藏起来（参数、扩图框、涂抹、提示词都还在） */
  hidden?: boolean;
  className?: string;
}

/**
 * 一个工具的工作区：舞台（原图、扩图框、涂抹）+ 底部参数面板。工具页、创作页的工具弹窗都用它，
 * 参数面板和画布节点下面的工具面板是同一套。只在模板里拼，不进组件库（11-11 用户定先看效果）
 */
export function ToolWorkbench({ tool, source, onUpload, onGenerate, hidden, className }: ToolWorkbenchProps) {
  const media = toolOf(tool).media;
  const cur = source;
  const [st, setSt] = useState(INITIAL_STATE);
  const set = <K extends keyof ToolState>(k: K, v: ToolState[K]) => setSt((s) => ({ ...s, [k]: v }));

  // 提示词：智能编辑按编辑方式分开记
  const promptKey = tool === 'edit' ? `edit-${st.editMode}` : tool;
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const prompt = prompts[promptKey] ?? '';
  const setPrompt = (t: string) => setPrompts((p) => ({ ...p, [promptKey]: t }));

  // 舞台大小：图片、视频按比例放进去；扩图时缩小留出往外拉的地方
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setArea({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const expanding = tool === 'expand' && !!cur;
  const painting = tool === 'edit' && st.editMode !== 'redraw' && !!cur;
  const rect = cur ? fitRect(cur.ratio, area.w, area.h, expanding ? 0.6 : 1) : null;
  const bounds: CropRect = { x: 0, y: 0, w: area.w, h: area.h };

  // 扩图框：按原图的比例记（舞台变大变小、切走再切回来都对得上），换了原图才回到贴着原图
  const [frameRel, setFrameRel] = useState<CropRect>({ x: 0, y: 0, w: 1, h: 1 });
  const frame: CropRect | null =
    expanding && rect ? { x: rect.x + frameRel.x * rect.w, y: rect.y + frameRel.y * rect.h, w: frameRel.w * rect.w, h: frameRel.h * rect.h } : null;
  const setFrame = (f: CropRect) => {
    if (!rect) return;
    setFrameRel({ x: (f.x - rect.x) / rect.w, y: (f.y - rect.y) / rect.h, w: f.w / rect.w, h: f.h / rect.h });
  };
  useEffect(() => {
    setFrameRel({ x: 0, y: 0, w: 1, h: 1 });
    set('expandRatio', 'free');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id]);
  const pickExpandRatio = (v: string | null) => {
    set('expandRatio', v ?? 'free');
    if (!rect || !v || v === 'free') return;
    const r = ratioNum(v);
    const w = r >= rect.w / rect.h ? rect.h * r : rect.w;
    const h = r >= rect.w / rect.h ? rect.h : rect.w / r;
    const fit = Math.min(1, area.w / w, area.h / h);
    const fw = w * fit;
    const fh = h * fit;
    setFrame({ x: rect.x + rect.w / 2 - fw / 2, y: rect.y + rect.h / 2 - fh / 2, w: fw, h: fh });
  };

  // 涂抹：换了原图才清掉
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [erase, setErase] = useState(false);
  const [brush, setBrush] = useState(40);
  useEffect(() => {
    setStrokes([]);
    setRedo([]);
    setErase(false);
  }, [cur?.id]);

  const generate = () => {
    if (!cur) return;
    const label =
      tool === 'edit' ? EDIT_MODES.find((m) => m.value === st.editMode)!.label as string : toolOf(tool).name;
    onGenerate({ tool, label, media: cur.media, src: cur.src, ratio: cur.ratio, targetRatio: tool === 'expand' && frame ? frame.w / frame.h : cur.ratio });
  };

  // 生成按钮能不能点：没素材、该写提示词没写、该涂没涂、拼接不够两段，都置灰（不弹原因）
  const needsPrompt = tool === 'edit' && st.editMode !== 'remove';
  const disabled = !cur || (needsPrompt && !prompt.trim()) || (painting && !strokes.length) || (tool === 'stitch' && !st.stitchExtra);

  const COST: Record<ToolId, number> = { cutout: 2, expand: 8, hd: st.hdScale === '4' ? 8 : 4, edit: 8, 'video-hd': st.fps > 30 ? 40 : 20, loop: 10, stitch: 5, 'video-cutout': 20 };
  const gen = <GenerateButton cost={COST[tool]} disabled={disabled} onClick={generate} />;

  let panel: ReactNode;
  switch (tool) {
    case 'cutout':
      panel = (
        <NodePanel className="tpl-tool__panel">
          <NodePanelBar left={<Hint>自动识别主体，去掉背景</Hint>} right={gen} />
        </NodePanel>
      );
      break;
    case 'video-cutout':
      panel = (
        <NodePanel className="tpl-tool__panel">
          <NodePanelBar left={<Hint>自动识别主体，去掉每一帧的背景</Hint>} right={gen} />
        </NodePanel>
      );
      break;
    case 'hd':
      panel = (
        <NodePanel className="tpl-tool__panel">
          <ParamField label="放大倍数">
            <Tabs variant="segment" value={st.hdScale} onChange={(v) => set('hdScale', v)} aria-label="放大倍数">
              <TabItem value="2">2 倍</TabItem>
              <TabItem value="4">4 倍</TabItem>
            </Tabs>
          </ParamField>
          <NodePanelBar right={gen} />
        </NodePanel>
      );
      break;
    case 'expand':
      panel = (
        <NodePanel className="tpl-at__panel">
          <Prompt key={promptKey} initial={prompt} placeholder="描述扩出去的地方画什么，不填由 AI 自己补全" onText={setPrompt} />
          <NodePanelBar
            left={
              <Dropdown
                haspopup="listbox"
                trigger={
                  <Select variant="plain" leftIcon={EXPAND_RATIOS.find((o) => o.value === st.expandRatio)?.icon} aria-label="扩图比例">
                    {EXPAND_RATIOS.find((o) => o.value === st.expandRatio)?.label}
                  </Select>
                }
              >
                <Menu role="listbox" aria-label="扩图比例">
                  {EXPAND_RATIOS.map((o) => (
                    <MenuItem key={o.value} icon={o.icon} selected={o.value === st.expandRatio} disabled={o.disabled} onClick={() => pickExpandRatio(o.value)}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Dropdown>
            }
            right={gen}
          />
        </NodePanel>
      );
      break;
    case 'edit':
      panel = (
        <NodePanel className="tpl-at__panel">
          {st.editMode !== 'remove' && (
            <Prompt
              key={promptKey}
              initial={prompt}
              placeholder={st.editMode === 'redraw' ? '描述你想怎么改这张图' : '描述涂抹的地方要改成什么'}
              onText={setPrompt}
            />
          )}
          <NodePanelBar
            left={
              <>
                <Dropdown
                  haspopup="listbox"
                  trigger={
                    <Select variant="plain" leftIcon={EDIT_MODES.find((o) => o.value === st.editMode)?.icon} aria-label="编辑方式">
                      {EDIT_MODES.find((o) => o.value === st.editMode)?.label}
                    </Select>
                  }
                >
                  <Menu role="listbox" aria-label="编辑方式">
                    {EDIT_MODES.map((o) => (
                      <MenuItem key={o.value} icon={o.icon} selected={o.value === st.editMode} disabled={o.disabled} onClick={() => ((v: string) => set('editMode', v))(o.value)}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </Dropdown>
                {st.editMode === 'remove' && <Hint>涂抹要去掉的东西</Hint>}
              </>
            }
            right={gen}
          />
        </NodePanel>
      );
      break;
    case 'video-hd':
      panel = (
        <NodePanel className="tpl-tool__panel">
          <ParamField label="分辨率">
            <Tabs variant="segment" value={st.videoRes} onChange={(v) => set('videoRes', v)} aria-label="分辨率">
              {['720P', '1080P', '4K'].map((r) => (
                <TabItem key={r} value={r}>
                  {r}
                </TabItem>
              ))}
            </Tabs>
          </ParamField>
          <ParamField label="帧速率">
            <div className="tpl-tool__slider">
              <Slider aria-label="帧速率" min={15} max={60} value={st.fps} onChange={(v) => set('fps', v)} />
              <NumberInput
                aria-label="帧速率数值"
                min={15}
                max={60}
                unit="fps"
                value={st.fps}
                onChange={(v) => v !== '' && !Number.isNaN(Number(v)) && set('fps', Number(v))}
              />
            </div>
          </ParamField>
          <NodePanelBar right={gen} />
        </NodePanel>
      );
      break;
    case 'loop':
      panel = (
        <NodePanel className="tpl-tool__panel">
          <ParamField label="过渡时长">
            <Tabs variant="segment" value={st.loop} onChange={(v) => set('loop', v)} aria-label="过渡时长">
              {[['auto', '自动'], ['1', '1s'], ['2', '2s'], ['3', '3s']].map(([v, l]) => (
                <TabItem key={v} value={v}>
                  {l}
                </TabItem>
              ))}
            </Tabs>
          </ParamField>
          <NodePanelBar right={gen} />
        </NodePanel>
      );
      break;
    case 'stitch':
      panel = (
        <NodePanel className="tpl-tool__panel">
          <ParamField label="按顺序拼接">
            <div className="tpl-at__strip">
              <AttachmentStrip
                aria-label="要拼接的视频"
                items={[
                  ...(cur ? [{ id: 'a', type: 'video' as const, name: '视频1', src: placeholderImageSrc('kivi-future', '16:9'), duration: '0:08', badge: '1' }] : []),
                  ...(st.stitchExtra ? [{ id: 'b', type: 'video' as const, name: '视频2', src: placeholderImageSrc('ip-gouache', '9:16'), duration: '0:05', badge: '2' }] : []),
                ]}
                onRemove={(id) => id === 'b' && set('stitchExtra', false)}
              />
              {!st.stitchExtra && <AddTile label="添加视频" onClick={() => set('stitchExtra', true)} />}
            </div>
          </ParamField>
          <NodePanelBar right={gen} />
        </NodePanel>
      );
      break;
  }

  // 舞台上的东西
  let stage: ReactNode = null;
  if (!cur) {
    const intro = INTRO[tool];
    stage = (
      <div className="tpl-at__intro">
        <div className="tpl-at__intro-demo">
          {intro.demo === 'video' ? (
            <video src={VIDEO} muted autoPlay loop playsInline />
          ) : (
            <img src={placeholderImageSrc(intro.demo as PlaceholderImageName, '16:9')} alt="" />
          )}
        </div>
        <div className="tpl-at__intro-text">
          <div className="tpl-at__intro-title">{toolOf(tool).name}</div>
          <div className="tpl-at__intro-desc">{intro.desc}</div>
        </div>
        {onUpload && (
          <Button variant="light" leftIcon="Upload" onClick={onUpload}>
            {media === 'image' ? '上传图片' : '上传视频'}
          </Button>
        )}
      </div>
    );
  } else if (rect && area.w > 0) {
    const box = { left: rect.x, top: rect.y, width: rect.w, height: rect.h };
    stage = (
      <>
        {expanding && frame && <div className="tpl-at__expand-fill" style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }} />}
        {cur.media === 'image' ? (
          <img key={cur.id} className="tpl-at__media tpl-at__media--in" style={box} src={cur.src} alt="" />
        ) : (
          <div key={cur.id} className="tpl-at__media tpl-at__media--in" style={box}>
            <VideoPlayer variant="preview" src={cur.src} fit="contain" loop />
          </div>
        )}
        {expanding && frame && (
          <CropHandles
            aria-label="扩图框"
            value={frame}
            onValueChange={setFrame}
            ratio={st.expandRatio === 'free' ? null : ratioNum(st.expandRatio)}
            bounds={bounds}
            contain={rect}
            min={0}
            onConfirm={() => !disabled && generate()}
            onCancel={() => (setFrameRel({ x: 0, y: 0, w: 1, h: 1 }), set('expandRatio', 'free'))}
          />
        )}
        {painting && (
          <MaskLayer
            rect={rect}
            strokes={strokes}
            erase={erase}
            size={brush}
            onStroke={(s) => (setStrokes((l) => [...l, s]), setRedo([]))}
          />
        )}
      </>
    );
  }

  return (
    <section className={cx('tpl-at__stage', className)} hidden={hidden}>
      {/* 涂抹工具条：只在局部重绘、元素消除时出，浮在舞台上方正中 */}
      {painting && (
        <ButtonGroup variant="glass" size={44} className="tpl-at__top">
          <IconButton icon="Brush" label="画笔" selected={!erase} onClick={() => setErase(false)} />
          <IconButton icon="Eraser" label="橡皮" selected={erase} onClick={() => setErase(true)} />
          <Divider orientation="vertical" />
          <span className="tpl-at__size">
            <Icon name="BrushSize" />
            <Slider aria-label="笔刷大小" min={8} max={120} value={brush} onChange={setBrush} />
          </span>
          <Divider orientation="vertical" />
          <IconButton
            icon="Previous"
            label="撤销"
            disabled={!strokes.length}
            onClick={() => (setRedo((r) => [strokes[strokes.length - 1], ...r]), setStrokes((l) => l.slice(0, -1)))}
          />
          <IconButton
            icon="NextStep"
            label="重做"
            disabled={!redo.length}
            onClick={() => (setStrokes((l) => [...l, redo[0]]), setRedo((r) => r.slice(1)))}
          />
          <IconButton icon="Delete" label="清空" disabled={!strokes.length} onClick={() => (setRedo([]), setStrokes([]))} />
        </ButtonGroup>
      )}
      {cur && onUpload && (
        <ButtonGroup variant="glass" size={44} className="tpl-at__actions">
          <IconButton icon="Download" label="下载" tooltip={{ placement: 'bottom' }} onClick={() => toast.success('已开始下载')} />
          <IconButton icon="ReUpload" label="换一张" tooltip={{ placement: 'bottom' }} onClick={onUpload} />
        </ButtonGroup>
      )}

      <div ref={areaRef} className="tpl-at__area" data-painting={painting ? '' : undefined}>
        {!hidden && stage}
      </div>
      {cur && <div className="tpl-at__dock">{panel}</div>}
    </section>
  );
}

export function ToolsPage() {
  const [tool, setTool] = useState<ToolId>('expand');
  const media = toolOf(tool).media;
  // 每个工具一张原图，切走再切回来还在
  const [sources, setSources] = useState<Partial<Record<ToolId, Source>>>({});
  // 所有工具生成的结果，新的在上面
  const [results, setResults] = useState<Result[]>([]);

  // 上传：点按钮、拖进来都走这里，放进当前工具。类型和当前工具不一样，就放进那一类的第一个工具并切过去
  const fileRef = useRef<HTMLInputElement>(null);
  const putSource = (m: Media, src: string, ratio: number) => {
    const target = m === media ? tool : TOOLS.find((t) => t.media === m)!.id;
    setSources((s) => ({ ...s, [target]: { id: newId(), media: m, src, ratio } }));
    if (target !== tool) setTool(target);
  };
  const addFile = (f: File) => {
    const url = URL.createObjectURL(f);
    if (f.type.startsWith('video')) {
      const el = document.createElement('video');
      el.onloadedmetadata = () => putSource('video', url, el.videoWidth / el.videoHeight || 16 / 9);
      el.src = url;
    } else {
      const el = new Image();
      el.onload = () => putSource('image', url, el.naturalWidth / el.naturalHeight || 1);
      el.src = url;
    }
  };
  const { dragging, rejected, bind } = useFileDrop({
    accept: 'image/*,video/*',
    multiple: false,
    onFiles: ([f]) => addFile(f),
    onReject: (_, reason) => toast.error(rejectMessage(reason)),
  });

  // 生成：舞台不动（原图还在，可以改参数再来一次），结果排在历史最上面；3 秒后出结果
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const generate = (job: ToolJob) => {
    const r: Result = {
      id: newId(),
      tool: job.tool,
      media: job.media,
      src: job.src,
      poster: job.media === 'video' ? videoPoster(job.ratio) : undefined,
      ratio: job.ratio,
      label: job.label,
      origin: job.src,
      status: 'generating',
    };
    setResults((l) => [r, ...l]);
    timers.current.push(
      window.setTimeout(() => setResults((l) => l.map((x) => (x.id === r.id ? { ...x, ...finishJob(job), status: 'done' } : x))), 3000),
    );
  };

  // 历史：点了全屏看；右键加入当前工具、下载、删除（生成中的不能删）
  const [preview, setPreview] = useState<Result | null>(null);
  const shownPreview = useLastShown(preview);
  const [filter, setFilter] = useState<ToolId | 'all'>('all');
  const shown = filter === 'all' ? results : results.filter((r) => r.tool === filter);
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const menuOf = menu ? results.find((r) => r.id === menu.id) ?? null : null;
  const useInTool = (r: Result) => {
    setSources((s) => ({ ...s, [tool]: { id: newId(), media: r.media, src: r.src, ratio: r.ratio } }));
  };

  return (
    <div className="tpl-at" {...bind}>
      <nav className="tpl-at__tools">
        <Menu variant="plain" aria-label="AI 工具">
          {(['image', 'video'] as const).map((m) => (
            <Fragment key={m}>
              <MenuLabel>{m === 'image' ? '图片工具' : '视频工具'}</MenuLabel>
              {TOOLS.filter((t) => t.media === m).map((t) => (
                <MenuItem key={t.id} icon={t.icon} selected={t.id === tool || undefined} onClick={() => setTool(t.id)}>
                  {t.name}
                </MenuItem>
              ))}
            </Fragment>
          ))}
        </Menu>
      </nav>

      <div className="tpl-at__main">
        {TOOLS.map((t) => (
          <ToolWorkbench
            key={t.id}
            tool={t.id}
            hidden={t.id !== tool}
            source={sources[t.id] ?? null}
            onUpload={() => fileRef.current?.click()}
            onGenerate={generate}
          />
        ))}
        <DropOverlay active={dragging} rejected={rejected} />
        <input
          ref={fileRef}
          type="file"
          hidden
          accept={media === 'image' ? 'image/*' : 'video/*'}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) addFile(f);
            e.target.value = '';
          }}
        />
      </div>

      <aside className="tpl-at__history" aria-label="历史">
        <div className="tpl-at__history-head">
          <span className="tpl-at__history-title">历史</span>
          <Dropdown
            haspopup="listbox"
            placement="bottom-end"
            // 筛选只放图标（11-11 用户定），筛了某个工具时按钮留选中底色
            trigger={<IconButton icon="Filter" label="按工具筛选" selected={filter !== 'all'} />}
          >
            <Menu role="listbox" aria-label="按工具筛选">
              <MenuItem selected={filter === 'all'} onClick={() => setFilter('all')}>
                全部工具
              </MenuItem>
              {TOOLS.map((t) => (
                <MenuItem key={t.id} icon={t.icon} selected={filter === t.id} onClick={() => setFilter(t.id)}>
                  {t.name}
                </MenuItem>
              ))}
            </Menu>
          </Dropdown>
        </div>
        {shown.length === 0 && (
          <p className="tpl-at__history-empty">{filter === 'all' ? '各个工具生成的结果都放在这里' : `${toolOf(filter).name}还没有生成记录`}</p>
        )}
        {shown.map((r) => {
          const done = r.status === 'done';
          return (
            <figure
              key={r.id}
              className="tpl-at__record"
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({ x: e.clientX, y: e.clientY, id: r.id });
              }}
            >
              <ResultTile
                type={r.media}
                status={r.status}
                src={r.src}
                poster={r.poster}
                topActions={done ? [{ icon: 'Download', label: '下载', onClick: () => toast.success('已开始下载') }] : undefined}
                style={{ aspectRatio: '1 / 1', cursor: done && r.media === 'image' ? 'zoom-in' : undefined }}
                onClick={done && r.media === 'image' ? (e) => !(e.target as HTMLElement).closest('button') && setPreview(r) : undefined}
                onPreview={done ? () => setPreview(r) : undefined}
              />
            </figure>
          );
        })}
      </aside>

      {/* 历史的右键菜单 */}
      <Dropdown anchorPoint={menu ?? undefined} open={menu !== null} onOpenChange={(v) => !v && setMenu(null)}>
        <Menu aria-label="历史操作">
          <MenuItem
            icon="Add"
            disabled={!menuOf || menuOf.status !== 'done' || menuOf.media !== media}
            onClick={() => menuOf && useInTool(menuOf)}
          >
            加入当前工具
          </MenuItem>
          <MenuItem icon="Download" disabled={menuOf?.status !== 'done'} onClick={() => toast.success('已开始下载')}>
            下载
          </MenuItem>
          <MenuItem
            variant="danger"
            icon="Delete"
            disabled={menuOf?.status !== 'done'}
            onClick={() => menuOf && setResults((l) => l.filter((x) => x.id !== menuOf.id))}
          >
            删除
          </MenuItem>
        </Menu>
      </Dropdown>

      {/* 看大图：全站共用的查看大图（media-viewer.tsx），信息栏写用了哪个工具、原图 */}
      <MediaViewer
        media={preview && { type: preview.media, src: preview.src, poster: preview.poster, alt: preview.label }}
        onClose={() => setPreview(null)}
        head={<ViewerAuthor name="KIVI" avatar={placeholderImageSrc('ip-peek', '1:1')} date="今天 14:32" />}
        actions={<IconButton icon="Download" label="下载" variant="secondary" size={36} onClick={() => toast.success('已开始下载')} />}
      >
        {shownPreview && (
          <ViewerSection title="参数">
            <GenPrompt>
              <Tag icon={toolOf(shownPreview.tool).icon}>{shownPreview.label}</Tag>
              <GenPromptRefs
                label={shownPreview.media === 'image' ? '原图' : '原视频'}
                items={[{ type: shownPreview.media, src: shownPreview.media === 'image' ? shownPreview.origin : shownPreview.poster }]}
              />
            </GenPrompt>
          </ViewerSection>
        )}
      </MediaViewer>
    </div>
  );
}
