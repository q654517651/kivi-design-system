import { useState } from 'react';
import { EmptyState, Toaster } from '@kivi';
import { AssetsPage } from './AssetsPage';
import { Sidebar } from './Sidebar';

/** 主站「资产」页原型：左侧主站侧栏 + 右边资产页。侧栏选别的项，右边只显示「不在原型范围」 */
export function App() {
  const [current, setCurrent] = useState('assets');
  return (
    <div className="ast-app">
      <Toaster />
      <Sidebar current={current} onSelect={setCurrent} />
      {current === 'assets' ? (
        <AssetsPage />
      ) : (
        <main className="ast-main ast-main--blank">
          <EmptyState title="这个页面不在原型范围" description="点左侧「资产」回来" />
        </main>
      )}
    </div>
  );
}
