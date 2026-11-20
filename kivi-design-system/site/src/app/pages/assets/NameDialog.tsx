import { useEffect, useState } from 'react';
import { Button, Dialog, Input } from '@kivi';

/*
  资产页的起名弹窗：新建文件夹、文件夹改名、画布改名共用。
  Dialog 400 + Input，最多 20 字（带字数），空名「确定」置灰；确定后转圈等请求做完才关。
*/

const MAX = 20;

export interface NameDialogProps {
  /** 打开着：标题和初始名字一起给；null 是关着 */
  state: { title: string; initial: string } | null;
  /** 确定：做完再关，抛错不关（错误自己处理，返回 false） */
  onSubmit: (name: string) => Promise<boolean>;
  onClose: () => void;
}

export function NameDialog({ state, onSubmit, onClose }: NameDialogProps) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  // 每次打开重置成初始名字（只在打开那一下：后台任务入库引起的重渲染不能把正在输入的字冲掉）
  const open = state !== null;
  useEffect(() => {
    if (open) setName(state.initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const empty = name.trim() === '';
  const submit = async () => {
    if (empty || busy) return;
    setBusy(true);
    const ok = await onSubmit(name.trim());
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Dialog
      size={400}
      open={state !== null}
      onOpenChange={(v) => !v && !busy && onClose()}
      title={state?.title}
      footer={
        <>
          <Button size={36} variant="secondary" disabled={busy} onClick={onClose}>
            取消
          </Button>
          <Button size={36} variant="primary" loading={busy} disabled={empty} onClick={() => void submit()}>
            确定
          </Button>
        </>
      }
    >
      <Input
        autoFocus
        value={name}
        maxLength={MAX}
        counter={`${name.length}/${MAX}`}
        aria-label="名称"
        placeholder="请输入名称"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && void submit()}
      />
    </Dialog>
  );
}
