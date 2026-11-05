import { forwardRef, type ReactNode } from 'react';
import { useControllable } from '../hooks';
import { Dropdown, type DropdownPlacement, type DropdownProps } from '../menu';
import { Icon } from '../Icon';
import { cx } from '../utils';
import '../selection/selection.css';
import './generation.css';
import { ParamPanel } from './ParamPanel';

export interface ParamPickerProps
  extends Omit<DropdownProps, 'trigger' | 'children' | 'matchTriggerWidth' | 'anchorPoint' | 'closeOnSelect' | 'haspopup'> {
  /** 触发器上的参数摘要，比如「720P · 16:9 · 8s」，跟着面板里的选择变 */
  summary: ReactNode;
  /** 面板里的内容：一块块 ParamField */
  children?: ReactNode;
  /** 面板出现的位置，默认 bottom-start（下方、左对齐），放不下自己翻到上方。和下拉选择一样 */
  placement?: DropdownPlacement;
  /** 面板展开。传了就是受控 */
  open?: boolean;
  /** 非受控时一开始是否展开，默认收起 */
  defaultOpen?: boolean;
  /** 展开、收起时触发，参数是新的状态 */
  onOpenChange?: (open: boolean) => void;
  /** 触发器的说明，读屏用，默认「参数」 */
  'aria-label'?: string;
}

/**
 * 参数选择：长得和无底的 Select 一样，点开的是参数面板（ParamPanel），不是列表。
 * 画布生成面板和主站输入框共用，比例、时长、分辨率、生成音频这类放在一起调的参数都用它。
 * ref 给包住触发器的外壳 span（和 Dropdown 一样）。
 */
export const ParamPicker = forwardRef<HTMLSpanElement, ParamPickerProps>(function ParamPicker(
  {
    summary,
    children,
    placement,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    'aria-label': ariaLabel = '参数',
    className,
    ...rest
  },
  ref,
) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  return (
    <Dropdown
      ref={ref}
      open={open}
      onOpenChange={setOpen}
      placement={placement}
      closeOnSelect={false}
      haspopup="dialog"
      className={cx('kv-select__wrap kv-select__wrap--plain', className)}
      trigger={
        <button type="button" className="kv-select kv-select--plain" aria-label={ariaLabel}>
          <span className="kv-select__text kv-param-picker__summary">{summary}</span>
          <Icon name={open ? 'UpArrowSmall' : 'DownArrowSmall'} />
        </button>
      }
      {...rest}
    >
      <ParamPanel>{children}</ParamPanel>
    </Dropdown>
  );
});
ParamPicker.displayName = 'ParamPicker';
