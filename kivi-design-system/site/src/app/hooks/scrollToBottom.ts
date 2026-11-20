/*
  滚到底的动画（11-19，创作页「回到底部」、新记录往上推）。
  不用浏览器的 scrollTo({ behavior: 'smooth' })：部分环境里它不动，曲线和时长也不归我们管。
  这里按动效变量走：屏幕内移动 ease-in-out（--motion-ease-in-out = cubic-bezier(0.4, 0, 0.2, 1)），时长 --motion-duration-400；
  系统开了「减少动态效果」时变量是 0ms，直接跳过去。目标每帧重算，动画途中内容又长高了也落到真正的底。
*/

/** cubic-bezier(x1, y1, x2, y2) 的缓动函数：给进度 t（0–1）求 y */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    // 牛顿法求 x 对应的参数 t
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}

const easeInOut = bezier(0.4, 0, 0.2, 1);

/** 读动效时长变量（毫秒） */
function motionMs(name: string, fallback: number) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? (v.endsWith('s') && !v.endsWith('ms') ? n * 1000 : n) : fallback;
}

const running = new WeakMap<HTMLElement, number>();

/** 把可滚动的元素滚到最下面（动画）。再调一次会接着从当前位置开始 */
export function scrollToBottom(el: HTMLElement) {
  const prev = running.get(el);
  if (prev) cancelAnimationFrame(prev);
  const ms = motionMs('--motion-duration-400', 400);
  const from = el.scrollTop;
  const bottom = () => el.scrollHeight - el.clientHeight;
  if (ms <= 0 || Math.abs(bottom() - from) < 1) {
    el.scrollTop = bottom();
    return;
  }
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / ms);
    el.scrollTop = from + (bottom() - from) * easeInOut(p);
    if (p < 1) running.set(el, requestAnimationFrame(step));
    else running.delete(el);
  };
  running.set(el, requestAnimationFrame(step));
}

/** 正在往底部滚（动画途中）：页面算「在不在底部」时当作在底部，免得「回到底部」闪一下 */
export const isScrollingToBottom = (el: HTMLElement) => running.has(el);
