import { lazy, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import '@kivi';
import { Layout } from './shell/Layout';
import { mdxComponents } from './shell/mdx';
import { PAGES } from './shell/nav';
import './shell/shell.css';

const pages = PAGES.map((p) => ({ ...p, Page: lazy(p.load) }));

// 「浮层」类型要放在图片上看：演示区的图片底
document.documentElement.style.setProperty(
  '--shell-media',
  `url("${import.meta.env.BASE_URL}placeholders/kiwi-light-16x9.webp")`,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          {pages.map(({ id, path, Page }) => (
            <Route key={id} path={path} element={<Page components={mdxComponents} />} />
          ))}
          <Route path="*" element={<p className="shell-loading">没有这一页。</p>} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
);
