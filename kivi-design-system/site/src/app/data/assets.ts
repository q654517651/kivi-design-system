import { request } from './api';
import { db } from './db';
import { uid } from './store';
import type { Asset } from './types';

/*
  素材和文件夹的动作：收藏、删除、文件夹增删改、移进移出。
  收藏照线上先变后请求（乐观更新），请求失败退回原样再抛错。
*/

const patchAssets = (ids: string[], fn: (a: Asset) => Asset) => {
  const set = new Set(ids);
  db.set((s) => ({ ...s, assets: s.assets.map((a) => (set.has(a.id) ? fn(a) : a)) }));
};

/** 收藏 / 取消收藏（可以一次几个）。先变，失败退回 */
export async function setCollected(ids: string[], collected: boolean) {
  const before = new Map(db.get().assets.filter((a) => ids.includes(a.id)).map((a) => [a.id, a.collected]));
  patchAssets(ids, (a) => ({ ...a, collected }));
  try {
    await request(() => undefined);
  } catch (e) {
    patchAssets(ids, (a) => ({ ...a, collected: before.get(a.id) ?? a.collected }));
    throw e;
  }
}

/** 删除素材（删前先用 flows/confirm 问过） */
export function removeAssets(ids: string[]) {
  return request(() => {
    const set = new Set(ids);
    db.set((s) => ({
      ...s,
      assets: s.assets.filter((a) => !set.has(a.id)),
      // 任务里对应的那一格也去掉；一格都不剩的任务整个删
      tasks: s.tasks
        .map((t) => ({ ...t, outputs: t.outputs.filter((o) => !o.assetId || !set.has(o.assetId)) }))
        .filter((t) => t.outputs.length > 0 || t.status === 'running'),
    }));
  });
}

/** 上传一个本地文件成素材（只在本次打开有效，不存进本机） */
export function addUpload(input: Pick<Asset, 'media' | 'src' | 'ratio' | 'name' | 'duration' | 'poster'>): Asset {
  const asset: Asset = { ...input, id: uid('u'), createdAt: Date.now(), source: 'upload', collected: false, folderIds: [], local: true };
  db.set((s) => ({ ...s, assets: [...s.assets, asset] }));
  return asset;
}

// ---------- 文件夹 ----------

export function createFolder(name: string) {
  return request(() => {
    const folder = { id: uid('f'), name, createdAt: Date.now() };
    db.set((s) => ({ ...s, folders: [folder, ...s.folders] }));
    return folder;
  });
}

export function renameFolder(id: string, name: string) {
  return request(() => db.set((s) => ({ ...s, folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) })));
}

/** 删文件夹：里面的素材不删，只是不再属于它（线上：「文件夹内容在我的资产页面仍可找到」） */
export function deleteFolder(id: string) {
  return request(() =>
    db.set((s) => ({
      ...s,
      folders: s.folders.filter((f) => f.id !== id),
      assets: s.assets.map((a) => (a.folderIds.includes(id) ? { ...a, folderIds: a.folderIds.filter((x) => x !== id) } : a)),
    })),
  );
}

export function addToFolder(ids: string[], folderId: string) {
  return request(() => patchAssets(ids, (a) => (a.folderIds.includes(folderId) ? a : { ...a, folderIds: [...a.folderIds, folderId] })));
}

/** 别处的作品（探索页）存进文件夹：同一张已经存过就只加文件夹，没存过先存成素材（算上传的） */
export function saveToFolder(input: Pick<Asset, 'media' | 'src' | 'ratio' | 'poster' | 'name'>, folderId: string) {
  return request(() => {
    const had = db.get().assets.find((a) => a.source === 'upload' && a.src === input.src);
    if (had) return patchAssets([had.id], (a) => (a.folderIds.includes(folderId) ? a : { ...a, folderIds: [...a.folderIds, folderId] }));
    const asset: Asset = { ...input, id: uid('u'), createdAt: Date.now(), source: 'upload', collected: false, folderIds: [folderId] };
    db.set((s) => ({ ...s, assets: [...s.assets, asset] }));
  });
}

export function removeFromFolder(ids: string[], folderId: string) {
  return request(() => patchAssets(ids, (a) => ({ ...a, folderIds: a.folderIds.filter((x) => x !== folderId) })));
}
