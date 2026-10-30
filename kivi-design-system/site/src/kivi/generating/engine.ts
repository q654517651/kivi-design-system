/*
  KIVI · 生成中：点阵引擎（V2）
  把 2026-10-29 定稿演示（archive/demos/generating-dots-v2.html）搬成 TypeScript。
  只管算和画，不碰 React。时间用「时间线秒」：1× 速度下一轮 5.8 秒，速度由外面乘进时间里。

  三个方案（effect），选哪个由外面传进来。每次生成在前两个里随机选一个，减少动态效果时用第三个
    twinkle  方案一 星点闪烁：点不飞。图标上的点和背景星点轮流淡入淡出
    drift    方案二 斜飘：图标往右上约 35° 飘散、变淡，星点亮起；汇聚时点从左下飘回图标
    sheen    方案三 静态扫光：图标拼好不动，没有星点，只有扫光循环；节奏和一轮一样

  背景星点：每张 16% 的格子是候选，亮不亮看一张往右上滚动的噪波（单纯形噪声三层叠加），白处亮、黑处灭。
  成形时只剩几颗。每轮换一张噪波，成形段里渐变过去。一次多张时共用一片噪波，按整排的坐标算。
  单个和一次多张是同一套，只是格子数不同：每张比左边一张晚 TILE_LAG 时间线秒，扫光也跟着错开。

  一轮四段（秒）：星点 1.6 → 汇聚 1.4 → 成形 1.6 → 散开 1.2，共 5.8
*/
import { SHAPES, type GeneratingType } from './shapes';

export type GeneratingColor = 'brand' | 'white';
/** 方案一 星点闪烁 / 方案二 斜飘 / 方案三 静态扫光 */
export type GeneratingEffect = 'twinkle' | 'drift' | 'sheen';

/** 一轮四段的时长，秒，1× 速度 */
export const GENERATING_PHASES = { stars: 1.6, converge: 1.4, hold: 1.6, scatter: 1.2 } as const;
/** 一轮总时长，秒，1× 速度 */
export const GENERATING_CYCLE = 5.8;

const PH = GENERATING_PHASES;
const CYCLE = GENERATING_CYCLE;
const TAU = Math.PI * 2;

// 高斯扩散的宽度：飘动时宽，成形时窄
const SIG_FLOW = 0.6;
const SIG_HOLD = 0.4;
// 一次多张：每张比左边一张晚多少时间线秒（0.5× 速度下 200ms）
const TILE_LAG = 0.1;
// 扫光：汇聚结束前 0.25 秒开始，扫 1.9 秒，每张各扫一道
const SHEEN_START = PH.stars + PH.converge - 0.25;
const SHEEN_DURATION = 1.9;
// 方案一：图标点亮起 0.45 秒（先快后慢，冲到 1.12 倍再落回），熄灭 0.6 秒（先慢后快）
const FADE_IN = 0.45;
const FADE_OUT = 0.6;
// 星点：STAR_P 的格子是候选；门槛在 TH_OPEN（铺开）和 TH_CLOSED（收起，只剩噪波最亮处几颗）之间随阶段变；
// 每颗星点的亮度用 STAR_ST 秒左右缓入缓出地追上噪波，噪波变得再快也不会一下亮一下灭
const STAR_P = 0.16;
const TH_OPEN = 0.5;
const TH_CLOSED = 1.05;
const TH_W = 0.3;
const STAR_ST = 0.4;
// 噪波一格多大、滚多快，单位 px、px/秒（按 256 的格子），每轮在这附近随机
const NOISE_S = 100;
const NOISE_V = 38;
// 噪波三层叠起来（演示里的「多」），每层比上一层细一倍多、滚得快一点
const NOISE_OCT = [0.45, 0.33, 0.22];
const NOISE_OFF = [[0, 0], [5.3, 1.7], [-3.1, 7.9]];
// 各层权重叠起来的起伏统一成同样大（标准差 0.17），门槛不用跟着改
const NOISE_GAIN = 0.17 / (0.38 * Math.hypot(...NOISE_OCT));
// 方案二：飘进来 1.0 秒、飘走 0.85 秒，方向往右上（canvas 的 y 向下，所以是负角），比 45° 平一点
const FLY_IN = 1.0;
const FLY_OUT = 0.85;
const FLY_ANG = (-35 * Math.PI) / 180;
/** 点距、图标这些尺寸以 256 边长为准，更小的格子按比例缩，最小缩到 1/4 */
const REF_SIZE = 256;
const MIN_SCALE = 0.25;

