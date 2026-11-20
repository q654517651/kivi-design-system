import { DEFAULT_MODEL, GEN_PARAM_DEFAULTS, compatibleModel, countInputs, genCost, genTotalCost, toast, type NodePanelSubmit } from '@kivi';
import { CANVAS_TEXT, GROUP_PAD, isMediaNode, NODE_NAME, SCATTER_GAP, connectProblem, nodeSize } from '../rules/canvas';
import { GROUP_TEXT, MAX_NODES } from '../rules/canvas-group';
import { listDelay } from './api';
import { db, useDB } from './db';
import { nearestRatio } from './mock';
import { createStore, uid, useStore } from './store';
import { cancelTask, onTaskSettled, submitTask } from './tasks';
import type { CanvasDoc, CanvasEdge, CanvasItem, CanvasNode, CanvasNodeType, Media, Ratio, Task } from './types';

/*
  画布的数据和命令（照线上画布，规则在 rules/canvas.ts）。
  - 每块画布一份 CanvasDoc（节点、连线、视角），存在 db.canvasDocs，刷新还在。
  - 改画布只能调这里的命令；改动进撤销栈（每块画布一份，在内存里，最多 50 步，刷新就没了）。
    视角、提示词和参数这类不进撤销栈。
  - 节点生成走全站的假任务（tasks.ts），节点只记 taskId；任务出结果时这里把结果写回节点。
  - 「忙」= 生成中或上传中：不能删、不能复制、不能打组（照线上）。
*/

const EMPTY: CanvasDoc = { nodes: [], edges: [] };

export const getDoc = (canvasId: string): CanvasDoc => db.get().canvasDocs[canvasId] ?? EMPTY;
export const useCanvasDoc = (canvasId: string) => useDB((s) => s.canvasDocs[canvasId] ?? EMPTY);

function put(canvasId: string, doc: CanvasDoc, touch = true) {
  db.set((s) => ({
    ...s,
    canvasDocs: { ...s.canvasDocs, [canvasId]: doc },
    canvases: touch ? s.canvases.map((c) => (c.id === canvasId ? { ...c, updatedAt: Date.now() } : c)) : s.canvases,
  }));
}

// ---------- 撤销重做 ----------

interface History {
  past: CanvasDoc[];
  future: CanvasDoc[];
}
const HISTORY_LIMIT = 50;
const histories = new Map<string, History>();
/** 只用来通知界面「撤销栈变了」 */
const historyTick = createStore({ init: () => 0 });
const bump = () => historyTick.set((n) => n + 1);
const historyOf = (id: string) => {
  let h = histories.get(id);
  if (!h) histories.set(id, (h = { past: [], future: [] }));
  return h;
};
/** 撤销只管节点和连线，视角保持现在的 */
const content = (d: CanvasDoc): CanvasDoc => ({ nodes: d.nodes, edges: d.edges });

export function useHistory(canvasId: string) {
  useStore(historyTick, (n) => n);
  const h = histories.get(canvasId);
  return { canUndo: !!h?.past.length, canRedo: !!h?.future.length };
}

/** 改一次画布：进撤销栈（canvas-layout.ts、canvas-group.ts 也用） */
export function commit(canvasId: string, fn: (doc: CanvasDoc) => CanvasDoc) {
  const prev = getDoc(canvasId);
  const next = fn(prev);
  if (next === prev) return;
  const h = historyOf(canvasId);
  h.past.push(content(prev));
  if (h.past.length > HISTORY_LIMIT) h.past.shift();
  h.future = [];
  put(canvasId, next);
  bump();
}

/** 改一次画布：不进撤销栈（提示词、参数、生成结果、视角） */
export function patch(canvasId: string, fn: (doc: CanvasDoc) => CanvasDoc, touch = true) {
  const prev = getDoc(canvasId);
  const next = fn(prev);
  if (next !== prev) put(canvasId, next, touch);
}

export function undo(canvasId: string) {
  const h = historyOf(canvasId);
  const prev = h.past.pop();
  if (!prev) return;
  const cur = getDoc(canvasId);
  h.future.push(content(cur));
  put(canvasId, restore(prev, cur));
  bump();
}

export function redo(canvasId: string) {
  const h = historyOf(canvasId);
  const next = h.future.pop();
  if (!next) return;
  const cur = getDoc(canvasId);
  h.past.push(content(cur));
  put(canvasId, restore(next, cur));
  bump();
}

/** 不进撤销栈改的东西（生成面板的输入、生成结果）：撤销 / 重做时留现在的，只还原位置、大小、连线、增删（11-20 修 C-12） */
const LIVE_KEYS = ['prompt', 'model', 'refMode', 'params', 'count', 'loras', 'clip', 'pack', 'taskId', 'items', 'archive'] as const;

/**
 * 把快照套回画布：两边都有的节点，结构用快照的、生成相关的用现在的；
 * 快照里没有、但正在生成 / 上传的节点不撤掉（任务还在跑），连着它的线也留着。视角保持现在的
 */
