import { ApiError, request } from './api';
import { kindOf, scriptOf, pickScript, type Beat, type ScriptGenerate } from './agent-scripts';
import { db } from './db';
import { demo } from './demo';
import { uid } from './store';
import { submitTask } from './tasks';
import { agentCreateNode, executeNode, getDoc, nodeCost } from './canvas-doc';
import type { AgentBlock, AgentTurn, AgentUserMessage } from './types';

/*
  Agent 的假后端：发消息 → 按带的素材挑一组、组里随机挑一个剧本（agent-scripts.ts） → 一步步播（思考、逐字说话、工具调用一行行出、生成、等结果）。
  生成走 submitTask，和普通生成同一套（扣费、倒计时、失败退回、结果进素材）。
  播放进度存在 db 里，刷新后接着播。页面只调 sendAgent / stopAgent / regenerateAgent。
*/

/** 思考多久、工具调用每行隔多久、每 tick 出几个字 */
const THINK_MS = 1600;
const TOOL_MS = 700;
const TICK_MS = 50;
const CHARS_PER_TICK = 2;

const fill = (text: string, t: AgentTurn) =>
  text
    .replace('{prompt}', t.user.text.length > 20 ? `${t.user.text.slice(0, 20)}…` : t.user.text || '这个需求')
    .replace('{refs}', t.user.refs.length ? `参考了 ${t.user.refs.length} 个素材，` : '');

const patchTurn = (id: string, fn: (t: AgentTurn) => AgentTurn) =>
  db.set((s) => ({ ...s, agentTurns: s.agentTurns.map((t) => (t.id === id ? fn(t) : t)) }));

const lastBlock = (t: AgentTurn) => t.blocks[t.blocks.length - 1];
const replaceLast = (t: AgentTurn, b: AgentBlock): AgentTurn => ({ ...t, blocks: [...t.blocks.slice(0, -1), b] });
const next = (t: AgentTurn, now: number): AgentTurn => ({ ...t, step: t.step + 1, beatAt: now });

/** 往前走一小步：返回新的这一轮（没变化返回原对象） */
function advance(t: AgentTurn, now: number): AgentTurn {
  const beats = scriptOf(t.script).beats;
  const beat: Beat | undefined = beats[t.step];
  if (!beat) return { ...t, status: 'done' };
  const last = lastBlock(t);

  if ('think' in beat) {
    if (last?.kind !== 'thinking' || last.done) {
      if (demo.get().offline) return fail(t);
      return { ...t, beatAt: now, blocks: [...t.blocks, { kind: 'thinking', text: fill(beat.think, t), done: false }] };
    }
    return now - t.beatAt >= THINK_MS ? next(replaceLast(t, { ...last, done: true }), now) : t;
  }
  if ('say' in beat) {
    const text = fill(beat.say, t);
    if (last?.kind !== 'text' || last.text !== text) return { ...t, beatAt: now, blocks: [...t.blocks, { kind: 'text', text, shown: 0 }] };
    if (last.shown >= text.length) return next(t, now);
    return replaceLast(t, { ...last, shown: Math.min(text.length, last.shown + CHARS_PER_TICK) });
  }
  if ('tools' in beat) {
    if (last?.kind !== 'tools' || last.done) {
      if (demo.get().offline) return fail(t);
      return { ...t, beatAt: now, blocks: [...t.blocks, { kind: 'tools', steps: beat.tools, shown: 1, done: false }] };
    }
    if (now - t.beatAt < TOOL_MS) return t;
    if (last.shown < last.steps.length) return { ...replaceLast(t, { ...last, shown: last.shown + 1 }), beatAt: now };
    return next(replaceLast(t, { ...last, done: true }), now);
  }
  if ('generate' in beat) {
    if (t.canvas) return canvasGenerate(t, beat.generate, now);
    // 创作页不出确认卡，到这一步直接提交生成（11-18 用户定）；提交完等结果出来再往下走
    if (last?.kind !== 'task') {
      if (!submitting.has(t.id)) void startGenerate(t.id, beat.generate);
      return t;
    }
    return afterTask(t, last.taskId, now);
  }
  return t;
}

/**
 * 等生成结果：还在跑就等；成功往下播；失败、取消就结束这一轮，出错误卡，不再播「生成好了」（11-20 修 R-8）
 */
function afterTask(t: AgentTurn, taskId: string, now: number): AgentTurn {
  const task = db.get().tasks.find((x) => x.id === taskId);
  if (task?.status === 'running') return t;
  if (task?.status === 'failed' || task?.status === 'cancelled') {
    const text = task.status === 'failed' ? '生成失败，消耗猕猴桃已退回' : '生成已取消';
    return { ...t, status: 'failed', blocks: [...t.blocks, { kind: 'error', text }] };
  }
  return next(t, now);
}

