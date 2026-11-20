import type { TaskInput } from '../../data/tasks';
import type { Where } from '../../data/types';
import { nearestRatio } from '../../data/mock';
import type { ToolJob } from './types';

/*
  把一次工具生成转成假任务的入参。工具页、创作页的工具弹窗共用，提交走 submitTask。
*/

export function toolTaskInput(job: ToolJob, where: Where): TaskInput {
  return {
    kind: 'tool',
    media: job.media,
    where,
    tool: job.tool,
    label: job.label,
    params: job.params ?? {},
    refs: [{ type: job.media, src: job.src }, ...(job.src2 ? [{ type: job.media, src: job.src2 }] : [])],
    ratio: nearestRatio(job.targetRatio),
    cost: job.cost ?? 0,
    // 扩图、智能编辑出新画面；别的工具画面不变，结果直接用原图
    echo: job.tool !== 'expand' && job.tool !== 'edit',
  };
}
