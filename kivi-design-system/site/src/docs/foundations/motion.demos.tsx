import { Fragment, useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, Icon, IconButton, type IconName } from '@kivi';

// 动效页的演示。规范文字在 motion.mdx。
// 菜单、Tooltip、Toast、弹窗的正式组件在别的页，这里只示意动效，样式都带 mo- 前缀，写在下面的 CSS 里。
// 时长和缓动全部引用 tokens.css 的变量。

const STYLE_ID = 'mo-styles';

const CSS = `
/* 缓动、时长的小球 */
.mo-rows { display: grid; gap: var(--spacing-12); width: 100%; }
.mo-row { --mo-name: 120px; display: grid; grid-template-columns: var(--mo-name) 56px minmax(0, 1fr); align-items: center; gap: var(--spacing-16); }
.mo-row.mo-dur { grid-template-columns: var(--mo-name) minmax(0, 1fr); }
.mo-row b { font-size: var(--font-size-13); font-weight: var(--font-weight-medium); }
.mo-row small { display: block; color: var(--color-text-fill-tertiary); font-size: var(--font-size-12); line-height: var(--font-line-height-20); }
.mo-curve { width: 56px; height: 56px; color: var(--color-text-fill-tertiary); }
.mo-track { position: relative; height: 24px; border-radius: var(--border-radius-round); background: var(--color-bg-fill-container-light-1); }
.mo-dot { position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: var(--border-radius-round); background: var(--color-brand-solid); }
.mo-ease .mo-dot { transition: left 1000ms var(--ease); }
.mo-ease.is-end .mo-dot { left: calc(100% - 20px); }
.mo-dur .mo-dot { transition: left var(--dur) var(--motion-ease-in-out); }
.mo-dur.is-end .mo-dot { left: min(calc(4px + var(--to)), calc(100% - 20px)); }
.mo-dur .mo-dot.is-color { transition: background-color var(--dur) var(--motion-ease-in-out); }
.mo-dur.is-end .mo-dot.is-color { left: 4px; background: var(--color-text-fill-primary); }
.mo-dur .mo-dot.is-fade { transition: opacity var(--dur) var(--motion-ease-in); }
.mo-dur.is-end .mo-dot.is-fade { left: 4px; opacity: 0; transition: opacity var(--dur) var(--motion-ease-in); }
.mo-controls { display: flex; justify-content: flex-end; width: 100%; }
@media (max-width: 640px) {
  .mo-row { --mo-name: 96px; grid-template-columns: var(--mo-name) minmax(0, 1fr); }
  .mo-curve { display: none; }
}

/* 场景演示的舞台 */
.mo-stage { position: relative; display: flex; align-items: flex-start; justify-content: center; width: 100%; min-height: 200px; padding-top: 24px; }
.mo-stage.is-bottom { align-items: flex-end; padding-bottom: 24px; }

/* Tooltip：悬停 500ms 后 150ms ease-out 淡入，离开 100ms ease-in 淡出 */
.mo-tip-anchor { position: relative; display: inline-flex; }
.mo-tip {
  position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%);
  height: 32px; padding: 6px var(--spacing-12); border-radius: var(--border-radius-8);
  background: var(--color-bg-fill-popup); color: var(--color-text-fill-primary);
  font-size: var(--font-size-12); line-height: var(--font-line-height-20); white-space: nowrap;
  pointer-events: none; opacity: 0;
  transition: opacity var(--motion-duration-100) var(--motion-ease-in);
}
.mo-tip-anchor:hover .mo-tip { opacity: 1; transition: opacity var(--motion-duration-150) var(--motion-ease-out) 500ms; }

/* 菜单：200ms ease-out 出现，150ms ease-in 消失 */
.mo-menu-wrap { position: relative; }
.mo-menu {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 2;
  min-width: 160px; padding: var(--spacing-4); border-radius: var(--border-radius-12);
  outline: var(--border-width-1) solid var(--color-border-subtle); outline-offset: calc(var(--border-width-1) * -1);
  background: var(--color-bg-fill-glass); -webkit-backdrop-filter: blur(var(--effect-glass-blur)); backdrop-filter: blur(var(--effect-glass-blur));
  opacity: 0; visibility: hidden; transform: translateY(-4px) scale(0.96); transform-origin: 0 0;
  transition: opacity var(--motion-duration-150) var(--motion-ease-in), transform var(--motion-duration-150) var(--motion-ease-in), visibility 0s linear var(--motion-duration-150);
}
.mo-menu.is-open { opacity: 1; visibility: visible; transform: none; transition: opacity var(--motion-duration-200) var(--motion-ease-out), transform var(--motion-duration-200) var(--motion-ease-out), visibility 0s; }
.mo-menu-item {
  display: flex; align-items: center; gap: var(--spacing-8); width: 100%; height: 36px; padding: 0 var(--spacing-12);
  border: 0; border-radius: var(--border-radius-8); background: transparent; color: var(--color-text-fill-primary);
  font: inherit; font-size: var(--font-size-13); line-height: var(--font-line-height-20); text-align: left; cursor: pointer;
  transition: background-color var(--motion-duration-100) var(--motion-ease-in-out);
}
.mo-menu-item:hover { background: var(--color-bg-fill-container-light-2-hover); }
.mo-menu-item.is-danger { color: var(--color-status-danger); }
.mo-menu-item.is-danger:hover { background: var(--color-status-danger-subtle); }
.mo-menu-divider { height: 1px; margin: var(--spacing-4) 0; background: var(--color-border-subtle); }

/* Toast：200ms ease-out 从上方移入，150ms ease-in 淡出 */
.mo-toast {
  position: absolute; top: 24px; left: 50%; z-index: 2;
  display: flex; align-items: center; gap: var(--spacing-8);
  height: 40px; padding: var(--spacing-8) var(--spacing-16); border-radius: var(--border-radius-12);
  background: var(--color-bg-fill-popup); color: var(--color-text-fill-primary);
  font-size: var(--font-size-14); line-height: var(--font-line-height-22); white-space: nowrap;
  opacity: 0; visibility: hidden; transform: translate(-50%, -64px);
}
.mo-toast.is-open {
  opacity: 1; visibility: visible; transform: translate(-50%, 0);
  transition: opacity var(--motion-duration-200) var(--motion-ease-out), transform var(--motion-duration-200) var(--motion-ease-out);
}
.mo-toast.is-leaving {
  opacity: 0; visibility: visible; transform: translate(-50%, 0);
  transition: opacity var(--motion-duration-150) var(--motion-ease-in);
}
.mo-toast-ok { display: grid; place-items: center; width: 16px; height: 16px; border-radius: var(--border-radius-round); background: var(--color-status-success); color: var(--color-bg-fill-popup); }
.mo-toast-ok .kv-icon { width: 12px; height: 12px; }

/* 弹窗：遮罩和弹窗一起 300ms ease-out 淡入，弹窗 96% → 100%；200ms ease-in 淡出 */
.mo-mask {
  position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: var(--spacing-16);
  background: var(--color-bg-fill-mask);
  opacity: 0; visibility: hidden;
  transition: opacity var(--motion-duration-200) var(--motion-ease-in), visibility 0s linear var(--motion-duration-200);
}
.mo-dialog {
  display: grid; gap: var(--spacing-16); width: 400px; max-width: 100%; padding: var(--spacing-24);
  border-radius: var(--border-radius-16); background: var(--color-bg-fill-surface); color: var(--color-text-fill-primary);
  font-size: var(--font-size-14); line-height: var(--font-line-height-22);
  transform: scale(0.96);
  transition: transform var(--motion-duration-200) var(--motion-ease-in);
}
.mo-mask.is-open { opacity: 1; visibility: visible; transition: opacity var(--motion-duration-300) var(--motion-ease-out), visibility 0s; }
.mo-mask.is-open .mo-dialog { transform: scale(1); transition: transform var(--motion-duration-300) var(--motion-ease-out); }
.mo-dialog-head { display: flex; align-items: center; justify-content: space-between; }
.mo-dialog-head b { font-size: var(--font-size-16); font-weight: var(--font-weight-medium); line-height: var(--font-line-height-24); }
.mo-dialog p { margin: 0; color: var(--color-text-fill-secondary); }
.mo-dialog-foot { display: flex; justify-content: flex-end; gap: var(--spacing-8); margin-top: var(--spacing-8); }

/* 加载和骨架屏 */
.mo-loading { display: flex; align-items: center; gap: var(--spacing-8); color: var(--color-text-fill-secondary); }
.mo-loading.is-col { flex-direction: column; }
.mo-loading.is-lg { gap: var(--spacing-12); font-size: var(--font-size-14); }
.mo-loading.is-md { font-size: var(--font-size-13); line-height: var(--font-line-height-20); }
.mo-loading.is-sm { font-size: var(--font-size-12); line-height: var(--font-line-height-20); }
.mo-loading .kv-icon { color: var(--color-text-fill-primary); }
.mo-skeleton-card { display: grid; grid-template-columns: 40px 1fr; gap: var(--spacing-12); width: 320px; max-width: 100%; }
.mo-skeleton-lines { display: grid; gap: var(--spacing-8); align-content: center; }
.mo-skeleton {
  position: relative; overflow: hidden;
  background: var(--color-bg-fill-container-light-1); border-radius: var(--border-radius-4);
}
.mo-skeleton::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, var(--color-bg-fill-container-light-1-hover), transparent);
  transform: translateX(-100%);
  animation: mo-sweep 1.4s linear infinite;
}
@keyframes mo-sweep { to { transform: translateX(100%); } }
`;

