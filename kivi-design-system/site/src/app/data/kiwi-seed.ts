import { MODELS } from '@kivi';
import type { KwGroup, KwLog, KwMember, KwProject, KwRecord, KwState } from './kiwi-types';

/*
  猕猴桃管理（11-27 原型）的种子数据和逐笔消耗记录。
  消耗记录不存本机：按成员 id + 日期用固定随机数现算，刷新后一样；本周已用由它加出来。
*/

/** 1 猕猴桃 ≈ 0.035 美元（平台固定汇率，文档 2 节） */
export const KIWI_USD = 0.035;
/** 演示里的「我」：账号菜单顶上那个 KIVI */
export const ME = 'me';

const DAY = 86_400_000;

/** 本周一 00:00（周额度重置时间，暂定） */
export function weekStart(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const back = (d.getDay() + 6) % 7;
  return d.getTime() - back * DAY;
}

export const dayStart = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** 固定随机数：同一个种子永远出同一串 */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)];

const IMAGE_MODELS = MODELS.image.map((m) => m.value);
const VIDEO_MODELS = MODELS.video.map((m) => m.value);
const AUDIO_MODELS = MODELS.audio.map((m) => m.value);

/** 模型 id → 显示名、Logo */
export function modelInfo(id: string) {
  for (const list of Object.values(MODELS)) {
    const m = list.find((x) => x.value === id);
    if (m) return { label: m.label, icon: m.icon };
  }
  return { label: id, icon: undefined };
}

/** 某个成员某一天的消耗（不含发放、过期），按时间新到旧 */
function dayRecords(member: KwMember, day: number, now: number): KwRecord[] {
  if (day > now) return [];
  const r = rng(`${member.id}:${day}`);
  // 每天花多少大约是周上限 × 活跃度 / 5（工作日多、周末少）
  const weekend = [0, 6].includes(new Date(day).getDay());
  const budget = (member.weeklyLimit * member.activity) / 5 / (weekend ? 4 : 1);
  // 每个人常用的模型就那几个：图片 3 个、视频 2 个、音频 1 个
  const pr = rng(`${member.id}:models`);
  const mine = (list: string[], n: number) => [...list].sort(() => pr() - 0.5).slice(0, n);
  const imageModels = mine(IMAGE_MODELS, 3);
  const videoModels = mine(VIDEO_MODELS, 2);
  const audioModels = mine(AUDIO_MODELS, 1);
  const out: KwRecord[] = [];
  let spent = 0;
  let i = 0;
  while (spent < budget * (0.6 + r() * 0.8) && i < 12) {
    const roll = r();
    const kind = roll < 0.62 ? 'image' : roll < 0.92 ? 'video' : 'audio';
    const model = kind === 'image' ? pick(r, imageModels) : kind === 'video' ? pick(r, videoModels) : pick(r, audioModels);
    const cost = kind === 'image' ? [4, 8, 12, 16, 40][Math.floor(r() * 5)] : kind === 'video' ? 60 + Math.floor(r() * 12) * 20 : 6 + Math.floor(r() * 4) * 2;
    const at = day + (9 + r() * 12) * 3_600_000;
    if (at > now) break;
    out.push({
      id: `${member.id}-${day}-${i}`,
      at,
      reason: kind === 'image' ? '图片生成' : kind === 'video' ? '视频生成' : '音频生成',
      model,
      amount: -cost,
      session: `S-${Math.floor(r() * 1e8).toString(36).toUpperCase()}`,
    });
    spent += cost;
    i++;
  }
  return out.sort((a, b) => b.at - a.at);
}

const cache = new Map<string, KwRecord[]>();

/** 成员在 [from, to) 里的消耗记录，新到旧 */
export function recordsOf(member: KwMember, from: number, to: number, now = Date.now()): KwRecord[] {
  const out: KwRecord[] = [];
  for (let day = dayStart(to - 1); day >= dayStart(from); day -= DAY) {
    const key = `${member.id}:${member.weeklyLimit}:${member.activity}:${day}:${day === dayStart(now) ? Math.floor(now / 600_000) : ''}`;
    let list = cache.get(key);
    if (!list) {
      list = dayRecords(member, day, now);
      cache.set(key, list);
    }
    out.push(...list.filter((x) => x.at >= from && x.at < to));
  }
  return out;
}

// ---------- 种子 ----------

const PROJECTS: KwProject[] = [
  { id: 'p1', name: 'KIVI' },
  { id: 'p2', name: '海外发行' },
  { id: 'p3', name: '游戏美术' },
];

