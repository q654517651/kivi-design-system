import { useState, type ReactNode } from 'react';
import {
  AttachmentStrip,
  Banner,
  Button,
  ButtonGroup,
  CropHandles,
  DialogPanel,
  Divider,
  GenerateButton,
  IconButton,
  Input,
  MenuItem,
  NodeCard,
  NodeMedia,
  NodePanel,
  NodePanelBar,
  NodeWrapper,
  NumberInput,
  ParamField,
  PlaceholderImage,
  Select,
  Slider,
  Switch,
  TabItem,
  Tabs,
  VideoPlayer,
  placeholderImageSrc,
  type AttachmentItem,
  type CropRect,
  type SelectOption,
} from '@kivi';
import { TemplateFrame } from './frame';

/*
  画布工具：工具面板（高清这类）、裁剪 / 扩图的工具条、视频封装弹窗。都用已有组件拼，不做新组件。
  只能看：不生成、不调接口。线上规格和这里的差别记在 page-notes/canvas-tools.md。
*/

const IMAGE = placeholderImageSrc('kivi-future', '1:1');
const VIDEO = './placeholders/video/kivi-demo-16x9.mp4';
const VIDEO_9x16 = './placeholders/video/kivi-demo-9x16.mp4';

/** 滑块 + 数字框：工具面板、封装弹窗共用（滑块统一成库里的刻度 Slider，数字框用 NumberInput） */
function SliderInput({ label, min, max, step = 1, precision = 0, unit, value, onChange, disabled }: {
  label: string;
  min: number;
  max: number;
  step?: number;
  precision?: number;
  unit?: ReactNode;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="tpl-tool__slider">
      <Slider aria-label={label} min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled} />
      <NumberInput
        aria-label={`${label}数值`}
        min={min}
        max={max}
        precision={precision}
        unit={unit}
        value={value}
        disabled={disabled}
        onChange={(v) => v !== '' && !Number.isNaN(Number(v)) && onChange(Number(v))}
      />
    </div>
  );
}

// ---------- 工具面板 ----------

/** 选中节点后在下方出的工具面板：生成面板的一种，只有素材 + 一两个参数 + 生成按钮 */
function ToolPanel({ refs, children, cost }: { refs: AttachmentItem[]; children: ReactNode; cost: number }) {
  return (
    <NodePanel className="tpl-tool__panel">
      <AttachmentStrip items={refs} aria-label="素材" />
      {children}
      <NodePanelBar right={<GenerateButton cost={cost} />} />
    </NodePanel>
  );
}

function ImageHdPanel() {
  const [ratio, setRatio] = useState('2');
  return (
    <ToolPanel refs={[{ id: 'image', type: 'image', name: '图片节点', src: IMAGE, badge: '1' }]} cost={4}>
      <ParamField label="放大倍数">
        <Tabs variant="segment" value={ratio} onChange={setRatio} aria-label="放大倍数">
          <TabItem value="2">2 倍</TabItem>
          <TabItem value="4">4 倍</TabItem>
        </Tabs>
      </ParamField>
    </ToolPanel>
  );
}

function VideoHdPanel() {
  const [res, setRes] = useState('1080P');
  const [fps, setFps] = useState(30);
  return (
    <ToolPanel refs={[{ id: 'video', type: 'video', name: '视频节点', src: IMAGE, duration: '0:08', badge: '1' }]} cost={fps > 30 ? 40 : 20}>
      <ParamField label="分辨率">
        <Tabs variant="segment" value={res} onChange={setRes} aria-label="分辨率">
          {['720P', '1080P', '4K'].map((r) => (
            <TabItem key={r} value={r}>
              {r}
            </TabItem>
          ))}
        </Tabs>
      </ParamField>
      <ParamField label="帧速率">
        <SliderInput label="帧速率" min={15} max={60} unit="fps" value={fps} onChange={setFps} />
      </ParamField>
    </ToolPanel>
  );
}

