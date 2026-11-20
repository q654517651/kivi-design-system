import type { LoraFieldItem, PlaceholderImageRatio } from '@kivi';

/*
  全站数据的形状。只放纯数据（能存进本机、能 JSON），不放 ReactNode：
  标签、图标这些由页面按数据画（比如任务的参数在页面里画成一排 Tag）。
*/

export type Media = 'image' | 'video' | 'audio';
/** 任务产出：素材（图、视频、音频），画布的文字节点还能生成文字 */
export type TaskMedia = Media | 'text';
export type Ratio = PlaceholderImageRatio;

/** 生成发生在哪：决定结果出现在哪一页 */
export type Where =
  | { page: 'create'; chatId: string }
  | { page: 'tools' }
  | { page: 'canvas'; canvasId: string; nodeId?: string };

/** 一次生成里的一格结果 */
export interface Output {
  status: 'running' | 'done' | 'failed';
  /** 成功后对应的素材 */
  assetId?: string;
  /** 文字任务的结果（画布文字节点），不进素材 */
  text?: string;
}

/** 一次生成任务（主站一条记录、工具页一条历史、画布一次节点生成） */
export interface Task {
  id: string;
  kind: 'gen' | 'tool';
  media: TaskMedia;
  where: Where;
  /** 提示词，工具任务没有 */
  prompt?: string;
  /** 模型 id（generation/options.ts 里的 value） */
  model?: string;
  /** 工具 id（data/tools.ts），kind = tool 时有 */
  tool?: string;
  /** 显示的名字：工具名、智能编辑的编辑方式；生成任务不写 */
  label?: string;
  /** 参数，按显示顺序：比如 { 分辨率: '2K', 比例: '1:1', 时长: '5s' } */
  params: Record<string, string>;
  /** 参考素材 / 原图（工具任务的第一项是原图） */
  refs: { type: Media; src: string; label?: string }[];
  /** 参考方式的名字，比如「全能参考」「首尾帧」，没有不写 */
  refLabel?: string;
  /** 参考方式的值（generation/options.ts 的 REF_MODES），视频生成才有；「重新编辑」回填用 */
  refMode?: string;
  ratio: Ratio;
  /** 每一格的结果 */
  outputs: Output[];
  cost: number;
  createdAt: number;
  /** 什么时候出结果 */
  dueAt: number;
  /** 假生成时结果直接用原图 refs[0]（抠图、高清这类，画面不变）；不写就按比例换一张占位图 */
  echo?: boolean;
  /** 演示用：一直停在生成中（种子数据里摆样子的） */
  hold?: boolean;
  /** hold 时角标上固定显示的剩余秒数（摆「59s 生成中」的样子），不写只显示「生成中」 */
  holdLeft?: number;
  /** 演示开关「下次生成失败」打开时提交的，到点失败 */
  willFail?: boolean;
  /** 整个任务的状态：生成中 / 完成（可能有几格失败） / 失败 / 取消 */
  status: 'running' | 'done' | 'failed' | 'cancelled';
  /** 失败文案 */
  error?: string;
}

