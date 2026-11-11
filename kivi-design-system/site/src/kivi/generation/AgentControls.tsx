import { forwardRef } from 'react';
import { Select } from '../selection';
import { GenModelPicker, type GenModelPickerProps } from './GenModelPicker';
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
 * 切到 Agent 时任务类型后面的那一组：模型、技能（11-10 用户定：主站生成里没有「手动模式 / 自动生成」了）。
 * 返回一串并排的控件，没有自己的外壳：`placement` 给两个都用（默认往下，放不下各自翻）；ref 和其余属性给第一个，也就是选择模型。
 */
export const AgentControls = forwardRef<HTMLSpanElement, AgentControlsProps>(function AgentControls(
  { skills, skillCategories, onPickSkill, placement, ...rest },
  ref,
) {
  return (
    <>
      <GenModelPicker ref={ref} trigger={<Select variant="plain" leftIcon="Mdoel" placeholder="模型" aria-label="选择模型" />} placement={placement} {...rest} />
      <SkillPicker placement={placement} items={skills} categories={skillCategories} onPick={onPickSkill} trigger={<Select variant="plain" leftIcon="Skill" placeholder="技能" aria-label="技能" />} />
    </>
  );
});
AgentControls.displayName = 'AgentControls';
