import { useState } from 'react';
import { IconButton } from '@kivi';
import { MemoryModal } from './MemoryModal';
import './memory.css';

/** Agent 记忆管理：输入框工具条里的入口（脑图标，悬停说「管理记忆」）+ 记忆管理弹窗 */
export function MemoryManager() {
  const [open, setOpen] = useState(false);
  // 每次打开加 1，弹窗重新挂载，重新读最新记忆（照线上）
  const [session, setSession] = useState(0);
  return (
    <>
      <IconButton
        icon="Brain"
        label="管理记忆"
        variant="ghost"
        onClick={() => {
          setSession((n) => n + 1);
          setOpen(true);
        }}
      />
      {session > 0 && <MemoryModal key={session} open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