function restore(snap: CanvasDoc, cur: CanvasDoc): CanvasDoc {
  const now = new Map(cur.nodes.map((n) => [n.id, n]));
  const nodes = snap.nodes.map((n) => {
    const live = now.get(n.id);
    if (!live) return n;
    const keep: Partial<CanvasNode> = {};
    for (const k of LIVE_KEYS) (keep as Record<string, unknown>)[k] = live[k];
    return { ...n, ...keep };
  });
  const inSnap = new Set(snap.nodes.map((n) => n.id));
  const busy = cur.nodes.filter((n) => !inSnap.has(n.id) && isBusy(n));
  const all = [...nodes, ...busy];
  const ids = new Set(all.map((n) => n.id));
  const edgeIds = new Set(snap.edges.map((e) => e.id));
  const busyEdges = busy.length ? cur.edges.filter((e) => !edgeIds.has(e.id) && ids.has(e.from) && ids.has(e.to)) : [];
  return { ...snap, nodes: all, edges: [...snap.edges, ...busyEdges], view: cur.view };
}

// ---------- 忙：生成中、上传中 ----------

/** 上传中的节点（只在内存里：刷新后本地文件也没了） */
const uploadingStore = createStore<Record<string, true>>({ init: () => ({}) });
export const useUploading = () => useStore(uploadingStore, (s) => s);
const setUploading = (nodeId: string, on: boolean) =>
  uploadingStore.set((s) => {
    const next = { ...s };
    if (on) next[nodeId] = true;
    else delete next[nodeId];
    return next;
  });

export function isBusy(node: CanvasNode): boolean {
  if (uploadingStore.get()[node.id]) return true;
  const task = node.taskId ? db.get().tasks.find((t) => t.id === node.taskId) : undefined;
  return task?.status === 'running';
}

/** 一组节点里有没有忙的（组算上它里面的） */
const anyBusy = (doc: CanvasDoc, ids: string[]) => withChildren(doc, ids).some((id) => {
  const n = doc.nodes.find((x) => x.id === id);
  return n ? isBusy(n) : false;
});

// ---------- 查 ----------

export const nodeById = (doc: CanvasDoc, id: string) => doc.nodes.find((n) => n.id === id);
/** 连进这个节点的上游，按连接顺序 */
export const upstreamOf = (doc: CanvasDoc, id: string) =>
  doc.edges.filter((e) => e.to === id).map((e) => nodeById(doc, e.from)).filter((n): n is CanvasNode => !!n);
/** 组和它里面的节点 */
export function withChildren(doc: { nodes: CanvasNode[] }, ids: string[]): string[] {
  const set = new Set(ids);
  for (const n of doc.nodes) if (n.parentId && set.has(n.parentId)) set.add(n.id);
  return [...set];
}

// ---------- 新建 ----------

/** 新节点的默认样子：按类型和比例定尺寸、默认名 */
export function makeNode(type: CanvasNodeType, at: { x: number; y: number }, extra: Partial<CanvasNode> = {}): CanvasNode {
  const ratio = extra.ratio ?? (type === 'image' ? '1:1' : type === 'video' ? '16:9' : undefined);
  const size = nodeSize(type, ratio);
  return { id: uid('n'), type, name: NODE_NAME[type], x: Math.round(at.x), y: Math.round(at.y), ...size, ratio, ...extra };
}

/** 节点上限（照线上 node-limit-guard）：再加 n 个会超 500 就提示、返回 false。提示 1 秒内只出一次 */
let limitWarnedAt = 0;
export function roomForNodes(canvasId: string, n: number): boolean {
  if (getDoc(canvasId).nodes.length + n <= MAX_NODES) return true;
  if (Date.now() - limitWarnedAt > 1000) {
    limitWarnedAt = Date.now();
    toast.warning(GROUP_TEXT.nodeLimit(MAX_NODES));
  }
  return false;
}

/** 加几个节点（和它们之间的连线）；返回新节点 id。超过节点上限就不加，返回空 */
export function addNodes(canvasId: string, nodes: CanvasNode[], edges: Omit<CanvasEdge, 'id'>[] = []): string[] {
  if (!roomForNodes(canvasId, nodes.length)) return [];
  commit(canvasId, (d) => ({
    ...d,
    nodes: [...d.nodes, ...nodes],
    edges: [...d.edges, ...edges.filter((e) => !connectProblem({ ...d, nodes: [...d.nodes, ...nodes] }, e.from, e.to)).map((e) => ({ ...e, id: uid('e') }))],
  }));
  return nodes.map((n) => n.id);
}

// ---------- 改 ----------

/** 改节点的内容（名字、文字、比例…），进撤销栈 */
export function updateNode(canvasId: string, nodeId: string, p: Partial<CanvasNode>) {
  commit(canvasId, (d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === nodeId ? { ...n, ...p } : n)) }));
}

