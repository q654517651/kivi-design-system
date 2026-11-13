import { ScrollArea, SkillPanel } from '@kivi';
import { SKILL_CATEGORIES, SKILL_ITEMS } from '../business/skill-data';
import { AgentComposer } from './composer';
import { TemplateFrame } from './frame';

/** Agent 输入框 + 技能按钮弹出的面板（一进来先开着）：点技能在输入框里插技能胶囊，点外面、按 Esc 关上。只能看 */
export function SkillsTemplate() {
  return (
    <TemplateFrame>
      <ScrollArea className="tpl-sk">
       <div className="tpl-sk__stage">
        <div className="tpl-sk__dock">
          <AgentComposer className="tpl-sk__composer" skillOpen />
        </div>
       </div>
      </ScrollArea>
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
