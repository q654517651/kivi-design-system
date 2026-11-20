import { useRef, useState } from 'react';
import type { AttachmentItem } from '@kivi';
import { ButtonGroup, CanvasHeader, Dropdown, IconButton, MentionChip, placeholderImageSrc, toast, type CanvasItem as HeaderItem } from '@kivi';
import { insertTemplate, placeAsset, useCanvasDoc } from '../../data/canvas-doc';
import { downloadMedia } from '../../flows/files';
import { syncCanvasList, noteDuplicate } from '../../data/canvases';
import type { AgentComposerHandle, AgentComposerMessage } from '../../parts/agent-composer';
import { useDB } from '../../data/db';
import type { CanvasItem, CanvasNode } from '../../data/types';
import { MediaViewer, ViewerAuthor, ViewerSection, useLastShown } from '../../parts/media-viewer';
import { AssetInfo, CopyPrompt } from '../../parts/asset-info';
import { CanvasAgent, nodeAttachment, useAgentSelect } from './CanvasAgent';
import type { AnnotationNote } from './AnnotateDialog';

import { CanvasBoard, type CanvasBoardHandle } from './CanvasBoard';
import { HistoryPanel } from './HistoryPanel';
import { ProcessorHost } from './processor/ProcessorHost';
import { AddNodeMenu } from './menus';
import { CanvasCorner } from './ShareButton';
import { WorkflowPanel } from './WorkflowPanel';

/*
  画布页：左边画布（左上角画布切换、底部画布工具栏、左下角视图工具栏），右边 Agent 侧栏。
  新建画布在进来之前就建好了（App 里），这里只管打开。点左上角 Logo 回创作页。
*/

export interface CanvasPageProps {
  /** 打开哪块画布 */
  canvasId: string;
  /** 换了画布（画布切换、新建） */
  onCanvasChange?: (id: string) => void;
  /** 探索页技能「使用」进来：Agent 输入框带着这个技能 */
  skill?: string;
  /** 创作首页「画布」输入框里发的那句话：进来 Agent 接着发 */
  intro?: AgentComposerMessage;
  onHome?: () => void;
}

