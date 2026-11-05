import { forwardRef, useState, type ReactElement } from 'react';
import { IconButton } from '../button';
import { useControllable } from '../hooks';
import { Dropdown, type DropdownProps } from '../menu';
import { SkillPanel, type SkillItem, type SkillPanelProps } from './SkillPanel';

export interface SkillPickerProps
  extends Omit<DropdownProps, 'trigger' | 'children' | 'anchorPoint' | 'matchTriggerWidth' | 'closeOnSelect' | 'haspopup'>,
    Pick<SkillPanelProps, 'onRetry' | 'onCreate' | 'onImport' | 'onViewAll' | 'onDetail'> {
  /** 触发器，默认工具条上的技能图标按钮（画布 Agent）；主站 Agent 工具条传一个无底按钮 */
  trigger?: ReactElement;
  /** 技能，传给面板 */
  items?: SkillItem[];
  /** 分类，传给面板 */
  categories?: string[];
  /** 面板展开。传了就是受控 */
  open?: boolean;
  /** 非受控时一开始是否展开（模板里一进来就摆开看样子），默认收起 */
  defaultOpen?: boolean;
  /** 展开、收起时触发，参数是新的状态 */
  onOpenChange?: (open: boolean) => void;
  /** 点了一个技能：插进输入框，面板关上 */
  onPick?: (skill: SkillItem) => void;
}

/**
 * 技能按钮 + 面板（SkillPanel）：向上弹、左对齐，每次打开回到「推荐」、清空搜索（照线上）。
 * 离按钮 4（点开的浮层都是 4）。点外面、按 Esc、选中技能都会关上。ref 给包住触发器的外壳 span（和 Dropdown 一样）
 */
export const SkillPicker = forwardRef<HTMLSpanElement, SkillPickerProps>(function SkillPicker(
  { trigger, items, categories, onPick, onRetry, onCreate, onImport, onViewAll, onDetail, open: openProp, defaultOpen = false, onOpenChange, placement = 'top-start', ...rest },
  ref,
) {
  const [open, setOpenState] = useControllable(openProp, defaultOpen, onOpenChange);
  const [session, setSession] = useState(0);
  const setOpen = (next: boolean) => {
    if (next && !open) setSession((n) => n + 1);
    setOpenState(next);
  };
  return (
    <Dropdown
      ref={ref}
      open={open}
      onOpenChange={setOpen}
      placement={placement}
      haspopup="dialog"
      closeOnSelect={false}
      trigger={trigger ?? <IconButton icon="Skill" label="技能" variant="text" />}
      {...rest}
    >
      {/* 换 key 重新挂载，每次打开回到「推荐」、清空搜索；key 只在打开时递增，关闭动画期间内容不变 */}
      <SkillPanel
        key={session}
        items={items}
        categories={categories}
        onRetry={onRetry}
        onCreate={onCreate}
        onImport={onImport}
        onViewAll={onViewAll}
        onDetail={onDetail}
        onPick={(s) => {
          setOpen(false);
          onPick?.(s);
        }}
      />
    </Dropdown>
  );
});
SkillPicker.displayName = 'SkillPicker';
