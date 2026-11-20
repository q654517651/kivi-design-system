import { request } from './api';
import { createStore, useStore } from './store';

/*
  Agent 记忆管理的假后端（照线上 memory-service：getAgentMemory / getAgentProfileQuestions / saveAgentMemoryContent / saveAgentMemoryProfile）。
  单独一个 store，存本机（刷新还在）；所有读写都走 request()，演示开关的断网会让它们失败，用来看加载失败、保存失败。
  问卷题目线上由后端下发，这里写死一份示例。
*/

/** 基础信息：key 是问卷题的 key，预设选项存 value，自定义值存原文 */
export type MemoryProfile = Record<string, string[]>;

export interface MemoryData {
  profile: MemoryProfile;
  /** 用户记忆，一个元素一条 */
  content: string[];
}

export interface ProfileOption {
  value: string;
  label: string;
}

export interface ProfileQuestion {
  key: string;
  /** 基础信息列表里这一行的小标题 */
  label: string;
  /** 答题时的题目 */
  title: string;
  /** 问卷分组：分页按组算，组的标题写在形象下面 */
  group: number;
  type: 'multi' | 'text';
  options: ProfileOption[];
  /** 多选题最后一项是「其他，请直接输入」 */
  allowCustom: boolean;
}

/** 问卷每组形象下面那句话 */
export const PROFILE_GROUP_LABELS = ['我想先了解你是谁？', '你的工作内容？'];

const opts = (...labels: string[]): ProfileOption[] => labels.map((l) => ({ value: l, label: l }));

export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  { key: 'role', label: '身份', title: '你的身份是？', group: 0, type: 'multi', options: opts('设计师', '产品经理', '运营', '研发', '市场'), allowCustom: true },
  { key: 'region', label: '负责区域', title: '你负责哪些区域？', group: 0, type: 'multi', options: opts('中国大陆', '东南亚', '中东', '欧美', '日韩'), allowCustom: true },
  { key: 'products', label: '产品、项目', title: '你负责哪些产品、项目？', group: 1, type: 'text', options: [], allowCustom: false },
  { key: 'deliverables', label: '物料', title: '你常做哪些物料？', group: 1, type: 'multi', options: opts('海报', 'Banner', '详情页', '短视频', '社媒图'), allowCustom: true },
  { key: 'languages', label: '常用语言', title: '你的常用语言是？', group: 1, type: 'multi', options: opts('中文', '英语', '阿拉伯语', '印尼语', '泰语'), allowCustom: true },
];

/** 用户记忆单条字数上限（线上由后端给，item_max_chars） */
export const MEMORY_ITEM_MAX_CHARS = 200;

const SEED: MemoryData = {
  profile: { role: ['设计师'], region: ['东南亚', '中东'], products: ['KIVI 主站、画布'], deliverables: ['海报', 'Banner'], languages: ['中文', '英语'] },
  content: ['喜欢干净、留白多的版面，主色用品牌绿，少用渐变', '出图默认 16:9，社媒图用 3:4', '提示词用中文，模型名保持英文'],
};

const store = createStore<MemoryData>({
  key: 'kivi-app-memory',
  version: 1,
  init: () => ({ profile: { ...SEED.profile }, content: [...SEED.content] }),
});

export const useMemory = <S,>(selector: (s: MemoryData) => S) => useStore(store, selector);

/** 取记忆（线上 getAgentMemory） */
export const getMemory = () => request(() => store.get());

/** 取问卷题目（线上 getAgentProfileQuestions） */
export const getProfileQuestions = () => request(() => PROFILE_QUESTIONS);

/** 整份保存用户记忆，成功后返回最新全量 */
export const saveMemoryContent = (content: string[]) =>
  request(() => {
    store.set((s) => ({ ...s, content }));
    return store.get();
  });

/** 整份保存基础信息，成功后返回最新全量 */
export const saveMemoryProfile = (profile: MemoryProfile) =>
  request(() => {
    store.set((s) => ({ ...s, profile }));
    return store.get();
  });

/** 清空记忆（看空态和问卷用，控制台或演示开关里调） */
export const clearMemory = () => store.set({ profile: {}, content: [] });

/** 回到示例记忆 */
export const resetMemory = () => store.reset();