/**
 * 画布里的生成（照线上画布 Agent）：先在画布上建节点（带上用户添加到对话的节点当上游），
 * 手动模式出确认卡「是否确认 N 个节点生成?」等用户点，自动模式直接执行；执行完等结果出来再往下走。取消就结束这一轮
 */
function canvasGenerate(t: AgentTurn, g: ScriptGenerate, now: number): AgentTurn {
  const { canvasId, mode } = t.canvas!;
  // 正在提交执行：等它把结果块挂上来
  if (submitting.has(t.id)) return t;
  const last = lastBlock(t);
  // 已经在等结果
  if (last?.kind === 'task') return afterTask(t, last.taskId, now);
  if (last?.kind === 'confirm') {
    if (last.answer === 'cancelled') return { ...t, status: 'done' };
    if (last.answer !== 'approved') return t.status === 'waiting' ? t : { ...t, status: 'waiting' };
    void startCanvasRun(t.id, canvasId, last.nodeIds);
    return t;
  }
  // 第一次走到这：建节点，出一行工具调用
  const sources = t.user.refs.map((r) => r.nodeId).filter((id): id is string => !!id && !!getDoc(canvasId).nodes.find((n) => n.id === id));
  const node = agentCreateNode(canvasId, { ...g, prompt: t.user.text }, sources);
  const steps = [{ icon: 'UseCanvas', action: '创建节点', object: node.name }, ...(sources.length ? [{ icon: 'UseCanvas', action: '节点连线', object: `${sources.length} 个节点 → ${node.name}` }] : [])];
  const withTools: AgentTurn = { ...t, beatAt: now, blocks: [...t.blocks, { kind: 'tools', steps, shown: steps.length, done: true }] };
  if (mode === 'manual') return { ...withTools, status: 'waiting', blocks: [...withTools.blocks, { kind: 'confirm', nodeIds: [node.id], cost: nodeCost(node) }] };
  void startCanvasRun(t.id, canvasId, [node.id]);
  return withTools;
}

/** 执行画布节点，结果挂进这一轮（每个节点一个 task 块）。余额不足、断网就在这一轮里出错误卡 */
async function startCanvasRun(turnId: string, canvasId: string, nodeIds: string[]) {
  if (submitting.has(turnId)) return;
  submitting.add(turnId);
  try {
    for (const id of nodeIds) await executeNode(canvasId, id);
    const taskIds = nodeIds.map((id) => getDoc(canvasId).nodes.find((n) => n.id === id)?.taskId).filter((x): x is string => !!x);
    // 一个任务都没挂上（比如确认前节点被删了）：结束这一轮，不然确认卡一直是最后一块，会反复执行
    if (!taskIds.length) throw new Error('no-task');
    patchTurn(turnId, (x) => (x.status === 'running' ? { ...x, beatAt: Date.now(), blocks: [...x.blocks, ...taskIds.map((taskId) => ({ kind: 'task' as const, taskId }))] } : x));
  } catch (e) {
    const text =
      e instanceof ApiError && e.code === 'balance'
        ? '猕猴桃余额不足，这次没有生成'
        : e instanceof ApiError
          ? e.message
          : e instanceof Error && e.message === 'no-task'
            ? '要生成的节点已经不在画布上，这次没有生成'
            : '生成确认提交失败，请重新发起生成';
    patchTurn(turnId, (x) => (x.status === 'running' ? { ...x, status: 'failed', blocks: [...x.blocks, { kind: 'error', text }] } : x));
  } finally {
    submitting.delete(turnId);
  }
  tick();
}

/** 画布手动模式：确认卡上点了「确认生成」/「取消」 */
export function answerConfirm(turnId: string, approved: boolean) {
  patchTurn(turnId, (x) => {
    const last = lastBlock(x);
    if (x.status !== 'waiting' || last?.kind !== 'confirm') return x;
    return { ...replaceLast(x, { ...last, answer: approved ? 'approved' : 'cancelled' }), status: 'running', beatAt: Date.now() };
  });
  tick();
}

function fail(t: AgentTurn): AgentTurn {
  return { ...t, status: 'failed', blocks: [...t.blocks, { kind: 'error', text: '网络连接失败，请检查网络后重试' }] };
}

/** 正在提交生成的那几轮，免得每个 tick 重复提交 */
const submitting = new Set<string>();

