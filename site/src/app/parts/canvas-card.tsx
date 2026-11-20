import { useMemo, useState } from 'react';
import type { ProjectCardProps } from '@kivi';
import { useDB } from '../data/db';
import { renameCanvas } from '../data/canvases';
import { confirmDeleteCanvases } from '../flows/delete';
import { shareCanvas } from '../flows/share';
import { NameDialog } from '../pages/assets/NameDialog';
import { run } from '../pages/assets/ops';

/*
  画布卡（ProjectCard）的动作：点卡打开那块画布、「⋯」里分享 / 重命名 / 删除。
  创作首页「最近项目」、资产页「我的画布」和全部画布页共用，页面只给「打开」。
*/
export function useCanvasCards(onOpen: (canvasId: string) => void) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const initial = useDB((s) => s.canvases.find((c) => c.id === renaming)?.name ?? '');
  const state = useMemo(() => (renaming ? { title: '重命名画布', initial } : null), [renaming, initial]);
  const cardProps = (id: string): Pick<ProjectCardProps, 'onOpen' | 'onShare' | 'onRename' | 'onDelete'> => ({
    onOpen: () => onOpen(id),
    onShare: () => void shareCanvas(id),
    onRename: () => setRenaming(id),
    onDelete: () => void confirmDeleteCanvases([id]),
  });
  const dialog = (
    <NameDialog state={state} onSubmit={(name) => (renaming ? run(() => renameCanvas(renaming, name)) : Promise.resolve(false))} onClose={() => setRenaming(null)} />
  );
  return { cardProps, dialog };
}
