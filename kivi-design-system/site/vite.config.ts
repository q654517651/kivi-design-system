import { fileURLToPath } from 'node:url';
import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { defineConfig } from 'vite';
import { searchIndex } from './scripts/search-index.mjs';

// 文档页用 MDX 写；占位图、插图这类素材直接用 skill 的 assets/ 当静态目录；全局搜索的索引在构建时从文档里生成（scripts/search-index.mjs）
export default defineConfig({
  base: './',
  publicDir: fileURLToPath(new URL('../assets', import.meta.url)),
  plugins: [
    searchIndex(),
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] }) },
    react(),
  ],
  resolve: {
    alias: {
      '@kivi': fileURLToPath(new URL('./src/kivi', import.meta.url)),
      '@shell': fileURLToPath(new URL('./src/shell', import.meta.url)),
    },
  },
});
