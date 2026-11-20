import { toast } from '@kivi';
import { saveToFolder } from '../../data/assets';
import type { Work } from '../../data/catalog';
import { sendToReference } from '../../data/ref-inbox';
import { run } from '../assets/ops';
import { downloadMedia } from '../../flows/files';

/*
  探索作品的动作（11-20 用户定做成真的）：发现页右键、作品详情、创作首页的发现卡共用。
  - 下载：下载作品本身（占位素材）
  - 添加到参考图：排进创作页输入框的参考区（去创作页就能看到），视频放封面
  - 添加到文件夹：存成「我的资产」里的素材放进那个文件夹
*/

export const downloadWork = (w: Work) => void downloadMedia([{ src: w.src }]);

export function addWorkToReference(w: Work) {
  sendToReference({ type: w.video ? 'video' : 'image', src: w.video ? (w.poster ?? w.src) : w.src });
  toast.success('已添加到创作页的参考图');
}

export const saveWorkToFolder = (w: Work, folderId: string) =>
  void run(() => saveToFolder({ media: w.video ? 'video' : 'image', src: w.src, poster: w.poster, ratio: w.ratio, name: w.prompt.slice(0, 20) }, folderId), '已添加到文件夹');
