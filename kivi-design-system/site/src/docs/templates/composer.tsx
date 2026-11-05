import { useRef, useState, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AttachmentStrip, DropOverlay, GenModelPicker, IconButton, MentionChip, PromptInput, SendButton, SkillPicker, toast, type AttachmentItem, type IconName } from '@kivi';
import { rejectMessage, useFileDrop } from '../../kivi/hooks';
import { SKILL_CATEGORIES, SKILL_ITEMS } from '../business/skill-data';

// 页面模板里 Agent 输入框的演示：画布模板、技能面板模板共用这一份。只能看：有字也发不出去

export interface AgentComposerProps {
  /** 一开始已经添加的附件，不传就没有附件条 */
  attachments?: AttachmentItem[];
  /** 技能面板一进来就开着（技能面板模板用） */
  skillOpen?: boolean;
  className?: string;
}

/** Agent 输入框：附件条、PromptInput、工具条（添加 / 模型偏好 / 技能 / 手 / 切换对话模型）、发送。拖文件进来盖一层「松手上传」 */
export function AgentComposer({ attachments: initial = [], skillOpen, className }: AgentComposerProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState(initial);
  // 输入框是 contentEditable：模型、技能插进去是 MentionChip（data-model 记值），删了标签就不算，用来判断每组选满没有
  const input = useRef<HTMLDivElement>(null);
  const [models, setModels] = useState<string[]>([]);
  const sync = () => {
    const el = input.current;
    if (!el) return;
    setModels([...el.querySelectorAll<HTMLElement>('[data-model]')].map((c) => c.dataset.model!));
    setText((el.textContent ?? '').trim() || (el.querySelector('.kv-mention-chip') ? '@' : ''));
  };
  const insertChip = (chip: ReactElement) => {
    const el = input.current;
    if (!el) return;
    const box = document.createElement('div');
    box.innerHTML = renderToStaticMarkup(chip);
    el.append(...box.childNodes, document.createTextNode(' '));
    el.focus();
    sync();
  };
  const insertModel = (m: { value: string; label: string; icon?: IconName }) =>
    insertChip(
      <MentionChip type="model" icon={m.icon} data-model={m.value}>
        {m.label}
      </MentionChip>,
    );

  // 把文件拖到输入框上：盖一层「松手上传」，不收的类型提示不支持。模板只能看，放下只弹一条提示
  const { dragging, rejected, bind } = useFileDrop({
    accept: 'image/*,video/*,audio/*',
    onFiles: (files) => toast.success(`已添加 ${files.length} 个文件`),
    onReject: (_, reason) => toast.error(rejectMessage(reason)),
  });

  return (
    <div className={className ? `tpl-cv__composer ${className}` : 'tpl-cv__composer'} {...bind}>
      {attachments.length > 0 && <AttachmentStrip items={attachments} onRemove={(id) => setAttachments((list) => list.filter((a) => a.id !== id))} />}
      <PromptInput ref={input} className="tpl-cv__input" placeholder="描述任何你想要生成的内容" onInput={sync} />
      <div className="tpl-cv__tools">
        <div>
          <IconButton icon="Add" label="添加" variant="text" />
          <GenModelPicker picked={models} onPick={insertModel} />
          <SkillPicker
            defaultOpen={skillOpen}
            items={SKILL_ITEMS}
            categories={SKILL_CATEGORIES}
            onPick={(sk) =>
              insertChip(
                <MentionChip type="skill" data-skill={sk.title}>
                  {sk.title}
                </MentionChip>,
              )
            }
          />
          <IconButton icon="Hand" label="手" variant="text" />
          {/* 切换对话用的大模型（GPT、Claude、千问…）：内部测试用的隐藏功能，图标是当前模型的厂商 Logo */}
          <IconButton icon="Openai" label="切换对话模型（内部测试）" variant="text" />
        </div>
        {/* 只能看：有字也发不出去 */}
        <SendButton disabled={!text.trim()} />
      </div>
      <DropOverlay active={dragging} rejected={rejected} />
    </div>
  );
}
