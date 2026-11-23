import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
import { PixelBlast } from './pixel-blast';

/*
  创作首页输入框后面的两层背景：像素云（HomeAtmosphere，在用）和流动底（ComposerMotion，先关着）。搬自原来的 create-home.tsx，没改样子。
*/

/**
 * 输入框的流动底（11-11 用户要看效果，照即梦首页输入框里那层；扩到整屏试过，效果不好撤回了）：Paper Shaders 的 MeshGradient（Apache-2.0），参数照即梦深色那套（颜色换成品牌绿色调），
 * 记录在 page-notes/jimeng-motion-background.md。铺满输入框外壳、在内容下面，准备好了淡入；系统开了「减少动态效果」不出（底是原来的玻璃）
 */
const MOTION = {
  // Figma 没变量：着色器要的颜色。即梦是蓝青调（#151D21 #212A2E #263034 #0F161A），11-11 用户要带品牌绿：
  // 每个色的 OKLCH 色相换成品牌绿 #2BFF75 的（149°）、彩度 × 1.4；用户又要渐变弱一点：四色亮度往平均值收 25%（平均亮度不变）
  colors: ['#172018', '#202A21', '#242E25', '#121A13'],
  // 流动也弱一点（用户定）：即梦是 distortion 0.25、swirl 0.6、speed 1.4
  distortion: 0.2,
  swirl: 0.5,
  scale: 2.8,
  speed: 1.1,
  frame: 9062243.995, // 起始时间固定，每次打开画面一样
  grainMixer: 0,
  grainOverlay: 0,
};

/** 输入框流动底先关掉看看（11-16 用户：背景已经有像素云了），要恢复改成 true */
export const SHOW_COMPOSER_MOTION = false;

export function ComposerMotion() {
  const [reduce, setReduce] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduce(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  // 挂上后下一帧再淡入，免得着色器还没画就露出黑块
  useEffect(() => {
    if (reduce) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [reduce]);
  if (reduce) return null;
  return (
    <div className="tpl-home__motion" data-ready={ready || undefined} aria-hidden>
      <MeshGradient className="tpl-home__motion-shader" {...MOTION} />
    </div>
  );
}

/**
 * 输入框后面的背景（11-16 用户定）：先照美图设计室做过一版点阵，后来换成 React Bits 的 Pixel Blast（像素云，白色、不要开场动画），
 * 代码在 pixel-blast.tsx。铺满页面宽，从顶到输入框下面 52，底部渐隐，跟着页面滚走
 */
const ATMOSPHERE_BELOW = 52;

export function HomeAtmosphere({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const page = wrap?.parentElement;
    if (!wrap || !page) return;
    // 输入框不一定和背景同一次挂上（线上打包后第一次量时它还是空的，背景一直是 0 高、像素云不出），
    // 所以每次量都现取；没取到就过一会儿再量（用定时器不用 requestAnimationFrame：后台标签页里后者不跑）。
    // 量到输入框有高度后就定住，之后输入框自己变高（参考区展开全部、提示词多行）背景不跟着变：
    // 跟着变的话像素云每帧重建画布、图案跟着拉伸，还掉帧（11-23）。只有页面变宽变窄时重量
    let retry = 0;
    let watched: HTMLElement | null = null;
    let settled = false;
    let settle = 0;
    let width = page.clientWidth;
    const measure = () => {
      const target = targetRef.current;
      if (!target) {
        retry = window.setTimeout(measure, 16);
        return;
      }
      if (watched !== target) {
        watched = target;
        settled = false;
        window.clearTimeout(settle);
        settle = 0;
        targetRo.observe(target);
      }
      const rect = target.getBoundingClientRect();
      // 刚挂上的半秒里还跟着变（字体、组件自己量完会再变一次），之后定住
      if (rect.height > 0 && !settle) settle = window.setTimeout(() => (settled = true), 500);
      setHeight(Math.max(1, rect.bottom - page.getBoundingClientRect().top + ATMOSPHERE_BELOW));
    };
    const targetRo = new ResizeObserver(() => {
      if (!settled) measure();
    });
    const pageRo = new ResizeObserver(() => {
      if (page.clientWidth === width) return;
      width = page.clientWidth;
      measure();
    });
    measure();
    pageRo.observe(page);
    return () => {
      window.clearTimeout(retry);
      window.clearTimeout(settle);
      targetRo.disconnect();
      pageRo.disconnect();
    };
  }, [targetRef]);
  return (
    <div ref={wrapRef} className="tpl-home__atmosphere" style={height != null ? { height } : undefined} aria-hidden>
      {height != null && <PixelBlast className="tpl-home__pixel-blast" />}
    </div>
  );
}
