/*
  KIVI · 生成中：播放器
  管一块 canvas 的生命周期：量尺寸、起 requestAnimationFrame、看不见时停、卸载时清干净。
  时间按墙上时钟走，不按帧累加：同时挂上的几块点阵是同步的，看不见再回来也是接着当前进度，不是从头播。
*/
import { DotField, readPalette, type GeneratingColor, type GeneratingEffect } from './engine';
import type { GeneratingType } from './shapes';

export interface PlayerOptions {
  type: GeneratingType;
  /** 方案一 星点闪烁 / 方案二 斜飘 / 方案三 静态扫光 */
  effect: GeneratingEffect;
  count: number;
  gap: number;
  radius: number;
  spacing: number;
  seed: number;
  speed: number;
  color: GeneratingColor;
  glow: number;
  paused: boolean;
}

/** 格子短边小于这个值就不画，拼不出图标 */
const MIN_TILE = 24;
/** 最多每 12ms 画一帧，高刷屏上不白白多画 */
const MIN_FRAME_MS = 12;
/** 尺寸变了，等 100ms 没再变才重算 */
const RESIZE_DELAY = 100;

export class Player {
  private field: DotField;
  private opts: PlayerOptions | null = null;
  private structKey = '';
  private built = false;
  private visible = false;
  private width = 0;
  private height = 0;
  private raf = 0;
  private lastDraw = 0;
  private resizeTimer = 0;
  // 时钟：base 是锚点那一刻的时间线秒，anchor 是锚点的墙上时间，暂停时是 null
  private base = 0;
  private anchor: number | null = performance.now();
  private speed = 1;
  private ro: ResizeObserver;
  private io: IntersectionObserver;

  constructor(private root: HTMLElement, canvas: HTMLCanvasElement) {
    this.field = new DotField(canvas);
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(root);
    this.io = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1];
      this.visible = last.isIntersecting;
      this.sync();
    });
    this.io.observe(root);
  }

  /** 当前这一刻，时间线秒 */
  now(): number {
    return this.anchor === null ? this.base : this.base + ((performance.now() - this.anchor) / 1000) * this.speed;
  }

  update(opts: PlayerOptions) {
    const prev = this.opts;
    this.opts = opts;
    if (!prev || prev.speed !== opts.speed || prev.paused !== opts.paused) {
      this.base = this.now();
      this.speed = opts.speed;
      this.anchor = opts.paused ? null : performance.now();
    }
    // effect 不进这里：它每帧读，换方案不用重算
    const key = [opts.type, opts.count, opts.gap, opts.radius, opts.spacing, opts.seed].join('|');
    if (key !== this.structKey) {
      this.structKey = key;
      this.built = false;
      this.rebuild();
    }
    this.sync();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    clearTimeout(this.resizeTimer);
    this.ro.disconnect();
    this.io.disconnect();
    this.opts = null;
  }

  private measure() {
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    if (Math.abs(w - this.width) < 1 && Math.abs(h - this.height) < 1) return;
    this.width = w;
    this.height = h;
    clearTimeout(this.resizeTimer);
    // 第一次量到尺寸立刻画；之后改尺寸（比如拖节点边角）等一下再重算
    if (!this.built) this.rebuild();
    else this.resizeTimer = window.setTimeout(() => this.rebuild(), RESIZE_DELAY);
  }

  private rebuild() {
    const o = this.opts;
    if (!o) return;
    const tile = (this.width - (o.count - 1) * o.gap) / o.count;
    if (tile < MIN_TILE || this.height < MIN_TILE) {
      this.built = false;
      this.field.clear();
      return;
    }
    this.field.build({
      width: this.width,
      height: this.height,
      type: o.type,
      count: o.count,
      gap: o.gap,
      radius: o.radius,
      spacing: o.spacing,
      seed: o.seed,
      palette: readPalette(this.root),
      dpr: Math.min(2, window.devicePixelRatio || 1),
    });
    this.built = this.field.ready;
    this.sync(true);
  }

  /** 该跑就跑，不该跑就停；停着的时候看得见就画一帧静态的。drawNow：重算完马上补一帧，免得空一帧 */
  private sync(drawNow = false) {
    const o = this.opts;
    if (!o) return;
    const run = this.built && this.visible && !o.paused;
    if (run) {
      if (!this.raf) this.raf = requestAnimationFrame(this.tick);
      if (drawNow) this.draw();
      return;
    }
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.built && this.visible) this.draw();
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);
    if (now - this.lastDraw < MIN_FRAME_MS) return;
    this.lastDraw = now;
    this.draw();
  };

  private draw() {
    const o = this.opts;
    if (!o) return;
    this.field.frame(this.now(), { effect: o.effect, color: o.color, glow: o.glow });
  }
}
