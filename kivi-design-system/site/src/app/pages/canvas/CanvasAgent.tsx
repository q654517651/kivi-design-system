import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type Ref } from 'react';
import {
  ActionCard,
  Button,
  Dropdown,
  GeneratingDots,
  IconButton,
  Kimo,
  MediaGroup,
  Menu,
  MenuItem,
  ScrollArea,
  Select,
  Tooltip,
  type AttachmentItem,
  type GeneratingType,
} from '@kivi';
import { NEW_CHAT, activeTurnOf, answerConfirm, newCanvasChat, sendAgent, stopAgent } from '../../data/agent';
import { getDoc, onAgentSelect } from '../../data/canvas-doc';
import { db, useDB } from '../../data/db';
import type { AgentTurn as AgentTurnData, Task } from '../../data/types';
import { attempt } from '../../flows/errors';
import { isMediaNode } from '../../rules/canvas';
import { AgentComposer, type AgentComposerHandle, type AgentComposerMessage } from '../../parts/agent-composer';
import { AgentTurn } from '../create/AgentTurn';

/*
  画布右侧 Agent（照线上 ChatPanel，记录在 page-notes/canvas-rewrite-2026-11-18.md）：
  - 侧栏默认宽 500，左边缘拖 360–720；收起时面板往右收走（宽度过渡，画布跟着变宽）；新对话时 Kimo 从面板里飞到右下角缩成 90，已经在聊时小 Kimo 从右边滑进来；点了展开反着来。
  - 一块画布几条对话：头上是对话名（点了切历史对话）、新对话、收起。没有对话自动新建。空态是 Kimo（160，待机：悬浮呼吸、眨眼）+「今天一起创作点什么？」，在对话区上下居中。
  - 对话引擎和主站同一个（data/agent.ts），产出落在画布上：Agent 建节点、连线、执行。
    手动模式（默认）生成前确认卡「是否确认 N 个节点生成?」换掉输入框，自动模式直接生成。
  - 结果在对话里是缩略图组，点了画布定位到那个节点。「添加到对话」的节点进输入框附件条，发出去时当上游连到新节点。
*/

const WIDTH = { min: 360, max: 720, base: 500 };
/** 发过的开场消息（开发模式 effect 跑两遍也只发一次） */
const sentIntros = new WeakSet<AgentComposerMessage>();
/** 离底多少以内算「在底部」，回复变长时跟着滚 */
const FOLLOW_GAP = 80;

export interface CanvasAgentProps {
  canvasId: string;
  /** 探索页技能「使用」进来：输入框带着这个技能 */
  skill?: string;
  /** 结果缩略图点了：画布定位到这些节点 */
  onLocate: (nodeIds: string[]) => void;
  /** 进来就发的一句话（创作首页「画布」输入框里发的） */
  intro?: AgentComposerMessage;
  /** 「添加到对话」的节点（父组件往这里加） */
  attachments: AttachmentItem[];
  onAttachmentsChange: (attachments: AttachmentItem[]) => void;
  /** 输入框的句柄：框选标注往里插胶囊、直接发 */
  composerRef?: Ref<AgentComposerHandle>;
}

