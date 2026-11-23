import { usePending } from '@kivi/hooks';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Button,
  CropHandles,
  Dropdown,
  GenerateButton,
  Menu,
  MenuItem,
  VideoPlayer,
  placeholderImageSrc,
  toast,
  type CropRect,
  type PlaceholderImageName,
} from '@kivi';
import { cx } from '@kivi/utils';
import { TOOL_INTRO, toolOf, type ToolId } from '../../data/tools';
import { ratioNum } from '../../data/mock';
import { uid } from '../../data/store';
import { confirm } from '../../flows/dialogs';
import { copyImage, downloadMedia } from '../../flows/files';
import { MaskLayer } from './mask-layer';
import { BRUSH, EDIT_MODES, EXPAND_DEFAULT, EXPAND_SCALES, toolCost, toolParams, type CostContext } from './options';
import { ToolPanel } from './panels';
import { PaintBar, StageActions, ZoomBadge, type BrushTool } from './stage-bars';
import { StageUploading } from './stage-parts';
import { StitchStage } from './stitch-stage';
import { checkToolFile, loadToolFile, mediaOfFile } from './upload';
import { useStageView } from './use-stage-view';
import { useStrokes } from './use-strokes';
import { INITIAL_STATE, type Source, type ToolJob, type ToolState } from './types';

/** 读 tokens.css 里的时长变量（系统开了「减少动态效果」时是 0） */
function cssMs(name: string, fallback: number): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  if (Number.isNaN(n)) return fallback;
  return v.endsWith('ms') ? n : v.endsWith('s') ? n * 1000 : n;
}

/*
  一个工具的工作区：舞台（原图、扩图框、涂抹）+ 底部参数面板。工具页、创作页的工具弹窗都用它，
  参数面板和画布节点下面的工具面板是同一套。只在业务页里拼，不进组件库（11-11 用户定先看效果）。
*/

const VIDEO = './placeholders/video/kivi-demo-16x9.mp4';

/** 把宽高比为 ratio 的东西放进 w × h 里，居中 */
function fitRect(ratio: number, w: number, h: number, scale = 1): CropRect {
  const bw = w * scale;
  const bh = h * scale;
  const fw = Math.min(bw, bh * ratio);
  const fh = fw / ratio;
  return { x: (w - fw) / 2, y: (h - fh) / 2, w: fw, h: fh };
}

/** 页面传进来的运行状态。舞台只用来提交任务（11-19 用户定）：生成中、结果、失败都只在页面的历史里，成功了也不动舞台。创作页弹窗不传 */
export interface ToolRuntime {
  /** 视频原素材正在上传（视频1） */
  uploading?: boolean;
}

export interface ToolWorkbenchProps {
  tool: ToolId;
  /** 原图 / 原视频，没有就是介绍和上传。视频拼接是视频1 */
  source: Source | null;
  /** 上传：传了才有「上传」按钮和舞台右上的下载 / 重新上传（工具页用，创作页弹窗里不传） */
  onUpload?: () => void;
  /** 清空舞台：拿掉原图 / 原视频，回到空的上传状态（不确认、不提示，结果都还在历史里）。不传就没有清空键 */
  onRemove?: () => void;
  /** 视频拼接：拖了一个文件到视频1的位上 */
  onFile?: (file: File) => void;
  /** 点生成 */
  onGenerate: (job: ToolJob) => void | Promise<unknown>;
  /** 工具页里每个工具一块，不是当前的藏起来（参数、扩图框、涂抹、提示词都还在） */
  hidden?: boolean;
  /** 扩图、智能编辑的提示词放成一横条（左边下拉、中间一行输入、右边生成），给图多留地方：创作页工具弹窗用（11-12 用户定） */
  promptBar?: boolean;
  /** AI 工具页（11-19 用户定）：坑铺满整栏高、和两边的框一样高，涂抹工具条、下载 / 换一张 / 清空浮在坑里顶上，参数面板浮在坑里底下，
   *  图放在它们中间（离坑四边至少 16）。不传是原来的排法（工具条在坑上面、参数面板在坑下面，创作页工具弹窗用） */
  floating?: boolean;
  /** 智能编辑固定成这一种方式、不能切（画布节点工具栏的「重绘」「元素去除」是两个工具）。不传就是自己切 */
  editMode?: 'inpaint' | 'remove';
  runtime?: ToolRuntime;
  className?: string;
}

