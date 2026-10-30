import { forwardRef, type HTMLAttributes } from 'react';
import { Switch } from '../selection/Switch';
import { cx } from '../utils';
import './prompt-box.css';

export type ToolbarDividerProps = HTMLAttributes<HTMLSpanElement>;

/** 工具条里的竖线：1 × 16，白 12%。把参数组和单独的开关隔开，比如样片模式前面 */
export const ToolbarDivider = forwardRef<HTMLSpanElement, ToolbarDividerProps>(function ToolbarDivider({ className, ...rest }, ref) {
  return <span ref={ref} role="separator" aria-orientation="vertical" className={cx('kv-toolbar-divider', className)} {...rest} />;
});
ToolbarDivider.displayName = 'ToolbarDivider';

export interface ToolbarSwitchProps extends Omit<HTMLAttributes<HTMLLabelElement>, 'onChange' | 'children'> {
  /** 开关的文字，比如「样片模式」 */
  label: string;
  /** 开 / 关。传了就是受控 */
  checked?: boolean;
  /** 非受控时的初始值，默认关 */
  defaultChecked?: boolean;
  /** 切换时触发，参数是切换后的值 */
  onChange?: (checked: boolean) => void;
  /** 禁用 */
  disabled?: boolean;
}

/** 工具条里的开关：13 号字加 Switch，间距 8，点文字也能切换。Figma「模板 · 主站」页「样片模式」 */
export const ToolbarSwitch = forwardRef<HTMLLabelElement, ToolbarSwitchProps>(function ToolbarSwitch(
  { label, checked, defaultChecked, onChange, disabled, className, ...rest },
  ref,
) {
  return (
    <label ref={ref} className={cx('kv-toolbar-switch', className)} {...rest}>
      <span>{label}</span>
      <Switch aria-label={label} checked={checked} defaultChecked={defaultChecked} onChange={onChange} disabled={disabled} />
    </label>
  );
});
ToolbarSwitch.displayName = 'ToolbarSwitch';
