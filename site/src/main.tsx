import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import '@kivi';
import { Layout } from './shell/Layout';
import { mdxComponents } from './shell/mdx';
import { PAGES, REDIRECTS } from './shell/nav';
import './shell/shell.css';

const pages = PAGES.map((p) => ({ ...p, Page: lazy(p.load) }));
// UI 页面预览单独开的 Tab：只有产品界面，不套网站外壳
const KiviApp = lazy(() => import('./app/App'));

// 「浮层」类型要放在图片上看：演示区的图片底
document.documentElement.style.setProperty(
  '--shell-media',
  // 换成绝对地址：打包时 BASE_URL 是相对的「./」，写进 CSS 变量后会按样式表所在的 assets/ 去找，线上 404
  `url("${new URL(`${import.meta.env.BASE_URL}placeholders/kiwi-light-16x9.webp`, document.baseURI).href}")`,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/app" element={<Navigate to="/app/create" replace />} />
        <Route
          path="/app/:page"
          element={
            <Suspense fallback={null}>
              <KiviApp />
            </Suspense>
          }
        />
        {/* 带 id：#/app/canvas/<画布>、#/app/create/<对话>，新标签页打开、刷新都停在那一个 */}
        <Route
          path="/app/:page/:id"
          element={
            <Suspense fallback={null}>
              <KiviApp />
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          {pages.map(({ id, path, Page }) => (
            <Route key={id} path={path} element={<Page components={mdxComponents} />} />
          ))}
          {Object.entries(REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          <Route path="*" element={<p className="shell-loading">没有这一页。</p>} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
);
