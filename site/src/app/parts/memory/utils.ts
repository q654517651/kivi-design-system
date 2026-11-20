import type { MemoryProfile, ProfileQuestion } from '../../data/memory';

/*
  记忆管理的纯函数（照线上 MemoryManager/utils.ts）：草稿 key、基础信息的拆分和格式化、问卷答案转基础信息。
*/

/** 新增用户记忆的草稿 key */
export const NEW_MEMORY_DRAFT_KEY = 'new';
const PROFILE_PREFIX = 'profile:';
const MEMORY_PREFIX = 'memory:';

/** 基础信息限制：每字段最多 10 项、每项最多 300 字 */
export const PROFILE_FIELD_MAX_ITEMS = 10;
export const PROFILE_ITEM_MAX_CHARS = 300;
export const PROFILE_TEXT_MAX_CHARS = PROFILE_ITEM_MAX_CHARS;

const ITEM_SEPARATOR = /[、，,；;\n]+/;

export interface ProfileAnswer {
  selected: string[];
  /** 自定义文本（文本题就是全部内容） */
  custom: string;
}
export type ProfileAnswers = Record<string, ProfileAnswer>;
export const EMPTY_ANSWER: ProfileAnswer = { selected: [], custom: '' };

/** 行内编辑草稿：original 用来判断有没有未保存的改动 */
export interface Draft {
  value: string;
  original: string;
}
export type Drafts = Record<string, Draft>;

export const profileDraftKey = (questionKey: string) => `${PROFILE_PREFIX}${questionKey}`;
export const memoryDraftKey = (text: string) => `${MEMORY_PREFIX}${text}`;
export const isProfileDraftKey = (key: string) => key.startsWith(PROFILE_PREFIX);
export const profileQuestionKey = (draftKey: string) => draftKey.slice(PROFILE_PREFIX.length);

export const countChars = (text: string) => Array.from(text).length;

export const isProfileEmpty = (profile?: MemoryProfile) => !Object.values(profile ?? {}).some((v) => v?.length);

/** 「中东、东南亚」拆成多项，去空、去重 */
export const splitProfileText = (text: string) => [...new Set(text.split(ITEM_SEPARATOR).map((s) => s.trim()).filter(Boolean))];

/** 展示基础信息：预设 value 换成文案，自定义值原样 */
export const formatProfileValues = (question: ProfileQuestion, values: string[] = []) =>
  values.map((v) => question.options.find((o) => o.value === v)?.label ?? v).join('、');

/** 基础信息为空时的占位 */
export const profilePlaceholder = (question: ProfileQuestion) => `添加${question.label}`;

/** 编辑后的文本转回存储值 */
export const parseProfileText = (question: ProfileQuestion, text: string) => [
  ...new Set(splitProfileText(text).map((item) => question.options.find((o) => o.label === item || o.value === item)?.value ?? item)),
];

export const answerValues = (answer: ProfileAnswer = EMPTY_ANSWER) => [...new Set([...answer.selected, ...splitProfileText(answer.custom)])];

/** 问卷答案转基础信息，没填、跳过的题不出现 */
export const buildProfileFromAnswers = (questions: ProfileQuestion[], answers: ProfileAnswers) =>
  questions.reduce<MemoryProfile>((profile, q) => {
    const values = answerValues(answers[q.key]);
    if (values.length) profile[q.key] = values;
    return profile;
  }, {});

/** 校验一个字段的项数和单项长度，返回能直接展示的错误文案 */
export const validateProfileValues = (values: string[]) => {
  if (values.length > PROFILE_FIELD_MAX_ITEMS) return `最多填写 ${PROFILE_FIELD_MAX_ITEMS} 项`;
  if (values.some((v) => countChars(v) > PROFILE_ITEM_MAX_CHARS)) return `每项最多 ${PROFILE_ITEM_MAX_CHARS} 个字，多项请用顿号分隔`;
  return undefined;
};

export const hasDirtyDraft = (drafts: Drafts) => Object.values(drafts).some((d) => d.value !== d.original);
