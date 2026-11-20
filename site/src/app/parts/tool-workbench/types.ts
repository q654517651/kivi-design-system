import type { Media, ToolId } from '../../data/tools';

/*
  工具工作区用到的类型：原图、一次生成要交出去的东西、各工具的参数。
*/

/** 一个工具的原图 / 原视频：每个工具各放各的 */
export interface Source {
  id: string;
  media: Media;
  src: string;
  /** 宽 / 高 */
  ratio: number;
  /** 视频时长（秒），按时长算消耗用；读不出来不写 */
  duration?: number;
}

/** 生成一次要交出去的东西：工具页提交成任务，创作页弹窗放进对话 */
export interface ToolJob {
  tool: ToolId;
  /** 名字：工具名，智能编辑写编辑方式 */
  label: string;
  media: Media;
  /** 原图 / 原视频 */
  src: string;
  /** 视频拼接的第二段 */
  src2?: string;
  ratio: number;
  /** 出来的结果大概是什么比例（扩图按扩图框） */
  targetRatio: number;
  /** 参数，按显示顺序（任务里记下来，比如 { 放大倍数: '2 倍' }） */
  params?: Record<string, string>;
  /** 消耗的猕猴桃（工具工作区一定会填；没搬的创作页自己拼的不带，提交任务时按 0） */
  cost?: number;
}

/** 各工具的参数，整页记一份：切工具再切回来还在 */
export interface ToolState {
  expandRatio: string;
  /** 扩图倍数（原比例时用）：原图四周一起往外扩到几倍；手动拖了扩图框就是空的 */
  expandScale: string;
  hdScale: string;
  /** 视频抠图的输出模式：透明视频 / 蒙版视频（照线上） */
  cutoutOutput: string;
  editMode: string;
  /** 智能重绘用的模型 */
  editModel: string;
  videoRes: string;
  fps: number;
  loop: string;
}

export const INITIAL_STATE: ToolState = {
  expandRatio: 'original',
  expandScale: '1.5',
  hdScale: '2',
  cutoutOutput: 'alpha',
  editMode: 'inpaint',
  editModel: 'nano-banana-2',
  videoRes: '1080P',
  fps: 30,
  loop: 'auto',
};
