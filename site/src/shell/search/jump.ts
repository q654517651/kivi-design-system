import { useEffect, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import { KIND, type Kind } from './types';

// 搜到之后：切到那一页，等页面（懒加载）出来，滚到对应位置，闪一下。
//   标题 → 滚到标题
//   正文、表格行 → 滚到所在小节之后第一个文字对得上的段落 / 行（找不到就停在小节标题）
//   变量 → 那个变量的色块或变量名；图标 → 那个图标
// 页面里的演示（.shell-demo、.shell-pg）不参与找。闪的样式在 search.css 的 [data-search-hit]。

export interface JumpTarget {
  path: string;
  kind: Kind;
  anchor?: string;
  needle?: string;
}

let pending: { target: JumpTarget; at: number } | null = null;
const listeners = new Set<() => void>();

/** 先 navigate 到 target.path，再调这个。同一页也行 */
export function requestJump(target: JumpTarget) {
  pending = { target, at: Date.now() };
  listeners.forEach((f) => f());
}

const squash = (s: string) => s.replace(/\s+/g, '').toLowerCase();
const inDemo = (el: Element) => Boolean(el.closest('.shell-demo, .shell-pg'));

/** 在 root（所在小节标题）之后找对应的块；root 是 null 就整页找 */
function findBlock(main: HTMLElement, t: JumpTarget, root: HTMLElement | null): HTMLElement | null {
  if (t.kind === KIND.h2 || t.kind === KIND.h3 || t.kind === KIND.h4) return root;
  const needle = squash((t.needle ?? '').replace(/…$/, '')).slice(0, 48);
  if (!needle) return null;

  let found: HTMLElement[];
  if (t.kind === KIND.token) {
    // 色块和变量名按钮的 title 都是「复制 var(--x)」
    const el = Array.from(main.querySelectorAll<HTMLElement>('[title^="复制 var("]')).find((e) => e.title === `复制 var(${t.needle})`);
    return el ? (el.closest<HTMLElement>('tr') ?? el) : null;
  }
  if (t.kind === KIND.icon) {
    const el = Array.from(main.querySelectorAll<HTMLElement>('.ic-tile__name')).find((e) => squash(e.textContent ?? '') === needle);
    return el ? (el.closest<HTMLElement>('.ic-tile') ?? el) : null;
  }
  const sel = t.kind === KIND.row ? 'tr' : 'p, li, dd';
  found = Array.from(main.querySelectorAll<HTMLElement>(sel)).filter((el) => !inDemo(el) && squash(el.textContent ?? '').includes(needle));
  // 同样的字在别的小节也出现过：取所在小节之后的第一个
  const after = found.find((el) => !root || Boolean(root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
  return after ?? found[0] ?? null;
}

function flash(el: HTMLElement) {
  el.removeAttribute('data-search-hit');
  void el.offsetWidth; // 重新播一遍动画
  el.setAttribute('data-search-hit', '');
  window.setTimeout(() => el.removeAttribute('data-search-hit'), 2000);
}

function run(main: HTMLElement, t: JumpTarget): () => void {
  const timers: number[] = [];
  const cleanups: (() => void)[] = [];
  let done = false;
  let fallback = 0;

  const finish = (el: HTMLElement) => {
    if (done) return;
    done = true;
    mo.disconnect();
    window.clearTimeout(fallback);
    const heading = t.kind === KIND.h2 || t.kind === KIND.h3 || t.kind === KIND.h4;
    const reveal = () => el.scrollIntoView({ block: heading ? 'start' : 'center', behavior: 'auto' });
    reveal();
    flash(el);
    // 图片、演示还在加载，页面高度会变：隔一会儿再对一次。用户自己动了就不管
    let moved = false;
    const mark = () => {
      moved = true;
    };
    (['wheel', 'touchstart', 'keydown', 'mousedown'] as const).forEach((ev) => {
      window.addEventListener(ev, mark, { passive: true });
      cleanups.push(() => window.removeEventListener(ev, mark));
    });
    [250, 700].forEach((ms) => timers.push(window.setTimeout(() => !moved && reveal(), ms)));
    timers.push(window.setTimeout(() => cleanups.forEach((f) => f()), 900));
  };

  // 用 setTimeout 合并一阵连续的变化，不用 rAF：页面在后台（切到别的标签）时 rAF 不跑，跳转就卡住了
  let queued = false;
  const check = () => {
    queued = false;
    if (done) return;
    const root = t.anchor ? document.getElementById(t.anchor) : null;
    const block = findBlock(main, t, root);
    if (block) return finish(block);
    // 小节在、块还没找到：等页面不再变了（450ms）还没有，就停在小节标题
    if (root) {
      window.clearTimeout(fallback);
      fallback = window.setTimeout(() => finish(root), 450);
    }
  };
  const mo = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    timers.push(window.setTimeout(check, 30));
  });
  mo.observe(main, { childList: true, subtree: true });
  check();
  // 3 秒还没出来就放弃，别一直挂着
  timers.push(
    window.setTimeout(() => {
      if (!done) {
        const root = t.anchor ? document.getElementById(t.anchor) : null;
        if (root) finish(root);
        else {
          done = true;
          mo.disconnect();
        }
      }
    }, 3000),
  );

  return () => {
    done = true;
    mo.disconnect();
    window.clearTimeout(fallback);
    timers.forEach((id) => window.clearTimeout(id));
    cleanups.forEach((f) => f());
  };
}

/** 放在 Layout 里：有跳转请求、页面又对上了，就去找位置 */
export function useSearchJump(mainRef: RefObject<HTMLElement>) {
  const { pathname } = useLocation();
  useEffect(() => {
    let stop: (() => void) | undefined;
    const start = () => {
      const p = pending;
      if (!p || p.target.path !== pathname) return;
      pending = null;
      if (Date.now() - p.at > 5000) return; // 过期的请求（没跳成功）不要在以后突然触发
      stop?.();
      const main = mainRef.current;
      if (!main) return;
      if (p.target.kind === KIND.page) {
        window.scrollTo(0, 0);
        return;
      }
      stop = run(main, p.target);
    };
    listeners.add(start);
    start();
    return () => {
      listeners.delete(start);
      stop?.();
    };
  }, [pathname, mainRef]);
}
