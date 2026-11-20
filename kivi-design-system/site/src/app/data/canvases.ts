import { request } from './api';
import { db } from './db';
import { uid } from './store';
import { cloneTemplate } from './workflows';
import type { CanvasMeta, DB } from './types';

/*
  画布列表的动作：新建、重命名、置顶、删除。侧栏的画布历史、资产页「我的画布」读 db.canvases。
  画布里的节点、连线在 db.canvasDocs（命令在 canvas-doc.ts），删画布时一起删。
*/

const patchCanvas = (id: string, fn: (c: CanvasMeta) => CanvasMeta) => db.set((s) => ({ ...s, canvases: s.canvases.map((c) => (c.id === id ? fn(c) : c)) }));

/** 新建一块空画布 */
export function createCanvas(name: string): Promise<CanvasMeta> {
  return request(() => {
    const canvas: CanvasMeta = { id: uid('c'), name, updatedAt: Date.now(), covers: [] };
    db.set((s) => ({ ...s, canvases: [canvas, ...s.canvases] }));
    return canvas;
  });
}

/** 重命名（不动更新时间，列表不跳） */
export function renameCanvas(id: string, name: string) {
  return request(() => patchCanvas(id, (c) => ({ ...c, name })));
}

/** 置顶 / 取消置顶（翻转） */
export function pinCanvas(id: string) {
  return request(() => patchCanvas(id, (c) => ({ ...c, pinned: !c.pinned })));
}

export function deleteCanvas(id: string) {
  return request(() => db.set((s) => dropCanvas(s, id)));
}

const dropCanvas = (s: DB, id: string): DB => {
  const { [id]: _gone, ...docs } = s.canvasDocs;
  return { ...s, canvases: s.canvases.filter((c) => c.id !== id), canvasDocs: docs };
};

/** 进画布页没带画布（新建画布、技能「使用」）：马上建一块「未命名画布」，返回 id（不走请求，进页面不该失败） */
export function ensureCanvas(name = '未命名画布'): string {
  const canvas: CanvasMeta = { id: uid('c'), name, updatedAt: Date.now(), covers: [] };
  db.set((s) => ({ ...s, canvases: [canvas, ...s.canvases] }));
  return canvas.id;
}

/** 复制出来的画布 id → 源画布 id（CanvasHeader 的 onDuplicate 先记，随后 onCanvasesChange 里取） */
const duplicateSource = new Map<string, string>();
export function noteDuplicate(sourceId: string, newId: string) {
  duplicateSource.set(newId, sourceId);
}

/**
 * 画布页左上角的画布切换（CanvasHeader）改了列表：新建、复制、改名、删除都在它里面做，这里同步进数据。
 * 复制出来的画布按 onDuplicate 给的源画布 id 找原画布，节点、组、连线都换新 id 一起复制
 */
export function syncCanvasList(next: { id: string; name: string }[]) {
  db.set((s) => {
    let out = s;
    const ids = new Set(next.map((c) => c.id));
    for (const c of s.canvases) if (!ids.has(c.id)) out = dropCanvas(out, c.id);
    for (const c of next) {
      const old = out.canvases.find((x) => x.id === c.id);
      if (old) {
        if (old.name !== c.name) out = { ...out, canvases: out.canvases.map((x) => (x.id === c.id ? { ...x, name: c.name } : x)) };
        continue;
      }
      const sourceId = duplicateSource.get(c.id);
      duplicateSource.delete(c.id);
      const source = sourceId ? out.canvases.find((x) => x.id === sourceId) : undefined;
      const sourceDoc = source ? out.canvasDocs[source.id] : undefined;
      const meta: CanvasMeta = { id: c.id, name: c.name, updatedAt: Date.now(), covers: source?.covers ?? [] };
      out = {
        ...out,
        canvases: [meta, ...out.canvases],
        canvasDocs: sourceDoc
          ? { ...out.canvasDocs, [c.id]: (() => { const { nodes, edges } = cloneTemplate(sourceDoc); return { nodes, edges: edges.map((e) => ({ ...e, id: uid('e') })) }; })() }
          : out.canvasDocs,
      };
    }
    return out;
  });
}
