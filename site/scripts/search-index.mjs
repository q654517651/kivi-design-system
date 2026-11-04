// 全局搜索的索引：构建时扫一遍文档，生成虚拟模块 virtual:search-index（搜索框第一次打开时才加载）。
// 收进去的：页面（来自 src/shell/nav.ts）、MDX 里的标题、正文段落和列表、表格每一行（参数表、旧名对照），
// 再加两样不在 MDX 里、由 JS 生成的：变量（tokens.demos.tsx）和图标（icons.ts、icons.demos.tsx）。
// 代码块和演示（<Demo>、属性面板）不收。标题的锚点和 MDX 里 rehype-slug 生成的 id 用同一套算法，跳转才对得上。
//
// 格式（src/shell/search/types.ts 里有同样的类型）：
//   pages[i]  = { path, title, group, heads: [[锚点 id, 路径 "参数 › Button"], …] }
//   items[j]  = [kind, 页下标, heads 下标（没有是 -1）, 标题, 正文]

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const VIRTUAL = 'virtual:search-index';
const RESOLVED = `\0${VIRTUAL}`;

// kind：和 src/shell/search/types.ts 的 Kind 一致
const PAGE = 0;
const H2 = 1;
const H3 = 2;
const H4 = 3;
const TEXT = 4;
const ROW = 5;
const TOKEN = 6;
const ICON = 7;

const MAX_TEXT = 360;

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);

const clean = (s) => s.replace(/[ \s]+/g, ' ').trim();
const cut = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** 左侧目录：从 nav.ts 里读出分组、页名、路径、文件。没有 load 的（待迁移）不收 */
function readNav() {
  const src = readFileSync(join(SRC, 'shell/nav.ts'), 'utf8');
  const pages = [];
  let group = '';
  for (const line of src.split('\n')) {
    const g = /^\s*group:\s*'([^']+)'/.exec(line);
    if (g) group = g[1];
    const m = /id:\s*'([^']+)'.*?title:\s*'([^']+)',\s*path:\s*'([^']+)',\s*load:\s*\(\)\s*=>\s*import\('([^']+)'\)/.exec(line);
    if (m) pages.push({ id: m[1], title: m[2], path: m[3], file: resolve(SRC, 'shell', m[4]), group });
  }
  return pages;
}

