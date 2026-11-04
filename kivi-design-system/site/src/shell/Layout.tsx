import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button, Icon, IconButton } from '@kivi';
import { NAV } from './nav';
import { SearchButton, useSearchJump } from './search';

const FIGMA = 'https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2';
/** 图标用的是 Hugeicons 免费版（V3），补图标去这里找 */
const HUGEICONS = 'https://hugeicons.com/icons';

// 顶栏两个外链的品牌 Logo，只给网站外壳用，不进组件库；颜色是品牌原色（Figma 没变量）
/** Figma 官方四色标，16 高 */
function FigmaLogo() {
  return (
    <svg className="shell-brand-logo" viewBox="0 0 38 57" aria-hidden="true">
      <path fill="#1ABCFE" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
      <path fill="#0ACF83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
      <path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
      <path fill="#F24E1E" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
      <path fill="#A259FF" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
    </svg>
  );
}

/** Hugeicons 的图形标（官网 assets/logo/white.svg 左边那块）：绿色提手 + 篮子，篮子跟文字颜色 */
function HugeiconsLogo() {
  return (
    <svg className="shell-brand-logo" viewBox="0 0 151 143" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" fill={'#7CCE24'} d="M75.3295 14.2352C97.6876 14.2352 115.622 32.0434 115.622 53.7782C115.622 57.6094 118.728 60.7152 122.559 60.7152C126.39 60.7152 129.496 57.6094 129.496 53.7782C129.496 24.1727 105.14 0.361328 75.3295 0.361328C45.5192 0.361328 21.1629 24.1727 21.1629 53.7782C21.1629 57.6094 24.2687 60.7152 28.0999 60.7152C31.9311 60.7152 35.0368 57.6094 35.0368 53.7782C35.0368 32.0434 52.9714 14.2352 75.3295 14.2352Z" />
      <path fill={'currentColor'} d="M18.5822 89.2117L16.335 71.5193C15.4412 64.4822 14.9942 60.9637 16.9967 58.6908C18.9991 56.418 22.5459 56.418 29.6395 56.418H120.642C127.735 56.418 131.282 56.418 133.285 58.6908C135.287 60.9637 134.84 64.4822 133.946 71.5193L131.699 89.2117C128.863 111.54 127.445 122.704 119.844 129.401C112.243 136.098 100.989 136.098 78.481 136.098H71.8004C49.2925 136.098 38.0386 136.098 30.4375 129.401C22.8363 122.704 21.4183 111.54 18.5822 89.2118V89.2117Z" />
      <path fillRule="evenodd" clipRule="evenodd" fill={'currentColor'} d="M120.964 51.3887C120.857 51.3887 120.748 51.3887 120.64 51.3887L29.3133 51.3887C26.046 51.3883 23.0845 51.388 20.7078 51.7217C18.1109 52.0862 15.3489 52.9511 13.2212 55.3662C11.0934 57.7813 10.5835 60.6303 10.549 63.2524C10.5175 65.6522 10.891 68.59 11.303 71.8313L13.6353 90.1933C15.0158 101.062 16.1125 109.698 17.8518 116.427C19.6452 123.366 22.2669 128.907 27.1109 133.175C31.955 137.442 37.7827 139.345 44.8921 140.25C51.7868 141.127 60.4914 141.127 71.448 141.127H78.8297C89.7862 141.127 98.4909 141.127 105.386 140.25C112.495 139.345 118.323 137.442 123.167 133.175C128.011 128.907 130.632 123.366 132.426 116.427C134.165 109.698 135.262 101.062 136.642 90.1932L138.934 72.153C138.947 72.0454 138.961 71.9382 138.975 71.8313C139.387 68.59 139.76 65.6522 139.729 63.2524C139.694 60.6303 139.184 57.7813 137.056 55.3662C134.929 52.9511 132.167 52.0862 129.57 51.7217C127.193 51.388 124.232 51.3883 120.964 51.3887ZM129.508 62.0167C129.495 62.0091 129.47 61.996 129.431 61.9787C129.271 61.9079 128.907 61.7858 128.171 61.6826C126.579 61.459 124.338 61.4473 120.64 61.4473H29.6377C25.9397 61.4473 23.6986 61.459 22.1062 61.6826C21.3707 61.7858 21.007 61.9079 20.8464 61.9787C20.8072 61.996 20.7829 62.0091 20.7698 62.0167C20.7639 62.0306 20.754 62.0564 20.7418 62.0975C20.6918 62.2657 20.6165 62.6418 20.6067 63.3846C20.5856 64.9924 20.8564 67.2171 21.3223 70.8856L23.5695 88.5781C23.5829 88.6835 23.5963 88.7888 23.6096 88.8937C25.0235 100.023 26.0444 107.929 27.5903 113.91C29.1152 119.81 31.0031 123.198 33.7602 125.628C36.5174 128.057 40.1172 129.502 46.162 130.272C52.3481 131.059 60.4123 131.069 71.7985 131.069H78.4791C89.8654 131.069 97.9295 131.059 104.116 130.272C110.16 129.502 113.76 128.057 116.517 125.628C119.275 123.198 121.162 119.81 122.687 113.91C124.248 107.872 125.273 99.8735 126.708 88.5781L128.955 70.8856C129.421 67.2171 129.692 64.9924 129.671 63.3846C129.661 62.6418 129.586 62.2657 129.536 62.0975C129.524 62.0564 129.514 62.0306 129.508 62.0167ZM20.7583 62.0238C20.7584 62.0237 20.7582 62.0238 20.7583 62.0238V62.0238Z" />
      <path fillRule="evenodd" clipRule="evenodd" fill={'currentColor'} d="M149.734 54.1069C149.734 50.2757 146.629 47.1699 142.797 47.1699H7.85562C4.02446 47.1699 0.918686 50.2757 0.918686 54.1069C0.918686 57.938 4.02446 61.0438 7.85562 61.0438H142.797C146.629 61.0438 149.734 57.938 149.734 54.1069Z" />
    </svg>
  );
}

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

  // 全局搜索：搜到之后切页、滚到对应位置（要放在上面回到顶部的 effect 后面）
  useSearchJump(mainRef);

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
        <span className="shell-badge">v0.1.0</span>
        <span className="shell-spacer" />
        <SearchButton />
        <a href={HUGEICONS} target="_blank" rel="noopener">
          <Button size={28} variant="text" tabIndex={-1}>
            <HugeiconsLogo />
            Hugeicons 图标库
          </Button>
        </a>
        <a href={FIGMA} target="_blank" rel="noopener">
          <Button size={28} variant="text" tabIndex={-1}>
            <FigmaLogo />
            Figma 组件库
          </Button>
        </a>
      </header>

      <div className={pathname === '/' ? 'shell-frame is-home' : 'shell-frame'}>
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