const GROUPS: Omit<KwGroup, 'adminIds'>[] = [
  { id: 'g1', projectId: 'p1', name: '设计组' },
  { id: 'g2', projectId: 'p1', name: '产品组' },
  { id: 'g3', projectId: 'p1', name: '研发组' },
  { id: 'g4', projectId: 'p2', name: '投放组' },
  { id: 'g5', projectId: 'p2', name: '本地化组' },
  { id: 'g6', projectId: 'p3', name: '原画组' },
  { id: 'g7', projectId: 'p3', name: '3D 组' },
];

const SURNAMES = '王李张刘陈杨黄赵吴周徐孙马朱胡郭何林罗高郑梁谢宋唐许韩冯邓曹彭曾萧田董潘袁蔡蒋余于杜叶程魏苏吕丁任卢姚沈钟姜崔谭陆范汪廖石金韦贾夏付方邹熊白孟秦邱侯江尹薛闫段雷龙黎史陶贺毛郝顾龚邵万覃武钱戴严欧莫孔向常汤康易乔赖文';
const GIVEN = ['子涵', '欣怡', '梓轩', '雨桐', '浩然', '一诺', '思远', '若溪', '嘉豪', '语嫣', '俊杰', '诗琪', '宇航', '梦瑶', '晨阳', '可馨', '明哲', '佳怡', '泽宇', '雪婷', '天佑', '安然', '博文', '静怡', '昊天', '晓彤', '文轩', '沐晴', '子墨', '书瑶'];

/** 每组几个人 */
const GROUP_SIZE: Record<string, number> = { g1: 12, g2: 7, g3: 14, g4: 9, g5: 5, g6: 11, g7: 8 };

export function seedKiwi(): KwState {
  const r = rng('kivi-kiwi-seed');
  const used = new Set<string>(['KIVI']);
  const name = () => {
    for (;;) {
      const n = pick(r, [...SURNAMES]) + pick(r, GIVEN);
      if (!used.has(n)) {
        used.add(n);
        return n;
      }
    }
  };
  const members: KwMember[] = [];
  // 「我」在 KIVI · 设计组，也是设计组的管理员
  members.push({ id: ME, name: 'KIVI', projectId: 'p1', groupId: 'g1', weeklyLimit: 3000, tempLeft: 500, activity: 0.5, adoption: 0.42, download: 0.31, joinedAt: Date.now() - 90 * DAY });
  for (const g of GROUPS) {
    for (let i = members.filter((m) => m.groupId === g.id).length; i < GROUP_SIZE[g.id]; i++) {
      const limit = pick(r, [1000, 2000, 3000, 3000, 3000, 5000]);
      members.push({
        id: `m${members.length}`,
        name: name(),
        projectId: g.projectId,
        groupId: g.id,
        weeklyLimit: limit,
        tempLeft: r() < 0.3 ? pick(r, [0, 800, 1500, 3000, 5000]) : 0,
        activity: r() < 0.12 ? 0 : 0.2 + r() * 0.95,
        adoption: 0.15 + r() * 0.6,
        download: 0.08 + r() * 0.5,
        joinedAt: Date.now() - (20 + r() * 200) * DAY,
      });
    }
  }
  const groups: KwGroup[] = GROUPS.map((g) => {
    const inGroup = members.filter((m) => m.groupId === g.id);
    return { ...g, adminIds: g.id === 'g1' ? [ME] : [inGroup[0].id] };
  });

  const now = Date.now();
  const byName = (i: number) => members[i];
  const logs: KwLog[] = [
    { action: '增加临时额度', target: byName(8).name, before: '0', after: '10000', hours: 50, operator: 'KIVI' },
    { action: '调整周上限', target: byName(4).name, before: '2000', after: '3000', hours: 72, operator: 'KIVI' },
    { action: '添加成员', target: byName(9).name, before: '', after: '设计组 · 周上限 2000', hours: 120, operator: 'KIVI' },
    { action: '导出', target: '设计组成员列表', before: '', after: '本周 · 12 人', hours: 130, operator: 'KIVI' },
    { action: '移除成员', target: '吴子轩', before: '设计组', after: '', hours: 160, operator: 'KIVI' },
  ].map((l, i) => ({ id: `log-seed-${i}`, at: now - l.hours * 3_600_000, operator: l.operator, action: l.action, target: l.target, before: l.before, after: l.after, scope: 'KIVI · 设计组' }));

  return { projects: PROJECTS, groups, members, logs };
}

/** 飞书通讯录（添加用户时搜的人，演示用） */
export const DIRECTORY = (() => {
  const r = rng('kivi-directory');
  const depts = ['设计中心', '产品部', '技术部', '市场部', '本地化中心', '美术中心'];
  const names = ['林知夏', '顾北辰', '沈清欢', '陆星河', '江映月', '许南风', '苏念安', '温以凡', '周屿', '季白', '程意', '宋知意', '叶听澜', '秦朗', '白露'];
  return names.map((n, i) => ({ id: `fs${i}`, name: n, dept: pick(r, depts) }));
})();
