import type { CanvasDoc, CanvasNode } from '../../data/types';
import { upstreamOf } from '../../data/canvas-doc';
import { downloadMedia, type DownloadItem } from '../../flows/files';

/*
  画布里的下载（11-20 用户定做成真的）：节点下当前主图（第一张），文字节点存成 txt；
  多选、组一次下几个打成 ZIP；压缩包节点把封装进去的视频打成它自己名字的 ZIP。
*/

const filesOf = (n: CanvasNode): DownloadItem[] =>
  n.items?.[0] ? [{ src: n.items[0].src, name: n.name }] : n.text ? [{ text: n.text, name: n.name }] : [];

export const downloadNodes = (nodes: CanvasNode[]) => void downloadMedia(nodes.flatMap(filesOf));

/** 下载一个节点：压缩包节点下封装的内容，别的下它自己 */
export function downloadNode(doc: CanvasDoc, n: CanvasNode) {
  if (n.type !== 'archive') return downloadNodes([n]);
  const files = upstreamOf(doc, n.id).flatMap((pack) => upstreamOf(doc, pack.id)).flatMap(filesOf);
  void downloadMedia(files, { zipName: (n.archive?.fileName ?? n.name).replace(/\.zip$/i, '') });
}
