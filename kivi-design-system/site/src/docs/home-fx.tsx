import { useEffect, useRef } from 'react';

/*
  首页大标题的特效（只给网站首页用，不属于组件库）。
  照 React Bits（reactbits.dev，MIT + Commons Clause）的 Tech Text 移植成 TS，没装它的包（背景 Gradient ASCII 在 home-ascii.tsx）：
  - TechTitle：大标题，鼠标下的字母变成虚线描边、套上选框和「字母 宽 × 高」标注，选框外随机闪小方块、沿边跑两颗点；
    鼠标不在上面时选框自己慢慢扫过整行；字母能拖，松手弹回；点一下字母往上弹、带动旁边的。打开时直接显示，不播拼字进场（用户 11-05 定）。
  系统开了「减少动态效果」：标题不自己扫、不弹。
*/

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** 按时间常数逼近目标，帧率不同手感一样 */
const approach = (cur: number, target: number, dt: number, seconds: number) => cur + (target - cur) * (1 - Math.exp(-dt / seconds));

/** 整数哈希，返回 0–1 */
function hash(...vs: number[]) {
  let h = 2166136261;
  for (const v of vs) {
    h = Math.imul(h ^ (v | 0), 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// ---------- 标题：Tech Text ----------

const TITLE_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';
const TITLE_WEIGHT = 800;
const TITLE_SIZE = 120;
const LETTER_SPACING = -0.03;
const LABEL_FONT = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const SPRING = 320;
const BOUNCE = 0.4;
/** 没鼠标时选框自己扫的速度（原效果是 1，太快，放慢到 0.4） */
const SWEEP_SPEED = 0.4;
/** 选框外闪的小方块个数 */
const SPECKS = 15;

type Sprite = { image: HTMLCanvasElement; left: number; top: number };
type Glyph = {
  char: string;
  x: number;
  box: { x1: number; y1: number; x2: number; y2: number };
  offset: { x: number; y: number };
  velocity: { x: number; y: number };
  outline: number;
  fill: Sprite;
  dashes: Sprite;
};

type Ctx2D = CanvasRenderingContext2D & { letterSpacing?: string };

export function TechTitle({ text }: { text: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d') as Ctx2D | null;
    const probe = document.createElement('canvas').getContext('2d') as Ctx2D | null;
    if (!canvas || !ctx || !probe) return;
    const reduce = reducedMotion();
    // 选框、标注、进场方块和字一个颜色（照原效果，不另加色）
    let accent = '#fff';

    let w = 1;
    let h = 1;
    let dpr = 1;
    let size = TITLE_SIZE;
    let view = { left: 0, right: 0, top: 0, bottom: 0, baseline: 0 };
    let glyphs: Glyph[] = [];
    let ink = '#fff';
    let raf = 0;
    let last = 0;
    let alive = true;
    let pulse = 0;
    let dragging = -1;
    let clock = 0;
    let placed = false;
    let visible = true;
    const lens = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0, inside: false };
    const grab = { x: 0, y: 0 };
    const press = { x: 0, y: 0, time: 0, index: -1 };
    const frame = { x1: 0, y1: 0, x2: 0, y2: 0, alpha: 0, index: -1 };
    const kicks: { index: number; at: number; velocity: number }[] = [];

    const setFont = (c: Ctx2D, px: number) => {
      c.font = `${TITLE_WEIGHT} ${px}px ${TITLE_FONT}`;
      if ('letterSpacing' in c) c.letterSpacing = `${LETTER_SPACING * px}px`;
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
    };

    /** 一个字母画成小图：实心，或者虚线描边（只留轮廓外侧那半边线） */
    const sprite = (g: Pick<Glyph, 'char' | 'x' | 'box'>, stroke: boolean): Sprite => {
      const pad = 8;
      const left = g.box.x1 - pad;
      const top = g.box.y1 - pad;
      const image = document.createElement('canvas');
      image.width = Math.max(1, Math.ceil((g.box.x2 - g.box.x1 + pad * 2) * dpr));
      image.height = Math.max(1, Math.ceil((g.box.y2 - g.box.y1 + pad * 2) * dpr));
      const c = image.getContext('2d') as Ctx2D | null;
      if (!c) return { image, left, top };
      c.setTransform(dpr, 0, 0, dpr, -left * dpr, -top * dpr);
      setFont(c, size);
      if (stroke) {
        c.lineJoin = 'round';
        c.lineWidth = 3;
        c.strokeStyle = ink;
        c.setLineDash([4, 2]);
        c.strokeText(g.char, g.x, view.baseline);
        c.setLineDash([]);
        c.globalCompositeOperation = 'destination-out';
        c.fillText(g.char, g.x, view.baseline);
      } else {
        c.fillStyle = ink;
        c.fillText(g.char, g.x, view.baseline);
      }
      return { image, left, top };
    };

    const layout = () => {
      ink = getComputedStyle(canvas).color || '#fff';
      accent = ink;
      setFont(probe, TITLE_SIZE);
      let m = probe.measureText(text);
      size = TITLE_SIZE * Math.min(1, (w * 0.92) / Math.max(1, m.actualBoundingBoxLeft + m.actualBoundingBoxRight));
      setFont(probe, size);
      m = probe.measureText(text);
      const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      const x = (w - inkW) / 2 + m.actualBoundingBoxLeft;
      const baseline = (h - inkH) / 2 + m.actualBoundingBoxAscent;
      view = { left: x - m.actualBoundingBoxLeft, right: x + m.actualBoundingBoxRight, top: baseline - m.actualBoundingBoxAscent, bottom: baseline + m.actualBoundingBoxDescent, baseline };
      const prev = glyphs;
      glyphs = [];
      let prefix = '';
      for (const char of Array.from(text)) {
        prefix += char;
        const own = probe.measureText(char);
        const gx = x + probe.measureText(prefix).width - own.width;
        if (!char.trim()) continue;
        const base = {
          char,
          x: gx,
          box: { x1: gx - own.actualBoundingBoxLeft, y1: baseline - own.actualBoundingBoxAscent, x2: gx + own.actualBoundingBoxRight, y2: baseline + own.actualBoundingBoxDescent },
        };
        const kept = prev[glyphs.length];
        glyphs.push({
          ...base,
          offset: kept?.char === char ? kept.offset : { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          outline: 0,
          fill: sprite(base, false),
          dashes: sprite(base, true),
        });
      }
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      layout();
      wake();
    };

    const blit = (art: Sprite, dx: number, dy: number) => ctx.drawImage(art.image, Math.round((art.left + dx) * dpr), Math.round((art.top + dy) * dpr));

    /** 鼠标下是哪个字母（左右 28 以内算） */
    const glyphAt = (x: number, y: number) => {
      if (y < view.top - 24 || y > view.bottom + 24) return -1;
      let best = -1;
      let bestD = Infinity;
      glyphs.forEach((g, i) => {
        const x1 = g.box.x1 + g.offset.x;
        const x2 = g.box.x2 + g.offset.x;
        const d = x < x1 ? x1 - x : x > x2 ? x - x2 : 0;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return bestD < 28 ? best : -1;
    };

    const crisp = (v: number) => (Math.round(v * dpr) + 0.5) / dpr;

    /** 选框上的一点：沿四条边走 */
    const perimeter = (dist: number) => {
      const fw = frame.x2 - frame.x1;
      const fh = frame.y2 - frame.y1;
      const total = 2 * (fw + fh);
      let d = ((dist % total) + total) % total;
      if (d < fw) return [frame.x1 + d, frame.y1];
      d -= fw;
      if (d < fh) return [frame.x2, frame.y1 + d];
      d -= fh;
      if (d < fw) return [frame.x2 - d, frame.y2];
      d -= fw;
      return [frame.x1, frame.y2 - d];
    };

    /** 选框外随机闪的小方块：贴着四条边往外，大小 2–11，有的实心有的空心，闪一下就换位置 */
    const drawSpecks = (a: number) => {
      const fw = frame.x2 - frame.x1;
      const fh = frame.y2 - frame.y1;
      if (fw < 2 || fh < 2) return;
      const total = 2 * (fw + fh);
      const seed = frame.index + 1;
      const grid = 3;
      for (let k = 0; k < SPECKS; k++) {
        const period = 0.5 + hash(seed, k, 11) * 1.2;
        const t = pulse / period + hash(seed, k, 17);
        const cycle = Math.floor(t);
        const life = t - cycle;
        if (life > 0.7) continue;
        const d = hash(seed, k, cycle) * total;
        const [px, py] = perimeter(d);
        // 法线：在哪条边就往哪边外推
        let dd = ((d % total) + total) % total;
        let nx = 0;
        let ny = -1;
        if (dd >= fw) {
          dd -= fw;
          [nx, ny] = [1, 0];
          if (dd >= fh) {
            dd -= fh;
            [nx, ny] = [0, 1];
            if (dd >= fw) [nx, ny] = [-1, 0];
          }
        }
        const pick = hash(seed, k, cycle, 2);
        const sz = pick < 0.46 ? 2 : pick < 0.7 ? 3 : pick < 0.84 ? 5 : pick < 0.94 ? 8 : 11;
        const large = sz >= 8;
        const out = (large ? 9 : 4) + Math.floor(hash(seed, k, cycle, 1) * 5) * grid;
        const x = frame.x1 + Math.round((px + nx * out - frame.x1) / grid) * grid;
        const y = frame.y1 + Math.round((py + ny * out - frame.y1) / grid) * grid;
        const tone = hash(seed, k, cycle, 3);
        const blink = life < 0.06 || (life > 0.32 && life < 0.36) ? 0.35 : 1;
        ctx.globalAlpha = a * (large ? 0.3 + 0.4 * tone : 0.3 + 0.6 * tone) * blink;
        const left = Math.round(x - sz / 2);
        const top = Math.round(y - sz / 2);
        if (tone < 0.26 || (large && tone < 0.78)) {
          ctx.strokeRect(left + 0.5, top + 0.5, sz, sz);
          if (large && tone > 0.5) ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
        } else {
          ctx.fillRect(left, top, sz, sz);
        }
      }
    };

    /** 选框：细框 + 四角小方块 + 两颗沿边跑的点 + 左上「字母 宽 × 高」（拖开时显示位移） */
    const drawFrame = () => {
      const g = glyphs[frame.index];
      if (!g || frame.alpha < 0.01) return;
      const a = frame.alpha;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = accent;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      const moved = Math.hypot(g.offset.x, g.offset.y);
      if (moved > 1) {
        const hx = (g.box.x1 + g.box.x2) / 2;
        const hy = (g.box.y1 + g.box.y2) / 2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + g.offset.x, hy + g.offset.y);
        ctx.setLineDash([3, 4]);
        ctx.globalAlpha = 0.45 * a;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.7 * a;
        ctx.fillRect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4);
      }
      const x1 = crisp(frame.x1);
      const y1 = crisp(frame.y1);
      const x2 = crisp(frame.x2);
      const y2 = crisp(frame.y2);
      ctx.globalAlpha = 0.5 * a;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.globalAlpha = 0.95 * a;
      for (const [cx, cy] of [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]) ctx.fillRect(Math.round(cx) - 2, Math.round(cy) - 2, 5, 5);
      drawSpecks(a);
      const total = 2 * (frame.x2 - frame.x1 + frame.y2 - frame.y1);
      for (let j = 0; j < 2; j++) {
        const head = (pulse * 0.42 + j * 0.5) * total;
        for (let i = 0; i < 4; i++) {
          const [px, py] = perimeter(head - i * 6);
          const s = i === 0 ? 3 : 2;
          ctx.globalAlpha = a * [0.95, 0.55, 0.32, 0.16][i];
          ctx.fillRect(Math.round(px - s / 2), Math.round(py - s / 2), s, s);
        }
      }
      ctx.font = LABEL_FONT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.globalAlpha = 0.62 * a;
      const sign = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0');
      const label = moved > 1 ? `${sign(Math.round(g.offset.x))}, ${sign(Math.round(-g.offset.y))}` : `${g.char}  ${Math.round(g.box.x2 - g.box.x1)} × ${Math.round(g.box.y2 - g.box.y1)}`;
      ctx.fillText(label, Math.round(frame.x1), Math.round(frame.y1) - 7);
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    /** 点一下：这个字母往上弹，力度往两边一个个传下去 */
    const kick = (index: number) => {
      const strength = size * 11;
      kicks.push({ index, at: pulse, velocity: strength });
      for (let d = 1; d < glyphs.length; d++) {
        const v = strength * Math.pow(0.62, d);
        if (v < 30) break;
        for (const j of [index - d, index + d]) if (j >= 0 && j < glyphs.length) kicks.push({ index: j, at: pulse + d * 0.055, velocity: v });
      }
      wake();
    };

    const tick = (now: number) => {
      raf = 0;
      if (!alive) return;
      const dt = last ? Math.min(0.05, Math.max(0.001, (now - last) / 1000)) : 1 / 60;
      last = now;
      pulse += dt;

      for (let k = kicks.length - 1; k >= 0; k--) {
        if (kicks[k].at > pulse) continue;
        const g = glyphs[kicks[k].index];
        if (g) g.velocity.y -= kicks[k].velocity;
        kicks.splice(k, 1);
      }

      // 弹簧：拖开或被弹起的字母回到原位
      const damping = 2 * Math.sqrt(SPRING) * (1 - BOUNCE * 0.96);
      let moving = kicks.length > 0;
      glyphs.forEach((g, i) => {
        if (i === dragging) {
          g.offset.x = approach(g.offset.x, pointer.x - grab.x, dt, 0.03);
          g.offset.y = approach(g.offset.y, pointer.y - grab.y, dt, 0.03);
          g.velocity.x = g.velocity.y = 0;
          moving = true;
          return;
        }
        const { offset: o, velocity: v } = g;
        if (Math.abs(o.x) < 0.05 && Math.abs(o.y) < 0.05 && Math.hypot(v.x, v.y) < 0.5) {
          o.x = o.y = v.x = v.y = 0;
          return;
        }
        v.x += (-SPRING * o.x - damping * v.x) * dt;
        v.y += (-SPRING * o.y - damping * v.y) * dt;
        o.x += v.x * dt;
        o.y += v.y * dt;
        moving = true;
      });

      // 鼠标不在上面：镜头自己沿着整行来回扫
      const sweeping = !reduce && !pointer.inside && dragging < 0;
      if (sweeping) clock += dt * SWEEP_SPEED;
      let tx = pointer.x;
      let ty = pointer.y;
      if (sweeping) {
        tx = view.left + (view.right - view.left) * (0.5 - 0.5 * Math.cos(clock * 0.45));
        ty = view.top + (view.bottom - view.top) * (0.45 + 0.1 * Math.sin(clock * 0.8));
      }
      const active = (pointer.inside || sweeping || dragging >= 0);
      if (active && !placed) {
        lens.x = tx;
        lens.y = ty;
      }
      if (active) {
        const lag = pointer.inside ? 0.05 : 0.22;
        lens.x = approach(lens.x, tx, dt, lag);
        lens.y = approach(lens.y, ty, dt, lag);
      }
      placed = active;
      const focus = dragging >= 0 ? dragging : active ? glyphAt(lens.x, lens.y) : -1;
      if (focus >= 0) {
        const g = glyphs[focus];
        const b = { x1: g.box.x1 + g.offset.x - 6, y1: g.box.y1 + g.offset.y - 6, x2: g.box.x2 + g.offset.x + 6, y2: g.box.y2 + g.offset.y + 6 };
        if (frame.index < 0 || frame.alpha < 0.02) Object.assign(frame, b);
        const glide = focus === dragging ? 0.02 : 0.08;
        frame.x1 = approach(frame.x1, b.x1, dt, glide);
        frame.y1 = approach(frame.y1, b.y1, dt, glide);
        frame.x2 = approach(frame.x2, b.x2, dt, glide);
        frame.y2 = approach(frame.y2, b.y2, dt, glide);
        frame.index = focus;
      }
      frame.alpha = approach(frame.alpha, focus >= 0 ? 1 : 0, dt, 0.1);
      if (frame.alpha > 0.01 && frame.alpha < 0.99) moving = true;

      glyphs.forEach((g, i) => {
        const target = i === focus && i !== dragging ? 1 : 0;
        g.outline = approach(g.outline, target, dt, 0.09);
        if (Math.abs(g.outline - target) > 0.002) moving = true;
        else g.outline = target;
      });

      canvas.style.cursor = dragging >= 0 ? 'grabbing' : focus >= 0 && pointer.inside ? 'grab' : '';

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 拖开的字母：原位留一个虚线影子
      for (const g of glyphs) {
        const moved = Math.hypot(g.offset.x, g.offset.y);
        if (moved <= 1) continue;
        ctx.globalAlpha = Math.min(1, moved / 24) * 0.55;
        blit(g.dashes, 0, 0);
      }
      ctx.globalAlpha = 1;
      glyphs.forEach((g, i) => {
        if (g.outline < 0.999) {
          ctx.globalAlpha = 1 - g.outline;
          blit(g.fill, g.offset.x, g.offset.y);
        }
        if (g.outline > 0.001) {
          ctx.globalAlpha = g.outline;
          blit(g.dashes, g.offset.x, g.offset.y);
        }
        ctx.globalAlpha = 1;
      });
      drawFrame();

      // 选框里的点一直在跑，鼠标在上面就一直画
      if (visible && (moving || active || focus >= 0 || frame.alpha > 0.01)) raf = requestAnimationFrame(tick);
      else last = 0;
    };

    function wake() {
      if (raf || !alive || !visible) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    }

    const locate = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onMove = (e: PointerEvent) => {
      locate(e);
      pointer.inside = true;
      wake();
    };
    const onLeave = () => {
      if (dragging >= 0) return;
      pointer.inside = false;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      locate(e);
      pointer.inside = true;
      const index = (e.pointerType === 'mouse' && e.button !== 0) ? -1 : glyphAt(pointer.x, pointer.y);
      Object.assign(press, { x: pointer.x, y: pointer.y, time: performance.now(), index });
      if (index >= 0) {
        dragging = index;
        grab.x = pointer.x - glyphs[index].offset.x;
        grab.y = pointer.y - glyphs[index].offset.y;
        canvas.setPointerCapture?.(e.pointerId);
      }
      wake();
    };
    const onUp = (e: PointerEvent) => {
      if (dragging >= 0) {
        dragging = -1;
        canvas.releasePointerCapture?.(e.pointerId);
        const r = canvas.getBoundingClientRect();
        pointer.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      }
      // 短按不动 = 点一下
      if (e.type === 'pointerup' && press.index >= 0 && !reduce && performance.now() - press.time < 450) {
        const r = canvas.getBoundingClientRect();
        if (Math.hypot(e.clientX - r.left - press.x, e.clientY - r.top - press.y) < 6) kick(press.index);
      }
      press.index = -1;
      wake();
    };

    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerenter', onMove, { passive: true });
    canvas.addEventListener('pointerdown', onDown, { passive: true });
    canvas.addEventListener('pointerup', onUp, { passive: true });
    canvas.addEventListener('pointercancel', onUp, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    // 滚出屏幕就停，回来再跑
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(canvas);
    // 字体到了重新排一次
    document.fonts?.ready.then(() => alive && resize());
    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerenter', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [text]);

  return <canvas ref={ref} className="home-tech" aria-hidden="true" />;
}