/** 两个节点各选中、下面出工具面板：左图片高清，右视频高清 */
export function ToolPanelsTemplate() {
  return (
    <TemplateFrame>
      <div className="tpl-tool tpl-tool--panels">
        <div className="tpl-tool__node">
          <NodeWrapper ratio="1:1" name="图片高清" selected>
            <NodeCard status="done" type="image">
              <NodeMedia type="image" src={IMAGE} />
            </NodeCard>
          </NodeWrapper>
          <ImageHdPanel />
        </div>
        <div className="tpl-tool__node">
          <NodeWrapper ratio="4:3" name="视频高清" selected>
            <NodeCard status="done" type="video">
              <NodeMedia type="video" src={VIDEO} />
            </NodeCard>
          </NodeWrapper>
          <VideoHdPanel />
        </div>
      </div>
    </TemplateFrame>
  );
}

// ---------- 裁剪、扩图 ----------

const CROP_RATIOS: SelectOption[] = [
  { value: 'original', label: '原图比例', icon: 'OriginalProportions' },
  { value: '1:1', label: '1:1', icon: 'Square11' },
  { value: '4:3', label: '4:3', icon: 'Square43' },
  { value: '3:4', label: '3:4', icon: 'Square34' },
  { value: '16:9', label: '16:9', icon: 'Square169' },
  { value: '9:16', label: '9:16', icon: 'Square916' },
];
const EXPAND_RATIOS: SelectOption[] = [{ value: 'free', label: '自由比例', icon: 'AutoAspect' }, ...CROP_RATIOS.slice(1)];

/** 演示原图 2048 × 2048（1:1） */
const SOURCE = 2048;

/** 比例名换成宽 / 高：原图比例是 1（演示图 1:1），自由比例是 null */
function ratioOf(value: string | null): number | null {
  if (value === 'original') return 1;
  const m = value?.match(/^(\d+):(\d+)$/);
  return m ? Number(m[1]) / Number(m[2]) : null;
}

/** 以 (cx, cy) 为中心放一个 w × h 的框，出了 bounds 就挪回来 */
function centered(cx: number, cy: number, w: number, h: number, b: CropRect): CropRect {
  return { w, h, x: Math.min(Math.max(cx - w / 2, b.x), b.x + b.w - w), y: Math.min(Math.max(cy - h / 2, b.y), b.y + b.h - h) };
}

/** 尺寸数字框：打字时先存着，失焦或 Enter 才提交（照线上）；提交不了的回到原值 */
function SizeField({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <NumberInput
      className="tpl-tool__size"
      aria-label={label}
      value={draft ?? String(value)}
      onChange={setDraft}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      onBlur={(e) => {
        e.preventDefault();
        const n = Number(draft);
        if (draft && n > 0) onCommit(n);
        setDraft(null);
      }}
    />
  );
}

const CROP_STAGE = 256;
const CROP_SCALE = SOURCE / CROP_STAGE;
const CROP_BOUNDS: CropRect = { x: 0, y: 0, w: CROP_STAGE, h: CROP_STAGE };
const CROP_START: CropRect = { x: 32, y: 32, w: 192, h: 192 };

