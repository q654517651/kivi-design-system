import { useSyncExternalStore } from 'react';
import { previewKey } from '../preview';

/*
  极简 store：一份状态 + 订阅，不引状态库。全站的假后端数据（db）、演示开关（demo）都是它。
  - 页面用 useStore(store, selector) 读；selector 必须返回状态里已有的引用或基本类型，
    不要在 selector 里 filter / map 出新数组（每次都是新引用会死循环），派生数据在组件里 useMemo。
  - 只有 data/ 里的动作函数能调 set，页面不直接改。
  - 传了 key 就存进本机（localStorage），刷新后还在；读写失败（隐私模式、被禁）就当没存，照常用。
*/

export interface Store<T> {
  get(): T;
  set(next: T | ((state: T) => T)): void;
  subscribe(listener: () => void): () => void;
  /** 回到初始数据（演示开关里的「重置演示数据」） */
  reset(): void;
}

export interface StoreOptions<T> {
  /** 存进本机用的键，不传就不存 */
  key?: string;
  /** 数据结构改了就加 1，本机存的旧数据作废、回到初始数据 */
  version?: number;
  init: () => T;
  /** 存哪些：比如去掉本次上传的本地文件（blob 地址刷新后就失效了） */
  save?: (state: T) => unknown;
}

const SAVE_DELAY = 300;

export function createStore<T>({ key: rawKey, version = 1, init, save }: StoreOptions<T>): Store<T> {
  // 功能分支按分支分开存（见 app/preview.ts，正式版不变）
  const key = rawKey && previewKey(rawKey);
  const listeners = new Set<() => void>();
  let state = load() ?? init();
  let timer: ReturnType<typeof setTimeout> | undefined;

  function load(): T | undefined {
    if (!key) return undefined;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return undefined;
      const saved = JSON.parse(raw) as { v: number; s: T };
      return saved.v === version ? saved.s : undefined;
    } catch {
      return undefined;
    }
  }
  function persist() {
    if (!key) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ v: version, s: save ? save(state) : state }));
      } catch {
        /* 存不了就算了 */
      }
    }, SAVE_DELAY);
  }
  function emit() {
    listeners.forEach((l) => l());
  }

  return {
    get: () => state,
    set(next) {
      const value = typeof next === 'function' ? (next as (s: T) => T)(state) : next;
      if (value === state) return;
      state = value;
      persist();
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      state = init();
      try {
        if (key) localStorage.removeItem(key);
      } catch {
        /* 同上 */
      }
      emit();
    },
  };
}

/** 读 store 的一部分，变了才重渲染 */
export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}

let seq = 0;
/** 新 id：前缀 + 时间 + 序号，同一毫秒里也不重 */
export const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;