type Rgb = [number, number, number];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** 两个整数换一个 0–1 的数，同样的输入总是同样的结果 */
const hash = (a: number, b: number) => {
  let h = Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b + 0x7f4a7c15) | 0, 0x85ebca6b);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 2D 单纯形噪声，大约 -1 到 1，标准差约 0.38。没有值噪声那种横平竖直的方块
const GX: number[] = [];
const GY: number[] = [];
for (let i = 0; i < 8; i++) {
  GX.push(Math.cos((i * Math.PI) / 4));
  GY.push(Math.sin((i * Math.PI) / 4));
}
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const grad = (a: number, b: number, px: number, py: number, s: number) => {
  const h = (hash(a + b * 57731, s) * 8) | 0;
  return GX[h] * px + GY[h] * py;
};
function snoise(x: number, y: number, s: number): number {
  const k = (x + y) * F2;
  const i = Math.floor(x + k);
  const j = Math.floor(y + k);
  const t = (i + j) * G2;
  const x0 = x - (i - t);
  const y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0;
  const j1 = 1 - i1;
  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;
  let n = 0;
  let q = 0.5 - x0 * x0 - y0 * y0;
  if (q > 0) {
    q *= q;
    n += q * q * grad(i, j, x0, y0, s);
  }
  q = 0.5 - x1 * x1 - y1 * y1;
  if (q > 0) {
    q *= q;
    n += q * q * grad(i + i1, j + j1, x1, y1, s);
  }
  q = 0.5 - x2 * x2 - y2 * y2;
  if (q > 0) {
    q *= q;
    n += q * q * grad(i + 1, j + 1, x2, y2, s);
  }
  return 70 * n;
}

/** 平滑追随：o.m 从静止开始加速、再减速停到 target（缓入缓出），大约 st 秒到位，速度记在 o.v */
function damp(o: { m: number; v: number }, target: number, st: number, dt: number) {
  const w = 2 / st;
  const x = w * dt;
  const e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const ch = o.m - target;
  const tmp = (o.v + w * ch) * dt;
  o.v = (o.v - w * tmp) * e;
  let out = target + (ch + tmp) * e;
  if (target - o.m > 0 === out > target) {
    out = target;
    o.v = 0;
  }
  o.m = out;
}

// ---------- 颜色：从 tokens.css 读 ----------

export interface Palette {
  /** 品牌渐变起点，--color-brand-gradient-1 */
  from: Rgb;
  /** 品牌渐变终点，--color-brand-gradient-2 */
  to: Rgb;
  /** 白色，--color-text-fill-primary */
  white: Rgb;
  /** 底层网点，--color-bg-fill-container-light-1（白 8%） */
  lattice: string;
}

// 变量读不到时的备用值，和 tokens.css 一致
const FALLBACK: Palette = { from: [206, 255, 93], to: [43, 255, 117], white: [255, 255, 255], lattice: 'rgba(255, 255, 255, 0.08)' };

/** 把 CSS 变量解析成实际颜色：借一个 span 让浏览器算，变量套变量也能读 */
function resolveColor(host: HTMLElement, name: string): string | null {
  if (!getComputedStyle(host).getPropertyValue(name).trim()) return null;
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  probe.style.display = 'none';
  host.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value || null;
}

function toRgb(css: string | null): Rgb | null {
  const m = css && /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(css);
  return m ? [Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3])] : null;
}

export function readPalette(host: HTMLElement): Palette {
  return {
    from: toRgb(resolveColor(host, '--color-brand-gradient-1')) ?? FALLBACK.from,
    to: toRgb(resolveColor(host, '--color-brand-gradient-2')) ?? FALLBACK.to,
    white: toRgb(resolveColor(host, '--color-text-fill-primary')) ?? FALLBACK.white,
    lattice: resolveColor(host, '--color-bg-fill-container-light-1') ?? FALLBACK.lattice,
  };
}

// ---------- 布局和每帧设置 ----------

export interface FieldLayout {
  /** 画布的 CSS 像素尺寸 */
  width: number;
  height: number;
  type: GeneratingType;
  /** 几张格子并排，单个是 1 */
  count: number;
  /** 格子之间的缝，CSS 像素 */
  gap: number;
  /** 每个格子的圆角，用来裁掉格子之外的光晕 */
  radius: number;
  /** 点距，参照 256 边长 */
  spacing: number;
  seed: number;
  palette: Palette;
  dpr: number;
}

