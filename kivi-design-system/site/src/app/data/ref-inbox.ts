import { useEffect, useRef } from 'react';
import { referenceName, type ReferenceStackItem } from '@kivi';
import { uid } from './store';

/*
  别处「添加到参考图」（探索页作品右键，11-20 用户定做成真的）：先放进这里排着，
  创作页的输入框（首页或对话页，哪个先挂上哪个收）一挂上就把它们加进参考区。只在这次打开有效，不存本机。
*/

export interface PendingReference {
  type: 'image' | 'video';
  /** 图片地址；视频放封面（参考区缩略图用封面） */
  src: string;
}

let queue: PendingReference[] = [];
const listeners = new Set<() => void>();

export function sendToReference(item: PendingReference) {
  queue = [...queue, item];
  listeners.forEach((l) => l());
}

/** 把排着的素材接成参考区的项，名字按已有的往后编号 */
export function appendReferences(list: ReferenceStackItem[], items: PendingReference[]): ReferenceStackItem[] {
  return items.reduce<ReferenceStackItem[]>(
    (acc, r) => [...acc, { id: uid('c'), type: r.type, name: referenceName(acc, r.type), src: r.src, duration: r.type === 'video' ? '5s' : undefined }],
    list,
  );
}

/** 输入框挂上时收走排着的素材，之后再来的也收 */
export function useReferenceInbox(take: (items: PendingReference[]) => void) {
  const fn = useRef(take);
  fn.current = take;
  useEffect(() => {
    const drain = () => {
      if (!queue.length) return;
      const items = queue;
      queue = [];
      fn.current(items);
    };
    drain();
    listeners.add(drain);
    return () => {
      listeners.delete(drain);
    };
  }, []);
}
