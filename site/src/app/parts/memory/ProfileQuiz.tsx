import { useEffect, useRef, useState } from 'react';
import { Button, EmptyState, Icon, Kimo, QuestionOption, QuestionPanel } from '@kivi';
import { PROFILE_GROUP_LABELS, type MemoryProfile, type ProfileQuestion } from '../../data/memory';
import type { MemoryStage } from './useMemoryManager';
import { EMPTY_ANSWER, PROFILE_TEXT_MAX_CHARS, answerValues, buildProfileFromAnswers, formatProfileValues, isProfileEmpty, validateProfileValues, type ProfileAnswer, type ProfileAnswers } from './utils';
import { toast } from '@kivi';

/** 欢迎页里：欢迎语 → 淡出 → 第一组的标题停一会儿 → 进答题 */
type IntroPhase = 'welcome' | 'leaving' | 'lead';

const FADE_MS = 150;
/** 标题停留：淡入 200ms + 展示 800ms */
const LEAD_MS = 1000;
/** 摘要至少展示这么久，接口太快时不一闪而过 */
const BUILD_HOLD_MS = 1600;
/** 完成页停留后回到列表 */
const COMPLETE_HOLD_MS = 3000;

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface ProfileQuizProps {
  stage: MemoryStage;
  questions: ProfileQuestion[];
  onStageChange: (stage: MemoryStage) => void;
  /** 提交基础信息，失败 reject → 进「保存失败」 */
  onSubmit: (profile: MemoryProfile) => Promise<void>;
  /** 问卷结束（完成或全部跳过） */
  onDone: () => void;
}