/** 改生成面板里的东西（提示词、模型、参数、张数），不进撤销栈 */
export function setNodeInputs(canvasId: string, nodeId: string, p: Pick<Partial<CanvasNode>, 'prompt' | 'model' | 'refMode' | 'params' | 'count' | 'loras' | 'clip' | 'pack'>) {
  patch(canvasId, (d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === nodeId ? { ...n, ...p } : n)) }));
}

/** 记下节点最近一次的任务（处理器导出：剪辑 / 封装节点和它的结果节点都记，生成中就是忙的），不进撤销栈 */
export function setNodeTask(canvasId: string, nodeIds: string[], taskId: string) {
  patch(canvasId, (d) => ({ ...d, nodes: d.nodes.map((n) => (nodeIds.includes(n.id) ? { ...n, taskId } : n)) }));
}

/** 视角：不进撤销栈，也不算「改过画布」 */
export function setView(canvasId: string, view: CanvasDoc['view']) {
  patch(canvasId, (d) => ({ ...d, view }), false);
}

/**
 * 拖完松手：节点挪到新位置。普通节点中心落在组里就进组，拖出来就出组；组跟着里面的节点重新算大小。
 * moves 里是节点的新左上角（组挪动时，组和里面的节点都在 moves 里）
 */
export function moveNodes(canvasId: string, moves: Record<string, { x: number; y: number }>) {
  commit(canvasId, (d) => {
    let nodes = d.nodes.map((n) => (moves[n.id] ? { ...n, ...moves[n.id] } : n));
    const groups = nodes.filter((n) => n.type === 'group');
    nodes = nodes.map((n) => {
      if (n.type === 'group' || !moves[n.id]) return n;
      // 跟着组一起挪的不换组
      if (n.parentId && moves[n.parentId]) return n;
      const cx = n.x + n.w / 2;
      const cy = n.y + n.h / 2;
      const host = groups.find((g) => cx > g.x && cx < g.x + g.w && cy > g.y && cy < g.y + g.h);
      return host?.id === n.parentId ? n : { ...n, parentId: host?.id };
    });
    return { ...d, nodes: fitGroups(nodes) };
  });
}

/** 组的大小跟着里面的节点：包住所有子节点，加内边距；空组保持原样 */
export function fitGroups(nodes: CanvasNode[]): CanvasNode[] {
  return nodes.map((g) => {
    if (g.type !== 'group') return g;
    const kids = nodes.filter((n) => n.parentId === g.id);
    if (!kids.length) return g;
    const x = Math.min(...kids.map((k) => k.x)) - GROUP_PAD.x;
    const y = Math.min(...kids.map((k) => k.y)) - GROUP_PAD.top;
    const r = Math.max(...kids.map((k) => k.x + k.w)) + GROUP_PAD.x;
    const b = Math.max(...kids.map((k) => k.y + k.h)) + GROUP_PAD.bottom;
    return { ...g, x, y, w: r - x, h: b - y };
  });
}

// ---------- 删 ----------

/** 删节点（组连同里面的）和连线；有忙的节点就不删，提示原因。返回删了没有 */
export function removeItems(canvasId: string, nodeIds: string[], edgeIds: string[] = []): boolean {
  const d = getDoc(canvasId);
  if (anyBusy(d, nodeIds)) {
    toast.error(CANVAS_TEXT.busyDelete);
    return false;
  }
  const drop = new Set(withChildren(d, nodeIds));
  const dropEdges = new Set(edgeIds);
  commit(canvasId, (doc) => ({
    ...doc,
    nodes: doc.nodes.filter((n) => !drop.has(n.id)),
    edges: doc.edges.filter((e) => !dropEdges.has(e.id) && !drop.has(e.from) && !drop.has(e.to)),
  }));
  return true;
}

// ---------- 连线 ----------

/** 连一条线：不行就提示原因，返回 false */
export function connect(canvasId: string, from: string, to: string): boolean {
  const problem = connectProblem(getDoc(canvasId), from, to);
  if (problem) {
    toast.error(problem);
    return false;
  }
  commit(canvasId, (d) => ({ ...d, edges: [...d.edges, { id: uid('e'), from, to }] }));
  return true;
}

export function disconnect(canvasId: string, edgeIds: string[]) {
  const drop = new Set(edgeIds);
  commit(canvasId, (d) => ({ ...d, edges: d.edges.filter((e) => !drop.has(e.id)) }));
}

/** 断开 from → to 那条（首尾帧里删了一张） */
export function disconnectPair(canvasId: string, from: string, to: string) {
  commit(canvasId, (d) => ({ ...d, edges: d.edges.filter((e) => !(e.from === from && e.to === to)) }));
}