/** 属性值：字符串直接取，表达式里的标签和花括号去掉 */
function attrText(node, name) {
  const a = node.attributes?.find((x) => x.type === 'mdxJsxAttribute' && x.name === name);
  if (!a) return '';
  if (typeof a.value === 'string') return a.value;
  if (a.value?.value) return clean(a.value.value.replace(/<[^>]+>/g, ' ').replace(/[{}]/g, ' ').replace(/\s*['"`]\s*/g, ' '));
  return '';
}

/** 一页 MDX → 标题、正文、表格行 */
function readMdx(file, page, pageIndex, out) {
  const src = readFileSync(file, 'utf8');
  const tree = parser.parse(src);

  // 第一遍：按文档顺序给所有标题生成 id（和 rehype-slug 一样，每页重新数重复）
  const slugger = new GithubSlugger();
  const ids = new Map();
  const slugAll = (n) => {
    if (n.type === 'heading') ids.set(n, slugger.slug(toString(n)));
    n.children?.forEach(slugAll);
  };
  slugAll(tree);

  const heads = []; // [id, 路径]
  const stack = []; // 当前标题路径 { depth, text }
  const crumbNow = () => stack.map((s) => s.text).join(' › ');
  const headIndex = () => (stack.length ? heads.length - 1 : -1);
  const push = (kind, hi, title, text = '') => out.items.push([kind, pageIndex, hi, title, text]);

  const block = (n) => {
    switch (n.type) {
      case 'heading': {
        const text = clean(toString(n));
        if (!text || n.depth === 1) return;
        while (stack.length && stack[stack.length - 1].depth >= n.depth) stack.pop();
        stack.push({ depth: n.depth, text });
        heads.push([ids.get(n), crumbNow()]);
        push(n.depth === 2 ? H2 : n.depth === 3 ? H3 : H4, heads.length - 1, text);
        return;
      }
      case 'paragraph': {
        const text = clean(toString(n));
        if (text) push(TEXT, headIndex(), cut(text, MAX_TEXT));
        return;
      }
      case 'list':
        n.children.forEach(block);
        return;
      case 'listItem': {
        const text = clean(n.children.filter((c) => c.type !== 'list').map(toString).join(' '));
        if (text) push(TEXT, headIndex(), cut(text, MAX_TEXT));
        n.children.filter((c) => c.type === 'list').forEach(block);
        return;
      }
      case 'blockquote':
        n.children.forEach(block);
        return;
      case 'table': {
        // 第一行是表头，不收
        n.children.slice(1).forEach((row) => {
          // 空格子和「—」（旧名对照里「新增」的旧名）不当标题
          const cells = row.children.map((c) => clean(toString(c))).filter((c) => c && !/^[—–-]+$/.test(c));
          if (!cells[0]) return;
          push(ROW, headIndex(), cut(cells[0], 120), cut(cells.slice(1).join(' · '), MAX_TEXT));
        });
        return;
      }
      case 'mdxJsxFlowElement':
        if (n.name === 'PageHeader') {
          page.lead = attrText(n, 'lead');
        } else {
          n.children?.forEach(block);
        }
        return;
      default:
        // code、html、import / export、演示用的表达式：不收
        return;
    }
  };
  tree.children.forEach(block);
  page.heads = heads;
}

/** 变量：tokens.demos.tsx 里每行 { token: '--x', figma: 'a/b', desc, use }，一行一个 */
function readTokens(page, pageIndex, out) {
  const file = join(SRC, 'docs/foundations/tokens.demos.tsx');
  const src = readFileSync(file, 'utf8');
  const seen = new Set();
  for (const m of src.matchAll(/\{\s*token:\s*'(--[\w-]+)'([^\n]*)/g)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    const rest = m[2];
    const pick = (key) => new RegExp(`${key}:\\s*(?:'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)")`).exec(rest);
    const f = pick('figma');
    const d = pick('desc');
    const u = pick('use');
    const val = (x) => (x ? (x[1] ?? x[2]).replace(/\\'/g, "'") : '');
    const text = [val(f), val(d), val(u)].filter(Boolean).join(' · ').replace(/`/g, '');
    out.items.push([TOKEN, pageIndex, -1, m[1], cut(text, MAX_TEXT)]);
  }
}

/** 图标：名字 + 意思（icons.demos.tsx 的 ICON_INFO）+ 分组（icons.ts 的 ICON_GROUPS） */
function readIcons(page, pageIndex, out) {
  const data = readFileSync(join(SRC, 'kivi/icons.ts'), 'utf8');
  const demos = readFileSync(join(SRC, 'docs/foundations/icons.demos.tsx'), 'utf8');
  const info = new Map();
  for (const m of demos.matchAll(/^\s{2}(\w+):\s*\{\s*means:\s*'((?:[^'\\]|\\.)*)'(?:,\s*note:\s*'((?:[^'\\]|\\.)*)')?/gm)) {
    info.set(m[1], [m[2], m[3]].filter(Boolean).join('，').replace(/\\'/g, "'"));
  }
  for (const m of data.matchAll(/\{\s*name:\s*'([^']+)',\s*icons:\s*\[([^\]]*)\]/g)) {
    const group = m[1];
    for (const n of m[2].matchAll(/'(\w+)'/g)) {
      out.items.push([ICON, pageIndex, -1, n[1], cut([group, info.get(n[1])].filter(Boolean).join(' · '), MAX_TEXT)]);
    }
  }
}

export function buildSearchIndex() {
  const nav = readNav();
  const out = { pages: [], items: [] };
  if (!nav.length) console.warn('[search-index] 没从 src/shell/nav.ts 读到页面：每一页要写在一行里（id、title、path、load: () => import(…)）');
  nav.forEach((p, i) => {
    const page = { path: p.path, title: p.title, group: p.group, lead: '', heads: [] };
    out.pages.push(page);
    // 文件找不到（改名、挪走了还没同步 nav.ts）：只留页面本身，别让整个索引挂掉
    try {
      readMdx(p.file, page, i, out);
    } catch (err) {
      console.warn(`[search-index] ${p.path} 读不到 ${p.file}：${err.message}`);
    }
    // 页面本身放最前面，一句话说明当正文
    out.items.push([PAGE, i, -1, p.title, page.lead]);
    const before = out.items.length;
    try {
      if (p.id === 'tokens') readTokens(page, i, out);
      if (p.id === 'icons') readIcons(page, i, out);
    } catch (err) {
      console.warn(`[search-index] ${p.id} 的源文件读不到：${err.message}`);
    }
    // 变量、图标一个都没读到：多半是源文件的写法或位置变了
    if ((p.id === 'tokens' || p.id === 'icons') && out.items.length === before) {
      console.warn(`[search-index] ${p.id} 一条都没读到，检查 scripts/search-index.mjs 里读 ${p.id === 'tokens' ? 'tokens.demos.tsx' : 'icons.ts、icons.demos.tsx'} 的写法`);
    }
  });
  out.pages.forEach((p) => delete p.lead);
  return out;
}

function listFiles(dir, test, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) listFiles(p, test, acc);
    else if (test(p)) acc.push(p);
  }
  return acc;
}

export function searchIndex() {
  const watched = (f) =>
    f.endsWith('.mdx') ||
    f.endsWith('shell/nav.ts') ||
    f.endsWith('foundations/tokens.demos.tsx') ||
    f.endsWith('foundations/icons.demos.tsx') ||
    f.endsWith('kivi/icons.ts');
  return {
    name: 'kivi-search-index',
    resolveId(id) {
      if (id === VIRTUAL) return RESOLVED;
    },
    load(id) {
      if (id !== RESOLVED) return;
      listFiles(join(SRC, 'docs'), (f) => f.endsWith('.mdx')).forEach((f) => this.addWatchFile(f));
      return `export default ${JSON.stringify(buildSearchIndex())};`;
    },
    // 开发时改了文档，下次刷新页面拿到新索引
    configureServer(server) {
      const drop = (f) => {
        if (!watched(f)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
      };
      server.watcher.on('change', drop).on('add', drop).on('unlink', drop);
    },
  };
}
