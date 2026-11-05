import { KIND, type Entry, type Hit, type IndexData, type Kind } from './types';

// 全局搜索的匹配、排序、建议。纯函数，不碰 DOM、不引任何搜索库。
//
// 匹配（每个词分别算，词和词之间是「且」，一个词没命中这条就不要）：
//   整条一样 > 开头一样 > 在词的开头 > 在中间 > 缩写（pb → PromptBox）> 隔着几个字（生面 → 生成面板）> 拼错一两个字母（Mdoel → Model）
//   标题的分最高，页名和小节名 ×0.42，正文 ×0.4（表格行、变量、图标的内容更重要，×0.6 / 0.7）
// 排序：匹配分 + 类型加分（页面 > 二级标题 > 三级标题 > 图标 > 变量 > 四级标题 > 表格行 = 正文）+ 最近打开过的加分，同分按文档顺序。
// 空格、横线、斜杠、大小写都不影响：menu item、menu-item、MenuItem 是同一个词。

// ---------- 规整 ----------

const SEP = /[\s\-_/.:,;·、，。：；()（）[\]{}「」『』《》"'`“”‘’→←|>›—–+*#@!?！？=]+/g;
const WORD = /[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+|[㐀-鿿]+/g;

/** 去掉分隔符、转小写 */
export const norm = (s: string) => s.toLowerCase().replace(SEP, '');

/** 按驼峰、数字、汉字拆词：IconButton → icon / button */
export const splitWords = (s: string) => (s.match(WORD) ?? []).map((w) => w.toLowerCase());

const isLatin = (s: string) => /^[a-z0-9]+$/.test(s);

// ---------- 准备 ----------

// 页面、组件（标题）、图标比表格里的一行更像「想找的东西」：同样匹配，前者排前面
const BONUS: Record<Kind, number> = {
  [KIND.page]: 34,
  [KIND.h2]: 28,
  [KIND.h3]: 20,
  [KIND.h4]: 10,
  [KIND.icon]: 14,
  [KIND.token]: 10,
  [KIND.row]: 0,
  [KIND.text]: 0,
};

const WX: Record<Kind, number> = {
  [KIND.page]: 0.4,
  [KIND.h2]: 0.4,
  [KIND.h3]: 0.4,
  [KIND.h4]: 0.4,
  [KIND.text]: 0.4,
  [KIND.row]: 0.6,
  [KIND.token]: 0.6,
  [KIND.icon]: 0.7,
};

const LEGACY = '/legacy-names';

export interface Engine {
  entries: Entry[];
  vocab: Vocab[];
}

interface Vocab {
  text: string;
  n: string;
  weight: number;
  starts: Set<number>;
}

/** 词起点在规整后字符串里的位置，用来给「在词的开头」加分 */
function startsOf(title: string): Set<number> {
  const set = new Set<number>();
  let pos = 0;
  for (const w of splitWords(title)) {
    set.add(pos);
    pos += norm(w).length;
  }
  return set;
}

const lastPart = (crumb: string) => crumb.split(' › ').pop() ?? '';
const parentPath = (crumb: string) => crumb.split(' › ').slice(0, -1).join(' › ');
const join = (...xs: string[]) => xs.filter(Boolean).join(' › ');

const VOCAB_WEIGHT: Partial<Record<Kind, number>> = {
  [KIND.page]: 6,
  [KIND.h2]: 5,
  [KIND.h3]: 3,
  [KIND.icon]: 2,
  [KIND.row]: 1,
};

/** 把索引变成能搜的条目，并从标题里攒一份词表（给建议用） */
export function createEngine(data: IndexData): Engine {
  const entries: Entry[] = [];
  const vocabMap = new Map<string, Vocab>();
  const addVocab = (text: string, kind: Kind) => {
    const weight = VOCAB_WEIGHT[kind];
    const n = norm(text);
    if (!weight || n.length < 2 || text.length > 28) return;
    const old = vocabMap.get(n);
    if (old) old.weight += weight;
    else vocabMap.set(n, { text, n, weight, starts: startsOf(text) });
  };

  for (const [kind, pi, hi, title, text] of data.items) {
    const page = data.pages[pi];
    const head = hi >= 0 ? page.heads[hi] : undefined;
    const section = head?.[1] ?? '';
    const base = { kind, path: page.path, pageTitle: page.title, anchor: head?.[0] } as const;
    let e: Omit<Entry, 'nt' | 'nc' | 'nx' | 'wx' | 'ws' | 'ini' | 'starts' | 'key'>;
    let searchTitle = title;
    let searchText = text;

    switch (kind) {
      case KIND.page:
        e = { ...base, anchor: undefined, label: title, crumb: page.group, snippet: text, needle: '' };
        break;
      case KIND.h2:
      case KIND.h3:
      case KIND.h4:
        e = { ...base, label: title, crumb: join(page.title, parentPath(section)), snippet: '', needle: '' };
        break;
      case KIND.text:
        // 标题字段留空，整句话当正文：正文只做原样匹配，不做模糊
        e = { ...base, label: lastPart(section) || page.title, crumb: join(page.title, parentPath(section)), snippet: title, needle: title };
        searchTitle = '';
        searchText = title;
        break;
      case KIND.row:
        e = { ...base, label: title, crumb: join(page.title, section), snippet: text, needle: title };
        break;
      case KIND.token:
        // 正文是「Figma 名 · 说明 · 用法」
        e = { ...base, anchor: undefined, label: title, crumb: page.title, snippet: text, needle: title };
        break;
      case KIND.icon: {
        // 正文是「分组 · 意思」
        const [group, ...rest] = text.split(' · ');
        e = { ...base, anchor: undefined, label: title, crumb: join(page.title, group), snippet: rest.join(' · '), needle: title };
        break;
      }
    }

    entries.push({
      ...e,
      key: `${e.path}#${e.anchor ?? ''}|${kind}|${e.label}|${e.needle.slice(0, 24)}`,
      nt: norm(searchTitle),
      nc: norm(`${page.title} ${section}`),
      nx: norm(searchText),
      wx: WX[kind],
      ws: splitWords(searchTitle),
      ini: splitWords(searchTitle).map((w) => w[0]).join(''),
      starts: startsOf(searchTitle),
    });

    // 词表：页名、标题、图标名，和不太长的表格第一格（属性名）
    if (kind === KIND.row) {
      if (/^[A-Za-z_][\w-]{1,23}$/.test(title)) addVocab(title, kind);
    } else if (kind !== KIND.text && kind !== KIND.token) {
      addVocab(title, kind);
    }
  }
  return { entries, vocab: [...vocabMap.values()] };
}

// ---------- 单个字段的匹配分 ----------

/** 整条一样 100；开头一样 82–94；在词的开头 66–80；在中间 52–66 */
function fieldScore(term: string, f: string, starts?: Set<number>): number {
  if (!f) return 0;
  if (f === term) return 100;
  const i = f.indexOf(term);
  if (i === -1) return 0;
  const cover = term.length / f.length;
  if (i === 0) return 82 + 12 * cover;
  const atStart = starts?.has(i) ?? false;
  return 52 + (atStart ? 14 : 0) + 14 * cover - Math.min(i, 12) * 0.5;
}

/** 隔着几个字：term 的每个字按顺序出现在 f 里，跨度不超过 term 长度 + 3。越连着、越紧越高，最高 36 */
function subseq(term: string, f: string): number {
  if (term.length < 2 || !f || f.length > 48) return 0;
  let best = 0;
  for (let from = f.indexOf(term[0]); from !== -1; from = f.indexOf(term[0], from + 1)) {
    let k = 0;
    let runs = 0;
    let last = -2;
    for (let j = from; j < f.length && k < term.length; j++) {
      if (f[j] === term[k]) {
        if (j !== last + 1) runs++;
        last = j;
        k++;
      }
    }
    if (k < term.length) break;
    const span = last - from + 1;
    if (span > term.length + 3) continue;
    best = Math.max(best, 26 + 12 * (term.length / span) - (runs - 1) * 1.5);
  }
  return Math.min(best, 36);
}

/** 缩写：pb → PromptBox、gp → GenPrompt。至少两个字母 */
function acronym(term: string, e: Entry): number {
  if (term.length < 2 || !isLatin(term) || e.ws.length < 2) return 0;
  if (e.ini.startsWith(term)) return 46;
  // 词很多的长标题（表格里的整句），只认从头缩写，不然什么都能凑出来
  return e.ws.length <= 4 && e.ini.includes(term) ? 38 : 0;
}

/** 拼错：编辑距离（含相邻两个字母换位）。4 个字母以上才算，8 个以上允许错两处 */
function osa(a: string, b: string, max: number): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[n];
}

function typo(term: string, e: Entry): number {
  if (term.length < 4 || !isLatin(term)) return 0;
  const max = term.length >= 8 ? 2 : 1;
  let best = max + 1;
  for (const w of e.ws) if (w.length >= 3) best = Math.min(best, osa(term, w, max));
  if (e.ws.length > 1 && e.nt.length <= 24) best = Math.min(best, osa(term, e.nt, max));
  return best <= max ? 40 - 8 * best : 0;
}

/** 一个词对一条的分，0 是没命中 */
function termScore(term: string, e: Entry): number {
  // 一两个字母的英文词（pb、ui）：分隔符去掉后会和别的词连在一起乱命中（drop-border 里有 pb、--g-playground 开头是 gp），
  // 所以只认标题里某个词以它开头，或者缩写
  if (term.length <= 2 && isLatin(term)) {
    const word = e.ws.some((w) => w.startsWith(term));
    const direct = e.nt === term ? 100 : word ? (e.ws[0].startsWith(term) ? 80 : 62) : 0;
    return Math.max(direct, acronym(term, e));
  }
  let s = fieldScore(term, e.nt, e.starts);
  if (e.nc) s = Math.max(s, fieldScore(term, e.nc) * 0.42);
  if (e.nx) s = Math.max(s, fieldScore(term, e.nx) * e.wx);
  // 直接匹配不够好才试模糊，且只对标题，正文不模糊（不然太吵）
  if (s < 60 && e.nt) s = Math.max(s, acronym(term, e), subseq(term, e.nt), typo(term, e));
  return s;
}

// ---------- 搜索 ----------

export interface Query {
  /** 原样的词（高亮用），小写 */
  raw: string[];
  /** 规整后的词 */
  terms: string[];
}

export function parseQuery(q: string): Query {
  const raw: string[] = [];
  const terms: string[] = [];
  for (const piece of q.trim().split(/\s+/)) {
    const n = norm(piece);
    if (!n) continue;
    raw.push(piece.toLowerCase());
    terms.push(n);
  }
  return { raw, terms };
}

export interface SearchOptions {
  /** 最近打开过的条目 key，加分 */
  boost?: ReadonlySet<string>;
}

/** 搜。返回已经排好序的全部命中 */
export function search(engine: Engine, q: Query, { boost }: SearchOptions = {}): Hit[] {
  const { terms } = q;
  if (!terms.length) return [];
  const phrase = terms.length > 1 ? terms.join('') : '';
  const hits: Hit[] = [];
  for (const e of engine.entries) {
    let sum = 0;
    let ok = true;
    for (const t of terms) {
      const s = termScore(t, e);
      if (s <= 0) {
        ok = false;
        break;
      }
      sum += s;
    }
    if (!ok) continue;
    let score = sum / terms.length + BONUS[e.kind];
    // 几个词连起来出现在标题里（menu item → MenuItem）
    if (phrase && e.nt.includes(phrase)) score += 15;
    if (boost?.has(e.key)) score += 8;
    // 旧名对照是查旧名用的，正常搜词时让它排在正文规范后面（页名、标题不扣）
    if (e.path === LEGACY && e.kind >= KIND.text) score -= 8;
    hits.push({ entry: e, score });
  }
  // 稳定排序：同分按文档顺序
  hits.sort((a, b) => b.score - a.score);
  return hits;
}

// ---------- 建议 ----------

export interface Suggestion {
  /** 点了之后整个输入框变成这个 */
  query: string;
  /** 显示的词 */
  text: string;
}

/** 输入框里最后一个词的起止位置 */
function lastToken(q: string): { start: number; text: string } | null {
  const m = /(\S+)$/.exec(q);
  return m ? { start: m.index, text: m[1] } : null;
}

/** 在词表里找和 term 接近的：开头一样、在词的开头、拼错 */
function nearVocab(engine: Engine, term: string, limit: number, allowExact = false): Vocab[] {
  const scored: { v: Vocab; s: number }[] = [];
  for (const v of engine.vocab) {
    if (!allowExact && v.n === term) continue;
    let s = 0;
    if (v.n.startsWith(term)) s = 30 - Math.min(10, (v.n.length - term.length) * 0.5);
    else {
      const i = v.n.indexOf(term);
      if (i > 0 && v.starts.has(i)) s = 18;
      else if (term.length >= 4 && isLatin(term)) {
        const max = term.length >= 8 ? 2 : 1;
        const d = osa(term, v.n, max);
        if (d <= max) s = 14 - d * 4;
        else if (v.n.length > term.length) {
          // 少打了后半截又打错了一个字母：和同样长的开头比
          // 首字母得一样（glass 不能补成 class）
          const d2 = term[0] === v.n[0] ? osa(term, v.n.slice(0, term.length), 1) : 2;
          if (d2 <= 1) s = 8 - d2 * 2;
        }
      }
    }
    if (s > 0) scored.push({ v, s: s + Math.min(v.weight, 12) * 0.3 });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.v);
}

/** 边打边出的补全：把最后一个词补成词表里的写法。输入以空格结尾时不补 */
export function complete(engine: Engine, q: string, limit = 5): Suggestion[] {
  if (/\s$/.test(q)) return [];
  const tok = lastToken(q);
  if (!tok) return [];
  const n = norm(tok.text);
  if (n.length < 1) return [];
  const head = q.slice(0, tok.start);
  return nearVocab(engine, n, limit).map((v) => ({ query: head + v.text, text: v.text }));
}

/** 一条都没搜到时：你是不是想搜。对每个词找词表里最接近的，拼回整句 */
export function didYouMean(engine: Engine, q: string, limit = 4): Suggestion[] {
  const pieces = q.trim().split(/\s+/).filter((p) => norm(p));
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  pieces.forEach((p, i) => {
    const n = norm(p);
    for (const v of nearVocab(engine, n, limit, true)) {
      if (v.n === n) continue;
      const query = pieces.map((x, j) => (j === i ? v.text : x)).join(' ');
      if (seen.has(query)) continue;
      seen.add(query);
      out.push({ query, text: query });
    }
  });
  // 整句当一个词再找一遍（menuitm → MenuItem）
  const whole = norm(q);
  if (pieces.length > 1 && whole) {
    for (const v of nearVocab(engine, whole, limit, true)) {
      if (!seen.has(v.text)) {
        seen.add(v.text);
        out.push({ query: v.text, text: v.text });
      }
    }
  }
  return out.slice(0, limit);
}

// ---------- 高亮 ----------

/** 在 text 里把命中的词标出来：返回 [文字, 是否命中] 的片段。只认原样出现的词，不认模糊命中 */
export function highlight(text: string, raw: string[]): [string, boolean][] {
  const low = text.toLowerCase();
  const marks: [number, number][] = [];
  for (const t of raw) {
    if (!t) continue;
    for (let i = low.indexOf(t); i !== -1; i = low.indexOf(t, i + t.length)) marks.push([i, i + t.length]);
  }
  if (!marks.length) return [[text, false]];
  marks.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const m of marks) {
    const last = merged[merged.length - 1];
    if (last && m[0] <= last[1]) last[1] = Math.max(last[1], m[1]);
    else merged.push([...m]);
  }
  const out: [string, boolean][] = [];
  let pos = 0;
  for (const [a, b] of merged) {
    if (a > pos) out.push([text.slice(pos, a), false]);
    out.push([text.slice(a, b), true]);
    pos = b;
  }
  if (pos < text.length) out.push([text.slice(pos), false]);
  return out;
}

/** 截一段命中附近的话，前后加省略号 */
export function excerpt(text: string, raw: string[], max = 90): string {
  if (text.length <= max) return text;
  const low = text.toLowerCase();
  let at = -1;
  for (const t of raw) {
    const i = t ? low.indexOf(t) : -1;
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return `${text.slice(0, max)}…`;
  const start = Math.max(0, Math.min(at - 20, text.length - max));
  return `${start > 0 ? '…' : ''}${text.slice(start, start + max)}${start + max < text.length ? '…' : ''}`;
}