/** 生成面板里拖着排参考 = 改连进来的顺序：把 from 那条挪到 target 那条的位置 */
export function reorderInputs(canvasId: string, to: string, from: string, target: string) {
  commit(canvasId, (d) => {
    const i = d.edges.findIndex((e) => e.from === from && e.to === to);
    const j = d.edges.findIndex((e) => e.from === target && e.to === to);
    if (i < 0 || j < 0) return d;
    const edges = [...d.edges];
    edges.splice(j, 0, ...edges.splice(i, 1));
    return { ...d, edges };
  });
}

// ---------- 复制、副本 ----------

/** 复制出来的节点：新 id、不带任务（生成状态不跟着复制）、错开 offset；它们之间的连线一起复制 */
function cloneNodes(d: { nodes: CanvasNode[]; edges: Omit<CanvasEdge, 'id'>[] }, ids: string[], offset: { x: number; y: number }) {
  const all = withChildren(d, ids);
  const map = new Map(all.map((id) => [id, uid('n')]));
  const nodes = d.nodes
    .filter((n) => map.has(n.id))
    .map((n) => ({ ...n, id: map.get(n.id)!, x: n.x + offset.x, y: n.y + offset.y, taskId: undefined, parentId: n.parentId && map.get(n.parentId) }));
  const edges = d.edges.filter((e) => map.has(e.from) && map.has(e.to)).map((e) => ({ from: map.get(e.from)!, to: map.get(e.to)! }));
  return { nodes, edges };
}

/** 剪贴板（只在这个页面里；从别的站点粘贴照线上提示不行） */
let clipboard: { nodes: CanvasNode[]; edges: Omit<CanvasEdge, 'id'>[] } | null = null;
export const hasClipboard = () => !!clipboard;

export function copyNodes(canvasId: string, ids: string[]): boolean {
  const d = getDoc(canvasId);
  if (!ids.length) {
    toast.error(CANVAS_TEXT.noSelection);
    return false;
  }
  if (anyBusy(d, ids)) {
    toast.error(CANVAS_TEXT.busyCopy);
    return false;
  }
  clipboard = cloneNodes(d, ids, { x: 0, y: 0 });
  toast.success(GROUP_TEXT.copied);
  return true;
}

/** 粘贴到 at（世界坐标，复制的那一堆的左上角放这）；返回新节点 id */
export function pasteNodes(canvasId: string, at: { x: number; y: number }): string[] {
  if (!clipboard) return [];
  const minX = Math.min(...clipboard.nodes.map((n) => n.x));
  const minY = Math.min(...clipboard.nodes.map((n) => n.y));
  const copy = cloneNodes(clipboard, clipboard.nodes.filter((n) => !n.parentId || !clipboard!.nodes.some((p) => p.id === n.parentId)).map((n) => n.id), { x: at.x - minX, y: at.y - minY });
  return addNodes(canvasId, copy.nodes, copy.edges);
}

/** 创建副本：放在原来的右下 40；返回新节点 id */
export function duplicateNodes(canvasId: string, ids: string[]): string[] {
  const d = getDoc(canvasId);
  if (!ids.length) return [];
  if (anyBusy(d, ids)) {
    toast.error(CANVAS_TEXT.busyDuplicate);
    return [];
  }
  const copy = cloneNodes(d, ids, { x: 40, y: 40 });
  return addNodes(canvasId, copy.nodes, copy.edges);
}

/**
 * 展开所有图片（照线上）：多张结果的节点拆成一张一个节点，原节点留第一张，其余 2 列往右下排、间距 40，
 * 都接上原节点的上游。返回所有节点 id（原节点在第一个）
 */
export function scatterImages(canvasId: string, nodeId: string): string[] {
  const d = getDoc(canvasId);
  const node = nodeById(d, nodeId);
  if (!node?.items || node.items.length < 2) return [nodeId];
  if (isBusy(node)) return [nodeId];
  if (!roomForNodes(canvasId, node.items.length - 1)) return [nodeId];
  const [first, ...rest] = node.items;
  const nodes = rest.map((item, i) => {
    const j = i + 1;
    return { ...node, id: uid('n'), name: `${node.name} ${j + 1}`, taskId: undefined, items: [item], x: node.x + (j % 2) * (node.w + SCATTER_GAP), y: node.y + Math.floor(j / 2) * (node.h + SCATTER_GAP) };
  });
  const ups = d.edges.filter((e) => e.to === nodeId);
  commit(canvasId, (doc) => ({
    ...doc,
    nodes: [...doc.nodes.map((n) => (n.id === nodeId ? { ...n, items: [first] } : n)), ...nodes],
    edges: [...doc.edges, ...nodes.flatMap((n) => ups.map((e) => ({ id: uid('e'), from: e.from, to: n.id })))],
  }));
  return [nodeId, ...nodes.map((n) => n.id)];
}

// ---------- 组 ----------

/**
 * 打组（照线上多选浮条「打组」）：忙的不能打；选中的里有组就「拍平重组」——选中的组都解开，
 * 组里的节点和选中的节点一起放进一个新组（叫「新建组」）。返回新组 id（画布选中它）
 */
