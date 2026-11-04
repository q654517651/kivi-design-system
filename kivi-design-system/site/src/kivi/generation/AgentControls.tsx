import { forwardRef } from 'react';
import { Button } from '../button';
import { GenModelPicker, type GenModelPickerProps } from './GenModelPicker';
import { AgentModeSelect } from './GenSelects';
import { SkillPicker, type SkillPickerProps } from './SkillPicker';

export interface AgentControlsProps extends Omit<GenModelPickerProps, 'trigger'> {
  /** 技能面板里的技能 */
  skills?: SkillPickerProps['items'];
  /** 技能面板里的分类 */
  skillCategories?: SkillPickerProps['categories'];
  /** 点了一个技能 */
  onPickSkill?: SkillPickerProps['onPick'];
}

/**
 * 切到 Agent 时任务类型后面的那一组：模型、技能、模式。
 * 返回一串并排的控件，没有自己的外壳：ref 和其余属性给第一个，也就是选择模型。
 */
export const AgentControls = forwardRef<HTMLSpanElement, AgentControlsProps>(function AgentControls(
  { skills, skillCategories, onPickSkill, ...rest },
  ref,
) {
  return (
    <>
      <GenModelPicker ref={ref} trigger={<Button variant="text" leftIcon="Mdoel" rightIcon="DownArrowSmall">模型</Button>} {...rest} />
      <SkillPicker items={skills} categories={skillCategories} onPick={onPickSkill} trigger={<Button variant="text" leftIcon="Skill" rightIcon="DownArrowSmall">技能</Button>} />
      <AgentModeSelect />
    </>
  );
});
AgentControls.displayName = 'AgentControls';