/** 一个素材：生成出来的，或者上传的 */
export interface Asset {
  id: string;
  media: Media;
  src: string;
  /** 视频封面 */
  poster?: string;
  ratio: Ratio;
  /** 音频、视频时长，比如 '0:05' */
  duration?: string;
  name?: string;
  createdAt: number;
  /** 哪来的：会话（主站）/ 工具 / 画布 / 上传 */
  source: 'create' | 'tools' | 'canvas' | 'upload';
  /** 生成它的任务 */
  taskId?: string;
  collected: boolean;
  folderIds: string[];
  /** 本次上传的本地文件（blob 地址），不存进本机 */
  local?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

/** 主站对话里的一项：一次生成，或者一轮 Agent */
export type ChatItem = { kind: 'task'; taskId: string } | { kind: 'agent'; id: string };

export interface Chat {
  id: string;
  title: string;
  pinned?: boolean;
  updatedAt: number;
  items: ChatItem[];
}

/** 画布右侧 Agent 的一条对话 */
export interface CanvasChat {
  id: string;
  canvasId: string;
  title: string;
  updatedAt: number;
}

export interface CanvasMeta {
  id: string;
  name: string;
  updatedAt: number;
  /** 封面：最近几张结果 */
  covers: string[];
  pinned?: boolean;
}

// ---------- 画布里的东西（每块画布一份，存本机） ----------

/**
 * 节点类型。clip = 视频剪辑、pack = 视频封装（线上都是 processor 节点，按 action 分，这里拆成两个类型）；
 * archive = 封装产出的压缩包（只有结果）
 */
export type CanvasNodeType = 'text' | 'image' | 'video' | 'audio' | 'group' | 'clip' | 'pack' | 'archive';

/** 视频封装的四种类型（照线上 PackagerTemplateId） */
export type PackTemplate = 'badge' | 'vehicle' | 'background' | 'custom';

/** 视频封装节点里记的设置（弹窗里改的，节点记住） */
export interface PackConfig {
  template: PackTemplate;
  /** 资源名称，导出的压缩包用它命名 */
  name: string;
  /** 自定义：封装格式、帧率、质量（尺寸默认原视频大小） */
  format: 'mp4' | 'webp' | 'apng' | 'mp4-alpha';
  fps: number;
  quality: number;
  width?: number;
  height?: number;
  /** 礼物 / 座驾：素材背景开关、羽化开关和强度 */
  vehicleBg: boolean;
  feather: boolean;
  strength: number;
}

/** 视频剪辑节点里记的东西：素材在时间轴上的顺序（连进来的上游节点 id）、画布比例、帧率 */
export interface ClipConfig {
  order: string[];
  ratio: string;
  fps: number;
}

/** 节点里的一张结果 / 一个素材 */
export interface CanvasItem {
  src: string;
  /** 视频封面 */
  poster?: string;
  /** 音频、视频时长，比如 '0:05' */
  duration?: string;
  /** 对应的素材（生成出来的才有），收藏、删除跟着素材走 */
  assetId?: string;
}

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  /** 节点名（左上角），组是组名 */
  name: string;
  /** 世界坐标，左上角 */
  x: number;
  y: number;
  w: number;
  h: number;
  /** 图片、视频的比例 */
  ratio?: Ratio;
  /** 上传的素材节点：没有生成面板，右上「上传」换一个 */
  upload?: boolean;
  /** 结果（图片、视频、音频）；多张时节点里叠放，第一张在上面 */
  items?: CanvasItem[];
  /** 文字节点的内容 */
  text?: string;
  /** 生成面板里的提示词、模型、参数，节点记住自己的 */
  prompt?: string;
  model?: string;
  refMode?: string;
  params?: Record<string, string>;
  /** 张数（图片、视频，'1'–'4'） */
  count?: string;
  /** 挂的 Lora（模型支持 Lora 时生成面板里选的，带权重） */
  loras?: LoraFieldItem[];
  /** 最近一次生成的任务（data/tasks.ts）：生成中、失败从它读 */
  taskId?: string;
  /** 在哪个组里 */
  parentId?: string;
  /** 组的背景色（线上 6 种），不写是无 */
  color?: string;
  /** 工具节点（抠图、高清、循环…）：用的哪个工具（data/tools.ts 的 id，另有 text-edit、crop）。没有生成面板，只有这个工具自己的参数面板 */
  tool?: string;
  /** 预设：视频节点的一种。lip-sync = 对口型（只收视频 1、音频 1，没有提示词和模型，面板是音频 → 视频两个格子） */
  preset?: 'lip-sync';
  /** 结果节点：处理器（剪辑、封装）导出来的，没有生成面板、不接上游 */
  output?: boolean;
  /** 视频剪辑的设置（clip） */
  clip?: ClipConfig;
  /** 视频封装的设置（pack） */
  pack?: PackConfig;
  /** 压缩包（archive）：文件名；done 是导出完成了（任务出结果时写） */
  archive?: { fileName: string; done?: boolean };
}

