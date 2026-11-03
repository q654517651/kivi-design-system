import { fileURLToPath } from 'node:url';
// 插件借 site 里的（本目录没有 node_modules）
import react from '../../../kivi-design-system/site/node_modules/@vitejs/plugin-react/dist/index.js';

// 原型自己的 vite 配置：不改 site/，组件库和依赖都借 site/ 的。
// 启动：在 site/ 下  ./node_modules/.bin/vite ../../kivi-design-system-workspace/skill-test-2026-10-30/web --config ../../kivi-design-system-workspace/skill-test-2026-10-30/web/vite.config.ts --port 4180
const site = fileURLToPath(new URL('../../../kivi-design-system/site/', import.meta.url));
const assets = fileURLToPath(new URL('../../../kivi-design-system/assets', import.meta.url));
const repo = fileURLToPath(new URL('../../../', import.meta.url));


export default {
  base: './',
  publicDir: assets,
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@kivi', replacement: site + 'src/kivi' },
      { find: /^react-dom(\/|$)/, replacement: site + 'node_modules/react-dom$1' },
      { find: /^react(\/|$)/, replacement: site + 'node_modules/react$1' },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: { host: '127.0.0.1', port: 4180, fs: { allow: [repo] } },
};
