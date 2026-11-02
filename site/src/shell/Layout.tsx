import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button, Icon, IconButton, IconSetContext, TabItem, Tabs, type IconSet } from '@kivi';
import { NAV } from './nav';

const FIGMA = 'https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2';

// 右上角切图标版本（V2 / V3 预览，定了只留一个就删掉），记在本机浏览器里
const ICON_SET_KEY = 'kivi-icon-set';
function readIconSet(): IconSet {
  try {
    return localStorage.getItem(ICON_SET_KEY) === 'v3' ? 'v3' : 'v2';
  } catch {
    return 'v2';
  }
}

type Head = { id: string; text: string };

/** 网站外壳：顶栏、左侧目录、正文、本页目录 */
export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [heads, setHeads] = useState<Head[]>([]);
  const [current, setCurrent] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [iconSet, setIconSet] = useState<IconSet>(readIconSet);

  useEffect(() => {
    try {
      localStorage.setItem(ICON_SET_KEY, iconSet);
    } catch {
      // 无痕模式之类存不了，刷新后回到 V2
    }
  }, [iconSet]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setNavOpen(false);
  }, [pathname]);

  // 本页目录：收集正文里的 h2（演示里的不算），页面懒加载完再收一次
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    let key = '';
    const update = () => {
      const hs = Array.from(main.querySelectorAll<HTMLHeadingElement>('h2[id]'))
        .filter((h) => !h.closest('.shell-demo, .shell-pg'))
        .map((h) => ({ id: h.id, text: h.textContent ?? '' }));
      const k = hs.map((h) => h.id).join('|');
      if (k !== key) {
        key = k;
        setHeads(hs);
      }
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(main, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setCurrent(e.target.id)),
      { rootMargin: '-64px 0px -70% 0px' },
    );
    heads.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [heads]);

  return (
    <IconSetContext.Provider value={iconSet}>
    <div className={navOpen ? 'shell-root nav-open' : 'shell-root'}>
      <header className="shell-top">
        <IconButton icon="Sidebar" label="目录" className="shell-menu" onClick={() => setNavOpen(!navOpen)} />
        <NavLink className="shell-logo" to="/">
          <Icon name="Logo" size={24} />
          设计规范
        </NavLink>
        <span className="shell-badge">草稿 0.1</span>
        <span className="shell-spacer" />
        <span className="shell-icon-set">
          <span className="shell-icon-set-label">图标</span>
          <Tabs variant="segment" value={iconSet} onChange={(v) => setIconSet(v as IconSet)} aria-label="图标版本">
            <TabItem value="v2">V2</TabItem>
            <TabItem value="v3">V3</TabItem>
          </Tabs>
        </span>
        <a href={FIGMA} target="_blank" rel="noopener">
          <Button size="sm" variant="text" tabIndex={-1}>
            Figma 组件库
          </Button>
        </a>
      </header>

      <div className="shell-frame">
        <nav className="shell-nav">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="shell-nav-group">{g.group}</div>
              {g.items.map((it) =>
                it.path && it.load ? (
                  <NavLink
                    key={it.id}
                    to={it.path}
                    end
                    className={({ isActive }) => (isActive ? 'shell-nav-item is-current' : 'shell-nav-item')}
                  >
                    <span className="shell-nav-label">
                      <it.icon size={16} strokeWidth={1.75} aria-hidden="true" />
                      {it.title}
                    </span>
                  </NavLink>
                ) : (
                  <span key={it.id} className="shell-nav-item is-todo">
                    <span className="shell-nav-label">
                      <it.icon size={16} strokeWidth={1.75} aria-hidden="true" />
                      {it.title}
                    </span>
                    <em>待迁移</em>
                  </span>
                ),
              )}
            </div>
          ))}
        </nav>

        <main className="doc" ref={mainRef}>
          <Suspense fallback={<p className="shell-loading">加载中…</p>}>
            <Outlet />
          </Suspense>
        </main>

        <aside className="shell-toc">
          {heads.length > 1 && (
            <>
              <div className="shell-toc-title">本页</div>
              {heads.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={current === h.id ? 'is-current' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {h.text}
                </a>
              ))}
            </>
          )}
        </aside>
      </div>
    </div>
    </IconSetContext.Provider>
  );
}
