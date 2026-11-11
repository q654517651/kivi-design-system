import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  AddTile,
  AttachmentStrip,
  Button,
  ButtonGroup,
  CropHandles,
  Divider,
  EmptyState,
  GenerateButton,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  NodePanel,
  NodePanelBar,
  NumberInput,
  ParamField,
  PromptInput,
  ReferenceItem,
  ResultTile,
  Select,
  Dropdown,
  Slider,
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

/*
  页面模板 · AI 工具：左边切工具（图片、视频不分开），中间是舞台（当前这一版，编辑直接在上面做），右边是历史（每生成一次多一版）。
  参数面板和画布节点下面的工具面板是同一套。生成是假的：3 秒后出一张占位图。讨论和待定记在 page-notes/ai-tools.md。
*/

type Media = 'image' | 'video';
type ToolId = 'cutout' | 'expand' | 'hd' | 'edit' | 'video-hd' | 'loop' | 'stitch';

interface ToolDef {
  id: ToolId;
  name: string;
  icon: IconName;
  media: Media;
}

/** 工具顺序照线上：图片四个在前，视频三个在后，不分组（多模态编辑 11-06 用户定不要了） */
const TOOLS: ToolDef[] = [
  { id: 'cutout', name: '抠图', icon: 'Rmbg', media: 'image' },
  { id: 'expand', name: '扩图', icon: 'Expand', media: 'image' },
  { id: 'hd', name: '高清修复', icon: 'HD', media: 'image' },
  { id: 'edit', name: '智能编辑', icon: 'SmartEditing', media: 'image' },
  { id: 'loop', name: '视频循环', icon: 'VideoLoop', media: 'video' },
  { id: 'video-hd', name: '视频高清', icon: 'HD', media: 'video' },
  { id: 'stitch', name: '视频拼接', icon: 'Connecting', media: 'video' },
];
const toolOf = (id: ToolId) => TOOLS.find((t) => t.id === id)!;

/** 历史里的一版：上传的原图 / 原视频，或者某个工具生成的结果 */
interface Version {
  id: string;
  media: Media;
  src: string;
  /** 宽 / 高 */
  ratio: number;
  /** 历史里写的名字：原图、扩图、局部重绘… */
  label: string;
  status: 'done' | 'generating';
}

const VIDEO = './placeholders/video/kivi-demo-16x9.mp4';
const VIDEO_9x16 = './placeholders/video/kivi-demo-9x16.mp4';
const POOL: PlaceholderImageName[] = ['kivi-future', 'ip-gouache', 'bunny-gouache', 'monstera-dots', 'kiwi-light', 'ip-future'];
const RATIOS: PlaceholderImageRatio[] = ['1:1', '3:4', '16:9', '9:16'];
const ratioNum = (r: string) => {
  const [w, h] = r.split(':').map(Number);
  return w / h;
};
/** 占位图只有四种比例，取最接近的那张 */
const nearestRatio = (r: number) => RATIOS.reduce((a, b) => (Math.abs(Math.log(ratioNum(b) / r)) < Math.abs(Math.log(ratioNum(a) / r)) ? b : a));

let seq = 0;
const newId = () => `v${Date.now()}-${seq++}`;

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

