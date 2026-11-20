import { useRef } from 'react';
import { AddTile, AttachmentStrip, GenerateButton, type AttachmentItem } from '@kivi';
import { addFileNodes, connect, disconnectPair, setToolParams, upstreamOf } from '../../data/canvas-doc';
import { runToolNode, secondsOf } from '../../data/canvas-tools';
import { toolOf, type ToolId } from '../../data/tools';
import type { CanvasDoc, CanvasNode } from '../../data/types';
import { attempt } from '../../flows/errors';
import { toolCost, toolParams } from '../../parts/tool-workbench/options';
import { ToolPanel } from '../../parts/tool-workbench/panels';
import { INITIAL_STATE, type ToolState } from '../../parts/tool-workbench/types';
import './node-tools.css';

/*
  工具节点下面的参数面板（照线上 video-loop-panel、video-enhancement-panel、video-stitch-panel、video-remove-bg-panel、image-enhancement-panel）：
  最上面是连进来的素材条（原视频 / 原图，拼接能再传一段），下面是这个工具的参数和生成按钮，和 AI 工具页同一套（parts/tool-workbench/panels.tsx）。
  参数记在节点自己身上（node.params），选中别的再选回来还在。
*/

/** 有参数面板的工具：别的（扩图、重绘、元素去除、编辑文字、裁剪）是弹窗里编辑完直接执行 */
export const PANEL_TOOLS: ToolId[] = ['cutout', 'hd', 'loop', 'video-hd', 'video-cutout', 'stitch'];

/** 拼接最多接几段视频（照线上 video 输入上限） */
const STITCH_MAX = 10;

export function toolStateOf(node: CanvasNode): ToolState {
  const p = node.params ?? {};
  return { ...INITIAL_STATE, ...p, fps: p.fps ? Number(p.fps) : INITIAL_STATE.fps } as ToolState;
}

export interface NodeToolPanelProps {
  canvasId: string;
  doc: CanvasDoc;
  node: CanvasNode;
  /** 生成中或上传中：生成按钮置灰 */
  busy: boolean;
}

export function NodeToolPanel({ canvasId, doc, node, busy }: NodeToolPanelProps) {
  const tool = node.tool as ToolId;
  const st = toolStateOf(node);
  const fileRef = useRef<HTMLInputElement>(null);
  const ups = upstreamOf(doc, node.id).filter((n) => (n.type === 'image' || n.type === 'video') && n.items?.[0]);
  const items: AttachmentItem[] = ups.map((n) => ({ id: n.id, type: n.type as 'image' | 'video', name: n.name, src: n.items![0].poster ?? (n.type === 'video' ? undefined : n.items![0].src), duration: n.items![0].duration }));
  const stitching = tool === 'stitch';
  const duration = secondsOf(ups[0]?.items?.[0].duration);
  const ctx = { duration };
  const cost = toolCost(tool, st, ctx);

  const reason = busy
    ? '生成中，请稍候'
    : stitching && ups.length < 2
      ? '请上传两段视频'
      : !ups.length
        ? node.type === 'video'
          ? '请先上传视频'
          : '请先上传图片'
        : undefined;

  const generate = () =>
    attempt(() => runToolNode(canvasId, node.id, { tool, label: toolOf(tool).name, params: toolParams(tool, st, ctx), cost, echo: true }));

  // 拼接再传一段：新建一个视频素材节点放在左边，连进来（照线上 usePrefixMediaUpload）
  const takeFile = async (f: File) => {
    if (!f.type.startsWith('video')) return;
    const [id] = await addFileNodes(canvasId, [f], { x: node.x - 400, y: node.y + items.length * 40 }, 0);
    if (id) connect(canvasId, id, node.id);
  };

  const lead = (
    <div className="app-toolstrip">
      {items.length > 0 && <AttachmentStrip items={items} aria-label="素材" onRemove={(id) => disconnectPair(canvasId, id, node.id)} />}
      {stitching && ups.length < STITCH_MAX && <AddTile variant="outline" label="上传" aria-label="上传视频" onClick={() => fileRef.current?.click()} />}
      {stitching && <input ref={fileRef} type="file" hidden accept="video/*" onChange={(e) => (e.target.files?.[0] && void takeFile(e.target.files[0]), (e.target.value = ''))} />}
    </div>
  );

  return (
    <ToolPanel
      tool={tool}
      st={st}
      set={(k, v) => setToolParams(canvasId, node.id, { [k]: String(v) })}
      gen={<GenerateButton cost={cost} disabledReason={reason} onClick={generate} />}
      promptKey={tool}
      prompt=""
      setPrompt={() => undefined}
      pickExpandRatio={() => undefined}
      pickExpandScale={() => undefined}
      lead={lead}
    />
  );
}
