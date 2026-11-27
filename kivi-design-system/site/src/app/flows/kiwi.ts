import { createStore, useStore } from '../data/store';

/*
  猕猴桃管理（11-27 原型）的入口：账号菜单里点「我的用量」「用量管理」，一句话调用。
  - openMyUsage()：打开「我的用量」弹窗（KiviApp 里挂着 MyUsageDialog）
  - openUsageAdmin()：去「用量管理」页（KiviApp 听到了就切页）
*/

const nav = createStore<{ myUsage: boolean; admin: number }>({ init: () => ({ myUsage: false, admin: 0 }) });

export const openMyUsage = () => nav.set((s) => ({ ...s, myUsage: true }));
export const closeMyUsage = () => nav.set((s) => ({ ...s, myUsage: false }));
export const openUsageAdmin = () => nav.set((s) => ({ ...s, admin: s.admin + 1 }));

export const useMyUsageOpen = () => useStore(nav, (s) => s.myUsage);
/** 每点一次「用量管理」加 1 */
export const useUsageAdminRequest = () => useStore(nav, (s) => s.admin);