/** 一条连线：上游 from 的右边连到下游 to 的左边；同一个下游按连接顺序排参考 */
export interface CanvasEdge {
  id: string;
  from: string;
  to: string;
}

export interface CanvasDoc {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  /** 上次的视角：平移和缩放 */
  view?: { x: number; y: number; k: number };
}

/** 一段节点和连线（工作流的内容）：坐标从 0 开始，应用时整段挪到视口中心 */
export interface WorkflowTemplate {
  nodes: CanvasNode[];
  edges: { from: string; to: string }[];
}

/** 画布底部「工作流」里的一个：官方的（演示数据）或我的（存本机） */
export interface Workflow {
  id: string;
  name: string;
  /** 封面（16:9），有视频就悬停播 */
  cover: string;
  video?: string;
  /** 官方工作流的分类 */
  category?: string;
  scope: 'public' | 'private';
  createdAt: number;
  template: WorkflowTemplate;
}

// ---------- Agent ----------

/** 用户发给 Agent 的一条消息 */
export interface AgentUserMessage {
  text: string;
  /** 带的素材（附件 / 参考），照发送时输入框里的顺序 */
  refs: { type: Media | 'file'; src: string; name?: string; duration?: string; nodeId?: string }[];
}

/** Agent 回复里的一块，按顺序画 */
export type AgentBlock =
  /** 思考：done 前展开、扫光，done 后自动收起 */
  | { kind: 'thinking'; text: string; done: boolean }
  /** 一段回复文字：shown 是已经打出来的字数（逐字出） */
  | { kind: 'text'; text: string; shown: number }
  /** 画布：生成前的确认（手动模式）：建好的节点、一共几张、消耗；answer 是用户点了什么（照线上 GenerateConfirmCard） */
  | { kind: 'confirm'; nodeIds: string[]; cost: number; answer?: 'approved' | 'cancelled' }
  /** 一组工具调用：shown 是已经出现的行数 */
  | { kind: 'tools'; steps: { icon: string; action: string; object?: string }[]; shown: number; done: boolean }
  /** 生成的结果：一个任务（走 submitTask，和普通生成一样进素材） */
  | { kind: 'task'; taskId: string }
  /** 出错 */
  | { kind: 'error'; text: string };

export interface AgentTurn {
  id: string;
  chatId: string;
  user: AgentUserMessage;
  /** 用的哪个剧本（data/agent-scripts.ts） */
  script: string;
  /** 剧本走到第几步 */
  step: number;
  /** 这一步什么时候开始的（思考、工具调用按时间走） */
  beatAt: number;
  /** 回复中 / 等用户确认（画布手动模式） / 完成 / 用户停止 / 出错 */
  status: 'running' | 'waiting' | 'done' | 'stopped' | 'failed';
  /** 画布里的 Agent：在哪块画布、手动（生成前确认）还是自动 */
  canvas?: { canvasId: string; mode: 'manual' | 'auto' };
  blocks: AgentBlock[];
  createdAt: number;
}

export interface DB {
  /** 猕猴桃余额 */
  balance: number;
  tasks: Task[];
  assets: Asset[];
  folders: Folder[];
  chats: Chat[];
  canvases: CanvasMeta[];
  /** 画布右侧 Agent 的对话（一块画布几条），对话的每一轮在 agentTurns 里（chatId 是这里的 id） */
  canvasChats: CanvasChat[];
  /** 每块画布里的节点和连线，key 是画布 id */
  canvasDocs: Record<string, CanvasDoc>;
  /** 我的工作流（画布底部「工作流」） */
  workflows: Workflow[];
  /** Agent 的每一轮（对话里 ChatItem kind = agent 指向它） */
  agentTurns: AgentTurn[];
  /** 探索页收藏的作品、技能、工作流 id */
  favorites: string[];
  /** 一次性的标记：新手引导看过没、余额提醒哪天弹过 */
  flags: Record<string, string | boolean>;
}
