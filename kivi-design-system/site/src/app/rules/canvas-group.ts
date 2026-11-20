import type { CanvasNode } from '../data/types';

/*
  画布的组、多选、排列、整理、节点上限（照线上 packages/infinite-canvas，origin/feat/3.13-content-sync）：
  - 多选浮条 components/selector-box-popover、排列 components/selected-layout-menu + utils/selected-node-layout.ts
  - 组 components/group、整组执行限制 policies/group-execution-policy.ts、保存工作流 group/components/create-workflow-popover
  - 整理画布 utils/arrange-canvas*.ts（线上用 Dagre 分层，这里自己写了一个简化的分层排法，见 data/canvas-layout.ts）
  - 节点上限 utils/node-limit-guard.ts
  文字节点的大小 nodes/text/constants.ts。纯数据和纯函数，不碰界面。
*/

// ---------- 排列（多选浮条、组工具栏的「布局」） ----------

export const ARRANGE_OPTIONS = [
  { mode: 'vertical', label: '垂直对齐', icon: 'VerticalLayout' },
  { mode: 'horizontal', label: '水平对齐', icon: 'HorizontalLayout' },
  { mode: 'grid', label: '宫格对齐', icon: 'AutoLayout' },
] as const;
export type ArrangeMode = (typeof ARRANGE_OPTIONS)[number]['mode'];

/** 整理画布：分层布局里相邻两层的间距 200、同一层相邻节点 100、连通分量之间 150、打包成行时的宽高比 1.6（线上 LibTV 实测） */
export const TIDY = { layerGap: 200, nodeGap: 100, componentGap: 150, aspectRatio: 1.6 } as const;

// ---------- 组 ----------

/** 组内有这些节点就不能整组执行（照线上 GROUP_EXECUTION_RESTRICTIONS，按节点的 action 判断；这里按类型和工具） */
export function groupExecutionRestriction(nodes: CanvasNode[]): string | null {
  for (const n of nodes) {
    if (n.type === 'clip') return '组内包含视频剪辑节点不支持整组执行';
    if (n.tool === 'text-edit') return '组内包含文字编辑节点不支持整组执行';
    if (n.type === 'audio' && !n.upload && !n.output) return '组内包含生音频节点不支持整组执行';
  }
  return null;
}

/** 保存工作流：名字最多 50 字（线上 WORKFLOW_TEMPLATE_NAME_MAX_LENGTH） */
export const WORKFLOW_NAME_MAX = 50;

// ---------- 文字节点 ----------

/** 文字节点拖右下角改大小：宽高都在 256–1024（线上 TEXT_NODE_MIN / MAX） */
export const TEXT_NODE_MIN = 256;
export const TEXT_NODE_MAX = 1024;

// ---------- 节点上限 ----------

/** 一块画布最多 500 个节点（组也算，照线上 installNodeLimitGuard），超了挡住新增 */
export const MAX_NODES = 500;

// ---------- 线上文案 ----------

export const GROUP_TEXT = {
  newGroup: '新建组',
  execute: '整组执行',
  cancel: '取消',
  cancelling: '取消中',
  saveWorkflow: '保存工作流',
  ungroup: '解组',
  layout: '布局',
  download: '下载',
  group: '打组',
  addToChat: '添加到对话',
  copy: '复制',
  copied: '节点已复制',
  arrangeInvalid: '当前选择无法排列，请稍后重试',
  tidy: '整理画布',
  tidyConfirm: '是否保留此次整理结果？',
  nodeLimit: (max: number) => `为保证画布体验最大支持添加${max}个节点`,
  // 保存工作流（线上 create-workflow-popover）
  createTab: '创建新工作流',
  updateTab: '更新历史工作流',
  defaultWorkflowName: '新建工作流',
  namePlaceholder: '请输入工作流名称',
  nameLabel: '名称',
  upload: '上传',
  nameRequired: '请输入工作流名称',
  emptyGroupCreate: '当前组内暂无可创建的节点',
  emptyGroupUpdate: '当前组内暂无可更新的节点',
  pickHistory: '请选择一个历史工作流',
  noHistory: '暂无历史工作流',
  created: '创建工作流成功',
  createFailed: '创建工作流失败',
  updated: '更新历史工作流成功',
  updateFailed: '更新历史工作流失败',
} as const;