export function CanvasPage({ canvasId: id, onCanvasChange, skill, intro, onHome }: CanvasPageProps) {
  const canvases = useDB((s) => s.canvases);
  const doc = useCanvasDoc(id);
  const board = useRef<CanvasBoardHandle>(null);
  const [viewing, setViewing] = useState<{ item: CanvasItem; node: CanvasNode } | null>(null);
  const shown = useLastShown(viewing);
  const shownAsset = useDB((s) => (shown?.item.assetId ? s.assets.find((a) => a.id === shown.item.assetId && a.taskId) : undefined));
  const list: HeaderItem[] = canvases.map((c) => ({ id: c.id, name: c.name }));
  // 「添加到对话」的节点：进 Agent 输入框的附件条，按节点去重（照线上）
  const [chatAttachments, setChatAttachments] = useState<AttachmentItem[]>([]);
  const composer = useRef<AgentComposerHandle>(null);
  const addToChat = (ids: string[], note?: AnnotationNote) => {
    const add = ids.map((nid) => nodeAttachment(id, nid)).filter((a): a is AttachmentItem => !!a);
    if (!add.length) return;
    // 框选标注：「发送」直接发给 Agent（带上这张图），「添加到对话」往输入框插标注胶囊（照线上批注 token）
    if (note) {
      const img = add[0];
      if (note.send) {
        composer.current?.submit({ text: `[标注${note.index}] ${note.text}`, attachments: [img] });
        return;
      }
      composer.current?.insert(
        <MentionChip type="annotation" src={img.src} index={note.index} data-annotation={note.index} data-note={note.text} data-image={img.src}>
          {note.text}
        </MentionChip>,
      );
      toast.success('已添加到对话');
      return;
    }
    setChatAttachments((list) => [...list, ...add.filter((a) => !list.some((x) => x.id === a.id))]);
    toast.success('已添加到对话');
  };
  // 底部「工作流」面板、「历史」弹窗
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Agent 建了节点：画布选中它
  useAgentSelect(id, (ids) => board.current?.select(ids));

  return (
    <div className="tpl-cv">
      <div className="tpl-cv__main">
        <CanvasBoard key={id} ref={board} canvasId={id} onView={(item, node) => setViewing({ item, node })} onAddToChat={addToChat} />
        {/* 左上角：Logo｜工作区｜画布切换 */}
        <CanvasHeader
          className="tpl-cv__header"
          workspace="KIVI 工作区"
          canvases={list}
          onCanvasesChange={syncCanvasList}
          onDuplicate={noteDuplicate}
          value={id}
          onChange={(next) => onCanvasChange?.(next)}
          onLogoClick={onHome}
        />
        {/* 右上角：分享，再是余额和头像（11-19 用户定：和主站一样，点头像出账号菜单） */}
        <CanvasCorner canvasId={id} />
        {/* 底部正中：画布工具栏（ButtonGroup 实色 · 56）：添加（主要）、工作流、上传、历史 */}
        <ButtonGroup variant="surface" size={56} aria-label="画布工具栏" className="tpl-cv__toolbar">
          <Dropdown placement="top-start" trigger={<IconButton icon="Add" label="添加" variant="primary" />}>
            <AddNodeMenu doc={doc} onPick={(type, preset) => board.current?.addAtCenter(type, preset)} />
          </Dropdown>
          <WorkflowPanel
            open={workflowOpen}
            onOpenChange={setWorkflowOpen}
            onApply={(wf) => {
              // 照线上：整段套进一个以工作流名命名的组，选中这个组
              const ids = insertTemplate(id, wf.template, wf.name);
              // 下一帧再定位：等新节点画出来
              requestAnimationFrame(() => board.current?.focus(ids));
            }}
          >
            <IconButton icon="Template" label="工作流" selected={workflowOpen} tooltip={!workflowOpen} />
          </WorkflowPanel>
          <IconButton icon="Upload" label="上传" onClick={() => board.current?.upload()} />
          <IconButton icon="History" label="历史" onClick={() => setHistoryOpen(true)} />
        </ButtonGroup>
      </div>
      <CanvasAgent
        canvasId={id}
        skill={skill}
        onLocate={(ids) => board.current?.focus(ids)}
        intro={intro}
        attachments={chatAttachments}
        onAttachmentsChange={setChatAttachments}
        composerRef={composer}
      />

      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onApply={(asset) => {
          const nid = placeAsset(id, asset);
          requestAnimationFrame(() => board.current?.select([nid]));
        }}
      />

      <ProcessorHost canvasId={id} />

      <MediaViewer
        media={viewing && { type: viewing.node.type === 'video' ? 'video' : viewing.node.type === 'audio' ? 'audio' : 'image', src: viewing.item.src, poster: viewing.item.poster, name: viewing.node.name }}
        onClose={() => setViewing(null)}
        head={<ViewerAuthor name="KIVI" avatar={placeholderImageSrc('ip-peek', '1:1')} date="今天" />}
        actions={<IconButton icon="Download" label="下载" variant="secondary" size={36} onClick={() => viewing && void downloadMedia([{ src: viewing.item.src, name: viewing.node.name }])} />}
      >
        {/* 信息栏和创作页、资产页同一套（AssetInfo：提示词、参数，参考图跟在参数后面）；上传的素材没有任务，只放节点的提示词 */}
        {shownAsset ? (
          <AssetInfo asset={shownAsset} />
        ) : (
          shown?.node.prompt && (
            <ViewerSection title="提示词" action={<CopyPrompt text={shown.node.prompt} />}>
              <p className="tpl-viewer__prompt">{shown.node.prompt}</p>
            </ViewerSection>
          )
        )}
      </MediaViewer>
    </div>
  );
}
