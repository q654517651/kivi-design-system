import { useState, type ReactElement } from 'react';
import { Button, ButtonGroup, Dialog, Divider, IconButton, type IconName } from '@kivi';
import { addProcessorAfter } from '../../data/canvas-processor';
import { requestSelect } from '../../data/canvas-doc';
import { cropImage, spawnCropNode, spawnTextNode, spawnToolNode, toolSourceOf, type ToolRun } from '../../data/canvas-tools';
import { nearestRatio, ratioNum as ratioOf } from '../../data/mock';
import { toolOf, type ToolId } from '../../data/tools';
import type { CanvasNode } from '../../data/types';
import { attempt } from '../../flows/errors';
import { ToolWorkbench, type ToolJob } from '../../parts/tool-workbench';
import { toolCost, toolParams } from '../../parts/tool-workbench/options';
import { INITIAL_STATE } from '../../parts/tool-workbench/types';
import { AnnotateDialog, type AnnotationNote } from './AnnotateDialog';
import { CropDialog } from './CropDialog';
import { TEXT_EDIT_COST, TextEditDialog } from './TextEditDialog';

/*
  节点工具栏（照线上 nodes/image/components/topbar-content.tsx、nodes/video/components/topbar-content.tsx）。
  每个工具点了以后（逻辑在 data/canvas-tools.ts）：
  - 直接执行：图片抠图。右边建抠图节点，直接生成中。
  - 建节点出参数面板：图片高清、视频循环 / 高清 / 拼接 / 抠图。右边建一个空的工具节点并选中，下面出面板（NodeToolPanel），点生成才执行。
  - 弹窗里标注：框选（评论里「添加到对话」把这张图放进 Agent 输入框）。
  - 弹窗里编辑再执行：扩图、重绘、元素去除（和 AI 工具页同一套舞台和面板，ToolWorkbench）、编辑文字。线上是在画布上原地编辑。
  - 弹窗里裁剪：确认后右边出裁剪节点，不生成、不消耗。
  - 建文本节点：图推词、视频推词。右边建文本节点，带着线上的默认提示词，点生成才出词。
  - 封装、剪辑：右边建封装节点、剪辑节点并选中（data/canvas-processor.ts）。
*/

type Dialogs = 'expand' | 'inpaint' | 'remove' | 'crop' | 'text-edit' | 'annotate' | null;

export interface NodeToolbarProps {
  canvasId: string;
  node: CanvasNode;
  onDownload: () => void;
  onView: () => void;
  /** 框选的评论里点「添加到对话」：把这个节点加进 Agent 输入框 */
  onAddToChat?: (ids: string[], note?: AnnotationNote) => void;
}

type Tool = { icon: IconName; label: string; run: () => void };

