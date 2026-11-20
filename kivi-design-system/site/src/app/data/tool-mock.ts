import { ApiError, listDelay } from './api';
import { demo } from './demo';

/*
  AI 工具页的假后端：上传视频要等一会儿。失败态用演示开关「下次生成失败」看（11-20 用户定，不再固定第一次失败）。
*/

/** 假上传：等一会儿（和列表加载一样的时长，慢网更久）；断网报错 */
export function uploadMock(): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (demo.get().offline) reject(new ApiError('network', '网络连接失败，请检查网络后重试'));
      else resolve();
    }, listDelay());
  });
}
