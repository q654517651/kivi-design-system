import { createContext } from 'react';

// QuestionPanel 把「单选还是多选、选了哪些」告诉里面的 QuestionOption

export interface QuestionContextValue {
  multiple: boolean;
  value: string[];
  toggle: (value: string) => void;
  /** 整个面板禁用 */
  disabled: boolean;
  /** 单选的 Tab 停点：选中的那项，没有选中就是第一项能选的；多选不用，各自可 Tab */
  tabStop?: string;
  /** 「其他」告诉面板里面有没有字（面板靠它决定「确认提交」能不能点） */
  reportOther: (id: string, filled: boolean) => void;
  /** 单选时「其他」里打了字：清掉已选的选项（单选的选项和「其他」互斥） */
  clearSelection: () => void;
  /** 「其他」登记自己的清空方法：单选时选了选项，面板用它清掉「其他」里的字 */
  registerOther: (id: string, clear: () => void) => () => void;
}

export const QuestionContext = createContext<QuestionContextValue | null>(null);
