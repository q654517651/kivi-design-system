import { toast } from '@kivi';
import { writeClipboard } from '@kivi/hooks';

/*
  分享画布（照线上 ShareToolbarButton）：复制分享链接、Toast「分享链接已复制」。
  演示里链接是假的（11-20 用户定：分享保持假的），剪贴板写不进去也照常提示。
  画布右上角、资产页和创作首页画布卡的「分享」都走它。
*/
export async function shareCanvas(canvasId: string) {
  await writeClipboard(`https://kivi.example/canvas/share/${canvasId}`);
  toast.success('分享链接已复制');
}
