import { useLayoutEffect, useRef } from 'react';
import { AskRecord, Button, CanvasHeader, Icon, IconButton, MediaGroup, MessageFeedback, ProcessGroup, Toaster, UserMessage, type AttachmentItem, type MediaGroupItem, type MediaGroupType, type ProcessStep } from '@kivi';
import { MiniCanvas, type CanvasNodeKey, type MiniCanvasHandle } from '../business/canvas.demos';
import { AgentComposer } from './composer';
import { TemplateFrame } from './frame';

// 页面模板 · 画布：左边画布，右边 Agent 侧栏。对话里点结果缩略图，画布平移到那个节点并选中。
// 只能看：画布里点生成、上传不动，Agent 输入框发不出去

const IMG = './placeholders/';

const STEPS: ProcessStep[] = [
  { icon: 'Skill', action: '加载技能', object: '画布操作规范' },
  { icon: 'ScanEye', action: '查看画布' },
  { icon: 'ScanEye', action: '查看节点内容', object: '素材 · 图片' },
  { icon: 'UseCanvas', action: '节点连线', object: '文字节点 → 图片节点' },
];

/** 生成结果：缩略图点了定位到画布里的节点 */
const RESULTS: { node: CanvasNodeKey; type: MediaGroupType; items: MediaGroupItem[] }[] = [
  {
    node: 'image',
    type: 'image',
    items: [
      { id: 'i1', src: `${IMG}kiwi-light-1x1.webp`, ratio: '1:1', name: '主视觉 1' },
      { id: 'i2', src: `${IMG}kivi-future-1x1.webp`, ratio: '1:1', name: '主视觉 2' },
      { id: 'i3', src: `${IMG}kiwi-glass-1x1.webp`, ratio: '1:1', name: '主视觉 3' },
      { id: 'i4', src: `${IMG}ip-kiwi-pile-1x1.webp`, ratio: '1:1', name: '主视觉 4' },
    ],
  },
  { node: 'video', type: 'video', items: [{ id: 'v1', src: `${IMG}kivi-future-16x9.webp`, ratio: '16:9', name: '短视频' }] },
];

/** 输入框里已经添加的附件 */
const ATTACHMENTS: AttachmentItem[] = [
  { id: 'a1', type: 'image', name: '图片1', src: `${IMG}kiwi-light-1x1.webp` },
  { id: 'a2', type: 'video', name: '产品演示.mp4', src: `${IMG}kivi-future-1x1.webp`, duration: '0:12' },
  { id: 'a3', type: 'file', name: '活动策划案.pdf', ext: 'PDF' },
];

function AgentPanel({ onLocate }: { onLocate: (key: CanvasNodeKey) => void }) {
  const stream = useRef<HTMLDivElement>(null);

  // 进来停在最新一条
  useLayoutEffect(() => {
    const el = stream.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  return (
    <aside className="tpl-cv__agent" aria-label="Agent">
      <div className="tpl-cv__head">
        <span className="tpl-cv__title">
          猕猴桃饮料短视频
          <Icon name="DownArrowSmall" />
        </span>
        <span style={{ display: 'flex', gap: 4 }}>
          <IconButton icon="Add" label="新对话" variant="text" />
          <IconButton icon="Fold" label="收起" variant="text" />
        </span>
      </div>

      <div ref={stream} className="tpl-cv__stream">
        <UserMessage>帮我做一条猕猴桃饮料的短视频：先出一张主视觉，再做成 16:9 的视频</UserMessage>
        <div className="tpl-text">好的，我先看看画布上已有的素材。</div>
        <ProcessGroup steps={STEPS} />
        <div className="tpl-text">画布上已有文案和参考图，我把文案连到图片节点，现在发起生成审批。</div>
        <AskRecord items={[{ question: '是否生成节点「图片节点」「视频节点」？', answer: '批准生成' }]} />
        {RESULTS.map((r) => (
          <MediaGroup key={r.node} type={r.type} items={r.items} onItemClick={() => onLocate(r.node)} />
        ))}
        <div className="tpl-text">主视觉和视频都生成好了，点开结果里的图能在画布里定位到节点。需要再出几个版本吗？</div>
        <div className="tpl-row">
          <Button variant="light">再出 3 版</Button>
          <Button variant="light">换个风格</Button>
        </div>
        <MessageFeedback text="主视觉和视频都生成好了。" traceId="trace-8f3a21" />
      </div>

      <AgentComposer attachments={ATTACHMENTS} />
    </aside>
  );
}

/** 画布 + Agent 侧栏：只能看 */
export function CanvasTemplate() {
  const canvas = useRef<MiniCanvasHandle>(null);
  return (
    <TemplateFrame>
      <Toaster />
      <div className="tpl-cv">
        <div className="tpl-cv__main">
          <MiniCanvas ref={canvas} chrome={false} fake={false} phases={{ video: 'done' }} className="tpl-cv__canvas" />
          {/* 左上角：Logo｜工作区｜画布切换 */}
          <CanvasHeader
            className="tpl-cv__header"
            workspace="618 大促活动"
            defaultCanvases={[
              { id: 'c1', name: '头图' },
              { id: 'c2', name: 'Banner' },
              { id: 'c3', name: '画布 3' },
            ]}
          />
        </div>
        <AgentPanel onLocate={(key) => canvas.current?.focus(key)} />
      </div>
    </TemplateFrame>
  );
}