export function groupNodes(canvasId: string, ids: string[]): string | undefined {
  const d = getDoc(canvasId);
  if (anyBusy(d, ids)) {
    toast.warning(CANVAS_TEXT.busyGroup);
    return undefined;
  }
  const picked = d.nodes.filter((n) => ids.includes(n.id));
  const groups = new Set(picked.filter((n) => n.type === 'group').map((n) => n.id));
  const members = new Set([...picked.filter((n) => n.type !== 'group').map((n) => n.id), ...d.nodes.filter((n) => n.parentId && groups.has(n.parentId)).map((n) => n.id)]);
  if (!members.size) {
    toast.warning(CANVAS_TEXT.cannotGroup);
    return undefined;
  }
  const group = makeNode('group', { x: 0, y: 0 }, { name: GROUP_TEXT.newGroup });
  commit(canvasId, (doc) => ({
    ...doc,
    // 组放在最前面（画布上组单独画在节点下面）
    nodes: fitGroups([group, ...doc.nodes.filter((n) => !groups.has(n.id)).map((n) => (members.has(n.id) ? { ...n, parentId: group.id } : n))]),
  }));
  return group.id;
}

export function ungroup(canvasId: string, groupId: string) {
  commit(canvasId, (d) => ({
    ...d,
    nodes: d.nodes.filter((n) => n.id !== groupId).map((n) => (n.parentId === groupId ? { ...n, parentId: undefined } : n)),
  }));
}

// ---------- 上传 ----------

const mediaOf = (f: File): Media | 'text' => (f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : f.type.startsWith('image') ? 'image' : 'text');

/** 读本地文件：图片宽高、视频宽高和时长、音频时长、文本内容 */
function probe(f: File): Promise<{ src: string; poster?: string; ratio?: Ratio; duration?: string; text?: string }> {
  const media = mediaOf(f);
  if (media === 'text') return f.text().then((text) => ({ src: '', text }));
  const src = URL.createObjectURL(f);
  const clock = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : undefined);
  return new Promise((resolve) => {
    if (media === 'image') {
      const el = new Image();
      el.onload = () => resolve({ src, ratio: nearestRatio(el.naturalWidth / el.naturalHeight || 1) });
      el.onerror = () => resolve({ src, ratio: '1:1' });
      el.src = src;
      return;
    }
    const el = document.createElement(media === 'video' ? 'video' : 'audio');
    el.preload = 'metadata';
    el.muted = true;
    const done = (poster?: string) =>
      resolve({
        src,
        poster,
        ratio: media === 'video' ? nearestRatio((el as HTMLVideoElement).videoWidth / (el as HTMLVideoElement).videoHeight || 16 / 9) : undefined,
        duration: clock(el.duration),
      });
    el.onloadedmetadata = () => {
      if (media !== 'video') return done();
      // 视频：跳到靠前一点抽一帧当封面（blob 地址）；抽不到就没有封面
      const v = el as HTMLVideoElement;
      let settled = false;
      const finish = (poster?: string) => {
        if (settled) return;
        settled = true;
        done(poster);
      };
      window.setTimeout(() => finish(), 3000);
      v.onseeked = () => {
        try {
          const c = document.createElement('canvas');
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
          c.toBlob((b) => finish(b ? URL.createObjectURL(b) : undefined), 'image/jpeg', 0.85);
        } catch {
          finish();
        }
      };
      v.currentTime = Math.min(0.1, (v.duration || 0) / 2);
    };
    el.onerror = () => resolve({ src });
    el.src = src;
  });
}

/** 拖进来 / 粘贴的文件：每个文件一个素材节点，从 at 开始逐个错开 stagger；先出上传中，传完换成内容。返回新节点 id */
export async function addFileNodes(canvasId: string, files: File[], at: { x: number; y: number }, stagger: number): Promise<string[]> {
  const metas = await Promise.all(files.map(probe));
  const nodes = files.map((f, i) => {
    const media = mediaOf(f);
    const m = metas[i];
    const pos = { x: at.x + i * stagger, y: at.y + i * stagger };
    if (media === 'text') return makeNode('text', pos, { name: f.name, text: m.text });
    return makeNode(media, pos, { name: f.name, upload: true, ratio: m.ratio, items: [{ src: m.src, duration: m.duration, poster: m.poster }] });
  });
  const ids = addNodes(canvasId, nodes);
  // 假上传：转一会儿圈（慢网更久）
  nodes.filter((n) => n.upload).forEach((n) => setUploading(n.id, true));
  window.setTimeout(() => nodes.forEach((n) => setUploading(n.id, false)), listDelay() + 400);
  return ids;
}

/**
 * 生成面板的快捷上传（照线上 createPrefixNode）：本地文件建一个素材节点，放在这个节点左边（离 200，撞上了往右下错开），
 * 连进来排在参考最后；先出上传中，传完换成内容。返回新节点 id
 */