// 样式只在这一页的演示在屏幕上时才挂到 <head>，离开页面就拿掉
let mounted = 0;
function useMotionStyles() {
  useInsertionEffect(() => {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = CSS;
    mounted += 1;
    return () => {
      mounted -= 1;
      if (mounted <= 0) document.getElementById(STYLE_ID)?.remove();
    };
  }, []);
}

/** 演示的框，和网站里别的演示一样 */
function Frame({ children }: { children: ReactNode }) {
  useMotionStyles();
  return (
    <figure className="shell-demo">
      <div className="shell-demo-preview">{children}</div>
    </figure>
  );
}

// ---------- 缓动 ----------

type Bezier = [number, number, number, number];

/** 从 tokens.css 读贝塞尔曲线：cubic-bezier(0.4, 0, 0.2, 1)。linear 没有变量，是一条直线 */
function readBezier(token: string | null): Bezier {
  if (!token) return [0, 0, 1, 1];
  const v = getComputedStyle(document.documentElement).getPropertyValue(token);
  const m = /cubic-bezier\(([^)]+)\)/.exec(v);
  const p = m ? m[1].split(',').map(Number) : [];
  return p.length === 4 && p.every(Number.isFinite) ? (p as Bezier) : [0, 0, 1, 1];
}

function Curve({ p }: { p: Bezier }) {
  const s = 48;
  const o = 4;
  const x = (v: number) => o + v * s;
  const y = (v: number) => o + (1 - v) * s;
  return (
    <svg className="mo-curve" viewBox="0 0 56 56" aria-hidden="true">
      <rect x="4" y="4" width="48" height="48" rx="4" fill="none" stroke="currentColor" strokeOpacity=".4" />
      <path
        d={`M${x(0)} ${y(0)} C${x(p[0])} ${y(p[1])} ${x(p[2])} ${y(p[3])} ${x(1)} ${y(1)}`}
        fill="none"
        stroke="var(--color-brand-solid)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const EASES: { name: string; note: string; token: string | null; css: string }[] = [
  { name: 'ease-in-out', note: '屏幕内移动', token: '--motion-ease-in-out', css: 'var(--motion-ease-in-out)' },
  { name: 'ease-out', note: '进入、出现', token: '--motion-ease-out', css: 'var(--motion-ease-out)' },
  { name: 'ease-in', note: '退出、消失', token: '--motion-ease-in', css: 'var(--motion-ease-in)' },
  { name: 'linear', note: '循环', token: null, css: 'linear' },
];

/** 四种缓动的曲线和小球，放慢到 1 秒，点「播放」来回切换 */
export function EaseDemo() {
  const [end, setEnd] = useState(false);
  return (
    <Frame>
      <div className="mo-rows">
        {EASES.map((e) => (
          <div key={e.name} className={end ? 'mo-row mo-ease is-end' : 'mo-row mo-ease'} style={{ '--ease': e.css } as CSSProperties}>
            <div>
              <b>{e.name}</b>
              <small>{e.note}</small>
            </div>
            <Curve p={readBezier(e.token)} />
            <div className="mo-track">
              <span className="mo-dot" />
            </div>
          </div>
        ))}
      </div>
      <div className="mo-controls">
        <Button size="sm" onClick={() => setEnd(!end)}>
          播放
        </Button>
      </div>
    </Frame>
  );
}

// ---------- 时长 ----------

const DURATIONS: { ms: string; note: string; token: string; to?: string; dot?: 'color' | 'fade' }[] = [
  { ms: '100ms', note: '换颜色', token: '--motion-duration-100', dot: 'color' },
  { ms: '150ms', note: '小东西消失', token: '--motion-duration-150', dot: 'fade' },
  { ms: '200ms', note: '移动 80px', token: '--motion-duration-200', to: '80px' },
  { ms: '300ms', note: '移动 240px', token: '--motion-duration-300', to: '240px' },
  { ms: '400ms', note: '移动到头', token: '--motion-duration-400', to: '100%' },
];

/** 五档时长，每一档按它该走的距离播放，真实速度 */
export function DurationDemo() {
  const [end, setEnd] = useState(false);
  return (
    <Frame>
      <div className="mo-rows">
        {DURATIONS.map((d) => (
          <div
            key={d.ms}
            className={end ? 'mo-row mo-dur is-end' : 'mo-row mo-dur'}
            style={{ '--dur': `var(${d.token})`, '--to': d.to } as CSSProperties}
          >
            <div>
              <b>{d.ms}</b>
              <small>{d.note}</small>
            </div>
            <div className="mo-track">
              <span className={d.dot ? `mo-dot is-${d.dot}` : 'mo-dot'} />
            </div>
          </div>
        ))}
      </div>
      <div className="mo-controls">
        <Button size="sm" onClick={() => setEnd(!end)}>
          播放
        </Button>
      </div>
    </Frame>
  );
}

// ---------- Tooltip ----------

/** 鼠标停在按钮上 500ms 才出现，移开马上淡出 */
export function TooltipDemo() {
  const items: [IconName, string][] = [
    ['Download', '下载'],
    ['Copy', '复制'],
    ['Delete', '删除'],
  ];
  return (
    <Frame>
      {items.map(([icon, label]) => (
        <span key={icon} className="mo-tip-anchor">
          <IconButton icon={icon} label={label} />
          <span className="mo-tip" role="tooltip">
            {label}
          </span>
        </span>
      ))}
    </Frame>
  );
}

// ---------- 菜单、下拉列表 ----------

/** 点按钮展开菜单；点菜单项、点外面、按 Esc 收起 */
export function MenuDemo() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items: { icon: IconName; label: string; danger?: boolean; divider?: boolean }[] = [
    { icon: 'Download', label: '下载' },
    { icon: 'Copy', label: '复制' },
    { icon: 'Upload', label: '重新上传' },
    { icon: 'Delete', label: '删除', danger: true, divider: true },
  ];

  return (
    <Frame>
      <div className="mo-stage">
        <div className="mo-menu-wrap" ref={ref}>
          <Button rightIcon="DownArrowSmall" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
            更多操作
          </Button>
          <div className={open ? 'mo-menu is-open' : 'mo-menu'} role="menu">
            {items.map((it) => (
              <Fragment key={it.label}>
                {it.divider && <div className="mo-menu-divider" role="separator" />}
                <button
                  type="button"
                  role="menuitem"
                  className={it.danger ? 'mo-menu-item is-danger' : 'mo-menu-item'}
                  onClick={() => setOpen(false)}
                >
                  <Icon name={it.icon} />
                  {it.label}
                </button>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ---------- Toast ----------

type ToastPhase = 'idle' | 'open' | 'leaving';

/** 点保存，Toast 从上方移入，3 秒后自己淡出 */
export function ToastDemo() {
  const [phase, setPhase] = useState<ToastPhase>('idle');
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = () => {
    window.clearTimeout(timer.current);
    setPhase('open');
    timer.current = window.setTimeout(() => {
      setPhase('leaving');
      timer.current = window.setTimeout(() => setPhase('idle'), 150);
    }, 3000);
  };

  return (
    <Frame>
      <div className="mo-stage is-bottom">
        <div className={phase === 'idle' ? 'mo-toast' : `mo-toast is-${phase}`} role="status">
          <span className="mo-toast-ok">
            <Icon name="CheckSmall" />
          </span>
          已保存到我的作品
        </div>
        <Button onClick={show}>保存</Button>
      </div>
    </Frame>
  );
}

// ---------- 模态弹窗 ----------

/** 点按钮弹出；点遮罩、点按钮、按 Esc 关闭 */
export function DialogDemo() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    // 打开时焦点进弹窗，关闭后回到原来的按钮
    opener.current = document.activeElement;
    dialog.current?.querySelector<HTMLElement>('.mo-dialog-foot button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  return (
    <Frame>
      <Button onClick={() => setOpen(true)}>删除作品</Button>
      {createPortal(
        <div
          className={open ? 'mo-mask is-open' : 'mo-mask'}
          aria-hidden={!open}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="mo-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog}>
            <div className="mo-dialog-head">
              <b id={titleId}>删除这个作品？</b>
              <IconButton icon="Close" label="关闭" onClick={() => setOpen(false)} />
            </div>
            <p>删除后不能恢复。</p>
            <div className="mo-dialog-foot">
              <Button size="lg" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button size="lg" variant="danger" onClick={() => setOpen(false)}>
                删除
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </Frame>
  );
}

// ---------- 开关 ----------

/** 滑块 150ms ease-in-out，样式用网站外壳里的 shell-switch，正式组件见选择控件 */
export function SwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <Frame>
      <button type="button" role="switch" aria-checked={on} aria-label="示意开关" className="shell-switch" onClick={() => setOn(!on)} />
    </Frame>
  );
}

// ---------- 加载和骨架屏 ----------

/** Loading 图标 1 秒一圈，匀速 */
export function LoadingDemo() {
  return (
    <Frame>
      <div className="mo-loading is-sm">
        <Icon name="Loading" spin />
        加载中
      </div>
      <div className="mo-loading is-md is-col" style={{ margin: '0 32px' }}>
        <Icon name="Loading" size={24} spin />
        加载中
      </div>
      <div className="mo-loading is-lg is-col">
        <Icon name="Loading" size={40} spin />
        正在生成
      </div>
    </Frame>
  );
}

/** 骨架屏：底色白 8%，高光白 12% 从左往右扫，1.4 秒一轮，匀速 */
export function SkeletonDemo() {
  return (
    <Frame>
      <div className="mo-skeleton-card" aria-busy="true">
        <div className="mo-skeleton" style={{ width: 40, height: 40, borderRadius: 'var(--border-radius-round)' }} />
        <div className="mo-skeleton-lines">
          <div className="mo-skeleton" style={{ height: 12, width: '60%' }} />
          <div className="mo-skeleton" style={{ height: 12 }} />
        </div>
        <div className="mo-skeleton" style={{ gridColumn: '1 / -1', height: 160, borderRadius: 'var(--border-radius-8)' }} />
      </div>
    </Frame>
  );
}
