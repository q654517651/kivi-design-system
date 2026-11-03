import { placeholderImageSrc, type PlaceholderImageName, type PlaceholderImageRatio } from '@kivi';

/** 假数据：「今天」固定成 2026-10-30，方便出「2天前」 */
export const TODAY = new Date(2026, 9, 30);

export type AssetKind = 'image' | 'video' | 'audio' | 'doc';
export type AssetStatus = 'done' | 'loading' | 'failed';

export interface Asset {
  id: string;
  kind: AssetKind;
  status: AssetStatus;
  /** 生成日期 */
  date: Date;
  /** 图片、视频封面用的占位图 */
  image?: PlaceholderImageName;
  name?: string;
  duration?: string;
  collected?: boolean;
}

const d = (m: number, day: number) => new Date(2026, m - 1, day);
let n = 0;
const make = (kind: AssetKind, date: Date, rest: Partial<Asset> = {}): Asset => ({
  id: `a${n++}`,
  kind,
  status: 'done',
  date,
  ...rest,
});

const IMAGES: PlaceholderImageName[] = [
  'ip-gouache', 'kivi-future', 'bunny-gouache', 'ip-kiwi-pile', 'kiwi-glass', 'kiwi-light',
  'monstera-dots', 'ip-peek', 'ip-future',
];
const img = (i: number) => IMAGES[i % IMAGES.length];

export const ASSETS: Asset[] = [
  // 图片
  ...Array.from({ length: 11 }, (_, i) => make('image', d(10, 28), { image: img(i), collected: i === 2 })),
  make('image', d(10, 28), { status: 'loading', image: 'kivi-future' }),
  make('image', d(9, 10), { image: 'ip-future' }),
  make('image', d(9, 10), { image: 'kiwi-light', collected: true }),
  ...Array.from({ length: 3 }, (_, i) => make('image', d(8, 20), { image: img(i + 3) })),
  make('image', d(8, 20), { status: 'failed' }),
  ...Array.from({ length: 4 }, (_, i) => make('image', d(8, 7), { image: img(i + 5) })),
  // 视频
  make('video', d(10, 29)),
  make('video', d(10, 29), { status: 'loading', image: 'ip-gouache' }),
  make('video', d(9, 10), { collected: true }),
  make('video', d(9, 10)),
  make('video', d(8, 20), { status: 'failed' }),
  // 音频
  make('audio', d(10, 27), { name: '雨夜城市氛围', duration: '0:32' }),
  make('audio', d(10, 27), { name: '猕猴桃之歌 Demo', duration: '1:08' }),
  make('audio', d(9, 10), { name: '产品旁白 · 女声', duration: '0:15', collected: true }),
  // 文档
  make('doc', d(10, 28), { name: '猕猴桃海报分镜脚本', duration: 'PDF' }),
  make('doc', d(9, 10), { name: '品牌调性说明', duration: 'DOC' }),
];

/** 日期分组标题：7 天内「N天前」，更早「M月D日」 */
export function groupLabel(date: Date): string {
  const days = Math.round((TODAY.getTime() - date.getTime()) / 86400000);
  if (days <= 0) return '今天';
  if (days === 1) return '昨天';
  if (days <= 7) return `${days}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export const daysAgo = (date: Date) => Math.round((TODAY.getTime() - date.getTime()) / 86400000);

export const src = (image: PlaceholderImageName = 'ip-gouache', ratio: PlaceholderImageRatio = '1:1') =>
  placeholderImageSrc(image, ratio);

/** 画布项目 */
export interface Project {
  id: string;
  name: string;
  /** 没封面就是空画布 */
  image?: PlaceholderImageName;
  ratio?: PlaceholderImageRatio;
  modified: Date;
  archived?: boolean;
}

export const PROJECTS: Project[] = [
  { id: 'p1', name: '3D导演台', image: 'kiwi-light', ratio: '16:9', modified: d(10, 29) },
  { id: 'p2', name: '未命名画布', image: 'bunny-gouache', ratio: '3:4', modified: d(10, 20) },
  { id: 'p3', name: '未命名画布', image: 'ip-kiwi-pile', ratio: '3:4', modified: d(10, 9) },
  { id: 'p4', name: '未命名画布', modified: d(9, 8) },
  { id: 'p5', name: '视频创作', image: 'kivi-future', ratio: '16:9', modified: d(9, 8) },
  { id: 'p6', name: '未命名画布', modified: d(9, 8) },
  { id: 'p7', name: '图像创作', image: 'ip-future', ratio: '16:9', modified: d(9, 1) },
  { id: 'p8', name: '夏日饮品系列', image: 'monstera-dots', ratio: '16:9', modified: d(8, 18), archived: true },
  { id: 'p9', name: '旧版海报', modified: d(7, 3), archived: true },
];

/** 侧栏最近列表 */
export interface Recent {
  id: string;
  name: string;
  image?: PlaceholderImageName;
}
export const CHATS: Recent[] = [
  { id: 'c1', name: '默认创作', image: 'ip-future' },
  { id: 'c2', name: '4张不同比例小狗图生成', image: 'ip-gouache' },
  { id: 'c3', name: '用户连发三声你好' },
  { id: 'c4', name: 'AI回应问候邀创作' },
  { id: 'c5', name: '未命名对话' },
  { id: 'c6', name: '咨询图片扩图解决方法', image: 'ip-kiwi-pile' },
];
export const CANVASES: Recent[] = [
  { id: 'v1', name: '3D导演台', image: 'kiwi-light' },
  { id: 'v2', name: '未命名画布', image: 'bunny-gouache' },
  { id: 'v3', name: '未命名画布', image: 'ip-kiwi-pile' },
  { id: 'v4', name: '未命名画布' },
  { id: 'v5', name: '视频创作', image: 'kivi-future' },
];