export interface FrameSettings {
  effect: GeneratingEffect;
  color: GeneratingColor;
  /** 光晕强度 0–1 */
  glow: number;
}

interface Target {
  x: number;
  y: number;
  amp: number;
  /** 所在格子的中心 */
  cx: number;
  cy: number;
  /** 第几张 */
  ti: number;
}

interface Tile {
  x0: number;
  x1: number;
  ox: number;
  oy: number;
  base: number;
  cx: number;
  cy: number;
}

/** 图标上的一个点（lag > 0 的是跟在后面的拖尾点，只有方案二用） */
interface IconPoint {
  t: Target;
  /** 对应第几个目标，用来抽随机数 */
  lead: number;
  lag: number;
  a: number;
  seed: number;
}

/** 背景星点：m 是现在的亮度（追着噪波走），v 是追的速度 */
interface Star {
  ti: number;
  x: number;
  y: number;
  sa: number;
  tf: number;
  seed: number;
  jit: number;
  m: number;
  v: number;
}

/** 一轮的噪波：换种子，大小、方向、快慢也在一个小范围里变 */
interface NoiseCfg {
  s: number;
  size: number;
  v: number;
  cx: number;
  cy: number;
}

/** 某一张在这一刻的噪波状态：门槛、本轮和下一轮的噪波、从本轮换到下一轮的进度 */
interface NoiseFrame {
  th: number;
  a: NoiseCfg;
  b: NoiseCfg;
  w: number;
}

/** 把图标按填充轮廓画到格子上，算每格被盖住多少，盖住够多的格子就是图标的点 */
function rasterIcon(type: GeneratingType, cols: number, rows: number, ccx: number, ccy: number, iconCells: number) {
  const S = 6;
  const cv = document.createElement('canvas');
  cv.width = cols * S;
  cv.height = rows * S;
  const c = cv.getContext('2d', { willReadFrequently: true });
  const out: { i: number; j: number; cov: number }[] = [];
  if (!c) return out;
  const sc = (S * iconCells) / 24;
  c.setTransform(sc, 0, 0, sc, (ccx + 0.5) * S - 12 * sc, (ccy + 0.5) * S - 12 * sc);
  c.fillStyle = '#fff';
  for (const it of SHAPES[type]) c.fill(new Path2D(it.d), it.evenodd ? 'evenodd' : 'nonzero');
  const data = c.getImageData(0, 0, cv.width, cv.height).data;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let sum = 0;
      for (let y = 0; y < S; y++) {
        let o = ((j * S + y) * cv.width + i * S) * 4 + 3;
        for (let x = 0; x < S; x++, o += 4) sum += data[o];
      }
      const cov = sum / (S * S * 255);
      if (cov > 0.3) out.push({ i, j, cov });
    }
  }
  return out;
}

