/* 猕猴桃管理（11-27 原型）的数据形状，纯数据 */

/** 四种角色：包含关系，越往后范围越大（演示开关里切） */
export type KwRole = 'user' | 'admin' | 'project-admin' | 'super-admin';

export interface KwProject {
  id: string;
  name: string;
}

export interface KwGroup {
  id: string;
  projectId: string;
  name: string;
  /** 组管理员（成员 id） */
  adminIds: string[];
}

export interface KwMember {
  id: string;
  name: string;
  projectId: string;
  groupId: string;
  /** 周上限：每周一 00:00 发放、重置 */
  weeklyLimit: number;
  /** 临时额度剩余：申请或管理员加的，不随周清零，先扣周额度再扣它 */
  tempLeft: number;
  /** 活跃度：生成消耗记录用（0 = 本周没用过） */
  activity: number;
  /** 采纳率、下载率（0–1，口径以 KIVI 现有埋点为准） */
  adoption: number;
  download: number;
  joinedAt: number;
}

/** 一笔猕猴桃变动 */
export interface KwRecord {
  id: string;
  at: number;
  /** 变更原因：图片生成 / 视频生成 / 音频生成 / 周额度发放 / 周额度过期 / 临时额度添加 …… */
  reason: string;
  /** 模型 id，发放、过期这类没有 */
  model?: string;
  /** 正数加、负数扣 */
  amount: number;
  /** 关联会话标识 */
  session?: string;
}

/** 操作日志 */
export interface KwLog {
  id: string;
  at: number;
  operator: string;
  action: string;
  /** 操作对象：成员名、分组名、申请单号、导出范围 */
  target: string;
  before?: string;
  after?: string;
  /** 在哪个范围里做的：项目 · 分组 */
  scope?: string;
}

export interface KwState {
  projects: KwProject[];
  groups: KwGroup[];
  members: KwMember[];
  logs: KwLog[];
}
