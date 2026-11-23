import { request } from './api';
import { db } from './db';
import { uid } from './store';
import type { Chat } from './types';

/*
  主站对话的动作：新建、重命名、置顶、删除，以及生成后把任务挂进对话。
  侧栏的对话历史读 db.chats：默认对话最前，再是置顶的，其余按更新时间新到旧（sortRecent）。默认对话不能删（11-23 用户定）。
  删对话时它的任务一起删，但生成出来的素材还在（线上：素材在「我的资产」里仍然找得到）。
*/

/** 默认对话最前，再是置顶的，再按更新时间新到旧。对话和画布历史共用 */
export function sortRecent<T extends { pinned?: boolean; fixed?: boolean; updatedAt: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => Number(!!b.fixed) - Number(!!a.fixed) || Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt);
}

const patchChat = (id: string, fn: (c: Chat) => Chat) => db.set((s) => ({ ...s, chats: s.chats.map((c) => (c.id === id ? fn(c) : c)) }));

/** 新建一个空对话 */
export function createChat(title: string): Promise<Chat> {
  return request(() => {
    const chat: Chat = { id: uid('chat-'), title, updatedAt: Date.now(), items: [] };
    db.set((s) => ({ ...s, chats: [chat, ...s.chats] }));
    return chat;
  });
}

/** 重命名（不动更新时间，列表不跳） */
export function renameChat(id: string, title: string) {
  return request(() => patchChat(id, (c) => ({ ...c, title })));
}

/** 置顶 / 取消置顶（翻转） */
export function pinChat(id: string) {
  return request(() => patchChat(id, (c) => ({ ...c, pinned: !c.pinned })));
}

/** 删除对话和它的任务，素材留着。默认对话删不掉 */
export function deleteChat(id: string) {
  return request(() =>
    db.set((s) => s.chats.some((c) => c.id === id && c.fixed) ? s : ({
      ...s,
      chats: s.chats.filter((c) => c.id !== id),
      tasks: s.tasks.filter((t) => !(t.where.page === 'create' && t.where.chatId === id)),
      agentTurns: s.agentTurns.filter((t) => t.chatId !== id),
    })),
  );
}

/** 生成提交成功后，把任务排到对话最后，对话更新时间刷新（排到列表最前） */
export function addChatTask(chatId: string, taskId: string) {
  patchChat(chatId, (c) => ({ ...c, updatedAt: Date.now(), items: [...c.items, { kind: 'task', taskId }] }));
}
