// 演示用：生成按钮的消耗跟着模型走（数字是示例，线上由后端按模型下发）。主站模板和输入框演示共用这一份。

const COST: Record<string, number> = {
  'gpt-image-2': 4,
  'nano-banana-pro': 6,
  'nano-banana-2': 3,
  'seedream-5-lite': 2,
  'seedream-4.5': 2,
  'qwen-image-3.0': 2,
  'seedance-2.0': 99,
  'seedance-2.0-fast': 60,
  'seedance-2.5': 120,
  'kling-v3-omni': 110,
  'veo-3.1-fast': 80,
  'sora-2': 90,
};

/** 按模型取消耗：表里没有的，图片 3、视频 60、音频 2 */
export function demoCost(task: string, model: string): number {
  if (task === 'audio') return 2;
  return COST[model] ?? (task === 'image' ? 3 : 60);
}
