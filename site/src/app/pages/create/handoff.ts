import type { GenFrames, GenParamValues, GenTask, PromptBoxSubmit, ReferenceStackItem } from '@kivi';

/*
  首页提交生成后进对话页，输入框接着用这次的配置（任务类型、模型、参考方式、提示词、参数、张数、素材），
  照线上：提交后提示词不清空，换页也一样（11-20 修 R-7）。只在这次打开有效。
*/

/** 输入框整组回填：重新编辑、首页带过来都用它 */
export interface ComposerFill {
  key: number;
  task: Exclude<GenTask, 'agent'>;
  model?: string;
  refMode?: string;
  text: string;
  frames?: GenFrames;
  params: GenParamValues;
  count: number;
}

const pending = new Map<string, { fill: ComposerFill; refs: ReferenceStackItem[] }>();

export function handOffComposer(chatId: string, s: PromptBoxSubmit) {
  if (s.task === 'agent') return;
  pending.set(chatId, {
    fill: { key: Date.now(), task: s.task, model: s.model, refMode: s.refMode, text: s.text, frames: s.frames, params: s.params, count: s.count },
    refs: s.references,
  });
}

/** 对话页挂上时读（开发模式下初始化会跑两次，所以只读不删） */
export const peekComposer = (chatId: string) => pending.get(chatId);

/** 对话页挂好以后清掉，下次进来不再回填 */
export const clearComposer = (chatId: string) => void pending.delete(chatId);
