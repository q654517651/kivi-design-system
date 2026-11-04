// 全局搜索的数据类型。索引由 scripts/search-index.mjs 生成，格式两边要一致。

/** 条目类型：页面 / 二、三、四级标题 / 正文 / 表格行 / 变量 / 图标 */
export const KIND = { page: 0, h2: 1, h3: 2, h4: 3, text: 4, row: 5, token: 6, icon: 7 } as const;
export type Kind = (typeof KIND)[keyof typeof KIND];

export interface IndexPage {
  path: string;
  title: string;
  /** 目录里的分组：基础 / 操作 / 导航 … */
  group: string;
  /** 这页里的标题：[锚点 id, 路径 "参数 › Button"] */
  heads: [id: string, crumb: string][];
}

/** [类型, 页下标, heads 下标（没有是 -1）, 标题, 正文] */
export type IndexItem = [kind: Kind, page: number, head: number, title: string, text: string];

export interface IndexData {
  pages: IndexPage[];
  items: IndexItem[];
}

/** 准备好的一条：显示用的字段 + 匹配用的规整后的字段 */
export interface Entry {
  kind: Kind;
  /** 页面路径，比如 /components/button */
  path: string;
  /** 标题的锚点 id（正文、表格行取所在小节的）；页面、变量、图标没有 */
  anchor?: string;
  pageTitle: string;
  /** 第一行：标题（正文取所在小节的名字） */
  label: string;
  /** 第二行前半：页名 › 小节 */
  crumb: string;
  /** 第二行后半：命中的那句话、表格里其余的格子、一句话说明 */
  snippet: string;
  /** 跳转后找位置用：正文、表格行的原文；变量是 CSS 变量名，图标是图标名 */
  needle: string;
  key: string;

  // 匹配用
  nt: string;
  nc: string;
  nx: string;
  /** nx 的权重：正文 0.4，表格行、变量、图标的「其余内容」更重要 */
  wx: number;
  ws: string[];
  ini: string;
  starts: Set<number>;
}

export interface Hit {
  entry: Entry;
  score: number;
}

/** 存在本机的「最近打开」：只记跳转要用的 */
export type Recent = Pick<Entry, 'kind' | 'path' | 'anchor' | 'pageTitle' | 'label' | 'crumb' | 'snippet' | 'needle' | 'key'>;
