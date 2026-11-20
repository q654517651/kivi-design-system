import { toast } from '@kivi';
import { createStore, useStore } from './store';

/*
  界面语言（账号菜单「语言」，11-20 用户定做成真的）：选的存本机，刷新后还在，<html lang> 跟着改。
  演示站的文字只写了中文，切到 English 界面文字不变，提示里说清楚。
*/

export type Lang = 'zh' | 'en';

const store = createStore<Lang>({ key: 'kivi-app-lang', init: () => 'zh' });

const apply = (l: Lang) => {
  if (typeof document !== 'undefined') document.documentElement.lang = l === 'en' ? 'en' : 'zh-CN';
};
apply(store.get());

export const useLang = () => useStore(store, (s) => s);

export function setLang(l: Lang) {
  if (store.get() === l) return;
  store.set(() => l);
  apply(l);
  toast.success(l === 'en' ? '已切换为 English（演示站界面只有中文）' : '已切换为中文');
}
