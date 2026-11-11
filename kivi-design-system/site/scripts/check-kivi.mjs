// 查组件库 src/kivi/ 是否按「组件写法」页写的。npm run check 会跑。
// 只查能机械判断的：forwardRef、displayName、...rest、is-* 类名、部件类名、手抄别的组件的类名、CSS 里写死的颜色和背景模糊。

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/kivi/', import.meta.url));
const SKIP_DIRS = new Set(['hooks']);
const NO_REF_MARK = '不转发 ref';
const NO_TOKEN_MARK = 'Figma 没变量';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(p, out);
    } else out.push(p);
  }
  return out;
}

const files = walk(root);
const tsx = files.filter((f) => f.endsWith('.tsx'));
const css = files.filter((f) => f.endsWith('.css') && !f.endsWith('tokens.css'));
const problems = [];
const report = (file, line, msg) => problems.push(`${relative(root, file)}${line ? `:${line}` : ''}  ${msg}`);
const lineOf = (src, index) => src.slice(0, index).split('\n').length;
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

// 组件：导出的大写开头的函数或 forwardRef 常量
const bases = new Set();
const sources = new Map();
for (const file of tsx) {
  const src = readFileSync(file, 'utf8');
  sources.set(file, src);
  const comps = [];
  for (const m of src.matchAll(/export const ([A-Z]\w*) = forwardRef\b/g)) comps.push(m[1]);
  for (const m of src.matchAll(/export function ([A-Z]\w*)\s*[(<]/g)) {
    comps.push(m[1]);
    // 只看上一个顶层代码块结束之后、这个函数前面的注释
    const before = src.slice(Math.max(0, src.lastIndexOf('\n}', m.index)), m.index);
    if (!before.includes(NO_REF_MARK)) report(file, lineOf(src, m.index), `${m[1]} 没用 forwardRef（确实不需要就在注释里写「${NO_REF_MARK}：原因」）`);
  }
  for (const name of comps) {
    bases.add(`kv-${kebab(name)}`);
    if (!src.includes(`${name}.displayName = '${name}'`)) report(file, 0, `${name} 没设 displayName`);
  }
  if (comps.length && !/\.\.\.(rest|props)\b/.test(src)) report(file, 0, '没有把其余属性 ...rest 传给根元素');
  for (const m of src.matchAll(/['"`]is-[a-z]/g)) report(file, lineOf(src, m.index), '用了 is-* 类名，改成原生属性、aria-* 或 data-*');
  for (const m of src.matchAll(/\bdata-[a-z-]+=\{[^}]*\?\s*(true|false)\b/g)) report(file, lineOf(src, m.index), 'data-* 状态写成有就是 ""、没有就不写，不要写 true / false');
}

// 部件类名：kv-组件名-xxx 要写成 kv-组件名__xxx
const checkClass = (file, src, re) => {
  for (const m of src.matchAll(re)) {
    const cls = m[1];
    if (cls.includes('__') || cls.includes('--') || bases.has(cls)) continue;
    const owner = [...bases].find((b) => cls.startsWith(`${b}-`));
    if (owner) report(file, lineOf(src, m.index), `部件类名 ${cls} 要写成 ${owner}__${cls.slice(owner.length + 1)}`);
  }
};
for (const [file, src] of sources) checkClass(file, src, /['"`\s](kv-[a-z0-9-]+)(?=[\s'"`$])/g);

// 能直接用填充色阶 --color-fill-n 的选择器（设计规则 · 颜色和底色 的名单）
const FILL_OK = ['.kv-media-group__layer', '.kv-node-stack__card', '.kv-minimap__node', '.kv-skeleton'];

// CSS：部件类名、写死的颜色、写死的背景模糊
for (const file of css) {
  const src = readFileSync(file, 'utf8');
  checkClass(file, src, /\.(kv-[a-z0-9-]+)/g);
  // 文档摆静态状态的 is-hover、is-active、is-focus 例外
  for (const m of src.matchAll(/\.is-(?!(hover|active|focus)\b)[a-z-]+/g)) report(file, lineOf(src, m.index), `用了 ${m[0]} 类名，改成原生属性、aria-* 或 data-*`);
  let inComment = false;
  let sel = '';
  src.split('\n').forEach((raw, i) => {
    if (raw.includes('{')) sel = raw;
    let code = '';
    let rest = raw;
    while (rest) {
      if (inComment) {
        const end = rest.indexOf('*/');
        if (end < 0) return;
        rest = rest.slice(end + 2);
        inComment = false;
      } else {
        const start = rest.indexOf('/*');
        if (start < 0) {
          code += rest;
          break;
        }
        code += rest.slice(0, start);
        rest = rest.slice(start + 2);
        inComment = true;
      }
    }
    // 背景模糊只有两档，没有例外（11-05 用户定），「Figma 没变量」也不放过
    if (/backdrop-filter:\s*blur\(\s*[\d.]/.test(code)) report(file, i + 1, `写死了背景模糊：${code.trim()}（只用 --effect-glass-blur 80 或 --effect-mask-blur 16）`);
    // 字号只用变量（11-05 用户定）；Markdown 正文照 Ant Design X，是设计规则里写明的例外
    if (/font-size:\s*[\d.]+px/.test(code) && !file.includes('prose')) report(file, i + 1, `写死了字号：${code.trim()}（只用 --font-size-n）`);
    // 填充色阶只给名单里的静态色块（设计规则 · 颜色和底色），别处用 Container（11-05 用户定）
    if (/var\(--color-fill-[1-4]\)/.test(code) && !FILL_OK.some((c) => sel.includes(c))) report(file, i + 1, `直接用了填充色阶：${code.trim()}（先用 Container；确实不符的静态色块先加进设计规则的名单和 FILL_OK）`);
    if (/\b(rgba?|hsla?)\(/.test(code)) report(file, i + 1, `颜色用了 rgba / hsla：${code.trim()}（一律写十六进制，半透明写 8 位，比如白 10% 是 #FFFFFF1A）`);
    if (raw.includes(NO_TOKEN_MARK)) return;
    if (/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(/.test(code)) report(file, i + 1, `写死了颜色：${code.trim()}（用变量；Figma 没变量就在这一行注释「${NO_TOKEN_MARK}」）`);
  });
}

// 别的组件的类名不手抄（11-09）：组件里写了另一个文件夹的 kv-xxx 类名，那个组件改了样子这里不会跟着变，应该直接用那个组件。
// 确实只能借的，在那一行注释「借用类名」并写清原因
const BORROW_MARK = '借用类名';
{
  const owners = new Map();
  for (const file of css) {
    const dir = dirname(relative(root, file));
    if (dir === '.') continue;
    // 属于谁：在哪个文件夹的 CSS 里当选择器的开头（行首）定义；写在后代选择器里的（.kv-menu-item > .kv-icon）不算
    for (const m of readFileSync(file, 'utf8').matchAll(/^\.(kv-[a-z0-9]+(?:-[a-z0-9]+)*)/gm)) {
      if (!owners.has(m[1])) owners.set(m[1], new Set());
      owners.get(m[1]).add(dir);
    }
  }
  for (const [file, src] of sources) {
    const dir = dirname(relative(root, file));
    src.split('\n').forEach((raw, i) => {
      if (!/class/.test(raw) || raw.includes(BORROW_MARK)) return;
      const seen = new Set();
      for (const m of raw.matchAll(/['"`\s(](kv-[a-z0-9]+(?:-[a-z0-9]+)*)(?:__|--|(?=['"`\s)]))/g)) {
        const own = owners.get(m[1]);
        if (seen.has(m[1])) continue;
        seen.add(m[1]);
        if (own && !own.has(dir)) report(file, i + 1, `手抄了别的组件的类名 ${m[1]}（属于 ${[...own].join('、')}）：直接用那个组件；确实只能借就注释「${BORROW_MARK}」写原因`);
      }
    });
  }
}

// tokens.css 里的值也一律十六进制（11-05 用户定）
{
  const file = files.find((f) => f.endsWith('tokens.css'));
  readFileSync(file, 'utf8').split('\n').forEach((raw, i) => {
    const code = raw.replace(/\/\*.*?\*\//g, '');
    if (/\b(rgba?|hsla?)\(/.test(code)) report(file, i + 1, `颜色用了 rgba / hsla：${code.trim()}（一律写十六进制，半透明写 8 位）`);
  });
}

if (problems.length) {
  console.log(`组件写法检查：${problems.length} 处不符合\n`);
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log(`组件写法检查通过：${tsx.length} 个组件文件，${css.length} 个样式文件`);