export async function addUpstreamFile(canvasId: string, nodeId: string, file: File): Promise<string | undefined> {
  const media = mediaOf(file);
  if (media === 'text') return undefined;
  const m = await probe(file);
  const d = getDoc(canvasId);
  const target = nodeById(d, nodeId);
  if (!target) return undefined;
  const size = nodeSize(media, m.ratio);
  const at = freeSpot(d, { x: target.x - size.w - 200, y: target.y + target.h / 2 - size.h / 2 }, size);
  const node = makeNode(media, at, { name: file.name, upload: true, ratio: m.ratio, items: [{ src: m.src, duration: m.duration, poster: m.poster }] });
  const [id] = addNodes(canvasId, [node], [{ from: node.id, to: nodeId }]);
  if (!id) return undefined;
  setUploading(id, true);
  window.setTimeout(() => setUploading(id, false), listDelay() + 400);
  return id;
}

/** 素材节点右上「上传」：换一个文件 */
export async function replaceNodeFile(canvasId: string, nodeId: string, file: File) {
  const m = await probe(file);
  setUploading(nodeId, true);
  updateNode(canvasId, nodeId, { name: file.name, items: [{ src: m.src, duration: m.duration, poster: m.poster }], ...(m.ratio ? { ratio: m.ratio, ...nodeSize(nodeById(getDoc(canvasId), nodeId)!.type, m.ratio) } : {}) });
  window.setTimeout(() => setUploading(nodeId, false), listDelay() + 400);
}

// ---------- 生成 ----------

/**
 * 节点生成：上游节点的内容当参考（图片、视频、音频按连接顺序，文字拼进提示词前面），走假任务。
 * 模型接不了这么多参考就自动换一个接得了的（照线上，Toast 说一声）。余额不足、断网抛 ApiError，交给 attempt。
 */
export async function generateNode(canvasId: string, nodeId: string, s: NodePanelSubmit) {
  const d = getDoc(canvasId);
  const node = nodeById(d, nodeId);
  if (!node || !isMediaNode(node)) return;
  const ups = upstreamOf(d, nodeId);
  const refs = ups
    .filter((n) => n.type !== 'text' && n.items?.[0])
    .map((n) => ({ type: n.type as Media, src: n.items![0].src, label: s.frames ? (n.id === s.frames.first ? '首帧' : n.id === s.frames.last ? '尾帧' : undefined) : undefined }));
  let model = s.model;
  if (node.type !== 'text') {
    const swap = compatibleModel(node.type, countInputs(refs.map((r) => r.type)), s.model, s.refMode);
    if (swap && swap !== s.model) {
      model = swap;
      setNodeInputs(canvasId, nodeId, { model });
      toast.info('当前模型不支持这么多参考素材，已切换为兼容的模型');
    }
  }
  const upstreamText = ups.filter((n) => n.type === 'text' && n.text).map((n) => n.text).join('\n');
  const ratio = (s.params.ratio as Ratio | undefined) ?? node.ratio ?? '1:1';
  const task = await submitTask({
    kind: 'gen',
    media: node.type,
    where: { page: 'canvas', canvasId, nodeId },
    prompt: [upstreamText, s.text].filter(Boolean).join('\n') || undefined,
    model,
    params: s.params,
    refs,
    refMode: node.type === 'video' ? s.refMode : undefined,
    ratio,
    count: s.count,
    cost: genCost(node.type, model) * s.count,
  });
  // 改了比例：空节点（还没结果）跟着比例改尺寸，有内容的不动（照线上）
  const resize = (node.type === 'image' || node.type === 'video') && !node.items?.length && ratio !== node.ratio ? { ratio, ...nodeSize(node.type, ratio) } : {};
  patch(canvasId, (doc) => ({ ...doc, nodes: doc.nodes.map((n) => (n.id === nodeId ? { ...n, ...resize, taskId: task.id } : n)) }));
  stopStarts.set(task.id, Date.now());
}

/*
  生成后停止（11-19 照线上 node-cancel-manager）：拿到任务号起 10 秒内能停，过了不能停。
  起点只记在内存里：刷新后就是「已锁定」（同线上）。停了退回猕猴桃，节点回到生成前的样子
*/
const stopStarts = new Map<string, number>();
export const stopStartOf = (taskId?: string) => (taskId ? stopStarts.get(taskId) : undefined);

export async function stopNodeGen(canvasId: string, nodeId: string) {
  const node = nodeById(getDoc(canvasId), nodeId);
  const taskId = node?.taskId;
  if (!taskId) return;
  try {
    await cancelTask(taskId);
  } catch {
    // 取消失败（演示开关断网、接口出错）：照线上只提示「取消失败」，按钮锁定
    stopStarts.delete(taskId);
    toast.error('取消失败');
    return;
  }
  stopStarts.delete(taskId);
  patch(canvasId, (d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === nodeId && n.taskId === taskId ? { ...n, taskId: undefined } : n)) }));
  toast.success('任务取消成功');
}

