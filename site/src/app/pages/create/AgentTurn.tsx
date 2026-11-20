import { type ReactNode } from 'react';
import { ActionCard, AskRecord, MessageFeedback, ProcessGroup, ReferenceItem, ThinkingBlock, UserMessage, type IconName } from '@kivi';
import { regenerateAgent } from '../../data/agent';
import type { AgentTurn as AgentTurnData, Asset, Task } from '../../data/types';
import { attempt } from '../../flows/errors';
import { TaskGrid } from './GenRecordView';
import type { TileContext } from './tiles';

/*
  Agent 的一轮：用户消息（文字 + 带的素材）→ 回复的各块（思考、文字逐字出、工具调用、结果、确认、出错）→ 反馈条。
  内容全来自 data/agent.ts 播出来的数据，这里只画。主站的结果是普通任务，用和记录一样的结果格（收藏、删除、看大图都一样）；
  画布侧栏传 renderTask 换成缩略图组（点了定位节点）。画布手动模式的确认卡停在输入框上面（画布侧栏自己画），这里只留「已询问」记录。
*/

export interface AgentTurnProps {
  turn: AgentTurnData;
  tasks: Map<string, Task>;
  assets: Map<string, Asset>;
  /** 主站结果格的操作；传了 renderTask 可以不传 */
  ctx?: TileContext;
  /** 结果怎么画（画布侧栏：缩略图组，点了定位节点）；不传用主站的结果格 */
  renderTask?: (task: Task) => ReactNode;
  /** 反馈条里的「重新生成」，默认有。画布 Agent 照线上没有（11-19 用户指出） */
  regenerate?: boolean;
}

export function AgentTurn({ turn, tasks, assets, ctx, renderTask, regenerate = true }: AgentTurnProps) {
  const busy = turn.status === 'running' || turn.status === 'waiting';
  // 反馈条复制的是回复里所有文字
  const reply = turn.blocks
    .filter((b) => b.kind === 'text')
    .map((b) => (b.kind === 'text' ? b.text.slice(0, b.shown) : ''))
    .join('\n');

  return (
    <div className="tpl-turn">
      <UserMessage
        assets={
          turn.user.refs.length > 0 && (
            <>
              {turn.user.refs.map((r, i) => (
                <ReferenceItem key={i} type={r.type} src={r.type === 'audio' ? undefined : r.src} duration={r.duration} />
              ))}
            </>
          )
        }
      >
        {turn.user.text}
      </UserMessage>

      {turn.blocks.map((b, i) => {
        switch (b.kind) {
          case 'thinking':
            return (
              <ThinkingBlock key={i} thinking={!b.done}>
                {b.text}
              </ThinkingBlock>
            );
          case 'text':
            return (
              <div key={i} className="tpl-text">
                {b.text.slice(0, b.shown)}
              </div>
            );
          case 'tools':
            return (
              <ProcessGroup
                key={i}
                running={!b.done}
                steps={b.steps.slice(0, b.shown).map((s, k) => ({
                  id: `${turn.id}-${i}-${k}`,
                  icon: s.icon as IconName,
                  action: s.action,
                  object: s.object,
                  status: !b.done && k === b.shown - 1 ? 'running' : 'done',
                }))}
              />
            );
          case 'task': {
            const task = tasks.get(b.taskId);
            if (!task || task.status === 'cancelled') return null;
            return renderTask ? <div key={i}>{renderTask(task)}</div> : ctx ? <TaskGrid key={i} task={task} assets={assets} ctx={ctx} /> : null;
          }
          case 'confirm':
            // 等确认时卡片在输入框上面；点过了在对话里留一条「已询问」（照线上：批准生成 / 取消生成）
            return b.answer ? (
              <AskRecord key={i} status="answered" items={[{ question: `是否确认${b.nodeIds.length}个节点生成?`, answer: b.answer === 'approved' ? '批准生成' : '取消生成' }]} />
            ) : (
              <AskRecord key={i} status="asking" items={[{ question: `是否确认${b.nodeIds.length}个节点生成?` }]} />
            );
          case 'error':
            return <ActionCard key={i} type="error" description={b.text} />;
          default:
            return null;
        }
      })}

      {/* 回复完、停止、出错后才出反馈条（照线上） */}
      {!busy && <MessageFeedback text={reply} traceId={`trace-${turn.id}`} onRegenerate={regenerate ? () => void attempt(() => regenerateAgent(turn.id)) : undefined} />}
    </div>
  );
}
