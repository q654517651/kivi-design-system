// 查组件库 src/kivi/ 是否按「组件写法」页写的。npm run check 会跑。
// 只查能机械判断的：forwardRef、displayName、...rest、is-* 类名、部件类名、CSS 里写死的颜色。

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
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

// CSS：部件类名、写死的颜色
for (const file of css) {
  const src = readFileSync(file, 'utf8');
  checkClass(file, src, /\.(kv-[a-z0-9-]+)/g);
  // 文档摆静态状态的 is-hover、is-active、is-focus 例外
  for (const m of src.matchAll(/\.is-(?!(hover|active|focus)\b)[a-z-]+/g)) report(file, lineOf(src, m.index), `用了 ${m[0]} 类名，改成原生属性、aria-* 或 data-*`);
  let inComment = false;
  src.split('\n').forEach((raw, i) => {
    if (raw.includes(NO_TOKEN_MARK)) return;
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
    if (/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(/.test(code)) report(file, i + 1, `写死了颜色：${code.trim()}（用变量；Figma 没变量就在这一行注释「${NO_TOKEN_MARK}」）`);
  });
}

if (problems.length) {
  console.log(`组件写法检查：${problems.length} 处不符合\n`);
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log(`组件写法检查通过：${tsx.length} 个组件文件，${css.length} 个样式文件`);