/** 任务出结果：写回节点。成功的结果放进节点（多张叠放，新的在上面）；失败节点自己从任务读失败态 */
function applyResult(task: Task) {
  if (task.where.page !== 'canvas' || !task.where.nodeId || task.status !== 'done') return;
  const { canvasId, nodeId } = task.where;
  const { assets } = db.get();
  const node = nodeById(getDoc(canvasId), nodeId);
  if (!node) return;
  // 视频封装导出的压缩包：不进素材，节点记「导出完成」
  if (node.type === 'archive') {
    patch(canvasId, (d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === nodeId ? { ...n, archive: { fileName: n.archive?.fileName ?? '视频封装.zip', done: true } } : n)) }));
    return;
  }
  if (task.media === 'text') {
    const text = task.outputs.find((o) => o.text)?.text;
    if (text) patch(canvasId, (d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === nodeId ? { ...n, text } : n)) }));
    return;
  }
  const items: CanvasItem[] = task.outputs
    .map((o) => assets.find((a) => a.id === o.assetId))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .map((a) => ({ src: a.src, poster: a.poster, duration: a.duration, assetId: a.id }));
  if (!items.length) return;
  patch(canvasId, (d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === nodeId ? { ...n, items } : n)) }));
}
onTaskSettled(applyResult);

/** 生成中、失败：节点读自己的任务 */
export const useNodeTask = (taskId?: string) => useDB((s) => (taskId ? s.tasks.find((t) => t.id === taskId) : undefined));

// ---------- 给 Agent 用（照线上 Agent 工具 createNode / createEdge / executeNode） ----------

/** 画布现在视口的中心（世界坐标）：画布挂上时登记，Agent 没有源节点时把节点放这（照线上） */
const viewCenters = new Map<string, () => { x: number; y: number }>();
export function registerViewCenter(canvasId: string, get: () => { x: number; y: number }) {
  viewCenters.set(canvasId, get);
  return () => {
    if (viewCenters.get(canvasId) === get) viewCenters.delete(canvasId);
  };
}

type AgentSelectListener = (canvasId: string, ids: string[]) => void;
const agentSelectListeners = new Set<AgentSelectListener>();
/** Agent 建了节点：画布选中它（照线上 autoSelect，不移镜头） */
export function onAgentSelect(listener: AgentSelectListener) {
  agentSelectListeners.add(listener);
  return () => agentSelectListeners.delete(listener);
}

/**
 * Agent 建一个生成节点：有源节点（用户添加到对话的节点）就放在第一个源节点右边 200 并连上，
 * 没有就放在视口中心（照线上）；和别的节点叠上了往右下错开。返回节点
 */
export function agentCreateNode(
  canvasId: string,
  g: { media: Media; ratio: Ratio; model: string; params: Record<string, string>; count: number; prompt: string },
  sourceIds: string[],
): CanvasNode {
  const d = getDoc(canvasId);
  const sources = sourceIds.map((id) => nodeById(d, id)).filter((n): n is CanvasNode => !!n && n.type !== 'group');
  const size = nodeSize(g.media, g.media === 'audio' ? undefined : g.ratio);
  const center = viewCenters.get(canvasId)?.() ?? { x: 0, y: 0 };
  const want = sources[0] ? { x: sources[0].x + sources[0].w + 200, y: sources[0].y + sources[0].h / 2 - size.h / 2 } : { x: center.x - size.w / 2, y: center.y - size.h / 2 };
  const at = freeSpot(d, want, size);
  const node = makeNode(g.media, at, { ...(g.media === 'audio' ? {} : { ratio: g.ratio }), model: g.model, params: g.params, count: String(g.count), prompt: g.prompt });
  addNodes(canvasId, [node], sources.map((src) => ({ from: src.id, to: node.id })));
  agentSelectListeners.forEach((l) => l(canvasId, [node.id]));
  return node;
}

/**
 * 工作流「应用」（照线上 applyWorkflowTemplate）：整段节点和连线复制进来，中心对准视口中心；
 * 和已有节点叠上了整段往右下错开。给了 groupTitle（工作流名）就套一个组（照线上 wrapWorkflowJSONWithGroup）：
 * 模板里本来就有外层组的，组改名叫工作流名；没有的，整段套进一个新组。
 * 返回要选中的 id：套了组就是组，没套就是全部新节点（画布再选中、把它们放进视野）
 */