function CropMode() {
  const [rect, setRect] = useState(CROP_START);
  const [locked, setLocked] = useState(true);
  const [ratio, setRatio] = useState<string | null>('original');
  // 解锁再锁上、没选比例时，锁的是锁上那一刻的比例
  const [freeRatio, setFreeRatio] = useState(1);
  // 图片缩放：没改过就跟着裁剪尺寸走
  const [scale, setScale] = useState<{ w: number; h: number } | null>(null);

  const lockRatio = locked ? (ratioOf(ratio) ?? freeRatio) : null;
  const out = { w: Math.round(rect.w * CROP_SCALE), h: Math.round(rect.h * CROP_SCALE) };
  const shown = scale ?? out;
  const change = (next: CropRect) => (setRect(next), setScale(null));

  // 裁剪宽高：夹到 [128, 原图]，锁比例时按比例算另一边，以原来的中心放
  const commitSize = (side: 'w' | 'h', v: number) => {
    const n = Math.min(Math.max(v, 128), SOURCE) / CROP_SCALE;
    let w = side === 'w' ? n : lockRatio ? n * lockRatio : rect.w;
    let h = side === 'h' ? n : lockRatio ? n / lockRatio : rect.h;
    const fit = Math.min(1, CROP_STAGE / w, CROP_STAGE / h);
    w *= fit;
    h *= fit;
    change(centered(rect.x + rect.w / 2, rect.y + rect.h / 2, w, h, CROP_BOUNDS));
  };
  // 图片缩放：夹到 [128, 8192]，按裁剪比例联动另一边
  const commitScale = (side: 'w' | 'h', v: number) => {
    const n = Math.min(Math.max(v, 128), 8192);
    setScale(side === 'w' ? { w: n, h: Math.round((n * out.h) / out.w) } : { w: Math.round((n * out.w) / out.h), h: n });
  };
  // 选比例：锁上，按比例取放得下的最大框，以原来的中心放；原图比例是整张图
  const pickRatio = (v: string | null) => {
    const r = ratioOf(v) ?? 1;
    setRatio(v);
    setLocked(true);
    const w = Math.min(CROP_STAGE, CROP_STAGE * r);
    change(v === 'original' ? CROP_BOUNDS : centered(rect.x + rect.w / 2, rect.y + rect.h / 2, w, w / r, CROP_BOUNDS));
  };
  const toggleLock = () => {
    if (locked) setRatio(null);
    else setFreeRatio(rect.w / rect.h);
    setLocked(!locked);
  };
  const reset = () => (change(CROP_START), setLocked(true), setRatio('original'));

  return (
    <div className="tpl-tool__node">
      <ButtonGroup variant="glass" size={44} className="tpl-tool__bar">
        <span className="tpl-tool__bar-title">图片缩放</span>
        <SizeField label="图片缩放宽度" value={shown.w} onCommit={(v) => commitScale('w', v)} />
        <span className="tpl-tool__times">×</span>
        <SizeField label="图片缩放高度" value={shown.h} onCommit={(v) => commitScale('h', v)} />
      </ButtonGroup>
      <div className="tpl-tool__crop">
        <div className="tpl-tool__crop-clip">
          <img src={IMAGE} alt="" />
          <div className="tpl-tool__crop-shade" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />
        </div>
        <CropHandles
          aria-label="裁剪框"
          value={rect}
          onValueChange={change}
          ratio={lockRatio}
          bounds={CROP_BOUNDS}
          min={128 / CROP_SCALE}
          onCancel={reset}
        />
      </div>
      <ButtonGroup variant="glass" size={44} className="tpl-tool__bar">
        <IconButton tooltip={false} icon="Close" label="关闭裁剪" variant="text" onClick={reset} />
        <span className="tpl-tool__bar-title">图片裁剪</span>
        <SizeField label="裁剪宽度" value={out.w} onCommit={(v) => commitSize('w', v)} />
        <IconButton
          icon={locked ? 'EnableConstraint' : 'DisableConstraint'}
          label={locked ? '解绑比例' : '约束比例'}
          variant="text"
          size={28}
          selected={locked}
          onClick={toggleLock}
        />
        <SizeField label="裁剪高度" value={out.h} onCommit={(v) => commitSize('h', v)} />
        <Select variant="plain" options={CROP_RATIOS} value={locked ? ratio : null} placeholder="自由比例" onChange={pickRatio} aria-label="裁剪比例" />
        <Divider orientation="vertical" />
        <Button variant="primary">确定</Button>
      </ButtonGroup>
    </div>
  );
}

/** 扩图：画布区 320 × 256，原图 144 在正中，扩图框最远拖到画布区边上 */
const EXPAND_STAGE: CropRect = { x: 0, y: 0, w: 320, h: 256 };
const EXPAND_IMAGE: CropRect = { x: 88, y: 56, w: 144, h: 144 };

