import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button, Icon, IconButton } from '@kivi';
import { NAV } from './nav';

const FIGMA = 'https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2';

type Head = { id: string; text: string };

/** 网站外壳：顶栏、左侧目录、正文、本页目录 */
export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [heads, setHeads] = useState<Head[]>([]);
  const [current, setCurrent] = useState('');
  const [navOpen, setNavOpen] = useState(false);

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
    <div className={navOpen ? 'shell-root nav-open' : 'shell-root'}>
      <header className="shell-top">
        <IconButton icon="Sidebar" label="目录" className="shell-menu" onClick={() => setNavOpen(!navOpen)} />
        <NavLink className="shell-logo" to="/">
          <Icon name="Logo" size={24} />
          设计规范
        </NavLink>
        <span className="shell-badge">草稿 0.1</span>
        <span className="shell-spacer" />
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
  );
}
