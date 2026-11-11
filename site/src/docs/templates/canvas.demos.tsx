import { useLayoutEffect, useRef } from 'react';
import { AskRecord, Button, ButtonGroup, CanvasHeader, Dropdown, Menu, MenuItem, MenuLabel, Icon, IconButton, MediaGroup, MessageFeedback, ProcessGroup, Toaster, UserMessage, type AttachmentItem, type MediaGroupItem, type MediaGroupType, type ProcessStep } from '@kivi';
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

/** 底部「添加」弹出的节点，照线上画布的添加节点面板（node-list）：上传在工具栏上单独有，这里不放 */
const ADD_NODES = [
  { icon: 'Text', label: '文本生成' },
  { icon: 'ImageGeneration', label: '图片生成' },
  { icon: 'VideoGeneration', label: '视频生成' },
  { icon: 'Audio', label: '音频生成' },
  { icon: 'Cutting', label: '视频剪辑' },
] as const;

/** 输入框里已经添加的附件 */
const ATTACHMENTS: AttachmentItem[] = [
  { id: 'a1', type: 'image', name: '图片1', src: `${IMG}kiwi-light-1x1.webp` },
  { id: 'a2', type: 'video', name: '产品演示.mp4', src: `${IMG}kivi-future-1x1.webp`, duration: '0:12', video: './placeholders/video/kivi-demo-16x9.mp4' },
  { id: 'a3', type: 'file', name: '活动策划案.pdf', ext: 'PDF' },
];

/** skill：新建的画布、对话是空的，输入框里带着这个技能的引用（探索页技能「使用」进来的） */
function AgentPanel({ onLocate, skill }: { onLocate: (key: CanvasNodeKey) => void; skill?: string }) {
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
          {skill ? '新对话' : '猕猴桃饮料短视频'}
          <Icon name="DownArrowSmall" />
        </span>
        <span style={{ display: 'flex', gap: 4 }}>
          <IconButton icon="Add" label="新对话" variant="text" />
          <IconButton icon="Fold" label="收起" variant="text" />
        </span>
      </div>

      <div ref={stream} className="tpl-cv__stream">
        {!skill && (
          <>
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
          </>
        )}
      </div>

      <AgentComposer attachments={skill ? undefined : ATTACHMENTS} skill={skill} />
    </aside>
  );
}

/**
 * 画布页：画布 + Agent 侧栏，只能看。点左上角 Logo 回首页（UI 页面预览里回创作页）。
 * skill：探索页技能「使用」进来，新建一个画布（画布名「未命名画布」、对话是空的），Agent 输入框里带着技能引用。小画布还是那几个演示节点
 */
export function CanvasPage({ onHome, skill }: { onHome?: () => void; skill?: string }) {
  const canvas = useRef<MiniCanvasHandle>(null);
  return (
    <div className="tpl-cv">
      <div className="tpl-cv__main">
        <MiniCanvas ref={canvas} chrome={false} fake={false} viewBar phases={{ video: 'done' }} className="tpl-cv__canvas" />
        {/* 左上角：Logo｜工作区｜画布切换 */}
        <CanvasHeader
          className="tpl-cv__header"
          workspace="618 大促活动"
          defaultCanvases={[
            ...(skill ? [{ id: 'new', name: '未命名画布' }] : []),
            { id: 'c1', name: '头图' },
            { id: 'c2', name: 'Banner' },
            { id: 'c3', name: '画布 3' },
          ]}
          onLogoClick={onHome}
        />
        {/* 底部正中：画布工具栏（ButtonGroup 实色 · 56），左边添加（主要），右边工作流、上传、历史。
            点添加往上弹添加节点菜单；只能看，点了节点不真的加。工作流、上传、历史点了没反应 */}
        <ButtonGroup variant="surface" size={56} aria-label="画布工具栏" className="tpl-cv__toolbar">
          <Dropdown placement="top-start" trigger={<IconButton icon="Add" label="添加" variant="primary" />}>
            <Menu width={200}>
              <MenuLabel>添加节点</MenuLabel>
              {ADD_NODES.map((n) => (
                <MenuItem key={n.label} icon={n.icon}>
                  {n.label}
                </MenuItem>
              ))}
            </Menu>
          </Dropdown>
          <IconButton icon="Template" label="工作流" />
          <IconButton icon="Upload" label="上传" />
          <IconButton icon="History" label="历史" />
        </ButtonGroup>
      </div>
      <AgentPanel onLocate={(key) => canvas.current?.focus(key)} skill={skill} />
    </div>
  );
}

/** 画布模板：只能看，右上「新 Tab 打开」开 UI 页面预览的画布页 */
export function CanvasTemplate() {
  return (
    <TemplateFrame href="/app/canvas">
      <Toaster />
      <CanvasPage />
    </TemplateFrame>
  );
}
