import { createStore, useStore } from './store';
import { ASSETS_SEED } from './seed/assets';
import { CANVAS_SEED } from './seed/canvas';
import { CREATE_SEED } from './seed/create';
import type { Asset, DB } from './types';
import { pic } from './mock';
import { workflowSeed } from './seed/workflows';

/*
  全站一份数据（假后端的「数据库」）。所有页面读它；改它只能通过 data/ 里的动作函数（tasks.ts、assets.ts…）。
  种子数据按页分文件放在 seed/，这里拼起来。存进本机，演示开关里能重置。
*/

/** 改了 DB 的形状或种子数据就加 1，本机存的旧数据作废 */
const VERSION = 13;

/** 初始余额 */
export const INITIAL_BALANCE = 2000;

export const db = createStore<DB>({
  key: 'kivi-app-db',
  version: VERSION,
  init: () => ({
    balance: INITIAL_BALANCE,
    tasks: [...CREATE_SEED.tasks, ...ASSETS_SEED.tasks],
    assets: [...CREATE_SEED.assets, ...ASSETS_SEED.assets],
    folders: ASSETS_SEED.folders,
    chats: CREATE_SEED.chats,
    canvases: CANVAS_SEED.canvases,
    canvasDocs: CANVAS_SEED.canvasDocs,
    canvasChats: CANVAS_SEED.canvasChats,
    agentTurns: CREATE_SEED.agentTurns,
    workflows: workflowSeed(),
    // 探索页一开始收藏着的作品（照原来的演示）
    favorites: ['w2', 'w9', 'w15'],
    flags: {},
  }),
  // 本次上传的本地文件（blob: 地址）刷新后就没了：上传的素材、拿它当原图的任务、结果直接用原图的素材都不存，
  // 不然刷新后历史里留一张「加载失败」。画布节点里上传的素材刷新后回到空素材（11-20 用户定），
  // 对话里带的本地附件去掉，自己上传的工作流封面换回占位图
  save: (s) => ({
    ...s,
    assets: s.assets.filter((a: Asset) => !a.local && !isBlob(a.src)),
    tasks: s.tasks.filter((t) => !t.refs.some((r) => isBlob(r.src))),
    canvasDocs: dropBlobs(s.canvasDocs),
    canvasChats: dropBlobs(s.canvasChats),
    agentTurns: dropBlobs(s.agentTurns),
    chats: dropBlobs(s.chats),
    workflows: s.workflows.map((w) => (isBlob(w.cover) ? { ...w, cover: pic(0, '16:9') } : w)),
  }),
});

const isBlob = (src?: unknown) => typeof src === 'string' && src.startsWith('blob:');

/** 去掉 blob 地址：列表里 src 是 blob 的那一项整项去掉（节点回到空素材），别的字段是 blob 的删掉这个字段 */
function dropBlobs<T>(v: T): T {
  if (Array.isArray(v)) return v.filter((x) => !(x && typeof x === 'object' && isBlob((x as { src?: unknown }).src))).map(dropBlobs) as T;
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) if (!isBlob(x)) out[k] = dropBlobs(x);
    return out as T;
  }
  return v;
}

/** 读一部分数据，见 store.ts 的 useStore 说明 */

export const useDB = <S,>(selector: (s: DB) => S) => useStore(db, selector);

export const useBalance = () => useDB((s) => s.balance);

/** 按 id 找，找不到返回 undefined */
export const byId = <T extends { id: string }>(list: T[], id: string | undefined) => (id ? list.find((x) => x.id === id) : undefined);