/** 扣费、提交任务，结果挂进这一轮。余额不足、断网就在这一轮里出错误卡，这一轮结束 */
async function startGenerate(turnId: string, g: ScriptGenerate) {
  const t = db.get().agentTurns.find((x) => x.id === turnId);
  if (!t) return;
  submitting.add(turnId);
  try {
    const task = await submitTask({
      kind: 'gen',
      media: g.media,
      where: { page: 'create', chatId: t.chatId },
      prompt: t.user.text,
      model: g.model,
      params: g.params,
      refs: t.user.refs.flatMap((r) => (r.type === 'file' ? [] : [{ type: r.type, src: r.src }])),
      ratio: g.ratio,
      count: g.count,
      cost: g.unitCost * g.count,
    });
    patchTurn(turnId, (x) => (x.status === 'running' ? { ...x, beatAt: Date.now(), blocks: [...x.blocks, { kind: 'task', taskId: task.id }] } : x));
  } catch (e) {
    const text = e instanceof ApiError && e.code === 'balance' ? '猕猴桃余额不足，这次没有生成' : e instanceof ApiError ? e.message : '生成没有发起，请稍后再试';
    patchTurn(turnId, (x) => (x.status === 'running' ? { ...x, status: 'failed', blocks: [...x.blocks, { kind: 'error', text }] } : x));
  } finally {
    submitting.delete(turnId);
  }
  tick();
}

// ---------- 计时：有回复中的才转 ----------

let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  const now = Date.now();
  const turns = db.get().agentTurns;
  if (turns.some((t) => t.status === 'running')) {
    let changed = false;
    const nextTurns = turns.map((t) => {
      if (t.status !== 'running') return t;
      const n = advance(t, now);
      if (n !== t) changed = true;
      return n;
    });
    if (changed) db.set((s) => ({ ...s, agentTurns: nextTurns }));
  }
  const running = db.get().agentTurns.some((t) => t.status === 'running');
  if (running && !timer) timer = setInterval(tick, TICK_MS);
  if (!running && timer) {
    clearInterval(timer);
    timer = undefined;
  }
}
if (typeof window !== 'undefined') tick();

// ---------- 动作 ----------

/** 发一条消息给 Agent：对话里多一轮，开始播剧本。断网会抛错 */
export function sendAgent(chatId: string, user: AgentUserMessage, canvas?: AgentTurn['canvas']): Promise<AgentTurn> {
  return request(() => {
    const now = Date.now();
    const turn: AgentTurn = { id: uid('ag'), chatId, user, script: pickScript(kindOf(user.refs)), step: 0, beatAt: now, status: 'running', blocks: [], createdAt: now, canvas };
    db.set((s) => ({
      ...s,
      agentTurns: [...s.agentTurns, turn],
      chats: s.chats.map((c) => (c.id === chatId ? { ...c, updatedAt: now, items: [...c.items, { kind: 'agent', id: turn.id }] } : c)),
      // 画布对话：第一句话当标题
      canvasChats: s.canvasChats.map((c) => (c.id === chatId ? { ...c, updatedAt: now, title: c.title === NEW_CHAT ? user.text.slice(0, 20) || NEW_CHAT : c.title } : c)),
    }));
    tick();
    return turn;
  });
}

/** 画布对话的默认标题 */
export const NEW_CHAT = '新对话';

/** 画布右侧 Agent 新开一条对话 */
export function newCanvasChat(canvasId: string): string {
  const chat = { id: uid('cc'), canvasId, title: NEW_CHAT, updatedAt: Date.now() };
  db.set((s) => ({ ...s, canvasChats: [chat, ...s.canvasChats] }));
  return chat.id;
}

/** 停止：停在当前进度，已经出来的内容留着（照线上） */
export function stopAgent(turnId: string) {
  patchTurn(turnId, (x) => {
    if (x.status !== 'running' && x.status !== 'waiting') return x;
    const blocks = x.blocks.map((b): AgentBlock => {
      if (b.kind === 'thinking' && !b.done) return { ...b, done: true };
      if (b.kind === 'tools' && !b.done) return { ...b, done: true };
      return b;
    });
    return { ...x, status: 'stopped', blocks };
  });
}

/** 重新生成：同一条用户消息，同一组里换一个剧本从头播 */
export function regenerateAgent(turnId: string) {
  return request(() => {
    patchTurn(turnId, (x) => ({ ...x, script: pickScript(scriptOf(x.script).kind, x.script), step: 0, beatAt: Date.now(), status: 'running', blocks: [] }));
    tick();
  });
}

/** 这个对话里正在回复的那一轮 */
export const activeTurnOf = (turns: AgentTurn[], chatId: string) => turns.find((t) => t.chatId === chatId && (t.status === 'running' || t.status === 'waiting'));