export function ToolWorkbench({ tool, source, onUpload, onRemove, onFile, onGenerate, hidden, promptBar, floating, editMode, runtime = {}, className }: ToolWorkbenchProps) {
  const media = toolOf(tool).media;
  const cur = source;
  const stitching = tool === 'stitch';
  const [st, setSt] = useState<ToolState>(editMode ? { ...INITIAL_STATE, editMode } : INITIAL_STATE);
  const set = <K extends keyof ToolState>(k: K, v: ToolState[K]) => setSt((s) => ({ ...s, [k]: v }));

  // 提示词：智能编辑按编辑方式分开记
  const promptKey = tool === 'edit' ? `edit-${st.editMode}` : tool;
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const prompt = prompts[promptKey] ?? '';
  const setPrompt = (t: string) => setPrompts((p) => ({ ...p, [promptKey]: t }));

  // 视频拼接的视频2：自己管（上传、删除），视频1 是外面传进来的
  const [second, setSecond] = useState<Source | null>(null);
  const [uploading2, setUploading2] = useState(false);
  const secondRef = useRef<HTMLInputElement>(null);
  const takeSecond = async (f: File) => {
    const ok = await checkToolFile(f);
    if (!ok) return;
    if (mediaOfFile(ok) !== 'video') return void toast.error('请上传视频');
    setUploading2(true);
    try {
      const r = await loadToolFile(ok);
      if (r) setSecond({ id: uid('v'), ...r });
    } finally {
      setUploading2(false);
    }
  };
  // 两段比例差太多（宽高比差超过 5%）只提示、不挡
  useEffect(() => {
    if (stitching && cur && second && Math.abs(cur.ratio / second.ratio - 1) > 0.05) toast.warning('两段视频的比例差别较大，拼接后画面可能有黑边');
  }, [stitching, cur?.id, second?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const uploading = !!runtime.uploading || (stitching && uploading2);
  // 视频拼接一打开就露出两个上传位（照线上），不出工具介绍
  const slots = stitching;

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

  // 浮在坑里的东西让出来的地方：顶上工具条 16 + 44 + 16，底下参数面板（量它实际的高，切编辑方式时跟着过渡逐帧变）+ 上下 16，左右 16
  const [dockEl, setDockEl] = useState<HTMLDivElement | null>(null);
  const [dockH, setDockH] = useState(0);
  useLayoutEffect(() => {
    if (!dockEl) return setDockH(0);
    const ro = new ResizeObserver(() => dockEl.offsetParent && setDockH(dockEl.offsetHeight));
    ro.observe(dockEl);
    if (dockEl.offsetParent) setDockH(dockEl.offsetHeight);
    return () => ro.disconnect();
  }, [dockEl]);
  const EDGE = 16;
  const inset = floating
    ? { top: cur && !stitching ? EDGE + 44 + EDGE : EDGE, bottom: dockEl ? dockH + EDGE * 2 : EDGE, side: EDGE }
    : { top: 0, bottom: 0, side: 0 };
  /** 放图的那块（坑里去掉浮着的东西） */
  const inner: CropRect = {
    x: inset.side,
    y: inset.top,
    w: Math.max(0, area.w - inset.side * 2),
    h: Math.max(0, area.h - inset.top - inset.bottom),
  };
  const fitIn = (ratio: number, scale = 1): CropRect => {
    const r = fitRect(ratio, inner.w, inner.h, scale);
    return { ...r, x: r.x + inner.x, y: r.y + inner.y };
  };

  const expanding = tool === 'expand' && !!cur;
  const painting = tool === 'edit' && st.editMode !== 'redraw' && !!cur;
  const stageOn = !!cur && !stitching && !uploading;
  // 滚轮缩放、拖动平移只给要涂蒙版的（局部重绘、元素去除）：别的工具看整张图就够（11-19 用户定）
  const view = useStageView(areaRef, stageOn && painting, `${cur?.id}|${painting}`);
  // 扩图框：按原图的比例记（舞台变大变小、缩放、切走再切回来都对得上）
  const [frameRel, setFrameRel] = useState<CropRect>({ x: 0, y: 0, w: 1, h: 1 });
  // 舞台按「选比例时的扩图框」缩放：原图最多占舞台 60%，框大了原图跟着缩，让整个框放得下（拖框时不跟着变）。
  // 原比例按最大倍数放：切倍数时原图不动、只有框变大变小（照即梦）
  const [fitRel, setFitRel] = useState({ w: 1, h: 1 });
  const stageScale = (() => {
    if (!expanding || !cur || !inner.w || !inner.h) return expanding ? 0.6 : 1;
    const box = fitRect((cur.ratio * fitRel.w) / fitRel.h, inner.w, inner.h, 0.92);
    return Math.min(0.6, box.w / fitRel.w / fitRect(cur.ratio, inner.w, inner.h).w);
  })();
  const rect = cur && !stitching ? view.apply(fitIn(cur.ratio, stageScale)) : null;
  const bounds: CropRect = inner;

  const frame: CropRect | null =
    expanding && rect ? { x: rect.x + frameRel.x * rect.w, y: rect.y + frameRel.y * rect.h, w: frameRel.w * rect.w, h: frameRel.h * rect.h } : null;
  const setFrame = (f: CropRect) => {
    if (!rect) return;
    setFrameRel({ x: (f.x - rect.x) / rect.w, y: (f.y - rect.y) / rect.h, w: f.w / rect.w, h: f.h / rect.h });
    // 原比例下手动拖了框，就不是哪个整倍数了
    if (st.expandRatio === 'original' && st.expandScale) set('expandScale', '');
  };
  const frameMoved = [frameRel.x, frameRel.y].some((v) => Math.abs(v) > 0.002) || [frameRel.w, frameRel.h].some((v) => Math.abs(v - 1) > 0.002);
  // 选比例 / 倍数：按原图的比例算（原图宽高比 = cur.ratio）。原比例：四周一起扩到几倍；别的比例：框的宽高比 = v，贴着原图往外长；自由比例：框不动
  // 选比例、倍数时扩图框（和原图）滑到新位置，时长读 --motion-duration-300；拖框、换原图不动画
  const [framing, setFraming] = useState(false);
  const framingTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(framingTimer.current), []);
  const pickExpand = (ratio: string, scale = st.expandScale || EXPAND_DEFAULT.scale, animate = true) => {
    if (animate) {
      setFraming(true);
      window.clearTimeout(framingTimer.current);
      framingTimer.current = window.setTimeout(() => setFraming(false), cssMs('--motion-duration-300', 300));
    }
    set('expandRatio', ratio);
    set('expandScale', ratio === 'original' ? scale : st.expandScale);
    if (!cur || ratio === 'free') return;
    let w: number;
    let h: number;
    if (ratio === 'original') {
      w = h = Number(scale);
    } else {
      const r = ratioNum(ratio);
      w = r >= cur.ratio ? r / cur.ratio : 1;
      h = r >= cur.ratio ? 1 : cur.ratio / r;
    }
    setFrameRel({ x: 0.5 - w / 2, y: 0.5 - h / 2, w, h });
    const most = Number(EXPAND_SCALES[EXPAND_SCALES.length - 1]);
    setFitRel(ratio === 'original' ? { w: most, h: most } : { w, h });
  };
  const pickExpandRatio = (v: string | null) => pickExpand(v ?? 'free');
  const resetExpand = (animate = true) => pickExpand(EXPAND_DEFAULT.ratio, EXPAND_DEFAULT.scale, animate);
  // 换了原图：回到默认（原比例、往外扩 1.5 倍，照即梦一打开就扩一点）
  useEffect(() => {
    resetExpand(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id]);

  // 涂抹：换了原图才清掉
  const paint = useStrokes();
  const [brushTool, setBrushTool] = useState<BrushTool>('brush');
  const [brush, setBrush] = useState<number>(BRUSH.default);
  const [space, setSpace] = useState(false);
  const activeTool: BrushTool = space ? 'hand' : brushTool;
  useEffect(() => {
    paint.reset();
    setBrushTool('brush');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id]);
  // 按住空格临时换成拖动；在输入框里打空格不算
  useEffect(() => {
    if (!painting || hidden) return;
    const field = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.('input, textarea, [contenteditable="true"], [contenteditable=""]');
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || field(e.target)) return;
      e.preventDefault();
      setSpace(true);
    };
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpace(false);
    const off = () => setSpace(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', off);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', off);
      setSpace(false);
    };
  }, [painting, hidden]);
  // 拖动工具：按住舞台平移
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [panning, setPanning] = useState(false);

  const ctx: CostContext = { expandArea: expanding ? frameRel.w * frameRel.h : undefined, duration: cur?.duration };
  const cost = toolCost(tool, st, ctx);

  // 生成按钮能不能点：不满足就置灰，悬停说为什么
  const needsPrompt = tool === 'edit' && st.editMode !== 'remove';
  const reason = stitching && !(cur && second)
    ? '请上传两段视频'
    : !cur
      ? media === 'image'
        ? '请先上传图片'
        : '请先上传视频'
      : uploading
        ? '视频上传中，请稍候'
        : needsPrompt && !prompt.trim()
          ? '请输入画面描述'
          : painting && !paint.strokes.length
            ? '请涂抹要修改的区域'
            : expanding && !frameMoved
              ? '请拖动扩图框'
              : undefined;

  // 等提交请求回来：生成按钮转圈、不能重复点（状态记在这里：按钮放在参数面板里，面板换排版时按钮会重新挂上，记在按钮里会丢）
  const [submitting, runSubmit] = usePending();
  const generate = () => {
    if (!cur || reason || submitting) return;
    const label = tool === 'edit' ? (EDIT_MODES.find((m) => m.value === st.editMode)!.label as string) : toolOf(tool).name;
    // 页面返回请求的 Promise 时，等它的时候生成按钮转圈
    return runSubmit(() => onGenerate({
      tool,
      label,
      media: cur.media,
      src: cur.src,
      src2: stitching ? second?.src : undefined,
      ratio: cur.ratio,
      targetRatio: tool === 'expand' && frame ? frame.w / frame.h : cur.ratio,
      params: toolParams(tool, st, ctx),
      cost,
    }));
  };

  const gen = <GenerateButton cost={cost} disabledReason={reason} loading={submitting} onClick={generate} />;
  const panel = (
    <ToolPanel
      tool={tool}
      st={st}
      set={set}
      gen={gen}
      promptKey={promptKey}
      prompt={prompt}
      setPrompt={setPrompt}
      promptBar={promptBar}
      lockEdit={!!editMode}
      pickExpandRatio={pickExpandRatio}
      pickExpandScale={(v) => pickExpand('original', v)}
    />
  );

  // 右键菜单、右上的重新上传 / 清空
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const download = () => cur && void downloadMedia([{ src: cur.src }]);
  // 只有图片能复制（视频不出这一项）
  const copy = () => cur?.media === 'image' && void copyImage(cur.src);
  const reupload = async () => {
    const what = media === 'video' ? '原视频' : '原图';
    const ok = await confirm({ title: '重新上传', description: `重新上传后，${what}历史记录将清空`, confirmText: '重新上传', danger: false });
    if (ok) onUpload?.();
  };

  // 舞台上的东西
  let stage: ReactNode = null;
  if (uploading && !slots) {
    stage = <StageUploading />;
  } else if (slots) {
    stage = (
      <>
        <StitchStage
          first={{ title: '视频1', source: cur, uploading: runtime.uploading, onPick: onUpload, onFile, onRemove }}
          second={{ title: '视频2', source: second, uploading: uploading2, onPick: () => secondRef.current?.click(), onFile: (f) => void takeSecond(f), onRemove: () => setSecond(null) }}
          area={{ w: inner.w, h: inner.h }}
        />
      </>
    );
  } else if (!cur) {
    const intro = TOOL_INTRO[tool];
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
          <Button variant="secondary-muted" leftIcon="Upload" onClick={onUpload}>
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
            ratio={st.expandRatio === 'free' ? null : st.expandRatio === 'original' ? cur.ratio : ratioNum(st.expandRatio)}
            bounds={bounds}
            contain={rect}
            min={0}
            onConfirm={() => generate()}
            onCancel={() => resetExpand()}
          />
        )}
        {painting && (
          <MaskLayer
            rect={rect}
            strokes={paint.strokes}
            erase={activeTool === 'erase'}
            inactive={activeTool === 'hand'}
            size={brush * view.z}
            onStroke={paint.add}
          />
        )}
      </>
    );
  }

  const interactive = stageOn;

  return (
    <section className={cx('tpl-at__stage', className)} hidden={hidden} data-floating={floating || undefined}>
      {/* 涂抹工具条：只在局部重绘、元素去除时出，浮在舞台上方正中 */}
      {painting && interactive && (
        <PaintBar
          tool={activeTool}
          onTool={setBrushTool}
          size={brush}
          onSize={setBrush}
          canUndo={paint.canUndo}
          canRedo={paint.canRedo}
          onUndo={paint.undo}
          onRedo={paint.redo}
          canReset={paint.strokes.length > 0 || brushTool !== 'brush'}
          onReset={() => (paint.reset(), setBrushTool('brush'))}
        />
      )}
      {cur && onUpload && !stitching && !uploading && (
        <StageActions
          onDownload={download}
          onReupload={() => void reupload()}
          onRemove={onRemove}
        />
      )}

      <div
        ref={areaRef}
        className="tpl-at__area"
        data-framing={framing ? '' : undefined}
        data-painting={painting ? '' : undefined}
        data-hand={painting && activeTool === 'hand' ? '' : undefined}
        data-panning={panning ? '' : undefined}
        data-zoomed={view.z !== 1 ? '' : undefined}
        style={floating ? ({ '--tpl-at-inset-top': `${inset.top}px`, '--tpl-at-inset-bottom': `${inset.bottom}px` } as CSSProperties) : undefined}
        onContextMenu={(e) => {
          if (!stageOn) return;
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        onPointerDown={(e) => {
          if (!painting || activeTool !== 'hand') return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = { x: e.clientX, y: e.clientY };
          setPanning(true);
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          view.pan(e.clientX - d.x, e.clientY - d.y);
          dragRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => {
          dragRef.current = null;
          setPanning(false);
        }}
      >
        {!hidden && stage}
        {!hidden && stageOn && painting && <ZoomBadge z={view.z} onReset={view.reset} />}
      </div>
      {(cur || (stitching && second)) && <Dock outerRef={setDockEl}>{panel}</Dock>}

      {stitching && <input ref={secondRef} type="file" hidden accept="video/*" onChange={(e) => (e.target.files?.[0] && void takeSecond(e.target.files[0]), (e.target.value = ''))} />}

      {/* 舞台的右键菜单 */}
      <Dropdown anchorPoint={menu ?? undefined} open={menu !== null} onOpenChange={(v) => !v && setMenu(null)}>
        <Menu aria-label="舞台操作">
          <MenuItem icon="Download" onClick={download}>
            下载
          </MenuItem>
          {cur?.media === 'image' && (
            <MenuItem icon="Copy" onClick={copy}>
              复制
            </MenuItem>
          )}
        </Menu>
      </Dropdown>
    </section>
  );
}

/**
 * 底下的参数面板：切编辑方式（元素去除没有提示词，面板矮一截）时高度过渡，不跳（11-18 用户定）。
 * 面板底边钉住不动、上边沿上下移：面板框（底色、圆角）的高度跟着外层走、加过渡，里面的内容贴底排，
 * 新出来的提示词从上边沿露出来 / 收进去。坑是剩下的高度，跟着一起逐帧变，图也跟着坑走。第一次出现不动画
 */
function Dock({ children, outerRef }: { children: ReactNode; outerRef?: (el: HTMLDivElement | null) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number>();
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const dock = ref.current;
    const panel = dock?.firstElementChild as HTMLElement | null;
    if (!dock || !panel) return;
    // 内容本来要多高：内容贴底排，最上面那个子元素离面板顶的距离就是多出来（或不够）的那段（一横条面板换排版后第一个子元素不一定在最上面）
    const measure = () => {
      // 工具没显示（切走了、藏着）时量出来是 0，不记：不然切过来时面板从 0 长高、舞台跟着抖（11-19 用户报）。
      // 第一次显示时外层还没写高度（auto），直接到位不过渡
      if (!dock.offsetParent) return;
      const kids = Array.from(panel.children) as HTMLElement[];
      if (!kids.length) return;
      const top = Math.min(...kids.map((k) => k.offsetTop));
      const pad = parseFloat(getComputedStyle(panel).paddingTop) || 0;
      setHeight(Math.round(panel.clientHeight - top + pad));
    };
    const ro = new ResizeObserver(measure);
    const watch = () => {
      ro.disconnect();
      ro.observe(panel);
      Array.from(panel.children).forEach((c) => ro.observe(c));
    };
    const mo = new MutationObserver(() => (watch(), measure()));
    mo.observe(panel, { childList: true });
    watch();
    measure();
    const id = requestAnimationFrame(() => setReady(true));
    return () => {
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(id);
    };
  }, []);
  return (
    <div
      ref={(el) => {
        ref.current = el;
        outerRef?.(el);
      }}
      className="tpl-at__dock"
      data-ready={ready || undefined} style={height != null ? { height } : undefined}>
      {children}
    </div>
  );
}
