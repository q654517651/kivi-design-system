import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@kivi';
import { getMemory, getProfileQuestions, saveMemoryContent, saveMemoryProfile, type MemoryData, type MemoryProfile, type ProfileQuestion } from '../../data/memory';
import { confirmDelete } from '../../flows/delete';
import {
  NEW_MEMORY_DRAFT_KEY,
  hasDirtyDraft,
  isProfileDraftKey,
  isProfileEmpty,
  memoryDraftKey,
  parseProfileText,
  profileQuestionKey,
  validateProfileValues,
  type Drafts,
} from './utils';

/** 阶段（照线上 EMemoryStage） */
export type MemoryStage = 'loading' | 'failed' | 'empty' | 'list' | 'intro' | 'quiz' | 'building' | 'complete' | 'saveFailed';

/** 二次确认（照线上 EMemoryConfirmType） */
export interface MemoryConfirmation {
  type: 'discard' | 'exit';
  run: () => void;
}

const omit = (drafts: Drafts, key: string) => Object.fromEntries(Object.entries(drafts).filter(([k]) => k !== key));

/** 基础信息和用户记忆都空（且有问卷）时是空态，否则是列表 */
const homeStage = (memory: MemoryData | undefined, questions: ProfileQuestion[]): MemoryStage =>
  questions.length && isProfileEmpty(memory?.profile) && !memory?.content.length ? 'empty' : 'list';

/** 记忆管理的状态和动作（照线上 useMemoryManager，没有版本冲突那一支） */
export function useMemoryManager(onClose: () => void) {
  const [stage, setStage] = useState<MemoryStage>('loading');
  const [memory, setMemory] = useState<MemoryData>();
  const [questions, setQuestions] = useState<ProfileQuestion[]>([]);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [savingKey, setSavingKey] = useState<string>();
  const [confirmation, setConfirmation] = useState<MemoryConfirmation>();
  /** 新增成功后加 1，列表据此滚到新条目 */
  const [locateSignal, setLocateSignal] = useState(0);
  const alive = useRef(true);
  const memoryRef = useRef(memory);
  const questionsRef = useRef(questions);
  memoryRef.current = memory;
  questionsRef.current = questions;

  const apply = useCallback((next: MemoryData, settledKey?: string) => {
    memoryRef.current = next;
    setMemory(next);
    if (settledKey) setDrafts((d) => omit(d, settledKey));
  }, []);

  const load = useCallback(async () => {
    setStage('loading');
    try {
      const [m, q] = await Promise.all([getMemory(), getProfileQuestions()]);
      if (!alive.current) return;
      questionsRef.current = q;
      setQuestions(q);
      apply(m);
      // 基础信息为空时强制进入问卷
      setStage(q.length && isProfileEmpty(m.profile) ? 'intro' : 'list');
    } catch {
      if (alive.current) setStage('failed');
    }
  }, [apply]);

  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  const save = useCallback(
    async (draftKey: string, request: () => Promise<MemoryData>) => {
      setSavingKey(draftKey);
      try {
        const next = await request();
        if (alive.current) apply(next, draftKey);
        return true;
      } catch {
        toast.error('保存失败，请稍后重试');
        return false;
      } finally {
        if (alive.current) setSavingKey(undefined);
      }
    },
    [apply],
  );

  const startEdit = useCallback((key: string, value: string) => {
    setDrafts((d) => (d[key] ? d : { ...d, [key]: { value, original: value } }));
  }, []);
  const changeDraft = useCallback((key: string, value: string) => {
    setDrafts((d) => (d[key] ? { ...d, [key]: { ...d[key], value } } : d));
  }, []);
  const cancelDraft = useCallback((key: string) => setDrafts((d) => omit(d, key)), []);
  const addMemory = useCallback(() => startEdit(NEW_MEMORY_DRAFT_KEY, ''), [startEdit]);

  const saveDraft = async (key: string) => {
    const draft = drafts[key];
    const current = memoryRef.current;
    if (!draft || !current || savingKey !== undefined) return;
    // 内容没改就直接收起，不发请求
    if (key !== NEW_MEMORY_DRAFT_KEY && draft.value.trim() === draft.original) {
      cancelDraft(key);
      return;
    }

    if (isProfileDraftKey(key)) {
      const question = questions.find((q) => q.key === profileQuestionKey(key));
      if (!question) return;
      const values = parseProfileText(question, draft.value);
      const error = validateProfileValues(values);
      if (error) {
        toast.warning(error);
        return;
      }
      // 整体覆盖：只提交问卷里有的字段，清空的字段不带 key
      const profile = questions.reduce<MemoryProfile>((r, q) => {
        const v = q.key === question.key ? values : current.profile[q.key];
        if (v?.length) r[q.key] = v;
        return r;
      }, {});
      await save(key, () => saveMemoryProfile(profile));
      return;
    }

    const text = draft.value.trim();
    if (!text) return;
    const isNew = key === NEW_MEMORY_DRAFT_KEY;
    const content = isNew ? [text, ...current.content] : current.content.map((c) => (c === draft.original ? text : c));
    const ok = await save(key, () => saveMemoryContent(content));
    if (ok && isNew && alive.current) {
      toast.success('记忆已新增');
      setLocateSignal((n) => n + 1);
    }
  };

  const removeMemory = (text: string) => {
    void confirmDelete(
      async () => {
        const current = memoryRef.current;
        if (!current) return;
        const next = await saveMemoryContent(current.content.filter((c) => c !== text));
        if (alive.current) apply(next, memoryDraftKey(text));
      },
      { description: '删除后，KIVI 将不会记住这个信息。' },
    );
  };

  /** 问卷提交：整体覆盖基础信息，失败抛出，由问卷进「保存失败」 */
  const submitProfile = useCallback(
    async (profile: MemoryProfile) => {
      const next = await saveMemoryProfile(profile);
      if (alive.current) apply(next);
    },
    [apply],
  );

  const startQuiz = useCallback(() => setStage('intro'), []);
  const finishQuiz = useCallback(() => setStage(homeStage(memoryRef.current, questionsRef.current)), []);
  const closeConfirmation = useCallback(() => setConfirmation(undefined), []);

  const requestClose = () => {
    if (stage === 'quiz') {
      setConfirmation({ type: 'exit', run: onClose });
      return;
    }
    if (hasDirtyDraft(drafts)) {
      setConfirmation({ type: 'discard', run: onClose });
      return;
    }
    onClose();
  };

  return {
    stage,
    setStage,
    memory,
    questions,
    drafts,
    savingKey,
    confirmation,
    locateSignal,
    load,
    startEdit,
    changeDraft,
    cancelDraft,
    saveDraft,
    addMemory,
    removeMemory,
    submitProfile,
    startQuiz,
    finishQuiz,
    closeConfirmation,
    requestClose,
  };
}

export type MemoryManagerController = ReturnType<typeof useMemoryManager>;