export function NodeToolbar({ canvasId, node, onDownload, onView, onAddToChat }: NodeToolbarProps) {
  const src = toolSourceOf(node);
  const [dialog, setDialog] = useState<Dialogs>(null);
  if (!src) return null;

  // 一次执行要交出去的东西（直接执行的工具用默认参数）
  const runOf = (tool: ToolId, label?: string): ToolRun => ({
    tool,
    label: label ?? toolOf(tool).name,
    params: toolParams(tool, INITIAL_STATE, { duration: src.duration }),
    cost: toolCost(tool, INITIAL_STATE, { duration: src.duration }),
    ratio: src.ratio,
    echo: true,
    refs: [{ type: src.media, src: src.src }],
  });
  const exec = (tool: ToolId) => void attempt(() => spawnToolNode(canvasId, node, tool, runOf(tool)));
  const panel = (tool: ToolId) => void spawnToolNode(canvasId, node, tool);
  // 封装、剪辑：右边建处理器节点并选中（节点和弹窗在 data/canvas-processor.ts）
  const processor = (kind: 'pack' | 'clip') => {
    const id = addProcessorAfter(canvasId, node.id, kind);
    if (id) requestSelect(canvasId, [id]);
  };

  // 弹窗里点了生成：建节点、提交任务（余额不足不建）
  // 弹窗里点生成：请求回来再关（等的时候生成按钮转圈），失败留着能再点
  const submit = (job: ToolJob, name: string) =>
    attempt(() =>
      spawnToolNode(canvasId, node, name, {
        tool: job.tool,
        label: job.label,
        params: job.params ?? {},
        cost: job.cost ?? 0,
        ratio: nearestRatio(job.targetRatio),
        echo: job.tool !== 'expand' && job.tool !== 'edit',
        refs: [{ type: job.media, src: job.src }],
      }),
    ).then((n) => n && setDialog(null));

  const image: Tool[] = [
    { icon: 'Rmbg', label: '抠图', run: () => exec('cutout') },
    { icon: 'Crop', label: '裁剪', run: () => setDialog('crop') },
    { icon: 'Expand', label: '扩图', run: () => setDialog('expand') },
    { icon: 'HD', label: '高清', run: () => panel('hd') },
    { icon: 'SmartEditing', label: '重绘', run: () => setDialog('inpaint') },
    { icon: 'RemoveEle', label: '元素去除', run: () => setDialog('remove') },
    { icon: 'DragSelect', label: '框选', run: () => setDialog('annotate') },
    { icon: 'TextEditing', label: '编辑文字', run: () => setDialog('text-edit') },
  ];
  const video: Tool[] = [
    { icon: 'VideoLoop', label: '循环', run: () => panel('loop') },
    { icon: 'HD', label: '高清', run: () => panel('video-hd') },
    { icon: 'Connecting', label: '拼接', run: () => panel('stitch') },
    { icon: 'Rmbg', label: '抠图', run: () => panel('video-cutout') },
    { icon: 'Pack', label: '封装', run: () => processor('pack') },
    { icon: 'Cutting', label: '剪辑', run: () => processor('clip') },
  ];
  const tools = node.type === 'video' ? video : image;

  const toolbar: ReactElement = (
    <ButtonGroup variant="glass" size={44} aria-label="节点工具栏">
      {tools.map((t) => (
        <Button key={t.label} variant="ghost" leftIcon={t.icon} onClick={t.run}>
          {t.label}
        </Button>
      ))}
      <Divider orientation="vertical" />
      <IconButton icon="ImageToText" label={node.type === 'video' ? '视频推词' : '图推词'} onClick={() => spawnTextNode(canvasId, node)} />
      <IconButton icon="Download" label="下载" onClick={onDownload} />
      <IconButton icon="FullScreen" label="全屏" onClick={onView} />
    </ButtonGroup>
  );

  const ratioNum = ratioOf(src.ratio);
  const source = { id: node.id, media: src.media, src: src.src, ratio: ratioNum, duration: src.duration };
  const editMode = dialog === 'inpaint' ? 'inpaint' : dialog === 'remove' ? 'remove' : undefined;
  const workbench = dialog === 'expand' ? 'expand' : editMode ? 'edit' : undefined;

  return (
    <>
      {toolbar}
      {/* 扩图、重绘、元素去除：和创作页的工具弹窗一样，里面是 AI 工具页同一套舞台和参数面板 */}
      <Dialog size={800} className="tpl-tool-dlg" title={dialog === 'expand' ? '扩图' : dialog === 'inpaint' ? '重绘' : '元素去除'} open={!!workbench} onOpenChange={(v) => !v && setDialog(null)}>
        {workbench && <ToolWorkbench key={`${node.id}:${dialog}`} tool={workbench} editMode={editMode} source={source} onGenerate={(job) => submit(job, dialog!)} promptBar />}
      </Dialog>
      <CropDialog
        open={dialog === 'crop'}
        onOpenChange={(v) => !v && setDialog(null)}
        src={src.src}
        ratio={ratioNum}
        onConfirm={(rel) => {
          setDialog(null);
          void cropImage(src.src, ratioNum, rel).then((out) => spawnCropNode(canvasId, node, out));
        }}
      />
      <AnnotateDialog open={dialog === 'annotate'} onOpenChange={(v) => !v && setDialog(null)} src={src.src} ratio={ratioNum} onAddToChat={(note) => {
        // 发送：关掉弹窗看回复；添加到对话：留着接着标
        if (note.send) setDialog(null);
        onAddToChat?.([node.id], note);
      }} />
      <TextEditDialog
        open={dialog === 'text-edit'}
        onOpenChange={(v) => !v && setDialog(null)}
        src={src.src}
        ratio={ratioNum}
        onSubmit={(items) =>
          attempt(() =>
            spawnToolNode(canvasId, node, 'text-edit', {
              tool: 'text-edit',
              label: '编辑文字',
              params: { 修改: `${items.length} 处` },
              cost: TEXT_EDIT_COST,
              ratio: src.ratio,
              echo: true,
              refs: [{ type: 'image', src: src.src }],
            }),
          ).then((n) => n && setDialog(null))
        }
      />
    </>
  );
}
