import { Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';

// 把属性面板渲染出来的 React 元素转回 JSX 代码，给前端复制。
// is-hover、is-active、is-focus 只是文档里摆静态状态用，代码里去掉。
// 数组、对象写成 JS 字面量；一行太长就拆成多行。

const DOC_ONLY = /\s*\bis-(hover|active|focus)\b/g;
const MAX_LINE = 72;

function typeName(type: unknown): string {
  if (type === Fragment) return '';
  if (typeof type === 'string') return type;
  const t = type as { displayName?: string; name?: string };
  return t.displayName || t.name || 'Component';
}

/** 数组、对象、字符串这些值写成 JS 字面量 */
function jsValue(v: unknown, indent: string): string {
  if (typeof v === 'string') return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (typeof v === 'number' || typeof v === 'boolean' || v === null) return String(v);
  if (typeof v === 'function') return '() => {}';
  if (isValidElement(v)) return toJsx(v, indent).trimStart();
  const inner = indent + '  ';
  if (Array.isArray(v)) {
    const items = v.map((x) => jsValue(x, inner));
    const one = `[${items.join(', ')}]`;
    if (one.length <= MAX_LINE && !one.includes('\n')) return one;
    return `[\n${items.map((i) => inner + i).join(',\n')},\n${indent}]`;
  }
  if (typeof v === 'object' && v) {
    const items = Object.entries(v)
      .filter(([, x]) => x !== undefined)
      .map(([k, x]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${jsValue(x, inner)}`);
    if (!items.length) return '{}';
    const one = `{ ${items.join(', ')} }`;
    if (one.length <= MAX_LINE && !one.includes('\n')) return one;
    return `{\n${items.map((i) => inner + i).join(',\n')},\n${indent}}`;
  }
  return String(v);
}

function propString(name: string, value: unknown, indent: string): string | null {
  // false 照写出来：默认开的属性（比如 showClose）关掉时要看得见。不想显示就传 undefined
  if (value === undefined || value === null) return null;
  if (name === 'className' && typeof value === 'string') {
    const cls = value.replace(DOC_ONLY, '').trim();
    return cls ? `className="${cls}"` : null;
  }
  if (value === true) return name;
  if (typeof value === 'string') return `${name}="${value.replace(/"/g, '&quot;')}"`;
  return `${name}={${jsValue(value, indent)}}`;
}

function childList(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  const walk = (c: ReactNode) => {
    if (Array.isArray(c)) c.forEach(walk);
    else if (c !== null && c !== undefined && c !== false && c !== true && c !== '') out.push(c);
  };
  walk(children);
  return out;
}

export function toJsx(node: ReactNode, indent = ''): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return indent + String(node);
  if (Array.isArray(node)) return node.map((n) => toJsx(n, indent)).filter(Boolean).join('\n');
  if (!isValidElement(node)) return '';

  const el = node as ReactElement<Record<string, unknown>>;
  const name = typeName(el.type);
  const propIndent = indent + '  ';
  const props = Object.entries(el.props)
    .filter(([k]) => k !== 'children')
    .map(([k, v]) => propString(k, v, propIndent))
    .filter((s): s is string => Boolean(s));

  // 属性一行放得下就一行，放不下每个属性一行
  const oneLine = props.length ? ' ' + props.join(' ') : '';
  const multi = props.some((p) => p.includes('\n')) || indent.length + name.length + oneLine.length + 3 > MAX_LINE;
  const attrs = multi ? '\n' + props.map((p) => propIndent + p).join('\n') + '\n' + indent : oneLine;
  const open = name ? `<${name}${attrs}` : '<';
  const kids = childList(el.props.children as ReactNode);

  if (!kids.length) return `${indent}${open}${name ? (multi ? '/>' : ' />') : '></>'}`;
  const close = `</${name}>`;
  if (kids.length === 1 && (typeof kids[0] === 'string' || typeof kids[0] === 'number')) {
    return `${indent}${open}>${kids[0]}${close}`;
  }
  const inner = kids.map((k) => toJsx(k, indent + '  ')).filter(Boolean).join('\n');
  return `${indent}${open}>\n${inner}\n${indent}${close}`;
}
