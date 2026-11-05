import { createContext } from 'react';

/**
 * 输入框和参考区之间的联络：参考区展开时浮在提示词上面，输入框要把被盖住的那几行字藏起来。
 * 参考区展开到多宽，就告诉输入框多宽（收起时传 0），再告诉它展开用多长时间，遮罩跟着同步。只在组件库内部用，不对外导出。
 */
export interface PromptBoxContextValue {
  setCoverWidth: (width: number, duration?: string) => void;
}

export const PromptBoxContext = createContext<PromptBoxContextValue | null>(null);
