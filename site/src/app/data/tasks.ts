import { useEffect, useState } from 'react';
import { GENERATION_FAILED_TITLE } from '@kivi';
import { ApiError, request } from './api';
import { db } from './db';
import { demo, setDemo } from './demo';
import { mockOutput, mockText } from './mock';
import { uid } from './store';
import type { Asset, Task, TaskMedia } from './types';

/*
  假任务：全站所有生成（主站、工具页、画布）都走这里。
  提交 → 扣猕猴桃 → 生成中（按估时倒计时）→ 到点出结果，结果自动进素材（资产页、画布历史都能看到）。
  失败退回猕猴桃。页面里不许再写 setTimeout 假生成。
*/

/** 提交时要给的：任务里除了系统填的字段 */
export type TaskInput = Omit<Task, 'id' | 'outputs' | 'status' | 'createdAt' | 'dueAt' | 'willFail' | 'error'> & {
  /** 几格结果，默认 1 */
  count?: number;
  /** 估时（秒），不传按类型 */
  seconds?: number;
};

/** 平时的估时（秒）；演示开关「快速出结果」打开时一律 3 秒 */
const ESTIMATE: Record<Task['kind'], Record<TaskMedia, number>> = {
  gen: { image: 20, video: 60, audio: 15, text: 8 },
  tool: { image: 8, video: 30, audio: 10, text: 8 },
};
const FAST = 3;

const estimate = (kind: Task['kind'], media: TaskMedia, seconds?: number) => (demo.get().fast ? FAST : seconds ?? ESTIMATE[kind][media]);

const patchTask = (id: string, fn: (t: Task) => Task) => db.set((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? fn(t) : t)) }));

function charge(cost: number) {
  const { balance } = db.get();
  if (demo.get().lowBalance || balance < cost) throw new ApiError('balance', '余额不足', { need: cost, balance });
  db.set((s) => ({ ...s, balance: s.balance - cost }));
}

/** 提交一个生成任务。余额不够、断网会抛 ApiError，交给 handleError */
export function submitTask({ count = 1, seconds, ...input }: TaskInput): Promise<Task> {
  return request(() => {
    charge(input.cost);
    const now = Date.now();
    const willFail = demo.get().failNext || undefined;
    if (willFail) setDemo({ failNext: false });
    const task: Task = {
      ...input,
      id: uid('t'),
      outputs: Array.from({ length: count }, () => ({ status: 'running' as const })),
      status: 'running',
      createdAt: now,
      dueAt: now + estimate(input.kind, input.media, seconds) * 1000,
      willFail,
    };
    db.set((s) => ({ ...s, tasks: [...s.tasks, task] }));
    tick();
    return task;
  });
}

/** 失败了重试：重新扣费，回到生成中 */
export function retryTask(id: string): Promise<void> {
  return request(() => {
    const t = db.get().tasks.find((x) => x.id === id);
    if (!t) return;
    charge(t.cost);
    const willFail = demo.get().failNext || undefined;
    if (willFail) setDemo({ failNext: false });
    patchTask(id, (x) => ({
      ...x,
      status: 'running',
      error: undefined,
      willFail,
      outputs: x.outputs.map(() => ({ status: 'running' as const })),
      dueAt: Date.now() + estimate(x.kind, x.media) * 1000,
    }));
    tick();
  });
}

/** 取消生成中的任务，退回猕猴桃 */
export function cancelTask(id: string): Promise<void> {
  return request(() => {
    const t = db.get().tasks.find((x) => x.id === id);
    if (!t || t.status !== 'running') return;
    patchTask(id, (x) => ({ ...x, status: 'cancelled', outputs: [] }));
    db.set((s) => ({ ...s, balance: s.balance + t.cost }));
  });
}

/** 删除整个任务和它出的素材 */
export function removeTask(id: string): Promise<void> {
  return request(() => {
    db.set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id), assets: s.assets.filter((a) => a.taskId !== id) }));
  });
}

