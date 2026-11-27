import { createStore, useStore } from '../data/store';

/*
  猕猴桃管理（11-27 原型）的入口：账号菜单里点「我的用量」「用量管理」，一句话调用。
  - openMyUsage()：打开「我的用量」弹窗（KiviApp 里挂着 MyUsageDialog）
  - openUsageAdmin()：新标签页打开「用量管理」后台（#/app/admin，单独一套页面，不套主站侧栏，11-27 用户定）
*/

const nav = createStore<{ myUsage: boolean }>({ init: () => ({ myUsage: false }) });

export const openMyUsage = () => nav.set((s) => ({ ...s, myUsage: true }));
export const closeMyUsage = () => nav.set((s) => ({ ...s, myUsage: false }));
export const openUsageAdmin = () => window.open(`${location.pathname}${location.search}#/app/admin`, '_blank', 'noopener');

export const useMyUsageOpen = () => useStore(nav, (s) => s.myUsage);
