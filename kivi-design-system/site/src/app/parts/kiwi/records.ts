import { db } from '../../data/db';
import { kiwi, ME, recordsOf, weekStart, dayStart, type KwMember, type KwRecord } from '../../data/kiwi';

/*
  一个成员在一段时间里的猕猴桃变动：生成消耗 + 每周一发放周额度、周日 23:59 过期清零 + 临时额度到账。
  「我」还加上演示站里真提交过的生成任务（扣费就是右上角余额扣的那笔）。
*/

const DAY = 86_400_000;
const WEEK = 7 * DAY;

export function ledgerOf(m: KwMember, from: number, to: number, now = Date.now()): KwRecord[] {
  const out: KwRecord[] = recordsOf(m, from, to, now);

  // 周额度发放、过期
  for (let ws = weekStart(to - 1); ws + WEEK > from; ws -= WEEK) {
    if (ws >= from && ws < to && ws <= now) out.push({ id: `${m.id}-issue-${ws}`, at: ws, reason: '周额度发放', amount: m.weeklyLimit });
    const end = ws + WEEK - 60_000;
    if (end >= from && end < to && end < now) {
      const used = recordsOf(m, ws, ws + WEEK, now).reduce((s, r) => s - r.amount, 0);
      const left = Math.max(0, m.weeklyLimit - used);
      if (left) out.push({ id: `${m.id}-expire-${ws}`, at: end, reason: '周额度过期', amount: -left });
    }
  }

  // 临时额度到账：申请单通过（含超管补发）
  for (const a of kiwi.get().applications) {
    if (a.memberId !== m.id || !a.granted) continue;
    const at = a.compensatedAt ?? a.createdAt + 3_600_000;
    if (at >= from && at < to) out.push({ id: `${m.id}-temp-${a.id}`, at, reason: '临时额度添加', amount: a.amount, session: a.id });
  }

  // 「我」在演示站里真生成过的
  if (m.id === ME) {
    for (const t of db.get().tasks) {
      if (t.createdAt < from || t.createdAt >= to || !t.cost || t.status === 'failed' || t.status === 'cancelled') continue;
      const reason = t.kind === 'tool' ? `${t.label ?? 'AI 工具'}` : t.media === 'video' ? '视频生成' : t.media === 'audio' ? '音频生成' : '图片生成';
      out.push({ id: t.id, at: t.createdAt, reason, model: t.model, amount: -t.cost, session: t.id.toUpperCase() });
    }
  }
  return out.sort((a, b) => b.at - a.at);
}

/** 时间范围选项 */
export type RangeKey = '7' | '30';
export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: '7', label: '近 7 天' },
  { value: '30', label: '近 30 天' },
];
export const rangeFrom = (key: RangeKey, now = Date.now()) => dayStart(now) - (Number(key) - 1) * DAY;

/** 每天消耗多少（只算扣的） */
export function dailySpend(list: KwRecord[], from: number, to: number) {
  const days: { day: number; value: number }[] = [];
  for (let d = dayStart(from); d < to; d += DAY) days.push({ day: d, value: 0 });
  for (const r of list) {
    if (r.amount >= 0 || !r.model) continue;
    const slot = days.find((d) => r.at >= d.day && r.at < d.day + DAY);
    if (slot) slot.value += -r.amount;
  }
  return days;
}

/** 按模型加总消耗，大到小 */
export function modelShare(list: KwRecord[]) {
  const map = new Map<string, number>();
  for (const r of list) if (r.amount < 0 && r.model) map.set(r.model, (map.get(r.model) ?? 0) - r.amount);
  const total = [...map.values()].reduce((a, b) => a + b, 0);
  return { total, rows: [...map.entries()].map(([model, value]) => ({ model, value, share: total ? value / total : NaN })).sort((a, b) => b.value - a.value) };
}