export function CanvasAgent({ canvasId, skill, intro, onLocate, attachments, onAttachmentsChange, composerRef }: CanvasAgentProps) {
  const allChats = useDB((s) => s.canvasChats);
  const turns = useDB((s) => s.agentTurns);
  const tasks = useDB((s) => s.tasks);
  const assets = useDB((s) => s.assets);
  const chats = useMemo(() => allChats.filter((c) => c.canvasId === canvasId).sort((a, b) => b.updatedAt - a.updatedAt), [allChats, canvasId]);
  // 当前对话：进来是最近的一条；没有就新建一条（在 effect 里建，开发模式 effect 跑两遍也只建一条）
  const [picked, setChatId] = useState<string | undefined>(chats[0]?.id);
  useEffect(() => {
    if (picked || db.get().canvasChats.some((c) => c.canvasId === canvasId)) return;
    setChatId(newCanvasChat(canvasId));
  }, [canvasId, picked]);
  const chatId = picked ?? chats[0]?.id ?? '';
  const chat = chats.find((c) => c.id === chatId);
  const chatTurns = useMemo(() => turns.filter((t) => t.chatId === chatId), [turns, chatId]);
  const active = activeTurnOf(turns, chatId);
  const waiting = active?.status === 'waiting' ? active : undefined;
  const pending = waiting?.blocks[waiting.blocks.length - 1];

  const [width, setWidth] = useState(WIDTH.base);
  const [resizing, setResizing] = useState(false);
  // 收起 / 展开（照原站「悬浮宠物」）：面板宽度过渡到 0、往右收走（画布跟着变宽，底部工具栏跟着挪），
  // Kimo 从面板里飞到右下角缩成 90；展开时面板滑回来，小 Kimo 飞回原位再换成面板里那个
  const [collapsed, setCollapsed] = useState(false);
  const [petFrom, setPetFrom] = useState<DOMRect | null>(null);
  const [petLeaving, setPetLeaving] = useState(false);
  const emptyKimo = useRef<HTMLDivElement>(null);
  /** 收起前面板里 Kimo 的位置：展开时小 Kimo 飞回这里 */
  const homeRect = useRef<DOMRect | null>(null);
  const collapse = () => {
    // 新对话（面板里有 Kimo）：Kimo 从原位飞到右下角；已经在聊了（面板里没有 Kimo）：面板照常右收，小 Kimo 从右边滑进来
    const home = emptyKimo.current?.getBoundingClientRect() ?? null;
    homeRect.current = home;
    setPetFrom(home);
    setCollapsed(true);
  };
  const expand = () => {
    setPetLeaving(true);
    setCollapsed(false);
  };
  const petShown = collapsed || petLeaving;

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  // 换对话、发了新消息：滚到底
  const stream = useRef<HTMLDivElement>(null);
  const streamBody = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = stream.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatId, chatTurns.length]);
  // 回复往下长（逐字、思考、工具、出卡、出结果、图片加载完撑高）时跟着滚到底；用户往上翻了（离底超过 80）就不跟，同创作页（11-19 用户指出没跟着滚）
  useEffect(() => {
    const el = stream.current;
    const inner = streamBody.current;
    if (!el || !inner) return;
    let atBottom = true;
    const onScroll = () => {
      atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_GAP;
    };
    const ro = new ResizeObserver(() => {
      if (atBottom) el.scrollTop = el.scrollHeight;
    });
    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(inner);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);

  // 创作首页带进来的那句话：对话建好后发一次
  useEffect(() => {
    if (!intro || !chatId || sentIntros.has(intro)) return;
    sentIntros.add(intro);
    send(intro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, intro]);

  const send = ({ text, attachments: atts, mode }: AgentComposerMessage) =>
    void attempt(() =>
      sendAgent(
        chatId,
        { text, refs: atts.map((a) => ({ type: a.type, src: a.video ?? a.src ?? '', name: a.name, duration: a.duration, nodeId: nodeIdOf(a) })) },
        { canvasId, mode },
      ),
    );

  // 左边缘拖宽度
  const startResize = (e: PointerEvent<HTMLDivElement>) => {
    const x0 = e.clientX;
    const w0 = width;
    setResizing(true);
    const move = (ev: globalThis.PointerEvent) => setWidth(Math.min(WIDTH.max, Math.max(WIDTH.min, w0 + x0 - ev.clientX)));
    const up = () => {
      setResizing(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const renderTask = (task: Task) => {
    const nodeId = task.where.page === 'canvas' ? task.where.nodeId : undefined;
    const name = getDoc(canvasId).nodes.find((n) => n.id === nodeId)?.name;
    // 生成中也是这一组（照线上 GenerationCardGroup）：每张一格生成中点阵，标题「图片生成中 ×N」，生成完停 1 秒自己收起
    const items = task.outputs.map((o, i) => {
      const a = o.assetId ? assetMap.get(o.assetId) : undefined;
      const status = o.status === 'running' ? ('generating' as const) : o.status === 'failed' ? ('failed' as const) : ('done' as const);
      return { id: `${task.id}-${i}`, src: a?.poster ?? a?.src, ratio: task.ratio, status, name };
    });
    if (task.media === 'text' || task.media === 'audio') {
      // 文字、音频生成中：一格生成中点阵（没有结果组）
      if (task.status === 'running')
        return (
          <div className="tpl-ca__generating" style={{ aspectRatio: task.ratio.replace(':', ' / ') }} aria-label="生成中">
            <GeneratingDots type={task.media as GeneratingType} />
          </div>
        );
      // 文字、音频没有缩略图：一行按钮定位到节点
      return (
        <Button variant="secondary-muted" leftIcon={task.media === 'text' ? 'Text' : 'Audio'} onClick={() => nodeId && onLocate([nodeId])}>
          {task.status === 'failed' ? '生成失败' : '定位到画布节点'}
        </Button>
      );
    }
    return <MediaGroup type={task.media} items={items} onItemClick={() => nodeId && onLocate([nodeId])} />;
  };

  return (
    <>
    {/* 外层管宽度过渡和裁切，里层固定宽：收起时里面的内容整块往右滑出去，不挤扁 */}
    <div className="tpl-ca" data-collapsed={collapsed || undefined} data-resizing={resizing || undefined} style={{ width: collapsed ? 0 : width }} aria-hidden={collapsed || undefined} {...(collapsed ? { inert: '' } : {})}>
    <aside className="tpl-cv__agent tpl-ca__panel" aria-label="Agent" style={{ width }}>
      <div className="tpl-ca__resize" onPointerDown={startResize} aria-hidden />
      <div className="tpl-cv__head">
        <Dropdown
          haspopup="listbox"
          trigger={
            <Select variant="plain" className="tpl-ca__title" aria-label="切换对话">
              {chat?.title ?? NEW_CHAT}
            </Select>
          }
        >
          <Menu role="listbox" width={280} aria-label="历史对话">
            {chats.map((c) => (
              <MenuItem key={c.id} selected={c.id === chatId} onClick={() => setChatId(c.id)}>
                {c.title}
              </MenuItem>
            ))}
          </Menu>
        </Dropdown>
        <span className="tpl-ca__head-actions">
          <IconButton icon="Add" label="新对话" variant="ghost" onClick={() => setChatId(newCanvasChat(canvasId))} />
          <IconButton icon="Fold" label="收起" variant="ghost" onClick={collapse} />
        </span>
      </div>

      <ScrollArea className="tpl-cv__stream" viewportRef={stream}>
        <div ref={streamBody} className="tpl-cv__stream-body" data-empty={chatTurns.length === 0 || undefined}>
          {chatTurns.length === 0 ? (
            <div className="tpl-ca__empty">
              {/* 小 Kimo 在外面飞的时候，面板里这个先藏着，免得出现两个 */}
              <Kimo ref={emptyKimo} size={160} style={{ visibility: petShown ? 'hidden' : undefined }} />
              <span>今天一起创作点什么？</span>
            </div>
          ) : (
            chatTurns.map((t: AgentTurnData) => <AgentTurn key={t.id} turn={t} tasks={taskMap} assets={assetMap} renderTask={renderTask} regenerate={false} />)
          )}
        </div>
      </ScrollArea>

      {/* 手动模式：生成前的确认卡换掉输入框（照线上 GenerateConfirmPanel，两个不同时出现）；输入框藏起来不卸载，写了一半的字还在 */}
      {waiting && pending?.kind === 'confirm' && (
        <ActionCard
          className="tpl-ca__confirm"
          title={`是否确认${pending.nodeIds.length}个节点生成?`}
          description={
            <>
              {pending.cost > 0 && `预计消耗 ${pending.cost}猕猴桃 · `}
              <a className="kv-action-card__link" href="#" onClick={(e) => (e.preventDefault(), onLocate(pending.nodeIds))}>
                点击查看节点参数
              </a>
            </>
          }
          actions={
            <>
              <Button variant="secondary" onClick={() => answerConfirm(waiting.id, false)}>
                取消
              </Button>
              <Button variant="primary" onClick={() => answerConfirm(waiting.id, true)}>
                确认生成
              </Button>
            </>
          }
        />
      )}

      <div className="tpl-ca__composer-slot" hidden={!!(waiting && pending?.kind === 'confirm')}>
        <AgentComposer
          skill={skill}
          attachments={attachments}
          onAttachmentsChange={onAttachmentsChange}
          generating={!!active}
          onStop={() => active && stopAgent(active.id)}
          onSend={send}
          handleRef={composerRef}
        />
      </div>
    </aside>
    </div>
    {petShown && (
      <KimoPet
        from={petFrom}
        leaving={petLeaving}
        leaveTo={chatTurns.length === 0 ? homeRect.current : null}
        onLeft={() => setPetLeaving(false)}
        onClick={expand}
      />
    )}
    </>
  );
}

/** 两个框之间的 FLIP：从 from 看起来到 to 的位置要加的变换（按中心对齐、按宽度缩放） */
const flip = (from: DOMRect, to: DOMRect) =>
  `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${from.width / to.width})`;
const FLY_MS = 400;

/**
 * 收起后右下角的小 Kimo（照原站悬浮宠物，90）。400ms ease-in-out，和面板收起同时长：
 * - 新对话：出现时从面板里 Kimo 的位置飞过来，展开时飞回去；
 * - 已经在聊（面板里没有 Kimo）：从画布右边滑进来，展开时滑回右边出去。
 */
function KimoPet({ from, leaving, leaveTo, onLeft, onClick }: { from: DOMRect | null; leaving: boolean; leaveTo: DOMRect | null; onLeft: () => void; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  /** 滑到画布右边外面：自己的宽度 + 离右边的 32 */
  const offRight = (el: HTMLElement) => `translateX(${el.offsetWidth + 32}px)`;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.transform = from ? flip(from, el.getBoundingClientRect()) : offRight(el);
    void el.offsetWidth;
    el.style.transition = '';
    el.style.transform = '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !leaving) return;
    el.style.transform = leaveTo ? flip(leaveTo, el.getBoundingClientRect()) : offRight(el);
    const t = window.setTimeout(onLeft, FLY_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);
  return (
    // 定位写在 Tooltip 的外壳上：外壳是画布页网格的直接子元素，不脱离文档流会多撑出一行，把画布挤到上半截（11-20 修）
    <Tooltip content="展开对话面板" placement="top" disabled={leaving} className="tpl-ca__pet-anchor">
      <button ref={ref} type="button" className="tpl-ca__pet" aria-label="展开对话面板" disabled={leaving} onClick={onClick}>
        <Kimo size={90} shadow={false} />
      </button>
    </Tooltip>
  );
}

/** 画布节点 → 输入框附件（「添加到对话」）：记着节点 id，发出去时当上游 */
export function nodeAttachment(canvasId: string, nodeId: string): AttachmentItem | undefined {
  const n = getDoc(canvasId).nodes.find((x) => x.id === nodeId);
  if (!n || !isMediaNode(n)) return undefined;
  const item = n.items?.[0];
  return { id: `${NODE_PREFIX}${n.id}`, type: n.type === 'text' ? 'file' : n.type, name: n.name, src: item?.poster ?? (n.type === 'video' ? undefined : item?.src), duration: item?.duration, ext: n.type === 'text' ? 'TXT' : undefined };
}

/** 附件的 id 是「node-节点 id」就是画布节点 */
const NODE_PREFIX = 'node-';
const nodeIdOf = (a: AttachmentItem) => (a.id.startsWith(NODE_PREFIX) ? a.id.slice(NODE_PREFIX.length) : undefined);

export { onAgentSelect };
export const useAgentSelect = (canvasId: string, select: (ids: string[]) => void) => {
  const latest = useRef(select);
  latest.current = select;
  useEffect(() => {
    const off = onAgentSelect((id, ids) => {
      if (id === canvasId) latest.current(ids);
    });
    return () => {
      off();
    };
  }, [canvasId]);
};
