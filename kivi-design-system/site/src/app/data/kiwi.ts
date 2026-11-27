import { ApiError, request } from './api';
import { db } from './db';
import { demo } from './demo';
import { KIWI_USD, ME, recordsOf, seedKiwi, weekStart } from './kiwi-seed';
import type { KwGroup, KwLog, KwMember, KwRole, KwState } from './kiwi-types';
import { createStore, uid, useStore } from './store';

/*
  猕猴桃管理（11-27 原型）的假后端：成员、分组、申请单、操作日志，存本机。
  页面只读这里、调这里的动作；所有改动都写操作日志（记操作人、对象、前后值）。
  「我」的余额就是右上角那个余额（db.balance）：周额度先扣、临时额度后扣，
  所以「我」的周剩余 = 余额 − 临时剩余，给「我」加额度时余额跟着加。
*/

export * from './kiwi-seed';
export type * from './kiwi-types';

export const kiwi = createStore<KwState>({ key: 'kivi-app-kiwi', version: 1, init: seedKiwi });
export const useKiwi = <S,>(selector: (s: KwState) => S) => useStore(kiwi, selector);

/** 当前操作人（演示里就是「我」） */
const OPERATOR = 'KIVI';

export const ROLE_LABEL: Record<KwRole, string> = {
  user: '用户',
  admin: '管理员',
  'project-admin': '项目管理员',
  'super-admin': '超级管理员',
};
export const isManager = (role: KwRole) => role !== 'user';

// ---------- 范围 ----------

/** 管理面板的数据范围：projectId 不传 = 全平台；groupId 传了就只看这一组 */
export interface KwScope {
  projectId?: string;
  groupId?: string;
}

/** 角色能看的范围：管理员固定本组，项目管理员固定本项目，超管自己选（不选 = 全平台） */
export function scopeOf(role: KwRole, chosenProject?: string): KwScope {
  const me = kiwi.get().members.find((m) => m.id === ME);
  if (role === 'admin') return { projectId: me?.projectId, groupId: me?.groupId };
  if (role === 'project-admin') return { projectId: me?.projectId };
  if (role === 'super-admin') return { projectId: chosenProject };
  return {};
}

export const inScope = (m: KwMember, s: KwScope) => (!s.projectId || m.projectId === s.projectId) && (!s.groupId || m.groupId === s.groupId);

export function scopeLabel(s: KwScope, state = kiwi.get()) {
  const p = state.projects.find((x) => x.id === s.projectId);
  const g = state.groups.find((x) => x.id === s.groupId);
  if (!p) return '全平台';
  return g ? `${p.name} · ${g.name}` : p.name;
}

// ---------- 统计 ----------

export interface KwStats {
  weeklyLimit: number;
  /** 本周已用：从周额度和临时额度里扣的都算 */
  weekUsed: number;
  /** 本周剩余：只算周额度 */
  weekLeft: number;
  tempLeft: number;
  /** 本周预估花费（美元） */
  cost: number;
}

/** 一个成员这周的额度和花费；「我」按右上角余额算 */
export function statsOf(m: KwMember, balance = db.get().balance, now = Date.now()): KwStats {
  if (m.id === ME) {
    const tempLeft = Math.max(0, Math.min(m.tempLeft, balance));
    const weekLeft = Math.max(0, balance - tempLeft);
    const weekUsed = Math.max(0, m.weeklyLimit - weekLeft);
    return { weeklyLimit: m.weeklyLimit, weekUsed, weekLeft, tempLeft, cost: weekUsed * KIWI_USD };
  }
  const weekUsed = recordsOf(m, weekStart(now), now + 1, now).reduce((sum, r) => sum - r.amount, 0);
  const weekLeft = Math.max(0, m.weeklyLimit - weekUsed);
  return { weeklyLimit: m.weeklyLimit, weekUsed, weekLeft, tempLeft: m.tempLeft, cost: weekUsed * KIWI_USD };
}

