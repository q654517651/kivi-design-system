import { toast } from '@kivi';
import { removeAssets, setCollected } from '../../data/assets';
import { handleError } from '../../flows/errors';
import { confirmDelete } from '../../flows/delete';
import { downloadMedia } from '../../flows/files';
import type { Asset } from '../../data/types';

/*
  资产页的动作：生成历史、文件夹内页、批量条共用，页面里不再各写一份。
  收藏先变后请求（失败退回）；删除先确认；其余请求出错统一交给 handleError。
*/

/** 跑一个请求：成功 Toast 说一句，出错交给 handleError。返回是否成功 */
export async function run(action: () => Promise<unknown>, success?: string): Promise<boolean> {
  try {
    await action();
    if (success) toast.success(success);
    return true;
  } catch (e) {
    handleError(e);
    return false;
  }
}

/** 收藏 / 取消收藏（可以一次几个） */
export const collectAssets = (ids: string[], collected: boolean) => run(() => setCollected(ids, collected));

/** 删除素材：先确认，返回是否删了 */
export const deleteAssets = (ids: string[]) => confirmDelete(() => removeAssets(ids));

/** 下载：一个直接存，几个打 ZIP（flows/files）。一次最多 20 个 */
export const DOWNLOAD_LIMIT = 20;
export const downloadAssets = (items: Pick<Asset, 'src'>[]) => void downloadMedia(items.map((a) => ({ src: a.src })));
