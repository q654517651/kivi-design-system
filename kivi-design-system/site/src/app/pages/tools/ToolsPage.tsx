import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DropOverlay, UPLOAD_SPECS, toast } from '@kivi';
import { matchAccept, rejectMessage, useFileDrop } from '@kivi/hooks';
import { removeTask, submitTask } from '../../data/tasks';
import { uid } from '../../data/store';
import { TOOLS, toolOf, type ToolId } from '../../data/tools';
import { confirmDelete } from '../../flows/delete';
import { attempt } from '../../flows/errors';
import { ToolWorkbench, checkToolFile, loadToolFile, toolTaskInput, type Source, type ToolJob } from '../../parts/tool-workbench';
import { useToolHistory, type HistoryItem } from './history';
import { ToolsHistory } from './ToolsHistory';
import { ToolsRail } from './ToolsRail';
import { ToolsViewer } from './ToolsViewer';
import { useToolResultToasts } from './useToolResultToasts';

/*
  AI 工具页：左边切工具（图片、视频不分开），中间是舞台，右边是历史。
  每个工具各管各的：自己的原图、舞台（扩图框、涂抹）、提示词，切走再切回来还在。
  舞台只用来提交任务，右边只展示历史（11-19 用户定）：提交了还能接着改、接着提交，生成中、结果、失败都只在历史里，成功了也不动舞台；
  历史放所有工具生成的结果（上传的原图不进），点了看大图；结果不会自己回到舞台，要用的话右键「加入当前工具」，换掉当前工具的原图。
  生成走 submitTask（假任务，到点出结果），历史就是全站任务里工具页的那些。讨论和待定记在 page-notes/ai-tools.md。
*/

/** account：右栏顶上的余额和头像（主站外壳传进来） */
export function ToolsPage({ account }: { account?: ReactNode }) {
  const [tool, setTool] = useState<ToolId>('expand');
  const media = toolOf(tool).media;
  // 每个工具一张原图，切走再切回来还在（页面状态，不进 db）
  const [sources, setSources] = useState<Partial<Record<ToolId, Source>>>({});
  const history = useToolHistory();
  useToolResultToasts();

  // 上传：点按钮、拖进来、粘贴都走这里，放进当前工具。只收当前工具那一类（图片工具收图、视频工具收视频），
  // 类型不对提示格式不支持、不收（11-19 用户定，原来是跳到那一类的第一个工具）。
  // 视频要等一会儿（假上传），这时舞台出「视频上传中...」，传完才能生成；图片直接放进来
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<Partial<Record<ToolId, boolean>>>({});
  const accept = media === 'image' ? 'image/*' : 'video/*';
  const typeMessage = rejectMessage('type', UPLOAD_SPECS.tools[media]);
  const take = async (f: File) => {
    if (!matchAccept(f, accept)) {
      toast.error(typeMessage);
      return;
    }
    const ok = await checkToolFile(f);
    if (!ok) return;
    const target = tool;
    setUploading((u) => ({ ...u, [target]: true }));
    try {
      const r = await loadToolFile(ok);
      if (!r) return;
      setSources((s) => ({ ...s, [target]: { id: uid('v'), ...r } }));
    } finally {
      setUploading((u) => ({ ...u, [target]: false }));
    }
  };
  // 视频拼接两个位各自收文件，页面这层不接（11-19 用户定：原来视频1 没传时页面这层也接，拖进来出两套浮层）
  const { dragging, rejected, bind } = useFileDrop({
    accept,
    multiple: false,
    disabled: tool === 'stitch',
    onFiles: ([f]) => void take(f),
    onReject: (_, reason) => toast.error(reason === 'type' ? typeMessage : rejectMessage(reason)),
  });
  // 粘贴上传（照线上工具页）：页面上 ⌘V 粘贴图片、视频，只取第一个；焦点在输入框里（提示词）时不管，照常粘文字
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, [contenteditable="true"], [contenteditable=""]')) return;
      const file = e.clipboardData?.files[0];
      if (!file || !(file.type.startsWith('image') || file.type.startsWith('video'))) return;
      e.preventDefault();
      void take(file);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  });

  // 生成：舞台盖生成中的样子，参数照常能改、能再提交（不限并发），结果排在历史最上面
  const generate = (job: ToolJob) => {
    // 返回请求的 Promise：等它的时候生成按钮转圈
    return attempt(() => submitTask(toolTaskInput(job, { page: 'tools' })));
  };
  const removeSource = (id: ToolId) => {
    setSources((s) => ({ ...s, [id]: undefined }));
  };

  const [previewId, setPreviewId] = useState<string | null>(null);
  // 右键「加入当前工具」：换掉当前工具的原图，不切工具、不动别的（11-19 用户定）
  const useInTool = (r: HistoryItem) => setSources((s) => ({ ...s, [tool]: { id: uid('v'), media: r.media, src: r.src, ratio: r.ratio } }));

  return (
    <div className="tpl-at" {...bind}>
      <ToolsRail tool={tool} onChange={setTool} />

      <div className="tpl-at__main">
        {TOOLS.map((t) => (
          <ToolWorkbench
            key={t.id}
            tool={t.id}
            hidden={t.id !== tool}
            source={sources[t.id] ?? null}
            onUpload={() => fileRef.current?.click()}
            onRemove={() => removeSource(t.id)}
            onFile={(f) => void take(f)}
            onGenerate={generate}
            promptBar
            floating
            runtime={{ uploading: !!uploading[t.id] }}
          />
        ))}
        <DropOverlay active={dragging} rejected={rejected} />
        <input
          ref={fileRef}
          type="file"
          hidden
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void take(f);
            e.target.value = '';
          }}
        />
      </div>

      <ToolsHistory
        account={account}
        items={history}
        media={media}
        onPreview={(r) => setPreviewId(r.id)}
        onUseInTool={useInTool}
        onRemove={(r) => void confirmDelete(() => removeTask(r.id))}
      />

      <ToolsViewer items={history.filter((r) => r.status === 'done')} id={previewId} onChange={setPreviewId} />
    </div>
  );
}
