import { useState } from 'react';
import { IconButton, SendButton, SkillPanel, SkillPicker } from '@kivi';
import { SKILL_CATEGORIES, SKILL_ITEMS } from '../business/skill-data';
import { TemplateFrame } from './frame';

/** Agent 输入框 + 技能按钮弹出的面板（一进来先开着）：点技能插进输入框，点外面、按 Esc 关上。只能看 */
export function SkillsTemplate() {
  const [text, setText] = useState('');
  return (
    <TemplateFrame>
      <div className="tpl-sk">
        <div className="tpl-sk__dock">
          <div className="tpl-cv__composer tpl-sk__composer">
            <textarea aria-label="和 Agent 对话" placeholder="描述任何你想要生成的内容" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="tpl-cv__tools">
              <div>
                <IconButton icon="Add" label="添加" variant="text" />
                <IconButton icon="Mdoel" label="选择模型" variant="text" />
                <SkillPicker
                  defaultOpen
                  items={SKILL_ITEMS}
                  categories={SKILL_CATEGORIES}
                  onPick={(s) => setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}/${s.title} `)}
                />
                <IconButton icon="Hand" label="手" variant="text" />
              </div>
              <SendButton disabled={!text.trim()} />
            </div>
          </div>
        </div>
      </div>
    </TemplateFrame>
  );
}

const data = { items: SKILL_ITEMS, categories: SKILL_CATEGORIES };

/** 列表区的几种状态 */
export function SkillPanelStates() {
  return (
    <div className="tpl-sk__states">
      <SkillPanel {...data} status="loading" />
      <SkillPanel {...data} status="failed" />
      <SkillPanel {...data} defaultTab="mine" items={[]} />
      <SkillPanel {...data} defaultSearch="手绘" />
    </div>
  );
}
