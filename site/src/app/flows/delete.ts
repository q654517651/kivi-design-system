import type { ReactNode } from 'react';
import { toast } from '@kivi';
import { confirm, DELETE_CONFIRM } from './dialogs';
import { ApiError } from '../data/api';
import { deleteCanvas } from '../data/canvases';
import { handleError } from './errors';

/**
 * 删除：先二次确认（DELETE_CONFIRM），确认按钮转圈等 action 做完，成功 Toast「删除成功」。
 * options.description 换说明文案（标题、按钮不变，比如删文件夹）。
 * action 出错弹窗不关（可再点或取消）：断网、超时走常驻网络通知（handleError），其他错误统一 Toast「删除失败，请稍后再试」（设计规则「状态」）。返回是否删了。
 * 页面里所有用户主动删除都走它；发送失败后的回滚这类不是用户删除，不走。
 */
/** 删画布的说明（11-20 用户定）：画布删了，里面生成的东西还在资产页「生成历史」里 */
export const CANVAS_DELETE_DESCRIPTION = '删除后，画布中生成的资产仍可在「生成历史」中找到';

/** 删一块或几块画布：先确认（说明用 CANVAS_DELETE_DESCRIPTION），一块块删，出错就停。返回是否删了 */
export function confirmDeleteCanvases(ids: string[]) {
  return confirmDelete(
    async () => {
      for (const id of ids) await deleteCanvas(id);
    },
    { description: CANVAS_DELETE_DESCRIPTION },
  );
}

export async function confirmDelete(action: () => Promise<unknown>, options?: { description?: ReactNode }): Promise<boolean> {
  const ok = await confirm({
    ...DELETE_CONFIRM,
    ...options,
    onConfirm: async () => {
      try {
        await action();
      } catch (e) {
        if (e instanceof ApiError && e.code === 'network') handleError(e);
        else {
          toast.error('删除失败，请稍后再试');
          if (!(e instanceof ApiError)) console.error(e);
        }
        throw e;
      }
    },
  });
  if (ok) toast.success('删除成功');
  return ok;
}
