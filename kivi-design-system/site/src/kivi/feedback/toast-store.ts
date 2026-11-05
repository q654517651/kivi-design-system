import type { ReactNode } from 'react';
import type { ToastType } from './Toast';

/*
  Toast 的调用方式：一个全局的 toast，不用 Provider，在哪里都能调（组件里、请求回调里都行）。
  页面根上放一个 <Toaster />（Toaster.tsx），toast.show() 的内容就显示在它里面。

    const id = toast.show({ type: 'loading', text: '正在上传 3 张图片', action: '取消', onAction: cancel });
    toast.update(id, { type: 'success', text: '上传完成' });   // 换成成功或错误
    toast.hide();                                               // 收起当前这条
    toast.success('已保存到我的作品');                          // 常用的几种有简写

  同一时间只留 1 条：show 一个新的，旧的直接被顶掉。
*/

export interface ToastOptions {
  /** 类型，默认信息 */
  type?: ToastType;
  /** 提示文字 */
  text: ReactNode;
  /** 操作文字，比如「撤销」。点了先调 onAction，再收起这条 */
  action?: ReactNode;
  /** 点操作文字 */
  onAction?: () => void;
  /** 停留多久（毫秒），默认 3000；0 是不自己消失。加载中不管填多少都不自己消失 */
  duration?: number;
}

export interface ToastItem {
  id: number;
  type: ToastType;
  text: ReactNode;
  action?: ReactNode;
  onAction?: () => void;
  duration: number;
  /** 正在播淡出，播完拿掉 */
  leaving: boolean;
}

/** 读 tokens.css 里的时长变量（系统开了「减少动态效果」时是 0） */
function cssMs(name: string, fallback: number): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  if (Number.isNaN(n)) return fallback;
  return v.endsWith('ms') ? n : v.endsWith('s') ? n * 1000 : n;
}

let current: ToastItem | null = null;
let seq = 0;
let hideTimer: number | undefined;
let removeTimer: number | undefined;
// 悬停、聚焦时暂停计时：left 是还剩多久，startedAt 是这一段计时开始的时间
let paused = false;
let left = 0;
let startedAt = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

/** 给 Toaster 订阅用 */
export function subscribeToast(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 给 Toaster 读当前这一条 */
export function getToast() {
  return current;
}

function makeItem(id: number, o: ToastOptions): ToastItem {
  return {
    id,
    type: o.type ?? 'info',
    text: o.text,
    action: o.action,
    onAction: o.onAction,
    duration: o.duration ?? 3000,
    leaving: false,
  };
}

// 这一条要不要自己收起：加载中不收，duration 为 0 不收
function autoHides(item: ToastItem) {
  return item.type !== 'loading' && item.duration > 0;
}

function startTimer(item: ToastItem) {
  startedAt = Date.now();
  hideTimer = window.setTimeout(() => hide(item.id), left);
}

// 到点自己收起；鼠标停在上面时先不走，挪开后接着走剩下的时间
function schedule(item: ToastItem) {
  window.clearTimeout(hideTimer);
  hideTimer = undefined;
  left = item.duration;
  if (autoHides(item) && !paused) startTimer(item);
}

/** 给 Toaster 用：悬停或聚焦在这一条上时暂停计时，离开后接着走剩余时间 */
export function setToastPaused(next: boolean) {
  if (paused === next) return;
  paused = next;
  if (!current || current.leaving || !autoHides(current)) return;
  if (next) {
    if (hideTimer === undefined) return;
    window.clearTimeout(hideTimer);
    hideTimer = undefined;
    left = Math.max(0, left - (Date.now() - startedAt));
  } else if (hideTimer === undefined) {
    startTimer(current);
  }
}

/** 弹出一条，返回它的 id。旧的直接被顶掉，新的从上方移入 */
function show(options: ToastOptions): number {
  window.clearTimeout(removeTimer);
  current = makeItem(++seq, options);
  schedule(current);
  emit();
  return current.id;
}

/**
 * 把这一条换成新的内容，比如加载中做完了换成成功或错误。参数和 show 一样，没写的回到默认
 * （所以「取消」这类操作换成成功时自然就没了）。还是同一个元素，不重播移入的动画。
 * 这一条已经被顶掉或收起了就什么也不做，返回 false。
 */
function update(id: number, options: ToastOptions): boolean {
  if (!current || current.id !== id || current.leaving) return false;
  current = makeItem(id, options);
  schedule(current);
  emit();
  return true;
}

/** 收起：淡出 150ms 后拿掉。不传 id 就收当前这条；传了 id 但这条已经不是它了就不动 */
function hide(id?: number) {
  if (!current || current.leaving || (id !== undefined && current.id !== id)) return;
  window.clearTimeout(hideTimer);
  hideTimer = undefined;
  current = { ...current, leaving: true };
  emit();
  removeTimer = window.setTimeout(() => {
    current = null;
    emit();
  }, cssMs('--motion-duration-150', 150));
}

type Rest = Omit<ToastOptions, 'type' | 'text'>;

export const toast = {
  show,
  update,
  hide,
  /** 简写：信息 */
  info: (text: ReactNode, options?: Rest) => show({ ...options, type: 'info', text }),
  /** 简写：成功 */
  success: (text: ReactNode, options?: Rest) => show({ ...options, type: 'success', text }),
  /** 简写：警告 */
  warning: (text: ReactNode, options?: Rest) => show({ ...options, type: 'warning', text }),
  /** 简写：错误 */
  error: (text: ReactNode, options?: Rest) => show({ ...options, type: 'error', text }),
  /** 简写：加载中，不自己消失，做完用 update 换成成功或错误 */
  loading: (text: ReactNode, options?: Rest) => show({ ...options, type: 'loading', text }),
};
