import type { IconName, ProcessStep } from '@kivi';

// Agent 调的工具在对话里怎么显示（11-02 用户定）。动作文字照后端 stream_event_message.go 的显示名。
// 「Agent 工具」页和 Agent 页的工具调用演示都用这一份，只写一处

export type AgentTool = Omit<ProcessStep, 'status'>;

/** 进工具调用组的：一种图标一组 */
export const TOOL_GROUPS: { name: string; icon: IconName; tools: AgentTool[] }[] = [
  {
    name: '改画布',
    icon: 'UseCanvas',
    tools: [
      { action: '输入节点', object: '活动文案' },
      { action: '节点连线', object: '活动文案 → 主视觉' },
      { action: '删除节点', object: '旧草稿' },
      { action: '删除节点连线', object: '旧草稿 → 主视觉' },
    ],
  },
  {
    name: '查看',
    icon: 'ScanEye',
    tools: [
      { action: '查看画布' },
      { action: '查看画布节点信息', object: '分镜脚本' },
      { action: '查看节点内容', object: '参考图' },
      { action: '查看链接内容', object: '产品演示.mp4' },
    ],
  },
  { name: '知识库', icon: 'SquareLibrary', tools: [{ action: '搜索知识库', object: '礼物等级' }] },
  { name: '记忆', icon: 'Brain', tools: [{ action: '更新记忆' }] },
  { name: '技能', icon: 'Skill', tools: [{ action: '加载技能', object: '运营活动主视觉' }] },
  { name: '外部工具', icon: 'Tool', tools: [{ action: '执行飞书命令', object: '读取活动排期表' }] },
];

/** 生成类不出工具行，只出结果块，按产出用图标 */
export const GEN_TOOLS: { icon: IconName; names: string }[] = [
  { icon: 'ImageGeneration', names: '图片生成节点、图片抠图、图片高清、图片裁切节点' },
  { icon: 'VideoGeneration', names: '视频生成节点、视频循环、视频高清、视频拼接节点、动作复刻、对口型' },
  { icon: 'Text', names: '文本生成节点' },
  { icon: 'Audio', names: '音频生成节点' },
];

/** 不显示的 */
export const HIDDEN_TOOLS = '读取技能详情、加载 lark-cli 技能、加载长期记忆、查看 / 读取会话记录、查看可用工具、提交执行计划、更新待办清单、置顶技能的模拟调用、取消后补的结果';

/** 一次典型的调用过程：Agent 一个接一个调的工具 */
export const TOOL_FLOW: AgentTool[] = [
  { icon: 'Skill', action: '加载技能', object: '运营活动主视觉' },
  { icon: 'ScanEye', action: '查看画布' },
  { icon: 'ScanEye', action: '查看节点内容', object: '参考图' },
  { icon: 'SquareLibrary', action: '搜索知识库', object: '礼物等级' },
  { icon: 'Tool', action: '执行飞书命令', object: '读取活动排期表' },
  { icon: 'ScanEye', action: '查看画布节点信息', object: '主视觉' },
  { icon: 'UseCanvas', action: '输入节点', object: '活动文案' },
  { icon: 'UseCanvas', action: '节点连线', object: '活动文案 → 主视觉' },
  { icon: 'Brain', action: '更新记忆' },
];

/** 每个工具调了多久（毫秒） */
export const TOOL_FLOW_MS = [300, 900, 1400, 700, 1600, 200, 150, 250, 400];
