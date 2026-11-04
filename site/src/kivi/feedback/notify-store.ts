import type { ReactNode } from 'react';
import type { NotificationType } from './Notification';

/*
  通知的调用方式：一个全局的 notify，不用 Provider，在哪里都能调（组件里、请求回调里都行）。
  页面根上放一个 <Notifier />（Notifier.tsx），notify.show() 的内容就显示在它里面。

    const id = notify.show({ type: 'error', title: '生成失败', description: '网络中断，请检查网络后重试' });
    notify.hide(id);                        // 关掉这一条
    notify.clear();                         // 全关
    notify.error('生成失败', { description: '…' });   // 常用的几种有简写

  和 toast 不同：条数不限，新的放最上面；不自己消失，除非传 duration。
*/

export interface NotifyOptions {
  /** 类型。不传就没有前面的图标 */
  type?: NotificationType;
  /** 标题 */
  title: ReactNode;
  /** 说明 */
  description?: ReactNode;
  /** 停留多久（毫秒），默认 0 = 不自己消失。鼠标停在通知上时暂停计时 */
  duration?: number;
}

export interface NotifyItem {
  id: number;
  type?: NotificationType;
  title: ReactNode;
  description?: ReactNode;
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

// 最新的在最前面
let items: NotifyItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** 给 Notifier 订阅用 */
export function subscribeNotify(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 给 Notifier 读当前所有通知 */
export function getNotifications() {
  return items;
}

/** 弹出一条，返回它的 id。新的放最上面 */
function show(options: NotifyOptions): number {
  const id = ++seq;
  items = [{ id, type: options.type, title: options.title, description: options.description, duration: options.duration ?? 0, leaving: false }, ...items];
  emit();
  return id;
}

/** 关掉一条：淡出 150ms，后面的补上来，再拿掉 */
function hide(id: number) {
  const target = items.find((i) => i.id === id);
  if (!target || target.leaving) return;
  items = items.map((i) => (i.id === id ? { ...i, leaving: true } : i));
  emit();
  window.setTimeout(() => {
    items = items.filter((i) => i.id !== id);
    emit();
  }, cssMs('--motion-duration-150', 150));
}

/** 全关 */
function clear() {
  items.forEach((i) => hide(i.id));
}

type Rest = Omit<NotifyOptions, 'type' | 'title'>;

export const notify = {
  show,
  hide,
  clear,
  /** 简写：信息 */
  info: (title: ReactNode, options?: Rest) => show({ ...options, type: 'info', title }),
  /** 简写：成功 */
  success: (title: ReactNode, options?: Rest) => show({ ...options, type: 'success', title }),
  /** 简写：警告 */
  warning: (title: ReactNode, options?: Rest) => show({ ...options, type: 'warning', title }),
  /** 简写：错误 */
  error: (title: ReactNode, options?: Rest) => show({ ...options, type: 'error', title }),
};