export const usd = (kiwiAmount: number) => `$${(kiwiAmount * KIWI_USD).toFixed(2)}`;
export const money = (n: number) => `$${n.toFixed(2)}`;
export const pct = (n: number | undefined) => (n === undefined || Number.isNaN(n) ? '—' : `${(n * 100).toFixed(1)}%`);

// ---------- 动作 ----------

function log(entry: Omit<KwLog, 'id' | 'at' | 'operator'>) {
  kiwi.set((s) => ({ ...s, logs: [{ id: uid('log'), at: Date.now(), operator: OPERATOR, ...entry }, ...s.logs] }));
}

const memberOf = (id: string) => kiwi.get().members.find((m) => m.id === id);
const groupName = (id: string) => kiwi.get().groups.find((g) => g.id === id)?.name ?? '';

function patchMember(id: string, patch: Partial<KwMember>) {
  kiwi.set((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
}

/** 改了「我」的周上限、临时额度，右上角余额跟着变 */
function bumpBalance(id: string, delta: number) {
  if (id === ME && delta) db.set((s) => ({ ...s, balance: Math.max(0, s.balance + delta) }));
}

/** 额度操作：设周上限 / 周上限加多少 / 临时额度加减多少 */
export type QuotaOp = { kind: 'set-limit'; value: number } | { kind: 'add-limit'; value: number } | { kind: 'temp'; value: number };

export const QUOTA_OP_LABEL = { 'set-limit': '调整周上限', 'add-limit': '增加周额度', temp: '调整临时额度' } as const;

/** 操作后的样子；不合法（周剩余或临时额度小于 0）返回 error */
export function previewQuota(m: KwMember, op: QuotaOp): { before: number; after: number; error?: string } {
  const s = statsOf(m);
  if (op.kind === 'temp') {
    const after = s.tempLeft + op.value;
    return { before: s.tempLeft, after, error: after < 0 ? '临时额度不能小于 0' : undefined };
  }
  const after = op.kind === 'set-limit' ? op.value : m.weeklyLimit + op.value;
  const usedFromWeekly = s.weeklyLimit - s.weekLeft;
  return { before: m.weeklyLimit, after, error: after < usedFromWeekly ? `不能低于本周已从周额度扣的 ${usedFromWeekly}` : after < 0 ? '周上限不能小于 0' : undefined };
}

export interface QuotaResult {
  id: string;
  ok: boolean;
  error?: string;
}

/**
 * 给一批成员做额度操作，逐人返回结果（批量也走这里）。
 * 演示开关「批量部分失败」开着时，第一次提交每 3 人里失败 1 个；重试只发失败的那几个，成功的不会再做一遍。
 */
export async function applyQuota(ids: string[], op: QuotaOp, reason: string, { retry = false } = {}): Promise<QuotaResult[]> {
  return request(() => {
    const partialFail = demo.get().kiwiPartialFail && !retry && ids.length > 1;
    return ids.map((id, i) => {
      const m = memberOf(id);
      if (!m) return { id, ok: false, error: '成员已不在当前范围' };
      if (partialFail && i % 3 === 1) return { id, ok: false, error: '额度服务超时' };
      const p = previewQuota(m, op);
      if (p.error) return { id, ok: false, error: p.error };
      if (op.kind === 'temp') {
        const tempLeft = statsOf(m).tempLeft + op.value;
        patchMember(id, { tempLeft });
        bumpBalance(id, op.value);
        log({ action: op.value >= 0 ? '增加临时额度' : '减少临时额度', target: m.name, before: String(p.before), after: String(p.after), reason, scope: groupName(m.groupId) });
      } else {
        patchMember(id, { weeklyLimit: p.after });
        bumpBalance(id, p.after - p.before);
        log({ action: op.kind === 'set-limit' ? '调整周上限' : '增加周额度', target: m.name, before: String(p.before), after: String(p.after), reason, scope: groupName(m.groupId) });
      }
      return { id, ok: true };
    });
  });
}

/** 添加成员（飞书通讯录里选的人）；已在这个项目里的不能重复加 */
export async function addMember(person: { id: string; name: string }, groupId: string, weeklyLimit: number) {
  return request(() => {
    const g = kiwi.get().groups.find((x) => x.id === groupId)!;
    const dup = kiwi.get().members.find((m) => (m.id === person.id || m.name === person.name) && m.projectId === g.projectId);
    if (dup) throw new ApiError('server', `${person.name} 已在「${groupName(dup.groupId)}」`);
    const m: KwMember = { id: person.id, name: person.name, projectId: g.projectId, groupId, weeklyLimit, tempLeft: 0, activity: 0, adoption: NaN, download: NaN, joinedAt: Date.now() };
    kiwi.set((s) => ({ ...s, members: [...s.members, m] }));
    log({ action: '添加成员', target: person.name, after: `${g.name} · 周上限 ${weeklyLimit}`, scope: g.name });
  });
}

/** 移出：只是不在这个组了，平台账号、历史消耗、日志都留着 */
export async function removeMember(id: string) {
  return request(() => {
    const m = memberOf(id);
    if (!m) return;
    kiwi.set((s) => ({
      ...s,
      members: s.members.filter((x) => x.id !== id),
      groups: s.groups.map((g) => ({ ...g, adminIds: g.adminIds.filter((a) => a !== id) })),
    }));
    log({ action: '移除成员', target: m.name, before: groupName(m.groupId), scope: groupName(m.groupId) });
  });
}

/** 跨组调整（项目管理员）：之前的消耗按原来的组算，不回溯 */
export async function moveMember(id: string, groupId: string) {
  return request(() => {
    const m = memberOf(id);
    if (!m || m.groupId === groupId) return;
    patchMember(id, { groupId });
    kiwi.set((s) => ({ ...s, groups: s.groups.map((g) => (g.id === m.groupId ? { ...g, adminIds: g.adminIds.filter((a) => a !== id) } : g)) }));
    log({ action: '调整分组', target: m.name, before: groupName(m.groupId), after: groupName(groupId) });
  });
}

export async function createGroup(projectId: string, name: string) {
  return request(() => {
    if (kiwi.get().groups.some((g) => g.projectId === projectId && g.name === name)) throw new ApiError('server', '这个项目里已经有同名分组');
    const g: KwGroup = { id: uid('g'), projectId, name, adminIds: [] };
    kiwi.set((s) => ({ ...s, groups: [...s.groups, g] }));
    log({ action: '新建分组', target: name, scope: kiwi.get().projects.find((p) => p.id === projectId)?.name });
    return g.id;
  });
}

export async function setGroupAdmins(groupId: string, adminIds: string[]) {
  return request(() => {
    const g = kiwi.get().groups.find((x) => x.id === groupId);
    if (!g) return;
    const names = (ids: string[]) => ids.map((id) => memberOf(id)?.name).filter(Boolean).join('、') || '无';
    kiwi.set((s) => ({ ...s, groups: s.groups.map((x) => (x.id === groupId ? { ...x, adminIds } : x)) }));
    log({ action: '任免组管理员', target: g.name, before: names(g.adminIds), after: names(adminIds), scope: g.name });
  });
}

/** 超管人工补发加额失败的申请单：以申请单号为凭据，已到账的不再加 */
export async function compensate(appId: string) {
  return request(() => {
    const app = kiwi.get().applications.find((a) => a.id === appId);
    if (!app) return 'missing' as const;
    if (app.granted) return 'already' as const;
    const m = memberOf(app.memberId);
    kiwi.set((s) => ({ ...s, applications: s.applications.map((a) => (a.id === appId ? { ...a, status: 'approved', granted: true, compensatedAt: Date.now() } : a)) }));
    if (m) {
      patchMember(m.id, { tempLeft: statsOf(m).tempLeft + app.amount });
      bumpBalance(m.id, app.amount);
    }
    log({ action: '人工补发', target: app.id, before: '加额失败', after: `${m?.name ?? ''} +${app.amount} 临时额度`, scope: m ? groupName(m.groupId) : '' });
    return 'done' as const;
  });
}

/** 导出留痕 */
export function logExport(target: string, after: string) {
  log({ action: '导出', target, after });
}
