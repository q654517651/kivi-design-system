import { useLayoutEffect, useRef, useState } from 'react';
import { AskRecord, Button, DropOverlay, Icon, IconButton, MediaStack, ProcessGroup, ProcessRow, SendButton, Toaster, UserMessage, toast, type ProcessStep } from '@kivi';
import { rejectMessage, useFileDrop } from '../../kivi/hooks';
import { MiniCanvas, type CanvasNodeKey, type MiniCanvasHandle } from '../business/canvas.demos';
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
const RESULTS: { node: CanvasNodeKey; icon: 'ImageGeneration' | 'VideoGeneration'; text: string; src: string }[] = [
  { node: 'image', icon: 'ImageGeneration', text: '图片已生成 × 1', src: `${IMG}kiwi-light-1x1.webp` },
  { node: 'video', icon: 'VideoGeneration', text: '视频已生成 × 1', src: `${IMG}kivi-future-1x1.webp` },
];

function AgentPanel({ onLocate }: { onLocate: (key: CanvasNodeKey) => void }) {
  const [text, setText] = useState('');
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
          <div key={r.node} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ProcessRow icon={r.icon} action={r.text} arrow={false} />
            <MediaStack className="tpl-cv__locate" src={r.src} aria-label={`在画布里定位：${r.text}`} onClick={() => onLocate(r.node)} />
          </div>
        ))}
        <div className="tpl-text">主视觉和视频都生成好了，点上面的图能在画布里定位到节点。需要再出几个版本吗？</div>
        <div className="tpl-row">
          <Button>再出 3 版</Button>
          <Button>换个风格</Button>
        </div>
        <div className="tpl-row" style={{ gap: 0 }}>
          <IconButton icon="Copy" label="复制" variant="light" />
          <IconButton icon="CopyTraceID" label="复制 TraceID" variant="light" />
          <IconButton icon="ThumbsUp" label="赞" variant="light" />
          <IconButton icon="ThumbsDown" label="踩" variant="light" />
        </div>
      </div>

      <div className="tpl-cv__composer" {...bind}>
        <textarea aria-label="和 Agent 对话" placeholder="描述任何你想要生成的内容" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="tpl-cv__tools">
          <div>
            <IconButton icon="Add" label="添加" variant="text" />
            <IconButton icon="Mdoel" label="模型偏好" variant="text" />
            <IconButton icon="Skill" label="技能" variant="text" />
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
        <MiniCanvas ref={canvas} chrome={false} fake={false} phases={{ video: 'done' }} className="tpl-cv__canvas" />
        <AgentPanel onLocate={(key) => canvas.current?.focus(key)} />
      </div>
    </TemplateFrame>
  );
}