function ExpandMode() {
  const [frame, setFrame] = useState(EXPAND_IMAGE);
  const [ratio, setRatio] = useState<string | null>('free');
  // 选比例：撑到包住原图的最小该比例框，以原图中心放；自由比例不动框
  const pickRatio = (v: string | null) => {
    setRatio(v);
    const r = ratioOf(v);
    if (!r) return;
    const { x, y, w, h } = EXPAND_IMAGE;
    setFrame(centered(x + w / 2, y + h / 2, r >= w / h ? h * r : w, r >= w / h ? h : w / r, EXPAND_STAGE));
  };
  const reset = () => (setFrame(EXPAND_IMAGE), setRatio('free'));
  return (
    <div className="tpl-tool__node">
      <div className="tpl-tool__expand">
        <div className="tpl-tool__expand-fill" style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }} />
        <img src={IMAGE} alt="" style={{ left: EXPAND_IMAGE.x, top: EXPAND_IMAGE.y, width: EXPAND_IMAGE.w, height: EXPAND_IMAGE.h }} />
        <CropHandles
          aria-label="扩图框"
          value={frame}
          onValueChange={setFrame}
          ratio={ratioOf(ratio)}
          bounds={EXPAND_STAGE}
          contain={EXPAND_IMAGE}
          min={0}
          onCancel={reset}
        />
      </div>
      <ButtonGroup variant="glass" size={44} className="tpl-tool__bar">
        <IconButton tooltip={false} icon="Close" label="关闭扩图" variant="text" onClick={reset} />
        <span className="tpl-tool__bar-hint">拖动边框进行扩图</span>
        <Select variant="plain" options={EXPAND_RATIOS} value={ratio} onChange={pickRatio} aria-label="扩图比例" />
        <GenerateButton cost={8} />
      </ButtonGroup>
    </div>
  );
}

/** 左裁剪（上面缩放条、下面裁剪条），右扩图（下面一条） */
export function CropTemplate() {
  return (
    <TemplateFrame>
      <div className="tpl-tool tpl-tool--crop">
        <CropMode />
        <ExpandMode />
      </div>
    </TemplateFrame>
  );
}

// ---------- 视频封装弹窗 ----------

type PackType = 'badge' | 'vehicle' | 'background' | 'custom';

const PACK_TYPES: { value: PackType; label: string }[] = [
  { value: 'badge', label: '麦圈 / 勋章' },
  { value: 'vehicle', label: '礼物 / 座驾' },
  { value: 'background', label: '背景' },
  { value: 'custom', label: '自定义' },
];

const PACK_SPECS: Record<Exclude<PackType, 'custom'>, [string, string][]> = {
  badge: [
    ['静态尺寸', '400 × 400'],
    ['动态尺寸', '320 × 320'],
  ],
  vehicle: [
    ['图标', '168 × 168'],
    ['图片', '504 × 504'],
    ['视频尺寸', '750 × 1334'],
  ],
  background: [
    ['封面尺寸', '330 × 360'],
    ['静态尺寸', '1125 × 2001'],
    ['动态尺寸', '750 × 1334'],
  ],
};

const FORMATS: SelectOption[] = [
  { value: 'mp4', label: 'MP4' },
  { value: 'webp', label: 'WebP' },
  { value: 'apng', label: 'APNG', disabled: true },
  { value: 'mp4-alpha', label: 'MP4-Alpha' },
];
const FPS: SelectOption[] = [60, 30, 25, 24, 10, 5].map((n) => ({ value: String(n), label: `${n} fps`, disabled: n > 30 }));

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tpl-pack__row">
      <span>{label}</span>
      {children}
    </div>
  );
}