/** 再次生成：用这条任务原来的参数直接再提交一次（扣费、排到最后），生成和工具任务都一样 */
export function rerunTask(t: Task): Promise<Task> {
  const { id: _id, outputs, status: _status, createdAt: _c, dueAt: _d, willFail: _w, error: _e, hold: _h, holdLeft: _l, ...input } = t;
  return submitTask({ ...input, count: outputs.length });
}

/** 到点的任务出结果 */
function settle(t: Task): { task: Task; assets: Asset[]; refund: number } {
  if (t.willFail) {
    return { task: { ...t, status: 'failed', error: GENERATION_FAILED_TITLE, outputs: t.outputs.map(() => ({ status: 'failed' as const })) }, assets: [], refund: t.cost };
  }
  // 文字（画布文字节点）：结果是一段字，不进素材
  if (t.media === 'text') {
    return { task: { ...t, status: 'done', outputs: t.outputs.map(() => ({ status: 'done' as const, text: mockText(t.prompt) })) }, assets: [], refund: 0 };
  }
  const media = t.media;
  const now = Date.now();
  const assets: Asset[] = t.outputs.map((_, i) => ({
    id: uid('a'),
    media,
    ratio: t.ratio,
    ...(t.echo && t.refs[0] ? { src: t.refs[0].src, poster: media === 'video' ? mockOutput('video', t.ratio).poster : undefined } : mockOutput(media, t.ratio)),
    name: `${t.label ?? (media === 'video' ? '视频生成' : media === 'audio' ? '音频生成' : '图片生成')} ${i + 1}`,
    createdAt: now,
    source: t.where.page,
    taskId: t.id,
    collected: false,
    folderIds: [],
  }));
  return { task: { ...t, status: 'done', outputs: assets.map((a) => ({ status: 'done' as const, assetId: a.id })) }, assets, refund: 0 };
}

// ---------- 计时：有生成中的任务才转 ----------

const TICK_MS = 500;
let timer: ReturnType<typeof setInterval> | undefined;
type SettledListener = (task: Task) => void;
const settledListeners = new Set<SettledListener>();

function tick() {
  const now = Date.now();
  const due = db.get().tasks.filter((t) => t.status === 'running' && !t.hold && t.dueAt <= now);
  if (due.length) {
    const results = due.map(settle);
    db.set((s) => {
      const map = new Map(results.map((r) => [r.task.id, r.task]));
      return {
        ...s,
        balance: s.balance + results.reduce((n, r) => n + r.refund, 0),
        tasks: s.tasks.map((t) => map.get(t.id) ?? t),
        assets: [...s.assets, ...results.flatMap((r) => r.assets)],
      };
    });
    results.forEach((r) => settledListeners.forEach((l) => l(r.task)));
  }
  const running = db.get().tasks.some((t) => t.status === 'running' && !t.hold);
  if (running && !timer) timer = setInterval(tick, TICK_MS);
  if (!running && timer) {
    clearInterval(timer);
    timer = undefined;
  }
}
// 刷新页面时还有生成中的，接着计时（到点的立刻出结果）
if (typeof window !== 'undefined') tick();
db.subscribe(() => {
  if (!timer && db.get().tasks.some((t) => t.status === 'running' && !t.hold)) tick();
});

/** 任务出结果（成功或失败）时通知，比如弹「生成完成」 */
export function onTaskSettled(listener: SettledListener) {
  settledListeners.add(listener);
  return () => settledListeners.delete(listener);
}

/** 生成中还剩几秒；hold 或已经到点返回 undefined（只显示「生成中」） */
export function secondsLeft(t: Task, now = Date.now()) {
  if (t.status !== 'running' || t.hold) return undefined;
  const s = Math.ceil((t.dueAt - now) / 1000);
  return s > 0 ? s : undefined;
}

/** 生成中格子右上角的字：「59s 生成中」，算不出时「生成中」 */
export function countdownLabel(t: Task, now = Date.now()) {
  const s = t.hold ? t.holdLeft : secondsLeft(t, now);
  return s ? `${s}s 生成中` : '生成中';
}

/** 每秒刷新一次的当前时间：倒计时用 */
export function useNow(active = true, interval = 1000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [active, interval]);
  return now;
}