/** 提示词：PromptInput 是不受控的，这里只记有没有字，决定生成按钮能不能点 */
function Prompt({ placeholder, onText }: { placeholder: string; onText: (t: string) => void }) {
  return <PromptInput placeholder={placeholder} onInput={(e) => onText(e.currentTarget.textContent ?? '')} />;
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

export function ToolsPage() {
  const [tool, setTool] = useState<ToolId>('expand');
  const media = toolOf(tool).media;
  const [versions, setVersions] = useState<Version[]>([]);
  // 图片、视频各记一个「当前这一版」：切到另一类工具再切回来，舞台还是原来那张
  const [current, setCurrent] = useState<Record<Media, string | null>>({ image: null, video: null });
  const [st, setSt] = useState(INITIAL_STATE);
  const set = <K extends keyof ToolState>(k: K, v: ToolState[K]) => setSt((s) => ({ ...s, [k]: v }));
  const [prompt, setPrompt] = useState('');

  const list = versions.filter((v) => v.media === media);
  const cur = versions.find((v) => v.id === current[media]) ?? null;
  const busy = cur?.status === 'generating';

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

  const expanding = tool === 'expand' && cur?.status === 'done';
  const painting = tool === 'edit' && st.editMode !== 'redraw' && cur?.status === 'done';
  const rect = cur ? fitRect(cur.ratio, area.w, area.h, expanding ? 0.6 : 1) : null;
  const bounds: CropRect = { x: 0, y: 0, w: area.w, h: area.h };

  // 扩图框：换了图、换了舞台大小、重新进扩图，都回到贴着原图
  const [frame, setFrame] = useState<CropRect | null>(null);
  const frameKey = `${cur?.id}-${expanding}-${Math.round(area.w)}-${Math.round(area.h)}`;
  useEffect(() => {
    setFrame(expanding && rect ? rect : null);
    set('expandRatio', 'free');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey]);
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

  // 涂抹：每一版各自一套，换版本就清掉
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [erase, setErase] = useState(false);
  const [brush, setBrush] = useState(40);
  useEffect(() => {
    setStrokes([]);
    setRedo([]);
    setErase(false);
  }, [cur?.id]);

  // 上传：点按钮、拖进来都走这里。图片、视频都收，类型和当前工具不一样就切到那一类的第一个工具
  const fileRef = useRef<HTMLInputElement>(null);
  const addSource = (m: Media, src: string, ratio: number) => {
    const v: Version = { id: newId(), media: m, src, ratio, label: m === 'image' ? '原图' : '原视频', status: 'done' };
    setVersions((l) => [v, ...l]);
    setCurrent((c) => ({ ...c, [m]: v.id }));
    if (m !== media) setTool(TOOLS.find((t) => t.media === m)!.id);
  };
  const addFile = (f: File) => {
    const url = URL.createObjectURL(f);
    if (f.type.startsWith('video')) {
      const el = document.createElement('video');
      el.onloadedmetadata = () => addSource('video', url, el.videoWidth / el.videoHeight || 16 / 9);
      el.src = url;
    } else {
      const el = new Image();
      el.onload = () => addSource('image', url, el.naturalWidth / el.naturalHeight || 1);
      el.src = url;
    }
  };
  const fromAssets = () => {
    const n = versions.filter((v) => v.media === media).length;
    if (media === 'video') addSource('video', n % 2 ? VIDEO_9x16 : VIDEO, n % 2 ? 9 / 16 : 16 / 9);
    else {
      const r = RATIOS[n % 3];
      addSource('image', placeholderImageSrc(POOL[n % POOL.length], r), ratioNum(r));
    }
  };
  const { dragging, rejected, bind } = useFileDrop({
    accept: 'image/*,video/*',
    multiple: false,
    onFiles: ([f]) => addFile(f),
    onReject: (_, reason) => toast.error(rejectMessage(reason)),
  });

  // 生成：以当前这一版为底，新的一版排在历史最上面、舞台直接换成它；3 秒后出结果
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const generate = () => {
    if (!cur) return;
    const label =
      tool === 'edit' ? EDIT_MODES.find((m) => m.value === st.editMode)!.label as string : toolOf(tool).name;
    let ratio = cur.ratio;
    if (tool === 'expand' && frame) ratio = frame.w / frame.h;
    const v: Version = { id: newId(), media: cur.media, src: cur.src, ratio: cur.ratio, label, status: 'generating' };
    setVersions((l) => [v, ...l]);
    setCurrent((c) => ({ ...c, [cur.media]: v.id }));
    const changes = tool === 'expand' || tool === 'edit';
    timers.current.push(
      window.setTimeout(() => {
        setVersions((l) =>
          l.map((x) => {
            if (x.id !== v.id) return x;
            if (x.media === 'video' || !changes) return { ...x, status: 'done' };
            const r = nearestRatio(ratio);
            return { ...x, status: 'done', ratio: ratioNum(r), src: placeholderImageSrc(POOL[(seq + 1) % POOL.length], r) };
          }),
        );
      }, 3000),
    );
  };

  // 生成按钮能不能点：生成中、没素材、该写提示词没写、该涂没涂、拼接不够两段，都置灰（不弹原因）
  const needsPrompt = tool === 'edit' && st.editMode !== 'remove';
  const disabled =
    !cur || busy || (needsPrompt && !prompt.trim()) || (painting && !strokes.length) || (tool === 'stitch' && !st.stitchExtra);

  // 换工具、换编辑方式时，提示词清空（PromptInput 跟着重挂）
  const promptKey = `${tool}-${st.editMode}`;
  useEffect(() => setPrompt(''), [promptKey]);

  const COST: Record<ToolId, number> = { cutout: 2, expand: 8, hd: st.hdScale === '4' ? 8 : 4, edit: 8, 'video-hd': st.fps > 30 ? 40 : 20, loop: 10, stitch: 5 };
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
          <Prompt key={promptKey} placeholder="描述扩出去的地方画什么，不填由 AI 自己补全" onText={setPrompt} />
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
    stage = (
      <EmptyState
        className="tpl-at__empty"
        type="empty"
        size={160}
        title={media === 'image' ? '拖入、粘贴或上传一张图片' : '拖入或上传一段视频'}
        description={media === 'image' ? 'JPEG、PNG、WEBP，不超过 10M' : 'MP4，不超过 20M'}
        action={
          <div className="tpl-at__empty-actions">
            <Button variant="primary" leftIcon="Upload" onClick={() => fileRef.current?.click()}>
              {media === 'image' ? '上传图片' : '上传视频'}
            </Button>
            <Button variant="light" leftIcon="Pack" onClick={fromAssets}>
              从资产选择
            </Button>
          </div>
        }
      />
    );
  } else if (rect && area.w > 0) {
    const box = { left: rect.x, top: rect.y, width: rect.w, height: rect.h };
    stage = (
      <>
        {expanding && frame && <div className="tpl-at__expand-fill" style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }} />}
        {busy ? (
          <ResultTile className="tpl-at__media" style={box} type={cur.media} status="generating" src={cur.src} fit />
        ) : cur.media === 'image' ? (
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
            onCancel={() => (setFrame(rect), set('expandRatio', 'free'))}
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
    <div className="tpl-at" {...bind}>
      <nav className="tpl-at__tools">
        <Menu variant="plain" aria-label="AI 工具">
          {TOOLS.map((t) => (
            <MenuItem key={t.id} icon={t.icon} selected={t.id === tool || undefined} onClick={() => setTool(t.id)}>
              {t.name}
            </MenuItem>
          ))}
        </Menu>
      </nav>

      <section className="tpl-at__stage">
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
        {cur && !busy && (
          <ButtonGroup variant="glass" size={44} className="tpl-at__actions">
            <IconButton icon="Download" label="下载" tooltip={{ placement: 'bottom' }} onClick={() => toast.success('已开始下载')} />
            <IconButton icon="ReUpload" label="换一张" tooltip={{ placement: 'bottom' }} onClick={() => fileRef.current?.click()} />
          </ButtonGroup>
        )}

        <div ref={areaRef} className="tpl-at__area" data-painting={painting ? '' : undefined}>
          {stage}
        </div>
        {cur && <div className="tpl-at__dock">{panel}</div>}
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
      </section>

      <aside className="tpl-at__history" aria-label="历史">
        <div className="tpl-at__history-title">历史</div>
        {list.map((v) => (
          <button
            key={v.id}
            type="button"
            className="tpl-at__version"
            aria-pressed={v.id === cur?.id}
            onClick={() => setCurrent((c) => ({ ...c, [v.media]: v.id }))}
          >
            <span className="tpl-at__thumb">
              {v.status === 'generating' ? (
                <ResultTile type={v.media} status="generating" src={v.media === 'image' ? v.src : undefined} />
              ) : (
                <ReferenceItem
                  size={72}
                  type={v.media}
                  src={v.media === 'image' ? v.src : placeholderImageSrc(v.ratio < 1 ? 'ip-gouache' : 'kivi-future', v.ratio < 1 ? '9:16' : '16:9')}
                />
              )}
            </span>
            <span className="tpl-at__version-name">{v.label}</span>
          </button>
        ))}
      </aside>
    </div>
  );
}