function PackInspector({ type }: { type: PackType }) {
  const [feather, setFeather] = useState(true);
  const [strength, setStrength] = useState(200);
  const [fade, setFade] = useState(true);
  const [fadeIn, setFadeIn] = useState(0.5);
  const [fadeOut, setFadeOut] = useState(0.5);
  const [quality, setQuality] = useState(80);
  return (
    <div className="tpl-pack__spec">
      {type === 'vehicle' && <Banner type="warning">视频比例不符合规范</Banner>}
      {type !== 'custom' && (
        <ParamField label={type === 'vehicle' ? '素材规范' : '尺寸规范'}>
          <dl className="tpl-pack__spec-list">
            {PACK_SPECS[type].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </ParamField>
      )}
      <ParamField label={type === 'custom' ? '名称' : '资源名称'}>
        <Input defaultValue="新春座驾" aria-label="资源名称" />
      </ParamField>
      {type === 'vehicle' && (
        <>
          <Row label="羽化">
            <Switch checked={feather} onChange={setFeather} aria-label="羽化" />
          </Row>
          <SliderInput label="羽化强度" min={0} max={500} value={strength} onChange={setStrength} disabled={!feather} />
          <Row label="淡入淡出">
            <Switch checked={fade} onChange={setFade} aria-label="淡入淡出" />
          </Row>
          <SliderInput label="淡入" min={0} max={1} step={0.1} precision={1} unit="s" value={fadeIn} onChange={setFadeIn} disabled={!fade} />
          <SliderInput label="淡出" min={0} max={1} step={0.1} precision={1} unit="s" value={fadeOut} onChange={setFadeOut} disabled={!fade} />
          <Row label="素材背景">
            <Switch defaultChecked aria-label="素材背景" />
          </Row>
        </>
      )}
      {type === 'custom' && (
        <>
          <ParamField label="视频尺寸">
            <div className="tpl-pack__size">
              <NumberInput aria-label="视频宽度" defaultValue="750" />
              <span className="tpl-tool__times">×</span>
              <NumberInput aria-label="视频高度" defaultValue="1334" />
            </div>
          </ParamField>
          <ParamField label="封装格式">
            <Select options={FORMATS} defaultValue="mp4" aria-label="封装格式" />
          </ParamField>
          <ParamField label="帧速率">
            <Select options={FPS} defaultValue="30" aria-label="帧速率" />
          </ParamField>
          <ParamField label="质量">
            <SliderInput label="质量" min={1} max={100} unit="%" value={quality} onChange={setQuality} />
          </ParamField>
        </>
      )}
    </div>
  );
}

function PackMaterials({ type }: { type: PackType }) {
  const [bgTab, setBgTab] = useState('static');
  const cover = type !== 'custom' && (
    <div className="tpl-pack__cover">
      <PlaceholderImage image="ip-gouache" ratio="1:1" />
      <Button size={28} variant="on-media" leftIcon="ImageEditing" className="tpl-pack__edit">
        编辑
      </Button>
    </div>
  );
  return (
    <div className="tpl-pack__materials">
      {cover}
      <div className="tpl-pack__preview">
        {type === 'background' && (
          <Tabs variant="segment" value={bgTab} onChange={setBgTab} aria-label="背景素材">
            <TabItem value="static">静态 0/1</TabItem>
            <TabItem value="video">视频 1/1</TabItem>
          </Tabs>
        )}
        {type === 'background' && bgTab === 'static' ? (
          <Button leftIcon="Upload" variant="secondary">
            上传
          </Button>
        ) : (
          <VideoPlayer variant="card" src={type === 'badge' ? VIDEO : VIDEO_9x16} className={type === 'badge' ? 'tpl-pack__video tpl-pack__video--square' : 'tpl-pack__video'} />
        )}
      </div>
    </div>
  );
}

/** 视频封装：左类型、中素材、右规格，底栏左边时长、右边导出 */
export function PackagerTemplate() {
  const [type, setType] = useState<PackType>('vehicle');
  return (
    <TemplateFrame>
      <div className="tpl-tool tpl-tool--dialog">
        <DialogPanel
          size={1024}
          title="视频封装"
          className="tpl-pack"
          footer={
            <>
              <span className="tpl-pack__meta">时长：8 秒</span>
              <Button size={36} variant="primary">
                导出
              </Button>
            </>
          }
        >
          <div className="tpl-pack__body">
            {/* 类型：一列单选，当前项用选中底色（单行菜单项的规矩） */}
            <div className="tpl-pack__nav" role="listbox" aria-label="封装类型">
              {PACK_TYPES.map((t) => (
                <MenuItem key={t.value} selected={type === t.value} onClick={() => setType(t.value)}>
                  {t.label}
                </MenuItem>
              ))}
            </div>
            <PackMaterials key={type} type={type} />
            <PackInspector key={`s-${type}`} type={type} />
          </div>
        </DialogPanel>
      </div>
    </TemplateFrame>
  );
}
