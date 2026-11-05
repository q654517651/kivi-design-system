import { useLayoutEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AskRecord, AttachmentStrip, Button, CanvasHeader, DropOverlay, GenModelPicker, Icon, IconButton, MediaGroup, MentionChip, MessageFeedback, PromptInput, ProcessGroup, ProcessRow, SendButton, SkillPicker, Toaster, UserMessage, toast, type AttachmentItem, type IconName, type MediaGroupItem, type MediaGroupType, type ProcessStep } from '@kivi';
import { rejectMessage, useFileDrop } from '../../kivi/hooks';
import { MiniCanvas, type CanvasNodeKey, type MiniCanvasHandle } from '../business/canvas.demos';
import { SKILL_CATEGORIES, SKILL_ITEMS } from '../business/skill-data';
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
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState(ATTACHMENTS);
  // 插进输入框的生成模型：照输入框里的「@名字」算，删了字就不算，用来判断每组选满没有
  // 输入框是 contentEditable：模型插进去是 MentionChip（data-model 记值），删了标签就不算，用来判断每组选满没有
  const input = useRef<HTMLDivElement>(null);
  const [models, setModels] = useState<string[]>([]);
  const sync = () => {
    const el = input.current;
    if (!el) return;
    setModels([...el.querySelectorAll<HTMLElement>('[data-model]')].map((c) => c.dataset.model!));
    setText((el.textContent ?? '').trim() || (el.querySelector('.kv-mention-chip') ? '@' : ''));
  };
  const insertModel = (m: { value: string; label: string; icon?: IconName }) => {
    const el = input.current;
    if (!el) return;
    const box = document.createElement('div');
    box.innerHTML = renderToStaticMarkup(
      <MentionChip type="model" icon={m.icon} data-model={m.value}>
        {m.label}
      </MentionChip>,
    );
    el.append(...box.childNodes, document.createTextNode('\u00a0'));
    el.focus();
    sync();
  };
  const stream = useRef<HTMLDivElement>(null);

  // 把文件拖到输入框上：盖一层「松手上传」，不收的类型提示不支持。模板只能看，放下只弹一条提示
  const { dragging, rejected, bind } = useFileDrop({
    accept: 'image/*,video/*,audio/*',
    onFiles: (files) => toast.success(`已添加 ${files.length} 个文件`),
    onReject: (_, reason) => toast.error(rejectMessage(reason)),
  });

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

      <div className="tpl-cv__composer" {...bind}>
        {attachments.length > 0 && <AttachmentStrip items={attachments} onRemove={(id) => setAttachments((list) => list.filter((a) => a.id !== id))} />}
        <PromptInput ref={input} className="tpl-cv__input" placeholder="描述任何你想要生成的内容" onInput={sync} />
        <div className="tpl-cv__tools">
          <div>
            <IconButton icon="Add" label="添加" variant="text" />
            <GenModelPicker
              picked={models}
              onPick={insertModel}
            />
            <SkillPicker items={SKILL_ITEMS} categories={SKILL_CATEGORIES} onPick={(sk) => setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}/${sk.title} `)} />
            <IconButton icon="Hand" label="手" variant="text" />
            {/* 切换对话用的大模型（GPT、Claude、千问…）：内部测试用的隐藏功能，图标是当前模型的厂商 Logo */}
            <IconButton icon="Openai" label="切换对话模型（内部测试）" variant="text" />
          </div>
          {/* 只能看：有字也发不出去 */}
          <SendButton disabled={!text.trim()} />
        </div>
        <DropOverlay active={dragging} rejected={rejected} />
      </div>
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