export function insertTemplate(canvasId: string, t: { nodes: CanvasNode[]; edges: { from: string; to: string }[] }, groupTitle?: string): string[] {
  if (!t.nodes.length) return [];
  const d = getDoc(canvasId);
  const title = groupTitle?.trim();
  let nodes = t.nodes;
  if (title) {
    const outer = nodes.filter((n) => n.type === 'group' && !n.parentId);
    if (outer.length) nodes = nodes.map((n) => (n.type === 'group' && !n.parentId ? { ...n, name: title } : n));
    else {
      const group = makeNode('group', { x: 0, y: 0 }, { name: title });
      nodes = fitGroups([group, ...nodes.map((n) => ({ ...n, parentId: group.id }))]);
    }
  }
  const x0 = Math.min(...nodes.map((n) => n.x));
  const y0 = Math.min(...nodes.map((n) => n.y));
  const w = Math.max(...nodes.map((n) => n.x + n.w)) - x0;
  const h = Math.max(...nodes.map((n) => n.y + n.h)) - y0;
  const center = viewCenters.get(canvasId)?.() ?? { x: 0, y: 0 };
  const at = freeSpot(d, { x: center.x - w / 2, y: center.y - h / 2 }, { w, h });
  nodes = nodes.map((n) => ({ ...n, x: Math.round(n.x - x0 + at.x), y: Math.round(n.y - y0 + at.y) }));
  const ids = addNodes(canvasId, nodes, t.edges);
  if (!ids.length || !title) return ids;
  return nodes.filter((n) => n.type === 'group' && !n.parentId).map((n) => n.id);
}

/**
 * 历史「应用到画布」（照线上 useApplyAsset）：按素材建一个素材节点（上传语义，只有结果、不带生成参数），
 * 放在视口中心，叠上了往右下错开。返回节点 id
 */
export function placeAsset(canvasId: string, a: { id: string; media: Media; src: string; poster?: string; duration?: string; ratio: Ratio; name?: string }): string {
  const size = nodeSize(a.media, a.media === 'audio' ? undefined : a.ratio);
  const center = viewCenters.get(canvasId)?.() ?? { x: 0, y: 0 };
  const at = freeSpot(getDoc(canvasId), { x: center.x - size.w / 2, y: center.y - size.h / 2 }, size);
  const node = makeNode(a.media, at, {
    name: a.name || NODE_NAME[a.media],
    upload: true,
    ...(a.media === 'audio' ? {} : { ratio: a.ratio }),
    items: [{ src: a.src, poster: a.poster, duration: a.duration, assetId: a.id }],
  });
  addNodes(canvasId, [node]);
  return node.id;
}

/** 按节点自己记的提示词、模型、参数执行一次（Agent 确认生成、自动生成时） */
export function executeNode(canvasId: string, nodeId: string) {
  const node = nodeById(getDoc(canvasId), nodeId);
  if (!node || !isMediaNode(node)) return Promise.resolve();
  const defaults = node.type === 'text' ? {} : GEN_PARAM_DEFAULTS[node.type];
  return generateNode(canvasId, nodeId, {
    text: node.prompt ?? '',
    model: node.model ?? DEFAULT_MODEL[node.type],
    refMode: node.refMode ?? 'omni',
    params: { ...defaults, ...node.params },
    count: node.type === 'image' || node.type === 'video' ? Number(node.count ?? 1) : 1,
  });
}

/** 这个节点生成一次要多少猕猴桃（确认卡上写） */
export function nodeCost(node: CanvasNode) {
  if (!isMediaNode(node)) return 0;
  return genTotalCost(node.type, node.model ?? DEFAULT_MODEL[node.type], Number(node.count ?? 1));
}

/** 找个空位：从 at 开始往右下错开 40，避开已有节点（组除外） */
function freeSpot(d: CanvasDoc, at: { x: number; y: number }, size: { w: number; h: number }) {
  let p = { x: Math.round(at.x), y: Math.round(at.y) };
  const hit = (q: { x: number; y: number }) => d.nodes.some((n) => n.type !== 'group' && q.x < n.x + n.w && q.x + size.w > n.x && q.y < n.y + n.h && q.y + size.h > n.y);
  for (let i = 0; i < 20 && hit(p); i++) p = { x: p.x + 40, y: p.y + 40 };
  return p;
}

// ---------- 给工具节点用（节点工具栏：抠图、高清、循环…，逻辑在 data/canvas-tools.ts） ----------

/** 把一次任务记到节点上（生成中、失败、出结果都从任务读），不进撤销栈 */
export function attachTask(canvasId: string, nodeId: string, taskId: string, extra: Partial<CanvasNode> = {}) {
  patch(canvasId, (d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === nodeId ? { ...n, ...extra, taskId } : n)) }));
}

/** 改工具节点的参数（高清倍数、帧速率…），不进撤销栈 */
export function setToolParams(canvasId: string, nodeId: string, params: Record<string, string>) {
  patch(canvasId, (d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === nodeId ? { ...n, params: { ...n.params, ...params } } : n)) }));
}

/** 让画布选中这些节点（工具栏建了工具节点后；和 Agent 建节点走同一条通道，不移镜头） */
export function requestSelect(canvasId: string, ids: string[]) {
  agentSelectListeners.forEach((l) => l(canvasId, ids));
}