/** 一片点阵，可以由一张或几张并排的格子组成，格子之间的缝不画点 */
export class DotField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hasFilter: boolean;
  /** flyPos 的结果：x、y */
  private fp = new Float64Array(2);

  private layout!: FieldLayout;
  private w = 0;
  private h = 0;
  private tw = 0;
  private sp = 0;
  private scale = 1;
  private dpr = 1;
  private cols = 0;
  private rows = 0;
  private per = 0;
  private iconPx = 0;
  private shY = 0;
  private shW = 0;
  private rMin = 0;
  private rMax = 0;
  private tiles: Tile[] = [];
  private clip = new Path2D();
  private targets: Target[] = [];
  private icps: IconPoint[] = [];
  private stars: Star[] = [];
  private ncfgs = new Map<number, NoiseCfg>();
  /** 上一帧的时间，算星点追随的时间差用 */
  private lastT: number | null = null;
  /** 方案三：最近一次画的静止画面（没有扫光）用的颜色和光晕。重建、清空、换设置后对不上，就重新画一帧 */
  private stillKey: string | null = null;
  private acc = new Float32Array(0);
  private cI = new Float32Array(0);
  private cR = new Float32Array(0);
  private cG = new Float32Array(0);
  private cB = new Float32Array(0);
  private lattice: HTMLCanvasElement | null = null;
  private glowCv: HTMLCanvasElement | null = null;
  private glowCtx: CanvasRenderingContext2D | null = null;
  private glowImg: ImageData | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('GeneratingDots：浏览器不支持 canvas');
    this.ctx = ctx;
    this.hasFilter = typeof ctx.filter === 'string';
  }

  get ready() {
    return this.icps.length > 0;
  }

  build(layout: FieldLayout) {
    this.layout = layout;
    const { width: W, height: H, count: n, gap, radius, spacing, palette } = layout;
    const dpr = (this.dpr = layout.dpr);
    const tw = (W - (n - 1) * gap) / n;
    const th = H;
    const scale = (this.scale = Math.min(1, Math.max(MIN_SCALE, Math.min(tw, th) / REF_SIZE)));
    const sp = (this.sp = spacing * scale);
    this.w = W;
    this.h = H;
    this.tw = tw;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);

    const margin = sp * 0.8;
    const cols = (this.cols = Math.max(1, Math.floor((tw - 2 * margin) / sp) + 1));
    const rows = (this.rows = Math.max(1, Math.floor((th - 2 * margin) / sp) + 1));
    const per = (this.per = cols * rows);
    this.clip = new Path2D();
    this.tiles = [];
    for (let k = 0; k < n; k++) {
      const x0 = k * (tw + gap);
      this.tiles.push({ x0, x1: x0 + tw, ox: x0 + (tw - (cols - 1) * sp) / 2, oy: (th - (rows - 1) * sp) / 2, base: k * per, cx: x0 + tw / 2, cy: th / 2 });
      if (radius > 0 && typeof this.clip.roundRect === 'function') this.clip.roundRect(x0, 0, tw, th, radius);
      else this.clip.rect(x0, 0, tw, th);
    }
    const N = n * per;
    this.acc = new Float32Array(N);
    this.cI = new Float32Array(N);
    this.cR = new Float32Array(N);
    this.cG = new Float32Array(N);
    this.cB = new Float32Array(N);

    // 底层网点：整格常亮的小点
    const lat = (this.lattice = document.createElement('canvas'));
    lat.width = this.canvas.width;
    lat.height = this.canvas.height;
    const lc = lat.getContext('2d');
    const r0 = 0.65 * scale;
    if (lc) {
      lc.setTransform(dpr, 0, 0, dpr, 0, 0);
      lc.fillStyle = palette.lattice;
      lc.beginPath();
      for (const t of this.tiles) {
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const x = t.ox + i * sp;
            const y = t.oy + j * sp;
            lc.moveTo(x + r0, y);
            lc.arc(x, y, r0, 0, TAU);
          }
        }
      }
      lc.fill();
    }
    this.rMin = r0;
    this.rMax = sp * 0.18;

    // 光晕：每格一个像素，放大模糊后叠上去
    this.glowCv = document.createElement('canvas');
    this.glowCv.width = cols * n;
    this.glowCv.height = rows;
    this.glowCtx = this.glowCv.getContext('2d');
    this.glowImg = this.glowCtx ? this.glowCtx.createImageData(cols * n, rows) : null;

    // 每张格子中间一个图标
    const iconPx = (this.iconPx = 0.56 * Math.min(tw, th));
    const t0 = this.tiles[0];
    const cells = rasterIcon(layout.type, cols, rows, (t0.cx - t0.ox) / sp, (t0.cy - t0.oy) / sp, iconPx / sp);
    this.targets = [];
    this.tiles.forEach((t, ti) => {
      for (const c of cells) {
        this.targets.push({ x: t.ox + c.i * sp, y: t.oy + c.j * sp, amp: 0.55 + 0.45 * clamp01((c.cov - 0.3) / 0.5), cx: t.cx, cy: t.cy, ti });
      }
    });

    // 扫光：沿 45° 扫过图标
    this.shY = H / 2 - iconPx / 2;
    this.shW = 0.25 * iconPx;

    this.ncfgs.clear();
    this.lastT = null;
    this.stillKey = null;
    this.icps = [];
    this.stars = [];
    // 格子太小，拼不出图标：什么都不画
    if (this.targets.length === 0) return;
    this.makeStars(rng(layout.seed * 3 + 1));
  }

  /** 两层：图标每格一颗点（方案二再加四成跟在后面的拖尾点），和每张一层随机星点 */
  private makeStars(rand: () => number) {
    const T = this.targets;
    const nT = T.length;
    this.icps = T.map((t, i) => ({ t, lead: i, lag: 0, a: 1, seed: rand() }));
    for (let i = 0; i < Math.round(nT * 0.4); i++) {
      const lead = Math.floor(rand() * nT);
      this.icps.push({ t: T[lead], lead, lag: 0.04 + 0.12 * rand(), a: 0.35 + 0.3 * rand(), seed: rand() });
    }
    // 星点候选：每张 STAR_P 的格子。位置用整排的坐标，几张的噪波是连起来的
    const { cols, rows, sp } = this;
    this.tiles.forEach((tl, ti) => {
      for (let j = 1; j < rows - 1; j++) {
        for (let i = 1; i < cols - 1; i++) {
          if (hash(tl.base + j * cols + i, this.layout.seed + 501) >= STAR_P) continue;
          this.stars.push({
            ti,
            x: tl.ox + i * sp,
            y: tl.oy + j * sp,
            sa: 0.35 + 0.5 * rand(),
            tf: 1.5 + 2.5 * rand(),
            seed: rand(),
            jit: 0.2 * (rand() - 0.5),
            m: 0,
            v: 0,
          });
        }
      }
    });
  }

  /** 第 e 轮的噪波：换种子，大小、方向、快慢也在一个小范围里随机 */
  private noiseCfg(e: number): NoiseCfg {
    let c = this.ncfgs.get(e);
    if (c) return c;
    const r = rng(this.layout.seed * 8191 + e * 131071 + 17);
    const ang = FLY_ANG + (r() - 0.5) * 0.35;
    c = { s: Math.floor(r() * 1e6), size: NOISE_S * (0.85 + 0.3 * r()), v: NOISE_V * (0.85 + 0.3 * r()), cx: Math.cos(ang), cy: Math.sin(ang) };
    this.ncfgs.set(e, c);
    if (this.ncfgs.size > 8) this.ncfgs.delete(this.ncfgs.keys().next().value as number);
    return c;
  }

  /** 斜飘的一段路：从 (x0, y0) 沿 a 方向走 d，路上左右抖一点，r1、r2 决定抖多大、多密。结果放在 fp */
  private flyPos(x0: number, y0: number, d: number, a: number, e: number, r1: number, r2: number) {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const wob = Math.sin(Math.PI * e) * (0.8 + 2.2 * r1) * this.sp * Math.sin(TAU * (0.8 + 1.4 * r2) * e + r1 * TAU);
    this.fp[0] = x0 + ca * d - sa * wob;
    this.fp[1] = y0 + sa * d + ca * wob;
  }

  private splat(x: number, y: number, amp: number, sig: number) {
    const { cols, rows, acc, sp } = this;
    const R = sig > 0.6 ? 2 : 1;
    const reach = (R + 1) * sp;
    const inv = 1 / (2 * sig * sig);
    for (const t of this.tiles) {
      if (x < t.x0 - reach || x > t.x1 + reach) continue;
      const gx = (x - t.ox) / sp;
      const gy = (y - t.oy) / sp;
      const ci = Math.round(gx);
      const cj = Math.round(gy);
      if (cj < -R || cj > rows + R) return;
      const j1 = Math.min(rows - 1, cj + R);
      const i1 = Math.min(cols - 1, ci + R);
      for (let j = Math.max(0, cj - R); j <= j1; j++) {
        const dy = j - gy;
        for (let i = Math.max(0, ci - R); i <= i1; i++) {
          const dx = i - gx;
          acc[t.base + j * cols + i] += amp * Math.exp(-(dx * dx + dy * dy) * inv);
        }
      }
    }
  }

  /**
   * 方案三「静态扫光」：只画拼好的图标，每个点用自己的 amp，不呼吸、不闪、不飞；没有背景星点，没有拖尾点。
   * 扫光照常：每轮汇聚结束前 0.25 秒开始，扫 1.9 秒，一次多张每张错开 TILE_LAG。
   * 不在扫光时段、且上一帧已经画过这套设置下的静止画面，就不重画。
   */
  private frameSheen(time: number, settings: FrameSettings) {
    const tau = ((time % CYCLE) + CYCLE) % CYCLE;
    const sweeping = this.tiles.some((_, ti) => this.sheenPos(tau, ti) !== null);
    const key = `${settings.color}|${settings.glow}`;
    if (!sweeping && this.stillKey === key) return;
    this.acc.fill(0);
    for (const t of this.targets) this.splat(t.x, t.y, t.amp, SIG_HOLD);
    this.lastT = null;
    this.draw(time, tau, settings);
    this.stillKey = sweeping ? null : key;
  }

  /** 第 ti 张在 tau 这一刻的扫光位置，不在扫光时段是 null */
  private sheenPos(tau: number, ti: number): number | null {
    const f = ((((tau - ti * TILE_LAG - SHEEN_START) % CYCLE) + CYCLE) % CYCLE) / SHEEN_DURATION;
    return f >= 1 ? null : lerp(-1.5 * this.shW, 2 * this.iconPx + 1.5 * this.shW, f);
  }

  /**
   * 画 time 这一刻（时间线秒）的一帧。
   * 方案一：图标上的点在汇聚段一颗颗亮起，散开段一颗颗闪灭；星点在散开段亮起，汇聚段熄灭。
   * 方案二：图标往右上飘散、变淡，随后星点亮起；聚的时候星点熄灭，点从左下飘回图标。
   * 星点由一张往右上滚动的噪波控制，成形时只剩几颗。
   * 每张按自己的时间走（每张晚 TILE_LAG），每轮的亮灭时刻、飞行路线都用 hash 重抽。
   */
  frame(time: number, settings: FrameSettings) {
    if (!this.ready) return;
    if (settings.effect === 'sheen') {
      this.frameSheen(time, settings);
      return;
    }
    this.stillKey = null;
    this.acc.fill(0);
    const drift = settings.effect === 'drift';
    const { tiles, fp } = this;
    const T1 = PH.stars;
    const T2 = T1 + PH.converge;
    const T3 = T2 + PH.hold;
    const S = this.layout.seed * 4099;
    // 斜飘飞多远，乘格子边长
    const L0 = tiles.length > 1 ? 0.55 : 0.4;
    const L1 = 0.8;
    for (const p of this.icps) {
      const t = p.t;
      const tt = time - t.ti * TILE_LAG - p.lag;
      const cycle = Math.floor(tt / CYCLE);
      const tau = tt - cycle * CYCLE;
      const h = (k: number) => hash(cycle * 16 + k + S, p.lead);
      const breathe = 0.93 + 0.07 * Math.sin(tau * 5 + p.seed * 6);
      let x = t.x;
      let y = t.y;
      let amp = 0;
      let sig = SIG_HOLD;
      if (!drift) {
        if (p.lag) continue;
        const on = T1 + 0.1 + h(1) * (PH.converge - 0.35);
        const off = T3 + h(2) * (PH.scatter - FADE_OUT - 0.05);
        if (tau < on || tau > off + FADE_OUT) continue;
        if (tau < off) {
          // 亮起：先快后慢，到 1.12 倍再落回
          const since = tau - on;
          amp = t.amp * (since < FADE_IN ? 1.12 * (1 - (1 - since / FADE_IN) ** 2) : 1 + 0.12 * Math.exp(-(since - FADE_IN) / 0.3)) * breathe;
        } else {
          // 熄灭：先慢后快淡出
          const q = (tau - off) / FADE_OUT;
          amp = t.amp * (1 - q * q) * breathe;
        }
      } else {
        // u：图标里沿飞的方向从左下 0 到右上 1。进来时左下先到，飘走时右上先走
        const u = clamp01(((t.x - t.cx) * Math.cos(FLY_ANG) + (t.y - t.cy) * Math.sin(FLY_ANG)) / (1.42 * this.iconPx) + 0.5);
        const ca = T1 + FLY_IN + (0.6 * u + 0.4 * h(1)) * (PH.converge - FLY_IN);
        const dep = T3 + (0.6 * (1 - u) + 0.4 * h(2)) * (PH.scatter - FLY_OUT);
        if (tau >= ca - FLY_IN && tau < ca) {
          // 从左下飘进来，越飘越慢，落位
          const e = (tau - ca + FLY_IN) / FLY_IN;
          const k = 1 - (1 - e) * (1 - e);
          this.flyPos(t.x, t.y, -(L0 + L1 * h(3)) * this.tw * (1 - k), FLY_ANG + (h(4) - 0.5) * 0.7, e, h(5), h(6));
          x = fp[0];
          y = fp[1];
          amp = t.amp * p.a * smooth(0, 0.5, e) * lerp(0.6, 1, e) * (p.lag ? 1 - smooth(0.6, 1, e) : 1);
          sig = lerp(SIG_FLOW, SIG_HOLD, e);
        } else if (tau >= ca && tau < dep) {
          // 成形：落位时闪一下，之后轻微呼吸
          if (p.lag) continue;
          const g = (tau - ca) / 0.12;
          amp = t.amp * (1 + 0.25 * g * Math.exp(1 - g)) * breathe;
        } else if (tau >= dep && tau < dep + FLY_OUT) {
          // 往右上飘走，越飘越快，变淡
          const e = (tau - dep) / FLY_OUT;
          this.flyPos(t.x, t.y, (L0 + L1 * h(7)) * this.tw * Math.pow(e, 1.6), FLY_ANG + (h(8) - 0.5) * 0.7, e, h(9), h(10));
          x = fp[0];
          y = fp[1];
          amp = t.amp * p.a * Math.pow(1 - e, 1.3) * (p.lag ? smooth(0, 0.25, e) : 1 + 0.2 * Math.sin(Math.PI * clamp01(e / 0.3)));
          sig = lerp(SIG_HOLD, SIG_FLOW, e);
        } else continue;
      }
      if (amp > 0.01) this.splat(x, y, amp, sig);
    }

    // 星点：噪波往飞的方向滚，白处的星点亮。门槛按每张自己的时间走：散开后放低（铺开），汇聚时抬高（收起），成形时只剩几颗。
    // 噪波每轮换一张，成形时星点最少，就在这段里从旧的慢慢换成新的
    const sc = this.scale;
    const nf: NoiseFrame[] = tiles.map((_, ti) => {
      const tt = time - ti * TILE_LAG;
      const cyc = Math.floor(tt / CYCLE);
      const tau = tt - cyc * CYCLE;
      let k: number;
      if (tau < T1) k = 0;
      else if (tau < T2) k = ease((tau - T1) / PH.converge);
      else if (tau < T3) k = 1;
      else {
        const d = drift ? 0.35 : 0;
        k = 1 - ease(clamp01((tau - T3 - d) / (PH.scatter - d)));
      }
      const w = tau < T2 ? 0 : tau < T3 ? ease((tau - T2) / PH.hold) : 1;
      return { th: lerp(TH_OPEN, TH_CLOSED, k), a: this.noiseCfg(cyc), b: this.noiseCfg(cyc + 1), w };
    });
    // 几层噪波叠起来，细的层滚得快一点，看起来在慢慢变
    const field = (c: NoiseCfg, x: number, y: number) => {
      const ns = 1 / (c.size * sc);
      const dx = c.cx * c.v * sc * time;
      const dy = c.cy * c.v * sc * time;
      let v = 0;
      for (let l = 0, f = 1; l < NOISE_OCT.length; l++, f *= 2.1) {
        const q = 1 + 0.15 * l;
        v += NOISE_OCT[l] * snoise((x - q * dx) * ns * f + NOISE_OFF[l][0], (y - q * dy) * ns * f + NOISE_OFF[l][1], c.s + l);
      }
      return v * NOISE_GAIN;
    };
    // 某处的噪波亮度 0–1。换噪波时两张混合，起伏会变小，按混合比例放大回来
    const noiseAt = (f: NoiseFrame, x: number, y: number) => {
      let v = f.w < 1 ? field(f.a, x, y) : 0;
      if (f.w > 0) v = lerp(v, field(f.b, x, y), f.w) / Math.hypot(f.w, 1 - f.w);
      return clamp01(0.5 + v * 1.8);
    };
    // 暂停时不动；刚开始或隔了很久（滚出屏幕再回来）就直接到位
    const dt = this.lastT === null ? -1 : time - this.lastT;
    this.lastT = time;
    const snap = dt < 0 || dt > 0.5;
    for (const s of this.stars) {
      const f = nf[s.ti];
      const n = noiseAt(f, s.x, s.y);
      const target = smooth(f.th - TH_W / 2, f.th + TH_W / 2, n + s.jit);
      if (snap) {
        s.m = target;
        s.v = 0;
      } else if (dt > 0) damp(s, target, STAR_ST, dt);
      if (s.m <= 0.002) continue;
      const amp = s.sa * s.m * (0.55 + 0.45 * Math.sin(time * s.tf + s.seed * 40) ** 2);
      if (amp > 0.01) this.splat(s.x, s.y, amp, SIG_HOLD);
    }
    this.draw(time, ((time % CYCLE) + CYCLE) % CYCLE, settings);
  }

  private draw(time: number, tau: number, settings: FrameSettings) {
    const { ctx, dpr, w, h, cols, rows, sp, acc, cI, cR, cG, cB, tiles } = this;
    const { from, to, white } = this.layout.palette;
    const gimg = this.glowImg;
    const data = gimg?.data;
    const gw = cols * tiles.length;
    const useWhite = settings.color === 'white';
    // 渐变方向从 45° 起慢慢摆动；方案三是静止画面，不摆
    const ang = Math.PI / 4 + (settings.effect === 'sheen' ? 0 : 0.55 * Math.sin(time * 0.45));
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const half = 0.5 * Math.hypot(w, h);
    // 扫光：每张各扫一道，沿 45° 扫过图标，跟着每张错开的时间
    const shW = this.shW;
    const icHalf = this.iconPx / 2;
    const shPos = tiles.map((_, ti) => this.sheenPos(tau, ti));

    for (let ti = 0; ti < tiles.length; ti++) {
      const t = tiles[ti];
      const sPos = shPos[ti];
      for (let j = 0; j < rows; j++) {
        const y = t.oy + j * sp;
        for (let i = 0; i < cols; i++) {
          const k = t.base + j * cols + i;
          const o = (j * gw + ti * cols + i) * 4;
          const a = acc[k];
          if (a < 0.02) {
            cI[k] = 0;
            if (data) data[o + 3] = 0;
            continue;
          }
          const x = t.ox + i * sp;
          let I = 1 - Math.exp(-1.5 * a);
          let boost = 0;
          if (sPos !== null) {
            const d = (x - t.cx + icHalf + (y - this.shY) - sPos) / shW;
            boost = Math.exp(-d * d);
          }
          let r: number;
          let g: number;
          let b: number;
          if (useWhite) {
            r = white[0];
            g = white[1];
            b = white[2];
          } else {
            const u = clamp01(0.5 + (0.5 * ((x - w / 2) * ca + (y - h / 2) * sa)) / half);
            r = lerp(from[0], to[0], u);
            g = lerp(from[1], to[1], u);
            b = lerp(from[2], to[2], u);
          }
          // 很亮的点和扫光扫到的点偏白
          const wm = clamp01(boost * 0.7 * I + Math.max(0, I - 0.82) * 2.2) * 0.85;
          r = lerp(r, 255, wm);
          g = lerp(g, 255, wm);
          b = lerp(b, 255, wm);
          I = Math.min(1, I + boost * 0.25 * I);
          cI[k] = I;
          cR[k] = r;
          cG[k] = g;
          cB[k] = b;
          if (data) {
            data[o] = r;
            data[o + 1] = g;
            data[o + 2] = b;
            data[o + 3] = Math.pow(I, 1.4) * 255;
          }
        }
      }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.clip(this.clip);
    if (this.lattice) ctx.drawImage(this.lattice, 0, 0, w, h);

    // 光晕：每格一个像素，放大后模糊，叠在点下面
    if (settings.glow > 0 && this.glowCtx && this.glowCv && gimg) {
      this.glowCtx.putImageData(gimg, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = settings.glow;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (this.hasFilter) ctx.filter = `blur(${(sp * 0.6).toFixed(1)}px)`;
      for (let ti = 0; ti < tiles.length; ti++) {
        const t = tiles[ti];
        ctx.drawImage(this.glowCv, ti * cols, 0, cols, rows, t.ox - sp / 2, t.oy - sp / 2, cols * sp, rows * sp);
      }
      ctx.restore();
    }

    // 点：不透明度从 0 起，不跳
    const { rMin, rMax } = this;
    for (const t of tiles) {
      for (let j = 0; j < rows; j++) {
        const y = t.oy + j * sp;
        for (let i = 0; i < cols; i++) {
          const k = t.base + j * cols + i;
          const I = cI[k];
          if (I <= 0) continue;
          ctx.fillStyle = `rgba(${cR[k] | 0},${cG[k] | 0},${cB[k] | 0},${(0.15 * Math.min(1, I / 0.1) + 0.85 * I).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(t.ox + i * sp, y, rMin + (rMax - rMin) * Math.pow(I, 0.8), 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  /** 清空画布 */
  clear() {
    this.stillKey = null;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
