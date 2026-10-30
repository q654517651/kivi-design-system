/*
  KIVI · 生成中：汇聚时拼出的类型图标
  图标是 Figma「图标」页的 ImageGeneration、VideoGeneration、Audio、Text，和节点「待生成」用的是同一套。
  不另抄一份：直接从 icons.ts 的 SVG 字符串里解析出每个 <path> 的 d 和 fill-rule。
  只给点阵动效算「哪些格子要亮」，不会画到页面上。图标 24×24，按填充轮廓算。
*/
import { ICONS, type IconName } from '../icons';

export type GeneratingType = 'image' | 'video' | 'audio' | 'text';

export interface Shape {
  /** SVG path，24×24 */
  d: string;
  /** fill-rule="evenodd" */
  evenodd?: boolean;
}

/** 每种类型用 Figma 图标页的哪个图标 */
const ICON_OF: Record<GeneratingType, IconName> = {
  image: 'ImageGeneration',
  video: 'VideoGeneration',
  audio: 'Audio',
  text: 'Text',
};

/** 从 SVG 字符串里取出每个 <path> 的 d 和 fill-rule */
function parse(svg: string): Shape[] {
  const out: Shape[] = [];
  for (const m of svg.matchAll(/<path\b([^>]*?)\/?>/g)) {
    const attrs = m[1];
    const d = /(?:^|\s)d="([^"]*)"/.exec(attrs)?.[1];
    if (d) out.push({ d, evenodd: /fill-rule="evenodd"/.test(attrs) || undefined });
  }
  return out;
}

export const SHAPES: Record<GeneratingType, Shape[]> = {
  image: parse(ICONS[ICON_OF.image]),
  video: parse(ICONS[ICON_OF.video]),
  audio: parse(ICONS[ICON_OF.audio]),
  text: parse(ICONS[ICON_OF.text]),
};