/** 问卷：欢迎 → 答题（分页按分组算）→ 生成中（答案摘要）→ 完成。形象用 Kimo */
export function ProfileQuiz({ stage, questions, onStageChange, onSubmit, onDone }: ProfileQuizProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ProfileAnswers>({});
  const [phase, setPhase] = useState<IntroPhase>('welcome');
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const alive = useRef(true);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const wait = (ms: number) => new Promise<void>((resolve) => later(resolve, ms));

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const total = questions.length;
  const question = questions[index];
  const answer: ProfileAnswer = (question && answers[question.key]) || EMPTY_ANSWER;
  // 分页按分组算：组内第几题 / 这一组共几题，换组从 1 重新数
  const groupQuestions = question ? questions.filter((q) => q.group === question.group) : [];
  const groupPos = question ? groupQuestions.indexOf(question) + 1 : 0;
  const groupLabel = question ? PROFILE_GROUP_LABELS[question.group] : PROFILE_GROUP_LABELS[0];

  const startEntry = () => {
    if (busy.current) return;
    if (reducedMotion()) {
      onStageChange('quiz');
      return;
    }
    busy.current = true;
    setPhase('leaving');
    later(() => setPhase('lead'), FADE_MS);
    later(() => {
      onStageChange('quiz');
      busy.current = false;
    }, FADE_MS + LEAD_MS);
  };

  const finish = async (committed: ProfileAnswers) => {
    // 提交中不重复提交
    if (busy.current) return;
    const profile = buildProfileFromAnswers(questions, committed);
    // 全部跳过：不保存空值，直接结束
    if (isProfileEmpty(profile)) {
      onDone();
      return;
    }
    busy.current = true;
    onStageChange('building');
    try {
      await Promise.all([onSubmit(profile), wait(BUILD_HOLD_MS)]);
    } catch {
      if (!alive.current) return;
      busy.current = false;
      onStageChange('saveFailed');
      return;
    }
    if (!alive.current) return;
    onStageChange('complete');
    busy.current = false;
    later(onDone, COMPLETE_HOLD_MS);
  };

  const updateAnswer = (patch: Partial<ProfileAnswer>) => {
    if (!question) return;
    setAnswers((cur) => ({ ...cur, [question.key]: { ...(cur[question.key] ?? EMPTY_ANSWER), ...patch } }));
  };

  const goNext = (skip = false) => {
    if (!question || busy.current) return;
    let committed = answers;
    if (skip) {
      // 跳过的题不留任何答案
      committed = { ...answers, [question.key]: EMPTY_ANSWER };
      setAnswers(committed);
    } else {
      const error = validateProfileValues(answerValues(answer));
      if (error) {
        toast.warning(error);
        return;
      }
    }
    if (index === total - 1) void finish(committed);
    else setIndex(index + 1);
  };

  if (stage === 'saveFailed') {
    return (
      <div className="app-memory__scene">
        <EmptyState
          title="保存失败"
          action={
            <Button size={32} variant="secondary-muted" onClick={() => void finish(answers)}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  const hero = (label: React.ReactNode, key?: string) => (
    <div className="app-memory__hero">
      <Kimo size={128} />
      <div key={key} className="app-memory__hero-label app-memory__fade">
        {label}
      </div>
    </div>
  );

  if (stage === 'intro') {
    return (
      <div className="app-memory__scene app-memory__scene--center">
        {phase === 'lead' ? (
          hero(PROFILE_GROUP_LABELS[0])
        ) : (
          <div className="app-memory__hero" data-leaving={phase === 'leaving' ? '' : undefined}>
            <Kimo size={128} />
            <div className="app-memory__intro">
              <p>Hi，终于等到你：）</p>
              <p>接下来我会问你一些问题，让我们以后的设计协作更加完美，你准备好了吗？</p>
            </div>
          </div>
        )}
        {phase !== 'lead' && (
          <Button size={36} variant="primary" onClick={startEntry} disabled={phase === 'leaving'}>
            下一步
          </Button>
        )}
      </div>
    );
  }

  if (stage === 'building') {
    return (
      <div className="app-memory__scene app-memory__scene--center">
        <div className="app-memory__hero">
          <Kimo size={128} />
          <div className="app-memory__hero-label app-memory__status" role="status">
            <Icon name="Loading" size={16} spin />
            <span>记忆搭建中，即将整理完成</span>
          </div>
        </div>
        <div className="app-memory__summary app-memory__fade">
          {questions.map((q) => {
            const text = formatProfileValues(q, answerValues(answers[q.key]));
            return text ? (
              <div key={q.key} className="app-memory__summary-row">
                <div className="app-memory__summary-label">{q.title}</div>
                <div className="app-memory__summary-value">{text}</div>
              </div>
            ) : null;
          })}
        </div>
      </div>
    );
  }

  if (stage === 'complete') {
    return (
      <div className="app-memory__scene app-memory__scene--center">
        {hero('关于你的记忆已经整理好了')}
      </div>
    );
  }

  // 答题
  if (!question) return null;
  const pager = `${groupPos}/${groupQuestions.length}`;
  return (
    <div className="app-memory__scene">
      {hero(groupLabel, `group-${question.group}`)}
      <div className="app-memory__step">
        {question.type === 'text' ? (
          <QuestionPanel
            fill
            type="text"
            title={question.title}
            pager={pager}
            onPrev={() => setIndex(index - 1)}
            onNext={() => setIndex(index + 1)}
            prevDisabled={index === 0}
            nextDisabled={index === total - 1}
            text={answer.custom}
            onTextChange={(custom) => updateAnswer({ custom })}
            maxLength={PROFILE_TEXT_MAX_CHARS}
            placeholder="比如：KIVI 主站、画布"
            skipText="跳过"
            onSkip={() => goNext(true)}
            submitText="确认"
            onSubmit={() => goNext()}
          />
        ) : (
          <QuestionPanel
            fill
            title={`${question.title}（多选）`}
            pager={pager}
            onPrev={() => setIndex(index - 1)}
            onNext={() => setIndex(index + 1)}
            prevDisabled={index === 0}
            nextDisabled={index === total - 1}
            multiple
            value={answer.selected}
            onChange={(selected) => updateAnswer({ selected })}
            skipText="跳过"
            onSkip={() => goNext(true)}
            submitText="确认"
            onSubmit={() => goNext()}
          >
            {question.options.map((o) => (
              <QuestionOption key={o.value} value={o.value}>
                {o.label}
              </QuestionOption>
            ))}
            {question.allowCustom && <QuestionOption type="other" inputProps={{ value: answer.custom, maxLength: PROFILE_TEXT_MAX_CHARS, onChange: (e) => updateAnswer({ custom: e.target.value }) }} />}
          </QuestionPanel>
        )}
      </div>
    </div>
  );
}
